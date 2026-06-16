import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  Clock,
  Star,
  BarChart3,
  Eye,
} from 'lucide-react';
import { OrgLayout } from '../../components/OrgLayout';
import { activityApi } from '../../api';
import type { ActivityStats } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import { ACTIVITY_TYPE_LABELS } from '@shared/types';
import { cn } from '../../lib/utils';

export default function OrgStats() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [statsList, setStatsList] = useState<ActivityStats[]>([]);
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
      const result = await activityApi.getStats();
      setStatsList(result.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalActivities = statsList.length;
  const totalRegistrations = statsList.reduce((sum, s) => sum + s.registrationCount, 0);
  const totalHours = statsList.reduce((sum, s) => sum + s.totalServiceHours, 0);
  const avgRating = statsList.length > 0
    ? statsList.reduce((sum, s) => sum + s.avgRating * s.feedbackCount, 0) /
      Math.max(statsList.reduce((sum, s) => sum + s.feedbackCount, 0), 1)
    : 0;

  const summaryCards = [
    {
      label: '总活动数',
      value: totalActivities,
      icon: Calendar,
      fromColor: 'from-emerald-500',
      toColor: 'to-teal-500',
    },
    {
      label: '总报名数',
      value: totalRegistrations,
      icon: Users,
      fromColor: 'from-blue-500',
      toColor: 'to-cyan-500',
    },
    {
      label: '总服务时长',
      value: totalHours.toFixed(1),
      unit: '小时',
      icon: Clock,
      fromColor: 'from-amber-500',
      toColor: 'to-orange-500',
    },
    {
      label: '平均反馈评分',
      value: avgRating.toFixed(1),
      icon: Star,
      fromColor: 'from-purple-500',
      toColor: 'to-pink-500',
    },
  ];

  return (
    <OrgLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">数据看板</h1>
          <p className="text-gray-500">查看活动整体数据表现和运营效果</p>
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

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center">
              <BarChart3 className="w-5 h-5 text-emerald-500 mr-2" />
              活动数据统计
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">加载中...</div>
          ) : statsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      活动名称
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      类型
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      日期
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      城市
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                      报名人数
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                      通过率
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                      签到率
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                      服务时长
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                      平均分
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statsList.map((stat) => (
                    <tr
                      key={stat.activityId}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">
                          {stat.activityTitle}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {ACTIVITY_TYPE_LABELS[stat.activityType as keyof typeof ACTIVITY_TYPE_LABELS] || stat.activityType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {stat.activityDate}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {stat.city}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-gray-800">
                          {stat.registrationCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium',
                          stat.approvalRate >= 80
                            ? 'bg-emerald-100 text-emerald-700'
                            : stat.approvalRate >= 50
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        )}>
                          {stat.approvalRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium',
                          stat.checkInRate >= 80
                            ? 'bg-emerald-100 text-emerald-700'
                            : stat.checkInRate >= 50
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        )}>
                          {stat.checkInRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-gray-800">
                          {stat.totalServiceHours.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">h</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="font-medium text-gray-800">
                            {stat.avgRating.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate(`/org/activity/${stat.activityId}/stats`)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>查看详情</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">暂无活动数据</p>
              <button
                onClick={() => navigate('/org/activities')}
                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
              >
                去发布活动
              </button>
            </div>
          )}
        </div>
      </div>
    </OrgLayout>
  );
}
