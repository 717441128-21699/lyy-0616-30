import { api } from './request';
import type {
  User,
  Activity,
  Registration,
  Certificate,
  Feedback,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  CreateActivityRequest,
  CreateFeedbackRequest,
  UserStats,
} from '@shared/types';

interface ListResponse<T> {
  list: T[];
  total: number;
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data),
  register: (data: RegisterRequest) =>
    api.post<LoginResponse>('/auth/register', data),
  getCurrentUser: () =>
    api.get<User>('/auth/me'),
};

export const activityApi = {
  getList: (params?: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const queryStr = query.toString();
    return api.get<ListResponse<Activity>>(`/activities${queryStr ? '?' + queryStr : ''}`);
  },
  getDetail: (id: number) =>
    api.get<Activity>(`/activities/${id}`),
  create: (data: CreateActivityRequest) =>
    api.post<Activity>('/activities', data),
  update: (id: number, data: Partial<Activity>) =>
    api.put<Activity>(`/activities/${id}`, data),
  delete: (id: number) =>
    api.delete<{ success: boolean }>(`/activities/${id}`),
  getMyActivities: () =>
    api.get<ListResponse<Activity>>('/activities/my/list'),
  addSummary: (id: number, summary: string) =>
    api.post<Activity>(`/activities/${id}/summary`, { summary }),
};

export const registrationApi = {
  registerForActivity: (activityId: number) =>
    api.post<Registration>(`/activities/${activityId}/register`),
  getMyRegistrations: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return api.get<ListResponse<Registration>>(`/registrations/mine${query}`);
  },
  getActivityRegistrations: (activityId: number, status?: string) => {
    const query = status ? `?status=${status}` : '';
    return api.get<ListResponse<Registration>>(`/activities/${activityId}/registrations${query}`);
  },
  audit: (id: number, approved: boolean, auditNote?: string) =>
    api.post<Registration>(`/registrations/${id}/audit`, { approved, auditNote }),
  cancel: (id: number) =>
    api.post<Registration>(`/registrations/${id}/cancel`),
  checkIn: (token: string) =>
    api.post<Registration>('/registrations/checkin', { token }),
  checkOut: (token: string) =>
    api.post<Registration>('/registrations/checkout', { token }),
  getDetail: (id: number) =>
    api.get<Registration>(`/registrations/${id}`),
  getByToken: (token: string) =>
    api.get<Registration>(`/registrations/token/${token}`),
};

export const certificateApi = {
  getMyCertificates: () =>
    api.get<ListResponse<Certificate>>('/certificates/mine'),
  getDetail: (id: number) =>
    api.get<Certificate>(`/certificates/${id}`),
  apply: () =>
    api.post<{ certificate: Certificate }>('/certificates/apply'),
  getNextLevel: () =>
    api.get<any>('/certificates/next-level'),
  downloadPdf: (id: number) => `/api/certificates/${id}/pdf`,
};

export const userApi = {
  getStats: () =>
    api.get<UserStats>('/user/stats'),
  getMyFeedback: () =>
    api.get<ListResponse<Feedback>>('/user/feedback'),
};

export const feedbackApi = {
  create: (data: CreateFeedbackRequest) =>
    api.post<Feedback>('/feedback', data),
  getByActivity: (activityId: number) =>
    api.get<ListResponse<Feedback>>(`/activities/${activityId}/feedback`),
  getMyFeedback: () =>
    api.get<ListResponse<Feedback>>('/feedback/mine'),
};
