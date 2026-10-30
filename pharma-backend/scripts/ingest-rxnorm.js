import { pool } from '../src/db.js';

const RXNORM_API = 'https://rxnav.nlm.nih.gov/REST';
const RXCLASS_SOURCE = 'ATC';
const CLASS_LOOKUP_BATCH_SIZE = 5;

async function fetchJson(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    let response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
      continue;
    }

    if (response.ok) return response.json();
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`RxNorm API returned HTTP ${response.status} for ${url}`);
    }
    if (attempt === 3) {
      throw new Error(`RxNorm API returned HTTP ${response.status} after ${attempt} attempts`);
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
  }

  throw new Error(`RxNorm API request failed for ${url}`);
}

function getMostSpecificAtcClass(response, rxcui) {
  const classes = response.rxclassDrugInfoList?.rxclassDrugInfo || [];
  const candidates = classes
    .filter((entry) => entry.minConcept?.rxcui === rxcui && entry.minConcept?.tty === 'IN')
    .map((entry) => entry.rxclassMinConceptItem)
    .filter((item) => item?.classType === 'ATC1-4' && item.className && item.classId);

  return candidates.sort((a, b) => b.classId.length - a.classId.length)[0] || null;
}

async function loadIngredientClasses(ingredients) {
  const results = [];

  for (let start = 0; start < ingredients.length; start += CLASS_LOOKUP_BATCH_SIZE) {
    const batch = ingredients.slice(start, start + CLASS_LOOKUP_BATCH_SIZE);
    const classifications = await Promise.all(
      batch.map(async (ingredient) => {
        const url = new URL(`${RXNORM_API}/rxclass/class/byRxcui.json`);
        url.searchParams.set('rxcui', ingredient.rxcui);
        url.searchParams.set('relaSource', RXCLASS_SOURCE);

        return {
          ...ingredient,
          classification: getMostSpecificAtcClass(await fetchJson(url), ingredient.rxcui),
        };
      })
    );
    results.push(...classifications);

    const completed = Math.min(start + batch.length, ingredients.length);
    if (completed % 500 < batch.length || completed === ingredients.length) {
      console.log(`Classified ${completed} of ${ingredients.length} new ingredients.`);
    }
  }

  return results;
}

async function importIngredients() {
  console.log('Loading RxNorm ingredient concepts...');
  const response = await fetchJson(`${RXNORM_API}/allconcepts.json?tty=IN`);
  const concepts = response.minConceptGroup?.minConcept;
  if (!Array.isArray(concepts)) {
    throw new Error('RxNorm response did not contain an ingredient concept list.');
  }

  const { rows: existingRows } = await pool.query('SELECT LOWER(name) AS name FROM drugs');
  const existingNames = new Set(existingRows.map((row) => row.name));
  const ingredients = concepts
    .filter((concept) => concept.rxcui && concept.name?.trim())
    .filter((concept) => !existingNames.has(concept.name.trim().toLowerCase()))
    .map((concept) => ({ rxcui: String(concept.rxcui), name: concept.name.trim() }));

  if (ingredients.length === 0) {
    console.log('All RxNorm ingredients are already present.');
    return;
  }

  console.log(`Found ${ingredients.length} RxNorm ingredients not already in the database.`);
  const classifiedIngredients = await loadIngredientClasses(ingredients);
  const fallbackClass = 'Unclassified medication';
  const classNames = new Set([fallbackClass]);
  for (const ingredient of classifiedIngredients) {
    if (ingredient.classification) classNames.add(ingredient.classification.className);
  }

  const client = await pool.connect();
  let inserted = 0;
  try {
    await client.query('BEGIN');

    for (const name of classNames) {
      const atcClass = classifiedIngredients.find(
        (ingredient) => ingredient.classification?.className === name
      )?.classification;
      await client.query(
        `INSERT INTO drug_classes (name, full_name, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [
          name,
          atcClass ? `${name} (ATC therapeutic class)` : 'Medication without an ATC class mapping',
          atcClass
            ? `Therapeutic class from the NIH RxClass service (ATC ${atcClass.classId}).`
            : 'RxNorm ingredient without an ATC class mapping in RxClass.',
        ]
      );
    }

    const { rows: classRows } = await client.query(
      'SELECT id, name FROM drug_classes WHERE name = ANY($1::text[])',
      [[...classNames]]
    );
    const classIds = new Map(classRows.map((row) => [row.name, row.id]));

    for (const ingredient of classifiedIngredients) {
      const className = ingredient.classification?.className || fallbackClass;
      const classId = classIds.get(className);
      if (!classId) throw new Error(`Could not resolve imported drug class "${className}".`);

      const { rowCount } = await client.query(
        `INSERT INTO drugs (name, brand_names, class_id)
         SELECT $1, ARRAY[]::TEXT[], $2
         WHERE NOT EXISTS (SELECT 1 FROM drugs WHERE LOWER(name) = LOWER($1))
         ON CONFLICT (name) DO NOTHING`,
        [ingredient.name, classId]
      );
      inserted += rowCount;
    }

    await client.query('COMMIT');
    console.log(`Imported ${inserted} RxNorm ingredients (${classNames.size} medication classes).`);
    console.log('RxNorm ingredient records do not include interaction or detailed mechanism data.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await importIngredients();
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('RxNorm import failed:', error);
  process.exitCode = 1;
});
