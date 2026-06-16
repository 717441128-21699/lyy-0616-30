import { useState, useEffect, useMemo } from 'react';
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
  Copy,
  Check,
  BarChart3,
  Bell,
  Eye,
  Building,
} from 'lucide-react';
import { OrgLayout } from '../../components/OrgLayout';
import { activityApi } from '../../api';
import type { ActivityReviewReport } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import { ACTIVITY_TYPE_LABELS, REGISTRATION_STATUS_LABELS } from '@shared/types';
import { cn } from '../../lib/utils';

export default function OrgActivityReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [report, setReport] = useState<ActivityReviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
      const result = await activityApi.getReviewReport(Number(id));
      setReport(result.report);
    } catch (err) {
      console.error('Failed to load review report:', err);
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

  const reviewText = useMemo(() => {
    if (!report) return '';
    const { activity, summary, reminders } = report;
    
    const approvalRate = summary.registrationCount > 0
      ? ((summary.approvedCount / summary.registrationCount) * 100).toFixed(1)
      : '0.0';
    const checkInRate = summary.approvedCount > 0
      ? ((summary.checkInCount / summary.approvedCount) * 100).toFixed(1)
      : '0.0';
    const avgHours = summary.checkInCount > 0
      ? (summary.totalServiceHours / summary.checkInCount).toFixed(1)
      : '0.0';
    const goodRate = summary.feedbackCount > 0
      ? ((report.feedbacks.filter(f => f.rating >= 4).length / summary.feedbackCount) * 100).toFixed(1)
      : '0.0';
    
    const totalReceivers = reminders.reduce((sum, r) => sum + r.receiverCount, 0);
    
    const typeLabel = ACTIVITY_TYPE_LABELS[activity.type as keyof typeof ACTIVITY_TYPE_LABELS] || activity.type;
    
    return `【活动复盘】${activity.title}
——————————————
活动时间：${activity.startDate} ~ ${activity.endDate}
活动地点：${activity.location}
活动类型：${typeLabel}
主办方：${activity.organizerName}

📊 数据概览
• 报名人数：${summary.registrationCount} 人
• 审核通过：${summary.approvedCount} 人（通过率 ${approvalRate}%）
• 实际签到：${summary.checkInCount} 人（签到率 ${checkInRate}%）
• 总服务时长：${summary.totalServiceHours.toFixed(1)} 小时
• 志愿者平均服务时长：${avgHours} 小时

⭐ 反馈评价
• 平均评分：${summary.avgRating.toFixed(1)} 分（共 ${summary.feedbackCount} 条评价）
• 好评率：${goodRate}%

💡 活动亮点
（请填写）

📝 待改进
（请填写）

📢 通知发送
• 本次活动共发送 ${reminders.length} 次提醒，覆盖 ${totalReceivers} 人次
`;
  }, [report]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reviewText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const summaryCards = [
    {
      label: '报名人数',
      value: report?.summary.registrationCount || 0,
      icon: Users,
      fromColor: 'from-emerald-500',
      toColor: 'to-teal-500',
    },
    {
      label: '通过人数',
      value: report?.summary.approvedCount || 0,
      subValue: `通过率 ${(report?.summary.approvalRate || 0).toFixed(1)}%`,
      icon: Users,
      fromColor: 'from-blue-500',
      toColor: 'to-cyan-500',
    },
    {
      label: '签到人数',
      value: report?.summary.checkInCount || 0,
      subValue: `签到率 ${(report?.summary.checkInRate || 0).toFixed(1)}%`,
      icon: LogIn,
      fromColor: 'from-amber-500',
      toColor: 'to-orange-500',
    },
    {
      label: '总服务时长',
      value: (report?.summary.totalServiceHours || 0).toFixed(1),
      unit: '小时',
      icon: Clock,
      fromColor: 'from-purple-500',
      toColor: 'to-pink-500',
    },
  ];

  const goodRate = useMemo(() => {
    if (!report || report.summary.feedbackCount === 0) return 0;
    return (report.feedbacks.filter(f => f.rating >= 4).length / report.summary.feedbackCount) * 100;
  }, [report]);

  const avgServiceHours = useMemo(() => {
    if (!report || report.summary.checkInCount === 0) return 0;
    return report.summary.totalServiceHours / report.summary.checkInCount;
  }, [report]);

  const totalReceivers = useMemo(() => {
    if (!report) return 0;
    return report.reminders.reduce((sum, r) => sum + r.receiverCount, 0);
  }, [report]);

  const topVolunteers = useMemo(() => {
    if (!report) return [];
    return report.volunteers.slice(0, 5);
  }, [report]);

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
    completed: 'bg-blue-100 text-blue-700',
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

  if (!report) {
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
            <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">活动不存在或无权限访问</p>
          </div>
        </div>
      </OrgLayout>
    );
  }

  const { activity, summary, volunteers, feedbacks, reminders } = report;

  return (
    <OrgLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/org/stats')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回看板</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {activity.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{activity.startDate} ~ {activity.endDate}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{activity.city} · {activity.location}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Building className="w-4 h-4" />
                  <span>{activity.organizerName}</span>
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                  {ACTIVITY_TYPE_LABELS[activity.type as keyof typeof ACTIVITY_TYPE_LABELS] || activity.type}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium',
                activity.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                activity.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                'bg-emerald-100 text-emerald-700'
              )}>
                {activity.status === 'completed' ? '已结束' :
                 activity.status === 'ongoing' ? '进行中' : '招募中'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-6">
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

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 text-emerald-500 mr-2" />
              报名转化分析
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">报名 → 审核通过转化率</span>
                <span className="font-semibold text-emerald-600">{summary.approvalRate.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                  style={{ width: `${Math.min(summary.approvalRate, 100)}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-600">审核通过 → 签到转化率</span>
                <span className="font-semibold text-blue-600">{summary.checkInRate.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                  style={{ width: `${Math.min(summary.checkInRate, 100)}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-600">平均服务时长</span>
                <span className="font-semibold text-amber-600">{avgServiceHours.toFixed(1)} 小时</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <Star className="w-5 h-5 text-amber-500 mr-2" />
              反馈分析
            </h3>
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-amber-500">{summary.avgRating.toFixed(1)}</p>
                <div className="mt-2">{renderStars(summary.avgRating)}</div>
                <p className="text-xs text-gray-500 mt-1">平均评分</p>
              </div>
              <div className="h-16 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{summary.feedbackCount}</p>
                <p className="text-xs text-gray-500 mt-1">反馈条数</p>
              </div>
              <div className="h-16 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{goodRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">好评率（4星及以上）</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center">
              <Users className="w-5 h-5 text-emerald-500 mr-2" />
              志愿者明细
              <span className="ml-2 text-sm font-normal text-gray-500">
                共 {volunteers.length} 人
              </span>
            </h3>
            <button
              onClick={() => navigate(`/org/activity/${id}/stats`)}
              className="inline-flex items-center space-x-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <Eye className="w-4 h-4" />
              <span>查看全部</span>
            </button>
          </div>

          {topVolunteers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                      姓名
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                      手机
                    </th>
                    <th className="text-center px-6 py-3 text-sm font-semibold text-gray-600">
                      报名状态
                    </th>
                    <th className="text-center px-6 py-3 text-sm font-semibold text-gray-600">
                      签到时间
                    </th>
                    <th className="text-center px-6 py-3 text-sm font-semibold text-gray-600">
                      服务时长
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topVolunteers.map((v) => (
                    <tr
                      key={v.registrationId}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="font-medium text-gray-800 text-sm">
                            {v.userName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{v.userPhone || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium',
                            statusColors[v.status] || 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {REGISTRATION_STATUS_LABELS[v.status as keyof typeof REGISTRATION_STATUS_LABELS] || v.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center text-sm text-gray-600">
                        {formatDateTime(v.checkInTime)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="font-medium text-emerald-600 text-sm">
                          {v.serviceHours !== null ? `${v.serviceHours.toFixed(1)} h` : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">暂无志愿者报名</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center">
              <Bell className="w-5 h-5 text-purple-500 mr-2" />
              已发送通知
              <span className="ml-2 text-sm font-normal text-gray-500">
                共 {reminders.length} 条，覆盖 {totalReceivers} 人次
              </span>
            </h3>
          </div>

          {reminders.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {reminders.map((r) => (
                <div key={r.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 text-sm">{r.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{r.content}</p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                        {r.receiverCount} 人
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDateTime(r.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">暂无发送记录</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center">
              <MessageSquare className="w-5 h-5 text-emerald-500 mr-2" />
              复盘文本生成器
            </h3>
            <button
              onClick={handleCopy}
              className={cn(
                'inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                copied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              )}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>复制全文</span>
                </>
              )}
            </button>
          </div>
          <div className="p-6">
            <textarea
              value={reviewText}
              readOnly
              className="w-full h-96 p-4 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </OrgLayout>
  );
}
