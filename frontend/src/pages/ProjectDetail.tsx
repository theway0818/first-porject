import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import Header from '../components/Layout/Header';
import FilePreview from '../components/FilePreview/FilePreview';
import EmailComposer from '../components/EmailComposer/EmailComposer';
import { useAuth } from '../contexts/AuthContext';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee_id: number | null;
  assignee_name: string | null;
  due_date: string | null;
}

interface ChecklistItem {
  id: number;
  title: string;
  is_completed: number;
  assignee_id: number | null;
  assignee_name: string | null;
  due_date: string | null;
}

interface Checklist {
  id: number;
  title: string;
  items: ChecklistItem[];
}

interface FileInfo {
  id: number;
  original_name: string;
  mime_type: string;
  filename: string;
  uploader_name: string;
  created_at: string;
}

interface Member {
  id: number;
  name: string;
  role: string;
  team: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  members: Member[];
}

const statusOptions = [
  { value: 'todo', label: '예정' },
  { value: 'in_progress', label: '진행중' },
  { value: 'done', label: '완료' },
];

const priorityColor: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const projectId = Number(id);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [tab, setTab] = useState<'tasks' | 'checklists' | 'files'>('tasks');

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignee_id: '', due_date: '', priority: 'medium' });

  // Checklist form
  const [showClForm, setShowClForm] = useState(false);
  const [clTitle, setClTitle] = useState('');
  const [newItems, setNewItems] = useState<Record<number, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ type: 'task' | 'checklist_item'; id: number } | null>(null);

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    async function load() {
      const [projRes, taskRes, clRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
        api.get(`/projects/${projectId}/checklists`),
      ]);
      setProject(projRes.data);
      setTasks(taskRes.data);
      setChecklists(clRes.data);
    }
    load();
  }, [projectId]);

  async function loadFiles(type: string, id: number) {
    const res = await api.get(`/files/related/${type}/${id}`);
    setFiles(res.data);
  }

  async function createTask() {
    if (!taskForm.title) return;
    const { data } = await api.post(`/projects/${projectId}/tasks`, {
      ...taskForm,
      assignee_id: taskForm.assignee_id ? Number(taskForm.assignee_id) : null,
    });
    setTasks((t) => [data, ...t]);
    setTaskForm({ title: '', description: '', assignee_id: '', due_date: '', priority: 'medium' });
    setShowTaskForm(false);
  }

  async function updateTaskStatus(taskId: number, status: string) {
    const { data } = await api.put(`/projects/${projectId}/tasks/${taskId}`, { status });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? data : t)));
  }

  async function deleteTask(taskId: number) {
    if (!confirm('업무를 삭제하시겠습니까?')) return;
    await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  async function createChecklist() {
    if (!clTitle) return;
    const { data } = await api.post(`/projects/${projectId}/checklists`, { title: clTitle });
    setChecklists((prev) => [...prev, { ...data, items: [] }]);
    setClTitle('');
    setShowClForm(false);
  }

  async function addChecklistItem(checklistId: number) {
    const title = newItems[checklistId];
    if (!title) return;
    const { data } = await api.post(`/projects/${projectId}/checklists/${checklistId}/items`, { title });
    setChecklists((prev) =>
      prev.map((cl) => cl.id === checklistId ? { ...cl, items: [...cl.items, data] } : cl)
    );
    setNewItems((prev) => ({ ...prev, [checklistId]: '' }));
  }

  async function toggleItem(checklistId: number, itemId: number, current: number) {
    const { data } = await api.patch(`/projects/${projectId}/checklists/${checklistId}/items/${itemId}`, {
      is_completed: current ? 0 : 1,
    });
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId
          ? { ...cl, items: cl.items.map((item) => (item.id === itemId ? data : item)) }
          : cl
      )
    );
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0] || !uploadTarget) return;
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('related_type', uploadTarget.type);
    formData.append('related_id', String(uploadTarget.id));
    formData.append('project_id', String(projectId));
    await api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    loadFiles(uploadTarget.type, uploadTarget.id);
    e.target.value = '';
  }

  if (!project) return <div className="flex-1 flex items-center justify-center text-gray-400">로딩 중...</div>;

  return (
    <div className="flex-1 flex flex-col">
      <Header title={project.name} />
      <main className="flex-1 p-6 space-y-5">
        {/* 프로젝트 정보 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              {project.description && <p className="text-sm text-gray-500 mb-2">{project.description}</p>}
              <div className="flex items-center gap-4 text-xs text-gray-400">
                {project.start_date && <span>시작: {project.start_date}</span>}
                {project.end_date && <span>마감: {project.end_date}</span>}
                <span>멤버 {project.members.length}명</span>
              </div>
            </div>
            <button
              onClick={() => setShowEmail(true)}
              className="px-3 py-1.5 border border-indigo-300 text-indigo-600 rounded-lg text-sm hover:bg-indigo-50"
            >
              ✉️ 협력사 메일
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {(['tasks', 'checklists', 'files'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'tasks' ? '업무' : t === 'checklists' ? '체크리스트' : '파일'}
            </button>
          ))}
        </div>

        {/* 업무 탭 */}
        {tab === 'tasks' && (
          <div className="space-y-3">
            {canManage && (
              <div className="flex justify-end">
                <button onClick={() => setShowTaskForm(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                  + 업무 추가
                </button>
              </div>
            )}
            {showTaskForm && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <input value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="업무 제목" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <textarea value={taskForm.description} onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="설명" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <div className="flex gap-3 flex-wrap">
                  <select value={taskForm.assignee_id} onChange={(e) => setTaskForm((f) => ({ ...f, assignee_id: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">담당자 선택</option>
                    {project.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="high">높음</option>
                    <option value="medium">보통</option>
                    <option value="low">낮음</option>
                  </select>
                  <input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm((f) => ({ ...f, due_date: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={createTask} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">저장</button>
                  <button onClick={() => setShowTaskForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">취소</button>
                </div>
              </div>
            )}
            {tasks.length === 0 && <p className="text-sm text-gray-400 text-center py-8">업무가 없습니다</p>}
            {tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[task.priority]}`}>{task.priority}</span>
                      {task.assignee_name && <span className="text-xs text-gray-500">👤 {task.assignee_name}</span>}
                      {task.due_date && <span className="text-xs text-gray-400">📅 {task.due_date}</span>}
                    </div>
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <button
                      onClick={() => { setUploadTarget({ type: 'task', id: task.id }); fileInputRef.current?.click(); }}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      📎
                    </button>
                    {canManage && (
                      <button onClick={() => deleteTask(task.id)} className="text-xs text-red-400 hover:text-red-600">🗑</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 체크리스트 탭 */}
        {tab === 'checklists' && (
          <div className="space-y-4">
            {canManage && (
              <div className="flex justify-end">
                <button onClick={() => setShowClForm(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                  + 체크리스트 추가
                </button>
              </div>
            )}
            {showClForm && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-2">
                <input value={clTitle} onChange={(e) => setClTitle(e.target.value)}
                  placeholder="체크리스트 제목" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <button onClick={createChecklist} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">저장</button>
                <button onClick={() => setShowClForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">취소</button>
              </div>
            )}
            {checklists.map((cl) => {
              const done = cl.items.filter((i) => i.is_completed).length;
              const pct = cl.items.length ? Math.round((done / cl.items.length) * 100) : 0;
              return (
                <div key={cl.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{cl.title}</h4>
                    <span className="text-sm text-gray-500">{done}/{cl.items.length} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full mb-4">
                    <div className="h-2 bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="space-y-2">
                    {cl.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 group">
                        <input
                          type="checkbox"
                          checked={Boolean(item.is_completed)}
                          onChange={() => toggleItem(cl.id, item.id, item.is_completed)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
                        />
                        <span className={`flex-1 text-sm ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {item.title}
                        </span>
                        {item.assignee_name && <span className="text-xs text-gray-400">{item.assignee_name}</span>}
                        {item.due_date && <span className="text-xs text-gray-400">{item.due_date}</span>}
                        <button
                          onClick={() => { setUploadTarget({ type: 'checklist_item', id: item.id }); loadFiles('checklist_item', item.id); fileInputRef.current?.click(); }}
                          className="text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          📎
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <input
                      value={newItems[cl.id] ?? ''}
                      onChange={(e) => setNewItems((prev) => ({ ...prev, [cl.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && addChecklistItem(cl.id)}
                      placeholder="항목 추가..."
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <button onClick={() => addChecklistItem(cl.id)} className="px-3 py-1.5 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50">
                      추가
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 파일 탭 */}
        {tab === 'files' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">프로젝트 파일</h3>
              <p className="text-sm text-gray-400">업무 또는 체크리스트 항목에서 📎 버튼을 눌러 업로드하세요</p>
            </div>
            {files.length === 0 && <p className="text-sm text-gray-400 text-center py-8">파일이 없습니다</p>}
            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <span className="text-xl">
                    {f.mime_type === 'application/pdf' ? '📄' :
                      f.mime_type.startsWith('image/') ? '🖼' :
                      f.mime_type.includes('excel') || f.mime_type === 'text/csv' ? '📊' :
                      f.mime_type.includes('word') ? '📝' : '📎'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{f.original_name}</p>
                    <p className="text-xs text-gray-400">{f.uploader_name} · {f.created_at.slice(0, 10)}</p>
                  </div>
                  <button
                    onClick={() => setPreviewFile(f)}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    미리보기
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <input ref={fileInputRef} type="file" className="hidden" onChange={uploadFile} />
      {previewFile && <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />}
      {showEmail && <EmailComposer onClose={() => setShowEmail(false)} />}
    </div>
  );
}
