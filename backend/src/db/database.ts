// Node.js 22.5+ built-in SQLite (stable in Node 24)
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/app.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode=WAL');
db.exec('PRAGMA foreign_keys=ON');

const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
// node:sqlite exec doesn't support multiple statements with PRAGMA on same call
// Split and run each statement individually
const statements = schema
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith('PRAGMA'));
for (const stmt of statements) {
  db.exec(stmt + ';');
}

export default db;
