import { useState, useEffect } from 'react';
import api from '../../api/client';

interface Template {
  id: number;
  name: string;
  subject_template: string;
  body_template: string;
}

interface Props {
  onClose: () => void;
}

function extractVars(template: string): string[] {
  const matches = template.match(/\{\{(.+?)\}\}/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(2, -2).trim()))];
}

export default function EmailComposer({ onClose }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [to, setTo] = useState('');
  const [vars, setVars] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/emails/templates').then((r) => setTemplates(r.data));
  }, []);

  const selected = templates.find((t) => t.id === selectedId);
  const varNames = selected
    ? extractVars(selected.subject_template + ' ' + selected.body_template)
    : [];

  async function handlePreview() {
    if (!selectedId) return;
    const { data } = await api.post('/emails/preview', { template_id: selectedId, variables: vars });
    setPreview(data);
  }

  async function handleSend() {
    if (!to || !selectedId) { setError('수신자와 템플릿을 선택해주세요'); return; }
    setSending(true);
    try {
      await api.post('/emails/send', { to, template_id: selectedId, variables: vars });
      setSent(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error ?? '발송 실패');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold">협력사 메일 작성</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {sent ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-3 text-green-600">
            <span className="text-4xl">✅</span>
            <p className="font-medium">메일이 발송되었습니다</p>
            <button onClick={onClose} className="mt-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm">
              닫기
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">수신자 이메일</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="partner@company.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">템플릿 선택</label>
              <select
                value={selectedId}
                onChange={(e) => { setSelectedId(Number(e.target.value)); setPreview(null); setVars({}); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">템플릿을 선택하세요</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {varNames.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">변수 입력</p>
                {varNames.map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <span className="text-xs text-indigo-600 w-28 shrink-0">{`{{${v}}}`}</span>
                    <input
                      value={vars[v] ?? ''}
                      onChange={(e) => setVars((prev) => ({ ...prev, [v]: e.target.value }))}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder={v}
                    />
                  </div>
                ))}
              </div>
            )}

            {preview && (
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 border border-gray-200">
                <p className="font-medium text-gray-600">미리보기</p>
                <p className="font-semibold">{preview.subject}</p>
                <pre className="whitespace-pre-wrap text-gray-700 font-sans">{preview.body}</pre>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handlePreview}
                disabled={!selectedId}
                className="px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg text-sm hover:bg-indigo-50 disabled:opacity-40"
              >
                미리보기
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                {sending ? '발송 중...' : '메일 발송'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
