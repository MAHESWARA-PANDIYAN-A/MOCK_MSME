import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.services.classification_service import ClassificationService, seed_default_classification_rules
from app.models.models import Application, User, ApplicationStatus, EnterpriseType
from app.core.security import create_access_token

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_udyam.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_default_classification_rules(db)
    
    # Create test users
    from app.core.security import get_password_hash
    u_app = User(email="test.applicant@example.com", mobile="9876543201", hashed_password=get_password_hash("Pass@123"), full_name="Test Applicant", role="APPLICANT")
    u_off = User(email="test.officer@example.com", mobile="9876543202", hashed_password=get_password_hash("Pass@123"), full_name="Test Officer", role="OFFICER")
    u_adm = User(email="test.admin@example.com", mobile="9876543203", hashed_password=get_password_hash("Pass@123"), full_name="Test Admin", role="ADMIN")
    db.add_all([u_app, u_off, u_adm])
    db.commit()
    db.close()
    
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_classification_engine_thresholds():
    db = TestingSessionLocal()
    try:
        # Test 1: Investment = ₹1 Cr (10M), Turnover = ₹5 Cr (50M) -> MICRO (thresholds: 2.5 Cr / 10 Cr)
        t1, r1, _ = ClassificationService.calculate(db, Decimal("10000000"), Decimal("50000000"))
        assert t1 == EnterpriseType.MICRO.value, f"Expected MICRO, got {t1}"

        # Test 2: Investment = ₹5 Cr (50M), Turnover = ₹20 Cr (200M) -> SMALL (thresholds: 25 Cr / 100 Cr)
        t2, r2, _ = ClassificationService.calculate(db, Decimal("50000000"), Decimal("200000000"))
        assert t2 == EnterpriseType.SMALL.value, f"Expected SMALL, got {t2}"

        # Test 3: Investment = ₹50 Cr (500M), Turnover = ₹200 Cr (2000M) -> MEDIUM (thresholds: 125 Cr / 500 Cr)
        t3, r3, _ = ClassificationService.calculate(db, Decimal("500000000"), Decimal("2000000000"))
        assert t3 == EnterpriseType.MEDIUM.value, f"Expected MEDIUM, got {t3}"

        # Test 4: Above medium threshold (Investment = ₹150 Cr) -> OUTSIDE_RANGE
        t4, r4, _ = ClassificationService.calculate(db, Decimal("1500000000"), Decimal("6000000000"))
        assert t4 == EnterpriseType.OUTSIDE_RANGE.value, f"Expected OUTSIDE_RANGE, got {t4}"
    finally:
        db.close()

def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "mock-udyam-portal"

def test_integration_prefill_api_auth():
    # Without key
    res_no_key = client.post("/api/integrations/v1/applications/prefill", json={})
    assert res_no_key.status_code == 401

    # With invalid key
    res_bad_key = client.post(
        "/api/integrations/v1/applications/prefill",
        headers={"X-API-Key": "wrong-key"},
        json={}
    )
    assert res_bad_key.status_code == 401

def test_integration_prefill_and_idempotency():
    payload = {
        "external_reference_id": "SIH-TEST-IDEMP-01",
        "source_system": "SIH26130",
        "applicant": {
            "name": "Kavitha",
            "mobile": "9876543288",
            "email": "kavitha@example.com"
        },
        "aadhaar": {
            "verification_reference": "DEMO-AADHAAR-88",
            "masked": "XXXX-XXXX-8888"
        },
        "pan": {
            "number": "ABCDE8888F"
        },
        "gstin": "33ABCDE8888F1Z1",
        "enterprise": {
            "name": "Kavitha Agro Products",
            "organisation_type": "PRIVATE_LIMITED",
            "date_of_incorporation": "2026-01-10",
            "date_of_commencement": "2026-03-01"
        },
        "address": {
            "address_line_1": "Plot 88",
            "city": "Salem",
            "state": "Tamil Nadu",
            "district": "Salem",
            "pincode": "636001"
        },
        "activities": [
            {
                "major_activity": "MANUFACTURING",
                "description": "Agro Processing",
                "activity_code": "DEMO-1071"
            }
        ],
        "financials": {
            "investment": 15000000,
            "turnover": 60000000,
            "export_turnover": 0
        }
    }

    # First call with Idempotency-Key
    res1 = client.post(
        "/api/integrations/v1/applications/prefill",
        headers={"X-API-Key": "demo-secret-sih26130-udyam-key", "Idempotency-Key": "IDEMP-KEY-12345"},
        json=payload
    )
    assert res1.status_code == 200
    app_num1 = res1.json()["application_number"]

    # Second call with same Idempotency-Key
    res2 = client.post(
        "/api/integrations/v1/applications/prefill",
        headers={"X-API-Key": "demo-secret-sih26130-udyam-key", "Idempotency-Key": "IDEMP-KEY-12345"},
        json=payload
    )
    assert res2.status_code == 200
    assert res2.json()["application_number"] == app_num1

def test_rbac_authorization():
    token_applicant = create_access_token(subject=1, role="APPLICANT")
    token_officer = create_access_token(subject=2, role="OFFICER")
    token_admin = create_access_token(subject=3, role="ADMIN")

    # 1. Applicant cannot access Officer Dashboard
    res_app_off = client.get(
        "/api/officer/dashboard",
        headers={"Authorization": f"Bearer {token_applicant}"}
    )
    assert res_app_off.status_code == 403

    # 2. Officer CAN access Officer Dashboard
    res_off = client.get(
        "/api/officer/dashboard",
        headers={"Authorization": f"Bearer {token_officer}"}
    )
    assert res_off.status_code == 200

    # 3. Officer CANNOT access Admin classification rules modification
    res_off_admin = client.put(
        "/api/admin/classification-rules/1",
        headers={"Authorization": f"Bearer {token_officer}"},
        json={"max_investment": 30000000, "max_turnover": 120000000}
    )
    assert res_off_admin.status_code == 403

    # 4. Admin CAN access Admin rules
    res_adm = client.get(
        "/api/admin/classification-rules",
        headers={"Authorization": f"Bearer {token_admin}"}
    )
    assert res_adm.status_code == 200

def test_officer_review_workflow_and_approval():
    token_officer = create_access_token(subject=2, role="OFFICER")

    # 1. Prefill an app
    res = client.post(
        "/api/integrations/v1/applications/prefill",
        headers={"X-API-Key": "demo-secret-sih26130-udyam-key"},
        json={
            "external_reference_id": "SIH-REV-01",
            "applicant": {"name": "Prakash", "mobile": "9876543277", "email": "prakash@example.com"},
            "aadhaar": {"verification_reference": "DEMO-77", "masked": "XXXX-XXXX-7777"},
            "pan": {"number": "ABCDE7777F"},
            "enterprise": {"name": "Prakash Foods", "organisation_type": "PROPRIETORSHIP"},
            "address": {"city": "Salem", "state": "Tamil Nadu", "district": "Salem", "pincode": "636001"},
            "activities": [{"major_activity": "MANUFACTURING", "description": "Bakery", "activity_code": "DEMO-1071"}],
            "financials": {"investment": 10000000, "turnover": 40000000}
        }
    )
    app_num = res.json()["application_number"]

    # Submit
    client.post(
        f"/api/integrations/v1/applications/{app_num}/submit",
        headers={"X-API-Key": "demo-secret-sih26130-udyam-key"}
    )

    db = TestingSessionLocal()
    app_obj = db.query(Application).filter(Application.application_number == app_num).first()
    app_id = app_obj.id
    db.close()

    # 2. Officer returns for correction
    res_corr = client.post(
        f"/api/officer/applications/{app_id}/review",
        headers={"Authorization": f"Bearer {token_officer}"},
        json={"action": "RETURN_FOR_CORRECTION", "comments": "Please verify your plant PIN code"}
    )
    assert res_corr.status_code == 200
    assert res_corr.json()["status"] == "CORRECTION_REQUIRED"

    # 3. Resubmit
    client.post(
        f"/api/integrations/v1/applications/{app_num}/submit",
        headers={"X-API-Key": "demo-secret-sih26130-udyam-key"}
    )

    # 4. Officer Approves
    res_appr = client.post(
        f"/api/officer/applications/{app_id}/review",
        headers={"Authorization": f"Bearer {token_officer}"},
        json={"action": "APPROVE", "comments": "All compliance criteria met. Approved."}
    )
    assert res_appr.status_code == 200
    assert res_appr.json()["status"] == "APPROVED"
    udyam_no = res_appr.json()["udyam_registration_number"]
    assert udyam_no.startswith("UDYAM-TN-00-")

    # 5. Public verify works for the approved Udyam number
    res_verif = client.get(f"/api/public/verify/{udyam_no}")
    assert res_verif.status_code == 200
    assert res_verif.json()["is_valid"] is True
    assert res_verif.json()["registration_details"]["enterprise_name"] == "Prakash Foods"
