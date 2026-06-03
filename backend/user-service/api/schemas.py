from datetime import date

from pydantic import BaseModel, EmailStr, Field

from error.logger import SERVICE_NAME


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


class UpdateProfileBody(BaseModel):
    phoneNumber: str | None = Field(default=None, max_length=11)
    gender: int | None = Field(default=None, ge=0, le=2)
    birthday: date | None = None
    signature: str | None = Field(default=None, max_length=100)
    major: str | None = Field(default=None, max_length=32)
    nickname: str | None = Field(default=None, max_length=32)

    model_config = {"populate_by_name": True}


class MarkSentBody(BaseModel):
    ids: list[int] = Field(min_length=1)
    service: str = Field(default=SERVICE_NAME, max_length=50)
