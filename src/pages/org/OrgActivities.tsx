import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Calendar,
  Users,
  Clock,
  Award,
  Trash2,
  Eye,
  QrCode,
  X,
  MapPin,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { OrgLayout } from '../../components/OrgLayout';
import { activityApi } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import type {
  Activity,
  ActivityStatus,
  ActivityType,
  CreateActivityRequest,
} from '@shared/types';
import {
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_STATUS_LABELS,
  CITIES,
} from '@shared/types';
import { cn } from '../../lib/utils';

export default function OrgActivities() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<CreateActivityRequest>({
    title: '',
    description: '',
    type: 'environment',
    city: '北京',
    location: '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    maxParticipants: 50,
    requirements: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'organization') {
      navigate('/login');
      return;
    }
    fetchActivities();
  }, [user, navigate]);

  const fetchActivities = async () => {
    try {
      const result = await activityApi.getMyActivities();
      setActivities(result.list);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个活动吗？')) return;
    try {
      await activityApi.delete(id);
      fetchActivities();
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除失败';
      alert(message);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await activityApi.create(formData);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        type: 'environment',
        city: '北京',
        location: '',
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '17:00',
        maxParticipants: 50,
        requirements: '',
      });
      fetchActivities();
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建失败';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors: Record<ActivityStatus, string> = {
    draft: 'bg-gray-100 text-gray-600',
    published: 'bg-emerald-100 text-emerald-700',
    ongoing: 'bg-blue-100 text-blue-700',
    completed: 'bg-slate-100 text-slate-600',
  };

  const stats = [
    {
      label: '全部活动',
      value: activities.length,
      icon: Calendar,
      fromColor: 'from-emerald-500',
      toColor: 'to-teal-500',
    },
    {
      label: '招募中',
      value: activities.filter((a) => a.status === 'published').length,
      icon: Users,
      fromColor: 'from-blue-500',
      toColor: 'to-cyan-500',
    },
    {
      label: '进行中',
      value: activities.filter((a) => a.status === 'ongoing').length,
      icon: Clock,
      fromColor: 'from-amber-500',
      toColor: 'to-orange-500',
    },
    {
      label: '已结束',
      value: activities.filter((a) => a.status === 'completed').length,
      icon: Award,
      fromColor: 'from-purple-500',
      toColor: 'to-pink-500',
    },
  ];

  const activityTypes: ActivityType[] = [
    'environment',
    'education',
    'elderly',
    'community',
    'animal',
    'other',
  ];

  return (
    <OrgLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">活动管理</h1>
            <p className="text-gray-500 text-sm mt-1">
              管理您发布的所有志愿活动
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-200 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>发布活动</span>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
                    stat.fromColor,
                    stat.toColor
                  )}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">活动列表</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">加载中...</div>
          ) : activities.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-5 hover:bg-gray-50 transition-colors"
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
                        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          {ACTIVITY_TYPE_LABELS[activity.type]}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{activity.city}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{activity.startDate}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {activity.startTime} - {activity.endTime}
                          </span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>
                            {activity.currentParticipants}/
                            {activity.maxParticipants} 人报名
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/activity/${activity.id}`)}
                        className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors text-sm font-medium"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                        <span>查看</span>
                      </button>
                      <button
                        onClick={() =>
                          navigate(
                            `/org/activity/${activity.id}/registrations`
                          )
                        }
                        className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                        title="报名管理"
                      >
                        <Users className="w-4 h-4" />
                        <span>报名</span>
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/org/activity/${activity.id}/checkin`)
                        }
                        className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm font-medium"
                        title="签到管理"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>签到</span>
                      </button>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                        title="删除活动"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>删除</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">暂无活动</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
              >
                发布第一个活动
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">发布活动</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form
              onSubmit={handleCreateActivity}
              className="p-6 overflow-y-auto flex-1"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    活动标题
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="请输入活动标题"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      活动类型
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as ActivityType,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                    >
                      {activityTypes.map((type) => (
                        <option key={type} value={type}>
                          {ACTIVITY_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      城市
                    </label>
                    <select
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                    >
                      {CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    活动地点
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="请输入详细地址"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      开始日期
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      结束日期
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      开始时间
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      结束时间
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    招募人数
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxParticipants}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxParticipants: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    活动描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="请输入活动描述"
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    招募要求
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) =>
                      setFormData({ ...formData, requirements: e.target.value })
                    }
                    placeholder="请输入招募要求"
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all resize-none"
                    required
                  />
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateActivity}
                disabled={submitting}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '发布中...' : '发布活动'}
              </button>
            </div>
          </div>
        </div>
      )}
    </OrgLayout>
  );
}
