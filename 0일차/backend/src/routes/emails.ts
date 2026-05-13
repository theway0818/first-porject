import { Router, Request, Response } from 'express';
import { sql } from '../db/database';
import { requireAuth, requireRole } from '../middleware/auth';
import { renderTemplate, sendEmail } from '../services/emailService';

const router = Router();
router.use(requireAuth);

router.get('/templates', async (_req: Request, res: Response): Promise<void> => {
  const { rows } = await sql`
    SELECT et.*, u.name as created_by_name FROM email_templates et JOIN users u ON et.created_by = u.id ORDER BY et.created_at DESC
  `;
  res.json(rows);
});

router.post('/templates', requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  const { name, subject_template, body_template } = req.body;
  if (!name || !subject_template || !body_template) { res.status(400).json({ error: '이름, 제목 템플릿, 본문 템플릿은 필수입니다' }); return; }
  const { rows: [tmpl] } = await sql`
    INSERT INTO email_templates (name, subject_template, body_template, created_by)
    VALUES (${name}, ${subject_template}, ${body_template}, ${req.user!.id}) RETURNING *
  `;
  res.status(201).json(tmpl);
});

router.put('/templates/:id', requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  const { name, subject_template, body_template } = req.body;
  const id = Number(req.params.id);
  await sql`UPDATE email_templates SET name = COALESCE(${name}, name), subject_template = COALESCE(${subject_template}, subject_template), body_template = COALESCE(${body_template}, body_template) WHERE id = ${id}`;
  const { rows: [tmpl] } = await sql`SELECT * FROM email_templates WHERE id = ${id}`;
  res.json(tmpl);
});

router.delete('/templates/:id', requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
  await sql`DELETE FROM email_templates WHERE id = ${Number(req.params.id)}`;
  res.status(204).send();
});

router.post('/preview', async (req: Request, res: Response): Promise<void> => {
  const { template_id, variables } = req.body;
  const { rows: [tmpl] } = await sql`SELECT * FROM email_templates WHERE id = ${template_id}`;
  if (!tmpl) { res.status(404).json({ error: '템플릿을 찾을 수 없습니다' }); return; }
  res.json({
    subject: renderTemplate(tmpl.subject_template as string, variables ?? {}),
    body: renderTemplate(tmpl.body_template as string, variables ?? {}),
  });
});

router.post('/send', async (req: Request, res: Response): Promise<void> => {
  const { to, template_id, variables } = req.body;
  if (!to || !template_id) { res.status(400).json({ error: '수신자와 템플릿은 필수입니다' }); return; }
  const { rows: [tmpl] } = await sql`SELECT * FROM email_templates WHERE id = ${template_id}`;
  if (!tmpl) { res.status(404).json({ error: '템플릿을 찾을 수 없습니다' }); return; }
  try {
    await sendEmail({
      to,
      subject: renderTemplate(tmpl.subject_template as string, variables ?? {}),
      text: renderTemplate(tmpl.body_template as string, variables ?? {}),
    });
    res.json({ message: '이메일이 발송되었습니다' });
  } catch (err) {
    res.status(500).json({ error: '이메일 발송에 실패했습니다', detail: String(err) });
  }
});

export default router;
