from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import AuditLog

class AuditService:
    @staticmethod
    def log(
        db: Session,
        action: str,
        user_id: Optional[int] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        # Sanitize sensitive fields from details before logging
        safe_details = {}
        if details:
            for k, v in details.items():
                if any(secret_key in k.lower() for secret_key in ["password", "otp", "api_key", "secret"]):
                    safe_details[k] = "[REDACTED]"
                elif "aadhaar" in k.lower() and isinstance(v, str) and len(v) == 12:
                    safe_details[k] = f"XXXX-XXXX-{v[-4:]}"
                else:
                    safe_details[k] = v
        
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            details=safe_details,
            ip_address=ip_address
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
