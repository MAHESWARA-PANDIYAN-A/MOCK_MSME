import uuid
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.models.models import (
    User, Applicant, Enterprise, Application, AadhaarVerification,
    PanVerification, GstinVerification, EnterpriseAddress, PlantUnit,
    Promoter, BusinessActivity, FinancialDetail, ClassificationRule,
    ClassificationResult, ApplicationStatusHistory, Notification,
    ApplicationStatus, EnterpriseType, UserRole
)
from app.core.security import get_password_hash
from app.services.classification_service import seed_default_classification_rules
from app.services.certificate_service import CertificateService

def seed_database(db: Session):
    # 1. Seed Classification Rules
    seed_default_classification_rules(db)

    # 2. Check if users already seeded
    existing_admin = db.query(User).filter(User.email == "admin@msme.example.com").first()
    if existing_admin:
        return  # already seeded

    # Seed Users
    applicant_user = User(
        email="rahul@example.com",
        mobile="9876543210",
        full_name="Rahul Kumar",
        hashed_password=get_password_hash("Applicant@123"),
        role=UserRole.APPLICANT.value,
        is_active=True
    )
    
    officer_user = User(
        email="priya.officer@example.com",
        mobile="9876543211",
        full_name="Priya Sharma",
        hashed_password=get_password_hash("Officer@123"),
        role=UserRole.OFFICER.value,
        is_active=True
    )

    admin_user = User(
        email="admin@msme.example.com",
        mobile="9876543212",
        full_name="MSME Admin Officer",
        hashed_password=get_password_hash("Admin@123"),
        role=UserRole.ADMIN.value,
        is_active=True
    )

    db.add_all([applicant_user, officer_user, admin_user])
    db.flush()

    # Seed Applicant Record
    applicant_profile = Applicant(
        user_id=applicant_user.id,
        full_name="Rahul Kumar",
        mobile="9876543210",
        email="rahul@example.com"
    )
    db.add(applicant_profile)
    db.flush()

    now = datetime.now(timezone.utc)

    # ==========================================
    # 1. Submitted Application (ABC Foods Pvt Ltd)
    # ==========================================
    ent1 = Enterprise(
        applicant_id=applicant_profile.id,
        name="ABC Foods Pvt Ltd",
        organisation_type="PRIVATE_LIMITED",
        date_of_incorporation="2024-01-10",
        date_of_commencement="2024-03-01",
        pan_number="AABCA1234F",
        gstin="33AABCA1234F1Z1",
        social_category="General",
        gender="Male",
        specially_abled="No"
    )
    db.add(ent1)
    db.flush()

    app1 = Application(
        application_number="UDYAM-MOCK-2026-000123",
        user_id=applicant_user.id,
        applicant_id=applicant_profile.id,
        enterprise_id=ent1.id,
        external_reference_id="SIH-APP-1001",
        source_system="SIH26130",
        status=ApplicationStatus.SUBMITTED.value,
        enterprise_type=EnterpriseType.MICRO.value,
        submission_date=now - timedelta(hours=3),
        prefilled_from_sih=True,
        prefilled_meta={"source": "SIH26130", "prefill_date": now.isoformat()},
        current_step=12,
        is_declared=True,
        declaration_date=now - timedelta(hours=3)
    )
    db.add(app1)
    db.flush()

    # Aadhaar 1
    db.add(AadhaarVerification(
        application_id=app1.id,
        user_id=applicant_user.id,
        masked_aadhaar="XXXX-XXXX-1234",
        entrepreneur_name="Rahul Kumar",
        is_verified=True,
        verification_ref="SIM-UIDAI-DEMO-001",
        verified_at=now - timedelta(hours=4)
    ))

    # PAN 1
    db.add(PanVerification(
        application_id=app1.id,
        user_id=applicant_user.id,
        has_pan="YES",
        pan_number="AABCA1234F",
        name_on_pan="ABC FOODS PVT LTD",
        is_verified=True,
        verified_at=now - timedelta(hours=4)
    ))

    # GSTIN 1
    db.add(GstinVerification(
        application_id=app1.id,
        has_gstin="YES",
        gstin="33AABCA1234F1Z1",
        trade_name="ABC Foods Pvt Ltd",
        is_verified=True,
        verified_at=now - timedelta(hours=4)
    ))

    # Address 1
    db.add(EnterpriseAddress(
        application_id=app1.id,
        enterprise_id=ent1.id,
        flat_door_block="Plot 45-B",
        premises_building="SIDCO Industrial Estate",
        village_town="Salem",
        block="Salem South",
        road_street="Steel Plant Main Road",
        city="Salem",
        state="Tamil Nadu",
        district="Salem",
        pincode="636001",
        mobile="9876543210",
        email="rahul@example.com"
    ))

    # Units 1 (2 units)
    db.add(PlantUnit(
        application_id=app1.id,
        enterprise_id=ent1.id,
        unit_name="ABC Foods Manufacturing Unit",
        building_premises="Shed 12",
        address="SIDCO Industrial Estate, Salem",
        state="Tamil Nadu",
        district="Salem",
        pincode="636001",
        business_activity="Packaged Snack Manufacturing",
        commencement_date="2024-03-01"
    ))
    db.add(PlantUnit(
        application_id=app1.id,
        enterprise_id=ent1.id,
        unit_name="ABC Foods Warehouse & Logistics",
        building_premises="Warehouse Block C",
        address="Avinashi Road, Coimbatore",
        state="Tamil Nadu",
        district="Coimbatore",
        pincode="641014",
        business_activity="Storage and Packaging",
        commencement_date="2024-04-15"
    ))

    # Promoter 1
    db.add(Promoter(
        application_id=app1.id,
        enterprise_id=ent1.id,
        name="Rahul Kumar",
        role="Director",
        masked_pan="ABCDE****F",
        ownership_share=Decimal("70.00")
    ))
    db.add(Promoter(
        application_id=app1.id,
        enterprise_id=ent1.id,
        name="Sanjay Kumar",
        role="Director",
        masked_pan="BCDEF****G",
        ownership_share=Decimal("30.00")
    ))

    # Activity 1
    db.add(BusinessActivity(
        application_id=app1.id,
        enterprise_id=ent1.id,
        major_activity="MANUFACTURING",
        nic_code="DEMO-1071",
        description="Manufacture of bakery and packaged snack products",
        is_primary=True
    ))

    # Financials 1 (Investment 1.5 Cr, Turnover 6 Cr -> Micro)
    db.add(FinancialDetail(
        application_id=app1.id,
        enterprise_id=ent1.id,
        investment=Decimal("15000000.00"),
        turnover=Decimal("60000000.00"),
        export_turnover=Decimal("5000000.00"),
        financial_year="2024-2025",
        male_employees=18,
        female_employees=12,
        other_employees=0,
        total_employees=30,
        bank_name="State Bank of India",
        ifsc_code="SBIN0001234",
        account_number="30291823901"
    ))

    db.add(ClassificationResult(
        application_id=app1.id,
        enterprise_type=EnterpriseType.MICRO.value,
        calculated_investment=Decimal("15000000.00"),
        calculated_turnover=Decimal("60000000.00"),
        reason="Investment (₹1.50 Cr) and Turnover (₹5.50 Cr) fall within the configured Micro enterprise thresholds.",
        is_override=False
    ))

    db.add(ApplicationStatusHistory(
        application_id=app1.id,
        old_status="DRAFT",
        new_status="SUBMITTED",
        changed_by_user_id=applicant_user.id,
        comments="Submitted by applicant for official verification."
    ))

    db.add(Notification(
        user_id=applicant_user.id,
        application_id=app1.id,
        title="Application Submitted",
        message="Your Udyam application (UDYAM-MOCK-2026-000123) is successfully submitted.",
        notification_type="SUCCESS"
    ))

    # ==========================================
    # 2. Approved Application with Certificate (Chennai Precision Tools)
    # ==========================================
    ent2 = Enterprise(
        applicant_id=applicant_profile.id,
        name="Chennai Precision Tools Pvt Ltd",
        organisation_type="PRIVATE_LIMITED",
        date_of_incorporation="2022-05-15",
        date_of_commencement="2022-08-01",
        pan_number="BCDEA5678K",
        gstin="33BCDEA5678K1Z2"
    )
    db.add(ent2)
    db.flush()

    app2 = Application(
        application_number="UDYAM-MOCK-2026-000098",
        user_id=applicant_user.id,
        applicant_id=applicant_profile.id,
        enterprise_id=ent2.id,
        external_reference_id="SIH-APP-0998",
        source_system="SIH26130",
        status=ApplicationStatus.APPROVED.value,
        udyam_registration_number="UDYAM-TN-00-1234567",
        enterprise_type=EnterpriseType.SMALL.value,
        submission_date=now - timedelta(days=5),
        approval_date=now - timedelta(days=2),
        prefilled_from_sih=True,
        current_step=12,
        is_declared=True
    )
    db.add(app2)
    db.flush()

    # Aadhaar 2
    db.add(AadhaarVerification(
        application_id=app2.id,
        user_id=applicant_user.id,
        masked_aadhaar="XXXX-XXXX-1234",
        entrepreneur_name="Rahul Kumar",
        is_verified=True,
        verification_ref="SIM-UIDAI-DEMO-002",
        verified_at=now - timedelta(days=5)
    ))

    # Address 2
    db.add(EnterpriseAddress(
        application_id=app2.id,
        enterprise_id=ent2.id,
        flat_door_block="Survey No 120",
        premises_building="Ambattur Industrial Area",
        city="Chennai",
        state="Tamil Nadu",
        district="Chennai",
        pincode="600058",
        mobile="9876543210",
        email="rahul@example.com"
    ))

    # Activity 2
    db.add(BusinessActivity(
        application_id=app2.id,
        enterprise_id=ent2.id,
        major_activity="MANUFACTURING",
        nic_code="DEMO-2592",
        description="Machining and manufacture of precision industrial components",
        is_primary=True
    ))

    # Financials 2 (Investment 8 Cr, Turnover 35 Cr -> Small)
    db.add(FinancialDetail(
        application_id=app2.id,
        enterprise_id=ent2.id,
        investment=Decimal("80000000.00"),
        turnover=Decimal("350000000.00"),
        financial_year="2024-2025",
        total_employees=45
    ))

    db.add(ClassificationResult(
        application_id=app2.id,
        enterprise_type=EnterpriseType.SMALL.value,
        calculated_investment=Decimal("80000000.00"),
        calculated_turnover=Decimal("350000000.00"),
        reason="Investment (₹8.00 Cr) and Turnover (₹35.00 Cr) fall within the configured Small enterprise thresholds.",
        is_override=False
    ))

    db.add(ApplicationStatusHistory(
        application_id=app2.id,
        old_status="UNDER_VERIFICATION",
        new_status="APPROVED",
        changed_by_user_id=officer_user.id,
        comments="All verification criteria met. Mock Udyam Registration Number generated."
    ))

    # Generate Certificate for App2
    CertificateService.generate_certificate(db, app2)

    # ==========================================
    # 3. Correction Required Application (Coimbatore Tech Solutions)
    # ==========================================
    ent3 = Enterprise(
        applicant_id=applicant_profile.id,
        name="Coimbatore Tech Solutions LLP",
        organisation_type="LLP",
        date_of_incorporation="2023-11-20",
        date_of_commencement="2024-02-10",
        pan_number="AABLC9876Q"
    )
    db.add(ent3)
    db.flush()

    app3 = Application(
        application_number="UDYAM-MOCK-2026-000105",
        user_id=applicant_user.id,
        applicant_id=applicant_profile.id,
        enterprise_id=ent3.id,
        status=ApplicationStatus.CORRECTION_REQUIRED.value,
        enterprise_type=EnterpriseType.MICRO.value,
        submission_date=now - timedelta(days=2),
        current_step=4,
        is_declared=True
    )
    db.add(app3)
    db.flush()

    db.add(EnterpriseAddress(
        application_id=app3.id,
        enterprise_id=ent3.id,
        city="Coimbatore",
        state="Tamil Nadu",
        district="Coimbatore",
        pincode="641001",
        mobile="9876543210"
    ))

    db.add(FinancialDetail(
        application_id=app3.id,
        enterprise_id=ent3.id,
        investment=Decimal("2000000.00"),
        turnover=Decimal("8000000.00"),
        financial_year="2024-2025"
    ))

    db.add(ApplicationStatusHistory(
        application_id=app3.id,
        old_status="SUBMITTED",
        new_status="CORRECTION_REQUIRED",
        changed_by_user_id=officer_user.id,
        comments="Please correct the enterprise commencement date and upload complete unit address."
    ))

    db.add(Notification(
        user_id=applicant_user.id,
        application_id=app3.id,
        title="Correction Required",
        message="Please correct the enterprise commencement date and upload complete unit address.",
        notification_type="WARNING"
    ))

    # ==========================================
    # 4. Under Verification Application (Salem Agro Mills)
    # ==========================================
    ent4 = Enterprise(
        applicant_id=applicant_profile.id,
        name="Salem Agro Mills",
        organisation_type="PROPRIETORSHIP",
        date_of_incorporation="2021-04-12",
        pan_number="CDEFA4321P"
    )
    db.add(ent4)
    db.flush()

    app4 = Application(
        application_number="UDYAM-MOCK-2026-000115",
        user_id=applicant_user.id,
        applicant_id=applicant_profile.id,
        enterprise_id=ent4.id,
        status=ApplicationStatus.UNDER_VERIFICATION.value,
        enterprise_type=EnterpriseType.MICRO.value,
        submission_date=now - timedelta(days=1),
        current_step=12,
        is_declared=True
    )
    db.add(app4)
    db.flush()

    db.add(EnterpriseAddress(
        application_id=app4.id,
        enterprise_id=ent4.id,
        city="Salem",
        state="Tamil Nadu",
        district="Salem",
        pincode="636005"
    ))

    db.add(FinancialDetail(
        application_id=app4.id,
        enterprise_id=ent4.id,
        investment=Decimal("12000000.00"),
        turnover=Decimal("45000000.00"),
        financial_year="2024-2025"
    ))

    db.commit()
