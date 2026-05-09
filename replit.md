# Lenny's Board of Directors

A Streamlit app that assembles a personalized advisory board from Lenny Rachitsky's podcast guests using RAG and LLMs.

## Run & Operate

- `Start application` workflow — runs the Streamlit app on port 5000
- `cd artifacts/lennys-board && python ingest.py` — one-time data ingestion (run from shell after setting up Supabase)
- Required env secrets: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`

## Stack

- Python 3.11, Streamlit
- OpenAI (gpt-4o-mini for board responses, gpt-4o for synthesis, text-embedding-3-small for embeddings)
- Supabase (PostgreSQL + pgvector for RAG retrieval)
- pnpm workspaces, Node.js 24, TypeScript 5.9 (pre-existing API server)

## Where things live

- `artifacts/lennys-board/app.py` — Streamlit UI, zero business logic
- `artifacts/lennys-board/board.py` — board assembly (RAG retrieval + LLM calls)
- `artifacts/lennys-board/ingest.py` — standalone ingestion script, run once
- `artifacts/lennys-board/config.py` — all editable settings: models, roles, guest titles
- `artifacts/lennys-board/.streamlit/config.toml` — Streamlit server config

## Architecture decisions

- Contract-first RAG: analyze problem → generate search queries → embed → match via Supabase `match_chunks` RPC → select board members → parallel LLM calls
- All 5 board member responses run in parallel via `ThreadPoolExecutor(max_workers=5)` for speed
- Token cost logging via `st.session_state["call_log"]` — visible in Session Stats expander
- Config fully centralized in `config.py` — swap models with one line

## Supabase Setup

Before running `ingest.py`, create the `lenny_chunks` table and `match_chunks` RPC in Supabase SQL editor:

```sql
create extension if not exists vector;

create table if not exists lenny_chunks (
  id bigserial primary key,
  content text,
  embedding vector(1536),
  guest_name text,
  title text,
  type text,
  date text,
  description text
);

create or replace function match_chunks(
  query_embedding vector(1536),
  match_count int default 10
)
returns table (
  id bigint,
  content text,
  guest_name text,
  title text,
  date text,
  description text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    lenny_chunks.id,
    lenny_chunks.content,
    lenny_chunks.guest_name,
    lenny_chunks.title,
    lenny_chunks.date,
    lenny_chunks.description,
    1 - (lenny_chunks.embedding <=> query_embedding) as similarity
  from lenny_chunks
  order by lenny_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

## Product

1. User describes a product problem in a text area (or picks an example chip)
2. Problem is analyzed to produce semantic search queries
3. Relevant podcast content is retrieved from Supabase via pgvector similarity search
4. 5 board members are selected from matching guests and assigned roles (Challenger, Operator, Visionary, User Advocate, Data Oracle)
5. All 5 board perspectives are generated in parallel
6. A debate between the two most philosophically opposed members is generated
7. A synthesis (agreement / open question / next move) is produced
8. Sources, session cost, and token stats are shown in collapsible expanders

## User preferences

- One file, one job — keep code clean and separated by concern
- All configurable settings in config.py only

## Gotchas

- Run `python ingest.py` from `artifacts/lennys-board/` directory, not the root
- Supabase `match_chunks` RPC must exist before the app can retrieve content
- Streamlit is at `/home/runner/workspace/.pythonlibs/bin/streamlit` (not on global PATH)
- `enableCORS = false` and `enableXsrfProtection = false` required in .streamlit/config.toml for Replit proxy

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
