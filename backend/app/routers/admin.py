from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.models import User, ClassificationRule, AuditLog, IntegrationRequest
from app.schemas.classification import ClassificationRuleOut, ClassificationRuleUpdate
from app.services.audit_service import AuditService
from app.routers.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Administrator Settings"])

@router.get("/classification-rules", response_model=List[ClassificationRuleOut])
def get_classification_rules(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    rules = db.query(ClassificationRule).order_by(ClassificationRule.max_investment.asc()).all()
    return rules

@router.put("/classification-rules/{rule_id}", response_model=ClassificationRuleOut)
def update_classification_rule(
    rule_id: int,
    data: ClassificationRuleUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    rule = db.query(ClassificationRule).filter(ClassificationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classification rule not found")

    old_inv = float(rule.max_investment)
    old_turn = float(rule.max_turnover)

    rule.max_investment = data.max_investment
    rule.max_turnover = data.max_turnover
    if data.description is not None:
        rule.description = data.description
    if data.is_active is not None:
        rule.is_active = data.is_active
    rule.updated_by = admin.full_name

    db.commit()
    db.refresh(rule)

    AuditService.log(
        db,
        action="CLASSIFICATION_RULE_UPDATED",
        user_id=admin.id,
        entity_type="CLASSIFICATION_RULE",
        entity_id=str(rule.id),
        details={
            "enterprise_type": rule.enterprise_type,
            "old_max_investment": old_inv,
            "new_max_investment": float(rule.max_investment),
            "old_max_turnover": old_turn,
            "new_max_turnover": float(rule.max_turnover)
        }
    )

    return rule

@router.get("/audit-logs")
def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    action: Optional[str] = Query(None),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    
    total = query.count()
    logs = query.order_by(desc(AuditLog.created_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": [
            {
                "id": l.id,
                "user_id": l.user_id,
                "user_name": l.user.full_name if l.user else "SYSTEM",
                "action": l.action,
                "entity_type": l.entity_type,
                "entity_id": l.entity_id,
                "details": l.details,
                "created_at": l.created_at
            }
            for l in logs
        ]
    }

@router.get("/integration-logs")
def get_integration_logs(
    limit: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    reqs = db.query(IntegrationRequest).order_by(desc(IntegrationRequest.created_at)).limit(limit).all()
    return [
        {
            "id": r.id,
            "endpoint": r.endpoint,
            "external_reference_id": r.external_reference_id,
            "idempotency_key": r.idempotency_key,
            "response_status": r.response_status,
            "created_at": r.created_at
        }
        for r in reqs
    ]
