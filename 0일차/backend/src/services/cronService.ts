// Vercel Cron Job 엔드포인트에서 호출하는 함수로 변환.
// vercel.json의 crons 설정으로 매일 오전 9시(UTC 0시) 실행.

import { sql } from '../db/database';
import { createNotification } from './notificationService';

interface TaskRow {
  id: number; title: string; assignee_id: number; project_id: number; due_date: string;
}
interface ChecklistItemRow {
  id: number; title: string; assignee_id: number; project_id: number; due_date: string;
}

function getDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export async function runDeadlineNotifications(): Promise<void> {
  for (const offset of [0, 1, 3]) {
    const dateStr = getDateStr(offset);
    const label = offset === 0 ? '오늘' : `${offset}일 후`;

    const { rows: tasks } = await sql`
      SELECT t.id, t.title, t.assignee_id, t.project_id, t.due_date
      FROM tasks t
      WHERE t.due_date = ${dateStr} AND t.status != 'done' AND t.assignee_id IS NOT NULL
    `;
    for (const task of tasks as unknown as TaskRow[]) {
      await createNotification({
        userId: task.assignee_id,
        title: `마감 임박: ${task.title}`,
        message: `업무 "${task.title}"의 마감일이 ${label}(${task.due_date})입니다.`,
        type: offset === 0 ? 'deadline' : 'warning',
        relatedProjectId: task.project_id,
      });
    }

    const { rows: items } = await sql`
      SELECT ci.id, ci.title, ci.assignee_id, c.project_id, ci.due_date
      FROM checklist_items ci JOIN checklists c ON ci.checklist_id = c.id
      WHERE ci.due_date = ${dateStr} AND ci.is_completed = 0 AND ci.assignee_id IS NOT NULL
    `;
    for (const item of items as unknown as ChecklistItemRow[]) {
      await createNotification({
        userId: item.assignee_id,
        title: `체크리스트 마감 임박: ${item.title}`,
        message: `체크리스트 항목 "${item.title}"의 마감일이 ${label}(${item.due_date})입니다.`,
        type: offset === 0 ? 'deadline' : 'warning',
        relatedProjectId: item.project_id,
      });
    }
  }
}
