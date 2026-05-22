from pydantic import BaseModel, EmailStr, Field, model_validator


class EmailBody(BaseModel):
    email: EmailStr


class RegisterBody(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=32)
    code: str = Field(min_length=4, max_length=8)
    password: str = Field(min_length=8)


class LoginPasswordBody(BaseModel):
    password: str
    email: EmailStr | None = None
    username: str | None = None

    @model_validator(mode="after")
    def require_identifier(self):
        if not self.email and not self.username:
            raise ValueError("请提供邮箱或用户名")
        if self.email and self.username:
            raise ValueError("邮箱与用户名只能填写其一")
        return self


class LoginCodeBody(BaseModel):
    email: EmailStr
    code: str


class ResetPasswordBody(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=8)
    password: str = Field(min_length=8)
