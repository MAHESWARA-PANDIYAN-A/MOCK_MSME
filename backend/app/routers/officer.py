from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.models.models import (
    User, Application, Enterprise, Applicant, EnterpriseAddress,
    PlantUnit, BusinessActivity, ApplicationStatus, EnterpriseType,
    AuditLog
)
from app.schemas.application import (
    ApplicationOut, OfficerReviewAction
)
from app.services.application_service import ApplicationService
from app.services.audit_service import AuditService
from app.routers.deps import get_current_officer_or_admin

router = APIRouter(prefix="/officer", tags=["Officer / Admin Portal"])

@router.get("/dashboard")
def get_officer_dashboard(
    officer: User = Depends(get_current_officer_or_admin),
    db: Session = Depends(get_db)
):
    total = db.query(Application).count()
    submitted = db.query(Application).filter(Application.status == ApplicationStatus.SUBMITTED.value).count()
    under_verif = db.query(Application).filter(Application.status == ApplicationStatus.UNDER_VERIFICATION.value).count()
    correction = db.query(Application).filter(Application.status == ApplicationStatus.CORRECTION_REQUIRED.value).count()
    approved = db.query(Application).filter(Application.status == ApplicationStatus.APPROVED.value).count()
    rejected = db.query(Application).filter(Application.status == ApplicationStatus.REJECTED.value).count()
    drafts = db.query(Application).filter(Application.status == ApplicationStatus.DRAFT.value).count()

    # Enterprise classification distribution
    micro_cnt = db.query(Application).filter(Application.enterprise_type == EnterpriseType.MICRO.value).count()
    small_cnt = db.query(Application).filter(Application.enterprise_type == EnterpriseType.SMALL.value).count()
    medium_cnt = db.query(Application).filter(Application.enterprise_type == EnterpriseType.MEDIUM.value).count()

    return {
        "stats": {
            "total_registrations": total,
            "new_submitted": submitted,
            "under_verification": under_verif,
            "correction_required": correction,
            "approved": approved,
            "rejected": rejected,
            "drafts": drafts
        },
        "breakdown": {
            "MICRO": micro_cnt,
            "SMALL": small_cnt,
            "MEDIUM": medium_cnt
        }
    }

@router.get("/applications")
def list_officer_applications(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    state_filter: Optional[str] = Query(None, alias="state"),
    district_filter: Optional[str] = Query(None, alias="district"),
    enterprise_type_filter: Optional[str] = Query(None, alias="enterprise_type"),
    organisation_type_filter: Optional[str] = Query(None, alias="organisation_type"),
    major_activity_filter: Optional[str] = Query(None, alias="major_activity"),
    search: Optional[str] = Query(None),
    officer: User = Depends(get_current_officer_or_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Application).join(Enterprise, Application.enterprise_id == Enterprise.id, isouter=True)
    
    if status_filter and status_filter != "ALL":
        query = query.filter(Application.status == status_filter)
        
    if enterprise_type_filter and enterprise_type_filter != "ALL":
        query = query.filter(Application.enterprise_type == enterprise_type_filter)

    if organisation_type_filter and organisation_type_filter != "ALL":
        query = query.filter(Enterprise.organisation_type == organisation_type_filter)

    if state_filter and state_filter != "ALL":
        query = query.join(EnterpriseAddress, Application.id == EnterpriseAddress.application_id, isouter=True)\
                     .filter(EnterpriseAddress.state == state_filter)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.join(Applicant, Application.applicant_id == Applicant.id, isouter=True)\
                     .filter(
                         or_(
                             Application.application_number.ilike(term),
                             Application.udyam_registration_number.ilike(term),
                             Enterprise.name.ilike(term),
                             Applicant.full_name.ilike(term),
                             Enterprise.pan_number.ilike(term)
                         )
                     )

    total_count = query.count()
    offset = (page - 1) * limit
    apps = query.order_by(desc(Application.updated_at)).offset(offset).limit(limit).all()

    items = []
    for a in apps:
        ent_name = a.enterprise.name if a.enterprise else "Untitled"
        applicant_name = a.applicant.full_name if a.applicant else (a.user.full_name if a.user else "—")
        st = a.address.state if a.address else (a.plants[0].state if a.plants else "—")
        dist = a.address.district if a.address else (a.plants[0].district if a.plants else "—")
        act = a.activities[0].major_activity if a.activities else "—"

        items.append({
            "id": a.id,
            "application_number": a.application_number,
            "enterprise_name": ent_name,
            "applicant_name": applicant_name,
            "state": st,
            "district": dist,
            "major_activity": act,
            "enterprise_type": a.enterprise_type,
            "organisation_type": a.enterprise.organisation_type if a.enterprise else None,
            "submission_date": a.submission_date,
            "status": a.status,
            "udyam_registration_number": a.udyam_registration_number,
            "prefilled_from_sih": a.prefilled_from_sih,
            "created_at": a.created_at
        })

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit,
        "items": items
    }

@router.get("/applications/{application_id}", response_model=ApplicationOut)
def get_officer_application_detail(
    application_id: int,
    officer: User = Depends(get_current_officer_or_admin),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app

@router.post("/applications/{application_id}/start-verification")
def start_verification(
    application_id: int,
    officer: User = Depends(get_current_officer_or_admin),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if app.status == ApplicationStatus.SUBMITTED.value:
        app.status = ApplicationStatus.UNDER_VERIFICATION.value
        db.commit()
        db.refresh(app)
        
        AuditService.log(
            db,
            action="VERIFICATION_STARTED",
            user_id=officer.id,
            entity_type="APPLICATION",
            entity_id=str(app.id),
            details={"officer": officer.full_name}
        )

    return {"success": True, "status": app.status}

@router.post("/applications/{application_id}/review")
async def officer_review(
    application_id: int,
    action_data: OfficerReviewAction,
    officer: User = Depends(get_current_officer_or_admin),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    success, msg, reviewed_app = await ApplicationService.process_officer_review(
        db=db,
        application=app,
        action=action_data.action,
        comments=action_data.comments,
        officer=officer
    )

    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    return {
        "success": True,
        "message": msg,
        "status": reviewed_app.status,
        "udyam_registration_number": reviewed_app.udyam_registration_number
    }
