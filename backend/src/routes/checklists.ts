import { Router, Request, Response } from 'express';
import db from '../db/database';
import { requireAuth, requireRole } from '../middleware/auth';
import { createNotification } from '../services/notificationService';
import { emitToProject } from '../socket';

const router = Router({ mergeParams: true });
router.use(requireAuth);

// 체크리스트 목록 (항목 포함)
router.get('/', (req: Request, res: Response): void => {
  const projectId = Number(req.params.projectId);
  const checklists = db.prepare('SELECT * FROM checklists WHERE project_id = ? ORDER BY created_at').all(projectId);
  const result = checklists.map((cl) => {
    const items = db.prepare(`
      SELECT ci.*, u.name as assignee_name
      FROM checklist_items ci LEFT JOIN users u ON ci.assignee_id = u.id
      WHERE ci.checklist_id = ? ORDER BY ci.created_at`).all((cl as { id: number }).id);
    return { ...cl as object, items };
  });
  res.json(result);
});

// 체크리스트 생성
router.post('/', requireRole('admin', 'manager'), (req: Request, res: Response): void => {
  const projectId = Number(req.params.projectId);
  const { title, task_id } = req.body;
  if (!title) { res.status(400).json({ error: '체크리스트 제목은 필수입니다' }); return; }
  const result = db
    .prepare('INSERT INTO checklists (project_id, task_id, title) VALUES (?, ?, ?)')
    .run(projectId, task_id ?? null, title);
  const checklist = db.prepare('SELECT * FROM checklists WHERE id = ?').get(result.lastInsertRowid);
  emitToProject(projectId, 'checklist_created', checklist);
  res.status(201).json(checklist);
});

// 체크리스트 삭제
router.delete('/:checklistId', requireRole('admin', 'manager'), (req: Request, res: Response): void => {
  const projectId = Number(req.params.projectId);
  db.prepare('DELETE FROM checklists WHERE id = ?').run(Number(req.params.checklistId));
  emitToProject(projectId, 'checklist_deleted', { id: Number(req.params.checklistId) });
  res.status(204).send();
});

// 체크리스트 항목 추가
router.post('/:checklistId/items', (req: Request, res: Response): void => {
  const projectId = Number(req.params.projectId);
  const checklistId = Number(req.params.checklistId);
  const { title, assignee_id, due_date } = req.body;
  if (!title) { res.status(400).json({ error: '항목 제목은 필수입니다' }); return; }

  const result = db
    .prepare('INSERT INTO checklist_items (checklist_id, title, assignee_id, due_date) VALUES (?, ?, ?, ?)')
    .run(checklistId, title, assignee_id ?? null, due_date ?? null);
  const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(result.lastInsertRowid);
  emitToProject(projectId, 'checklist_item_created', { checklistId, item });

  if (assignee_id) {
    createNotification({
      userId: assignee_id,
      title: '체크리스트 항목이 배정되었습니다',
      message: `"${title}" 항목이 배정되었습니다.`,
      type: 'assignment',
      relatedProjectId: projectId,
    });
  }
  res.status(201).json(item);
});

// 체크리스트 항목 완료 처리
router.patch('/:checklistId/items/:itemId', (req: Request, res: Response): void => {
  const projectId = Number(req.params.projectId);
  const itemId = Number(req.params.itemId);
  const { is_completed } = req.body;

  const completedAt = is_completed ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
  db.prepare('UPDATE checklist_items SET is_completed = ?, completed_at = ? WHERE id = ?')
    .run(is_completed ? 1 : 0, completedAt, itemId);

  const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(itemId);
  emitToProject(projectId, 'checklist_item_updated', { checklistId: Number(req.params.checklistId), item });
  res.json(item);
});

// 체크리스트 항목 삭제
router.delete('/:checklistId/items/:itemId', requireRole('admin', 'manager'), (req: Request, res: Response): void => {
  const projectId = Number(req.params.projectId);
  db.prepare('DELETE FROM checklist_items WHERE id = ?').run(Number(req.params.itemId));
  emitToProject(projectId, 'checklist_item_deleted', { checklistId: Number(req.params.checklistId), id: Number(req.params.itemId) });
  res.status(204).send();
});

export default router;
