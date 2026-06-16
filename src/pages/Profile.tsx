import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Clock,
  Award,
  Calendar,
  ChevronRight,
  FileText,
  Star,
  Download,
  Trophy,
  Target,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { registrationApi, certificateApi, userApi, feedbackApi } from '../api';
import type { Registration, Certificate, Feedback, UserStats } from '@shared/types';
import { REGISTRATION_STATUS_LABELS, CERTIFICATE_LEVELS } from '@shared/types';
import { cn } from '../lib/utils';

type TabType = 'activities' | 'certificates' | 'feedback';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('activities');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/profile' } });
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [regResult, certResult, statsResult, feedbackResult] = await Promise.all([
          registrationApi.getMyRegistrations(),
          certificateApi.getMyCertificates(),
          userApi.getStats(),
          feedbackApi.getMyFeedback(),
        ]);
        setRegistrations(regResult.list);
        setCertificates(certResult.list);
        setStats(statsResult);
        setFeedbacks(feedbackResult.list);
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  const handleApplyCertificate = async () => {
    if (!stats?.nextLevel) return;

    setApplying(true);
    try {
      const result = await certificateApi.apply();
      setCertificates([result.certificate, ...certificates]);
      const newStats = await userApi.getStats();
      setStats(newStats);
      alert('证书申请成功！');
    } catch (err) {
      const message = err instanceof Error ? err.message : '申请失败';
      alert(message);
    } finally {
      setApplying(false);
    }
  };

  const handleDownloadCertificate = (id: number) => {
    window.open(`/api/certificates/${id}/pdf`, '_blank');
  };

  if (!user) return null;

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
    completed: 'bg-blue-100 text-blue-700',
  };

  const currentLevelInfo = stats?.currentLevel
    ? CERTIFICATE_LEVELS.find((l) => l.level === stats.currentLevel)
    : null;

  const canApplyCertificate = stats?.nextLevel && stats.nextLevel.progress >= 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <h1 className="text-2xl font-bold text-white mb-6">个人中心</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-16">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
              <p className="text-gray-500 text-sm">@{user.username}</p>
              {user.role === 'organization' && user.orgName && (
                <p className="text-emerald-600 text-sm mt-1">{user.orgName}</p>
              )}
            </div>
            {currentLevelInfo && (
              <div className="text-right">
                <div
                  className="px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${currentLevelInfo.color}20`,
                    color: currentLevelInfo.color,
                  }}
                >
                  <Trophy className="w-4 h-4 inline mr-1" />
                  {currentLevelInfo.name}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {stats?.totalHours?.toFixed(1) || 0}
            </div>
            <p className="text-sm text-gray-500 mt-1">累计服务时长（小时）</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {stats?.activityCount || 0}
            </div>
            <p className="text-sm text-gray-500 mt-1">参与活动数</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {stats?.certificateCount || 0}
            </div>
            <p className="text-sm text-gray-500 mt-1">获得证书数</p>
          </div>
        </div>

        {stats?.nextLevel && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-6 border border-amber-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${stats.nextLevel.level === 'bronze' ? '#CD7F32' : stats.nextLevel.level === 'silver' ? '#C0C0C0' : stats.nextLevel.level === 'gold' ? '#FFD700' : '#E5E4E2'}20` }}
                >
                  <Target
                    className="w-6 h-6"
                    style={{
                      color:
                        stats.nextLevel.level === 'bronze'
                          ? '#CD7F32'
                          : stats.nextLevel.level === 'silver'
                          ? '#C0C0C0'
                          : stats.nextLevel.level === 'gold'
                          ? '#FFD700'
                          : '#E5E4E2',
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500">下一等级</p>
                  <p className="font-bold text-gray-800">{stats.nextLevel.name}</p>
                  <p className="text-xs text-gray-400">
                    还需 {Math.max(stats.nextLevel.requiredHours - stats.nextLevel.currentHours, 0).toFixed(1)} 小时
                  </p>
                </div>
              </div>
              {canApplyCertificate && (
                <button
                  onClick={handleApplyCertificate}
                  disabled={applying}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-amber-200 transition-all disabled:opacity-50 text-sm"
                >
                  {applying ? '申请中...' : '立即申请'}
                </button>
              )}
            </div>
            <div className="mt-4">
              <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(stats.nextLevel.progress, 100)}%`,
                    backgroundColor:
                      stats.nextLevel.level === 'bronze'
                        ? '#CD7F32'
                        : stats.nextLevel.level === 'silver'
                        ? '#C0C0C0'
                        : stats.nextLevel.level === 'gold'
                        ? '#FFD700'
                        : '#E5E4E2',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[
              { key: 'activities', label: '参与记录', icon: Calendar },
              { key: 'certificates', label: '我的证书', icon: Award },
              { key: 'feedback', label: '我的反馈', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={cn(
                  'flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2',
                  activeTab === tab.key
                    ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-gray-400">加载中...</div>
            ) : activeTab === 'activities' ? (
              registrations.length > 0 ? (
                <div className="space-y-3">
                  {registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="p-4 border border-gray-100 rounded-xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer"
                      onClick={() => navigate(`/activity/${reg.activityId}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">
                            {reg.activity?.title || '活动'}
                          </h4>
                          <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{reg.activity?.startDate || '-'}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{reg.activity?.startTime || '-'}</span>
                            </span>
                          </div>
                          {reg.serviceHours !== undefined && reg.serviceHours > 0 && (
                            <p className="text-emerald-600 text-sm mt-1">
                              服务时长：{reg.serviceHours.toFixed(1)} 小时
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-medium',
                              statusColors[reg.status]
                            )}
                          >
                            {REGISTRATION_STATUS_LABELS[reg.status]}
                          </span>
                          <ChevronRight className="w-5 h-5 text-gray-300" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">暂无参与记录</p>
                  <button
                    onClick={() => navigate('/')}
                    className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                  >
                    去发现活动
                  </button>
                </div>
              )
            ) : activeTab === 'certificates' ? (
              certificates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certificates.map((cert) => {
                    const levelInfo = CERTIFICATE_LEVELS.find((l) => l.level === cert.level);
                    return (
                      <div
                        key={cert.id}
                        className="relative overflow-hidden rounded-xl border-2 p-5 hover:shadow-lg transition-all"
                        style={{ borderColor: levelInfo?.color || '#10B981' }}
                      >
                        <div
                          className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -mr-10 -mt-10"
                          style={{ backgroundColor: levelInfo?.color || '#10B981' }}
                        />
                        <div className="relative">
                          <div className="flex items-center space-x-3 mb-3">
                            <Award
                              className="w-8 h-8"
                              style={{ color: levelInfo?.color || '#10B981' }}
                            />
                            <div>
                              <h4 className="font-bold text-gray-800">
                                {levelInfo?.name || '志愿者证书'}
                              </h4>
                              <p className="text-xs text-gray-400">{cert.certificateNo}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            累计服务 <span className="font-bold text-gray-800">{cert.totalHours.toFixed(1)}</span> 小时
                          </p>
                          <p className="text-sm text-gray-600 mb-3">
                            参与活动 <span className="font-bold text-gray-800">{cert.activityCount}</span> 次
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadCertificate(cert.id);
                            }}
                            className="w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1"
                          >
                            <Download className="w-4 h-4" />
                            <span>下载证书</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">暂无证书</p>
                  <p className="text-sm text-gray-400">
                    累计服务满 20 小时即可申请铜级志愿者证书
                  </p>
                </div>
              )
            ) : feedbacks.length > 0 ? (
              <div className="space-y-3">
                {feedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="p-4 border border-gray-100 rounded-xl hover:border-emerald-200 transition-all cursor-pointer"
                    onClick={() => navigate(`/activity/${feedback.activityId}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">活动 #{feedback.activityId}</h4>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-4 h-4',
                              i < feedback.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-200'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{feedback.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(feedback.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">暂无反馈记录</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
