import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import db from '../db/database';
import { requireAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { emitToProject } from '../socket';

const router = Router();
router.use(requireAuth);

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

router.post('/upload', upload.single('file'), (req: Request, res: Response): void => {
  if (!req.file) { res.status(400).json({ error: '파일이 없습니다' }); return; }
  const { related_type, related_id, project_id } = req.body;

  const result = db.prepare(`
    INSERT INTO files (related_type, related_id, filename, original_name, mime_type, size, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    related_type, Number(related_id), req.file.filename,
    Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
    req.file.mimetype, req.file.size, req.user!.id
  );

  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(result.lastInsertRowid);
  if (project_id) emitToProject(Number(project_id), 'file_uploaded', file);
  res.status(201).json(file);
});

router.get('/related/:type/:id', (req: Request, res: Response): void => {
  const files = db.prepare(`
    SELECT f.*, u.name as uploader_name
    FROM files f JOIN users u ON f.uploaded_by = u.id
    WHERE f.related_type = ? AND f.related_id = ?
    ORDER BY f.created_at DESC`).all(req.params.type, Number(req.params.id));
  res.json(files);
});

router.get('/:id/download', (req: Request, res: Response): void => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(Number(req.params.id)) as {
    filename: string; original_name: string; mime_type: string;
  } | undefined;
  if (!file) { res.status(404).json({ error: '파일을 찾을 수 없습니다' }); return; }
  const filePath = path.join(UPLOAD_DIR, file.filename);
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: '파일이 서버에 없습니다' }); return; }
  res.setHeader('Content-Type', file.mime_type);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.original_name)}`);
  fs.createReadStream(filePath).pipe(res);
});

router.get('/:id/preview', (req: Request, res: Response): void => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(Number(req.params.id)) as {
    filename: string; original_name: string; mime_type: string;
  } | undefined;
  if (!file) { res.status(404).json({ error: '파일을 찾을 수 없습니다' }); return; }
  const filePath = path.join(UPLOAD_DIR, file.filename);
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: '파일이 서버에 없습니다' }); return; }
  res.setHeader('Content-Type', file.mime_type);
  res.setHeader('Content-Disposition', 'inline');
  fs.createReadStream(filePath).pipe(res);
});

router.delete('/:id', (req: Request, res: Response): void => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(Number(req.params.id)) as {
    id: number; filename: string; uploaded_by: number;
  } | undefined;
  if (!file) { res.status(404).json({ error: '파일을 찾을 수 없습니다' }); return; }
  if (file.uploaded_by !== req.user!.id && req.user!.role === 'member') {
    res.status(403).json({ error: '자신이 업로드한 파일만 삭제할 수 있습니다' }); return;
  }
  const filePath = path.join(UPLOAD_DIR, file.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  db.prepare('DELETE FROM files WHERE id = ?').run(file.id);
  res.status(204).send();
});

export default router;
