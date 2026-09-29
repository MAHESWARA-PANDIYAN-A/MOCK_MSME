from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, 
    Numeric, JSON, Enum, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class UserRole(str, enum.Enum):
    APPLICANT = "APPLICANT"
    OFFICER = "OFFICER"
    ADMIN = "ADMIN"

class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_VERIFICATION = "UNDER_VERIFICATION"
    CORRECTION_REQUIRED = "CORRECTION_REQUIRED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class EnterpriseType(str, enum.Enum):
    MICRO = "MICRO"
    SMALL = "SMALL"
    MEDIUM = "MEDIUM"
    OUTSIDE_RANGE = "OUTSIDE_RANGE"

class OrganisationType(str, enum.Enum):
    PROPRIETORSHIP = "PROPRIETORSHIP"
    PARTNERSHIP = "PARTNERSHIP"
    LLP = "LLP"
    PRIVATE_LIMITED = "PRIVATE_LIMITED"
    PUBLIC_LIMITED = "PUBLIC_LIMITED"
    COOPERATIVE_SOCIETY = "COOPERATIVE_SOCIETY"
    SOCIETY = "SOCIETY"
    TRUST = "TRUST"
    HUF = "HUF"
    SELF_HELP_GROUP = "SELF_HELP_GROUP"
    OTHER = "OTHER"

class MajorActivityType(str, enum.Enum):
    MANUFACTURING = "MANUFACTURING"
    SERVICES = "SERVICES"
    TRADING = "TRADING"
    MANUFACTURING_AND_SERVICES = "MANUFACTURING_AND_SERVICES"
    OTHER = "OTHER"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    mobile = Column(String(20), index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.APPLICANT.value, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

class Applicant(Base):
    __tablename__ = "applicants"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    full_name = Column(String(255), nullable=False)
    mobile = Column(String(20), nullable=False)
    email = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    enterprises = relationship("Enterprise", back_populates="applicant")
    applications = relationship("Application", back_populates="applicant")

class Enterprise(Base):
    __tablename__ = "enterprises"
    
    id = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("applicants.id"), nullable=True)
    name = Column(String(255), nullable=False)
    organisation_type = Column(String(100), default=OrganisationType.PROPRIETORSHIP.value)
    date_of_incorporation = Column(String(50), nullable=True)
    date_of_commencement = Column(String(50), nullable=True)
    pan_number = Column(String(20), nullable=True)
    gstin = Column(String(50), nullable=True)
    social_category = Column(String(50), default="General") # General, SC, ST, OBC
    gender = Column(String(20), default="Male") # Male, Female, Other
    specially_abled = Column(String(10), default="No") # Yes, No
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    applicant = relationship("Applicant", back_populates="enterprises")
    applications = relationship("Application", back_populates="enterprise")

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String(100), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    applicant_id = Column(Integer, ForeignKey("applicants.id"), nullable=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id"), nullable=True)
    
    external_reference_id = Column(String(100), unique=True, index=True, nullable=True)
    source_system = Column(String(100), default="UDYAM_DIRECT")
    
    status = Column(String(50), default=ApplicationStatus.DRAFT.value, index=True, nullable=False)
    udyam_registration_number = Column(String(100), unique=True, index=True, nullable=True)
    enterprise_type = Column(String(50), default=EnterpriseType.MICRO.value, nullable=True)
    
    submission_date = Column(DateTime(timezone=True), nullable=True)
    approval_date = Column(DateTime(timezone=True), nullable=True)
    
    prefilled_from_sih = Column(Boolean, default=False)
    prefilled_meta = Column(JSON, default=dict)
    
    current_step = Column(Integer, default=1)
    is_declared = Column(Boolean, default=False)
    declaration_date = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="applications")
    applicant = relationship("Applicant", back_populates="applications")
    enterprise = relationship("Enterprise", back_populates="applications")
    
    aadhaar_verification = relationship("AadhaarVerification", back_populates="application", uselist=False, cascade="all, delete-orphan")
    pan_verification = relationship("PanVerification", back_populates="application", uselist=False, cascade="all, delete-orphan")
    gstin_verification = relationship("GstinVerification", back_populates="application", uselist=False, cascade="all, delete-orphan")
    address = relationship("EnterpriseAddress", back_populates="application", uselist=False, cascade="all, delete-orphan")
    plants = relationship("PlantUnit", back_populates="application", cascade="all, delete-orphan")
    promoters = relationship("Promoter", back_populates="application", cascade="all, delete-orphan")
    activities = relationship("BusinessActivity", back_populates="application", cascade="all, delete-orphan")
    financials = relationship("FinancialDetail", back_populates="application", uselist=False, cascade="all, delete-orphan")
    classification_result = relationship("ClassificationResult", back_populates="application", uselist=False, cascade="all, delete-orphan")
    status_history = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan", order_by="desc(ApplicationStatusHistory.created_at)")
    notifications = relationship("Notification", back_populates="application", cascade="all, delete-orphan")
    certificate = relationship("Certificate", back_populates="application", uselist=False, cascade="all, delete-orphan")

class AadhaarVerification(Base):
    __tablename__ = "aadhaar_verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    masked_aadhaar = Column(String(20), nullable=False) # e.g. "XXXX-XXXX-1234"
    entrepreneur_name = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False)
    verification_ref = Column(String(100), nullable=True)
    consent_given = Column(Boolean, default=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    application = relationship("Application", back_populates="aadhaar_verification")

class PanVerification(Base):
    __tablename__ = "pan_verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    has_pan = Column(String(10), default="YES")
    pan_number = Column(String(20), nullable=False)
    name_on_pan = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    application = relationship("Application", back_populates="pan_verification")

class GstinVerification(Base):
    __tablename__ = "gstin_verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, unique=True)
    has_gstin = Column(String(20), default="YES") # YES, NO, NOT_APPLICABLE
    gstin = Column(String(50), nullable=True)
    trade_name = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    application = relationship("Application", back_populates="gstin_verification")

class EnterpriseAddress(Base):
    __tablename__ = "enterprise_addresses"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, unique=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id"), nullable=True)
    
    flat_door_block = Column(String(255), nullable=True)
    premises_building = Column(String(255), nullable=True)
    village_town = Column(String(255), nullable=True)
    block = Column(String(255), nullable=True)
    road_street = Column(String(255), nullable=True)
    city = Column(String(255), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    mobile = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)

    application = relationship("Application", back_populates="address")

class PlantUnit(Base):
    __tablename__ = "plant_units"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id"), nullable=True)
    
    unit_name = Column(String(255), nullable=False)
    building_premises = Column(String(255), nullable=True)
    address = Column(String(255), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    business_activity = Column(String(255), nullable=True)
    commencement_date = Column(String(50), nullable=True)

    application = relationship("Application", back_populates="plants")

class Promoter(Base):
    __tablename__ = "promoters"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id"), nullable=True)
    
    name = Column(String(255), nullable=False)
    role = Column(String(100), nullable=False) # Owner, Partner, Director, Authorized Signatory
    masked_pan = Column(String(20), nullable=True)
    ownership_share = Column(Numeric(5, 2), default=100.00) # %

    application = relationship("Application", back_populates="promoters")

class BusinessActivity(Base):
    __tablename__ = "business_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id"), nullable=True)
    
    major_activity = Column(String(100), default=MajorActivityType.MANUFACTURING.value)
    nic_code = Column(String(50), nullable=False)
    description = Column(String(255), nullable=False)
    is_primary = Column(Boolean, default=True)

    application = relationship("Application", back_populates="activities")

class FinancialDetail(Base):
    __tablename__ = "financial_details"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, unique=True)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id"), nullable=True)
    
    investment = Column(Numeric(15, 2), default=0.0) # in INR
    turnover = Column(Numeric(15, 2), default=0.0) # in INR
    export_turnover = Column(Numeric(15, 2), default=0.0) # in INR
    financial_year = Column(String(20), default="2024-2025")
    
    # Employment (Optional step 9)
    male_employees = Column(Integer, default=0)
    female_employees = Column(Integer, default=0)
    other_employees = Column(Integer, default=0)
    total_employees = Column(Integer, default=0)
    
    # Bank info (Optional step 9)
    bank_name = Column(String(255), nullable=True)
    ifsc_code = Column(String(50), nullable=True)
    account_number = Column(String(50), nullable=True)

    application = relationship("Application", back_populates="financials")

class ClassificationRule(Base):
    __tablename__ = "classification_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    enterprise_type = Column(String(50), unique=True, nullable=False) # MICRO, SMALL, MEDIUM
    max_investment = Column(Numeric(15, 2), nullable=False) # e.g. 25000000 (2.5 Cr)
    max_turnover = Column(Numeric(15, 2), nullable=False) # e.g. 100000000 (10 Cr)
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    updated_by = Column(String(100), default="SYSTEM")

class ClassificationResult(Base):
    __tablename__ = "classification_results"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, unique=True)
    enterprise_type = Column(String(50), nullable=False)
    calculated_investment = Column(Numeric(15, 2), nullable=False)
    calculated_turnover = Column(Numeric(15, 2), nullable=False)
    reason = Column(Text, nullable=False)
    is_override = Column(Boolean, default=False)
    calculated_at = Column(DateTime(timezone=True), default=utc_now)

    application = relationship("Application", back_populates="classification_result")

class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    application = relationship("Application", back_populates="status_history")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="notifications")
    application = relationship("Application", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(String(100), nullable=True)
    details = Column(JSON, default=dict)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="audit_logs")

class IntegrationRequest(Base):
    __tablename__ = "integration_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String(255), nullable=False)
    external_reference_id = Column(String(100), index=True, nullable=True)
    idempotency_key = Column(String(100), index=True, nullable=True)
    request_payload = Column(JSON, default=dict)
    response_status = Column(Integer, nullable=False)
    response_payload = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"
    
    id = Column(Integer, primary_key=True, index=True)
    idempotency_key = Column(String(150), unique=True, index=True, nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100), nullable=False)
    response_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class Certificate(Base):
    __tablename__ = "certificates"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, unique=True)
    udyam_registration_number = Column(String(100), unique=True, index=True, nullable=False)
    enterprise_name = Column(String(255), nullable=False)
    organisation_type = Column(String(100), nullable=False)
    major_activity = Column(String(100), nullable=False)
    enterprise_type = Column(String(50), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    qr_code_path = Column(String(255), nullable=True)
    pdf_path = Column(String(255), nullable=True)
    issue_date = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    application = relationship("Application", back_populates="certificate")
