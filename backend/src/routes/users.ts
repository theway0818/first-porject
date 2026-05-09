import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { sql } from '@vercel/postgres';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', requireRole('admin', 'manager'), async (_req: Request, res: Response): Promise<void> => {
  const { rows } = await sql`SELECT id, name, email, role, team, created_at FROM users ORDER BY name`;
  res.json(rows);
});

router.post('/', requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, team } = req.body;
  if (!name || !email || !password) { res.status(400).json({ error: '이름, 이메일, 비밀번호는 필수입니다' }); return; }
  const { rows: exists } = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (exists.length > 0) { res.status(409).json({ error: '이미 사용 중인 이메일입니다' }); return; }
  const hash = bcrypt.hashSync(password, 10);
  const { rows: [user] } = await sql`
    INSERT INTO users (name, email, password_hash, role, team)
    VALUES (${name}, ${email}, ${hash}, ${role ?? 'member'}, ${team ?? ''})
    RETURNING id, name, email, role, team, created_at
  `;
  res.status(201).json(user);
});

router.put('/:id', requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  const { name, role, team } = req.body;
  const id = Number(req.params.id);
  await sql`UPDATE users SET name = COALESCE(${name}, name), role = COALESCE(${role}, role), team = COALESCE(${team}, team) WHERE id = ${id}`;
  const { rows: [user] } = await sql`SELECT id, name, email, role, team, created_at FROM users WHERE id = ${id}`;
  res.json(user);
});

router.delete('/:id', requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (id === req.user!.id) { res.status(400).json({ error: '자기 자신은 삭제할 수 없습니다' }); return; }
  await sql`DELETE FROM users WHERE id = ${id}`;
  res.status(204).send();
});

export default router;
