# Migrate screen-scribe-pilot from n8n to a CrewAI FastAPI service

## Context

The frontend (Vite + React + TS, deployed on Vercel) currently calls **8 hardcoded n8n webhook URLs** scattered across 6 page components. These webhooks orchestrate LLM workflows (assignment generation, quiz generation, notes generation, script analysis, mentor chat, submission evaluation). The goal is **total removal of n8n** by:

1. Replacing the workflows with a Python **CrewAI** service exposed via **FastAPI**, hosted on **Railway**.
2. Replacing the raw `fetch(<n8n url>, …)` calls with a single typed client (`src/lib/agentApi.ts`) hitting the new service.
3. Wiring **Supabase JWT auth** and **CORS** so the Vercel frontend can call Railway directly.
4. Cutting the n8n URLs once each crew is verified.

After migration: no n8n dependency, all prompts/agents live in versioned Python code, and long-running flows use a job-poll pattern (already the shape of the script analyzer).

---

## Inventory of n8n call sites (the contract to preserve)

| # | File | Workflow | Payload | Response shape consumed | Pattern |
|---|---|---|---|---|---|
| 1 | `src/pages/ScriptAnalyzer.tsx` (L173-222) | Script analysis | `{ Type, file_url }` | `{ jobId }` then poll `/status/{jobId}` → `{ status, result }`; final `result` is structured analysis | **Async / poll** every 3s up to 20 attempts |
| 2 | `src/pages/StudentAssignments.tsx` (L61, L898-914) | Submission evaluation | `{ criteria, subtopic, file_url }` | `{ output: <markdown rubric/feedback>, threadId }` parsed by `parseAIFeedback()` (L105-…) | Sync await |
| 3 | `src/pages/CreateAssignment.tsx` (L413) | Generate assignment | `{ subtopic }` | `{ output \| content \| answer }` | Sync await |
| 4 | `src/pages/CreateAssignment.tsx` (L404) | Revise assignment | `{ content, subtopic, changes }` | same as #3 | Sync await |
| 5 | `src/pages/CreateNotes.tsx` (L711) | Generate notes (markdown) | `{ subtopic }` | `{ output \| content \| notes }` markdown | Sync await |
| 6 | `src/pages/CreateQuiz.tsx` (L501) | Generate quiz | `{ subtopic }` | `{ output: JSON-string with all_questions[] }` | Sync await |
| 7 | `src/pages/AIMentorNew.tsx` (L114-124, L1400-1426) | Mentor chat | `{ chatInput }` | `{ output }` text | Sync await |
| 8 | `src/pages/AIMentorNew.tsx` (L125-134, L1429-1547) | Quiz-in-mentor | `{ chatInput }` | `{ output }` array OR `{ all_questions }` OR JSON string | Sync await |

**The new service must match these payload + response shapes exactly** so frontend parsing logic (e.g. `parseAIFeedback`, the multi-shape quiz parser at AIMentorNew L1461-1543) keeps working unchanged.

---

## New backend: `screen-scribe-agents` (Python / FastAPI / CrewAI)

### Repo layout

```
screen-scribe-agents/
├── app/
│   ├── main.py                # FastAPI app, CORS, routers
│   ├── config.py              # pydantic-settings env
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.py
│   │   │   ├── assignments.py # POST /generate, /revise, /evaluate
│   │   │   ├── notes.py       # POST /generate
│   │   │   ├── quizzes.py     # POST /generate
│   │   │   ├── mentor.py      # POST /chat, /quiz
│   │   │   ├── scripts.py     # POST /analyze, GET /analyze/status/{jobId}
│   │   │   └── jobs.py
│   │   └── schemas.py
│   ├── crews/
│   │   ├── assignment_crew/   (crew.py + agents.yaml + tasks.yaml)
│   │   ├── notes_crew/
│   │   ├── quiz_crew/
│   │   ├── mentor_crew/
│   │   ├── script_crew/
│   │   └── evaluator_crew/
│   ├── tools/                 # @tool wrappers (Supabase fetch, file download, …)
│   ├── services/              # supabase_client, storage
│   ├── workers/               # celery_app + tasks (for long jobs)
│   └── core/auth.py           # verify Supabase JWT
├── Procfile                   # web: uvicorn …  worker: celery …
├── pyproject.toml
└── .env.example
```

### Endpoints (designed to mirror the n8n contract 1:1)

| New endpoint | Replaces n8n call # | Body | Returns |
|---|---|---|---|
| `POST /api/assignments/generate` | 3 | `{ subtopic }` | `{ output }` |
| `POST /api/assignments/revise` | 4 | `{ content, subtopic, changes }` | `{ output }` |
| `POST /api/assignments/evaluate` | 2 | `{ criteria, subtopic, file_url }` | `{ output, threadId }` |
| `POST /api/notes/generate` | 5 | `{ subtopic }` | `{ output }` |
| `POST /api/quizzes/generate` | 6 | `{ subtopic }` | `{ output: "<json string with all_questions>" }` |
| `POST /api/mentor/chat` | 7 | `{ chatInput, sessionId? }` | `{ output }` |
| `POST /api/mentor/quiz` | 8 | `{ chatInput }` | `{ output }` (matches existing multi-shape parser) |
| `POST /api/scripts/analyze` | 1 | `{ Type, file_url }` | `{ jobId }` |
| `GET /api/scripts/analyze/status/{jobId}` | 1 | – | `{ status: pending\|running\|completed\|error, result?, error? }` |

Long crew runs (script analysis, evaluation) enqueue to Celery + Redis; short ones (subtopic-only generation) run inline. Auth = Supabase JWT verified using `SUPABASE_JWT_SECRET`. CORS allows `https://*.vercel.app` + the prod domain + `http://localhost:8080` (Vite dev port from `vite.config.ts`).

### Hosting on Railway
- Two services in one project: `web` (uvicorn) + `worker` (celery) + Redis add-on.
- Env: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET`, `REDIS_URL`, `ALLOWED_ORIGINS`.

---

## Frontend changes (screen-scribe-pilot)

### 1. New shared client — `src/lib/agentApi.ts` (NEW file)

Centralizes base URL, auth header injection (Supabase JWT via `supabase.auth.getSession()` — already used in `src/hooks/useAuth.tsx:98`), and error toasts (use existing `sonner` via `src/hooks/use-toast.ts`).

Exports:
- `generateAssignment({ subtopic })`
- `reviseAssignment({ content, subtopic, changes })`
- `evaluateSubmission({ criteria, subtopic, file_url })`
- `generateNotes({ subtopic })`
- `generateQuiz({ subtopic })`
- `mentorChat({ chatInput, sessionId? })`
- `mentorQuiz({ chatInput })`
- `startScriptAnalysis({ Type, file_url })` → `{ jobId }`
- `pollScriptAnalysis(jobId)` (encapsulates the 20-attempt × 3s loop currently inline in `ScriptAnalyzer.tsx:173-191`)

Each function returns the same shape the calling page already expects (`{ output }` etc.) so per-page diffs stay tiny.

### 2. New env var

Add `VITE_AGENT_API_URL` to:
- `.env.local` (dev → `http://localhost:8000`)
- Vercel project env (prod → `https://<railway-host>`)

This is the project's first `VITE_*` var (the infra audit confirmed none exist today), so also add `.env.example` and document in README.

### 3. Per-file edits — pure URL/import swap, no logic changes

| File | Change |
|---|---|
| `src/pages/ScriptAnalyzer.tsx` | Delete `N8N_SCRIPT_ANALYZER_ENDPOINT` (L51-ish); replace `triggerScriptAnalysis` body to call `startScriptAnalysis` + `pollScriptAnalysis` from `agentApi.ts`. Remove inline `pollN8nJobResult` (L173-191) — moved to client. |
| `src/pages/StudentAssignments.tsx` | Delete `N8N_ASSIGNMENT_EVALUATOR_ENDPOINT` (L61); replace `callN8nAgent` (L898-914) with `evaluateSubmission`. **Do NOT touch `parseAIFeedback`** — backend returns the same `{ output }` markdown shape it already parses. |
| `src/pages/CreateAssignment.tsx` | Replace the two `fetch` calls in `callAssignmentAgent` (L404, L413) with `generateAssignment` / `reviseAssignment`. |
| `src/pages/CreateNotes.tsx` | Replace `fetch` at L711 with `generateNotes`. |
| `src/pages/CreateQuiz.tsx` | Replace `fetch` at L501 with `generateQuiz`. Quiz parser (L499-587) stays. |
| `src/pages/AIMentorNew.tsx` | Delete `AI_MENTOR_AGENT_CONFIG` (L114-135). Replace `callMentorAgent` (L1414) with `mentorChat`; replace `callQuizGenerationTool` (L1444) with `mentorQuiz`. The multi-shape parser (L1461-1543) is preserved. |

No other files in `src/` reference n8n — confirmed by grep across the whole tree.

### 4. Optional: introduce React Query

`QueryClient` is already provided in `App.tsx:42` but unused. Wrapping the new client functions in `useMutation` is a nice-to-have (auto-loading states, retries) but **not part of the migration**; current per-page `useState` loading flags keep working.

---

## Phased execution

The 8 endpoints are independent — migrate one at a time and verify before moving on.

1. **Set up the new repo** (`screen-scribe-agents`), deploy a `/health` endpoint to Railway, configure CORS, confirm a curl from the laptop and a `fetch` from a Vercel preview both return 200.
2. **Frontend scaffolding**: add `VITE_AGENT_API_URL`, create `src/lib/agentApi.ts` with just `health()` first, prove end-to-end auth round-trip.
3. **Migrate the simplest crews first** (single `subtopic` in, text out): notes → assignment generate → assignment revise → quiz. Each one = build the crew in Python, expose the route, swap the page's `fetch`, manually test the page.
4. **Mentor chat + mentor quiz** next; preserve session/thread continuity if needed (use `sessionId`).
5. **Submission evaluation** (`/api/assignments/evaluate`) — this returns the rich rubric markdown that the existing parser depends on; pin the prompt so output format matches what `parseAIFeedback` expects.
6. **Script analyzer** last (job + poll + worker) — most operationally complex; keep the current 20×3s polling cadence in the client so behaviour is identical.
7. **Cut n8n**: once all 8 are live for a few days, delete the n8n constants, and disable/delete the n8n workflows on the vendor side.

---

## Critical files to modify (frontend only — backend is a new repo)

- `src/pages/ScriptAnalyzer.tsx` — L51, L173-222
- `src/pages/StudentAssignments.tsx` — L61, L898-914 (leave parser at L105-… alone)
- `src/pages/CreateAssignment.tsx` — L404, L413, surrounding `callAssignmentAgent`
- `src/pages/CreateNotes.tsx` — L711
- `src/pages/CreateQuiz.tsx` — L501
- `src/pages/AIMentorNew.tsx` — L114-135, L1414, L1444
- `src/lib/agentApi.ts` — NEW
- `.env.example`, `.env.local` — add `VITE_AGENT_API_URL`
- `vercel.json` — no change (SPA rewrite is fine; no proxying needed)

Reuse existing utilities (do not re-create):
- `supabase` client — `src/integrations/supabase/client.ts`
- Auth/session — `src/hooks/useAuth.tsx`
- Toast — `src/hooks/use-toast.ts` (sonner)
- Supabase storage upload helper — already in `ScriptAnalyzer.tsx:224-…` (`uploadFileToSupabase`)

---

## Verification

For each endpoint, after wiring:

1. `npm run dev` (Vite on port 8080) and exercise the affected page end-to-end:
   - **Notes**: open `/teacher/create-notes`, generate notes for a known subtopic, confirm the rendered markdown matches output from the old n8n call.
   - **Assignment generate/revise**: `/teacher/create-assignment` — generate, then request a revision; verify both calls return content and that revision actually changes the prior content.
   - **Quiz**: `/teacher/create-quiz` — generate; verify the parsed `all_questions` array renders correctly (4 options each, correct answer present).
   - **Mentor**: `/ai-mentor` — multi-turn chat for both Semester 1 and Semester 2 selectors; trigger an in-mentor quiz and verify the multi-shape parser still works.
   - **Submission evaluation**: `/student/assignments` — submit a sample file, confirm rubric markdown parses into the existing UI structure (Score, Overall Grade, Strengths, Areas for Improvement).
   - **Script analyzer**: `/script-analyzer` — upload PDF/DOCX, watch poll loop tick to completion; confirm result renders.
2. Network tab confirms `https://<railway-host>/api/...` is hit and `vijiteshnaik.app.n8n.cloud` is **never** hit.
3. Backend: `pytest` covers each route with a mocked LLM and a smoke test of one real crew run per crew.
4. Final regression: a fresh Vercel preview deploy with `VITE_AGENT_API_URL` set; click through each of the 6 affected pages.
5. Final cleanup pass: `grep -ri "n8n\|vijiteshnaik" src/` returns zero matches before merging.
