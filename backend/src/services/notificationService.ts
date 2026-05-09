import db from '../db/database';
import { emitToUser } from '../socket';

interface NotificationPayload {
  userId: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'deadline' | 'assignment';
  relatedProjectId?: number;
}

export function createNotification(payload: NotificationPayload): void {
  const stmt = db.prepare(
    'INSERT INTO notifications (user_id, title, message, type, related_project_id) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(
    payload.userId,
    payload.title,
    payload.message,
    payload.type,
    payload.relatedProjectId ?? null
  );
  const notification = db
    .prepare('SELECT * FROM notifications WHERE id = ?')
    .get(result.lastInsertRowid);
  emitToUser(payload.userId, 'notification', notification);
}
