CREATE TABLE drug_classes (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,       
    full_name   TEXT NOT NULL,              
    description TEXT
);

CREATE TABLE drugs (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,       
    brand_names     TEXT[],                     
    class_id        INTEGER NOT NULL REFERENCES drug_classes(id),
    approval_year   INTEGER,
    half_life_hours NUMERIC,                    
    route           TEXT,                       
    created_at      TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE mechanisms (
    id          SERIAL PRIMARY KEY,
    drug_id     INTEGER NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
    target      TEXT NOT NULL,      
    action      TEXT NOT NULL,      
    is_primary  BOOLEAN DEFAULT true,
    notes       TEXT
);


CREATE TABLE metabolism (
    id          SERIAL PRIMARY KEY,
    drug_id     INTEGER NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
    enzyme      TEXT NOT NULL,      
    role        TEXT NOT NULL CHECK (role IN ('substrate', 'inhibitor', 'inducer')),
    strength    TEXT CHECK (strength IN ('weak', 'moderate', 'strong')),
    notes       TEXT
);


CREATE TABLE interactions (
    id              SERIAL PRIMARY KEY,
    drug_a_id       INTEGER NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
    drug_b_id       INTEGER NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
    risk_level      TEXT NOT NULL CHECK (risk_level IN ('contraindicated', 'caution', 'minor')),
    risk_label      TEXT NOT NULL,      
    mechanism_note  TEXT,               
    source          TEXT,               
    CHECK (drug_a_id <> drug_b_id)
);


CREATE TABLE history_events (
    id          SERIAL PRIMARY KEY,
    drug_id     INTEGER REFERENCES drugs(id) ON DELETE CASCADE,   
    class_id    INTEGER REFERENCES drug_classes(id) ON DELETE CASCADE, 
    year_label  TEXT NOT NULL,      
    sort_year   INTEGER NOT NULL,   
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    CHECK (drug_id IS NOT NULL OR class_id IS NOT NULL)
);


CREATE INDEX idx_drugs_class ON drugs(class_id);
CREATE INDEX idx_mechanisms_drug ON mechanisms(drug_id);
CREATE INDEX idx_metabolism_drug ON metabolism(drug_id);
CREATE INDEX idx_metabolism_enzyme ON metabolism(enzyme);
CREATE INDEX idx_interactions_a ON interactions(drug_a_id);
CREATE INDEX idx_interactions_b ON interactions(drug_b_id);
CREATE INDEX idx_history_sort_year ON history_events(sort_year);



CREATE VIEW interactions_symmetric AS
SELECT drug_a_id AS drug_id, drug_b_id AS other_drug_id, risk_level, risk_label, mechanism_note, source
FROM interactions
UNION ALL
SELECT drug_b_id AS drug_id, drug_a_id AS other_drug_id, risk_level, risk_label, mechanism_note, source
FROM interactions;



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
