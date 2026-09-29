from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AadhaarOtpRequest(BaseModel):
    application_id: Optional[int] = None
    aadhaar_number: str = Field(..., description="12 digit Aadhaar or formatted XXXX-XXXX-XXXX")
    entrepreneur_name: str
    consent_given: bool = True

class AadhaarOtpVerify(BaseModel):
    application_id: Optional[int] = None
    aadhaar_number: str
    otp: str
    entrepreneur_name: Optional[str] = None

class AadhaarVerificationOut(BaseModel):
    success: bool
    masked_aadhaar: str
    entrepreneur_name: str
    is_verified: bool
    verification_ref: str
    message: str

class PanVerifyRequest(BaseModel):
    application_id: Optional[int] = None
    has_pan: str = "YES"
    pan_number: str = Field(..., pattern=r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
    name_on_pan: Optional[str] = None

class PanVerificationOut(BaseModel):
    success: bool
    pan_number: str
    name_on_pan: str
    is_verified: bool
    message: str

class GstinVerifyRequest(BaseModel):
    application_id: Optional[int] = None
    has_gstin: str = "YES" # YES, NO, NOT_APPLICABLE
    gstin: Optional[str] = None

class GstinVerificationOut(BaseModel):
    success: bool
    has_gstin: str
    gstin: Optional[str] = None
    trade_name: Optional[str] = None
    is_verified: bool
    message: str
