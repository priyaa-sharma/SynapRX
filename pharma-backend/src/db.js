import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:SynapRX_dev@127.0.0.1:5432/SynapRX',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});
