# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What This Project Is

**PsiCoach AI** is a Brazilian B2B SaaS clinical supervision platform for psychologists. Therapists describe clinical cases and receive structured AI analysis (hypothesis, approaches, interventions, risk alerts) personalized to their therapeutic approach and experience level. The AI uses Groq (Llama-3.3-70B), not the Anthropic API.

## Commands

```bash
npm run dev     # Start dev server on localhost:3000
npm run build   # Production build
npm run lint    # ESLint 9
```

No test suite is configured.

## Architecture

### Tech Stack
- **Framework:** Next.js App Router (TypeScript, `@/*` → `./src/*`)
- **UI:** React 19, Tailwind CSS v4, Lucide React
- **Backend/DB:** Supabase (PostgreSQL + Auth)
- **AI:** Groq SDK (`src/lib/groq.ts`) — `openai/gpt-oss-120b` for analysis, `whisper-large-v3` for audio transcription
- **Payments:** Stripe (`src/lib/stripe/`) — `startCheckout()` and `openCustomerPortal()` on client; webhook in `src/app/api/stripe/`
- **Error monitoring:** Sentry — configured in `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`; `next.config.ts` wraps with `withSentryConfig()`
- **Env vars required:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GROQ_API_KEY`, `SENTRY_AUTH_TOKEN`

### Route Groups
- `src/app/(app)/` — authenticated routes: `dashboard`, `nova-analise`, `historico/[id]`, `pacientes`, `configuracoes`
- `src/app/api/` — `analyze/route.ts`, `chat/route.ts`, `transcribe/route.ts`, `stripe/`
- `src/app/onboarding/` — three-step first-time setup (perfil → abordagem → tour)
- `src/app/auth/callback/` — Google OAuth redirect handler
- Public routes: `/`, `/login`, `/cadastro`, `/pricing`

> There is no `middleware.ts` and no `/admin` page (removed/not yet implemented).

### No Components Directory
There is **no `src/components/` directory**. All UI — modals, tabs, cards, forms — is written inline inside page files. Pages can be 500–1000+ lines. This is intentional; extraction is future work.

### Global State (`src/context/AppContext.tsx`)
Central React Context. Initialized once on mount via `supabase.auth.getSession()`. Full shape:

```typescript
{
  user: { name, email, crp, gender, yearsExperience, patientTypes[], specialties[],
          mainApproach, approachDescription, responseDetail: 'conciso'|'detalhado',
          onboardingCompleted },
  cases: ClinicalCase[],   // includes nested messages[]
  patients: Patient[],
  activePlan: 'free'|'starter'|'plus'|'pro'|'clinica',
  subscriptionStatus: string|null,
  currentPeriodEnd: string|null,
  analysesUsed: number,
  analysesLimit: number|null,
}
```

Key behaviors:
- `userIdRef` and `analysesUsedRef` are refs (not state) to prevent stale closures in async handlers.
- On logout, all state resets including `activePlan → 'free'`.
- `planCanAccess()` **currently always returns `true`** — plan gating is in test/demo mode, not yet enforced.
- Cases are fetched with `select('*, messages(*)')` and sorted by `created_at`.

### Data Model Relationships
```
profiles (1) ─── (1) subscriptions
profiles (1) ─── (N) patients
patients  (1) ─── (N) sessions        ← created in /api/analyze, not in pacientes page
patients  (1) ─── (1) patient_memory  ← stores confirmed/discarded hypotheses, attention_history[]
cases     (1) ─── (N) messages
cases     (N) ─── (1) patients        ← optional patient_id link
```

There is **no delete-cascade**: deleting a patient leaves orphan sessions and cases.

### Core Analysis Flow
```
nova-analise page → POST /api/analyze
  1. Auth via Bearer token (Authorization header — session cookies NOT used server-side)
  2. Subscription check: hasAccess + analysesLimit not exceeded
  3. If patient_id: parallel fetch of patient + patient_memory + sessions
  4. Build PatientMemoryContext (weeks_in_therapy, confirmed/discarded hypotheses, etc.)
  5. Groq call: openai/gpt-oss-120b, temp=0.35, reasoning=medium, strict JSON schema
  6. Two-phase JSON parse: try direct → on failure, call Groq again at temp=0.1 for repair
  7. Increment analyses_used in subscriptions table
  8. If patient_id: create session record + append attention_history in patient_memory
  9. Return { analysis, analysesUsed, session_id }
  → Frontend calls addCase() to save the case to Supabase and update AppContext
```

The API does **not** save the case — the frontend is responsible for calling `addCase()`.

### Nova-Análise Form
Two input modes: `standard` (text) and `audio` (Whisper transcription via `/api/transcribe`).

Fields sent to `/api/analyze`:
- `input_text` — clinical narrative (min 10 chars)
- `approach` — one of 6 fixed orientations: TCC, Psicanálise, Humanista, Sistêmica, Gestalt, Junguiana
- `context` — `{ sessions_count, current_diagnosis, already_tried, specific_question }`
- `patient_id` (optional) — triggers patient memory injection into the prompt

If patients exist, a **choice modal** appears asking between "quick analysis" and "patient-linked analysis". The page conditionally renders 4 info cards (resumo, atenção, foco, pergunta) as a first-phase response before the full JSON analysis arrives.

Tab access in the results modal is plan-gated in the UI (though `planCanAccess()` currently ignores plan level):
- `risco` tab → Plus plan
- `prontuario` tab → Plus plan
- `referencias` tab → Pro plan

### Groq Prompt Engineering (`src/lib/groq.ts`)
The system prompt:
- Frames AI as "senior clinical supervisor" with 20 years experience
- **Critical rule baked in:** "Never repeat what the therapist already wrote"
- Risk rule: ANY mention of death/suicide/self-harm → `nivel_atencao='alto'`, even if negated
- Reference rule: "Only cite real authors — invented references are unacceptable"
- Markdown rule: Only `**bold**` inline; no lists or headers inside string values

JSON response schema has 15 required fields. Normalization on parse:
- `nivel_atencao`: accepts `'alta'/'alto'`, `'moderada'/'moderado'`, etc.
- Array fields: if a string is returned instead of array, wraps it: `"text" → ["text"]`
- Fallback field aliases: `hypothesis←hipotese_central`, `approaches←plano_imediato`, `questions←perguntas_clinicas`

### Chat API (`/api/chat`)
Auto-detects intent: messages ≥80 chars containing clinical keywords trigger a full structured analysis (`max_tokens=2048`) and return `{ analysis: CaseAnalysis }`; shorter messages return free-text `{ reply: string }` (`max_tokens=512`, `temp=0.65`). Uses last 10 messages as context window.

### Clinical Knowledge Base (`src/lib/knowledge/`)
Seven modules: `approaches.ts`, `diagnostics.ts`, `techniques.ts`, `ethics.ts`, `saude_mental_ab.ts`, `raps_sus.ts`, `retriever.ts`.

`retriever.ts` maps 200+ clinical keywords to knowledge sections and injects up to 5 relevant sections per Groq request. The therapist's selected approach is always included. **All content is build-time static** — editing clinical content requires a code change and redeploy; there is no CMS or DB-backed retrieval.

### Supabase Schema (key tables)
- `profiles` — therapist details (experience, approach, specialties, onboarding status)
- `subscriptions` — plan tier, `analyses_used`, `analyses_limit`
- `cases` — stored analyses (JSON `analysis` field), notes, tags, optional `patient_id`
- `messages` — chat history per case (`role`: user | assistant)
- `patients` — patient records (pseudonym, age_range, CID diagnosis, entry_reason, etc.)
- `sessions` — per-patient session records (created by `/api/analyze`, not the UI)
- `patient_memory` — per-patient AI memory (confirmed/discarded hypotheses, attention_history)

Auth uses Supabase email/password and Google OAuth. Server-side auth: `src/lib/supabase/server.ts` (`createServerClient`, `createAdminClient`, `getAuthenticatedUser`); client-side: `src/lib/supabase/client.ts`. DB triggers auto-create `profiles` + `subscriptions` rows on signup.

**No migrations directory** — schema is managed entirely via the Supabase dashboard.

### Non-Obvious Constraints
- **Bearer token auth only:** API routes extract from `Authorization: Bearer` header. Session cookies are not used server-side.
- **No real-time sync:** Cases and messages fetched once into AppContext on app init. No Supabase Realtime — multi-device updates require a page refresh.
- **Two-phase JSON repair:** Parse failures trigger a second Groq call at `temp=0.1` for self-repair. Doubles latency on failures.
- **Plan gating mocked:** `planCanAccess()` always returns `true`. UI renders lock icons but access is not actually blocked.
- **PDF packages unused:** `pdf-parse` and `pdfjs-dist` in `package.json` but not imported anywhere.
- **No cascading deletes:** Deleting a patient leaves orphaned sessions, cases, and patient_memory rows.
