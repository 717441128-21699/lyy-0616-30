import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone,
  Calendar,
  Users,
  Send,
  Inbox,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { OrgLayout } from '../../components/OrgLayout';
import { activityApi, activityReminderApi } from '../../api';
import type { ActivityReminderRecord } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import type { Activity } from '@shared/types';
import { cn } from '../../lib/utils';

export default function OrgNotifications() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [reminders, setReminders] = useState<ActivityReminderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [activityId, setActivityId] = useState<number | ''>('');
  const [targetScope, setTargetScope] = useState<'all_registered' | 'approved_only'>('all_registered');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

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
      const [activityResult, reminderResult] = await Promise.all([
        activityApi.getMyActivities(),
        activityReminderApi.getList(),
      ]);
      setActivities(activityResult.list.filter(a => a.status === 'published' || a.status === 'ongoing'));
      setReminders(reminderResult.reminders);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedActivity = activities.find(a => a.id === activityId);

  const handleActivityChange = (id: string) => {
    const numId = id ? Number(id) : '';
    setActivityId(numId);
    if (numId) {
      const act = activities.find(a => a.id === numId);
      if (act && !title) {
        setTitle(`活动提醒：${act.title}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityId || !content.trim()) {
      alert('请填写完整信息');
      return;
    }
    setSubmitting(true);
    try {
      const result = await activityReminderApi.send({
        activityId: Number(activityId),
        targetScope,
        title: title.trim() || undefined,
        content: content.trim(),
      });
      alert(`发送成功！已发送给 ${result.record.receiverCount} 位志愿者`);
      setTitle('');
      setContent('');
      setActivityId('');
      setTargetScope('all_registered');
      loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : '发送失败';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const scopeLabels: Record<string, string> = {
    all_registered: '所有报名志愿者',
    approved_only: '仅审核通过志愿者',
  };

  return (
    <OrgLayout>
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">通知运营</h1>
              <p className="text-gray-500 text-sm mt-0.5">给志愿者发送活动提醒，提高参与率</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-2">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 flex items-center space-x-2">
                  <Send className="w-5 h-5 text-emerald-600" />
                  <span>发送活动提醒</span>
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    选择活动 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={activityId}
                    onChange={(e) => handleActivityChange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                    required
                  >
                    <option value="">请选择活动</option>
                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.title}（{activity.startDate}）
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    发送范围 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={cn(
                        'flex items-center space-x-3 px-4 py-3 border rounded-xl cursor-pointer transition-all',
                        targetScope === 'all_registered'
                          ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <input
                        type="radio"
                        name="targetScope"
                        value="all_registered"
                        checked={targetScope === 'all_registered'}
                        onChange={() => setTargetScope('all_registered')}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <span className="text-sm font-medium text-gray-700">所有报名志愿者</span>
                    </label>
                    <label
                      className={cn(
                        'flex items-center space-x-3 px-4 py-3 border rounded-xl cursor-pointer transition-all',
                        targetScope === 'approved_only'
                          ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <input
                        type="radio"
                        name="targetScope"
                        value="approved_only"
                        checked={targetScope === 'approved_only'}
                        onChange={() => setTargetScope('approved_only')}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <span className="text-sm font-medium text-gray-700">仅审核通过志愿者</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    通知标题
                    <span className="text-gray-400 font-normal ml-2">（可选，默认自动生成）</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={selectedActivity ? `活动提醒：${selectedActivity.title}` : '请选择活动后自动生成'}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    通知内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="请输入通知内容，例如：活动将于明天上午9点开始，请准时参加，记得携带水杯和防晒用品..."
                    rows={5}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !activityId || !content.trim()}
                  className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <Send className="w-5 h-5" />
                  <span>{submitting ? '发送中...' : '发送通知'}</span>
                </button>
              </form>
            </div>
          </div>

          <div className="col-span-3">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-800 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>发送记录</span>
                </h2>
                <span className="text-sm text-gray-500">共 {reminders.length} 条</span>
              </div>

              {loading ? (
                <div className="p-12 text-center text-gray-400">加载中...</div>
              ) : reminders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          活动名称
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          发送范围
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          通知标题
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          接收人数
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          发送时间
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reminders.map((reminder) => (
                        <tr key={reminder.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                                {reminder.activityTitle}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              reminder.targetScope === 'all_registered'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            )}>
                              {scopeLabels[reminder.targetScope]}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700 truncate max-w-[200px] block">
                              {reminder.title}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <Users className="w-4 h-4 text-emerald-500" />
                              <span className="text-sm font-semibold text-gray-800">
                                {reminder.receiverCount}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500">
                              {formatDateTime(reminder.createdAt)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium mb-1">暂无发送记录</p>
                  <p className="text-gray-400 text-sm">发送的活动提醒会在这里显示</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </OrgLayout>
  );
}
