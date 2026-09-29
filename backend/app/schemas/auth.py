from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    full_name: str
    mobile: str = Field(..., pattern=r"^[6-9]\d{9}$")
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str

class UserLogin(BaseModel):
    email_or_mobile: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    email: str
    role: str

class UserOut(BaseModel):
    id: int
    email: str
    mobile: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SendOtpRequest(BaseModel):
    mobile_or_aadhaar: str
    purpose: str = "REGISTRATION"

class VerifyOtpRequest(BaseModel):
    mobile_or_aadhaar: str
    otp: str
