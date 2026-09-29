from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

# Sub schemas
class AadhaarDetailSchema(BaseModel):
    masked_aadhaar: Optional[str] = None
    entrepreneur_name: Optional[str] = None
    is_verified: bool = False
    verification_ref: Optional[str] = None

class PanDetailSchema(BaseModel):
    has_pan: str = "YES"
    pan_number: Optional[str] = None
    name_on_pan: Optional[str] = None
    is_verified: bool = False

class GstinDetailSchema(BaseModel):
    has_gstin: str = "YES"
    gstin: Optional[str] = None
    trade_name: Optional[str] = None
    is_verified: bool = False

class EnterpriseAddressSchema(BaseModel):
    flat_door_block: Optional[str] = None
    premises_building: Optional[str] = None
    village_town: Optional[str] = None
    block: Optional[str] = None
    road_street: Optional[str] = None
    city: str
    state: str
    district: str
    pincode: str = Field(..., pattern=r"^[1-9][0-9]{5}$")
    mobile: Optional[str] = None
    email: Optional[EmailStr] = None

class PlantUnitSchema(BaseModel):
    id: Optional[int] = None
    unit_name: str
    building_premises: Optional[str] = None
    address: str
    state: str
    district: str
    pincode: str = Field(..., pattern=r"^[1-9][0-9]{5}$")
    business_activity: Optional[str] = None
    commencement_date: Optional[str] = None

class PromoterSchema(BaseModel):
    id: Optional[int] = None
    name: str
    role: str # Owner, Partner, Director, Authorized Signatory
    masked_pan: Optional[str] = None
    ownership_share: Optional[Decimal] = Decimal("100.00")

class BusinessActivitySchema(BaseModel):
    id: Optional[int] = None
    major_activity: str # MANUFACTURING, SERVICES, TRADING, MANUFACTURING_AND_SERVICES, OTHER
    nic_code: str
    description: str
    is_primary: bool = True

class FinancialDetailSchema(BaseModel):
    investment: Decimal = Field(..., ge=0)
    turnover: Decimal = Field(..., ge=0)
    export_turnover: Optional[Decimal] = Decimal("0.0")
    financial_year: Optional[str] = "2024-2025"
    male_employees: Optional[int] = 0
    female_employees: Optional[int] = 0
    other_employees: Optional[int] = 0
    total_employees: Optional[int] = 0
    bank_name: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_number: Optional[str] = None

class EnterpriseDetailSchema(BaseModel):
    name: str
    organisation_type: str = "PROPRIETORSHIP"
    date_of_incorporation: Optional[str] = None
    date_of_commencement: Optional[str] = None
    pan_number: Optional[str] = None
    gstin: Optional[str] = None
    social_category: Optional[str] = "General"
    gender: Optional[str] = "Male"
    specially_abled: Optional[str] = "No"

class ApplicationDraftSave(BaseModel):
    current_step: Optional[int] = 1
    aadhaar: Optional[AadhaarDetailSchema] = None
    pan: Optional[PanDetailSchema] = None
    gstin: Optional[GstinDetailSchema] = None
    enterprise: Optional[EnterpriseDetailSchema] = None
    address: Optional[EnterpriseAddressSchema] = None
    plants: Optional[List[PlantUnitSchema]] = []
    promoters: Optional[List[PromoterSchema]] = []
    activities: Optional[List[BusinessActivitySchema]] = []
    financials: Optional[FinancialDetailSchema] = None
    is_declared: Optional[bool] = False

class ApplicationSubmitRequest(BaseModel):
    is_declared: bool = True
    simulated_confirmation: bool = True

class ApplicationStatusHistoryOut(BaseModel):
    id: int
    old_status: Optional[str] = None
    new_status: str
    changed_by_user_id: Optional[int] = None
    comments: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime
    application_id: Optional[int] = None

    class Config:
        from_attributes = True

class CertificateOut(BaseModel):
    id: int
    udyam_registration_number: str
    enterprise_name: str
    organisation_type: str
    major_activity: str
    enterprise_type: str
    state: str
    district: str
    qr_code_path: Optional[str] = None
    pdf_path: Optional[str] = None
    issue_date: datetime

    class Config:
        from_attributes = True

class ApplicationOut(BaseModel):
    id: int
    application_number: str
    user_id: Optional[int] = None
    external_reference_id: Optional[str] = None
    source_system: str
    status: str
    udyam_registration_number: Optional[str] = None
    enterprise_type: Optional[str] = None
    submission_date: Optional[datetime] = None
    approval_date: Optional[datetime] = None
    prefilled_from_sih: bool = False
    prefilled_meta: Optional[Dict[str, Any]] = None
    current_step: int = 1
    is_declared: bool = False
    created_at: datetime
    updated_at: datetime
    
    # Nested components
    enterprise: Optional[EnterpriseDetailSchema] = None
    aadhaar_verification: Optional[AadhaarDetailSchema] = None
    pan_verification: Optional[PanDetailSchema] = None
    gstin_verification: Optional[GstinDetailSchema] = None
    address: Optional[EnterpriseAddressSchema] = None
    plants: List[PlantUnitSchema] = []
    promoters: List[PromoterSchema] = []
    activities: List[BusinessActivitySchema] = []
    financials: Optional[FinancialDetailSchema] = None
    classification_reason: Optional[str] = None
    status_history: List[ApplicationStatusHistoryOut] = []
    certificate: Optional[CertificateOut] = None

    class Config:
        from_attributes = True

class ApplicationListOut(BaseModel):
    id: int
    application_number: str
    enterprise_name: str
    applicant_name: str
    state: Optional[str] = None
    district: Optional[str] = None
    major_activity: Optional[str] = None
    enterprise_type: Optional[str] = None
    organisation_type: Optional[str] = None
    submission_date: Optional[datetime] = None
    status: str
    udyam_registration_number: Optional[str] = None
    prefilled_from_sih: bool = False
    created_at: datetime

class OfficerReviewAction(BaseModel):
    action: str = Field(..., description="APPROVE, RETURN_FOR_CORRECTION, REJECT")
    comments: Optional[str] = None
