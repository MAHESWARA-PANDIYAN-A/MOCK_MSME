from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from decimal import Decimal

from app.core.database import get_db
from app.models.models import User, Application, Notification, ApplicationStatus
from app.schemas.application import (
    ApplicationOut, ApplicationListOut, ApplicationDraftSave,
    ApplicationSubmitRequest, NotificationOut
)
from app.schemas.classification import (
    ClassificationCalculateRequest, ClassificationCalculateResponse
)
from app.services.application_service import ApplicationService
from app.services.classification_service import ClassificationService
from app.routers.deps import get_current_user

router = APIRouter(prefix="/applications", tags=["Applicant Applications"])

@router.get("/draft", response_model=ApplicationOut)
def get_or_create_draft(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = ApplicationService.get_or_create_draft(db, current_user)
    return app

@router.put("/{application_id}/draft", response_model=ApplicationOut)
def save_draft(
    application_id: int,
    data: ApplicationDraftSave,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()

    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if app.status not in [ApplicationStatus.DRAFT.value, ApplicationStatus.CORRECTION_REQUIRED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit application in '{app.status}' status"
        )

    updated_app = ApplicationService.save_draft(db, app, data, current_user)
    return updated_app

@router.post("/{application_id}/submit")
async def submit_application(
    application_id: int,
    data: ApplicationSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()

    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if not data.is_declared or not data.simulated_confirmation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must accept all required declarations and prototype terms before submitting."
        )

    success, msg, submitted_app = await ApplicationService.submit_application(db, app, current_user)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    return {
        "success": True,
        "message": "Registration submitted successfully.",
        "application_number": submitted_app.application_number,
        "status": submitted_app.status,
        "enterprise_type": submitted_app.enterprise_type
    }

@router.get("/my")
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apps = db.query(Application).filter(Application.user_id == current_user.id).order_by(Application.created_at.desc()).all()
    
    # Calculate counts dynamically from DB
    counts = {
        "DRAFT": 0,
        "SUBMITTED": 0,
        "UNDER_VERIFICATION": 0,
        "CORRECTION_REQUIRED": 0,
        "APPROVED": 0,
        "REJECTED": 0,
        "TOTAL": len(apps)
    }
    
    app_list = []
    for a in apps:
        status_key = a.status
        if status_key in counts:
            counts[status_key] += 1
        
        ent_name = a.enterprise.name if a.enterprise else "Draft Enterprise"
        applicant_name = a.applicant.full_name if a.applicant else current_user.full_name
        st = a.address.state if a.address else (a.plants[0].state if a.plants else "—")
        dist = a.address.district if a.address else (a.plants[0].district if a.plants else "—")
        act = a.activities[0].major_activity if a.activities else "—"

        app_list.append({
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
        "counts": counts,
        "applications": app_list
    }

@router.get("/{application_id}", response_model=ApplicationOut)
def get_application_detail(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()

    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app

@router.get("/notifications/list", response_model=List[NotificationOut])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(30).all()
    return notifs

@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"success": True}

@router.post("/classification/calculate-preview", response_model=ClassificationCalculateResponse)
def calculate_classification_preview(
    data: ClassificationCalculateRequest,
    db: Session = Depends(get_db)
):
    etype, reason, info = ClassificationService.calculate(
        db,
        investment=data.investment,
        turnover=data.turnover,
        export_turnover=data.export_turnover or Decimal("0.0")
    )
    return ClassificationCalculateResponse(
        enterprise_type=etype,
        calculated_investment=data.investment,
        calculated_turnover=data.turnover,
        reason=reason,
        is_within_msme=(etype != "OUTSIDE_RANGE"),
        threshold_info=info
    )
