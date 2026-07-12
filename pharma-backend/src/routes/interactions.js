import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();


router.get('/:drugId', async (req, res) => {
  const { drugId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT s.risk_level, s.risk_label, s.mechanism_note, s.source,
              d.id AS other_id, d.name AS other_name
       FROM interactions_symmetric s
       JOIN drugs d ON d.id = s.other_drug_id
       WHERE s.drug_id = (SELECT id FROM drugs WHERE id::text = $1 OR LOWER(name) = LOWER($1))`,
      [drugId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch interactions' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.risk_level, i.risk_label, i.mechanism_note, i.source,
              da.id AS drug_a_id, da.name AS drug_a_name,
              db.id AS drug_b_id, db.name AS drug_b_name
       FROM interactions i
       JOIN drugs da ON da.id = i.drug_a_id
       JOIN drugs db ON db.id = i.drug_b_id
       ORDER BY i.risk_level`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch interaction graph' });
  }
});

export default router;
