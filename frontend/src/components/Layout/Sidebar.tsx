import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/', label: '대시보드', icon: '📊' },
  { to: '/projects', label: '프로젝트', icon: '📁' },
  { to: '/notifications', label: '알림', icon: '🔔' },
  { to: '/emails', label: '메일 자동화', icon: '✉️' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 min-h-screen bg-indigo-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-indigo-700">
        <h1 className="text-lg font-bold">협업 관리</h1>
        <p className="text-xs text-indigo-300 mt-1">{user?.team}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'text-indigo-200 hover:bg-indigo-800'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'text-indigo-200 hover:bg-indigo-800'
              }`
            }
          >
            <span>⚙️</span>
            관리자
          </NavLink>
        )}
      </nav>

      <div className="px-6 py-4 border-t border-indigo-700">
        <p className="text-sm font-medium">{user?.name}</p>
        <p className="text-xs text-indigo-300 capitalize">{user?.role}</p>
        <button
          onClick={logout}
          className="mt-3 text-xs text-indigo-400 hover:text-white transition-colors"
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}
