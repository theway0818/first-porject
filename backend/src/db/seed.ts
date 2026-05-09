import bcrypt from 'bcryptjs';
import db from './database';

const adminEmail = 'admin@company.com';
const adminPassword = 'admin1234';

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!existing) {
  const hash = bcrypt.hashSync(adminPassword, 10);
  db.prepare(
    'INSERT INTO users (name, email, password_hash, role, team) VALUES (?, ?, ?, ?, ?)'
  ).run('관리자', adminEmail, hash, 'admin', '관리팀');
  console.log('Admin account created:', adminEmail, '/ password:', adminPassword);
} else {
  console.log('Admin account already exists');
}

// 기본 이메일 템플릿
const tmplCount = (db.prepare('SELECT COUNT(*) as c FROM email_templates').get() as { c: number }).c;
if (tmplCount === 0) {
  const adminId = (db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail) as { id: number }).id;
  db.prepare(
    'INSERT INTO email_templates (name, subject_template, body_template, created_by) VALUES (?, ?, ?, ?)'
  ).run(
    '자료 요청',
    '[자료 요청] {{프로젝트명}} 관련 {{자료명}} 요청드립니다',
    `안녕하세요, {{수신자명}} 담당자님.

{{발신자명}}입니다.

{{프로젝트명}} 프로젝트와 관련하여 아래 자료를 요청드립니다.

- 요청 자료: {{자료명}}
- 요청 기한: {{기한}}
- 참고 사항: {{참고사항}}

바쁘신 중에 번거로움을 드려 죄송합니다.
확인 후 회신 부탁드립니다.

감사합니다.
{{발신자명}} 드림`,
    adminId
  );
  console.log('Default email template created');
}
