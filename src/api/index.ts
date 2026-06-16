import { api, request } from './request';
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
  Notification,
} from '@shared/types';

interface ListResponse<T> {
  list: T[];
  total: number;
}

export interface ActivityStats {
  activityId: number;
  activityTitle: string;
  activityType: string;
  activityDate: string;
  city: string;
  registrationCount: number;
  approvedCount: number;
  approvalRate: number;
  checkInCount: number;
  checkInRate: number;
  totalServiceHours: number;
  avgRating: number;
  feedbackCount: number;
}

export interface ActivityDetailStats {
  summary: ActivityStats;
  volunteers: Array<{
    registrationId: number;
    userId: number;
    userName: string;
    userPhone: string;
    status: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    serviceHours: number | null;
  }>;
  feedbacks: Array<{
    feedbackId: number;
    userId: number;
    userName: string;
    rating: number;
    content: string;
    createdAt: string;
  }>;
}

export interface ActivityReviewReport {
  activity: import('@shared/types').Activity;
  summary: ActivityStats;
  volunteers: Array<{
    registrationId: number;
    userId: number;
    userName: string;
    userPhone: string;
    status: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    serviceHours: number | null;
  }>;
  feedbacks: Array<{
    feedbackId: number;
    userId: number;
    userName: string;
    rating: number;
    content: string;
    createdAt: string;
  }>;
  reminders: Array<{
    id: number;
    activityId: number;
    organizerId: number;
    activityTitle: string;
    targetScope: 'all_registered' | 'approved_only';
    receiverCount: number;
    title: string;
    content: string;
    createdAt: string;
  }>;
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
  getStats: (params?: { dateFrom?: string; dateTo?: string }): Promise<{ stats: ActivityStats[] }> => {
    const qs = new URLSearchParams();
    if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.set('dateTo', params.dateTo);
    const query = qs.toString();
    return request(`/api/activities/stats${query ? `?${query}` : ''}`);
  },
  getDetailStats: (id: number): Promise<{ detail: ActivityDetailStats }> =>
    api.get<{ detail: ActivityDetailStats }>(`/activities/${id}/stats-detail`),
  getReviewReport: (id: number): Promise<{ report: ActivityReviewReport }> =>
    api.get<{ report: ActivityReviewReport }>(`/activities/${id}/review`),
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
  apply: (level?: string): Promise<{ certificate: Certificate }> => {
    const body = level ? { level } : {};
    return request('/api/certificates/apply', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  getNextLevel: () =>
    api.get<any>('/certificates/next-level'),
  downloadPdf: (id: number) => `/api/certificates/${id}/pdf`,
};

export interface TimelineItem {
  id: string;
  type: 'registration_approved' | 'check_in' | 'check_out' | 'certificate' | 'activity_reminder';
  title: string;
  description: string;
  date: string;
  relatedId?: number;
  relatedType: 'activity' | 'certificate' | 'registration';
  iconType: string;
}

export const userApi = {
  getStats: () =>
    api.get<UserStats>('/user/stats'),
  getMyFeedback: () =>
    api.get<ListResponse<Feedback>>('/user/feedback'),
  getTimeline: (): Promise<{ timeline: TimelineItem[] }> =>
    api.get('/user/timeline'),
};

export const feedbackApi = {
  create: (data: CreateFeedbackRequest) =>
    api.post<Feedback>('/feedback', data),
  getByActivity: (activityId: number) =>
    api.get<ListResponse<Feedback>>(`/activities/${activityId}/feedback`),
  getMyFeedback: () =>
    api.get<ListResponse<Feedback>>('/feedback/mine'),
};

export const notificationApi = {
  getList: (): Promise<{ notifications: Notification[]; unreadCount: number }> =>
    request('/notifications'),
  getUnreadCount: (): Promise<{ count: number }> =>
    request('/notifications/unread-count'),
  markAsRead: (id: number): Promise<{ success: boolean }> =>
    request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: (): Promise<{ count: number }> =>
    request('/notifications/mark-all-read', { method: 'POST' }),
};

export interface ActivityReminderRecord {
  id: number;
  activityId: number;
  organizerId: number;
  activityTitle: string;
  targetScope: 'all_registered' | 'approved_only';
  receiverCount: number;
  title: string;
  content: string;
  createdAt: string;
}

export const activityReminderApi = {
  send: (data: { activityId: number; targetScope: 'all_registered' | 'approved_only'; title?: string; content: string }): Promise<{ record: ActivityReminderRecord }> =>
    request('/activity-reminders', { method: 'POST', body: JSON.stringify(data) }),
  getList: (): Promise<{ reminders: ActivityReminderRecord[] }> =>
    request('/activity-reminders'),
};
