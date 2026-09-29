import os
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Udyam MSME Registration Portal (Simulation)"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "sih26130_mock_udyam_secure_jwt_secret_key_2026_xyz"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = "sqlite:///./udyam_mock.db"
    
    # Integrations
    MOCK_UDYAM_API_KEY: str = "demo-secret-sih26130-udyam-key"
    WEBHOOK_URL: Optional[str] = None
    
    # Verification simulation
    MOCK_OTP: str = "123456"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ]
    
    # File generation
    CERTIFICATE_OUTPUT_DIR: str = "./generated"
    FRONTEND_URL: str = "http://localhost:5174"
    MAIN_SIH_PORTAL_URL: Optional[str] = "http://localhost:3000"

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure certificate generation directory exists
os.makedirs(settings.CERTIFICATE_OUTPUT_DIR, exist_ok=True)
