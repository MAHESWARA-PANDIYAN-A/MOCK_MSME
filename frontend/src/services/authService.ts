import api from './api';
import { User } from '../types';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  full_name: string;
  email: string;
  role: 'APPLICANT' | 'OFFICER' | 'ADMIN';
}

export const authService = {
  async register(data: any): Promise<AuthResponse> {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async login(emailOrMobile: string, password: string): Promise<AuthResponse> {
    const res = await api.post('/auth/login', {
      email_or_mobile: emailOrMobile,
      password,
    });
    return res.data;
  },

  async sendOtp(mobileOrAadhaar: string): Promise<{ success: boolean; message: string; demo_otp: string }> {
    const res = await api.post('/auth/send-otp', { mobile_or_aadhaar: mobileOrAadhaar });
    return res.data;
  },

  async verifyOtp(mobileOrAadhaar: string, otp: string): Promise<{ success: boolean; message: string }> {
    const res = await api.post('/auth/verify-otp', { mobile_or_aadhaar: mobileOrAadhaar, otp });
    return res.data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data;
  }
};
