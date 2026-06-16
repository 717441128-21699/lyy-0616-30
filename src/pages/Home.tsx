import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { ActivityCard } from '../components/ActivityCard';
import { activityApi } from '../api';
import type { Activity, ActivityType } from '@shared/types';
import { ACTIVITY_TYPE_LABELS, CITIES } from '@shared/types';
import { cn } from '../lib/utils';

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState<ActivityType | ''>('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchActivities = async (pageNum = 1, append = false) => {
    const isFirstPage = pageNum === 1;
    if (isFirstPage) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await activityApi.getList({
        keyword: keyword || undefined,
        city: selectedCity || undefined,
        type: selectedType || undefined,
        page: pageNum,
        pageSize,
      });

      if (append) {
        setActivities((prev) => [...prev, ...result.list]);
      } else {
        setActivities(result.list);
      }
      setTotal(result.total);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchActivities(1, false);
  }, [keyword, selectedCity, selectedType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchActivities(1, false);
  };

  const handleLoadMore = () => {
    fetchActivities(page + 1, true);
  };

  const resetFilters = () => {
    setKeyword('');
    setSelectedCity('');
    setSelectedType('');
  };

  const hasMore = activities.length < total;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white">
      <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>用行动传递温暖，让志愿成为习惯</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              发现身边的公益活动
              <br />
              <span className="text-emerald-100">开启你的志愿服务之旅</span>
            </h1>
            <p className="text-emerald-50 text-lg mb-8">
              汇聚全国优质公益活动，让每一份善意都能找到归宿
            </p>

            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <div className="flex items-center bg-white rounded-full shadow-2xl shadow-emerald-500/20 p-2">
                <Search className="w-5 h-5 text-gray-400 ml-4" />
                <input
                  type="text"
                  placeholder="搜索活动名称、地点..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="flex-1 px-3 py-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-full hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300"
                >
                  搜索
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-100 p-6 mb-8">
          <div className="flex items-center space-x-2 text-gray-700 mb-4">
            <Filter className="w-5 h-5 text-emerald-500" />
            <span className="font-medium">筛选条件</span>
            {(selectedCity || selectedType) && (
              <button
                onClick={resetFilters}
                className="ml-auto text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                重置筛选
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-700 transition-colors border border-gray-100"
              >
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>{selectedCity || '选择城市'}</span>
                <ChevronDown className={cn('w-4 h-4 transition-transform', showCityDropdown && 'rotate-180')} />
              </button>
              {showCityDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-10 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedCity(''); setShowCityDropdown(false); }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-emerald-50 transition-colors',
                      !selectedCity && 'text-emerald-600 bg-emerald-50/50'
                    )}
                  >
                    全部城市
                  </button>
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => { setSelectedCity(city); setShowCityDropdown(false); }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-emerald-50 transition-colors',
                        selectedCity === city && 'text-emerald-600 bg-emerald-50/50'
                      )}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedType('')}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  !selectedType
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                全部类型
              </button>
              {Object.entries(ACTIVITY_TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedType(key as ActivityType)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    selectedType === key
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              推荐活动
              <span className="text-sm font-normal text-gray-500 ml-2">共 {total} 个活动</span>
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-10 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-8 py-3 bg-white border-2 border-emerald-500 text-emerald-600 font-medium rounded-full hover:bg-emerald-50 hover:shadow-md hover:shadow-emerald-100 transition-all duration-300 disabled:opacity-60 inline-flex items-center space-x-2"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>加载中...</span>
                      </>
                    ) : (
                      <span>加载更多</span>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 mb-4">没有找到符合条件的活动</p>
              <button
                onClick={resetFilters}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                重置筛选条件
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
