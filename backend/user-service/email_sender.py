import smtplib
import ssl
from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

from email_settings import get_email_config

PURPOSE_SUBJECT = {
    "register": "【个性化学习】注册验证码",
    "login": "【个性化学习】登录验证码",
}

PURPOSE_ACTION = {
    "register": "注册账号",
    "login": "登录账号",
}


def send_verification_email(to_email: str, code: str, purpose: str) -> None:
    cfg = get_email_config()
    action = PURPOSE_ACTION.get(purpose, "验证身份")
    subject = PURPOSE_SUBJECT.get(purpose, "【个性化学习】验证码")
    expire = cfg.verification.expire_minutes

    text = (
        f"您好，\n\n"
        f"您正在{action}，验证码为：{code}\n"
        f"有效期 {expire} 分钟，请勿泄露给他人。\n\n"
        f"如非本人操作，请忽略此邮件。\n"
    )
    html = f"""
    <div style="font-family:Segoe UI,PingFang SC,sans-serif;line-height:1.6;color:#1f2937;">
      <p>您好，</p>
      <p>您正在<strong>{action}</strong>，验证码为：</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#3b5bdb;">{code}</p>
      <p style="color:#6b7280;">有效期 {expire} 分钟，请勿泄露给他人。</p>
      <p style="color:#9ca3af;font-size:13px;">如非本人操作，请忽略此邮件。</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = formataddr((cfg.from_.name, cfg.from_.address))
    msg["To"] = to_email
    msg.attach(MIMEText(text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    smtp = cfg.smtp
    if smtp.use_ssl:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(smtp.host, smtp.port, context=context, timeout=30) as server:
            server.login(smtp.username, smtp.password)
            server.sendmail(cfg.from_.address, [to_email], msg.as_string())
    else:
        with smtplib.SMTP(smtp.host, smtp.port, timeout=30) as server:
            server.ehlo()
            server.starttls(context=ssl.create_default_context())
            server.login(smtp.username, smtp.password)
            server.sendmail(cfg.from_.address, [to_email], msg.as_string())
