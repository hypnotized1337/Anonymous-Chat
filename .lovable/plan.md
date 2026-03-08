

## Plan: Features Page with Cached AI Summary

### Overview
Add a `/features` page that uses AI to summarize what the app does based on commit history. The summary is cached in the database and only regenerates when new commits appear (detected by comparing the latest commit SHA).

### 1. Database Table for Cached Summary

Create a `feature_summaries` table to store the AI-generated summary:
- `id` (uuid, PK)
- `latest_sha` (text) — the commit SHA that triggered this summary
- `summary` (text) — the AI response
- `created_at` (timestamptz)

Single-row table with a public SELECT policy (no auth needed) and no INSERT/UPDATE from client — only the edge function writes to it via service role.

### 2. Edge Function: `summarize-features`

**File:** `supabase/functions/summarize-features/index.ts`

- Fetches latest commit SHA from GitHub
- Queries `feature_summaries` table — if `latest_sha` matches, returns cached summary
- If stale: fetches all commit messages (last 100), calls Lovable AI (`google/gemini-2.5-flash-lite`) with a prompt like: *"Based on these commits for 'v0id', an anonymous ephemeral chat app, write a concise feature summary describing what the app does and its key features. Use bullet points."*
- Upserts the new summary + SHA into `feature_summaries`
- Returns the summary

### 3. Features Page

**File:** `src/pages/Features.tsx`

- Minimal page matching changelog style (monochrome, font-mono)
- On mount, calls `supabase.functions.invoke('summarize-features')`
- Shows loading spinner, then renders the AI summary
- Back link to `/`

### 4. Route + Join Screen Link

- **`src/App.tsx`**: Add `/features` route
- **`src/components/JoinScreen.tsx`**: Add a "features" link below the changelog link with a `Sparkles` icon

### Files

| File | Action |
|---|---|
| Migration SQL | Create `feature_summaries` table + RLS |
| `supabase/functions/summarize-features/index.ts` | New edge function with caching logic |
| `src/pages/Features.tsx` | New page |
| `src/App.tsx` | Add route |
| `src/components/JoinScreen.tsx` | Add features link |

