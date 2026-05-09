import { Router, Request, Response } from 'express';
import { sql } from '../db/database';
import { requireAuth, requireRole } from '../middleware/auth';
import { createNotification } from '../services/notificationService';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const projectId = Number(req.params.projectId);
  const { rows } = await sql`
    SELECT t.*, u.name as assignee_name FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.project_id = ${projectId} ORDER BY t.created_at DESC
  `;
  res.json(rows);
});

router.post('/', requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  const projectId = Number(req.params.projectId);
  const { title, description, assignee_id, due_date, priority } = req.body;
  if (!title) { res.status(400).json({ error: '업무 제목은 필수입니다' }); return; }
  const { rows: [task] } = await sql`
    INSERT INTO tasks (project_id, title, description, assignee_id, due_date, priority)
    VALUES (${projectId}, ${title}, ${description ?? ''}, ${assignee_id ?? null}, ${due_date ?? null}, ${priority ?? 'medium'})
    RETURNING *
  `;
  if (assignee_id) {
    await createNotification({ userId: assignee_id, title: '새 업무가 배정되었습니다', message: `업무 "${title}"이 배정되었습니다.`, type: 'assignment', relatedProjectId: projectId });
  }
  res.status(201).json(task);
});

router.put('/:taskId', async (req: Request, res: Response): Promise<void> => {
  const projectId = Number(req.params.projectId);
  const taskId = Number(req.params.taskId);
  const { title, description, assignee_id, due_date, status, priority } = req.body;
  const { rows: [prev] } = await sql`SELECT assignee_id FROM tasks WHERE id = ${taskId}`;
  await sql`UPDATE tasks SET title = COALESCE(${title}, title), description = COALESCE(${description}, description), assignee_id = COALESCE(${assignee_id ?? null}, assignee_id), due_date = COALESCE(${due_date ?? null}, due_date), status = COALESCE(${status}, status), priority = COALESCE(${priority}, priority) WHERE id = ${taskId}`;
  const { rows: [task] } = await sql`SELECT * FROM tasks WHERE id = ${taskId}`;
  if (assignee_id && assignee_id !== prev?.assignee_id) {
    await createNotification({ userId: assignee_id, title: '업무가 배정되었습니다', message: `업무 "${task.title}"이 배정되었습니다.`, type: 'assignment', relatedProjectId: projectId });
  }
  res.json(task);
});

router.delete('/:taskId', requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  await sql`DELETE FROM tasks WHERE id = ${Number(req.params.taskId)}`;
  res.status(204).send();
});

export default router;
