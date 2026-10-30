import { Router } from 'express';
import { pool } from '../db.js';
import { getDrugLabel } from '../lib/drug-labels.js';

const router = Router();


router.get('/', async (req, res) => {
  const { search, class: className } = req.query;
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    conditions.push(`(LOWER(d.name) LIKE $${params.length} OR EXISTS (
      SELECT 1 FROM unnest(d.brand_names) b WHERE LOWER(b) LIKE $${params.length}
    ))`);
  }
  if (className) {
    params.push(className);
    conditions.push(`dc.name = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT d.id, d.name, d.brand_names, d.approval_year, d.half_life_hours, dc.name AS class
       FROM drugs d
       JOIN drug_classes dc ON dc.id = d.class_id
       ${where}
       ORDER BY d.name`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch drugs' });
  }
});

router.get('/:id/label', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id
       FROM drugs
       WHERE id::text = $1 OR LOWER(name) = LOWER($1)
       LIMIT 1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    const label = await getDrugLabel(rows[0].id);
    if (!label) return res.status(404).json({ error: 'Drug not found' });
    res.json(label);
  } catch (err) {
    console.error('Failed to fetch public drug label:', err);
    if (err.code === '42P01') {
      return res.status(503).json({
        error: 'Drug label cache is not initialized. Run npm run seed:expanded in pharma-backend.',
      });
    }
    res.status(502).json({ error: 'FDA/DailyMed drug information is currently unavailable.' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const drugResult = await pool.query(
      `SELECT d.*, dc.name AS class_name, dc.description AS class_description
       FROM drugs d
       JOIN drug_classes dc ON dc.id = d.class_id
       WHERE d.id::text = $1 OR LOWER(d.name) = LOWER($1)`,
      [id]
    );
    if (drugResult.rows.length === 0) {
      return res.status(404).json({ error: 'Drug not found' });
    }
    const drug = drugResult.rows[0];

    const [mechanisms, metabolism, history] = await Promise.all([
      pool.query('SELECT target, action, is_primary, notes FROM mechanisms WHERE drug_id = $1', [drug.id]),
      pool.query('SELECT enzyme, role, strength, notes FROM metabolism WHERE drug_id = $1', [drug.id]),
      pool.query(
        'SELECT year_label, sort_year, title, description FROM history_events WHERE drug_id = $1 ORDER BY sort_year',
        [drug.id]
      ),
    ]);

    res.json({
      ...drug,
      class: drug.class_name,
      class_description: drug.class_description,
      mechanisms: mechanisms.rows,
      metabolism: metabolism.rows,
      history: history.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch drug' });
  }
});

export default router;
