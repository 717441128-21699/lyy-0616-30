import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  Star,
  MapPin,
  User,
  Phone,
  LogIn,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { OrgLayout } from '../../components/OrgLayout';
import { activityApi } from '../../api';
import type { ActivityDetailStats } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import { ACTIVITY_TYPE_LABELS, REGISTRATION_STATUS_LABELS } from '@shared/types';
import { cn } from '../../lib/utils';

export default function OrgActivityStatsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [detail, setDetail] = useState<ActivityDetailStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'organization') {
      navigate('/login');
      return;
    }
    if (!id) return;
    loadData();
  }, [user, navigate, id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await activityApi.getDetailStats(Number(id));
      setDetail(result.detail);
    } catch (err) {
      console.error('Failed to load detail stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
    completed: 'bg-blue-100 text-blue-700',
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'w-4 h-4',
              i < Math.floor(rating)
                ? 'text-amber-400 fill-amber-400'
                : i < rating
                ? 'text-amber-400 fill-amber-400/50'
                : 'text-gray-200'
            )}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <OrgLayout>
        <div className="p-8">
          <div className="p-12 text-center text-gray-400">加载中...</div>
        </div>
      </OrgLayout>
    );
  }

  if (!detail) {
    return (
      <OrgLayout>
        <div className="p-8">
          <button
            onClick={() => navigate('/org/stats')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回看板</span>
          </button>
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">活动不存在或无权限访问</p>
          </div>
        </div>
      </OrgLayout>
    );
  }

  const { summary, volunteers, feedbacks } = detail;

  const summaryCards = [
    {
      label: '报名人数',
      value: summary.registrationCount,
      icon: Users,
      fromColor: 'from-emerald-500',
      toColor: 'to-teal-500',
    },
    {
      label: '通过人数',
      value: summary.approvedCount,
      subValue: `通过率 ${summary.approvalRate.toFixed(1)}%`,
      icon: Users,
      fromColor: 'from-blue-500',
      toColor: 'to-cyan-500',
    },
    {
      label: '签到人数',
      value: summary.checkInCount,
      subValue: `签到率 ${summary.checkInRate.toFixed(1)}%`,
      icon: LogIn,
      fromColor: 'from-amber-500',
      toColor: 'to-orange-500',
    },
    {
      label: '总服务时长',
      value: summary.totalServiceHours.toFixed(1),
      unit: '小时',
      icon: Clock,
      fromColor: 'from-purple-500',
      toColor: 'to-pink-500',
    },
  ];

  return (
    <OrgLayout>
      <div className="p-8">
        <button
          onClick={() => navigate('/org/stats')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回看板</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {summary.activityTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{summary.city}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{summary.activityDate}</span>
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                  {ACTIVITY_TYPE_LABELS[summary.activityType as keyof typeof ACTIVITY_TYPE_LABELS] || summary.activityType}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end space-x-2 mb-1">
                {renderStars(summary.avgRating)}
                <span className="text-lg font-bold text-gray-800">
                  {summary.avgRating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {summary.feedbackCount} 条反馈
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          {summaryCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <div className="flex items-baseline mt-2">
                    <p className="text-3xl font-bold text-gray-800">
                      {card.value}
                    </p>
                    {card.unit && (
                      <span className="text-sm text-gray-500 ml-1">{card.unit}</span>
                    )}
                  </div>
                  {card.subValue && (
                    <p className="text-xs text-gray-400 mt-1">{card.subValue}</p>
                  )}
                </div>
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br',
                    card.fromColor,
                    card.toColor
                  )}
                >
                  <card.icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center">
              <Users className="w-5 h-5 text-emerald-500 mr-2" />
              志愿者明细
              <span className="ml-2 text-sm font-normal text-gray-500">
                共 {volunteers.length} 人
              </span>
            </h2>
          </div>

          {volunteers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      姓名
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      手机
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                      报名状态
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                      签到时间
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                      签退时间
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                      服务时长
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((v) => (
                    <tr
                      key={v.registrationId}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="font-medium text-gray-800">
                            {v.userName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{v.userPhone || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium',
                            statusColors[v.status] || 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {REGISTRATION_STATUS_LABELS[v.status as keyof typeof REGISTRATION_STATUS_LABELS] || v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                          <LogIn className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{formatDateTime(v.checkInTime)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                          <LogOut className="w-3.5 h-3.5 text-orange-500" />
                          <span>{formatDateTime(v.checkOutTime)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-emerald-600">
                          {v.serviceHours !== null ? `${v.serviceHours.toFixed(1)} h` : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">暂无志愿者报名</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center">
              <MessageSquare className="w-5 h-5 text-emerald-500 mr-2" />
              反馈汇总
            </h2>
          </div>

          <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                  <span className="text-3xl font-bold text-amber-500">
                    {summary.avgRating.toFixed(1)}
                  </span>
                </div>
                <div>
                  <div className="mb-1">{renderStars(summary.avgRating)}</div>
                  <p className="text-sm text-gray-600">平均评分</p>
                </div>
              </div>
              <div className="h-12 w-px bg-amber-200" />
              <div>
                <p className="text-3xl font-bold text-gray-800">
                  {summary.feedbackCount}
                </p>
                <p className="text-sm text-gray-600 mt-1">条反馈</p>
              </div>
            </div>
          </div>

          {feedbacks.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {feedbacks.map((f) => (
                <div key={f.feedbackId} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{f.userName}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(f.createdAt).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    {renderStars(f.rating)}
                  </div>
                  <p className="text-sm text-gray-600 ml-12 leading-relaxed">
                    {f.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">暂无反馈</p>
            </div>
          )}
        </div>
      </div>
    </OrgLayout>
  );
}
