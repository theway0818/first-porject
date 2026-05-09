import { Router, Request, Response } from 'express';
import db from '../db/database';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', (req: Request, res: Response): void => {
  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 50`).all(req.user!.id);
  res.json(notifications);
});

router.patch('/:id/read', (req: Request, res: Response): void => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
    .run(Number(req.params.id), req.user!.id);
  res.status(204).send();
});

router.patch('/read-all', (req: Request, res: Response): void => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user!.id);
  res.status(204).send();
});

export default router;
