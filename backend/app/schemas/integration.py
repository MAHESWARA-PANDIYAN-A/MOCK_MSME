from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import datetime

class IntegrationApplicant(BaseModel):
    name: str
    mobile: str
    email: EmailStr

class IntegrationAadhaar(BaseModel):
    verification_reference: Optional[str] = "DEMO-AADHAAR-001"
    masked: Optional[str] = "XXXX-XXXX-1234"

class IntegrationPan(BaseModel):
    number: str
    name_on_pan: Optional[str] = None

class IntegrationEnterprise(BaseModel):
    name: str
    organisation_type: Optional[str] = "PROPRIETORSHIP"
    date_of_incorporation: Optional[str] = None
    date_of_commencement: Optional[str] = None
    social_category: Optional[str] = "General"
    gender: Optional[str] = "Male"
    specially_abled: Optional[str] = "No"

class IntegrationAddress(BaseModel):
    address_line_1: Optional[str] = None
    city: str
    state: str
    district: str
    pincode: str
    mobile: Optional[str] = None
    email: Optional[str] = None

class IntegrationPlant(BaseModel):
    unit_name: str
    building_premises: Optional[str] = None
    address: str
    state: str
    district: str
    pincode: str
    business_activity: Optional[str] = None
    commencement_date: Optional[str] = None

class IntegrationPromoter(BaseModel):
    name: str
    role: str
    masked_pan: Optional[str] = None
    ownership_share: Optional[Decimal] = Decimal("100.00")

class IntegrationActivity(BaseModel):
    major_activity: str
    description: str
    activity_code: Optional[str] = "DEMO-1071"
    is_primary: Optional[bool] = True

class IntegrationFinancials(BaseModel):
    investment: Decimal = Field(..., ge=0)
    turnover: Decimal = Field(..., ge=0)
    export_turnover: Optional[Decimal] = Decimal("0.0")
    financial_year: Optional[str] = "2024-2025"

class IntegrationPrefillRequest(BaseModel):
    external_reference_id: str
    source_system: Optional[str] = "SIH26130"
    applicant: IntegrationApplicant
    aadhaar: Optional[IntegrationAadhaar] = None
    pan: Optional[IntegrationPan] = None
    gstin: Optional[str] = None
    enterprise: IntegrationEnterprise
    address: IntegrationAddress
    plants: Optional[List[IntegrationPlant]] = []
    promoters: Optional[List[IntegrationPromoter]] = []
    activities: Optional[List[IntegrationActivity]] = []
    financials: Optional[IntegrationFinancials] = None

class IntegrationPrefillResponse(BaseModel):
    success: bool
    application_number: str
    external_reference_id: str
    status: str
    prefilled_fields: int
    missing_fields: List[str]
    enterprise_type_preview: str

class PendingAction(BaseModel):
    type: str
    message: str

class IntegrationStatusResponse(BaseModel):
    application_number: str
    external_reference_id: Optional[str] = None
    status: str
    udyam_registration_number: Optional[str] = None
    last_updated_at: datetime
    enterprise_type: Optional[str] = None
    pending_actions: List[PendingAction] = []
