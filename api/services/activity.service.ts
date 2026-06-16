import { getStore, getNextId } from '../db/index.js';
import type { Activity, ActivityType, ActivityStatus, CreateActivityRequest } from '../../shared/types.js';

interface ActivityQuery {
  city?: string;
  type?: string;
  keyword?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
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

  return activity;
}

export function updateActivity(id: number, data: Partial<Activity>): Activity | null {
  const store = getStore();
  const index = store.activities.findIndex((a) => a.id === id);
  if (index === -1) return null;

  store.activities[index] = { ...store.activities[index], ...data };
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
  return true;
}

export function decrementParticipants(activityId: number): boolean {
  const store = getStore();
  const activity = store.activities.find((a) => a.id === activityId);
  if (!activity) return false;
  if (activity.currentParticipants <= 0) return false;

  activity.currentParticipants--;
  return true;
}

export function addActivitySummary(activityId: number, summary: string): Activity | null {
  const store = getStore();
  const activity = store.activities.find((a) => a.id === activityId);
  if (!activity) return null;

  activity.summary = summary;
  activity.status = 'completed';
  return activity;
}
