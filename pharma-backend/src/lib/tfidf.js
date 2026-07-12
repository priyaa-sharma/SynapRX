const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'to', 'of', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'by', 'from',
  'as', 'that', 'this', 'it', 'its', 'their', 'they', 'has', 'have',
  'had', 'which', 'can', 'may', 'both', 'also', 'into', 'than', 'not',
]);

export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function termFrequencies(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

export function buildVocabulary(documents) {
  const docFrequency = new Map();
  const tokenizedDocs = documents.map(tokenize);

  for (const tokens of tokenizedDocs) {
    const seen = new Set(tokens);
    for (const term of seen) {
      docFrequency.set(term, (docFrequency.get(term) || 0) + 1);
    }
  }

  const terms = [...docFrequency.keys()].sort();
  const N = documents.length;
  const idf = terms.map((term) => Math.log((N + 1) / (docFrequency.get(term) + 1)) + 1);

  return { terms, idf, tokenizedDocs };
}


export function vectorize(tokens, terms, idf) {
  const tf = termFrequencies(tokens);
  const termIndex = new Map(terms.map((t, i) => [t, i]));
  const vec = new Array(terms.length).fill(0);

  for (const [term, count] of tf.entries()) {
    const idx = termIndex.get(term);
    if (idx !== undefined) {
      vec[idx] = count * idf[idx];
    }
  }
  return vec;
}

export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
