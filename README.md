# Udyam MSME Registration Portal — SIH26130 Prototype (Simulated)

> **IMPORTANT DISCLAIMER:**
> This is a **simulated prototype portal** created for the **SIH26130** hackathon project. It is **NOT** the official Government of India Udyam Portal. No real Government API, UIDAI, Income Tax, or GSTN systems are connected. The generated certificates are prototype simulations with no legal validity.

---

## 📌 Overview

The **Mock Udyam Portal** acts as an external simulated MSME registration service connected to the main **SIH26130 Platform**. It provides a fully paperless multi-step registration wizard, dynamic MSME classification engine, officer review console, public QR verification, and authenticated REST APIs for SIH platform interoperability.

---

## 🏛 Architecture

```
MAIN SIH PORTAL
      ↓
SIH BACKEND
      ↓ (Authenticated REST API with X-API-Key)
MOCK UDYAM BACKEND (FastAPI / PostgreSQL or SQLite)
      ↓
UDYAM APPLICANT PORTAL & OFFICER REVIEW CONSOLE (React + Vite + Tailwind CSS)
```

---

## 🚀 Key Features

1. **Applicant Portal**:
   - Multi-step 12-stage guided wizard with draft saving & state persistence
   - Simulated OTP-based Aadhaar verification (Masked Aadhaar storage only, e.g., `XXXX-XXXX-1234`)
   - Simulated PAN & GSTIN validation
   - Multi-unit management (Add 1 or more plants/warehouses)
   - Dynamic promoter/director lists
   - Configurable NIC Activity selector
   - Real-time automated MSME classification calculator
   - Digital verifiable Certificate with QR code and PDF generation
2. **Officer & Admin Console**:
   - Live dashboard metrics queried directly from database
   - Search & multi-parameter filtering (State, District, Tier, Organisation, Status)
   - Multi-tab inspection view (Aadhaar, PAN, Units, Financials, Audit)
   - Workflow actions: `APPROVE` (generates `UDYAM-TN-00-XXXXXXX`), `RETURN_FOR_CORRECTION` (mandatory comment), `REJECT`
   - Configurable database-driven MSME classification rules management
   - System audit trail and SIH integration request logs
3. **SIH Integration REST API**:
   - `POST /api/integrations/v1/applications/prefill`: Pre-populates drafts from SIH data without duplicate entry
   - `GET /api/integrations/v1/applications/{application_number}/status`: Polls status, last update, and pending actions
   - `GET /api/integrations/v1/applications/{application_number}`: Retrieves complete application record
   - `POST /api/integrations/v1/applications/{application_number}/submit`: Submits pre-filled application
   - `Idempotency-Key` and `external_reference_id` deduplication support
4. **Public Verification**:
   - `/verify/{udyam_number}`: Public validation screen verifying active simulated certificate

---

## ⚙️ Configuration & Environment Variables

### Backend (`backend/.env`)
```ini
DATABASE_URL=sqlite:///./udyam_mock.db
JWT_SECRET=sih26130_mock_udyam_secure_jwt_secret_key_2026_xyz
MOCK_UDYAM_API_KEY=demo-secret-sih26130-udyam-key
FRONTEND_URL=http://localhost:5174
MAIN_SIH_PORTAL_URL=http://localhost:3000
MOCK_OTP=123456
CERTIFICATE_OUTPUT_DIR=./generated
```

### Frontend (`frontend/.env`)
```ini
VITE_API_BASE_URL=http://localhost:8001/api
```

---

## 🔑 Demo Credentials

| Role | Email / Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Applicant** | `rahul@example.com` | `Applicant@123` | Demo Applicant (ABC Foods Pvt Ltd) |
| **Officer** | `priya.officer@example.com` | `Officer@123` | Government Review Officer (Salem MSME) |
| **Admin** | `admin@msme.example.com` | `Admin@123` | Full Administrative & Rules Access |
| **Demo OTP** | `123456` | — | Simulated OTP for mobile/Aadhaar |

---

## 🧮 MSME Classification Rules (Configurable)

| Tier | Max Investment (Plant & Machinery) | Max Turnover (Net) |
| :--- | :--- | :--- |
| **MICRO** | ≤ ₹2.50 Crore (`₹25,000,000`) | ≤ ₹10.00 Crore (`₹100,000,000`) |
| **SMALL** | ≤ ₹25.00 Crore (`₹250,000,000`) | ≤ ₹100.00 Crore (`₹1,000,000,000`) |
| **MEDIUM** | ≤ ₹125.00 Crore (`₹1,250,000,000`) | ≤ ₹500.00 Crore (`₹5,000,000,000`) |

---

## 🛠 Running the Application

### 1. Run Backend (Port 8001)
```bash
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

### 2. Run Frontend (Port 5174)
```bash
cd frontend
npm run dev
```

- **Frontend Portal**: [http://localhost:5174](http://localhost:5174)
- **Backend API & Swagger**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **Health Check**: [http://localhost:8001/api/health](http://localhost:8001/api/health)

---

## 💻 cURL Integration Examples

### 1. Pre-fill Application Draft
```bash
curl -X POST http://localhost:8001/api/integrations/v1/applications/prefill \
  -H "X-API-Key: demo-secret-sih26130-udyam-key" \
  -H "Content-Type: application/json" \
  -d '{
    "external_reference_id": "SIH-APP-1001",
    "source_system": "SIH26130",
    "applicant": {
      "name": "Rahul Kumar",
      "mobile": "9876543210",
      "email": "rahul@example.com"
    },
    "aadhaar": {
      "verification_reference": "DEMO-AADHAAR-001",
      "masked": "XXXX-XXXX-1234"
    },
    "pan": {
      "number": "ABCDE1234F"
    },
    "gstin": "33ABCDE1234F1Z1",
    "enterprise": {
      "name": "ABC Foods Pvt Ltd",
      "organisation_type": "PRIVATE_LIMITED",
      "date_of_incorporation": "2026-01-10",
      "date_of_commencement": "2026-03-01"
    },
    "address": {
      "address_line_1": "Example Industrial Estate",
      "city": "Salem",
      "state": "Tamil Nadu",
      "district": "Salem",
      "pincode": "636001"
    },
    "activities": [
      {
        "major_activity": "MANUFACTURING",
        "description": "Packaged Snack Manufacturing",
        "activity_code": "DEMO-1071"
      }
    ],
    "financials": {
      "investment": 15000000,
      "turnover": 60000000,
      "export_turnover": 0
    }
  }'
```

### 2. Retrieve Status
```bash
curl -X GET http://localhost:8001/api/integrations/v1/applications/UDYAM-MOCK-2026-000123/status \
  -H "X-API-Key: demo-secret-sih26130-udyam-key"
```

### 3. Submit Integration Application
```bash
curl -X POST http://localhost:8001/api/integrations/v1/applications/UDYAM-MOCK-2026-000123/submit \
  -H "X-API-Key: demo-secret-sih26130-udyam-key"
```
