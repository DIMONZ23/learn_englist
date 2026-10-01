import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../server/db.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
  const sql = await fs.readFile(path.join(root,'db','schema.sql'),'utf8');
  await pool.query(sql);
  console.log('✓ PostgreSQL schema đã sẵn sàng.');
} finally { await pool.end(); }
