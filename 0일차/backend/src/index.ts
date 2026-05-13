import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { runDeadlineNotifications } from './services/cronService';

import authRouter from './routes/auth';
import usersRouter from './routes/users';
import projectsRouter from './routes/projects';
import tasksRouter from './routes/tasks';
import checklistsRouter from './routes/checklists';
import filesRouter from './routes/files';
import notificationsRouter from './routes/notifications';
import emailsRouter from './routes/emails';

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/projects/:projectId/tasks', tasksRouter);
app.use('/api/projects/:projectId/checklists', checklistsRouter);
app.use('/api/files', filesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/emails', emailsRouter);

// Vercel Cron Job 엔드포인트 (매일 UTC 0시 = 한국 오전 9시)
app.get('/api/cron/deadline-notifications', async (req, res) => {
  // Vercel Cron 요청 검증
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  await runDeadlineNotifications();
  res.json({ ok: true, ran_at: new Date().toISOString() });
});

// 로컬 개발 전용
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Dev server: http://localhost:${PORT}`));
}

// Vercel serverless 핸들러로 export
export default app;
