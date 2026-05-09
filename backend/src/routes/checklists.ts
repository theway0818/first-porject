import { Router, Request, Response } from 'express';
import { sql } from '../db/database';
import { requireAuth, requireRole } from '../middleware/auth';
import { createNotification } from '../services/notificationService';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const projectId = Number(req.params.projectId);
  const { rows: checklists } = await sql`SELECT * FROM checklists WHERE project_id = ${projectId} ORDER BY created_at`;
  const result = await Promise.all(
    checklists.map(async (cl) => {
      const { rows: items } = await sql`
        SELECT ci.*, u.name as assignee_name FROM checklist_items ci
        LEFT JOIN users u ON ci.assignee_id = u.id
        WHERE ci.checklist_id = ${cl.id as number} ORDER BY ci.created_at
      `;
      return { ...cl, items };
    })
  );
  res.json(result);
});

router.post('/', requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  const projectId = Number(req.params.projectId);
  const { title, task_id } = req.body;
  if (!title) { res.status(400).json({ error: '체크리스트 제목은 필수입니다' }); return; }
  const { rows: [checklist] } = await sql`
    INSERT INTO checklists (project_id, task_id, title) VALUES (${projectId}, ${task_id ?? null}, ${title}) RETURNING *
  `;
  res.status(201).json(checklist);
});

router.delete('/:checklistId', requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  await sql`DELETE FROM checklists WHERE id = ${Number(req.params.checklistId)}`;
  res.status(204).send();
});

router.post('/:checklistId/items', async (req: Request, res: Response): Promise<void> => {
  const projectId = Number(req.params.projectId);
  const checklistId = Number(req.params.checklistId);
  const { title, assignee_id, due_date } = req.body;
  if (!title) { res.status(400).json({ error: '항목 제목은 필수입니다' }); return; }
  const { rows: [item] } = await sql`
    INSERT INTO checklist_items (checklist_id, title, assignee_id, due_date)
    VALUES (${checklistId}, ${title}, ${assignee_id ?? null}, ${due_date ?? null}) RETURNING *
  `;
  if (assignee_id) {
    await createNotification({ userId: assignee_id, title: '체크리스트 항목이 배정되었습니다', message: `"${title}" 항목이 배정되었습니다.`, type: 'assignment', relatedProjectId: projectId });
  }
  res.status(201).json(item);
});

router.patch('/:checklistId/items/:itemId', async (req: Request, res: Response): Promise<void> => {
  const itemId = Number(req.params.itemId);
  const { is_completed } = req.body;
  const completedAt = is_completed ? new Date().toISOString() : null;
  await sql`UPDATE checklist_items SET is_completed = ${is_completed ? 1 : 0}, completed_at = ${completedAt} WHERE id = ${itemId}`;
  const { rows: [item] } = await sql`SELECT * FROM checklist_items WHERE id = ${itemId}`;
  res.json(item);
});

router.delete('/:checklistId/items/:itemId', requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  await sql`DELETE FROM checklist_items WHERE id = ${Number(req.params.itemId)}`;
  res.status(204).send();
});

export default router;
