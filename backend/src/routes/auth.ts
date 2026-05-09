import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'manager' | 'member';
  team: string;
}

router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요' });
    return;
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
    return;
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as `${number}${'s'|'m'|'h'|'d'}` }
  );
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, team: user.team } });
});

router.get('/me', requireAuth, (req: Request, res: Response): void => {
  const user = db
    .prepare('SELECT id, name, email, role, team, created_at FROM users WHERE id = ?')
    .get(req.user!.id);
  if (!user) {
    res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    return;
  }
  res.json(user);
});

export default router;
