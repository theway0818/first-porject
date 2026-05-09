import { Router, Request, Response } from 'express';
import db from '../db/database';
import { requireAuth, requireRole } from '../middleware/auth';
import { renderTemplate, sendEmail } from '../services/emailService';

const router = Router();
router.use(requireAuth);

// 이메일 템플릿 목록
router.get('/templates', (req: Request, res: Response): void => {
  const templates = db.prepare(`
    SELECT et.*, u.name as created_by_name
    FROM email_templates et JOIN users u ON et.created_by = u.id
    ORDER BY et.created_at DESC`).all();
  res.json(templates);
});

// 이메일 템플릿 생성 (admin, manager)
router.post('/templates', requireRole('admin', 'manager'), (req: Request, res: Response): void => {
  const { name, subject_template, body_template } = req.body;
  if (!name || !subject_template || !body_template) {
    res.status(400).json({ error: '이름, 제목 템플릿, 본문 템플릿은 필수입니다' });
    return;
  }
  const result = db
    .prepare('INSERT INTO email_templates (name, subject_template, body_template, created_by) VALUES (?, ?, ?, ?)')
    .run(name, subject_template, body_template, req.user!.id);
  res.status(201).json(db.prepare('SELECT * FROM email_templates WHERE id = ?').get(result.lastInsertRowid));
});

// 이메일 템플릿 수정
router.put('/templates/:id', requireRole('admin', 'manager'), (req: Request, res: Response): void => {
  const { name, subject_template, body_template } = req.body;
  db.prepare(`UPDATE email_templates SET
    name = COALESCE(?, name),
    subject_template = COALESCE(?, subject_template),
    body_template = COALESCE(?, body_template)
    WHERE id = ?`).run(name ?? null, subject_template ?? null, body_template ?? null, Number(req.params.id));
  res.json(db.prepare('SELECT * FROM email_templates WHERE id = ?').get(Number(req.params.id)));
});

// 이메일 템플릿 삭제
router.delete('/templates/:id', requireRole('admin', 'manager'), (req: Request, res: Response): void => {
  db.prepare('DELETE FROM email_templates WHERE id = ?').run(Number(req.params.id));
  res.status(204).send();
});

// 미리보기 (변수 치환)
router.post('/preview', (req: Request, res: Response): void => {
  const { template_id, variables } = req.body;
  const tmpl = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(template_id) as {
    subject_template: string; body_template: string;
  } | undefined;
  if (!tmpl) { res.status(404).json({ error: '템플릿을 찾을 수 없습니다' }); return; }
  res.json({
    subject: renderTemplate(tmpl.subject_template, variables ?? {}),
    body: renderTemplate(tmpl.body_template, variables ?? {}),
  });
});

// 이메일 발송
router.post('/send', async (req: Request, res: Response): Promise<void> => {
  const { to, template_id, variables } = req.body;
  if (!to || !template_id) { res.status(400).json({ error: '수신자와 템플릿은 필수입니다' }); return; }

  const tmpl = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(template_id) as {
    subject_template: string; body_template: string;
  } | undefined;
  if (!tmpl) { res.status(404).json({ error: '템플릿을 찾을 수 없습니다' }); return; }

  try {
    await sendEmail({
      to,
      subject: renderTemplate(tmpl.subject_template, variables ?? {}),
      text: renderTemplate(tmpl.body_template, variables ?? {}),
    });
    res.json({ message: '이메일이 발송되었습니다' });
  } catch (err) {
    res.status(500).json({ error: '이메일 발송에 실패했습니다', detail: String(err) });
  }
});

export default router;
