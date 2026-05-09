import { Router, Request, Response } from 'express';
import { put, del } from '@vercel/blob';
import { sql } from '@vercel/postgres';
import { requireAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import crypto from 'crypto';
import path from 'path';

const router = Router();
router.use(requireAuth);

router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: '파일이 없습니다' }); return; }
  const { related_type, related_id, project_id } = req.body;

  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const ext = path.extname(originalName);
  const blobPath = `uploads/${crypto.randomBytes(16).toString('hex')}${ext}`;

  const blob = await put(blobPath, req.file.buffer, {
    access: 'public',
    contentType: req.file.mimetype,
  });

  const { rows: [file] } = await sql`
    INSERT INTO files (related_type, related_id, blob_url, original_name, mime_type, size, uploaded_by)
    VALUES (${related_type}, ${Number(related_id)}, ${blob.url}, ${originalName}, ${req.file.mimetype}, ${req.file.size}, ${req.user!.id})
    RETURNING *
  `;

  void project_id; // 실시간 브로드캐스트 제거됨 (폴링 방식)
  res.status(201).json(file);
});

router.get('/related/:type/:id', async (req: Request, res: Response): Promise<void> => {
  const { rows } = await sql`
    SELECT f.*, u.name as uploader_name FROM files f JOIN users u ON f.uploaded_by = u.id
    WHERE f.related_type = ${req.params.type} AND f.related_id = ${Number(req.params.id)}
    ORDER BY f.created_at DESC
  `;
  res.json(rows);
});

// 미리보기/다운로드 - Vercel Blob URL로 리다이렉트
router.get('/:id/preview', async (req: Request, res: Response): Promise<void> => {
  const { rows: [file] } = await sql`SELECT blob_url FROM files WHERE id = ${Number(req.params.id)}`;
  if (!file) { res.status(404).json({ error: '파일을 찾을 수 없습니다' }); return; }
  res.redirect(file.blob_url as string);
});

router.get('/:id/download', async (req: Request, res: Response): Promise<void> => {
  const { rows: [file] } = await sql`SELECT blob_url, original_name, mime_type FROM files WHERE id = ${Number(req.params.id)}`;
  if (!file) { res.status(404).json({ error: '파일을 찾을 수 없습니다' }); return; }
  // Blob URL로 프록시하여 Content-Disposition 헤더 설정
  const response = await fetch(file.blob_url as string);
  const buffer = Buffer.from(await response.arrayBuffer());
  res.setHeader('Content-Type', file.mime_type as string);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.original_name as string)}`);
  res.send(buffer);
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { rows: [file] } = await sql`SELECT id, blob_url, uploaded_by FROM files WHERE id = ${Number(req.params.id)}`;
  if (!file) { res.status(404).json({ error: '파일을 찾을 수 없습니다' }); return; }
  if (file.uploaded_by !== req.user!.id && req.user!.role === 'member') {
    res.status(403).json({ error: '자신이 업로드한 파일만 삭제할 수 있습니다' }); return;
  }
  await del(file.blob_url as string);
  await sql`DELETE FROM files WHERE id = ${file.id as number}`;
  res.status(204).send();
});

export default router;
