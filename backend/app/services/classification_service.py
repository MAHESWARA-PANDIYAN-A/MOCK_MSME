from decimal import Decimal
from typing import Tuple, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import ClassificationRule, EnterpriseType

DEFAULT_RULES = [
    {
        "enterprise_type": EnterpriseType.MICRO.value,
        "max_investment": Decimal("25000000.00"),  # 2.5 Crore
        "max_turnover": Decimal("100000000.00"),   # 10 Crore
        "description": "Investment <= ₹2.5 Cr and Turnover <= ₹10 Cr",
    },
    {
        "enterprise_type": EnterpriseType.SMALL.value,
        "max_investment": Decimal("250000000.00"), # 25 Crore
        "max_turnover": Decimal("1000000000.00"),  # 100 Crore
        "description": "Investment <= ₹25 Cr and Turnover <= ₹100 Cr",
    },
    {
        "enterprise_type": EnterpriseType.MEDIUM.value,
        "max_investment": Decimal("1250000000.00"), # 125 Crore
        "max_turnover": Decimal("5000000000.00"),   # 500 Crore
        "description": "Investment <= ₹125 Cr and Turnover <= ₹500 Cr",
    },
]

def seed_default_classification_rules(db: Session):
    for rule_data in DEFAULT_RULES:
        existing = db.query(ClassificationRule).filter(
            ClassificationRule.enterprise_type == rule_data["enterprise_type"]
        ).first()
        if not existing:
            new_rule = ClassificationRule(
                enterprise_type=rule_data["enterprise_type"],
                max_investment=rule_data["max_investment"],
                max_turnover=rule_data["max_turnover"],
                description=rule_data["description"],
                is_active=True,
                updated_by="SYSTEM"
            )
            db.add(new_rule)
    db.commit()

class ClassificationService:
    @staticmethod
    def get_rules(db: Session) -> List[ClassificationRule]:
        rules = db.query(ClassificationRule).filter(ClassificationRule.is_active == True).order_by(ClassificationRule.max_investment.asc()).all()
        if not rules:
            seed_default_classification_rules(db)
            rules = db.query(ClassificationRule).filter(ClassificationRule.is_active == True).order_by(ClassificationRule.max_investment.asc()).all()
        return rules

    @staticmethod
    def calculate(db: Session, investment: Decimal, turnover: Decimal, export_turnover: Decimal = Decimal("0.0")) -> Tuple[str, str, Dict[str, Any]]:
        """
        Calculates MSME classification based on configurable rules table.
        Udyam rules evaluate effective turnover (gross turnover minus export turnover where applicable).
        """
        rules = ClassificationService.get_rules(db)
        
        # Format currency for readable strings (e.g. ₹1.5 Crore)
        def format_inr(val: Decimal) -> str:
            if val >= Decimal("10000000"):
                cr = val / Decimal("10000000")
                return f"₹{cr:,.2f} Cr"
            elif val >= Decimal("100000"):
                lakh = val / Decimal("100000")
                return f"₹{lakh:,.2f} Lakh"
            return f"₹{val:,.2f}"

        effective_turnover = max(Decimal("0.0"), turnover - export_turnover)
        
        # Check tiers in ascending order: MICRO -> SMALL -> MEDIUM
        for rule in rules:
            if investment <= rule.max_investment and effective_turnover <= rule.max_turnover:
                rule_name_display = rule.enterprise_type.capitalize()
                reason = f"Investment ({format_inr(investment)}) and Turnover ({format_inr(effective_turnover)}) fall within the configured {rule_name_display} enterprise thresholds."
                return (
                    rule.enterprise_type,
                    reason,
                    {
                        "matched_rule": rule.enterprise_type,
                        "max_investment": float(rule.max_investment),
                        "max_turnover": float(rule.max_turnover),
                        "effective_turnover": float(effective_turnover),
                        "investment": float(investment)
                    }
                )

        # Exceeds Medium tier
        return (
            EnterpriseType.OUTSIDE_RANGE.value,
            f"Investment ({format_inr(investment)}) or Turnover ({format_inr(effective_turnover)}) exceeds configured MSME classification thresholds.",
            {
                "matched_rule": None,
                "effective_turnover": float(effective_turnover),
                "investment": float(investment)
            }
        )
