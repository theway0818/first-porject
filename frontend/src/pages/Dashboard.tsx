import { useEffect, useState } from 'react';
import api from '../api/client';
import Header from '../components/Layout/Header';

interface Stats {
  projects: number;
  activeTasks: number;
  completedTasks: number;
  unreadNotifications: number;
}

interface RecentTask {
  id: number;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  project_name?: string;
  assignee_name?: string;
}

const priorityColor: Record<string, string> = {
  high: 'text-red-600 bg-red-50',
  medium: 'text-yellow-600 bg-yellow-50',
  low: 'text-green-600 bg-green-50',
};

const statusLabel: Record<string, string> = {
  todo: '예정',
  in_progress: '진행중',
  done: '완료',
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ projects: 0, activeTasks: 0, completedTasks: 0, unreadNotifications: 0 });
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);

  useEffect(() => {
    async function load() {
      const [projRes, notifRes] = await Promise.all([
        api.get('/projects'),
        api.get('/notifications'),
      ]);
      const projects = projRes.data;
      const notifications = notifRes.data;

      const allTasks: RecentTask[] = [];
      for (const proj of projects.slice(0, 5)) {
        const taskRes = await api.get(`/projects/${proj.id}/tasks`);
        taskRes.data.forEach((t: RecentTask) => allTasks.push({ ...t, project_name: proj.name }));
      }

      setStats({
        projects: projects.length,
        activeTasks: allTasks.filter((t) => t.status !== 'done').length,
        completedTasks: allTasks.filter((t) => t.status === 'done').length,
        unreadNotifications: notifications.filter((n: { is_read: number }) => !n.is_read).length,
      });
      setRecentTasks(allTasks.sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? '')).slice(0, 10));
    }
    load();
  }, []);

  const statCards = [
    { label: '전체 프로젝트', value: stats.projects, icon: '📁', color: 'bg-blue-50 text-blue-700' },
    { label: '진행 중 업무', value: stats.activeTasks, icon: '⚡', color: 'bg-yellow-50 text-yellow-700' },
    { label: '완료 업무', value: stats.completedTasks, icon: '✅', color: 'bg-green-50 text-green-700' },
    { label: '읽지 않은 알림', value: stats.unreadNotifications, icon: '🔔', color: 'bg-red-50 text-red-700' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Header title="대시보드" />
      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((c) => (
            <div key={c.label} className={`rounded-xl p-5 ${c.color}`}>
              <p className="text-2xl mb-2">{c.icon}</p>
              <p className="text-3xl font-bold">{c.value}</p>
              <p className="text-sm mt-1 opacity-80">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">마감일 임박 업무</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTasks.length === 0 && (
              <p className="text-sm text-gray-400 p-5 text-center">업무가 없습니다</p>
            )}
            {recentTasks.map((t) => (
              <div key={t.id} className="px-5 py-3 flex items-center gap-4">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[t.priority]}`}>
                  {t.priority}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                  <p className="text-xs text-gray-400">{t.project_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">{statusLabel[t.status]}</p>
                  {t.due_date && <p className="text-xs text-gray-400">{t.due_date}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
