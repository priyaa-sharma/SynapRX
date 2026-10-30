import { pool } from '../src/db.js';

const RXNORM_API = 'https://rxnav.nlm.nih.gov/REST';
const RXCLASS_SOURCE = 'FDASPL';
const MIN_REQUEST_INTERVAL_MS = 300;
let lastRequestAt = 0;

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function fetchJson(url) {
  const wait = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();

  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`NIH RxNorm/RxClass returned HTTP ${response.status}.`);
  }
  return response.json();
}

async function getRxNormIngredient(name) {
  const lookup = new URL(`${RXNORM_API}/rxcui.json`);
  lookup.searchParams.set('name', name);
  lookup.searchParams.set('search', '2');
  const lookupResult = await fetchJson(lookup);
  const ids = lookupResult?.idGroup?.rxnormId || [];

  for (const id of ids) {
    const properties = await fetchJson(`${RXNORM_API}/rxcui/${encodeURIComponent(id)}/properties.json`);
    const ingredient = properties?.properties;
    if (ingredient?.tty === 'IN' && normalizeName(ingredient.name) === normalizeName(name)) {
      return ingredient;
    }
  }
  return null;
}

async function getRxClassMechanisms(rxcui) {
  const url = new URL(`${RXNORM_API}/rxclass/class/byRxcui.json`);
  url.searchParams.set('rxcui', rxcui);
  url.searchParams.set('relaSource', RXCLASS_SOURCE);
  const result = await fetchJson(url);
  const classes = result?.rxclassDrugInfoList?.rxclassDrugInfo || [];
  const unique = new Map();

  for (const entry of classes) {
    const item = entry.rxclassMinConceptItem;
    if (item?.classType === 'MOA' && item.classId && item.className) {
      unique.set(item.classId, item);
    }
  }
  return [...unique.values()];
}

async function enrichPharmacology() {
  const { rows: [schema] } = await pool.query(
    `SELECT to_regclass('drug_label_cache') IS NOT NULL AS cache_ready`
  );
  if (!schema.cache_ready) {
    throw new Error('Drug label cache is missing. Run npm run seed:expanded first.');
  }

  const { rows: drugs } = await pool.query(
    `SELECT d.id, d.name, c.label_data
     FROM drugs d
     LEFT JOIN drug_label_cache c ON c.drug_id = d.id
     ORDER BY d.name`
  );
  const { rows: existingMechanismRows } = await pool.query(
    'SELECT drug_id, target FROM mechanisms'
  );
  const drugsWithMechanisms = new Set(existingMechanismRows.map((row) => row.drug_id));
  const drugsWithLabelMechanisms = new Set(
    existingMechanismRows
      .filter((row) => row.target === 'FDA product-label mechanism')
      .map((row) => row.drug_id)
  );
  const pendingMechanisms = [];
  let mechanismMissing = 0;
  let metabolismLabels = 0;
  let interactionLabels = 0;
  const failures = [];

  for (let index = 0; index < drugs.length; index++) {
    const drug = drugs[index];
    const label = drug.label_data;
    if (label?.sections?.some((section) => ['metabolism', 'pharmacokinetics', 'clinical_pharmacology'].includes(section.key))) {
      metabolismLabels++;
    }
    if (label?.sections?.some((section) => section.key === 'drug_interactions')) {
      interactionLabels++;
    }

    const labelMechanism = label?.sections?.find((section) => section.key === 'mechanism_of_action');
    if (labelMechanism && !drugsWithLabelMechanisms.has(drug.id)) {
      const source = label.sourceUrl || 'https://open.fda.gov/apis/drug/label/';
      pendingMechanisms.push({
        drugId: drug.id,
        target: 'FDA product-label mechanism',
        action: labelMechanism.content,
        notes: `Source: ${label.source} (${label.productName || drug.name}); ${source}`,
      });
    } else if (!labelMechanism && !drugsWithMechanisms.has(drug.id)) {
      try {
        const ingredient = await getRxNormIngredient(drug.name);
        if (!ingredient) {
          mechanismMissing++;
        } else {
          const moaClasses = await getRxClassMechanisms(ingredient.rxcui);
          if (moaClasses.length === 0) {
            mechanismMissing++;
          } else {
            const source = `${RXNORM_API}/rxclass/class/byRxcui.json?rxcui=${encodeURIComponent(ingredient.rxcui)}&relaSource=${RXCLASS_SOURCE}`;
            for (const moa of moaClasses) {
              pendingMechanisms.push({
                drugId: drug.id,
                target: 'NIH RxClass MOA class',
                action: moa.className,
                notes: `Source: NIH RxClass (${moa.classId}); ${source}`,
              });
            }
          }
        }
      } catch (error) {
        failures.push({ name: drug.name, message: error.message });
        console.error(`Could not retrieve a sourced mechanism for ${drug.name}: ${error.message}`);
      }
    }

    if ((index + 1) % 25 === 0 || index + 1 === drugs.length) {
      console.log(`Checked ${index + 1}/${drugs.length} drugs.`);
    }
  }

  let labelMechanismsAdded = 0;
  let rxClassMechanismsAdded = 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const mechanism of pendingMechanisms) {
      const result = await client.query(
        `INSERT INTO mechanisms (drug_id, target, action, is_primary, notes)
         SELECT $1, $2, $3, false, $4
         WHERE NOT EXISTS (
           SELECT 1
           FROM mechanisms
           WHERE drug_id = $1 AND target = $2 AND action = $3
         )`,
        [mechanism.drugId, mechanism.target, mechanism.action, mechanism.notes]
      );
      if (result.rowCount > 0 && mechanism.target === 'FDA product-label mechanism') {
        labelMechanismsAdded++;
      } else if (result.rowCount > 0) {
        rxClassMechanismsAdded++;
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  console.log(`Added ${labelMechanismsAdded} mechanisms from FDA product labels.`);
  console.log(`Added ${rxClassMechanismsAdded} NIH RxClass mechanism classes.`);
  console.log(`${mechanismMissing} drugs had no matching sourced mechanism.`);
  console.log(`${metabolismLabels} drugs have label-based metabolism/pharmacology text.`);
  console.log(`${interactionLabels} drugs have label-based interaction text.`);
  console.log('Label text is not converted into CYP enzyme rows or interaction-graph pairs.');
  if (failures.length > 0) {
    console.error(`${failures.length} NIH source lookups failed; rerun the command to retry them.`);
    process.exitCode = 1;
  }
}

enrichPharmacology()
  .catch((error) => {
    console.error('Pharmacology enrichment failed:', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
