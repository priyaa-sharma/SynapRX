CREATE TABLE drug_classes (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,       -- e.g. 'SSRI', 'TCA', 'Opioid'
    full_name   TEXT NOT NULL,              -- e.g. 'Selective serotonin reuptake inhibitor'
    description TEXT
);

CREATE TABLE drugs (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,       -- generic name, e.g. 'Sertraline'
    brand_names     TEXT[],                     -- e.g. ARRAY['Zoloft']
    class_id        INTEGER NOT NULL REFERENCES drug_classes(id),
    approval_year   INTEGER,
    half_life_hours NUMERIC,                    -- approximate, for display only
    route           TEXT,                       -- e.g. 'Hepatic metabolism, renal excretion'
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Mechanism: which receptors/transporters a drug acts on
CREATE TABLE mechanisms (
    id          SERIAL PRIMARY KEY,
    drug_id     INTEGER NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
    target      TEXT NOT NULL,      -- e.g. 'SERT', 'mu-opioid receptor', 'GABA-A'
    action      TEXT NOT NULL,      -- e.g. 'Reuptake inhibition', 'Agonist'
    is_primary  BOOLEAN DEFAULT true,
    notes       TEXT
);

-- Metabolism: CYP450 enzyme relationships
CREATE TABLE metabolism (
    id          SERIAL PRIMARY KEY,
    drug_id     INTEGER NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
    enzyme      TEXT NOT NULL,      -- e.g. 'CYP2D6', 'CYP3A4'
    role        TEXT NOT NULL CHECK (role IN ('substrate', 'inhibitor', 'inducer')),
    strength    TEXT CHECK (strength IN ('weak', 'moderate', 'strong')),
    notes       TEXT
);

-- Interactions: pairwise risk between two drugs
CREATE TABLE interactions (
    id              SERIAL PRIMARY KEY,
    drug_a_id       INTEGER NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
    drug_b_id       INTEGER NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
    risk_level      TEXT NOT NULL CHECK (risk_level IN ('contraindicated', 'caution', 'minor')),
    risk_label      TEXT NOT NULL,      -- e.g. 'Serotonin syndrome risk'
    mechanism_note  TEXT,               -- plain-English "why" for the LLM to draw on
    source          TEXT,               -- e.g. 'OpenFDA label', 'DrugBank'
    CHECK (drug_a_id <> drug_b_id)
);

-- History: discovery / development milestones, either drug-specific or class-wide
CREATE TABLE history_events (
    id          SERIAL PRIMARY KEY,
    drug_id     INTEGER REFERENCES drugs(id) ON DELETE CASCADE,   -- nullable
    class_id    INTEGER REFERENCES drug_classes(id) ON DELETE CASCADE, -- nullable
    year_label  TEXT NOT NULL,      -- e.g. '1987' or '1950s'
    sort_year   INTEGER NOT NULL,   -- numeric year for ordering, e.g. 1987 or 1950
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    CHECK (drug_id IS NOT NULL OR class_id IS NOT NULL)
);

-- Helpful indexes
CREATE INDEX idx_drugs_class ON drugs(class_id);
CREATE INDEX idx_mechanisms_drug ON mechanisms(drug_id);
CREATE INDEX idx_metabolism_drug ON metabolism(drug_id);
CREATE INDEX idx_metabolism_enzyme ON metabolism(enzyme);
CREATE INDEX idx_interactions_a ON interactions(drug_a_id);
CREATE INDEX idx_interactions_b ON interactions(drug_b_id);
CREATE INDEX idx_history_sort_year ON history_events(sort_year);

-- Convenience view: symmetric interaction lookup
-- (query this instead of interactions directly to get both directions for free)
CREATE VIEW interactions_symmetric AS
SELECT drug_a_id AS drug_id, drug_b_id AS other_drug_id, risk_level, risk_label, mechanism_note, source
FROM interactions
UNION ALL
SELECT drug_b_id AS drug_id, drug_a_id AS other_drug_id, risk_level, risk_label, mechanism_note, source
FROM interactions;

-- Convenience view: CYP450 overlap finder
-- Flags drug pairs where one strongly inhibits an enzyme the other is a substrate of
CREATE VIEW cyp450_overlap_risks AS
SELECT
    m1.drug_id AS inhibitor_drug_id,
    d1.name AS inhibitor_name,
    m2.drug_id AS substrate_drug_id,
    d2.name AS substrate_name,
    m1.enzyme,
    m1.strength AS inhibitor_strength
FROM metabolism m1
JOIN metabolism m2 ON m1.enzyme = m2.enzyme AND m1.drug_id <> m2.drug_id
JOIN drugs d1 ON d1.id = m1.drug_id
JOIN drugs d2 ON d2.id = m2.drug_id
WHERE m1.role = 'inhibitor'
  AND m1.strength IN ('moderate', 'strong')
  AND m2.role = 'substrate';
