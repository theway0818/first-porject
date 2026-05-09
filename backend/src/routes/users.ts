import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// 전체 사용자 목록 (admin/manager만)
router.get('/', requireRole('admin', 'manager'), (req: Request, res: Response): void => {
  const users = db
    .prepare('SELECT id, name, email, role, team, created_at FROM users ORDER BY name')
    .all();
  res.json(users);
});

// 사용자 생성 (admin만)
router.post('/', requireRole('admin'), (req: Request, res: Response): void => {
  const { name, email, password, role, team } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: '이름, 이메일, 비밀번호는 필수입니다' });
    return;
  }
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) {
    res.status(409).json({ error: '이미 사용 중인 이메일입니다' });
    return;
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, role, team) VALUES (?, ?, ?, ?, ?)')
    .run(name, email, hash, role ?? 'member', team ?? '');
  const user = db
    .prepare('SELECT id, name, email, role, team, created_at FROM users WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(user);
});

// 사용자 수정 (admin만)
router.put('/:id', requireRole('admin'), (req: Request, res: Response): void => {
  const { name, role, team } = req.body;
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(Number(req.params.id));
  if (!user) {
    res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    return;
  }
  db.prepare('UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), team = COALESCE(?, team) WHERE id = ?')
    .run(name ?? null, role ?? null, team ?? null, Number(req.params.id));
  const updated = db
    .prepare('SELECT id, name, email, role, team, created_at FROM users WHERE id = ?')
    .get(Number(req.params.id));
  res.json(updated);
});

// 사용자 삭제 (admin만)
router.delete('/:id', requireRole('admin'), (req: Request, res: Response): void => {
  const id = Number(req.params.id);
  if (id === req.user!.id) {
    res.status(400).json({ error: '자기 자신은 삭제할 수 없습니다' });
    return;
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.status(204).send();
});

export default router;
