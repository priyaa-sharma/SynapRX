import { pool } from '../db.js';
import { tokenize, vectorize, cosineSimilarity } from './tfidf.js';

let cache = null;

async function loadIndex() {
  if (cache) return cache;

  const { rows: vocabRows } = await pool.query('SELECT terms, idf FROM rag_vocabulary WHERE id = 1');
  if (vocabRows.length === 0) {
    throw new Error('No vocabulary found. Run `npm run ingest` first.');
  }
  const terms = vocabRows[0].terms;
  const idf = vocabRows[0].idf;

  const { rows: documents } = await pool.query(
    `SELECT dc.id, dc.drug_id, dc.category, dc.title, dc.content, dc.source, dc.embedding, d.name AS drug_name
     FROM documents dc LEFT JOIN drugs d ON d.id = dc.drug_id`
  );

  cache = { terms, idf, documents };
  return cache;
}


export function invalidateIndex() {
  cache = null;
}

// Returns the top-k documents most similar to the question.
export async function retrieve(question, k = 4) {
  const { terms, idf, documents } = await loadIndex();
  const questionVec = vectorize(tokenize(question), terms, idf);

  const scored = documents
    .map((doc) => ({ doc, score: cosineSimilarity(questionVec, doc.embedding) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return scored;
}
