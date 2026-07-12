import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();


router.get('/', async (req, res) => {
  const { class: className } = req.query;
  const params = [];
  let classFilter = '';
  if (className) {
    params.push(className);
    classFilter = `WHERE dc.name = $1 OR hdc.name = $1`;
  }

  try {
    const { rows } = await pool.query(
      `SELECT h.year_label, h.sort_year, h.title, h.description,
              d.id AS drug_id, d.name AS drug_name,
              hdc.name AS event_class
       FROM history_events h
       LEFT JOIN drugs d ON d.id = h.drug_id
       LEFT JOIN drug_classes dc ON dc.id = d.class_id
       LEFT JOIN drug_classes hdc ON hdc.id = h.class_id
       ${classFilter}
       ORDER BY h.sort_year`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history events' });
  }
});

export default router;
