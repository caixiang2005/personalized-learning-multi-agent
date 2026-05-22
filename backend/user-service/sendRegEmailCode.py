from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
import random
from email_service import send_email_code  # 从工具类导入
from redis_db import has_email_code  # 从redis_db导入检查函数

router = APIRouter(tags=["邮件验证码"])

class CodeRequest(BaseModel):
    email: EmailStr

@router.post("/api/user/sendRegEmailCode")
def send_reg_code(req: CodeRequest):
    to_email = req.email
    if has_email_code(to_email):
        return {"code":200,"msg":"验证码已发送，请稍后再试","data":{}}
    # 判断redis里面有没有对应的验证码，如果有就直接返回成功，不发送邮件了

    # 生成6位随机验证码
    code = random.randint(100000, 999999)
    
    # 发送邮件
    send_email_code(to_email, code)

    # 存redis,10分钟过期



    return {"code":200,"msg":"注册验证码发送成功","data":{}}