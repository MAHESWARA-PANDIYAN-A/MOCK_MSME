import api from './api';

export const verificationService = {
  async generateAadhaarOtp(applicationId: number | undefined, aadhaarNumber: string, name: string) {
    const res = await api.post('/verification/aadhaar/generate-otp', {
      application_id: applicationId,
      aadhaar_number: aadhaarNumber,
      entrepreneur_name: name,
      consent_given: true,
    });
    return res.data;
  },

  async verifyAadhaarOtp(applicationId: number | undefined, aadhaarNumber: string, otp: string, name: string) {
    const res = await api.post('/verification/aadhaar/verify-otp', {
      application_id: applicationId,
      aadhaar_number: aadhaarNumber,
      otp,
      entrepreneur_name: name,
    });
    return res.data;
  },

  async verifyPan(applicationId: number | undefined, panNumber: string, name: string) {
    const res = await api.post('/verification/pan/verify', {
      application_id: applicationId,
      has_pan: 'YES',
      pan_number: panNumber,
      name_on_pan: name,
    });
    return res.data;
  },

  async verifyGstin(applicationId: number | undefined, hasGstin: string, gstin?: string) {
    const res = await api.post('/verification/gstin/verify', {
      application_id: applicationId,
      has_gstin: hasGstin,
      gstin: gstin,
    });
    return res.data;
  }
};
