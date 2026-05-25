import logging
import random
import smtplib
from email.header import Header
from email.mime.text import MIMEText
from email.utils import formataddr
from enum import Enum

logger = logging.getLogger(__name__)

from email_validator import EmailNotValidError, validate_email

from config import get_settings
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
        "你的注册验证码：{code}\n{expire} 分钟内有效，请勿外泄。",
    ),
    CodePurpose.LOGIN: (
        "登录验证码",
        "你的登录验证码：{code}\n{expire} 分钟内有效，请勿外泄。",
    ),
    CodePurpose.RESET_PASSWORD: (
        "重置密码验证码",
        "你的重置密码验证码：{code}\n{expire} 分钟内有效，请勿外泄。",
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
        return False

    subject, body_tpl = _PURPOSE_META[purpose]
    body = body_tpl.format(code=code, expire=v["expire_minutes"])
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
        return False
    except OSError as exc:
        logger.error("SMTP 网络错误: %s", exc)
        return False


def _save_code(email: str, code: str, purpose: CodePurpose) -> bool:
    client = get_redis_client()
    if client is None:
        return False
    v = get_settings().verification
    expire_seconds = v["expire_minutes"] * 60
    resend_seconds = v["resend_interval_seconds"]
    pipe = client.pipeline()
    pipe.set(_code_key(email, purpose), code, ex=expire_seconds)
    pipe.set(_sent_key(email, purpose), "1", ex=resend_seconds)
    pipe.execute()
    return True


def verify_verification_code(email: str, code: str, purpose: CodePurpose) -> bool:
    client = get_redis_client()
    if client is None:
        return False
    key = _code_key(email, purpose)
    stored = client.get(key)
    if not stored or stored != str(code).strip():
        return False
    client.delete(key)
    client.delete(_sent_key(email, purpose))
    return True


def send_verification_code(email: str, purpose: CodePurpose) -> dict:
    """
    生成验证码、写入 Redis、发送邮件。
    返回与前端约定一致的 {code, msg, data}。
    """
    email = (email or "").strip()
    if not email or not is_valid_email(email):
        return {"code": 400, "msg": "邮箱格式错误", "data": {}}

    if not is_redis_available():
        return _REDIS_UNAVAILABLE.copy()

    if not _can_resend(email, purpose):
        return {"code": 200, "msg": "验证码已发送，请稍后再试", "data": {}}

    verification_code = generate_code()
    if not _send_smtp(email, verification_code, purpose):
        return {"code": 500, "msg": "验证码发送失败，请稍后重试", "data": {}}

    if not _save_code(email, verification_code, purpose):
        return {"code": 503, "msg": "验证码保存失败，请检查 Redis 连接", "data": {}}

    return {"code": 200, "msg": _SUCCESS_MSG[purpose], "data": {}}
