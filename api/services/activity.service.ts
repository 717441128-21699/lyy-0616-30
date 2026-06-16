import { getStore, getNextId, persist } from '../db/index.js';
import type { Activity, ActivityType, ActivityStatus, CreateActivityRequest } from '../../shared/types.js';

interface ActivityQuery {
  city?: string;
  type?: string;
  keyword?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export function getActivityList(query: ActivityQuery): { list: Activity[]; total: number } {
  const store = getStore();
  let activities = [...store.activities];

  if (query.city && query.city !== 'all') {
    activities = activities.filter((a) => a.city === query.city);
  }

  if (query.type && query.type !== 'all') {
    activities = activities.filter((a) => a.type === query.type);
  }

  if (query.keyword) {
    const kw = query.keyword.toLowerCase();
    activities = activities.filter(
      (a) =>
        a.title.toLowerCase().includes(kw) ||
        a.description.toLowerCase().includes(kw) ||
        a.organizerName.toLowerCase().includes(kw)
    );
  }

  if (query.status) {
    activities = activities.filter((a) => a.status === query.status);
  }

  if (query.dateFrom) {
    activities = activities.filter((a) => a.endDate >= query.dateFrom!);
  }
  if (query.dateTo) {
    activities = activities.filter((a) => a.startDate <= query.dateTo!);
  }

  activities.sort((a, b) => {
    const dateA = new Date(a.startDate + 'T' + a.startTime).getTime();
    const dateB = new Date(b.startDate + 'T' + b.startTime).getTime();
    return dateB - dateA;
  });

  const page = query.page || 1;
  const pageSize = query.pageSize || 12;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const list = activities.slice(start, end);

  return { list, total: activities.length };
}

export function getActivityById(id: number): Activity | null {
  const store = getStore();
  return store.activities.find((a) => a.id === id) || null;
}

export function createActivity(data: CreateActivityRequest & { organizerId: number; organizerName: string }): Activity {
  const store = getStore();

  const activity: Activity = {
    id: getNextId('activities'),
    title: data.title,
    description: data.description,
    type: data.type as ActivityType,
    city: data.city,
    location: data.location,
    startDate: data.startDate,
    endDate: data.endDate,
    startTime: data.startTime,
    endTime: data.endTime,
    maxParticipants: data.maxParticipants,
    currentParticipants: 0,
    requirements: data.requirements,
    notes: data.notes || '',
    status: 'published',
    organizerId: data.organizerId,
    organizerName: data.organizerName,
    imageUrl: data.imageUrl || '',
    createdAt: new Date().toISOString(),
  };

  store.activities.push(activity);

  const org = store.users.find((u) => u.id === data.organizerId);
  if (org) {
    org.activityCount = (org.activityCount || 0) + 1;
  }
  persist();

  return activity;
}

export function updateActivity(id: number, data: Partial<Activity>): Activity | null {
  const store = getStore();
  const index = store.activities.findIndex((a) => a.id === id);
  if (index === -1) return null;

  store.activities[index] = { ...store.activities[index], ...data };
  persist();
  return store.activities[index];
}

export function deleteActivity(id: number): boolean {
  const store = getStore();
  const index = store.activities.findIndex((a) => a.id === id);
  if (index === -1) return false;

  const activity = store.activities[index];
  const org = store.users.find((u) => u.id === activity.organizerId);
  if (org) {
    org.activityCount = Math.max(0, (org.activityCount || 0) - 1);
  }

  store.activities.splice(index, 1);
  persist();
  return true;
}

export function getActivitiesByOrganizer(organizerId: number): Activity[] {
  const store = getStore();
  return store.activities
    .filter((a) => a.organizerId === organizerId)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export function incrementParticipants(activityId: number): boolean {
  const store = getStore();
  const activity = store.activities.find((a) => a.id === activityId);
  if (!activity) return false;
  if (activity.currentParticipants >= activity.maxParticipants) return false;

  activity.currentParticipants++;
  persist();
  return true;
}

export function decrementParticipants(activityId: number): boolean {
  const store = getStore();
  const activity = store.activities.find((a) => a.id === activityId);
  if (!activity) return false;
  if (activity.currentParticipants <= 0) return false;

  activity.currentParticipants--;
  persist();
  return true;
}

export function addActivitySummary(activityId: number, summary: string): Activity | null {
  const store = getStore();
  const activity = store.activities.find((a) => a.id === activityId);
  if (!activity) return null;

  activity.summary = summary;
  activity.status = 'completed';
  persist();
  return activity;
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
  activity: Activity;
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

export function getOrganizerActivityStats(
  organizerId: number,
  dateFrom?: string,
  dateTo?: string
): ActivityStats[] {
  const store = getStore();
  let activities = store.activities.filter((a) => a.organizerId === organizerId);

  if (dateFrom) {
    activities = activities.filter(a => a.endDate >= dateFrom);
  }
  if (dateTo) {
    activities = activities.filter(a => a.startDate <= dateTo);
  }
  
  return activities.map((activity) => {
    const registrations = store.registrations.filter((r) => r.activityId === activity.id);
    const approvedCount = registrations.filter((r) => r.status === 'approved' || r.status === 'completed').length;
    const registrationCount = registrations.length;
    const approvalRate = registrationCount > 0 ? (approvedCount / registrationCount) * 100 : 0;
    
    const checkedIn = registrations.filter((r) => r.checkInTime).length;
    const checkInRate = approvedCount > 0 ? (checkedIn / approvedCount) * 100 : 0;
    
    const totalHours = registrations.reduce((sum, r) => sum + (r.serviceHours || 0), 0);
    
    const feedbacks = store.feedback.filter((f) => f.activityId === activity.id);
    const avgRating = feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0;
    
    return {
      activityId: activity.id,
      activityTitle: activity.title,
      activityType: activity.type,
      activityDate: activity.startDate,
      city: activity.city,
      registrationCount,
      approvedCount,
      approvalRate,
      checkInCount: checkedIn,
      checkInRate,
      totalServiceHours: totalHours,
      avgRating,
      feedbackCount: feedbacks.length,
    };
  }).sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime());
}

export function getOrganizerActivityDetailStats(organizerId: number, activityId: number): ActivityDetailStats | null {
  const store = getStore();
  const activity = store.activities.find((a) => a.id === activityId && a.organizerId === organizerId);
  if (!activity) return null;
  
  const statsList = getOrganizerActivityStats(organizerId);
  const summary = statsList.find((s) => s.activityId === activityId)!;
  
  const registrations = store.registrations.filter((r) => r.activityId === activityId);
  const volunteers = registrations.map((r) => {
    const user = store.users.find((u) => u.id === r.userId);
    return {
      registrationId: r.id,
      userId: r.userId,
      userName: r.userName || user?.name || '',
      userPhone: r.userPhone || user?.phone || '',
      status: r.status,
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime,
      serviceHours: r.serviceHours || null,
    };
  });
  
  const feedbackData = store.feedback.filter((f) => f.activityId === activityId);
  const feedbacks = feedbackData.map((f) => ({
    feedbackId: f.id,
    userId: f.userId,
    userName: f.userName || store.users.find(u => u.id === f.userId)?.name || '',
    rating: f.rating,
    content: f.content,
    createdAt: f.createdAt,
  }));
  
  return { summary, volunteers, feedbacks };
}

export function getActivityReviewReport(organizerId: number, activityId: number): ActivityReviewReport | null {
  const store = getStore();
  const activity = store.activities.find(a => a.id === activityId && a.organizerId === organizerId);
  if (!activity) return null;
  
  const detailStats = getOrganizerActivityDetailStats(organizerId, activityId);
  if (!detailStats) return null;
  
  const reminders = store.activityReminders
    .filter(r => r.activityId === activityId && r.organizerId === organizerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return {
    activity,
    summary: detailStats.summary,
    volunteers: detailStats.volunteers,
    feedbacks: detailStats.feedbacks,
    reminders,
  };
}
