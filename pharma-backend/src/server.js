import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { pool } from './db.js';
import drugsRouter from './routes/drugs.js';
import classesRouter from './routes/classes.js';
import interactionsRouter from './routes/interactions.js';
import metabolismRouter from './routes/metabolism.js';
import historyRouter from './routes/history.js';
import askRouter from './routes/ask.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

app.use('/api/drugs', drugsRouter);
app.use('/api/classes', classesRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/metabolism', metabolismRouter);
app.use('/api/history', historyRouter);
app.use('/api/ask', askRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`PharmaLens API listening on http://localhost:${PORT}`);
});
