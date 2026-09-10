# BRIEF — comms /admin Tier 3 build (WP1 + WP2)
**10 September 2026.** For the build agent. Plan: `admin-delivery-plan-2026-09-10.md`. Spec: `december-horizon-2026-09-03.md` (Tier 3).

## Read first (in this order, before any edit)
1. `docs/admin-delivery-plan-2026-09-10.md` — what is left and why
2. `docs/december-horizon-2026-09-03.md` — Tier 3 section only
3. `server.ts` — route registration shape (`app.all('/api/…')` + dynamic import), the `/api/health` handler (service-role REST call pattern, env names)
4. `../events-calendar/api/pending-openings.ts` — the bearer-verification pattern to copy (`verifyModerator`: `Authorization: Bearer <token>` checked against `${SUPABASE_URL}/auth/v1/user`; 401 otherwise)
5. `src/pages/admin/Dashboard.tsx`, `src/hooks/useIvorDashboard.ts`, `src/components/shared/StatCard.tsx`, `src/hooks/useAuth.tsx`, `src/lib/supabase.ts`
6. `src/pages/admin/EventModeration.tsx` lines 150–200 — how the Openings tab sends a bearer today
7. `../crm/migrations/015_metrics_collector.sql` — the house pattern for service_role-only RPCs (REVOKE from PUBLIC/anon/authenticated, GRANT EXECUTE to service_role)
8. `~/blkout/governance/cbs/README.md` — the canonical registration facts (identity card source)

## Hard rules
- **Worktree, not the main checkout.** `git -C ~/blkout/platform/apps/comms-blkout worktree add ~/wt/comms-admin-tier3 -b claude/admin-tier3 main`, then `npm ci` there. Never touch `remotion-videos/` (another session's work sits uncommitted there).
- **No secrets in the client, ever.** Nothing new under `import.meta.env`. No `VITE_` var added. The service-role key is read only in server code (`process.env.SUPABASE_SERVICE_ROLE_KEY`, already present on Coolify). Never print any key value; never commit `.env`.
- **No fallback that parses as a result.** A failed fetch renders a red "failed" state and the error text; an empty result renders "none"; loading renders "…". Never `?? 0`, never a placeholder number.
- **Do not render an "unmet" count from `metrics.being_met_live` or `first_gestures_summary`.** Rob (28 Aug): those 90 event signups were reached by SendFox broadcasts the feed cannot see — the number is blind. "Who is waiting" is `public.open_loops` only (notes-bearing, human-judged).
- **Do not add any name-based filtering.** The data layer already carries the deceased guard.
- **Identity card holds only facts already on the public FCA Mutuals register** plus officers and dates. NO UTR, NO insurance policy number, NO phone number (the bundle is served to every anonymous visitor).
- Surgical: touch only the files this brief names or creates. Match existing style (Tailwind, `card` class, `StatCard`). No new dependencies.
- Do not push to `main`. Push the branch and open a PR; the session verifies and merges.
- If anything here turns out to be false on inspection (a file missing, a column different), stop and report — do not improvise around it.

## WP1 — the guarded server route

### 1a. Migration `apps/crm/migrations/016_admin_dashboard_rpc.sql`
One function, SECURITY DEFINER, owner postgres, `SET search_path = public, metrics, pg_temp`:

`public.admin_dashboard_snapshot() RETURNS jsonb` returning:
```
{ "open_loops":        [ {id, person_ref, person_name, surface, gesture, met_on, days_since_met, notes} … ] (ORDER BY met_on ASC),
  "first_gestures":    { total_rows, live, met, acknowledged_awaiting_met, latest_gesture_at }   -- from metrics.first_gestures_summary; OMIT unmet_queue
  "being_met":         { met_in_window, landed, median_hours_to_met_90d }                          -- from metrics.being_met_live; OMIT unmet, unmet_over_window
  "grant_pipeline":    [ {grant_name, grant_program, stage, amount_requested, amount_awarded, deadline, submitted_at, decision_expected, updated_at} … ] (ORDER BY deadline NULLS LAST),
  "memberships_by_tier":[ {tier, status, members} … ],
  "generated_at":      now() }
```
Then: `REVOKE ALL ON FUNCTION public.admin_dashboard_snapshot() FROM PUBLIC, anon, authenticated; GRANT EXECUTE … TO service_role;`
Header comment in the house style (date, purpose, applied-as name). Apply with `mcp__supabase__apply_migration` (name `admin_dashboard_rpc`) — the **writer** MCP, not `claude_ai_Supabase` which is read-only. If the MCP is unavailable, use `node ~/blkout/platform/scripts/supabase-query.mjs` after `source ~/blkout/platform/.env.supabase` in the same shell line.
Proof (read-only SQL, paste the results in the report):
```
select has_function_privilege('anon','public.admin_dashboard_snapshot()','execute'),
       has_function_privilege('authenticated','public.admin_dashboard_snapshot()','execute'),
       has_function_privilege('service_role','public.admin_dashboard_snapshot()','execute');
select jsonb_array_length(admin_dashboard_snapshot()->'open_loops');   -- expect 22 today
```

### 1b. `api/admin/dashboard.ts` + registration in `server.ts`
- `GET /api/admin/dashboard`. Calls `POST ${SUPABASE_URL}/rest/v1/rpc/admin_dashboard_snapshot` with `apikey` + `Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}`. Returns the JSON as-is with `Cache-Control: no-store`. On upstream failure: `502 {error, upstream_status}` — never a partial/default body.
- Register in `server.ts` above the static handler, same dynamic-import shape as the others.

### 1c. The guard — `api/_auth.ts` (server-side only)
- `requireSession(req, res): Promise<{id,email}|null>`: reads `Authorization: Bearer <jwt>`, verifies against `${SUPABASE_URL}/auth/v1/user` with the **anon** key as `apikey` and the token as bearer (exactly as pending-openings does). Missing/invalid → `401 {error:'Sign in required'}` and return null.
- Apply in `server.ts` to: `/api/admin/*`, `/api/herald/generate`, `/api/social-diary/research`, `/api/social-diary/publish`, `/api/auth/connect`, `/api/auth/meta/connect`, `/api/auth/meta/status`.
- Do NOT guard: `/api/health`, `/api/auth/callback`, `/api/auth/meta/callback`, anything under `/api/webhooks/` (provider-initiated). List in the PR body what is guarded and what is not, and why.
- CORS: allow `Authorization` in `Access-Control-Allow-Headers` wherever the existing routes set CORS headers; answer `OPTIONS` with 204.

### 1d. Client helper `src/lib/apiFetch.ts`
`apiFetch(path, init?)` → gets `supabase.auth.getSession()`, adds `Authorization: Bearer ${session.access_token}`, throws a typed error on 401 ("Sign in required"). Replace every client call to the routes guarded in 1c with it (grep `fetch(` for `/api/herald`, `/api/social-diary`, `/api/auth/`). Newsletters page (`src/pages/admin/Newsletters.tsx`, its hook) is the main consumer — every button there must still work signed in.

## WP2 — the front page (`src/pages/admin/Dashboard.tsx`)
Order, top to bottom:
1. **Header** — "Dashboard" + one line.
2. **Identity card** (`src/lib/orgIdentity.ts`, plain object; `src/components/admin/OrgIdentityCard.tsx`). Facts, verbatim from `governance/cbs/README.md`:
   - Legal name **BLKOUT Creative Limited**, trading as **BLKOUT UK**
   - Community Benefit Society (registered society), Co-operative and Community Benefit Societies Act 2014; permanent statutory asset lock
   - FCA Mutuals Public Register no. **9639** (cited as **RS009639**) · registered **24 November 2025**
   - Registered office **2 Grange Park Road, Thornton Heath, London CR7 8QA**
   - Financial year-end **30 September**; first accounting period 24 Nov 2025 – 30 Sep 2026
   - Not VAT registered · not at Companies House (a form asking for a Companies House number has the wrong entity type)
   - Officers: Chair **Peter Fleming** · Secretary and Vice-Chair **Lanre Jackson-Cole**. Directors: Nathan Lewis · Lloyd Young · Jean-Eric Nkurikiye · Peter Fleming · Reuben Silungwe · Lanre Jackson-Cole (assumed office 18 Mar 2026)
   - One flagged line, amber: "FCA registration (16 Oct 2025) names Robert Berkeley as Secretary — reconcile with the board return before the Rule 126 register is signed off."
   - Key dates: AGM end October 2026 (date set at the September board; all directors stand down at the first AGM, Rule 70) · first anniversary 24 Nov 2026 · Joseph Beam Day **28 Dec 2026** — membership opens
   - Contact: rob@blkoutuk.com · Governing documents: `governance/cbs/rules-of-the-society.pdf` (text, not a link — it is not web-served)
3. **Tiles row** — keep the two ivor-core tiles (events added 7d, moderation queue) and "Agent content awaiting approval"; add **Live bids** = count of `grant_pipeline` rows whose stage is not in (declined, withdrawn, awarded, closed) — read the real stage values from the data before choosing the exclusion list and state it in a tooltip; add **Members** = sum of `memberships_by_tier.members` with the caption "opens 28 Dec 2026" when zero. Every tile: loading "…", failed "unavailable" with the error line beneath the row (existing pattern), never a default.
4. **Who is waiting** (new, full width, the point of the page) — `open_loops` oldest first: name · surface · gesture · met on · **days waiting** · notes. Empty → "No one is waiting." Failed → red panel with the error. Caption: "People BLKOUT met and has not yet followed through with. From `open_loops`. Broadcast emails do not count as a touch; use judgement." Row count in the heading.
5. **Bids** — compact list from `grant_pipeline`: name · programme · stage · deadline · amount; link to `/admin/fundraising`.
6. **AI Agents** and **Recent Activity** — keep as they are.
7. **Delete** the "Recent Content" card, `src/hooks/useContent.ts` and any import of it (the `content` table does not exist). Grep to confirm nothing else imports it.
8. Quick Actions — keep.

Data hook: `src/hooks/useAdminDashboard.ts` → `apiFetch('/api/admin/dashboard')`; state `{data, error, isLoading}`; no retries, no cache, no fallback.

## Proof (run all; paste outputs in the report)
1. `npm run build` in the worktree — clean (the 12 pre-existing type errors lived in a tree deleted on 3 Sep; if errors remain, list them and whether your diff touches those files).
2. Sentinel: `grep -c "SUPABASE_SERVICE_ROLE_KEY\|sk-or-\|AIza" dist/assets/*.js` → 0.
3. Local server: `npm run build:server` (or the script the Dockerfile uses — read it) then run it with `PORT=3123` and the env from `~/blkout/platform/apps/comms-blkout/.env` sourced **in the same shell line** (never echo it):
   - `curl -s -o /dev/null -w '%{http_code}\n' localhost:3123/api/admin/dashboard` → **401**
   - `curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:3123/api/herald/generate` → **401**
   - `curl -s localhost:3123/api/health | head -c 200` → service comms-blkout
   - With a real session token (sign in via the Supabase auth REST endpoint using the admin email + a password you ask the session for — DO NOT guess; if unavailable, skip and say so): `/api/admin/dashboard` → 200 and `open_loops` length 22.
4. Migration privilege proof from 1a.
5. `git diff --stat` and the list of deleted files.
6. Commit on `claude/admin-tier3` (message: what and why, two paragraphs, the standard Co-Authored-By trailer), push, open PR with `gh pr create` against main. PR body = guarded/unguarded route list + proof outputs.

## Report shape (final message)
1. Done / not done, one line each per numbered item above.
2. The proof outputs, verbatim.
3. Anything found that this brief got wrong.
4. PR URL.
