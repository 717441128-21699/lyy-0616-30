import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  Clock,
  Award,
  ArrowRight,
  CalendarPlus,
  QrCode,
  FileText,
  UserCheck,
} from 'lucide-react';
import { OrgLayout } from '../../components/OrgLayout';
import { activityApi } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import type { Activity, ActivityStatus } from '@shared/types';
import { ACTIVITY_STATUS_LABELS } from '@shared/types';
import { cn } from '../../lib/utils';

export default function OrgDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'organization') {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await activityApi.getMyActivities();
      setActivities(result.list);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: '全部活动',
      value: activities.length,
      icon: Calendar,
      fromColor: 'from-emerald-500',
      toColor: 'to-teal-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      label: '招募中',
      value: activities.filter((a) => a.status === 'published').length,
      icon: Users,
      fromColor: 'from-blue-500',
      toColor: 'to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: '进行中',
      value: activities.filter((a) => a.status === 'ongoing').length,
      icon: Clock,
      fromColor: 'from-amber-500',
      toColor: 'to-orange-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      label: '已结束',
      value: activities.filter((a) => a.status === 'completed').length,
      icon: Award,
      fromColor: 'from-purple-500',
      toColor: 'to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  const quickActions = [
    {
      label: '发布活动',
      icon: CalendarPlus,
      path: '/org/activities',
      fromColor: 'from-emerald-500',
      toColor: 'to-teal-500',
    },
    {
      label: '管理报名',
      icon: UserCheck,
      path: '/org/registrations',
      fromColor: 'from-blue-500',
      toColor: 'to-cyan-500',
    },
    {
      label: '签到管理',
      icon: QrCode,
      path: '/org/checkin',
      fromColor: 'from-amber-500',
      toColor: 'to-orange-500',
    },
    {
      label: '发布总结',
      icon: FileText,
      path: '/org/summary',
      fromColor: 'from-purple-500',
      toColor: 'to-pink-500',
    },
  ];

  const recentActivities = activities.slice(0, 5);

  const statusColors: Record<ActivityStatus, string> = {
    draft: 'bg-gray-100 text-gray-600',
    published: 'bg-emerald-100 text-emerald-700',
    ongoing: 'bg-blue-100 text-blue-700',
    completed: 'bg-slate-100 text-slate-600',
  };

  return (
    <OrgLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            欢迎回来，{user?.orgName || user?.name}
          </h1>
          <p className="text-gray-500">管理您的公益活动和志愿者团队</p>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br',
                    stat.fromColor,
                    stat.toColor
                  )}
                >
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-left group"
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br group-hover:scale-110 transition-transform',
                  action.fromColor,
                  action.toColor
                )}
              >
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{action.label}</h3>
              <p className="text-sm text-gray-500 flex items-center">
                点击进入
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">最近活动</h2>
            <button
              onClick={() => navigate('/org/activities')}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
            >
              查看全部
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">加载中...</div>
          ) : recentActivities.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/activity/${activity.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-800">
                          {activity.title}
                        </h3>
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-xs font-medium',
                            statusColors[activity.status]
                          )}
                        >
                          {ACTIVITY_STATUS_LABELS[activity.status]}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{activity.startDate}</span>
                        </span>
                        <span>{activity.city}</span>
                        <span>
                          {activity.currentParticipants}/
                          {activity.maxParticipants} 人报名
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/org/activity/${activity.id}/registrations`
                        );
                      }}
                      className="px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium"
                    >
                      管理报名
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">暂无活动</p>
              <button
                onClick={() => navigate('/org/activities')}
                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
              >
                发布第一个活动
              </button>
            </div>
          )}
        </div>
      </div>
    </OrgLayout>
  );
}
