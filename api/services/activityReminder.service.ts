import { getStore, persist, getNextId } from '../db/index.js';
import type { ActivityReminderRecord } from '../../shared/types.js';
import * as notificationService from './notification.service.js';

export function sendActivityReminder(data: {
  organizerId: number;
  activityId: number;
  targetScope: 'all_registered' | 'approved_only';
  title: string;
  content: string;
}): ActivityReminderRecord {
  const store = getStore();

  const activity = store.activities.find(a => a.id === data.activityId);
  if (!activity || activity.organizerId !== data.organizerId) {
    throw new Error('活动不存在或无权限操作');
  }

  let registrations = store.registrations.filter(r => r.activityId === data.activityId);
  if (data.targetScope === 'approved_only') {
    registrations = registrations.filter(r => r.status === 'approved' || r.status === 'completed');
  }

  const userIds = [...new Set(registrations.map(r => r.userId))];

  userIds.forEach(userId => {
    notificationService.createNotification({
      userId,
      type: 'activity_reminder',
      title: data.title || `活动提醒：${activity.title}`,
      content: data.content,
      relatedId: data.activityId,
      relatedType: 'activity',
    });
  });

  const record: ActivityReminderRecord = {
    id: getNextId('activityReminders'),
    activityId: data.activityId,
    organizerId: data.organizerId,
    activityTitle: activity.title,
    targetScope: data.targetScope,
    receiverCount: userIds.length,
    title: data.title || `活动提醒：${activity.title}`,
    content: data.content,
    createdAt: new Date().toISOString(),
  };
  store.activityReminders.push(record);
  persist();
  return record;
}

export function getOrganizerReminders(organizerId: number): ActivityReminderRecord[] {
  const store = getStore();
  return store.activityReminders
    .filter(r => r.organizerId === organizerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
