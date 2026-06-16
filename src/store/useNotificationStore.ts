import { create } from 'zustand';
import type { Notification } from '@shared/types';
import { notificationApi } from '../api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const result = await notificationApi.getList();
      set({ notifications: result.notifications, unreadCount: result.unreadCount });
    } finally {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const result = await notificationApi.getUnreadCount();
      set({ unreadCount: result.count });
    } catch {}
  },

  markAsRead: async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      const notifications = get().notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      const unreadCount = notifications.filter(n => !n.read).length;
      set({ notifications, unreadCount });
    } catch {}
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead();
      const notifications = get().notifications.map(n => ({ ...n, read: true }));
      set({ notifications, unreadCount: 0 });
    } catch {}
  },
}));
