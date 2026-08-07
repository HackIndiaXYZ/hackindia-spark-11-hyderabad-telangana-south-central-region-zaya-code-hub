# Zing AI Startup Builder - Complete Project Documentation

## Project Overview

Zing AI Startup Builder is a Next.js app that turns a startup idea into a complete founder package. The app runs a six-agent workflow that generates market research, business strategy, financial planning, branding, a launch website, and an investor pitch deck.

The application includes account login, saved projects, recent project recovery, generated website preview, Markdown output rendering, file downloads, and Mutagent-style trace exports for agent runs.

## Core Features

- Landing page that introduces the AI startup-building workflow.
- Interactive `/build` workspace for generating a complete startup package.
- Six sequential AI agent routes:
  - Market research
  - Business strategy
  - Financial planning
  - Branding
  - Website generator
  - Pitch deck
- Live execution UI with progress states and generated output tabs.
- Website preview iframe for generated HTML output.
- Download controls for individual deliverables, full package export, and folder export.
- Supabase authentication with email/password, Google, and GitHub OAuth support.
- Private saved projects under each signed-in account.
- Local per-account fallback storage when Supabase project storage is unavailable.
- Guest progress transfer after login.
- Mutagent trace logging and JSONL export.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4 and global CSS styling
- Supabase Auth, database, Row Level Security, and Storage
- Ollama chat API integration through `lib/gemini.ts`
- `react-markdown` and `remark-gfm` for generated Markdown output
- ESLint and TypeScript validation

## Repository Structure

```text
ai-agents-startup-deck/
  app/
    api/agents/
      branding/
      business-strategy/
      financial-planning/
      market-research/
      pitch-deck/
      website-generator/
    auth/callback/
    build/
    login/
    projects/
    globals.css
    layout.tsx
    page.tsx
  components/
    agent-icons.tsx
    logo.tsx
    navbar.tsx
    user-nav.tsx
  lib/
    agent-trace.ts
    gemini.ts
    projects.ts
    supabase/
      client.ts
      server.ts
      storage.ts
  public/
  supabase/
    schema.sql
  MUTAGENT_TRACING.md
  SUPABASE_SETUP.md
  package.json
```

## Main Pages

### `/`

The landing page introduces the product and links users into the build workflow. It presents the six AI agents and the high-level startup package flow.

Primary file:

```text
app/page.tsx
```

### `/build`

The main founder workspace. Users enter a startup idea, upload a brief, generate a package, inspect each output, preview the generated website, download files, and save projects.

Primary file:

```text
app/build/page.tsx
```

Key responsibilities:

- Manages the startup idea input.
- Runs six agent endpoints sequentially.
- Tracks current and completed agents.
- Builds browser-side trace entries.
- Saves signed-in projects to Supabase.
- Falls back to local account-scoped storage if Supabase fails.
- Transfers guest progress after login.
- Loads a saved project by `?project=<id>`.

### `/projects`

The saved projects dashboard for signed-in users. It lists generated packages, supports opening a saved project, and supports deletion.

Primary file:

```text
app/projects/page.tsx
```

Key responsibilities:

- Requires a signed-in Supabase user.
- Queries projects by `user_id`.
- Merges Supabase projects with local fallback projects.
- Shows useful project load errors.
- Deletes both cloud and local fallback copies when possible.

### `/login`

The authentication screen for email/password and social login.

Primary file:

```text
app/login/page.tsx
```

Key responsibilities:

- Supports login and account creation.
- Supports Google and GitHub OAuth.
- Creates or updates a profile row after successful login.
- Redirects users back to the requested page through the `next` query parameter.

## AI Agent Flow

The `/build` page calls these routes in order:

```text
POST /api/agents/market-research
POST /api/agents/business-strategy
POST /api/agents/financial-planning
POST /api/agents/branding
POST /api/agents/website-generator
POST /api/agents/pitch-deck
```

Each route builds a specialist prompt and calls `streamGeminiResponse()` from:

```text
lib/gemini.ts
```

Despite the helper name, the current implementation calls an Ollama chat API endpoint with model `minimax-m3`. For production, move the API URL, model name, and authorization token into environment variables instead of keeping credentials in source code.

## Saved Project Persistence

Saved projects use two layers:

1. Supabase `projects` table for cloud-backed private project storage.
2. Browser `localStorage` fallback scoped by user id when Supabase storage is unavailable.

Primary helper:

```text
lib/projects.ts
```

The helper provides:

- `normalizeProject()`
- `loadLocalProjects()`
- `mergeProjects()`
- `storeLocalProject()`
- `deleteLocalProject()`
- `createLocalProject()`
- `projectErrorMessage()`

This makes the app resilient when the Supabase schema has drifted, network access fails, or the project table cannot be reached. Locally saved fallback projects are merged back into the recent-projects strip and the saved projects page.

## Supabase Data Model

The schema lives in:

```text
supabase/schema.sql
```

Tables:

```text
profiles
  id uuid primary key references auth.users(id)
  email text
  full_name text
  updated_at timestamptz

projects
  id uuid primary key
  user_id uuid references auth.users(id)
  idea text
  title text
  deliverables jsonb
  created_at timestamptz
  updated_at timestamptz
```

Security:

- Row Level Security is enabled for `profiles`.
- Row Level Security is enabled for `projects`.
- Users can manage only their own project rows.
- Private `user-assets` storage bucket is scoped by authenticated user id.

## Environment Variables

Create `.env.local` in the project root.

Required for Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Recommended for the AI API integration:

```env
AI_API_URL=https://your-ai-endpoint.example.com/api/chat
AI_API_MODEL=your-model-name
AI_API_AUTH_TOKEN=your_private_token
```

The current code does not yet read these AI variables. They are the recommended production target for refactoring `lib/gemini.ts`.

## Local Setup

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Common routes:

```text
http://localhost:3000/build
http://localhost:3000/login
http://localhost:3000/projects
```

## Supabase Setup

1. Create a Supabase project.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `.env.local`.
3. Run the full SQL in `supabase/schema.sql` from the Supabase SQL Editor.
4. Enable Email auth if using password login.
5. Enable Google and GitHub providers if social login is needed.
6. Add local and production redirect URLs in Supabase Authentication settings.

Useful redirect URLs:

```text
http://localhost:3000/auth/callback
http://localhost:3002/auth/callback
https://your-production-domain.com/auth/callback
```

## Project Generation Workflow

1. Open `/build`.
2. Sign in if you want the package saved to your account.
3. Enter a startup idea or upload a brief.
4. Select `Generate package`.
5. The app runs all six agents in sequence.
6. Review each output tab.
7. Preview the generated website in the Launch Site tab.
8. Download deliverables or the full package.
9. Open `/projects` to continue saved work later.

## Trace Logging

Each build creates a browser run id and sends it as `X-Run-Id` to all agent API routes.

Trace code:

```text
lib/agent-trace.ts
MUTAGENT_TRACING.md
```

Trace events include:

- Run id
- Agent id
- Status
- Duration
- Input character count
- Output character count
- Error message if a run fails

The visible trace panel can export JSONL for hackathon or debugging use.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npx tsc --noEmit
```

## Validation Notes

Recent validation:

```bash
npx tsc --noEmit
```

TypeScript passed after the saved project persistence changes.

Targeted lint passed for:

```bash
npx eslint app/projects/page.tsx lib/projects.ts
```

Full lint may still report older unrelated issues in existing generated helper scripts and older React hook patterns.

## Deployment Notes

Recommended deployment target:

```text
Vercel
```

Before production deployment:

- Set Supabase environment variables in the hosting provider.
- Move the AI API endpoint, model name, and token into private environment variables.
- Do not expose secret keys through `NEXT_PUBLIC_` variables.
- Run `npm run build`.
- Confirm `/auth/callback` is included in Supabase redirect URLs.
- Confirm the `projects` table and RLS policies exist in Supabase.

## Known Maintenance Items

- `README.md` currently contains merge-conflict markers and should be cleaned before sharing publicly.
- The AI helper is named `gemini.ts`, but it currently calls an Ollama chat endpoint.
- The API authorization token should be moved out of source code.
- Full lint has unrelated existing failures outside the saved-project persistence changes.
- Untracked helper scripts exist in the workspace: `append_all.js`, `append_css.js`, `fix_css.js`, `patch.js`, `rewrite.js`, and `strip_bom.js`.

## Recent Saved Projects Fix

The project persistence fix adds:

- Account-scoped Supabase queries using `user_id`.
- A local fallback store keyed by signed-in user id.
- Merging of local and Supabase projects.
- Better load and delete behavior on the `/projects` page.
- Recovery when Supabase project storage fails after a package is generated.

Commit created locally:

```text
089365d Fix saved project persistence
```

The branch was not pushed because GitHub credentials were unavailable in the non-interactive environment.
