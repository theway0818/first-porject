import cron from 'node-cron';
import db from '../db/database';
import { createNotification } from './notificationService';

interface TaskRow {
  id: number;
  title: string;
  assignee_id: number;
  project_id: number;
  due_date: string;
}

interface ChecklistItemRow {
  id: number;
  title: string;
  assignee_id: number;
  project_id: number;
  due_date: string;
}

function getDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function sendDeadlineNotifications(offsetDays: number): void {
  const dateStr = getDateStr(offsetDays);
  const label = offsetDays === 0 ? '오늘' : `${offsetDays}일 후`;

  const tasks = db
    .prepare(
      `SELECT t.id, t.title, t.assignee_id, t.project_id, t.due_date
       FROM tasks t WHERE t.due_date = ? AND t.status != 'done' AND t.assignee_id IS NOT NULL`
    )
    .all(dateStr) as unknown as TaskRow[];

  for (const task of tasks) {
    createNotification({
      userId: task.assignee_id,
      title: `마감 임박: ${task.title}`,
      message: `업무 "${task.title}"의 마감일이 ${label}(${task.due_date})입니다.`,
      type: offsetDays === 0 ? 'deadline' : 'warning',
      relatedProjectId: task.project_id,
    });
  }

  const items = db
    .prepare(
      `SELECT ci.id, ci.title, ci.assignee_id, c.project_id, ci.due_date
       FROM checklist_items ci JOIN checklists c ON ci.checklist_id = c.id
       WHERE ci.due_date = ? AND ci.is_completed = 0 AND ci.assignee_id IS NOT NULL`
    )
    .all(dateStr) as unknown as ChecklistItemRow[];

  for (const item of items) {
    createNotification({
      userId: item.assignee_id,
      title: `체크리스트 마감 임박: ${item.title}`,
      message: `체크리스트 항목 "${item.title}"의 마감일이 ${label}(${item.due_date})입니다.`,
      type: offsetDays === 0 ? 'deadline' : 'warning',
      relatedProjectId: item.project_id,
    });
  }
}

export function startCronJobs(): void {
  // 매일 오전 9시 실행
  cron.schedule('0 9 * * *', () => {
    sendDeadlineNotifications(0); // 당일 마감
    sendDeadlineNotifications(1); // 1일 전
    sendDeadlineNotifications(3); // 3일 전
  });
}
