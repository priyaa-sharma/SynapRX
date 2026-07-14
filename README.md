# PharmaLens

A full-stack pharmacology reference platform. Explore drug mechanisms, interaction risk, CYP450 metabolism, and history, with a RAG-powered Q&A assistant grounded in the underlying data.

## Features

- **Drug reference** — searchable list of drugs, filterable by class, with a detail page per drug covering mechanism, interactions, metabolism, and history
- **Interaction explorer** — an interactive graph centered on a chosen drug, showing everything it interacts with, color-coded by risk severity
- **CYP450 metabolism dashboard** — a table of which drugs share liver enzyme pathways, with auto-flagged inhibitor/substrate overlap risks computed directly from the data
- **History timeline** — chronological view of drug discovery and development milestones
- **Ask** — a conversational assistant with a custom-built RAG pipeline: TF-IDF retrieval over generated documents grounds pharmacology answers in real data, while general questions are handled conversationally via an LLM (Groq/Llama 3.3)

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Retrieval | Custom TF-IDF vectorizer (no external embeddings API) |
| LLM | Groq API (Llama 3.3 70B) |
| Data sources | Hand-curated seed set + RxClass (NIH) and OpenFDA public APIs |

## Architecture

```
pharmalens/
  pharma-backend/     Express API + Postgres schema, seed data, RAG pipeline
  pharma-frontend/    React app (Vite)
```

The backend exposes a REST API (`/api/drugs`, `/api/interactions`, `/api/metabolism`, `/api/history`, `/api/ask`, etc.) backed by a relational schema modeling drugs, mechanisms, CYP450 metabolism, pairwise interactions, and history events. Two SQL views (`interactions_symmetric`, `cyp450_overlap_risks`) do relational heavy lifting. E.g. auto-flagging drug pairs where one strongly inhibits an enzyme the other depends on.

The RAG pipeline chunks the structured drug data (and, optionally, real OpenFDA label text) into retrievable documents, computes TF-IDF vectors for each, and ranks them by cosine similarity against incoming questions — then optionally synthesizes a natural-language answer via an LLM using only the retrieved context.

## Setup

### 1. Database

```bash
createdb pharmalens
cd pharma-backend
psql -d pharmalens -f db/schema.sql
psql -d pharmalens -f db/seed.sql
psql -d pharmalens -f db/rag_schema.sql
```

### 2. Backend

```bash
cd pharma-backend
npm install
cp .env.example .env   # fill in DATABASE_URL and (optionally) GROQ_API_KEY
npm run ingest          # build the RAG index
npm run dev              # runs on http://localhost:4000
```

Optionally, grow the drug database from real public APIs (RxClass + OpenFDA):
```bash
npm run ingest:openfda
npm run ingest   # rebuild the RAG index with the new data
```

### 3. Frontend

```bash
cd pharma-frontend
npm install
npm run dev   # runs on http://localhost:5173
```

## Notes

- `GROQ_API_KEY` is optional — without it, Ask still returns grounded answers from retrieved data, just without LLM synthesis.
- This is an educational reference tool, not a source of medical advice.
