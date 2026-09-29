import api from './api';
import { Application, ClassificationRule } from '../types';

export const officerService = {
  async getDashboard() {
    const res = await api.get('/officer/dashboard');
    return res.data;
  },

  async getApplications(params: any) {
    const res = await api.get('/officer/applications', { params });
    return res.data;
  },

  async getApplicationById(applicationId: number): Promise<Application> {
    const res = await api.get(`/officer/applications/${applicationId}`);
    return res.data;
  },

  async startVerification(applicationId: number) {
    const res = await api.post(`/officer/applications/${applicationId}/start-verification`);
    return res.data;
  },

  async reviewApplication(applicationId: number, action: string, comments?: string) {
    const res = await api.post(`/officer/applications/${applicationId}/review`, {
      action,
      comments,
    });
    return res.data;
  },

  // Admin settings
  async getClassificationRules(): Promise<ClassificationRule[]> {
    const res = await api.get('/admin/classification-rules');
    return res.data;
  },

  async updateClassificationRule(ruleId: number, data: any): Promise<ClassificationRule> {
    const res = await api.put(`/admin/classification-rules/${ruleId}`, data);
    return res.data;
  },

  async getAuditLogs(page: number = 1, limit: number = 25) {
    const res = await api.get('/admin/audit-logs', { params: { page, limit } });
    return res.data;
  },

  async getIntegrationLogs() {
    const res = await api.get('/admin/integration-logs');
    return res.data;
  }
};
