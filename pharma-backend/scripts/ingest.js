import { pool } from '../src/db.js';
import { buildVocabulary, vectorize } from '../src/lib/tfidf.js';

async function buildDocuments() {
  const documents = [];

  const { rows: drugs } = await pool.query(
    `SELECT d.id, d.name, d.approval_year, d.half_life_hours, dc.name AS class_name
     FROM drugs d JOIN drug_classes dc ON dc.id = d.class_id`
  );
  const drugById = new Map(drugs.map((d) => [d.id, d]));

  for (const d of drugs) {
    documents.push({
      drug_id: d.id,
      category: 'summary',
      title: `${d.name} overview`,
      content: `${d.name} is a ${d.class_name}, approved in ${d.approval_year || 'an unrecorded year'}. ${
        d.half_life_hours ? `Its half-life is approximately ${d.half_life_hours} hours.` : ''
      }`,
      source: 'SynapRX drug graph',
    });
  }
  const { rows: mechanisms } = await pool.query('SELECT drug_id, target, action, notes FROM mechanisms');
  for (const m of mechanisms) {
    const drug = drugById.get(m.drug_id);
    if (!drug) continue;
    documents.push({
      drug_id: m.drug_id,
      category: 'mechanism',
      title: `${drug.name} mechanism: ${m.target}`,
      content: `${drug.name} acts on ${m.target} via ${m.action}. ${m.notes || ''}`.trim(),
      source: 'SynapRX drug graph',
    });
  }

  const { rows: metabolism } = await pool.query('SELECT drug_id, enzyme, role, strength, notes FROM metabolism');
  for (const m of metabolism) {
    const drug = drugById.get(m.drug_id);
    if (!drug) continue;
    const strengthText = m.strength ? `${m.strength} ` : '';
    documents.push({
      drug_id: m.drug_id,
      category: 'metabolism',
      title: `${drug.name} metabolism: ${m.enzyme}`,
      content: `${drug.name} is metabolized via ${m.enzyme}, acting as a ${strengthText}${m.role} of that enzyme. ${m.notes || ''}`.trim(),
      source: 'SynapRX drug graph',
    });
  }

  const { rows: interactions } = await pool.query(
    `SELECT drug_a_id, drug_b_id, risk_level, risk_label, mechanism_note, source
     FROM interactions`
  );
  for (const i of interactions) {
    const a = drugById.get(i.drug_a_id);
    const b = drugById.get(i.drug_b_id);
    if (!a || !b) continue;
    const content = `${a.name} combined with ${b.name} carries a ${i.risk_level} risk: ${i.risk_label}. ${i.mechanism_note || ''}`.trim();
    documents.push({ drug_id: a.id, category: 'interaction', title: `${a.name} + ${b.name} interaction`, content, source: i.source });
    documents.push({ drug_id: b.id, category: 'interaction', title: `${a.name} + ${b.name} interaction`, content, source: i.source });
  }

  const { rows: history } = await pool.query(
    `SELECT h.drug_id, h.year_label, h.title, h.description, d.name AS drug_name
     FROM history_events h LEFT JOIN drugs d ON d.id = h.drug_id`
  );
  for (const h of history) {
    documents.push({
      drug_id: h.drug_id,
      category: 'history',
      title: h.title,
      content: `${h.year_label}: ${h.title}. ${h.description}`,
      source: 'SynapRX drug graph',
    });
  }

  return documents;
}

async function ingest() {
  console.log('Building documents from the drug graph...');
  const documents = await buildDocuments();
  console.log(`Built ${documents.length} documents.`);

  console.log('Computing TF-IDF vocabulary...');
  const texts = documents.map((d) => `${d.title}. ${d.content}`);
  const { terms, idf, tokenizedDocs } = buildVocabulary(texts);
  console.log(`Vocabulary size: ${terms.length} terms.`);

  const vectors = tokenizedDocs.map((tokens) => vectorize(tokens, terms, idf));

  console.log('Writing to database...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE documents RESTART IDENTITY');

    for (let i = 0; i < documents.length; i++) {
      const d = documents[i];
      await client.query(
        `INSERT INTO documents (drug_id, category, title, content, source, embedding)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [d.drug_id, d.category, d.title, d.content, d.source, vectors[i]]
      );
    }

    await client.query(
      `INSERT INTO rag_vocabulary (id, terms, idf) VALUES (1, $1, $2)
       ON CONFLICT (id) DO UPDATE SET terms = $1, idf = $2`,
      [JSON.stringify(terms), JSON.stringify(idf)]
    );

    await client.query('COMMIT');
    console.log(`Done. Ingested ${documents.length} documents.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await pool.end();
}

ingest().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
