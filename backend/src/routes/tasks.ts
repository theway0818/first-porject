import { Router, Request, Response } from 'express';
import db from '../db/database';
import { requireAuth, requireRole } from '../middleware/auth';
import { createNotification } from '../services/notificationService';
import { emitToProject } from '../socket';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', (req: Request, res: Response): void => {
  const projectId = Number(req.params.projectId);
  const tasks = db.prepare(`
    SELECT t.*, u.name as assignee_name
    FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC`).all(projectId);
  res.json(tasks);
});

router.post('/', requireRole('admin', 'manager'), (req: Request, res: Response): void => {
  const projectId = Number(req.params.projectId);
  const { title, description, assignee_id, due_date, priority } = req.body;
  if (!title) { res.status(400).json({ error: '업무 제목은 필수입니다' }); return; }

  const result = db.prepare(`
    INSERT INTO tasks (project_id, title, description, assignee_id, due_date, priority)
    VALUES (?, ?, ?, ?, ?, ?)`).run(projectId, title, description ?? '', assignee_id ?? null, due_date ?? null, priority ?? 'medium');

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  emitToProject(projectId, 'task_created', task);

  if (assignee_id) {
    createNotification({
      userId: assignee_id,
      title: '새 업무가 배정되었습니다',
      message: `업무 "${title}"이 배정되었습니다.`,
      type: 'assignment',
      relatedProjectId: projectId,
    });
  }
  res.status(201).json(task);
});

router.put('/:taskId', (req: Request, res: Response): void => {
  const projectId = Number(req.params.projectId);
  const taskId = Number(req.params.taskId);
  const { title, description, assignee_id, due_date, status, priority } = req.body;

  const prevTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as { assignee_id: number | null } | undefined;

  db.prepare(`UPDATE tasks SET
    title = COALESCE(?, title),
    description = COALESCE(?, description),
    assignee_id = COALESCE(?, assignee_id),
    due_date = COALESCE(?, due_date),
    status = COALESCE(?, status),
    priority = COALESCE(?, priority)
    WHERE id = ?`).run(title ?? null, description ?? null, assignee_id ?? null, due_date ?? null, status ?? null, priority ?? null, taskId);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  emitToProject(projectId, 'task_updated', task);

  if (assignee_id && assignee_id !== prevTask?.assignee_id) {
    createNotification({
      userId: assignee_id,
      title: '업무가 배정되었습니다',
      message: `업무 "${(task as { title: string }).title}"이 배정되었습니다.`,
      type: 'assignment',
      relatedProjectId: projectId,
    });
  }
  res.json(task);
});

router.delete('/:taskId', requireRole('admin', 'manager'), (req: Request, res: Response): void => {
  const projectId = Number(req.params.projectId);
  const taskId = Number(req.params.taskId);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  emitToProject(projectId, 'task_deleted', { id: taskId });
  res.status(204).send();
});

export default router;
