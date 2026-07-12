import { Router } from 'express';
import { retrieve } from '../lib/retrieve.js';
import { generateAnswer } from '../lib/llm.js';

const router = Router();

router.post('/', async (req, res) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'question is required' });
  }

  try {
    const retrieved = await retrieve(question, 4);
    const answer = await generateAnswer(question, retrieved);
    res.json({
      ...answer,
      retrieved: retrieved.map((r) => ({
        title: r.doc.title,
        category: r.doc.category,
        drug_name: r.doc.drug_name,
        score: Number(r.score.toFixed(3)),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to answer question' });
  }
});

export default router;
