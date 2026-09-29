import re
import uuid
from typing import Dict, Any, Tuple
from app.core.config import settings

class AadhaarVerificationService:
    @staticmethod
    def mask_aadhaar(aadhaar_raw: str) -> str:
        # Extract digits only
        digits = re.sub(r"\D", "", aadhaar_raw)
        if len(digits) >= 4:
            last4 = digits[-4:]
            return f"XXXX-XXXX-{last4}"
        return "XXXX-XXXX-0000"

    @staticmethod
    def validate_aadhaar_format(aadhaar_raw: str) -> bool:
        digits = re.sub(r"\D", "", aadhaar_raw)
        return len(digits) == 12

    @staticmethod
    def generate_otp(aadhaar_raw: str, name: str) -> Dict[str, Any]:
        if not AadhaarVerificationService.validate_aadhaar_format(aadhaar_raw):
            return {
                "success": False,
                "message": "Invalid Aadhaar number format. Aadhaar must contain exactly 12 digits."
            }
        
        masked = AadhaarVerificationService.mask_aadhaar(aadhaar_raw)
        return {
            "success": True,
            "masked_aadhaar": masked,
            "demo_otp": settings.MOCK_OTP,
            "message": f"Simulated OTP sent to Aadhaar linked mobile number. (Prototype Demo OTP: {settings.MOCK_OTP})"
        }

    @staticmethod
    def verify_otp(aadhaar_raw: str, otp: str, name: str) -> Tuple[bool, str, Dict[str, Any]]:
        if not AadhaarVerificationService.validate_aadhaar_format(aadhaar_raw):
            return False, "Invalid Aadhaar number format.", {}
        
        if otp.strip() != settings.MOCK_OTP:
            return False, f"Incorrect OTP. For this prototype demo, please use {settings.MOCK_OTP}.", {}
        
        masked = AadhaarVerificationService.mask_aadhaar(aadhaar_raw)
        verification_ref = f"SIM-UIDAI-{uuid.uuid4().hex[:10].upper()}"
        
        return True, "Simulated Aadhaar verification successful.", {
            "masked_aadhaar": masked,
            "entrepreneur_name": name,
            "verification_ref": verification_ref,
            "is_verified": True
        }

class PanVerificationService:
    @staticmethod
    def validate_pan_format(pan_raw: str) -> bool:
        pan = pan_raw.strip().upper()
        return bool(re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", pan))

    @staticmethod
    def verify_pan(pan_raw: str, entrepreneur_name: str = "") -> Tuple[bool, str, Dict[str, Any]]:
        pan = pan_raw.strip().upper()
        if not PanVerificationService.validate_pan_format(pan):
            return False, "Invalid PAN format. Expected format is ABCDE1234F.", {}
        
        # In simulated PAN verification:
        name = entrepreneur_name if entrepreneur_name else "VERIFIED PROMOTER"
        return True, "Simulated PAN verified successfully with Income Tax database.", {
            "pan_number": pan,
            "name_on_pan": name,
            "is_verified": True
        }

class GstinVerificationService:
    @staticmethod
    def validate_gstin_format(gstin_raw: str) -> bool:
        gstin = gstin_raw.strip().upper()
        return bool(re.match(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", gstin))

    @staticmethod
    def verify_gstin(gstin_raw: str, enterprise_name: str = "") -> Tuple[bool, str, Dict[str, Any]]:
        gstin = gstin_raw.strip().upper()
        if not GstinVerificationService.validate_gstin_format(gstin):
            return False, "Invalid GSTIN format. Expected 15-character GSTIN (e.g. 33ABCDE1234F1Z1).", {}
        
        trade_name = enterprise_name if enterprise_name else "REGISTERED TAXPAYER UNIT"
        return True, "Simulated GSTIN verified successfully with GSTN.", {
            "gstin": gstin,
            "trade_name": trade_name,
            "is_verified": True
        }
