import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  MessageSquare,
  Calendar,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { OrgLayout } from '../../components/OrgLayout';
import { registrationApi, activityApi } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import type { Registration, RegistrationStatus, Activity } from '@shared/types';
import { REGISTRATION_STATUS_LABELS, ACTIVITY_STATUS_LABELS } from '@shared/types';
import { cn } from '../../lib/utils';

export default function OrgRegistrations() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const activityIdFromQuery = searchParams.get('activityId');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [auditNote, setAuditNote] = useState('');
  const [auditingId, setAuditingId] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRegId, setRejectRegId] = useState<number | null>(null);

  const currentActivityId = id ? Number(id) : activityIdFromQuery ? Number(activityIdFromQuery) : null;

  useEffect(() => {
    if (!user || user.role !== 'organization') {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, navigate, currentActivityId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (currentActivityId) {
        const [activityResult, regResult] = await Promise.all([
          activityApi.getDetail(currentActivityId),
          registrationApi.getActivityRegistrations(currentActivityId),
        ]);
        setActivity(activityResult);
        setRegistrations(regResult.list);
      } else {
        const activityResult = await activityApi.getMyActivities();
        setActivities(activityResult.list);

        const allRegs: Registration[] = [];
        for (const act of activityResult.list) {
          try {
            const regResult = await registrationApi.getActivityRegistrations(act.id);
            regResult.list.forEach((reg) => {
              allRegs.push({ ...reg, activity: act });
            });
          } catch {
            // skip if error
          }
        }
        setRegistrations(allRegs);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async (regId: number, approved: boolean) => {
    if (!approved) {
      setRejectRegId(regId);
      setShowRejectModal(true);
      return;
    }
    await doAudit(regId, true, '');
  };

  const handleRejectConfirm = async () => {
    if (rejectRegId === null) return;
    await doAudit(rejectRegId, false, auditNote);
    setShowRejectModal(false);
    setRejectRegId(null);
    setAuditNote('');
  };

  const doAudit = async (regId: number, approved: boolean, note: string) => {
    setAuditingId(regId);
    try {
      await registrationApi.audit(regId, approved, note || undefined);
      loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : '审核失败';
      alert(message);
    } finally {
      setAuditingId(null);
    }
  };

  const filteredRegistrations = registrations.filter(
    (r) => filterStatus === 'all' || r.status === filterStatus
  );

  const statusColors: Record<RegistrationStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
    completed: 'bg-blue-100 text-blue-700',
  };

  const statusFilters = [
    { key: 'all', label: '全部', count: registrations.length },
    { key: 'pending', label: '待审核', count: registrations.filter((r) => r.status === 'pending').length },
    { key: 'approved', label: '已通过', count: registrations.filter((r) => r.status === 'approved').length },
    { key: 'rejected', label: '已拒绝', count: registrations.filter((r) => r.status === 'rejected').length },
    { key: 'cancelled', label: '已取消', count: registrations.filter((r) => r.status === 'cancelled').length },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <OrgLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            {currentActivityId ? '报名管理' : '报名审核'}
          </h1>
          <p className="text-gray-500 text-sm">
            {activity
              ? activity.title
              : currentActivityId
              ? '加载中...'
              : '管理所有活动的志愿者报名'}
          </p>
        </div>

        {!currentActivityId && activities.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Filter className="w-4 h-4 mr-1" />
              筛选活动
            </label>
            <select
              value={activityIdFromQuery || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  navigate(`/org/registrations?activityId=${value}`);
                } else {
                  navigate('/org/registrations');
                }
              }}
              className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
            >
              <option value="">全部活动</option>
              {activities.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
          {statusFilters.map((item) => (
            <button
              key={item.key}
              onClick={() => setFilterStatus(item.key)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                filterStatus === item.key
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
              )}
            >
              {item.label}
              <span
                className={cn(
                  'ml-2 px-2 py-0.5 rounded-full text-xs',
                  filterStatus === item.key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center">
              <Users className="w-5 h-5 text-emerald-500 mr-2" />
              报名列表
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">加载中...</div>
          ) : filteredRegistrations.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredRegistrations.map((reg) => (
                <div key={reg.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-800">
                            {reg.userName}
                          </h3>
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-xs font-medium',
                              statusColors[reg.status]
                            )}
                          >
                            {REGISTRATION_STATUS_LABELS[reg.status]}
                          </span>
                        </div>
                        {reg.activity && (
                          <p className="text-sm text-emerald-600 mt-1 font-medium">
                            {reg.activity.title}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{reg.userPhone || '-'}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>报名于 {formatDate(reg.registeredAt)}</span>
                          </span>
                        </div>
                        {reg.serviceHours !== undefined && reg.serviceHours > 0 && (
                          <p className="text-emerald-600 text-sm mt-1">
                            服务时长：{reg.serviceHours.toFixed(1)} 小时
                          </p>
                        )}
                        {reg.auditNote && (
                          <div className="flex items-start space-x-1 mt-2 text-xs text-gray-400">
                            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{reg.auditNote}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {reg.status === 'pending' && (
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleAudit(reg.id, true)}
                          disabled={auditingId === reg.id}
                          className="flex items-center space-x-1 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>通过</span>
                        </button>
                        <button
                          onClick={() => handleAudit(reg.id, false)}
                          disabled={auditingId === reg.id}
                          className="flex items-center space-x-1 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>拒绝</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">暂无报名记录</p>
            </div>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">拒绝报名</h3>
                  <p className="text-sm text-gray-500">请填写拒绝原因（可选）</p>
                </div>
              </div>
              <textarea
                value={auditNote}
                onChange={(e) => setAuditNote(e.target.value)}
                placeholder="请输入拒绝原因，将发送给志愿者..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all resize-none"
              />
            </div>
            <div className="p-6 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectRegId(null);
                  setAuditNote('');
                }}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={auditingId === rejectRegId}
                className="px-5 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {auditingId === rejectRegId ? '处理中...' : '确认拒绝'}
              </button>
            </div>
          </div>
        </div>
      )}
    </OrgLayout>
  );
}
