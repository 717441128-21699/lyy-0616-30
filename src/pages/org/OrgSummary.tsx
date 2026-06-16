import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  MessageSquare,
  ArrowRight,
  Send,
  CheckCircle,
} from 'lucide-react';
import { OrgLayout } from '../../components/OrgLayout';
import { activityApi } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import type { Activity } from '@shared/types';
import { cn } from '../../lib/utils';

export default function OrgSummary() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [summaryText, setSummaryText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      const completed = result.list.filter((a) => a.status === 'completed');
      setActivities(completed);
      if (completed.length > 0) {
        setSelectedActivity(completed[0]);
        setSummaryText(completed[0].summary || '');
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setSummaryText(activity.summary || '');
    setSuccessMessage(null);
  };

  const handleSubmitSummary = async () => {
    if (!selectedActivity) return;
    if (!summaryText.trim()) {
      alert('请填写活动总结内容');
      return;
    }

    setSubmitting(true);
    setSuccessMessage(null);
    try {
      const updated = await activityApi.addSummary(selectedActivity.id, summaryText.trim());
      setSuccessMessage('活动总结发布成功');
      setSelectedActivity(updated);
      setActivities((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : '发布失败';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OrgLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">活动总结</h1>
          <p className="text-gray-500 text-sm mt-1">发布活动总结和感谢消息</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 flex items-center">
                  <Calendar className="w-5 h-5 text-emerald-500 mr-2" />
                  已结束活动
                </h2>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-400">加载中...</div>
              ) : activities.length > 0 ? (
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {activities.map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => handleSelectActivity(activity)}
                      className={cn(
                        'w-full p-4 text-left hover:bg-gray-50 transition-colors',
                        selectedActivity?.id === activity.id ? 'bg-emerald-50' : ''
                      )}
                    >
                      <h3 className="font-medium text-gray-800 text-sm line-clamp-1">
                        {activity.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{activity.startDate}</p>
                      {activity.summary && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">
                          已发布总结
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">暂无已结束的活动</p>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              {selectedActivity ? (
                <>
                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                      {selectedActivity.title}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{selectedActivity.city}</span>
                      <span>{selectedActivity.startDate}</span>
                      <span>
                        {selectedActivity.currentParticipants}/
                        {selectedActivity.maxParticipants} 人参与
                      </span>
                    </div>
                  </div>

                  {successMessage && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="w-4 h-4 inline mr-1" />
                      活动总结
                    </label>
                    <textarea
                      value={summaryText}
                      onChange={(e) => setSummaryText(e.target.value)}
                      placeholder="分享活动的精彩瞬间、成果和感谢的话..."
                      className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none h-48"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/activity/${selectedActivity.id}`)}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center"
                    >
                      查看活动详情
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleSubmitSummary}
                        disabled={submitting}
                        className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        <span>{submitting ? '发布中...' : '发布总结'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-amber-50 rounded-xl">
                    <h4 className="font-medium text-amber-800 text-sm mb-2 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      温馨提示
                    </h4>
                    <ul className="text-xs text-amber-700 space-y-1">
                      <li>• 活动总结将展示在活动详情页，所有用户可见</li>
                      <li>• 建议包含活动成果、精彩瞬间、感谢志愿者等内容</li>
                      <li>• 发布后可以继续编辑更新</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="py-16 text-center">
                  <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400">请选择一个活动来发布总结</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </OrgLayout>
  );
}
