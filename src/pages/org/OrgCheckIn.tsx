import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  QrCode,
  Clock,
  CheckCircle,
  User,
  Users,
  LogIn,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { OrgLayout } from '../../components/OrgLayout';
import { registrationApi, activityApi } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import type { Registration, Activity } from '@shared/types';
import { cn } from '../../lib/utils';

export default function OrgCheckIn() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [actionType, setActionType] = useState<'checkin' | 'checkout'>('checkin');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'organization') {
      navigate('/login');
      return;
    }
    loadActivities();
  }, [user, navigate]);

  useEffect(() => {
    if (activityId) {
      const id = Number(activityId);
      if (!isNaN(id)) {
        setSelectedActivityId(id);
      }
    }
  }, [activityId, activities]);

  useEffect(() => {
    if (selectedActivityId) {
      loadRegistrations(selectedActivityId);
    }
  }, [selectedActivityId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const result = await activityApi.getMyActivities();
      setActivities(result.list);
      if (result.list.length > 0 && !selectedActivityId && !activityId) {
        setSelectedActivityId(result.list[0].id);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrations = async (activityId: number) => {
    setRegistrationsLoading(true);
    try {
      const result = await registrationApi.getActivityRegistrations(activityId);
      setRegistrations(result.list);
    } catch (err) {
      console.error('Failed to load registrations:', err);
    } finally {
      setRegistrationsLoading(false);
    }
  };

  const handleAction = async () => {
    if (!qrTokenInput.trim()) {
      setMessage({ type: 'error', text: '请输入二维码Token' });
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      if (actionType === 'checkin') {
        const result = await registrationApi.checkIn(qrTokenInput.trim());
        setMessage({ type: 'success', text: `签到成功 - ${result.userName}` });
      } else {
        const result = await registrationApi.checkOut(qrTokenInput.trim());
        setMessage({
          type: 'success',
          text: `签退成功 - ${result.userName}，服务时长 ${result.serviceHours?.toFixed(1)} 小时`,
        });
      }
      setQrTokenInput('');
      if (selectedActivityId) {
        loadRegistrations(selectedActivityId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '操作失败';
      setMessage({ type: 'error', text: msg });
    } finally {
      setProcessing(false);
    }
  };

  const checkedInList = registrations.filter((r) => r.checkInTime && !r.checkOutTime);
  const completedList = registrations.filter((r) => r.checkOutTime);
  const totalHours = completedList.reduce((sum, r) => sum + (r.serviceHours || 0), 0);

  const selectedActivity = activities.find((a) => a.id === selectedActivityId);

  return (
    <OrgLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">签到管理</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={selectedActivityId || ''}
                onChange={(e) => setSelectedActivityId(Number(e.target.value))}
                className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 cursor-pointer min-w-[280px]"
              >
                <option value="" disabled>
                  请选择活动
                </option>
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {selectedActivity && (
              <span className="text-sm text-gray-500">
                {selectedActivity.city} · {selectedActivity.startDate}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已签到</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{checkedInList.length}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <LogIn className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{completedList.length}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总服务时长</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {totalHours.toFixed(1)}h
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-8 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">扫码签到</h2>
              <p className="text-emerald-100 text-sm">
                扫描志愿者的参与凭证二维码，或手动输入二维码Token
              </p>
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
              <QrCode className="w-12 h-12 text-white" />
            </div>
          </div>

          <div className="mt-6">
            <div className="flex bg-white/20 rounded-xl p-1 mb-4 inline-flex">
              <button
                onClick={() => setActionType('checkin')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  actionType === 'checkin' ? 'bg-white text-emerald-600' : 'text-white hover:bg-white/10'
                )}
              >
                签到
              </button>
              <button
                onClick={() => setActionType('checkout')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  actionType === 'checkout' ? 'bg-white text-emerald-600' : 'text-white hover:bg-white/10'
                )}
              >
                签退
              </button>
            </div>

            <div className="flex space-x-3">
              <input
                type="text"
                value={qrTokenInput}
                onChange={(e) => setQrTokenInput(e.target.value)}
                placeholder="请扫描二维码或输入Token..."
                className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
                onKeyDown={(e) => e.key === 'Enter' && handleAction()}
              />
              <button
                onClick={handleAction}
                disabled={processing}
                className="px-8 py-3 bg-white text-emerald-600 font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {processing ? '处理中...' : actionType === 'checkin' ? '确认签到' : '确认签退'}
              </button>
            </div>

            {message && (
              <div
                className={cn(
                  'mt-4 p-3 rounded-xl text-sm flex items-center space-x-2',
                  message.type === 'success' ? 'bg-white/20 text-white' : 'bg-red-500/30 text-white'
                )}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="w-5 h-5 flex items-center justify-center font-bold">!</span>
                )}
                <span>{message.text}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center">
              <Users className="w-5 h-5 text-emerald-500 mr-2" />
              签到记录
            </h2>
          </div>

          {registrationsLoading ? (
            <div className="p-12 text-center text-gray-400">加载中...</div>
          ) : registrations.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {registrations.map((reg) => (
                <div key={reg.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{reg.userName}</h3>
                        <p className="text-sm text-gray-500">{reg.userPhone || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">签到时间</p>
                        <p className="text-sm text-gray-600">
                          {reg.checkInTime
                            ? new Date(reg.checkInTime).toLocaleString('zh-CN')
                            : '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">签退时间</p>
                        <p className="text-sm text-gray-600">
                          {reg.checkOutTime
                            ? new Date(reg.checkOutTime).toLocaleString('zh-CN')
                            : '-'}
                        </p>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-xs text-gray-400">服务时长</p>
                        <p className="text-sm font-medium text-emerald-600">
                          {reg.serviceHours ? `${reg.serviceHours.toFixed(1)}h` : '-'}
                        </p>
                      </div>
                      <div>
                        {reg.checkOutTime ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            已完成
                          </span>
                        ) : reg.checkInTime ? (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            进行中
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            未签到
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">暂无签到记录</p>
            </div>
          )}
        </div>
      </div>
    </OrgLayout>
  );
}
