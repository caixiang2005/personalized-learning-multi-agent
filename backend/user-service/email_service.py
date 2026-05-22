import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

def send_email_code(to_email: str, code: int) -> bool:
    host = os.getenv("MAIL_SMTP_HOST")
    port = int(os.getenv("MAIL_SMTP_PORT"))
    sender = os.getenv("MAIL_SENDER")
    auth = os.getenv("MAIL_AUTH_CODE")

    content = f"你的注册验证码：{code}\n5分钟内有效，请勿外泄"
    msg = MIMEText(content, "plain", "utf-8")
    msg["Subject"] = "注册验证码"
    msg["From"] = sender
    msg["To"] = to_email

    try:
        with smtplib.SMTP_SSL(host, port) as smtp:
            smtp.login(sender, auth)
            smtp.sendmail(sender, to_email, msg.as_string())
        return True
    except Exception:
        return False

# 测试
if __name__ == "__main__":
    send_email_code("2179451926@qq.com", 123456)