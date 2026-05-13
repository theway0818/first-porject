import { useEffect, useState } from 'react';
import api from '../api/client';
import Header from '../components/Layout/Header';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  team: string;
  created_at: string;
}

const roleColor: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  member: 'bg-gray-100 text-gray-700',
};

const roleLabel: Record<string, string> = {
  admin: '관리자',
  manager: '매니저',
  member: '멤버',
};

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member', team: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/'); return; }
    api.get('/users').then((r) => setUsers(r.data));
  }, [user, navigate]);

  async function createUser() {
    if (!form.name || !form.email || !form.password) { setError('이름, 이메일, 비밀번호는 필수입니다'); return; }
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/users', form);
      setUsers((u) => [...u, data]);
      setForm({ name: '', email: '', password: '', role: 'member', team: '' });
      setShowForm(false);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error ?? '오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  async function changeRole(userId: number, role: string) {
    const { data } = await api.put(`/users/${userId}`, { role });
    setUsers((prev) => prev.map((u) => (u.id === userId ? data : u)));
  }

  async function deleteUser(userId: number) {
    if (!confirm('사용자를 삭제하시겠습니까?')) return;
    await api.delete(`/users/${userId}`);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header title="관리자 설정" />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">{users.length}명 등록</p>
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            + 사용자 추가
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5 space-y-3">
            <h3 className="font-semibold text-gray-800">새 사용자</h3>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="이름" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="이메일" type="email" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="임시 비밀번호" type="password" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input value={form.team} onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}
                placeholder="팀명" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="member">멤버</option>
                <option value="manager">매니저</option>
                <option value="admin">관리자</option>
              </select>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button onClick={createUser} disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60">
                {saving ? '저장 중...' : '저장'}
              </button>
              <button onClick={() => { setShowForm(false); setError(''); }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                취소
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {users.map((u) => (
            <div key={u.id} className="px-5 py-4 flex items-center gap-4">
              <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
                {u.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{u.name}</p>
                <p className="text-xs text-gray-400">{u.email} · {u.team}</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  disabled={u.id === user?.id}
                  className={`text-xs px-2 py-1 rounded-lg border border-gray-200 font-medium focus:outline-none ${roleColor[u.role]}`}
                >
                  <option value="admin">관리자</option>
                  <option value="manager">매니저</option>
                  <option value="member">멤버</option>
                </select>
                <span className={`hidden text-xs px-2 py-0.5 rounded-full ${roleColor[u.role]}`}>
                  {roleLabel[u.role]}
                </span>
                {u.id !== user?.id && (
                  <button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-600 text-sm">🗑</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
