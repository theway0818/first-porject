import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import path from 'path';

import { initSocket } from './socket';
import { startCronJobs } from './services/cronService';

import authRouter from './routes/auth';
import usersRouter from './routes/users';
import projectsRouter from './routes/projects';
import tasksRouter from './routes/tasks';
import checklistsRouter from './routes/checklists';
import filesRouter from './routes/files';
import notificationsRouter from './routes/notifications';
import emailsRouter from './routes/emails';

const app = express();
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: { origin: 'http://localhost:5173', credentials: true },
});
initSocket(io);
startCronJobs();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/projects/:projectId/tasks', tasksRouter);
app.use('/api/projects/:projectId/checklists', checklistsRouter);
app.use('/api/files', filesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/emails', emailsRouter);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
