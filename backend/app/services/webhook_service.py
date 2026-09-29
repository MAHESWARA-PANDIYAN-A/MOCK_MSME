import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class WebhookService:
    @staticmethod
    async def dispatch_status_change(
        application_number: str,
        external_reference_id: Optional[str],
        old_status: Optional[str],
        new_status: str,
        webhook_url: Optional[str] = None
    ):
        target_url = webhook_url or settings.WEBHOOK_URL
        if not target_url:
            return
        
        payload = {
            "event": "UDYAM_APPLICATION_STATUS_CHANGED",
            "application_number": application_number,
            "external_reference_id": external_reference_id,
            "old_status": old_status,
            "new_status": new_status,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(target_url, json=payload)
                logger.info(f"Webhook dispatched to {target_url}, status: {response.status_code}")
        except Exception as e:
            logger.warning(f"Webhook notification to {target_url} failed: {str(e)}")
