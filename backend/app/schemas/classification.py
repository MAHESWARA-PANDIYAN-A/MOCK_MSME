from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime

class ClassificationRuleBase(BaseModel):
    enterprise_type: str
    max_investment: Decimal
    max_turnover: Decimal
    description: Optional[str] = None
    is_active: bool = True

class ClassificationRuleOut(ClassificationRuleBase):
    id: int
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = "SYSTEM"

    class Config:
        from_attributes = True

class ClassificationRuleUpdate(BaseModel):
    max_investment: Decimal
    max_turnover: Decimal
    description: Optional[str] = None
    is_active: Optional[bool] = True

class ClassificationCalculateRequest(BaseModel):
    investment: Decimal = Field(..., ge=0)
    turnover: Decimal = Field(..., ge=0)
    export_turnover: Optional[Decimal] = Decimal("0.0")

class ClassificationCalculateResponse(BaseModel):
    enterprise_type: str
    calculated_investment: Decimal
    calculated_turnover: Decimal
    reason: str
    is_within_msme: bool
    threshold_info: dict
