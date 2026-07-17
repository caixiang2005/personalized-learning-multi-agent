import logging
import random
import smtplib
from email.header import Header
from email.mime.text import MIMEText
from email.utils import formataddr
from enum import Enum

logger = logging.getLogger(__name__)

from email_validator import EmailNotValidError, validate_email
from redis.exceptions import ConnectionError as RedisConnectionError
from redis.exceptions import RedisError, TimeoutError as RedisTimeoutError

from config import get_settings
from error.logger import capture_exception, log_error
from utils.redis import get_redis_client, is_redis_available

_REDIS_UNAVAILABLE = {
    "code": 503,
    "msg": "Redis 未连接，验证码功能暂不可用",
    "data": {},
}


class CodePurpose(str, Enum):
    REGISTER = "register"
    LOGIN = "login"
    RESET_PASSWORD = "reset"


_PURPOSE_META: dict[CodePurpose, tuple[str, str]] = {
    CodePurpose.REGISTER: (
        "注册验证码",
        "你的注册验证码：{code}\n{expire} 秒内有效，请勿外泄。",
    ),
    CodePurpose.LOGIN: (
        "登录验证码",
        "你的登录验证码：{code}\n{expire} 秒内有效，请勿外泄。",
    ),
    CodePurpose.RESET_PASSWORD: (
        "重置密码验证码",
        "你的重置密码验证码：{code}\n{expire} 秒内有效，请勿外泄。",
    ),
}

_SUCCESS_MSG: dict[CodePurpose, str] = {
    CodePurpose.REGISTER: "注册验证码发送成功",
    CodePurpose.LOGIN: "登陆验证码发送成功",
    CodePurpose.RESET_PASSWORD: "重置密码验证码发送成功",
}


def _code_key(email: str, purpose: CodePurpose) -> str:
    return f"{purpose.value}:code:{email}"


def _sent_key(email: str, purpose: CodePurpose) -> str:
    return f"{purpose.value}:sent:{email}"


def is_valid_email(email: str) -> bool:
    try:
        validate_email(email, check_deliverability=False)
        return True
    except EmailNotValidError:
        return False


def _can_resend(email: str, purpose: CodePurpose) -> bool:
    client = get_redis_client()
    if client is None:
        return True
    return client.exists(_sent_key(email, purpose)) == 0


def generate_code(length: int | None = None) -> str:
    settings = get_settings()
    v = settings.verification
    n = length or v["code_length"]
    return "".join(str(random.randint(0, 9)) for _ in range(n))


def _send_smtp(to_email: str, code: str, purpose: CodePurpose) -> bool:
    settings = get_settings()
    v = settings.verification

    host = settings.smtp_host()
    port = settings.smtp_port()
    use_ssl = settings.smtp_use_ssl()
    username = settings.smtp_username()
    password = settings.smtp_password()
    from_address = settings.mail_from_address()
    from_name = settings.mail_from_name()

    if not all([host, port, username, password, from_address]):
        log_error(
            error_type="SMTPConfigError",
            message="SMTP 配置不完整，无法发送验证码邮件",
            session_id=to_email,
        )
        return False

    subject, body_tpl = _PURPOSE_META[purpose]
    body = body_tpl.format(code=code, expire=v["expire_seconds"])
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = str(Header(subject, "utf-8"))
    if from_name:
        msg["From"] = formataddr((str(Header(from_name, "utf-8")), from_address))
    else:
        msg["From"] = from_address
    msg["To"] = to_email

    try:
        if use_ssl:
            with smtplib.SMTP_SSL(host, port, timeout=15) as smtp:
                smtp.login(username, password)
                smtp.sendmail(from_address, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=15) as smtp:
                smtp.starttls()
                smtp.login(username, password)
                smtp.sendmail(from_address, [to_email], msg.as_string())
        return True
    except smtplib.SMTPException as exc:
        logger.error("SMTP 发送失败: %s", exc)
        capture_exception(exc, session_id=to_email, context=f"SMTP send {purpose.value}")
        return False
    except OSError as exc:
        logger.error("SMTP 网络错误: %s", exc)
        capture_exception(exc, session_id=to_email, context=f"SMTP network {purpose.value}")
        return False


def _save_code(email: str, code: str, purpose: CodePurpose) -> tuple[bool, str]:
    """写入验证码。成功返回 (True, '')，失败返回 (False, 用户可见原因)。"""
    client = get_redis_client()
    if client is None:
        log_error(
            error_type="RedisError",
            message="验证码写入失败：Redis 不可用",
            session_id=email,
        )
        return False, "验证码保存失败：Redis 未连接"
    expire_seconds = get_settings().verification["expire_seconds"]
    resend_seconds = get_settings().verification["resend_interval_seconds"]
    try:
        pipe = client.pipeline()
        pipe.set(_code_key(email, purpose), code, ex=expire_seconds)
        pipe.set(_sent_key(email, purpose), "1", ex=resend_seconds)
        pipe.execute()
        return True, ""
    except RedisError as exc:
        # 含 ReadOnlyError：连到了只读副本/只读实例时 SET 会抛此异常
        capture_exception(exc, session_id=email, context="Redis save_code")
        err = str(exc).lower()
        if "readonly" in err or type(exc).__name__ == "ReadOnlyError":
            return False, "验证码保存失败：Redis 为只读，请改用可写主节点"
        return False, "验证码保存失败，请检查 Redis 连接"
    except OSError as exc:
        capture_exception(exc, session_id=email, context="Redis save_code")
        return False, "验证码保存失败，请检查 Redis 连接"


def verify_verification_code(email: str, code: str, purpose: CodePurpose) -> bool:
    client = get_redis_client()
    if client is None:
        log_error(
            error_type="RedisError",
            message="验证码校验失败：Redis 不可用",
            session_id=email,
        )
        return False
    key = _code_key(email, purpose)
    try:
        stored = client.get(key)
        if not stored or stored != str(code).strip():
            return False
        client.delete(key)
        client.delete(_sent_key(email, purpose))
        return True
    except (RedisConnectionError, RedisTimeoutError, RedisError, OSError) as exc:
        capture_exception(exc, session_id=email, context="Redis verify_code")
        return False


def send_verification_code(email: str, purpose: CodePurpose) -> dict:
    """
    生成验证码、写入 Redis、发送邮件。
    返回与前端约定一致的 {code, msg, data}。
    """
    email = (email or "").strip()
    if not email or not is_valid_email(email):
        return {"code": 400, "msg": "邮箱格式错误", "data": {}}

    if not is_redis_available():
        log_error(
            error_type="RedisUnavailable",
            message="Redis 未连接，验证码功能暂不可用",
            session_id=email,
        )
        return _REDIS_UNAVAILABLE.copy()

    if not _can_resend(email, purpose):
        return {"code": 200, "msg": "验证码已发送，请稍后再试", "data": {}}

    verification_code = generate_code()
    # 先写 Redis，再发邮件，避免只读 Redis 导致「邮件已发但验证码未入库」
    ok, save_msg = _save_code(email, verification_code, purpose)
    if not ok:
        return {"code": 503, "msg": save_msg, "data": {}}

    if not _send_smtp(email, verification_code, purpose):
        return {"code": 500, "msg": "验证码发送失败，请稍后重试", "data": {}}

    return {"code": 200, "msg": _SUCCESS_MSG[purpose], "data": {}}
