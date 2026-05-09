import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

async function main() {
  // 스키마 생성
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  const statements = schema.split(';').map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await sql.query(stmt);
  }

  // admin 계정
  const adminEmail = 'admin@company.com';
  const { rows } = await sql`SELECT id FROM users WHERE email = ${adminEmail}`;
  if (rows.length === 0) {
    const hash = bcrypt.hashSync('admin1234', 10);
    await sql`INSERT INTO users (name, email, password_hash, role, team)
              VALUES ('관리자', ${adminEmail}, ${hash}, 'admin', '관리팀')`;
    console.log('Admin created:', adminEmail, '/ pw: admin1234');
  } else {
    console.log('Admin already exists');
  }

  // 기본 이메일 템플릿
  const { rows: tmplRows } = await sql`SELECT COUNT(*) as c FROM email_templates`;
  if (Number(tmplRows[0].c) === 0) {
    const { rows: [admin] } = await sql`SELECT id FROM users WHERE email = ${adminEmail}`;
    await sql`INSERT INTO email_templates (name, subject_template, body_template, created_by)
              VALUES (
                '자료 요청',
                '[자료 요청] {{프로젝트명}} 관련 {{자료명}} 요청드립니다',
                ${'안녕하세요, {{수신자명}} 담당자님.\n\n{{발신자명}}입니다.\n\n{{프로젝트명}} 프로젝트와 관련하여 아래 자료를 요청드립니다.\n\n- 요청 자료: {{자료명}}\n- 요청 기한: {{기한}}\n- 참고 사항: {{참고사항}}\n\n바쁘신 중에 번거로움을 드려 죄송합니다.\n확인 후 회신 부탁드립니다.\n\n감사합니다.\n{{발신자명}} 드림'},
                ${admin.id}
              )`;
    console.log('Default email template created');
  }
}

main().catch(console.error);
