import { Router, Request, Response } from 'express';
import db from '../db/database';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// 내가 참여한 프로젝트 목록 (admin은 전체)
router.get('/', (req: Request, res: Response): void => {
  const { id, role } = req.user!;
  const projects =
    role === 'admin'
      ? db.prepare(`
          SELECT p.*, u.name as created_by_name
          FROM projects p JOIN users u ON p.created_by = u.id
          ORDER BY p.created_at DESC`).all()
      : db.prepare(`
          SELECT p.*, u.name as created_by_name
          FROM projects p
          JOIN project_members pm ON pm.project_id = p.id
          JOIN users u ON p.created_by = u.id
          WHERE pm.user_id = ?
          ORDER BY p.created_at DESC`).all(id);
  res.json(projects);
});

// 프로젝트 상세
router.get('/:id', (req: Request, res: Response): void => {
  const projectId = Number(req.params.id);
  const project = db.prepare(`
    SELECT p.*, u.name as created_by_name
    FROM projects p JOIN users u ON p.created_by = u.id
    WHERE p.id = ?`).get(projectId);
  if (!project) { res.status(404).json({ error: '프로젝트를 찾을 수 없습니다' }); return; }

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.team
    FROM users u JOIN project_members pm ON pm.user_id = u.id
    WHERE pm.project_id = ?`).all(projectId);

  res.json({ ...project as object, members });
});

// 프로젝트 생성 (admin, manager)
router.post('/', requireRole('admin', 'manager'), (req: Request, res: Response): void => {
  const { name, description, start_date, end_date, member_ids } = req.body;
  if (!name) { res.status(400).json({ error: '프로젝트 이름은 필수입니다' }); return; }

  const result = db
    .prepare('INSERT INTO projects (name, description, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?)')
    .run(name, description ?? '', start_date ?? null, end_date ?? null, req.user!.id);
  const projectId = Number(result.lastInsertRowid);

  // 생성자 자동 추가
  const memberSet: Set<number> = new Set([req.user!.id, ...(member_ids ?? [])]);
  const insertMember = db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)');
  for (const uid of memberSet) insertMember.run(projectId, uid);

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  res.status(201).json(project);
});

// 프로젝트 수정
router.put('/:id', requireRole('admin', 'manager'), (req: Request, res: Response): void => {
  const projectId = Number(req.params.id);
  const { name, description, start_date, end_date, status } = req.body;
  db.prepare(`UPDATE projects SET
    name = COALESCE(?, name),
    description = COALESCE(?, description),
    start_date = COALESCE(?, start_date),
    end_date = COALESCE(?, end_date),
    status = COALESCE(?, status)
    WHERE id = ?`).run(name ?? null, description ?? null, start_date ?? null, end_date ?? null, status ?? null, projectId);
  res.json(db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId));
});

// 멤버 추가/제거
router.post('/:id/members', requireRole('admin', 'manager'), (req: Request, res: Response): void => {
  const projectId = Number(req.params.id);
  const { user_id, action } = req.body;
  if (action === 'add') {
    db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)').run(projectId, user_id);
  } else {
    db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(projectId, user_id);
  }
  res.status(204).send();
});

export default router;
