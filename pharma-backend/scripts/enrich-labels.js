import { pool } from '../src/db.js';
import { getDrugLabel } from '../src/lib/drug-labels.js';

async function enrichLabels() {
  try {
    const { rows: [schema] } = await pool.query(
      "SELECT to_regclass('drug_label_cache') IS NOT NULL AS cache_ready"
    );
    if (!schema.cache_ready) {
      throw new Error('Drug label cache is not initialized. Run npm run seed:expanded first.');
    }

    const { rows: drugs } = await pool.query('SELECT id, name FROM drugs ORDER BY name');
    let found = 0;
    let notFound = 0;
    const failures = [];

    console.log(`Checking public labels for ${drugs.length} drugs. This can take several minutes.`);
    for (let index = 0; index < drugs.length; index++) {
      const drug = drugs[index];
      try {
        const label = await getDrugLabel(drug.id);
        if (label?.found) found++;
        else notFound++;
      } catch (error) {
        failures.push({ name: drug.name, message: error.message });
        console.error(`Could not load a label for ${drug.name}: ${error.message}`);
      }

      if ((index + 1) % 25 === 0 || index + 1 === drugs.length) {
        console.log(`Checked ${index + 1}/${drugs.length} drugs.`);
      }
    }

    console.log(`Label enrichment finished: ${found} found, ${notFound} without a match, ${failures.length} failed.`);
    if (failures.length > 0) process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

enrichLabels().catch((error) => {
  console.error('Drug label enrichment failed:', error);
  process.exitCode = 1;
});
