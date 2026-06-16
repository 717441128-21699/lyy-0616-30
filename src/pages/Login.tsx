import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, User, Building2, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import type { UserRole } from '@shared/types';
import { cn } from '../lib/utils';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const [role, setRole] = useState<UserRole>('volunteer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: string })?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请填写用户名和密码');
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password, role);
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败，请检查用户名和密码';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">志愿同行</h1>
          <p className="text-emerald-100 text-lg text-center max-w-md">
            用行动传递温暖，让每一份善意都能找到归宿
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center space-x-3 text-white/90">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">发现优质志愿活动</p>
                <p className="text-sm text-white/70">丰富活动类型，自由选择参与</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-white/90">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">高效管理志愿团队</p>
                <p className="text-sm text-white/70">一站式活动招募与管理平台</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-7 h-7 text-white fill-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">志愿同行</h2>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">欢迎回来</h2>
          <p className="text-gray-500 mb-8">登录您的账号继续</p>

          <div className="flex bg-gray-100 rounded-full p-1 mb-6">
            <button
              type="button"
              onClick={() => setRole('volunteer')}
              className={cn(
                'flex-1 py-2.5 rounded-full text-sm font-medium transition-all flex items-center justify-center space-x-2',
                role === 'volunteer'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <User className="w-4 h-4" />
              <span>志愿者</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('organization')}
              className={cn(
                'flex-1 py-2.5 rounded-full text-sm font-medium transition-all flex items-center justify-center space-x-2',
                role === 'organization'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Building2 className="w-4 h-4" />
              <span>组织方</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-full hover:shadow-lg hover:shadow-emerald-200 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>登录中...</span>
                </>
              ) : (
                <>
                  <span>登录</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            还没有账号？{' '}
            <Link
              to="/register"
              state={{ role }}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              立即注册
            </Link>
          </div>

          <div className="mt-6 p-4 bg-emerald-50 rounded-xl text-xs">
            <p className="font-medium text-emerald-700 mb-2">💡 测试账号</p>
            <p className="text-emerald-600">志愿者：zhangsan / vol123456</p>
            <p className="text-emerald-600">组织方：greenearth / org123456</p>
          </div>
        </div>
      </div>
    </div>
  );
}
