from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings
from app.models.models import User, Applicant, UserRole
from app.schemas.auth import (
    UserRegister, UserLogin, Token, UserOut, SendOtpRequest, VerifyOtpRequest
)
from app.services.audit_service import AuditService
from app.routers.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if data.password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    existing = db.query(User).filter(
        or_(User.email == data.email.lower(), User.mobile == data.mobile)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email or mobile number already exists."
        )

    new_user = User(
        email=data.email.lower(),
        mobile=data.mobile,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        role=UserRole.APPLICANT.value,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # Create Applicant Profile
    applicant = Applicant(
        user_id=new_user.id,
        full_name=new_user.full_name,
        mobile=new_user.mobile,
        email=new_user.email
    )
    db.add(applicant)
    db.commit()
    db.refresh(new_user)

    AuditService.log(
        db,
        action="USER_REGISTERED",
        user_id=new_user.id,
        entity_type="USER",
        entity_id=str(new_user.id),
        details={"email": new_user.email, "role": new_user.role}
    )

    access_token = create_access_token(subject=new_user.id, role=new_user.role)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email,
        role=new_user.role
    )

@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    identifier = data.email_or_mobile.strip().lower()
    user = db.query(User).filter(
        or_(User.email == identifier, User.mobile == identifier)
    ).first()

    if not user or not verify_password(data.password, user.hashed_password):
        AuditService.log(
            db,
            action="LOGIN_FAILED",
            user_id=user.id if user else None,
            entity_type="USER",
            details={"identifier": identifier}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your email/mobile and password."
        )

    AuditService.log(
        db,
        action="LOGIN_SUCCESS",
        user_id=user.id,
        entity_type="USER",
        entity_id=str(user.id),
        details={"role": user.role}
    )

    access_token = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role
    )

@router.post("/send-otp")
def send_otp(data: SendOtpRequest):
    return {
        "success": True,
        "message": f"Simulated OTP sent successfully. (Demo OTP: {settings.MOCK_OTP})",
        "demo_otp": settings.MOCK_OTP,
        "expires_in_seconds": 300
    }

@router.post("/verify-otp")
def verify_otp(data: VerifyOtpRequest):
    if data.otp.strip() == settings.MOCK_OTP:
        return {
            "success": True,
            "message": "OTP verified successfully."
        }
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Invalid OTP. Please enter '{settings.MOCK_OTP}' for this prototype demo."
    )

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
