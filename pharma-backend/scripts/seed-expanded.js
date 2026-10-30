import { readFile } from 'node:fs/promises';
import { pool } from '../src/db.js';

async function seedExpandedCatalog() {
  try {
    const sql = await readFile(new URL('../db/expanded_seed.sql', import.meta.url), 'utf8');
    await pool.query(sql);

    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM drugs');
    console.log(`Expanded drug seed applied. Database now contains ${rows[0].count} drugs.`);
  } finally {
    await pool.end();
  }
}

seedExpandedCatalog().catch((error) => {
  console.error('Failed to apply expanded drug seed:', error);
  process.exitCode = 1;
});
