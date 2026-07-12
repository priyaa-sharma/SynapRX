import { Router } from 'express';
import { pool } from '../db.js';

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

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const drugResult = await pool.query(
      `SELECT d.*, dc.name AS class_name
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
