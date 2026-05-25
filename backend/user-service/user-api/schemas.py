from pydantic import BaseModel, EmailStr


class EmailBody(BaseModel):
    email: EmailStr
