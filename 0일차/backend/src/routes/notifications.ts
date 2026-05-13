import { Router, Request, Response } from 'express';
import { sql } from '../db/database';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { rows } = await sql`
    SELECT * FROM notifications WHERE user_id = ${req.user!.id}
    ORDER BY created_at DESC LIMIT 50
  `;
  res.json(rows);
});

router.patch('/:id/read', async (req: Request, res: Response): Promise<void> => {
  await sql`UPDATE notifications SET is_read = 1 WHERE id = ${Number(req.params.id)} AND user_id = ${req.user!.id}`;
  res.status(204).send();
});

router.patch('/read-all', async (req: Request, res: Response): Promise<void> => {
  await sql`UPDATE notifications SET is_read = 1 WHERE user_id = ${req.user!.id}`;
  res.status(204).send();
});

export default router;
