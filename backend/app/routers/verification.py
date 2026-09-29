from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User, Application, AadhaarVerification, PanVerification, GstinVerification
from app.schemas.verification import (
    AadhaarOtpRequest, AadhaarOtpVerify, AadhaarVerificationOut,
    PanVerifyRequest, PanVerificationOut,
    GstinVerifyRequest, GstinVerificationOut
)
from app.services.verification_service import (
    AadhaarVerificationService, PanVerificationService, GstinVerificationService
)
from app.services.audit_service import AuditService
from app.routers.deps import get_current_user

router = APIRouter(prefix="/verification", tags=["Simulated Verifications"])

@router.post("/aadhaar/generate-otp")
def generate_aadhaar_otp(
    data: AadhaarOtpRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    res = AadhaarVerificationService.generate_otp(data.aadhaar_number, data.entrepreneur_name)
    if not res["success"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res["message"])
    
    AuditService.log(
        db,
        action="AADHAAR_OTP_REQUESTED",
        user_id=current_user.id,
        entity_type="AADHAAR",
        details={"masked": res["masked_aadhaar"]}
    )
    return res

@router.post("/aadhaar/verify-otp", response_model=AadhaarVerificationOut)
def verify_aadhaar_otp(
    data: AadhaarOtpVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    name = data.entrepreneur_name or current_user.full_name
    success, msg, details = AadhaarVerificationService.verify_otp(data.aadhaar_number, data.otp, name)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    
    # If application_id provided, persist to application
    if data.application_id:
        app = db.query(Application).filter(
            Application.id == data.application_id,
            Application.user_id == current_user.id
        ).first()
        if app:
            av = app.aadhaar_verification
            if not av:
                av = AadhaarVerification(
                    application_id=app.id,
                    user_id=current_user.id,
                    masked_aadhaar=details["masked_aadhaar"],
                    entrepreneur_name=details["entrepreneur_name"],
                    is_verified=True,
                    verification_ref=details["verification_ref"]
                )
                db.add(av)
            else:
                av.masked_aadhaar = details["masked_aadhaar"]
                av.entrepreneur_name = details["entrepreneur_name"]
                av.is_verified = True
                av.verification_ref = details["verification_ref"]
            db.commit()

    AuditService.log(
        db,
        action="AADHAAR_VERIFIED",
        user_id=current_user.id,
        entity_type="AADHAAR",
        details={"masked": details["masked_aadhaar"], "ref": details["verification_ref"]}
    )

    return AadhaarVerificationOut(
        success=True,
        masked_aadhaar=details["masked_aadhaar"],
        entrepreneur_name=details["entrepreneur_name"],
        is_verified=True,
        verification_ref=details["verification_ref"],
        message=msg
    )

@router.post("/pan/verify", response_model=PanVerificationOut)
def verify_pan(
    data: PanVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success, msg, details = PanVerificationService.verify_pan(data.pan_number, data.name_on_pan or current_user.full_name)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    if data.application_id:
        app = db.query(Application).filter(
            Application.id == data.application_id,
            Application.user_id == current_user.id
        ).first()
        if app:
            pv = app.pan_verification
            if not pv:
                pv = PanVerification(
                    application_id=app.id,
                    user_id=current_user.id,
                    has_pan=data.has_pan,
                    pan_number=details["pan_number"],
                    name_on_pan=details["name_on_pan"],
                    is_verified=True
                )
                db.add(pv)
            else:
                pv.has_pan = data.has_pan
                pv.pan_number = details["pan_number"]
                pv.name_on_pan = details["name_on_pan"]
                pv.is_verified = True
            db.commit()

    AuditService.log(
        db,
        action="PAN_VERIFIED",
        user_id=current_user.id,
        entity_type="PAN",
        details={"pan_masked": f"{details['pan_number'][:2]}***{details['pan_number'][-2:]}"}
    )

    return PanVerificationOut(
        success=True,
        pan_number=details["pan_number"],
        name_on_pan=details["name_on_pan"],
        is_verified=True,
        message=msg
    )

@router.post("/gstin/verify", response_model=GstinVerificationOut)
def verify_gstin(
    data: GstinVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.has_gstin != "YES" or not data.gstin:
        return GstinVerificationOut(
            success=True,
            has_gstin=data.has_gstin,
            gstin=None,
            trade_name=None,
            is_verified=False,
            message="GSTIN not applicable or not provided."
        )

    success, msg, details = GstinVerificationService.verify_gstin(data.gstin)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    if data.application_id:
        app = db.query(Application).filter(
            Application.id == data.application_id,
            Application.user_id == current_user.id
        ).first()
        if app:
            gv = app.gstin_verification
            if not gv:
                gv = GstinVerification(
                    application_id=app.id,
                    has_gstin="YES",
                    gstin=details["gstin"],
                    trade_name=details["trade_name"],
                    is_verified=True
                )
                db.add(gv)
            else:
                gv.has_gstin = "YES"
                gv.gstin = details["gstin"]
                gv.trade_name = details["trade_name"]
                gv.is_verified = True
            db.commit()

    AuditService.log(
        db,
        action="GSTIN_VERIFIED",
        user_id=current_user.id,
        entity_type="GSTIN",
        details={"gstin": details["gstin"]}
    )

    return GstinVerificationOut(
        success=True,
        has_gstin="YES",
        gstin=details["gstin"],
        trade_name=details["trade_name"],
        is_verified=True,
        message=msg
    )
