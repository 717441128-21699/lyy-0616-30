import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarPlus,
  Users,
  QrCode,
  FileText,
  LogOut,
  Heart,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';

interface OrgLayoutProps {
  children: ReactNode;
}

export function OrgLayout({ children }: OrgLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const navItems = [
    { path: '/org/dashboard', label: '控制台', icon: LayoutDashboard },
    { path: '/org/activities', label: '活动管理', icon: CalendarPlus },
    { path: '/org/registrations', label: '报名审核', icon: Users },
    { path: '/org/checkin', label: '签到管理', icon: QrCode },
    { path: '/org/summary', label: '活动总结', icon: FileText },
    { path: '/org/stats', label: '数据看板', icon: BarChart3 },
  ];

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-100">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-lg font-bold text-gray-800">志愿同行</span>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3">
          <p className="text-xs text-gray-400 uppercase font-medium px-3 mb-2">
            管理菜单
          </p>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 font-medium text-sm">
                {user?.name?.charAt(0) || 'O'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user?.orgName || user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">组织管理员</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
}
