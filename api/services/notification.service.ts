import { getStore, persist, getNextId } from '../db/index.js';
import type { Notification, NotificationType } from '../../shared/types.js';

export function createNotification(data: {
  userId: number;
  type: NotificationType;
  title: string;
  content: string;
  relatedId?: number;
  relatedType?: 'registration' | 'activity' | 'certificate';
}): Notification {
  const store = getStore();
  const notification: Notification = {
    id: 0,
    userId: data.userId,
    type: data.type,
    title: data.title,
    content: data.content,
    relatedId: data.relatedId,
    relatedType: data.relatedType,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notification.id = getNextId('notifications');
  store.notifications.push(notification);
  persist();
  return notification;
}

export function getUserNotifications(userId: number): Notification[] {
  const store = getStore();
  return store.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getUnreadCount(userId: number): number {
  const store = getStore();
  return store.notifications.filter((n) => n.userId === userId && !n.read).length;
}

export function markAsRead(notificationId: number, userId: number): boolean {
  const store = getStore();
  const notification = store.notifications.find((n) => n.id === notificationId && n.userId === userId);
  if (notification) {
    notification.read = true;
    persist();
    return true;
  }
  return false;
}

export function markAllAsRead(userId: number): number {
  const store = getStore();
  let count = 0;
  store.notifications.forEach((n) => {
    if (n.userId === userId && !n.read) {
      n.read = true;
      count++;
    }
  });
  if (count > 0) persist();
  return count;
}
