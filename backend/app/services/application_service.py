import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.models import (
    Application, Applicant, Enterprise, AadhaarVerification,
    PanVerification, GstinVerification, EnterpriseAddress,
    PlantUnit, Promoter, BusinessActivity, FinancialDetail,
    ClassificationResult, ApplicationStatusHistory, Notification,
    ApplicationStatus, EnterpriseType, User, Certificate
)
from app.schemas.application import ApplicationDraftSave, ApplicationSubmitRequest
from app.schemas.integration import IntegrationPrefillRequest, IntegrationPrefillResponse
from app.services.classification_service import ClassificationService
from app.services.audit_service import AuditService
from app.services.certificate_service import CertificateService
from app.services.webhook_service import WebhookService

class ApplicationService:
    @staticmethod
    def generate_application_number(db: Session) -> str:
        count = db.query(Application).count() + 1
        return f"UDYAM-MOCK-2026-{count:06d}"

    @staticmethod
    def get_or_create_draft(db: Session, user: User) -> Application:
        # Check if user has an existing draft or correction required application
        app = db.query(Application).filter(
            Application.user_id == user.id,
            Application.status.in_([ApplicationStatus.DRAFT.value, ApplicationStatus.CORRECTION_REQUIRED.value])
        ).first()

        if app:
            return app

        # Create new draft
        app_number = ApplicationService.generate_application_number(db)
        
        applicant = db.query(Applicant).filter(Applicant.user_id == user.id).first()
        if not applicant:
            applicant = Applicant(
                user_id=user.id,
                full_name=user.full_name,
                mobile=user.mobile,
                email=user.email
            )
            db.add(applicant)
            db.flush()

        enterprise = Enterprise(
            applicant_id=applicant.id,
            name=f"{user.full_name}'s Enterprise",
            organisation_type="PROPRIETORSHIP"
        )
        db.add(enterprise)
        db.flush()

        new_app = Application(
            application_number=app_number,
            user_id=user.id,
            applicant_id=applicant.id,
            enterprise_id=enterprise.id,
            status=ApplicationStatus.DRAFT.value,
            enterprise_type=EnterpriseType.MICRO.value,
            current_step=1,
            prefilled_from_sih=False
        )
        db.add(new_app)
        db.commit()
        db.refresh(new_app)

        AuditService.log(
            db,
            action="APPLICATION_CREATED",
            user_id=user.id,
            entity_type="APPLICATION",
            entity_id=str(new_app.id),
            details={"application_number": app_number, "status": "DRAFT"}
        )

        return new_app

    @staticmethod
    def save_draft(db: Session, application: Application, data: ApplicationDraftSave, user: Optional[User] = None) -> Application:
        if data.current_step is not None:
            application.current_step = data.current_step

        if data.is_declared is not None:
            application.is_declared = data.is_declared
            if data.is_declared:
                application.declaration_date = datetime.now(timezone.utc)

        # 1. Enterprise Details
        if data.enterprise:
            ent = application.enterprise
            if not ent:
                ent = Enterprise(applicant_id=application.applicant_id)
                db.add(ent)
                db.flush()
                application.enterprise_id = ent.id
            
            ent.name = data.enterprise.name
            ent.organisation_type = data.enterprise.organisation_type
            ent.date_of_incorporation = data.enterprise.date_of_incorporation
            ent.date_of_commencement = data.enterprise.date_of_commencement
            ent.pan_number = data.enterprise.pan_number
            ent.gstin = data.enterprise.gstin
            ent.social_category = data.enterprise.social_category or "General"
            ent.gender = data.enterprise.gender or "Male"
            ent.specially_abled = data.enterprise.specially_abled or "No"

        # 2. Aadhaar Verification
        if data.aadhaar:
            av = application.aadhaar_verification
            if not av:
                av = AadhaarVerification(
                    application_id=application.id,
                    user_id=application.user_id,
                    masked_aadhaar=data.aadhaar.masked_aadhaar or "XXXX-XXXX-0000",
                    entrepreneur_name=data.aadhaar.entrepreneur_name or (user.full_name if user else "Entrepreneur"),
                    is_verified=data.aadhaar.is_verified,
                    verification_ref=data.aadhaar.verification_ref or f"SIM-{uuid.uuid4().hex[:8].upper()}",
                    verified_at=datetime.now(timezone.utc) if data.aadhaar.is_verified else None
                )
                db.add(av)
            else:
                if data.aadhaar.masked_aadhaar:
                    av.masked_aadhaar = data.aadhaar.masked_aadhaar
                if data.aadhaar.entrepreneur_name:
                    av.entrepreneur_name = data.aadhaar.entrepreneur_name
                av.is_verified = data.aadhaar.is_verified
                if data.aadhaar.is_verified and not av.verified_at:
                    av.verified_at = datetime.now(timezone.utc)

        # 3. PAN Verification
        if data.pan:
            pv = application.pan_verification
            if not pv:
                pv = PanVerification(
                    application_id=application.id,
                    user_id=application.user_id,
                    has_pan=data.pan.has_pan,
                    pan_number=data.pan.pan_number or "",
                    name_on_pan=data.pan.name_on_pan,
                    is_verified=data.pan.is_verified,
                    verified_at=datetime.now(timezone.utc) if data.pan.is_verified else None
                )
                db.add(pv)
            else:
                pv.has_pan = data.pan.has_pan
                if data.pan.pan_number:
                    pv.pan_number = data.pan.pan_number
                if data.pan.name_on_pan:
                    pv.name_on_pan = data.pan.name_on_pan
                pv.is_verified = data.pan.is_verified
                if data.pan.is_verified and not pv.verified_at:
                    pv.verified_at = datetime.now(timezone.utc)

        # 4. GSTIN Verification
        if data.gstin:
            gv = application.gstin_verification
            if not gv:
                gv = GstinVerification(
                    application_id=application.id,
                    has_gstin=data.gstin.has_gstin,
                    gstin=data.gstin.gstin,
                    trade_name=data.gstin.trade_name,
                    is_verified=data.gstin.is_verified,
                    verified_at=datetime.now(timezone.utc) if data.gstin.is_verified else None
                )
                db.add(gv)
            else:
                gv.has_gstin = data.gstin.has_gstin
                gv.gstin = data.gstin.gstin
                gv.trade_name = data.gstin.trade_name
                gv.is_verified = data.gstin.is_verified
                if data.gstin.is_verified and not gv.verified_at:
                    gv.verified_at = datetime.now(timezone.utc)

        # 5. Enterprise Address
        if data.address:
            addr = application.address
            if not addr:
                addr = EnterpriseAddress(
                    application_id=application.id,
                    enterprise_id=application.enterprise_id,
                    flat_door_block=data.address.flat_door_block,
                    premises_building=data.address.premises_building,
                    village_town=data.address.village_town,
                    block=data.address.block,
                    road_street=data.address.road_street,
                    city=data.address.city,
                    state=data.address.state,
                    district=data.address.district,
                    pincode=data.address.pincode,
                    mobile=data.address.mobile,
                    email=data.address.email
                )
                db.add(addr)
            else:
                addr.flat_door_block = data.address.flat_door_block
                addr.premises_building = data.address.premises_building
                addr.village_town = data.address.village_town
                addr.block = data.address.block
                addr.road_street = data.address.road_street
                addr.city = data.address.city
                addr.state = data.address.state
                addr.district = data.address.district
                addr.pincode = data.address.pincode
                addr.mobile = data.address.mobile
                addr.email = data.address.email

        # 6. Plants / Units (dynamic list)
        if data.plants is not None:
            # clear existing or update
            db.query(PlantUnit).filter(PlantUnit.application_id == application.id).delete()
            for p in data.plants:
                new_plant = PlantUnit(
                    application_id=application.id,
                    enterprise_id=application.enterprise_id,
                    unit_name=p.unit_name,
                    building_premises=p.building_premises,
                    address=p.address,
                    state=p.state,
                    district=p.district,
                    pincode=p.pincode,
                    business_activity=p.business_activity,
                    commencement_date=p.commencement_date
                )
                db.add(new_plant)

        # 7. Promoters
        if data.promoters is not None:
            db.query(Promoter).filter(Promoter.application_id == application.id).delete()
            for pr in data.promoters:
                new_pr = Promoter(
                    application_id=application.id,
                    enterprise_id=application.enterprise_id,
                    name=pr.name,
                    role=pr.role,
                    masked_pan=pr.masked_pan,
                    ownership_share=pr.ownership_share or Decimal("100.00")
                )
                db.add(new_pr)

        # 8. Business Activities
        if data.activities is not None:
            db.query(BusinessActivity).filter(BusinessActivity.application_id == application.id).delete()
            for act in data.activities:
                new_act = BusinessActivity(
                    application_id=application.id,
                    enterprise_id=application.enterprise_id,
                    major_activity=act.major_activity,
                    nic_code=act.nic_code,
                    description=act.description,
                    is_primary=act.is_primary
                )
                db.add(new_act)

        # 9. Financials & Dynamic Classification
        if data.financials:
            fin = application.financials
            if not fin:
                fin = FinancialDetail(
                    application_id=application.id,
                    enterprise_id=application.enterprise_id,
                    investment=data.financials.investment,
                    turnover=data.financials.turnover,
                    export_turnover=data.financials.export_turnover or Decimal("0.0"),
                    financial_year=data.financials.financial_year or "2024-2025",
                    male_employees=data.financials.male_employees or 0,
                    female_employees=data.financials.female_employees or 0,
                    other_employees=data.financials.other_employees or 0,
                    total_employees=(data.financials.male_employees or 0) + (data.financials.female_employees or 0) + (data.financials.other_employees or 0),
                    bank_name=data.financials.bank_name,
                    ifsc_code=data.financials.ifsc_code,
                    account_number=data.financials.account_number
                )
                db.add(fin)
            else:
                fin.investment = data.financials.investment
                fin.turnover = data.financials.turnover
                fin.export_turnover = data.financials.export_turnover or Decimal("0.0")
                fin.financial_year = data.financials.financial_year or "2024-2025"
                fin.male_employees = data.financials.male_employees or 0
                fin.female_employees = data.financials.female_employees or 0
                fin.other_employees = data.financials.other_employees or 0
                fin.total_employees = fin.male_employees + fin.female_employees + fin.other_employees
                fin.bank_name = data.financials.bank_name
                fin.ifsc_code = data.financials.ifsc_code
                fin.account_number = data.financials.account_number

            # Trigger Classification Calculation
            etype, reason, _ = ClassificationService.calculate(
                db, 
                investment=data.financials.investment, 
                turnover=data.financials.turnover, 
                export_turnover=data.financials.export_turnover or Decimal("0.0")
            )
            application.enterprise_type = etype
            
            c_res = application.classification_result
            if not c_res:
                c_res = ClassificationResult(
                    application_id=application.id,
                    enterprise_type=etype,
                    calculated_investment=data.financials.investment,
                    calculated_turnover=data.financials.turnover,
                    reason=reason,
                    is_override=False
                )
                db.add(c_res)
            else:
                c_res.enterprise_type = etype
                c_res.calculated_investment = data.financials.investment
                c_res.calculated_turnover = data.financials.turnover
                c_res.reason = reason

        db.commit()
        db.refresh(application)

        AuditService.log(
            db,
            action="APPLICATION_UPDATED",
            user_id=user.id if user else application.user_id,
            entity_type="APPLICATION",
            entity_id=str(application.id),
            details={"step": application.current_step, "status": application.status}
        )

        return application

    @staticmethod
    def validate_for_submission(application: Application) -> Tuple[bool, List[str]]:
        missing = []
        if not application.aadhaar_verification or not application.aadhaar_verification.is_verified:
            missing.append("Aadhaar verification is required")
        
        if not application.pan_verification or (application.pan_verification.has_pan == "YES" and not application.pan_verification.is_verified):
            missing.append("PAN verification is required")
            
        if not application.enterprise or not application.enterprise.name:
            missing.append("Enterprise name is required")
            
        if not application.address or not application.address.city or not application.address.state or not application.address.district or not application.address.pincode:
            missing.append("Official enterprise address with PIN code is required")
            
        if not application.activities or len(application.activities) == 0:
            missing.append("At least one business activity / NIC code is required")
            
        if not application.financials or application.financials.investment is None or application.financials.turnover is None:
            missing.append("Investment and turnover details are required")
            
        if not application.is_declared:
            missing.append("Applicant declaration must be accepted before submission")

        return (len(missing) == 0, missing)

    @staticmethod
    async def submit_application(db: Session, application: Application, user: Optional[User] = None) -> Tuple[bool, str, Application]:
        if application.status not in [ApplicationStatus.DRAFT.value, ApplicationStatus.CORRECTION_REQUIRED.value]:
            return False, f"Cannot submit application in '{application.status}' status.", application

        # Mark declared for submission
        application.is_declared = True
        application.declaration_date = datetime.now(timezone.utc)

        is_valid, missing_fields = ApplicationService.validate_for_submission(application)
        if not is_valid:
            return False, f"Registration cannot be submitted because required information is missing: {', '.join(missing_fields)}", application

        old_status = application.status
        application.status = ApplicationStatus.SUBMITTED.value
        application.submission_date = datetime.now(timezone.utc)
        
        # History entry
        history = ApplicationStatusHistory(
            application_id=application.id,
            old_status=old_status,
            new_status=ApplicationStatus.SUBMITTED.value,
            changed_by_user_id=user.id if user else application.user_id,
            comments="Application submitted by applicant for official verification."
        )
        db.add(history)

        # Applicant Notification
        notif = Notification(
            user_id=application.user_id or 1,
            application_id=application.id,
            title="Registration Submitted",
            message=f"Your Udyam MSME application ({application.application_number}) has been submitted successfully and is pending review.",
            notification_type="SUCCESS"
        )
        db.add(notif)

        db.commit()
        db.refresh(application)

        AuditService.log(
            db,
            action="APPLICATION_SUBMITTED",
            user_id=user.id if user else application.user_id,
            entity_type="APPLICATION",
            entity_id=str(application.id),
            details={"application_number": application.application_number, "old_status": old_status}
        )

        # Webhook
        await WebhookService.dispatch_status_change(
            application_number=application.application_number,
            external_reference_id=application.external_reference_id,
            old_status=old_status,
            new_status=ApplicationStatus.SUBMITTED.value
        )

        return True, "Application submitted successfully.", application

    @staticmethod
    async def process_officer_review(
        db: Session, 
        application: Application, 
        action: str, 
        comments: Optional[str], 
        officer: User
    ) -> Tuple[bool, str, Application]:
        action_upper = action.upper().strip()
        old_status = application.status

        if action_upper == "APPROVE":
            application.status = ApplicationStatus.APPROVED.value
            application.approval_date = datetime.now(timezone.utc)
            
            # Generate Certificate & Mock Udyam Number
            cert = CertificateService.generate_certificate(db, application)
            
            # Record status history
            history = ApplicationStatusHistory(
                application_id=application.id,
                old_status=old_status,
                new_status=ApplicationStatus.APPROVED.value,
                changed_by_user_id=officer.id,
                comments=comments or f"Approved by officer {officer.full_name}. Registration Number generated: {cert.udyam_registration_number}"
            )
            db.add(history)

            # Notification to applicant
            if application.user_id:
                notif = Notification(
                    user_id=application.user_id,
                    application_id=application.id,
                    title="Registration Approved",
                    message=f"Congratulations! Your MSME application ({application.application_number}) has been approved. Udyam Registration Number: {cert.udyam_registration_number}",
                    notification_type="SUCCESS"
                )
                db.add(notif)

            db.commit()
            db.refresh(application)

            AuditService.log(
                db,
                action="APPLICATION_APPROVED",
                user_id=officer.id,
                entity_type="APPLICATION",
                entity_id=str(application.id),
                details={"udyam_number": cert.udyam_registration_number, "comments": comments}
            )

            await WebhookService.dispatch_status_change(
                application_number=application.application_number,
                external_reference_id=application.external_reference_id,
                old_status=old_status,
                new_status=ApplicationStatus.APPROVED.value
            )

            return True, f"Application approved. Mock Udyam Registration Number: {cert.udyam_registration_number}", application

        elif action_upper in ["RETURN_FOR_CORRECTION", "CORRECTION_REQUIRED"]:
            if not comments or not comments.strip():
                return False, "A mandatory comment explaining the required correction is required.", application

            application.status = ApplicationStatus.CORRECTION_REQUIRED.value
            
            history = ApplicationStatusHistory(
                application_id=application.id,
                old_status=old_status,
                new_status=ApplicationStatus.CORRECTION_REQUIRED.value,
                changed_by_user_id=officer.id,
                comments=comments.strip()
            )
            db.add(history)

            if application.user_id:
                notif = Notification(
                    user_id=application.user_id,
                    application_id=application.id,
                    title="Correction Required",
                    message=f"Your Udyam application requires correction. Officer Comment: {comments.strip()}",
                    notification_type="WARNING"
                )
                db.add(notif)

            db.commit()
            db.refresh(application)

            AuditService.log(
                db,
                action="CORRECTION_RAISED",
                user_id=officer.id,
                entity_type="APPLICATION",
                entity_id=str(application.id),
                details={"comments": comments}
            )

            await WebhookService.dispatch_status_change(
                application_number=application.application_number,
                external_reference_id=application.external_reference_id,
                old_status=old_status,
                new_status=ApplicationStatus.CORRECTION_REQUIRED.value
            )

            return True, "Application returned for correction.", application

        elif action_upper == "REJECT":
            application.status = ApplicationStatus.REJECTED.value
            
            history = ApplicationStatusHistory(
                application_id=application.id,
                old_status=old_status,
                new_status=ApplicationStatus.REJECTED.value,
                changed_by_user_id=officer.id,
                comments=comments or "Application rejected."
            )
            db.add(history)

            if application.user_id:
                notif = Notification(
                    user_id=application.user_id,
                    application_id=application.id,
                    title="Application Rejected",
                    message=f"Your Udyam application ({application.application_number}) was rejected. Reason: {comments or 'Criteria not met.'}",
                    notification_type="ERROR"
                )
                db.add(notif)

            db.commit()
            db.refresh(application)

            AuditService.log(
                db,
                action="APPLICATION_REJECTED",
                user_id=officer.id,
                entity_type="APPLICATION",
                entity_id=str(application.id),
                details={"comments": comments}
            )

            await WebhookService.dispatch_status_change(
                application_number=application.application_number,
                external_reference_id=application.external_reference_id,
                old_status=old_status,
                new_status=ApplicationStatus.REJECTED.value
            )

            return True, "Application rejected.", application

        else:
            return False, f"Unsupported officer review action: {action}", application

    @staticmethod
    def handle_sih_prefill(db: Session, req: IntegrationPrefillRequest) -> IntegrationPrefillResponse:
        # Check if external_reference_id already exists
        existing_app = db.query(Application).filter(
            Application.external_reference_id == req.external_reference_id
        ).first()

        prefilled_count = 0
        missing_fields = []

        # Find or create user for applicant email/mobile
        user = db.query(User).filter(
            or_(User.email == req.applicant.email, User.mobile == req.applicant.mobile)
        ).first()

        if not user:
            from app.core.security import get_password_hash
            user = User(
                email=req.applicant.email,
                mobile=req.applicant.mobile,
                hashed_password=get_password_hash("Applicant@123"),
                full_name=req.applicant.name,
                role="APPLICANT"
            )
            db.add(user)
            db.flush()

        # Find or create applicant
        applicant = db.query(Applicant).filter(Applicant.user_id == user.id).first()
        if not applicant:
            applicant = Applicant(
                user_id=user.id,
                full_name=req.applicant.name,
                mobile=req.applicant.mobile,
                email=req.applicant.email
            )
            db.add(applicant)
            db.flush()

        if existing_app:
            # Return existing application rather than duplicating
            etype = existing_app.enterprise_type or "MICRO"
            return IntegrationPrefillResponse(
                success=True,
                application_number=existing_app.application_number,
                external_reference_id=req.external_reference_id,
                status=existing_app.status,
                prefilled_fields=25,
                missing_fields=["employment_details", "declaration"] if not existing_app.is_declared else [],
                enterprise_type_preview=etype
            )

        # Create new application
        app_number = ApplicationService.generate_application_number(db)
        
        # Enterprise
        ent = Enterprise(
            applicant_id=applicant.id,
            name=req.enterprise.name,
            organisation_type=req.enterprise.organisation_type or "PROPRIETORSHIP",
            date_of_incorporation=req.enterprise.date_of_incorporation,
            date_of_commencement=req.enterprise.date_of_commencement,
            pan_number=req.pan.number if req.pan else None,
            gstin=req.gstin,
            social_category=req.enterprise.social_category or "General",
            gender=req.enterprise.gender or "Male",
            specially_abled=req.enterprise.specially_abled or "No"
        )
        db.add(ent)
        db.flush()
        prefilled_count += 6

        # Application
        app = Application(
            application_number=app_number,
            user_id=user.id,
            applicant_id=applicant.id,
            enterprise_id=ent.id,
            external_reference_id=req.external_reference_id,
            source_system=req.source_system or "SIH26130",
            status=ApplicationStatus.DRAFT.value,
            enterprise_type=EnterpriseType.MICRO.value,
            prefilled_from_sih=True,
            prefilled_meta={
                "source": req.source_system or "SIH26130",
                "imported_at": datetime.now(timezone.utc).isoformat(),
                "external_ref": req.external_reference_id
            },
            current_step=5
        )
        db.add(app)
        db.flush()

        # Aadhaar
        if req.aadhaar:
            av = AadhaarVerification(
                application_id=app.id,
                user_id=user.id,
                masked_aadhaar=req.aadhaar.masked or "XXXX-XXXX-1234",
                entrepreneur_name=req.applicant.name,
                is_verified=True,
                verification_ref=req.aadhaar.verification_reference or "DEMO-AADHAAR-001",
                verified_at=datetime.now(timezone.utc)
            )
            db.add(av)
            prefilled_count += 3
        else:
            missing_fields.append("aadhaar_verification")

        # PAN
        if req.pan:
            pv = PanVerification(
                application_id=app.id,
                user_id=user.id,
                has_pan="YES",
                pan_number=req.pan.number,
                name_on_pan=req.pan.name_on_pan or req.applicant.name,
                is_verified=True,
                verified_at=datetime.now(timezone.utc)
            )
            db.add(pv)
            prefilled_count += 3
        else:
            missing_fields.append("pan_verification")

        # GSTIN
        if req.gstin:
            gv = GstinVerification(
                application_id=app.id,
                has_gstin="YES",
                gstin=req.gstin,
                trade_name=req.enterprise.name,
                is_verified=True,
                verified_at=datetime.now(timezone.utc)
            )
            db.add(gv)
            prefilled_count += 2

        # Address
        if req.address:
            addr = EnterpriseAddress(
                application_id=app.id,
                enterprise_id=ent.id,
                flat_door_block=req.address.address_line_1,
                city=req.address.city,
                state=req.address.state,
                district=req.address.district,
                pincode=req.address.pincode,
                mobile=req.address.mobile or req.applicant.mobile,
                email=req.address.email or req.applicant.email
            )
            db.add(addr)
            prefilled_count += 5
        else:
            missing_fields.append("official_address")

        # Plants
        if req.plants:
            for p in req.plants:
                plant = PlantUnit(
                    application_id=app.id,
                    enterprise_id=ent.id,
                    unit_name=p.unit_name,
                    building_premises=p.building_premises,
                    address=p.address,
                    state=p.state,
                    district=p.district,
                    pincode=p.pincode,
                    business_activity=p.business_activity,
                    commencement_date=p.commencement_date
                )
                db.add(plant)
                prefilled_count += 3

        # Promoters
        if req.promoters:
            for pr in req.promoters:
                promo = Promoter(
                    application_id=app.id,
                    enterprise_id=ent.id,
                    name=pr.name,
                    role=pr.role,
                    masked_pan=pr.masked_pan,
                    ownership_share=pr.ownership_share or Decimal("100.00")
                )
                db.add(promo)
                prefilled_count += 2

        # Activities
        if req.activities:
            for act in req.activities:
                b_act = BusinessActivity(
                    application_id=app.id,
                    enterprise_id=ent.id,
                    major_activity=act.major_activity,
                    nic_code=act.activity_code or "DEMO-1071",
                    description=act.description,
                    is_primary=act.is_primary if act.is_primary is not None else True
                )
                db.add(b_act)
                prefilled_count += 3
        else:
            missing_fields.append("business_activities")

        # Financials
        calc_type = "MICRO"
        if req.financials:
            fin = FinancialDetail(
                application_id=app.id,
                enterprise_id=ent.id,
                investment=req.financials.investment,
                turnover=req.financials.turnover,
                export_turnover=req.financials.export_turnover or Decimal("0.0"),
                financial_year=req.financials.financial_year or "2024-2025"
            )
            db.add(fin)
            prefilled_count += 3

            # Classification
            calc_type, reason, _ = ClassificationService.calculate(
                db, 
                investment=req.financials.investment, 
                turnover=req.financials.turnover, 
                export_turnover=req.financials.export_turnover or Decimal("0.0")
            )
            app.enterprise_type = calc_type
            
            c_res = ClassificationResult(
                application_id=app.id,
                enterprise_type=calc_type,
                calculated_investment=req.financials.investment,
                calculated_turnover=req.financials.turnover,
                reason=reason,
                is_override=False
            )
            db.add(c_res)
        else:
            missing_fields.append("financial_details")

        missing_fields.append("employment_details")
        missing_fields.append("declaration")

        # Initial Status History
        hist = ApplicationStatusHistory(
            application_id=app.id,
            old_status=None,
            new_status=ApplicationStatus.DRAFT.value,
            changed_by_user_id=user.id,
            comments=f"Draft application created via SIH Prefill API ({req.source_system or 'SIH26130'})."
        )
        db.add(hist)

        db.commit()
        db.refresh(app)

        AuditService.log(
            db,
            action="INTEGRATION_PREFILL_CREATED",
            user_id=user.id,
            entity_type="APPLICATION",
            entity_id=str(app.id),
            details={
                "external_ref": req.external_reference_id,
                "source": req.source_system,
                "app_number": app.application_number
            }
        )

        return IntegrationPrefillResponse(
            success=True,
            application_number=app.application_number,
            external_reference_id=req.external_reference_id,
            status=ApplicationStatus.DRAFT.value,
            prefilled_fields=prefilled_count,
            missing_fields=missing_fields,
            enterprise_type_preview=calc_type
        )
