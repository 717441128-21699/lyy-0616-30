import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  QrCode as QrCodeIcon,
  Star,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { activityApi, registrationApi, feedbackApi } from '../api';
import { useAuthStore } from '../store/useAuthStore';
import type { Activity, Registration, Feedback } from '@shared/types';
import {
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
} from '@shared/types';
import { cn } from '../lib/utils';

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [error, setError] = useState('');

  const fetchActivity = async () => {
    if (!id) return;
    try {
      const result = await activityApi.getDetail(Number(id));
      setActivity(result);
    } catch (err) {
      console.error('Failed to fetch activity:', err);
      setError('获取活动信息失败');
    }
  };

  const fetchMyRegistration = async () => {
    if (!id || !user) return;
    try {
      const result = await registrationApi.getMyRegistrations();
      const myReg = result.list.find((r) => r.activityId === Number(id));
      if (myReg) {
        setRegistration(myReg);
      }
    } catch (err) {
      console.error('Failed to fetch registration:', err);
    }
  };

  const fetchFeedback = async () => {
    if (!id) return;
    try {
      const result = await feedbackApi.getByActivity(Number(id));
      setFeedbackList(result.list);
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchActivity(), fetchFeedback()]);
      if (user) {
        await fetchMyRegistration();
      }
      setLoading(false);
    };
    loadData();
  }, [id, user]);

  const handleRegister = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/activity/${id}` } });
      return;
    }
    if (!id) return;

    setRegistering(true);
    setError('');
    try {
      const result = await registrationApi.registerForActivity(Number(id));
      setRegistration(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : '报名失败';
      setError(message);
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!registration) return;
    if (!window.confirm('确定要取消报名吗？')) return;

    try {
      await registrationApi.cancel(registration.id);
      setRegistration(null);
      fetchActivity();
    } catch (err) {
      const message = err instanceof Error ? err.message : '取消失败';
      setError(message);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackContent.trim()) {
      setError('请填写反馈内容');
      return;
    }
    if (!id) return;

    setSubmittingFeedback(true);
    setError('');
    try {
      await feedbackApi.create({
        activityId: Number(id),
        rating,
        content: feedbackContent.trim(),
      });
      setShowFeedbackForm(false);
      setFeedbackContent('');
      fetchFeedback();
    } catch (err) {
      const message = err instanceof Error ? err.message : '提交失败';
      setError(message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">活动不存在</p>
          <Link to="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
            返回活动列表
          </Link>
        </div>
      </div>
    );
  }

  const isFull = activity.currentParticipants >= activity.maxParticipants;
  const canRegister = user?.role === 'volunteer' && !registration && !isFull && activity.status === 'published';
  const hasRegistered = !!registration;
  const isApproved = registration?.status === 'approved';
  const isCompleted = activity.status === 'completed';
  const hasCompletedService = registration?.status === 'completed';
  const canSubmitFeedback = isCompleted && hasCompletedService && !feedbackList.some(fb => fb.userId === user?.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-500';
      case 'ongoing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      case 'draft':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-8">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-4 md:left-8 flex items-center space-x-2 text-white/90 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm">
              {ACTIVITY_TYPE_LABELS[activity.type]}
            </span>
            <span className={cn(
              'px-3 py-1 backdrop-blur-sm text-white rounded-full text-sm',
              getStatusColor(activity.status)
            )}>
              {ACTIVITY_STATUS_LABELS[activity.status]}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {activity.title}
          </h1>
          <div className="flex items-center space-x-2 text-white/80 text-sm">
            <User className="w-4 h-4" />
            <span>{activity.organizerName}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-16">
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <FileText className="w-5 h-5 text-emerald-500 mr-2" />
                活动介绍
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {activity.description}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 text-emerald-500 mr-2" />
                志愿者要求
              </h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {activity.requirements}
              </div>
            </div>

            {activity.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-amber-800 mb-3 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  注意事项
                </h2>
                <p className="text-amber-700 leading-relaxed whitespace-pre-wrap">
                  {activity.notes}
                </p>
              </div>
            )}

            {activity.summary && isCompleted && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                <h2 className="text-lg font-bold text-emerald-800 mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  活动总结
                </h2>
                <p className="text-emerald-700 leading-relaxed whitespace-pre-wrap">
                  {activity.summary}
                </p>
              </div>
            )}

            {isCompleted && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center">
                    <MessageSquare className="w-5 h-5 text-emerald-500 mr-2" />
                    志愿者反馈
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({feedbackList.length}条)
                    </span>
                  </h2>
                  {canSubmitFeedback && (
                    <button
                      onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      写反馈
                    </button>
                  )}
                </div>

                {showFeedbackForm && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={cn(
                              'w-6 h-6 transition-colors',
                              star <= rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-300'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                      placeholder="分享你的活动体验..."
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none h-24"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        type="button"
                        onClick={handleSubmitFeedback}
                        disabled={submittingFeedback}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center space-x-1"
                      >
                        {submittingFeedback ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>提交中...</span>
                          </>
                        ) : (
                          <span>提交反馈</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {feedbackList.length > 0 ? (
                  <div className="space-y-4">
                    {feedbackList.map((fb) => (
                      <div key={fb.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="font-medium text-gray-700">{fb.userName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {[...Array(fb.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm ml-10">{fb.content}</p>
                        <p className="text-xs text-gray-400 ml-10 mt-1">
                          {new Date(fb.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400">暂无反馈</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h3 className="font-bold text-gray-800 mb-4">活动信息</h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-500">活动地点</p>
                    <p className="text-gray-800 font-medium">{activity.city} · {activity.location}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-500">活动日期</p>
                    <p className="text-gray-800 font-medium">
                      {activity.startDate}
                      {activity.startDate !== activity.endDate && ` 至 ${activity.endDate}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-500">活动时间</p>
                    <p className="text-gray-800 font-medium">{activity.startTime} - {activity.endTime}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-500">报名人数</p>
                      <p className="text-gray-800 font-medium">
                        {activity.currentParticipants}/{activity.maxParticipants} 人
                      </p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          isFull ? 'bg-orange-400' : 'bg-gradient-to-r from-emerald-400 to-teal-400'
                        )}
                        style={{ width: `${Math.min((activity.currentParticipants / activity.maxParticipants) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {canRegister && (
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-200 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {registering ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>报名中...</span>
                      </>
                    ) : (
                      <span>立即报名</span>
                    )}
                  </button>
                )}

                {hasRegistered && (
                  <div className="space-y-3">
                    <div
                      className={cn(
                        'p-3 rounded-xl text-center',
                        registration?.status === 'approved' && 'bg-emerald-50 text-emerald-700',
                        registration?.status === 'pending' && 'bg-amber-50 text-amber-700',
                        registration?.status === 'rejected' && 'bg-red-50 text-red-700',
                        registration?.status === 'cancelled' && 'bg-gray-50 text-gray-600',
                        registration?.status === 'completed' && 'bg-blue-50 text-blue-700'
                      )}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {registration?.status === 'approved' && <CheckCircle className="w-5 h-5" />}
                        {registration?.status === 'pending' && <AlertCircle className="w-5 h-5" />}
                        {registration?.status === 'rejected' && <XCircle className="w-5 h-5" />}
                        {registration?.status === 'completed' && <CheckCircle className="w-5 h-5" />}
                        <span className="font-medium">
                          {REGISTRATION_STATUS_LABELS[registration?.status || 'pending']}
                        </span>
                      </div>
                      {registration?.auditNote && (
                        <p className="text-xs mt-1 opacity-80">{registration.auditNote}</p>
                      )}
                    </div>

                    {isApproved && (
                      <div className="bg-white border-2 border-emerald-100 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-600 mb-3 flex items-center justify-center">
                          <QrCodeIcon className="w-4 h-4 mr-1" />
                          参与凭证
                        </p>
                        <div className="bg-white p-3 rounded-lg inline-block border border-gray-100">
                          <QRCodeCanvas
                            value={registration?.qrToken || ''}
                            size={120}
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          活动当天请出示此二维码签到
                        </p>
                      </div>
                    )}

                    {registration?.status === 'pending' && (
                      <p className="text-xs text-center text-gray-500">
                        请耐心等待组织方审核
                      </p>
                    )}

                    {(registration?.status === 'pending' || registration?.status === 'approved') && !isCompleted && (
                      <button
                        type="button"
                        onClick={handleCancelRegistration}
                        className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                      >
                        取消报名
                      </button>
                    )}
                  </div>
                )}

                {isFull && !hasRegistered && (
                  <div className="text-center py-4">
                    <p className="text-orange-500 font-medium">报名人数已满</p>
                    <p className="text-xs text-gray-400 mt-1">下次要早点来哦~</p>
                  </div>
                )}

                {user?.role === 'organization' && activity.organizerId === user.id && (
                  <Link
                    to={`/org/activities/${activity.id}/registrations`}
                    className="block w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-center text-sm"
                  >
                    管理报名
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
