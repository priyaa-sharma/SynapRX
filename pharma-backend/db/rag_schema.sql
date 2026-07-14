CREATE TABLE IF NOT EXISTS documents (
    id          SERIAL PRIMARY KEY,
    drug_id     INTEGER REFERENCES drugs(id) ON DELETE CASCADE,
    category    TEXT NOT NULL,   
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,
    source      TEXT,
    embedding   DOUBLE PRECISION[],
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_drug ON documents(drug_id);

CREATE TABLE IF NOT EXISTS rag_vocabulary (
    id      INTEGER PRIMARY KEY DEFAULT 1,
    terms   JSONB NOT NULL, 
    idf     JSONB NOT NULL,   
    CONSTRAINT single_row CHECK (id = 1)
);
