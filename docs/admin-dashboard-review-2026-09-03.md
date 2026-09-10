# comms-blkout /admin — review and plan
**3 September 2026.** Evidence: source at `~/blkout/platform/apps/comms-blkout`, live bundle at
`comms.blkoutuk.cloud`, Supabase `bgjengudzfickgomjqmz` catalogue + row counts.

## Verdict

20 admin routes. **3 work.** The rest split three ways: broken by one Docker line, superseded by
tooling that now lives outside the app, or never wired at all.

The dashboard's problem is not that things are half-built. It is that **nothing tells you which
half you are looking at.** A Save button that discards, an Analytics page of invented numbers, and
a Funding page three months stale all present with the same confidence as the two moderation
queues that genuinely work.

## Do first — two findings that pre-empt any redesign

### 1. Five live credentials are in the public JS bundle

`https://comms.blkoutuk.cloud/assets/index-BmkZyW6Y.js` is world-readable and contains, verbatim:

| Secret | Verified how |
|---|---|
| `VITE_GEMINI_API` (Google, `AIza…`, 39 chars) | SHA-256 of the `.env` value matches the bundle string exactly |
| `VITE_INSTAGRAM_CLIENT_SECRET` | literal match in bundle |
| `VITE_TIKTOK_CLIENT_SECRET` | literal match in bundle |
| `VITE_LINKEDIN_CLIENT_SECRET` | literal match in bundle |
| `VITE_TWITTER_CLIENT_SECRET` | literal match in bundle |

Not accidental: `Dockerfile` declares each as `ARG` then `ENV`, and Vite inlines every `VITE_`
variable into client code by design. The Gemini key is billable by anyone who reads it.

Steps:
1. Rotate all five at the provider.
2. Delete the six `CLIENT_SECRET` / `GEMINI` `ARG`+`ENV` pairs from `Dockerfile`. A client-side
   OAuth secret has no legitimate use — the token exchange belongs in `api/`.
3. Redeploy, then re-grep the new bundle for each rotated value. Absence from the bundle is the
   proof, not the env-var change.

Note the shape of the mistake, because it recurs: `src/services/canva/auth.ts:12` and
`src/hooks/useSocialConnect.ts` both read client secrets in the browser.

### 2. Every server API route 500s — one line fixes it

```
POST /api/herald/generate →
  "Node.js 20 detected without native WebSocket support."
```

`@supabase/supabase-js` needs Node ≥22. The runner stage is `node:20-alpine`. **The fix is already
sitting uncommitted in your working tree** — `Dockerfile` line 71, `node:20-alpine` → `node:22-alpine`.

Confirmed 500 in production: `/api/herald/generate`, `/api/social-diary/research`,
`/api/social-diary/publish`, `/api/auth/meta/status`.

That outage is why the Newsletters page (1,107 lines — the largest in the app) does nothing:
generate, preview, export, editorial note and SendFox send all POST to `/api/herald/generate`.
Agent task execution and the SendFox status panel go the same way.

Commit and deploy it before judging any page that depends on it.

## Two authorisation holes in the moderation tables

Policy names claim `service_role`; the grants say otherwise (from `pg_policy`):

- **`news_articles`** — "Service role can insert articles" and "Service role can delete articles"
  are granted to PUBLIC with `WITH CHECK true` / `USING true`, and "Service role can update
  articles" names `anon` explicitly. **Anyone unauthenticated can insert, update or delete any of
  the 1,304 articles.**
- **`events`** — "Allow anonymous moderation actions" lets `anon` move any `pending`/`draft`/
  `reviewing` event to `approved`. The moderation queue is publicly writable.

Both are one migration to scope to `service_role` / `is_current_user_admin()`.

Separately: **`grant_pipeline` has RLS enabled and zero policies**, so it is unreadable from any
client. That has to be fixed before the Funding page can be pointed at the real data.

## Route-by-route

**Works — keep and build on** (3)

| Route | Why it works |
|---|---|
| `/admin/events` | Reads `events` (889 rows, last write 2 Sep). Its **Openings tab is the model for the whole app**: calls `events.blkoutuk.com/api/pending-openings` with a real bearer token, verified 401 without one. No mock fallback anywhere. |
| `/admin/news` | Reads `news_articles` (1,304 rows, last write 2 Sep). Approve/publish/feature all write through. |
| `/admin/account` | Real password change via `supabase.auth.updateUser`. **Not in the sidebar** — unreachable unless you know the URL. |

**Broken by the Node 20 outage — fix the Dockerfile, then re-assess** (3): `/admin/newsletters`,
`/admin/agents` (data loads; execution 500s), `/admin/design-studio` (Canva OAuth).

**Superseded — the work moved out of the app** (5)

| Route | Superseded by |
|---|---|
| `/admin/digestvid` | An instructions page for `localhost:8900` on your laptop. The Digest→IG Reel routine is token-free via Zapier now. |
| `/admin/socialsync` | In-browser Gemini generation. Bypasses the `blkout-image-gen` skill — no logo overlay, no Black-figure reference, no eyes-first crop. Also the reason the Gemini key is in the bundle. |
| `/admin/editorial` | Same generation stack. Not in the sidebar. |
| `/admin/campaigns/review` | Hardcoded import of `campaign-content-holiday-2025.json` plus a comment reading `// Sample posts data (would come from campaign JSON)`. Nine months old. |
| `/admin/finance` | `YEAR1_PROJECTION` with every `actual: 0`, hardcoded. The real ledger is Mission Control + `~/blkout/projects/financial-management/finance.json`. **Exception: the subscriptions panel is live and correct** (24 rows, last write 10 Aug) — that part is worth keeping. |

**Theatre — controls that look like controls** (5)

| Route | What it does |
|---|---|
| `/admin/analytics` | Every number is invented. `mockCommunityMetrics` for the four tiles; `↑5.2% ↑3.1% ↑2.4% ↑4.8%` hardcoded; the bar chart is the literal array `[65,72,68,78,85,82,87]`; "Repeat Engagers 68% / Response Rate 94% / Retention 89%" are string literals. There is a canonical `metrics.*` schema with 9 views in this same database. **The app references none of them.** |
| `/admin/settings` | **"Save Changes" has no `onClick`.** The Agents tab's toggles and dropdowns have no state and no handler. Its agent list (Griot, Listener, Weaver, Strategist) is missing `concierge` and `herald`, both active in `agent_configurations`. The Platforms tab reads `socialsync_platform_connections` — **a table that does not exist** — so everything reads disconnected forever. The General tab still carries "Set up your Supabase project at supabase.com" developer onboarding. |
| `/admin` (Dashboard) | 3 of 4 tiles are `mockCommunityMetrics` with fabricated trend arrows. "Recent Content" queries a **table named `content` that does not exist**. All three Quick Action buttons are dead. |
| `/admin/pipeline` | `// In-memory pipeline state (will be persisted to Supabase in future iteration)`, seeded `[]`. Everything entered is lost on refresh. |
| `/admin/campaigns` | 8 dead buttons — Generate Brief, ICS Export, Status Report, Sync Now, AI Content Review. Backing table `campaign_content` has 0 rows. |

**Stale-but-real — the split brain** (2)

`/admin/fundraising` reads `grants` (16 rows, **last write 25 May**). The live pipeline is
`grant_pipeline` (12 rows, **last write 2 Sep**). They have entirely different schemas —
`funder_name`+`status` vs `funder_id`+`stage` — so this is not drift, it is two systems.

What the page shows you now: a £4.5m TNL cornerstone as "researching", Esmée £200k, Trust for
London £200k.
What is actually happening: City Bridge £43k **submitted**, UnLtd £8k **submitted**, Croydon
Loves You £1.5k **preparing**, AKO/Awards for All in preparation.

`/admin/calendar` — `content_calendar`, 4 rows, last write 25 Feb. Plus 4 dead Quick Action buttons.
CF Outreach tab — 17 drafts, all still `draft`, last touched 21 May; Fenton is recorded as sent.

**Dead code**: `DashboardStats.tsx`, `AnalyticsPage.tsx`, `SettingsPage.tsx` are imported nowhere.

## Two silent-failure mechanisms worth naming

**Mock fallback on error.** `useGrants.ts` carries ~1,000 lines of invented grants and returns them
from the `catch` of every fetch. If RLS blocks a query the page renders fabricated funding data
with no visual difference from real data. Same shape in `useDrafts`, `usePublicNewsletters`,
`useAgents`. This is the "fallback that emits a clean-looking value" pattern — a fallback must
render FAILED, never a value that parses as a result.

**Undefined Tailwind tokens.** 32 uses of `community-trust`, `community-wisdom`,
`community-warmth`, `blkout-purple` across the admin UI. Verified by fetching the live stylesheet
`/assets/index-WEhhPnSx.css`: **zero occurrences of any of them.** Those icons and progress bars
render with no colour and no error.

**Also**: the sidebar's "All Systems Operational" is a hardcoded green dot. It was showing green
throughout a total API outage.

## The plan

Target: **7 nav items, every one of which does something, and every number traceable to a query.**

Two principles, both drawn from what already works here:

1. **Delegate rather than duplicate.** The Openings tab owns nothing and calls the app that does.
   Newsletters should call the `blkout-newsletter` skill's output, Finance should read Mission
   Control's `finance.json`, images should go through `blkout-image-gen`. The dashboard becomes the
   place you *see and approve* things, not a second implementation of every system.
2. **Delete before building.** Nine of the twenty routes should not exist. Removing them is the
   single biggest improvement available and costs nothing to verify.

### Phase 0 — Stop the bleeding (this week, ~2 hours)

| Step | Verify |
|---|---|
| Rotate the 5 leaked secrets | new value ≠ old at each provider |
| Strip `CLIENT_SECRET`/`GEMINI` ARG+ENV from `Dockerfile` | grep rotated values in the redeployed bundle → 0 |
| Commit `node:22-alpine` (already in your tree) | `POST /api/herald/generate` returns non-500 |
| Migration: scope `news_articles` and `events` write policies | `pg_policy` shows no PUBLIC/`anon` write grants |
| Migration: add a read policy to `grant_pipeline` | anon-key SELECT returns 12 rows |

### Phase 1 — Delete (half a day)

Remove routes, page files and sidebar entries for `/admin/analytics`, `/admin/pipeline`,
`/admin/campaigns`, `/admin/campaigns/review`, `/admin/socialsync`, `/admin/editorial`,
`/admin/digestvid`. Delete `DashboardStats.tsx`, `AnalyticsPage.tsx`, `SettingsPage.tsx` and
`src/socialsync-content-generation/` (a duplicate of `src/components/socialsync/` and the source
of the 12 pre-existing type errors).

Delete every dead button: 3 in Dashboard, 4 in ContentCalendar, 8 in CampaignDashboard, 2 in
BidWritingSection, plus Settings' "Save Changes".

Verify: `npm run build` clean, and every sidebar link resolves to a page that renders data.

### Phase 2 — Make the survivors true (2–3 days)

- **Dashboard** — replace all four tiles with `metrics.*` views. `first_gestures_summary`,
  `memberships_by_tier`, `event_interest_by_event`, `grant_pipeline_live` are the real prime-metric
  surface and are already built. Drop the `content` query. One "what needs me today" panel:
  pending events + pending news + open funder deadlines, each a link.
- **Funding** — repoint at `grant_pipeline`. Rip out the ~1,000 lines of `mockGrants` /
  `mockOpportunities` / `mockBidProgress` and replace every `catch → mock` with `catch → error
  state`. Verify: City Bridge and UnLtd appear as submitted.
- **Settings** — cut to three real things: platform connections (only once `/api/auth/*` is
  server-side), agent enable/disable writing to `agent_configurations` (all 6, from the table), and
  a link to `/admin/account`. Nothing on the page that does not persist.
- **Newsletters** — once the API is back, keep only what the `blkout-newsletter` skill cannot do
  in-terminal: the edition list, the preview, and the SendFox send button.
- **Finance** — keep the subscriptions panel, delete `YEAR1_PROJECTION`, read actuals from Mission
  Control or drop the route and link to it.
- Fix the 32 undefined Tailwind tokens (`community-*` → `amber-400`/`gray-400`; `blkout-purple` →
  `blkout-600`). Verify by diffing the built CSS, not by reading the JSX.
- Replace "All Systems Operational" with a real check, or remove it.

### Phase 3 — Add the sidebar's missing entry and the honest-state convention (1 day)

Add `/admin/account` to the sidebar. Then adopt one rule across every panel: **live / stale / empty
/ failed are four visually distinct states, and no panel may render a number it did not fetch this
session.** `useAgentActivity` already does the right thing with its `isUsingMockData` "Demo" badge
— that pattern goes everywhere, or the mock goes.

### The resulting sidebar

Dashboard · Events · News · Funding · Newsletters · Finance · Settings — plus Account.

Eight items, down from fourteen, and the six that currently mislead are gone rather than hidden.