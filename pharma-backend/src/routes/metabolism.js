import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.id AS drug_id, d.name AS drug_name, m.enzyme, m.role, m.strength
       FROM metabolism m
       JOIN drugs d ON d.id = m.drug_id
       ORDER BY d.name, m.enzyme`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch metabolism data' });
  }
});

router.get('/overlaps', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT inhibitor_name, substrate_name, enzyme, inhibitor_strength
       FROM cyp450_overlap_risks
       ORDER BY inhibitor_name, substrate_name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch metabolism overlaps' });
  }
});

export default router;
