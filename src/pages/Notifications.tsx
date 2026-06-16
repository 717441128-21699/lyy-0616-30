import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  XCircle,
  LogIn,
  Clock,
  Award,
  Inbox,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { notificationApi } from '../api';
import type { Notification, NotificationType } from '@shared/types';
import { cn } from '../lib/utils';

const notificationIconMap: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  registration_approved: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  registration_rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  check_in_completed: { icon: LogIn, color: 'text-blue-600', bg: 'bg-blue-50' },
  check_out_completed: { icon: Clock, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  certificate_granted: { icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return date.toLocaleDateString('zh-CN');
}

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/notifications' } });
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const result = await notificationApi.getList();
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.read) return;
    try {
      await notificationApi.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      const result = await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      if (result.count > 0) {
        alert(`已将 ${result.count} 条通知标记为已读`);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification);
    }
    if (notification.relatedId && notification.relatedType) {
      if (notification.relatedType === 'activity') {
        navigate(`/activity/${notification.relatedId}`);
      } else if (notification.relatedType === 'registration') {
        navigate('/profile');
      } else if (notification.relatedType === 'certificate') {
        navigate('/profile');
      }
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">通知中心</h1>
                <p className="text-emerald-100 text-sm mt-0.5">
                  {unreadCount > 0 ? `您有 ${unreadCount} 条未读通知` : '暂无未读通知'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
              >
                {markingAll ? '处理中...' : '一键全部已读'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-16">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-400">加载中...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium mb-1">暂无通知</p>
              <p className="text-gray-400 text-sm mb-6">您的所有活动动态会在这里显示</p>
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-200 transition-all"
              >
                去发现活动
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const iconConfig = notificationIconMap[notification.type];
                const Icon = iconConfig.icon;
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'p-5 cursor-pointer transition-all hover:bg-emerald-50/30',
                      !notification.read && 'bg-emerald-50/40'
                    )}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="relative flex-shrink-0">
                        <div
                          className={cn(
                            'w-11 h-11 rounded-xl flex items-center justify-center',
                            iconConfig.bg
                          )}
                        >
                          <Icon className={cn('w-5 h-5', iconConfig.color)} />
                        </div>
                        {!notification.read && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between space-x-3">
                          <h3
                            className={cn(
                              'font-medium text-base',
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            )}
                          >
                            {notification.title}
                          </h3>
                          <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p
                          className={cn(
                            'text-sm mt-1.5 leading-relaxed',
                            !notification.read ? 'text-gray-600' : 'text-gray-500'
                          )}
                        >
                          {notification.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
