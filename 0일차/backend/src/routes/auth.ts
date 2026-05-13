import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '../db/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요' }); return; }
  const { rows } = await sql`SELECT * FROM users WHERE email = ${email}`;
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash as string)) {
    res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' }); return;
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as `${number}${'s'|'m'|'h'|'d'}` }
  );
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, team: user.team } });
});

router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { rows } = await sql`SELECT id, name, email, role, team, created_at FROM users WHERE id = ${req.user!.id}`;
  if (!rows[0]) { res.status(404).json({ error: '사용자를 찾을 수 없습니다' }); return; }
  res.json(rows[0]);
});

export default router;
