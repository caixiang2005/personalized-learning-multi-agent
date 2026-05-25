from fastapi import APIRouter

from schemas import EmailBody
from utils.email import CodePurpose, send_verification_code

router = APIRouter(tags=["邮件验证码"])


@router.post("/api/user/sendRegEmailCode")
def send_reg_email_code(body: EmailBody):
    return send_verification_code(str(body.email), CodePurpose.REGISTER)


@router.post("/api/user/sendLoginEmailCode")
def send_login_email_code(body: EmailBody):
    return send_verification_code(str(body.email), CodePurpose.LOGIN)
