import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
}

export default function Header({ title }: { title: string }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = () => api.get('/notifications').then((r) => setNotifications(r.data));
    load();
    const timer = setInterval(load, 30_000); // 30초 폴링
    return () => clearInterval(timer);
  }, []);

  const unread = notifications.filter((n) => !n.is_read).length;

  async function markAllRead() {
    await api.patch('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            🔔
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-medium text-sm">알림</span>
                <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">
                  모두 읽음
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-400 p-4 text-center">알림이 없습니다</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-gray-50 ${!n.is_read ? 'bg-indigo-50' : ''}`}
                    >
                      <p className="text-sm font-medium text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <span className="text-sm text-gray-600">{user?.name}</span>
      </div>
    </header>
  );
}
