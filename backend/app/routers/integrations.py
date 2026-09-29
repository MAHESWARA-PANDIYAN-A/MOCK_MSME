from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.models import Application, IntegrationRequest, IdempotencyRecord
from app.schemas.integration import (
    IntegrationPrefillRequest, IntegrationPrefillResponse,
    IntegrationStatusResponse, PendingAction
)
from app.schemas.application import ApplicationOut
from app.services.application_service import ApplicationService
from app.routers.deps import verify_api_key

router = APIRouter(prefix="/integrations/v1/applications", tags=["SIH Integration REST APIs"])

@router.post("/prefill", response_model=IntegrationPrefillResponse)
def prefill_application(
    data: IntegrationPrefillRequest,
    api_key: str = Depends(verify_api_key),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db)
):
    # Check Idempotency
    if idempotency_key:
        cached_idemp = db.query(IdempotencyRecord).filter(
            IdempotencyRecord.idempotency_key == idempotency_key
        ).first()
        if cached_idemp:
            return cached_idemp.response_data

    res = ApplicationService.handle_sih_prefill(db, data)
    
    # Save Idempotency if provided
    if idempotency_key:
        idemp = IdempotencyRecord(
            idempotency_key=idempotency_key,
            resource_type="APPLICATION",
            resource_id=res.application_number,
            response_data=res.model_dump()
        )
        db.add(idemp)

    # Save Integration Request Log
    log_req = IntegrationRequest(
        endpoint="/api/integrations/v1/applications/prefill",
        external_reference_id=data.external_reference_id,
        idempotency_key=idempotency_key,
        request_payload=data.model_dump(mode="json"),
        response_status=200,
        response_payload=res.model_dump(mode="json")
    )
    db.add(log_req)
    db.commit()

    return res

@router.get("/{application_number}/status", response_model=IntegrationStatusResponse)
def get_integration_application_status(
    application_number: str,
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        Application.application_number == application_number
    ).first()

    if not app:
        # Check by external_reference_id as fallback
        app = db.query(Application).filter(
            Application.external_reference_id == application_number
        ).first()

    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    pending_actions = []
    if app.status == "CORRECTION_REQUIRED":
        # Find latest correction comment
        latest_hist = app.status_history[0] if app.status_history else None
        msg = latest_hist.comments if latest_hist and latest_hist.comments else "Please update the required application fields."
        pending_actions.append(PendingAction(type="CORRECTION", message=msg))

    return IntegrationStatusResponse(
        application_number=app.application_number,
        external_reference_id=app.external_reference_id,
        status=app.status,
        udyam_registration_number=app.udyam_registration_number,
        last_updated_at=app.updated_at,
        enterprise_type=app.enterprise_type,
        pending_actions=pending_actions
    )

@router.get("/{application_number}", response_model=ApplicationOut)
def get_integration_application_detail(
    application_number: str,
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        Application.application_number == application_number
    ).first()

    if not app:
        app = db.query(Application).filter(
            Application.external_reference_id == application_number
        ).first()

    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    return app

@router.post("/{application_number}/submit")
async def submit_integration_application(
    application_number: str,
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        Application.application_number == application_number
    ).first()

    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    success, msg, submitted_app = await ApplicationService.submit_application(db, app, user=None)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    return {
        "success": True,
        "application_number": submitted_app.application_number,
        "status": submitted_app.status,
        "enterprise_type_preview": submitted_app.enterprise_type,
        "message": msg
    }

@router.get("/schema", tags=["SIH Integration REST APIs"])
def get_dynamic_form_schema():
    """
    Returns the dynamic JSON form schema for Udyam MSME Registration.
    The Main SIH website calls this endpoint to dynamically render input fields,
    validation rules, and dropdown options without hardcoding form structures.
    """
    return {
        "portal": "Udyam MSME Registration Portal (Simulated)",
        "version": "v1",
        "service_code": "MOCK_UDYAM_MSME",
        "supported_methods": [
            "METHOD_1_PREFILL_DRAFT",
            "METHOD_2_HEADLESS_DIRECT_SUBMISSION"
        ],
        "sections": [
            {
                "section_id": "entrepreneur_identity",
                "title": "Entrepreneur Identity & Verifications",
                "description": "Paperless simulated Aadhaar & PAN verification",
                "fields": [
                    {
                        "name": "applicant_name",
                        "label": "Full Name of Entrepreneur",
                        "type": "text",
                        "required": True,
                        "placeholder": "e.g. Rahul Kumar"
                    },
                    {
                        "name": "mobile",
                        "label": "Mobile Number",
                        "type": "tel",
                        "required": True,
                        "pattern": "^[6-9]\\d{9}$",
                        "placeholder": "10-digit mobile number"
                    },
                    {
                        "name": "email",
                        "label": "Email Address",
                        "type": "email",
                        "required": True,
                        "placeholder": "e.g. rahul@example.com"
                    },
                    {
                        "name": "aadhaar_number",
                        "label": "Aadhaar Number (12 Digits)",
                        "type": "text",
                        "required": True,
                        "pattern": "^\\d{12}$",
                        "placeholder": "123456789012",
                        "note": "Simulated OTP: 123456. Full Aadhaar is never saved in DB."
                    },
                    {
                        "name": "pan_number",
                        "label": "Permanent Account Number (PAN)",
                        "type": "text",
                        "required": True,
                        "pattern": "^[A-Z]{5}[0-9]{4}[A-Z]{1}$",
                        "placeholder": "ABCDE1234F"
                    },
                    {
                        "name": "gstin",
                        "label": "GSTIN (If Applicable)",
                        "type": "text",
                        "required": False,
                        "placeholder": "33ABCDE1234F1Z1"
                    }
                ]
            },
            {
                "section_id": "enterprise_details",
                "title": "Enterprise & Business Activity",
                "description": "Enterprise classification and operational categorization",
                "fields": [
                    {
                        "name": "enterprise_name",
                        "label": "Name of Enterprise / Unit",
                        "type": "text",
                        "required": True,
                        "placeholder": "e.g. ABC Foods Pvt Ltd"
                    },
                    {
                        "name": "organisation_type",
                        "label": "Type of Organisation",
                        "type": "select",
                        "required": True,
                        "default": "PROPRIETORSHIP",
                        "options": [
                            {"value": "PROPRIETORSHIP", "label": "Proprietorship"},
                            {"value": "PARTNERSHIP", "label": "Partnership"},
                            {"value": "LLP", "label": "Limited Liability Partnership (LLP)"},
                            {"value": "PRIVATE_LIMITED", "label": "Private Limited Company"},
                            {"value": "PUBLIC_LIMITED", "label": "Public Limited Company"}
                        ]
                    },
                    {
                        "name": "major_activity",
                        "label": "Major Business Activity",
                        "type": "select",
                        "required": True,
                        "default": "MANUFACTURING",
                        "options": [
                            {"value": "MANUFACTURING", "label": "Manufacturing"},
                            {"value": "SERVICES", "label": "Services"},
                            {"value": "TRADING", "label": "Trading"},
                            {"value": "MANUFACTURING_AND_SERVICES", "label": "Manufacturing & Services"}
                        ]
                    },
                    {
                        "name": "nic_code",
                        "label": "NIC Activity Code",
                        "type": "select",
                        "required": True,
                        "default": "DEMO-1071",
                        "options": [
                            {"value": "DEMO-1071", "label": "[DEMO-1071] Food Processing — Bakery, Sweets & Packaged Snacks"},
                            {"value": "DEMO-1079", "label": "[DEMO-1079] Food Processing — Spices, Edible Oils & Sauces"},
                            {"value": "DEMO-1312", "label": "[DEMO-1312] Textiles — Weaving, Fabrics & Garments"},
                            {"value": "DEMO-2592", "label": "[DEMO-2592] Engineering — Machining, Metal Fabrication & Precision Tools"},
                            {"value": "DEMO-6201", "label": "[DEMO-6201] Information Technology — Software Development & Web Services"},
                            {"value": "DEMO-5210", "label": "[DEMO-5210] Logistics — Warehousing, Cold Storage & Freight"}
                        ]
                    }
                ]
            },
            {
                "section_id": "location",
                "title": "Business Location",
                "description": "Physical registered plant or office address",
                "fields": [
                    {
                        "name": "address_line_1",
                        "label": "Plant / Premises Address",
                        "type": "text",
                        "required": True,
                        "placeholder": "e.g. Plot 45-B, SIDCO Industrial Estate"
                    },
                    {
                        "name": "city",
                        "label": "City / Town",
                        "type": "text",
                        "required": True,
                        "placeholder": "e.g. Salem"
                    },
                    {
                        "name": "state",
                        "label": "State",
                        "type": "select",
                        "required": True,
                        "default": "Tamil Nadu",
                        "options": [
                            {"value": "Tamil Nadu", "label": "Tamil Nadu"},
                            {"value": "Maharashtra", "label": "Maharashtra"},
                            {"value": "Karnataka", "label": "Karnataka"},
                            {"value": "Gujarat", "label": "Gujarat"},
                            {"value": "Telangana", "label": "Telangana"},
                            {"value": "Delhi", "label": "Delhi"},
                            {"value": "Kerala", "label": "Kerala"},
                            {"value": "Uttar Pradesh", "label": "Uttar Pradesh"},
                            {"value": "Andhra Pradesh", "label": "Andhra Pradesh"},
                            {"value": "Rajasthan", "label": "Rajasthan"}
                        ]
                    },
                    {
                        "name": "district",
                        "label": "District",
                        "type": "text",
                        "required": True,
                        "placeholder": "e.g. Salem"
                    },
                    {
                        "name": "pincode",
                        "label": "PIN Code",
                        "type": "text",
                        "required": True,
                        "pattern": "^[1-9][0-9]{5}$",
                        "placeholder": "e.g. 636001"
                    }
                ]
            },
            {
                "section_id": "financials",
                "title": "Investment, Turnover & MSME Classification",
                "description": "Financial figures evaluated by the automated MSME classification engine",
                "fields": [
                    {
                        "name": "investment",
                        "label": "Investment in Plant & Machinery (in ₹)",
                        "type": "number",
                        "required": True,
                        "default": 15000000,
                        "placeholder": "e.g. 15000000 (1.5 Cr)"
                    },
                    {
                        "name": "turnover",
                        "label": "Annual Turnover (in ₹)",
                        "type": "number",
                        "required": True,
                        "default": 60000000,
                        "placeholder": "e.g. 60000000 (6 Cr)"
                    },
                    {
                        "name": "export_turnover",
                        "label": "Export Turnover (Excluded from Net)",
                        "type": "number",
                        "required": False,
                        "default": 0,
                        "placeholder": "0"
                    }
                ]
            }
        ]
    }

@router.post("/direct-submit", tags=["SIH Integration REST APIs"])
async def direct_headless_submit(
    data: IntegrationPrefillRequest,
    api_key: str = Depends(verify_api_key),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db)
):
    """
    Method 2 (100% Automated / Headless Submission):
    The Main SIH platform collects inputs and submits directly in one atomic call.
    Mock Udyam creates the record, runs classification, transitions to SUBMITTED status,
    and returns the application number, calculated MSME tier, and synchronization payload.
    """
    # 1. Prefill/Create Draft
    prefill_res = ApplicationService.handle_sih_prefill(db, data)
    
    # 2. Get Application Record
    app = db.query(Application).filter(
        Application.application_number == prefill_res.application_number
    ).first()
    
    if not app:
        raise HTTPException(status_code=500, detail="Failed to initialize application record.")
    
    # 3. Direct submit
    success, msg, submitted_app = await ApplicationService.submit_application(db, app, user=None)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    
    # 4. Log integration request
    log_req = IntegrationRequest(
        endpoint="/api/integrations/v1/applications/direct-submit",
        external_reference_id=data.external_reference_id,
        idempotency_key=idempotency_key,
        request_payload=data.model_dump(mode="json"),
        response_status=200,
        response_payload={
            "success": True,
            "application_number": submitted_app.application_number,
            "status": submitted_app.status,
            "enterprise_type": submitted_app.enterprise_type
        }
    )
    db.add(log_req)
    db.commit()

    return {
        "success": True,
        "mode": "HEADLESS_AUTOMATED_SUBMIT",
        "application_number": submitted_app.application_number,
        "external_reference_id": data.external_reference_id,
        "status": submitted_app.status,
        "enterprise_type": submitted_app.enterprise_type,
        "classification_reason": submitted_app.classification_result.reason if submitted_app.classification_result else f"Evaluated as {submitted_app.enterprise_type} MSME tier.",
        "prefilled_fields": prefill_res.prefilled_fields,
        "submission_date": submitted_app.submission_date,
        "verification_summary": {
            "aadhaar_status": "SIMULATED_VERIFIED",
            "masked_aadhaar": submitted_app.aadhaar_verification.masked_aadhaar if submitted_app.aadhaar_verification else "XXXX-XXXX-1234",
            "pan_status": "SIMULATED_VERIFIED",
            "pan_number": submitted_app.pan_verification.pan_number if submitted_app.pan_verification else "ABCDE1234F"
        },
        "sync_payload": {
            "application_number": submitted_app.application_number,
            "external_reference_id": data.external_reference_id,
            "enterprise_name": data.enterprise.name,
            "enterprise_type": submitted_app.enterprise_type,
            "status": "SUBMITTED",
            "last_synced_at": datetime.now(timezone.utc).isoformat()
        },
        "message": "Udyam application created and submitted headlessly from Main SIH Portal."
    }

