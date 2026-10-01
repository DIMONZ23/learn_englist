import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000
});

pool.on('error', (error) => console.error('[database] unexpected pool error', error));

export async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export function mapVocabulary(row) {
  return {
    id: Number(row.id), word: row.word, ipa: row.ipa, type: row.word_type,
    meaning: row.meaning, definition: row.definition, example: row.example,
    collocations: row.collocations, status: row.status, nextReviewAt: row.next_review_at
  };
}
