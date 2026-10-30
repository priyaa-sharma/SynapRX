import { pool } from '../db.js';

const OPENFDA_LABELS_URL = 'https://api.fda.gov/drug/label.json';
const DAILYMED_SERVICES_URL = 'https://dailymed.nlm.nih.gov/dailymed/services/v2';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_SECTION_LENGTH = 12000;
const MIN_REQUEST_INTERVAL_MS = 300;
const MAX_REQUEST_ATTEMPTS = 4;
let lastRequestAt = 0;

const labelSections = [
  ['description', 'Description'],
  ['active_ingredient', 'Active ingredients'],
  ['indications_and_usage', 'Indications and usage'],
  ['purpose', 'Purpose'],
  ['mechanism_of_action', 'Mechanism of action'],
  ['pharmacodynamics', 'Pharmacodynamics'],
  ['metabolism', 'Metabolism'],
  ['pharmacokinetics', 'Pharmacokinetics'],
  ['clinical_pharmacology', 'Clinical pharmacology'],
  ['elimination', 'Elimination'],
  ['dosage_and_administration', 'Dosage and administration'],
  ['contraindications', 'Contraindications'],
  ['boxed_warning', 'Boxed warning'],
  ['warnings_and_cautions', 'Warnings and precautions'],
  ['warnings', 'Warnings'],
  ['do_not_use', 'Do not use'],
  ['ask_doctor', 'Ask a doctor before use'],
  ['stop_use', 'Stop use'],
  ['uses', 'Uses'],
  ['drug_interactions', 'Drug interactions'],
  ['adverse_reactions', 'Adverse reactions'],
  ['use_in_specific_populations', 'Use in specific populations'],
  ['pregnancy', 'Pregnancy'],
  ['lactation', 'Lactation'],
  ['overdosage', 'Overdosage'],
  ['clinical_studies', 'Clinical studies'],
  ['patient_information', 'Patient information'],
];

function toText(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string').join('\n\n').trim();
  return typeof value === 'string' ? value.trim() : '';
}

function toLabelSections(record) {
  return labelSections.flatMap(([key, title]) => {
    const fullText = toText(record[key]);
    if (!fullText) return [];

    return [{
      key,
      title,
      content: fullText.slice(0, MAX_SECTION_LENGTH),
      truncated: fullText.length > MAX_SECTION_LENGTH,
    }];
  });
}

function quoteOpenFdaValue(value) {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

async function fetchJson(url) {
  for (let attempt = 1; attempt <= MAX_REQUEST_ATTEMPTS; attempt++) {
    const wait = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequestAt = Date.now();

    let response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (response.ok) return await response.json();

      const error = new Error(`Public drug information service returned HTTP ${response.status}.`);
      error.status = response.status;
      if (response.status !== 429 && response.status < 500) throw error;
      if (attempt === MAX_REQUEST_ATTEMPTS) throw error;

      const retryAfter = response.headers.get('retry-after');
      const retryAfterMs = retryAfter
        ? Math.max(0, Number(retryAfter) * 1000 || Date.parse(retryAfter) - Date.now())
        : 0;
      const backoffMs = 1000 * 2 ** (attempt - 1);
      const delayMs = Math.min(30000, Math.max(retryAfterMs, backoffMs));
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (error) {
      if (error.status && error.status !== 429 && error.status < 500) throw error;
      if (attempt === MAX_REQUEST_ATTEMPTS) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
    }
  }

  throw new Error('Public drug information service request failed after retries.');
}

async function fetchFdaLabel(drug) {
  const searchNames = [drug.name, ...(drug.brand_names || [])].filter(Boolean);

  for (const searchName of searchNames) {
    const url = new URL(OPENFDA_LABELS_URL);
    url.searchParams.set(
      'search',
      `openfda.generic_name:${quoteOpenFdaValue(searchName)} OR openfda.brand_name:${quoteOpenFdaValue(searchName)}`
    );
    url.searchParams.set('limit', '10');
    url.searchParams.set('sort', 'effective_time:desc');

    let response;
    try {
      response = await fetchJson(url);
    } catch (error) {
      if (error.status === 404) continue;
      throw error;
    }

    const record = response.results?.find((candidate) => {
      const genericNames = (candidate.openfda?.generic_name || []).map((name) => name.toLowerCase());
      const brandNames = (candidate.openfda?.brand_name || []).map((name) => name.toLowerCase());
      const requestedName = searchName.toLowerCase();
      const requestedIsCombination = /[/+]|\s+and\s+/i.test(drug.name);
      const isCombinationLabel = genericNames.some((name) => /\s+and\s+|[/+]/i.test(name));

      if (requestedIsCombination !== isCombinationLabel) return false;
      return genericNames.includes(requestedName)
        || brandNames.includes(requestedName)
        || genericNames.some((name) => name.startsWith(`${requestedName} `));
    });
    if (!record) continue;

    const setId = record.openfda?.spl_set_id?.[0] || null;
    const sections = toLabelSections(record);

    return {
      found: true,
      source: 'openFDA drug labeling',
      sourceUrl: setId
        ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${encodeURIComponent(setId)}`
        : 'https://open.fda.gov/apis/drug/label/',
      effectiveDate: record.effective_time?.[0] || null,
      productName: record.openfda?.brand_name?.[0] || record.openfda?.generic_name?.[0] || searchName,
      manufacturer: record.openfda?.manufacturer_name?.[0] || null,
      route: record.openfda?.route?.[0] || null,
      setId,
      sections,
      labelHistory: [],
      historySource: null,
      historyError: null,
    };
  }

  return {
    found: false,
    source: 'openFDA drug labeling',
    sourceUrl: 'https://open.fda.gov/apis/drug/label/',
    effectiveDate: null,
    productName: null,
    manufacturer: null,
    route: null,
    setId: null,
    sections: [],
    labelHistory: [],
    historySource: null,
    historyError: null,
  };
}

async function attachDailyMedHistory(label) {
  if (!label.setId) {
    label.historyError = 'This label does not include a DailyMed identifier, so label revision history is unavailable.';
    return label;
  }

  const url = `${DAILYMED_SERVICES_URL}/spls/${encodeURIComponent(label.setId)}/history.json`;
  try {
    const firstPageUrl = new URL(url);
    firstPageUrl.searchParams.set('pagesize', '100');
    firstPageUrl.searchParams.set('page', '1');
    const firstPage = await fetchJson(firstPageUrl);
    const history = firstPage.data?.history;
    if (!Array.isArray(history)) {
      label.historyError = 'DailyMed did not return label revision history for this product.';
      return label;
    }

    const totalPages = Number(firstPage.metadata?.total_pages) || 1;
    for (let page = 2; page <= totalPages; page++) {
      const pageUrl = new URL(url);
      pageUrl.searchParams.set('pagesize', '100');
      pageUrl.searchParams.set('page', String(page));
      const nextPage = await fetchJson(pageUrl);
      if (Array.isArray(nextPage.data?.history)) history.push(...nextPage.data.history);
    }

    label.labelHistory = history.map((entry) => ({
      version: entry.spl_version,
      publishedDate: entry.published_date,
    }));
    label.historySource = firstPageUrl.toString();
  } catch (error) {
    label.historyError = `DailyMed label revision history could not be loaded: ${error.message}`;
  }
  return label;
}

export async function getDrugLabel(drugId) {
  const { rows } = await pool.query(
    `SELECT d.id, d.name, d.brand_names, c.label_data, c.fetched_at
     FROM drugs d
     LEFT JOIN drug_label_cache c ON c.drug_id = d.id
     WHERE d.id = $1`,
    [drugId]
  );
  const row = rows[0];
  if (!row) return null;

  const cachedAt = row.fetched_at;
  const isFresh = cachedAt && Date.now() - new Date(cachedAt).getTime() < CACHE_TTL_MS;
  if (isFresh) return { ...row.label_data, cachedAt, stale: false };

  try {
    let label = await fetchFdaLabel(row);
    if (label.found) label = await attachDailyMedHistory(label);

    const { rows: cacheRows } = await pool.query(
      `INSERT INTO drug_label_cache (drug_id, label_data, fetched_at)
       VALUES ($1, $2, now())
       ON CONFLICT (drug_id)
       DO UPDATE SET label_data = EXCLUDED.label_data,
                     fetched_at = now()
       RETURNING fetched_at`,
      [row.id, label]
    );
    return { ...label, cachedAt: cacheRows[0].fetched_at, stale: false };
  } catch (error) {
    if (row.label_data) {
      return {
        ...row.label_data,
        cachedAt,
        stale: true,
        refreshError: error.message,
      };
    }
    throw error;
  }
}
