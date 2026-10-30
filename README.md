# SYNAPRX

A full-stack pharmacology reference platform. Explore drug mechanisms, interaction risk, CYP450 metabolism, public FDA drug labeling, and a RAG-powered Q&A assistant grounded in the underlying data.

## Features

- **Drug reference** — searchable list of drugs, filterable by class, with individual profiles covering descriptions, label information, mechanisms, interactions, metabolism, and available history
- **Interaction explorer** — an interactive graph centered on a chosen drug, showing everything it interacts with, color-coded by risk severity
- **CYP450 metabolism dashboard** — a table of which drugs share liver enzyme pathways, with auto-flagged inhibitor/substrate overlap risks computed directly from the data
- **Ask** — a conversational assistant with a custom-built RAG pipeline: TF-IDF retrieval over generated documents grounds pharmacology answers in real data, while general questions are handled conversationally via an LLM (Groq/Llama 3.3)


## LIVE WORKING

https://github.com/user-attachments/assets/a2ff30dc-07e7-4c9c-9849-ff50d39bf1f3



## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Retrieval | Custom TF-IDF vectorizer (no external embeddings API) |
| LLM | Groq API (Llama 3.3 70B) |
| Data sources | Curated seed set + NIH RxNorm/RxClass, openFDA labels, and DailyMed label history |

## Architecture

```
pharmalens/
  pharma-backend/     Express API + Postgres schema, seed data, RAG pipeline
  pharma-frontend/    React app (Vite)
```

The backend exposes a REST API (`/api/drugs`, `/api/interactions`, `/api/metabolism`, `/api/ask`, etc.) backed by a relational schema modeling drugs, mechanisms, CYP450 metabolism, pairwise interactions, and history events. Drug profiles retrieve public openFDA label sections and DailyMed label-version history, then cache results in PostgreSQL for 30 days. Two SQL views (`interactions_symmetric`, `cyp450_overlap_risks`) do relational heavy lifting. E.g. auto-flagging drug pairs where one strongly inhibits an enzyme the other depends on.

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

`db/expanded_seed.sql` contains an idempotent catalog of 250 commonly used medicines and selected mechanism,
metabolism, interaction references, and the label cache table.

### 2. Backend

```bash
cd pharma-backend
npm install
cp .env.example .env   # fill in DATABASE_URL and (optionally) GROQ_API_KEY
npm run seed:expanded  # add the expanded catalog and label cache table
npm run ingest          # build the RAG index
npm run dev              # runs on http://localhost:4000
```

For an existing database, set `DATABASE_URL` to that database in `.env`, then run
`npm run seed:expanded`. This applies the additional seed and creates the cache table
without requiring `psql`.

The expanded seed can be rerun safely as the catalog grows. After adding medicines,
rerun `npm run enrich:labels` and `npm run enrich:pharmacology` to load label sections
and source-backed mechanisms for the new records, then run `npm run ingest` to rebuild
the Ask retrieval index. These enrichments do not invent structured interaction pairs
or CYP enzyme data from label prose.

Drug labels load when a profile is opened. To proactively cache labels for all drugs
in the database, run:

```bash
npm run enrich:labels
```

This may take several minutes. Some drug ingredients will not have a matching label;
the command reports unmatched records and API failures.

To add source-cited mechanism entries for drugs that do not already have curated
mechanisms, run:

```bash
npm run enrich:pharmacology
```

This uses an explicit FDA label mechanism section when available, otherwise NIH
RxClass mechanism-of-action classes. The interaction and metabolism tabs also show
label-sourced narrative when present. Narrative text is not converted into guessed
CYP enzyme records or drug-pair interaction graph edges, so some structured records
will remain unavailable.

Optionally, import the broader NIH RxNorm ingredient catalog and ATC class mappings:
```bash
npm run ingest:rxnorm
npm run ingest   # rebuild the RAG index with the new data
```

FDA/DailyMed excerpts and label revisions vary by product and do not provide a complete
drug-discovery or approval history. Historical milestones are shown only when they are
available in curated project data. Always consult a clinician and the current product
label for medical decisions.

The public catalog import is additive and can take several minutes. RxNorm includes
ingredient concepts that may not be currently marketed or FDA-approved; imported
entries have no interaction, mechanism, approval-year, or half-life details unless
those are added separately. Verify clinical details against current authoritative
prescribing information. This is an educational reference, not medical advice.

### 3. Frontend

```bash
cd pharma-frontend
npm install
npm run dev   # runs on http://localhost:5173
```

## Notes

- `GROQ_API_KEY` is optional — without it, Ask still returns grounded answers from retrieved data, just without LLM synthesis.
- This is an educational reference tool, not a source of medical advice.
