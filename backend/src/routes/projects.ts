import { Router, Request, Response } from 'express';
import { sql } from '@vercel/postgres';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { id, role } = req.user!;
  const { rows } = role === 'admin'
    ? await sql`SELECT p.*, u.name as created_by_name FROM projects p JOIN users u ON p.created_by = u.id ORDER BY p.created_at DESC`
    : await sql`SELECT p.*, u.name as created_by_name FROM projects p JOIN project_members pm ON pm.project_id = p.id JOIN users u ON p.created_by = u.id WHERE pm.user_id = ${id} ORDER BY p.created_at DESC`;
  res.json(rows);
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const projectId = Number(req.params.id);
  const { rows: [project] } = await sql`SELECT p.*, u.name as created_by_name FROM projects p JOIN users u ON p.created_by = u.id WHERE p.id = ${projectId}`;
  if (!project) { res.status(404).json({ error: '프로젝트를 찾을 수 없습니다' }); return; }
  const { rows: members } = await sql`SELECT u.id, u.name, u.email, u.role, u.team FROM users u JOIN project_members pm ON pm.user_id = u.id WHERE pm.project_id = ${projectId}`;
  res.json({ ...project, members });
});

router.post('/', requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  const { name, description, start_date, end_date, member_ids } = req.body;
  if (!name) { res.status(400).json({ error: '프로젝트 이름은 필수입니다' }); return; }
  const { rows: [project] } = await sql`
    INSERT INTO projects (name, description, start_date, end_date, created_by)
    VALUES (${name}, ${description ?? ''}, ${start_date ?? null}, ${end_date ?? null}, ${req.user!.id})
    RETURNING *
  `;
  const memberSet = new Set<number>([req.user!.id, ...(member_ids ?? [])]);
  for (const uid of memberSet) {
    await sql`INSERT INTO project_members (project_id, user_id) VALUES (${project.id}, ${uid}) ON CONFLICT DO NOTHING`;
  }
  res.status(201).json(project);
});

router.put('/:id', requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  const projectId = Number(req.params.id);
  const { name, description, start_date, end_date, status } = req.body;
  await sql`UPDATE projects SET name = COALESCE(${name}, name), description = COALESCE(${description}, description), start_date = COALESCE(${start_date}, start_date), end_date = COALESCE(${end_date}, end_date), status = COALESCE(${status}, status) WHERE id = ${projectId}`;
  const { rows: [project] } = await sql`SELECT * FROM projects WHERE id = ${projectId}`;
  res.json(project);
});

router.post('/:id/members', requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  const projectId = Number(req.params.id);
  const { user_id, action } = req.body;
  if (action === 'add') {
    await sql`INSERT INTO project_members (project_id, user_id) VALUES (${projectId}, ${user_id}) ON CONFLICT DO NOTHING`;
  } else {
    await sql`DELETE FROM project_members WHERE project_id = ${projectId} AND user_id = ${user_id}`;
  }
  res.status(204).send();
});

export default router;
