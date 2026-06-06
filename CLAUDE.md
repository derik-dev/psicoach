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
- **AI:** Groq SDK (`src/lib/groq.ts`) — `llama-3.3-70b-versatile` for analysis, `whisper-large-v3` for audio transcription
- **Error monitoring:** Sentry (`@sentry/nextjs`) — configured in `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`; `next.config.ts` wraps the config with `withSentryConfig()`
- **Env vars required:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GROQ_API_KEY`, `SENTRY_AUTH_TOKEN` (for source map upload)

### Route Groups
- `src/app/(app)/` — authenticated routes: `dashboard`, `nova-analise`, `historico/[id]`, `biblioteca`, `configuracoes`, `admin`
- `src/app/api/` — three API routes: `analyze/route.ts` (main AI endpoint), `chat/route.ts`, and `transcribe/route.ts` (audio → text via Groq Whisper, accepts multipart `audio` field, returns `{ text: string }`)
- `src/app/onboarding/` — three-step first-time setup flow (perfil → abordagem → tour)
- `src/app/auth/callback/` — Google OAuth redirect handler
- Public routes: `/`, `/login`, `/cadastro`, `/pricing`

### Global State (`src/context/AppContext.tsx`)
Central React Context holds: `user`, `cases`, `activePlan`, `analysesUsed/Limit`. It initializes by calling `supabase.auth.getSession()` on mount and exposes `signIn`, `signUp`, `logout`, `addCase`, `updateCase`, `deleteCase`, `addChatMessage`. Pages read directly from context; no Zustand/Redux.

### Core Analysis Flow
```
nova-analise page → POST /api/analyze
  → auth validated via Bearer token (server Supabase client)
  → system prompt built from therapist profile + knowledge retrieval
  → Groq (llama-3.3-70b-versatile, temp=0.6, max_tokens=2048) returns structured JSON
  → JSON schema: { hypothesis, approaches[], questions[], references[], blind_spot, alerts[] }
  → frontend saves case to Supabase + updates AppContext
```

**Chat API (`/api/chat`)** auto-detects intent: messages ≥80 chars containing clinical keywords trigger a full structured analysis (max_tokens=2048) and return `{ analysis: CaseAnalysis }`; shorter/conversational messages return a free-text `{ reply: string }` (max_tokens=512, temp=0.65). Uses last 10 messages as context window.

### Clinical Knowledge Base (`src/lib/knowledge/`)
Seven modules: `approaches.ts`, `diagnostics.ts`, `techniques.ts`, `ethics.ts`, `saude_mental_ab.ts`, `raps_sus.ts`. `retriever.ts` maps 200+ clinical keywords to knowledge sections and injects up to 5 relevant sections per request. Always includes the therapist's selected approach. This is core product logic — changes here affect all AI output quality.

### Supabase Schema (key tables)
- `profiles` — therapist details (experience, approach, specialties, onboarding status)
- `subscriptions` — plan tier, `analyses_used`, `analyses_limit`
- `cases` — stored analyses with JSON analysis field and notes/tags
- `messages` — chat history per case (`role`: user | assistant)

Auth uses Supabase email/password and Google OAuth. Server-side auth uses `src/lib/supabase/server.ts`; client-side uses `src/lib/supabase/client.ts`. DB triggers auto-create `profiles` + `subscriptions` rows on signup. Plan limits: free=0, starter=10/month, pro/clinica=unlimited.

### UI Patterns
Analysis results are displayed across tabs: sintese, formulacao, risco, intervencoes, prontuario, referencias. The sidebar contains a usage progress bar (analyses used / limit). Cases support follow-up chat via `/api/chat`. Sidebar is collapsible on mobile.

### Non-Obvious Constraints
- **Knowledge base is build-time static:** All clinical content in `src/lib/knowledge/` is baked into TypeScript strings. Editing clinical content requires a rebuild — no CMS or DB-backed retrieval.
- **No real-time sync:** Cases and messages are fetched once on app init into AppContext local state. No Supabase Realtime subscriptions — multi-device updates won't propagate without a page refresh.
- **Bearer token auth only:** API routes extract the token from the `Authorization: Bearer` header; session cookies are not used server-side.
- **No DB migrations directory:** Schema is managed entirely via the Supabase dashboard.
- **PDF packages installed but unused:** `pdf-parse` and `pdfjs-dist` are in `package.json` but not wired up in any route or component.
