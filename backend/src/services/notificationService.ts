import { sql } from '@vercel/postgres';

interface NotificationPayload {
  userId: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'deadline' | 'assignment';
  relatedProjectId?: number;
}

export async function createNotification(payload: NotificationPayload): Promise<void> {
  await sql`
    INSERT INTO notifications (user_id, title, message, type, related_project_id)
    VALUES (${payload.userId}, ${payload.title}, ${payload.message}, ${payload.type},
            ${payload.relatedProjectId ?? null})
  `;
}
