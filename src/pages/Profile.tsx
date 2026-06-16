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
  X,
  Eye,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { registrationApi, certificateApi, userApi, feedbackApi } from '../api';
import type { Registration, Certificate, Feedback, UserStats, CertificateLevel } from '@shared/types';
import { REGISTRATION_STATUS_LABELS, CERTIFICATE_LEVELS } from '@shared/types';
import { cn } from '../lib/utils';

type TabType = 'activities' | 'certificates' | 'feedback';
type SelectedLevel = 'all' | CertificateLevel;

const LEVEL_FILTERS: { key: SelectedLevel; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'bronze', label: '铜级' },
  { key: 'silver', label: '银级' },
  { key: 'gold', label: '金级' },
  { key: 'platinum', label: '白金' },
];

const getLevelColor = (level: CertificateLevel): string => {
  const info = CERTIFICATE_LEVELS.find((l) => l.level === level);
  return info?.color || '#10B981';
};

const getLevelName = (level: CertificateLevel): string => {
  const info = CERTIFICATE_LEVELS.find((l) => l.level === level);
  return info?.name || '志愿者证书';
};

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
  const [selectedLevel, setSelectedLevel] = useState<SelectedLevel>('all');
  const [previewCertificate, setPreviewCertificate] = useState<Certificate | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

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

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleApplyCertificate = async () => {
    if (!stats?.nextLevel) return;

    setApplying(true);
    try {
      const result = await certificateApi.apply();
      setCertificates([result.certificate, ...certificates]);
      const newStats = await userApi.getStats();
      setStats(newStats);
      setToastMessage({ type: 'success', text: '证书申请成功！' });
    } catch (err) {
      const message = err instanceof Error ? err.message : '申请失败';
      if (message.includes('无需重复申请') || message.includes('已获得')) {
        setToastMessage({ type: 'warning', text: '您已获得该等级证书，无需重复申请' });
      } else {
        setToastMessage({ type: 'error', text: message });
      }
    } finally {
      setApplying(false);
    }
  };

  const handleDownloadCertificate = (id: number) => {
    window.open(`/api/certificates/${id}/pdf`, '_blank');
  };

  const filteredCertificates = selectedLevel === 'all'
    ? certificates
    : certificates.filter((cert) => cert.level === selectedLevel);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className={cn(
            'px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 font-medium text-sm',
            toastMessage.type === 'success' && 'bg-emerald-50 border border-emerald-200 text-emerald-700',
            toastMessage.type === 'warning' && 'bg-emerald-50 border border-emerald-200 text-emerald-700',
            toastMessage.type === 'error' && 'bg-red-50 border border-red-200 text-red-700'
          )}>
            {toastMessage.type === 'success' && <Award className="w-4 h-4" />}
            {toastMessage.type === 'warning' && <AlertCircle className="w-4 h-4" />}
            {toastMessage.type === 'error' && <XCircle className="w-4 h-4" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
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
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 mb-6 border border-emerald-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${stats.nextLevel.level === 'bronze' ? '#CD7F32' : stats.nextLevel.level === 'silver' ? '#C0C0C0' : stats.nextLevel.level === 'gold' ? '#FFD700' : '#E5E4E2'}20` }}
                >
                  <Trophy
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
                  <p className="text-sm text-emerald-600 font-medium">可申请证书</p>
                  <p className="font-bold text-gray-800">{stats.nextLevel.name}</p>
                  <p className="text-xs text-gray-500">
                    已达到申请条件（当前 {stats.nextLevel.currentHours.toFixed(1)} 小时，需 {stats.nextLevel.requiredHours} 小时）
                  </p>
                </div>
              </div>
              <button
                onClick={handleApplyCertificate}
                disabled={applying}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-50 text-sm"
              >
                {applying ? '申请中...' : '立即申请'}
              </button>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: '100%',
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

        {!stats?.nextLevel && stats?.upcomingLevel && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-6 border border-amber-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${stats.upcomingLevel.level === 'bronze' ? '#CD7F32' : stats.upcomingLevel.level === 'silver' ? '#C0C0C0' : stats.upcomingLevel.level === 'gold' ? '#FFD700' : '#E5E4E2'}20` }}
                >
                  <Target
                    className="w-6 h-6"
                    style={{
                      color:
                        stats.upcomingLevel.level === 'bronze'
                          ? '#CD7F32'
                          : stats.upcomingLevel.level === 'silver'
                          ? '#C0C0C0'
                          : stats.upcomingLevel.level === 'gold'
                          ? '#FFD700'
                          : '#E5E4E2',
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500">下一等级</p>
                  <p className="font-bold text-gray-800">{stats.upcomingLevel.name}</p>
                  <p className="text-xs text-gray-400">
                    还需 {Math.max(stats.upcomingLevel.requiredHours - stats.upcomingLevel.currentHours, 0).toFixed(1)} 小时
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(stats.upcomingLevel.progress, 100)}%`,
                    backgroundColor:
                      stats.upcomingLevel.level === 'bronze'
                        ? '#CD7F32'
                        : stats.upcomingLevel.level === 'silver'
                        ? '#C0C0C0'
                        : stats.upcomingLevel.level === 'gold'
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
              <div>
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-wrap gap-2">
                      {LEVEL_FILTERS.map((filter) => (
                        <button
                          key={filter.key}
                          onClick={() => setSelectedLevel(filter.key)}
                          className={cn(
                            'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                            selectedLevel === filter.key
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      共 {filteredCertificates.length} 张
                    </span>
                  </div>
                </div>
                {filteredCertificates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCertificates.map((cert) => {
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
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewCertificate(cert);
                                }}
                                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1"
                              >
                                <Eye className="w-4 h-4" />
                                <span>预览</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadCertificate(cert.id);
                                }}
                                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1"
                              >
                                <Download className="w-4 h-4" />
                                <span>下载PDF</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 mb-4">
                      {selectedLevel === 'all' ? '暂无证书' : '暂无该等级的证书'}
                    </p>
                    <p className="text-sm text-gray-400">
                      累计服务满 20 小时即可申请铜级志愿者证书
                    </p>
                  </div>
                )}
              </div>
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

      {previewCertificate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">证书预览</h2>
              <button
                onClick={() => setPreviewCertificate(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div
                className="relative rounded-xl overflow-hidden border-4 shadow-inner"
                style={{ borderColor: getLevelColor(previewCertificate.level) }}
              >
                <div
                  className="h-4 w-full"
                  style={{
                    background: `linear-gradient(90deg, ${getLevelColor(previewCertificate.level)}, ${getLevelColor(previewCertificate.level)}88, ${getLevelColor(previewCertificate.level)})`,
                  }}
                />
                <div className="p-8 bg-gradient-to-b from-white via-gray-50/30 to-white">
                  <div className="text-center mb-6">
                    <Award
                      className="w-12 h-12 mx-auto mb-3"
                      style={{ color: getLevelColor(previewCertificate.level) }}
                    />
                    <h1 className="text-2xl font-bold text-gray-800 tracking-wider">
                      公益志愿服务证书
                    </h1>
                  </div>

                  <div className="space-y-4 text-center">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">证书编号</p>
                      <p className="font-mono text-sm text-gray-600">{previewCertificate.certificateNo}</p>
                    </div>

                    <div className="py-2">
                      <p className="text-xs text-gray-400 mb-1">志愿者姓名</p>
                      <p className="text-lg font-medium text-gray-800">{previewCertificate.userName}</p>
                    </div>

                    <div
                      className="py-4 px-6 rounded-xl mx-auto inline-block"
                      style={{
                        backgroundColor: `${getLevelColor(previewCertificate.level)}15`,
                      }}
                    >
                      <p
                        className="text-3xl font-bold tracking-wide"
                        style={{ color: getLevelColor(previewCertificate.level) }}
                      >
                        {getLevelName(previewCertificate.level)}
                      </p>
                    </div>

                    <div className="py-2">
                      <p className="text-sm text-gray-600">
                        累计服务 <span className="font-bold text-gray-800 text-lg">{previewCertificate.totalHours.toFixed(1)}</span> 小时，
                        参与活动 <span className="font-bold text-gray-800 text-lg">{previewCertificate.activityCount}</span> 次
                      </p>
                      <p className="text-sm text-gray-500 mt-1">特颁发此证书，以资鼓励</p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 mt-2">
                      <p className="text-xs text-gray-400 mb-1">颁发日期</p>
                      <p className="text-sm text-gray-600">
                        {new Date(previewCertificate.issuedAt).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="h-2 w-full"
                  style={{
                    background: `linear-gradient(90deg, ${getLevelColor(previewCertificate.level)}, ${getLevelColor(previewCertificate.level)}88, ${getLevelColor(previewCertificate.level)})`,
                  }}
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setPreviewCertificate(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
              >
                关闭
              </button>
              <button
                onClick={() => handleDownloadCertificate(previewCertificate.id)}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm hover:shadow-lg hover:shadow-emerald-200 transition-all font-medium flex items-center justify-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>下载证书</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
