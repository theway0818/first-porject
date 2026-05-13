import { useEffect, useState } from 'react';
import api from '../api/client';
import Header from '../components/Layout/Header';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
}

const typeIcon: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  deadline: '🔴',
  assignment: '👤',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    api.get('/notifications').then((r) => setNotifications(r.data));
  }, []);

  async function markRead(id: number) {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
  }

  async function markAllRead() {
    await api.patch('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  }

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex-1 flex flex-col">
      <Header title="알림" />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">읽지 않은 알림 {unread}개</p>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-sm text-indigo-600 hover:underline">
              모두 읽음
            </button>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {notifications.length === 0 && (
            <p className="text-sm text-gray-400 p-8 text-center">알림이 없습니다</p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`px-5 py-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-indigo-50' : ''}`}
            >
              <span className="text-xl shrink-0">{typeIcon[n.type] ?? 'ℹ️'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{n.created_at.slice(0, 16).replace('T', ' ')}</p>
              </div>
              {!n.is_read && (
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
