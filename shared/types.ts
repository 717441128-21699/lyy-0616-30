export type UserRole = 'volunteer' | 'organization';

export type ActivityType = 'environment' | 'education' | 'elderly' | 'community' | 'animal' | 'other';

export type ActivityStatus = 'draft' | 'published' | 'ongoing' | 'completed';

export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export type CertificateLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export type CertificateProgressStatus = 'achieved' | 'available' | 'pending';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  totalHours?: number;
  activityCount?: number;
  orgName?: string;
  orgDescription?: string;
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  type: ActivityType;
  city: string;
  location: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  requirements: string;
  notes?: string;
  status: ActivityStatus;
  organizerId: number;
  organizerName: string;
  summary?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Registration {
  id: number;
  activityId: number;
  userId: number;
  userName: string;
  userPhone?: string;
  status: RegistrationStatus;
  checkInTime?: string;
  checkOutTime?: string;
  serviceHours: number;
  qrToken?: string;
  auditNote?: string;
  registeredAt: string;
  auditedAt?: string;
  cancelledAt?: string;
  activity?: Activity;
}

export interface Certificate {
  id: number;
  userId: number;
  userName: string;
  certificateNo: string;
  level: CertificateLevel;
  totalHours: number;
  activityCount: number;
  issuedAt: string;
}

export interface Feedback {
  id: number;
  activityId: number;
  userId: number;
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  orgName?: string;
  orgDescription?: string;
}

export interface CreateActivityRequest {
  title: string;
  description: string;
  type: string;
  city: string;
  location: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  requirements: string;
  notes?: string;
  imageUrl?: string;
}

export interface CreateFeedbackRequest {
  activityId: number;
  rating: number;
  content: string;
}

export interface ActivityListParams {
  city?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface CertificateLevelInfo {
  level: CertificateLevel;
  name: string;
  requiredHours: number;
  currentHours: number;
  progress: number;
}

export interface UserStats {
  totalHours: number;
  activityCount: number;
  certificateCount: number;
  currentLevel: CertificateLevel | null;
  nextLevel: CertificateLevelInfo | null;
  upcomingLevel: CertificateLevelInfo | null;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  environment: '环保公益',
  education: '教育支持',
  elderly: '助老服务',
  community: '社区服务',
  animal: '动物保护',
  other: '其他类型',
};

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  draft: '草稿',
  published: '招募中',
  ongoing: '进行中',
  completed: '已结束',
};

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  cancelled: '已取消',
  completed: '已完成',
};

export const CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安',
  '南京', '重庆', '苏州', '天津', '长沙', '青岛', '大连', '厦门',
];

export const CERTIFICATE_LEVELS = [
  { level: 'bronze', name: '铜级志愿者', hours: 20, color: '#CD7F32' },
  { level: 'silver', name: '银级志愿者', hours: 50, color: '#C0C0C0' },
  { level: 'gold', name: '金级志愿者', hours: 100, color: '#FFD700' },
  { level: 'platinum', name: '白金志愿者', hours: 200, color: '#E5E4E2' },
];

export type NotificationType =
  | 'registration_approved'
  | 'registration_rejected'
  | 'check_in_completed'
  | 'check_out_completed'
  | 'certificate_granted'
  | 'activity_reminder';

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

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  content: string;
  relatedId?: number;
  relatedType?: 'registration' | 'activity' | 'certificate';
  read: boolean;
  createdAt: string;
}
