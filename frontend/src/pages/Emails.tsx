import { useEffect, useState } from 'react';
import api from '../api/client';
import Header from '../components/Layout/Header';
import { useAuth } from '../contexts/AuthContext';
import EmailComposer from '../components/EmailComposer/EmailComposer';

interface Template {
  id: number;
  name: string;
  subject_template: string;
  body_template: string;
  created_by_name: string;
  created_at: string;
}

export default function Emails() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', subject_template: '', body_template: '' });
  const [saving, setSaving] = useState(false);
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    api.get('/emails/templates').then((r) => setTemplates(r.data));
  }, []);

  async function createTemplate() {
    if (!form.name) return;
    setSaving(true);
    const { data } = await api.post('/emails/templates', form);
    setTemplates((t) => [data, ...t]);
    setForm({ name: '', subject_template: '', body_template: '' });
    setShowForm(false);
    setSaving(false);
  }

  async function deleteTemplate(id: number) {
    if (!confirm('템플릿을 삭제하시겠습니까?')) return;
    await api.delete(`/emails/templates/${id}`);
    setTemplates((t) => t.filter((tmpl) => tmpl.id !== id));
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header title="메일 자동화" />
      <main className="flex-1 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">변수({`{{변수명}}`})를 사용해 메일 템플릿을 만들고 협력사에 빠르게 발송하세요</p>
          <div className="flex gap-2">
            {canManage && (
              <button onClick={() => setShowForm(true)}
                className="px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg text-sm hover:bg-indigo-50">
                + 템플릿 추가
              </button>
            )}
            <button onClick={() => setShowComposer(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
              ✉️ 메일 작성
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold">새 템플릿</h3>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="템플릿 이름" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <input value={form.subject_template} onChange={(e) => setForm((f) => ({ ...f, subject_template: e.target.value }))}
              placeholder="제목 템플릿 (예: [요청] {{프로젝트명}} 자료 요청)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <textarea value={form.body_template} onChange={(e) => setForm((f) => ({ ...f, body_template: e.target.value }))}
              placeholder="본문 템플릿 ({{변수명}} 형식으로 변수 삽입)" rows={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono" />
            <div className="flex gap-2">
              <button onClick={createTemplate} disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60">
                {saving ? '저장 중...' : '저장'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">취소</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{t.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{t.subject_template}</p>
                  <p className="text-xs text-gray-400 mt-2">등록자: {t.created_by_name}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {canManage && (
                    <button onClick={() => deleteTemplate(t.id)} className="text-red-400 hover:text-red-600 text-sm">🗑</button>
                  )}
                </div>
              </div>
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans line-clamp-4">{t.body_template}</pre>
              </div>
            </div>
          ))}
        </div>
      </main>
      {showComposer && <EmailComposer onClose={() => setShowComposer(false)} />}
    </div>
  );
}
