import api from './api';
import { Application, ApplicationListItem, NotificationItem } from '../types';

export const applicationService = {
  async getOrCreateDraft(): Promise<Application> {
    const res = await api.get('/applications/draft');
    return res.data;
  },

  async saveDraft(applicationId: number, data: any): Promise<Application> {
    const res = await api.put(`/applications/${applicationId}/draft`, data);
    return res.data;
  },

  async submitApplication(applicationId: number, isDeclared: boolean = true) {
    const res = await api.post(`/applications/${applicationId}/submit`, {
      is_declared: isDeclared,
      simulated_confirmation: true,
    });
    return res.data;
  },

  async getMyApplications(): Promise<{ counts: Record<string, number>; applications: ApplicationListItem[] }> {
    const res = await api.get('/applications/my');
    return res.data;
  },

  async getApplicationById(applicationId: number): Promise<Application> {
    const res = await api.get(`/applications/${applicationId}`);
    return res.data;
  },

  async getNotifications(): Promise<NotificationItem[]> {
    const res = await api.get('/applications/notifications/list');
    return res.data;
  },

  async markNotificationRead(notificationId: number) {
    const res = await api.post(`/applications/notifications/${notificationId}/read`);
    return res.data;
  },

  async calculateClassificationPreview(investment: number, turnover: number, exportTurnover: number = 0) {
    const res = await api.post('/applications/classification/calculate-preview', {
      investment,
      turnover,
      export_turnover: exportTurnover,
    });
    return res.data;
  },

  async publicVerify(udyamNumber: string) {
    const res = await api.get(`/public/verify/${udyamNumber}`);
    return res.data;
  },

  async publicTrack(identifier: string) {
    const res = await api.get(`/public/track/${identifier}`);
    return res.data;
  }
};
