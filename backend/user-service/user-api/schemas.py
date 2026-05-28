from pydantic import BaseModel, EmailStr, Field


class EmailBody(BaseModel):
    email: EmailStr


class RegisterBody(BaseModel):
    email: EmailStr
    username: str = Field(min_length=1, max_length=32)
    password: str = Field(min_length=6, max_length=64)
    code: str = Field(min_length=4, max_length=12)


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=64)


class LoginUsernameBody(BaseModel):
    username: str = Field(min_length=1, max_length=32)
    password: str = Field(min_length=6, max_length=64)


class LoginCodeBody(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=12)


class ResetPwdBody(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=12)
    newPassword: str = Field(min_length=6, max_length=64)
