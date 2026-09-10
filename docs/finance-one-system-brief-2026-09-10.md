# BRIEF — Finance: one system, not two
**10 September 2026.** Rob: *"finance and the bookkeeping system should be one system not two"* → *"go on finance pages"*. For the build agent.

## The facts this rests on (verified 10 Sep)
- **The books** are the bookkeeping pipeline in `~/blkout/projects/financial-management/`: bank CSVs in `ledger/` → `accounts-map.json` → `build-finance.mjs` → `finance.json` (also copied to `~/blkout/platform/missioncontrol/data/finance.json`). Mission Control's monthly upload (`POST /finance/statement` in `missioncontrol/server.mjs`) is the write path. The Financial Regulations §10 name these as the books. **That directory is NOT a git repository** — say so in your report; do not init one.
- `finance.json` top-level: `generated, periodTo, statementTo, checkPeriod, monthsToCheck, monthsToCheckKeys, nilMonths, monthsRecorded, transactions (an integer count), cash, receivable, netPosition, funds[] ({fund, funder, code, spendCode, restricted, awarded, received, receivable, spent, remaining}), needsAttention {unmapped[], flags[{date, description, note}]}`. Read the file for exact types before coding.
- comms `/admin/finance` (`src/pages/admin/Finance.tsx`, 197 lines) shows only `public.subscriptions` (24 rows) via `src/hooks/useSubscriptions.ts`, plus a card pointing at Mission Control and the CRM.
- CRM `/financial` (`apps/crm/app/financial/page.tsx`, sidebar link in `apps/crm/components/sidebar.tsx:26`) reads `public.financial_transactions`: **0 rows, never written**.
- The metrics layer (crm migrations 014/015): `metrics.snapshots(taken_at, period 'YYYY-MM', measure, value, detail jsonb, source, status)` UNIQUE(period, measure); `public.metrics_snapshot_put(p_period, p_measure, p_value numeric, p_detail jsonb, p_source, p_status default 'ok')` — service_role-only, upserts, never touches `baseline-%` rows. `metrics.snapshots` holds NO finance rows today.
- `~/blkout/platform/scripts/supabase-query.mjs "<sql>"` runs SQL as postgres through the management API using `SUPABASE_ACCESS_TOKEN` from `~/blkout/platform/.env.supabase` (that file holds `SUPABASE_ACCESS_TOKEN=` and `SUPABASE_PROJECT_ID=`). The analytics renderer already shells out to it this way.
- comms server guard (`api/_auth.ts`, `GUARDED_PATHS` includes `/api/admin`) already covers any new `/api/admin/*` route. Existing example of the whole pattern: migration 016 + `api/admin/dashboard.ts` + `src/hooks/useAdminDashboard.ts` (built this morning) — copy its shape exactly.

## The shape (decided — do not redesign)
One ledger (the pipeline, unchanged as the write path) → **one publish step** → one read surface (comms `/admin/finance`). The CRM finance page is retired.

### 1. Publish step — `~/blkout/projects/financial-management/build-finance.mjs`
After the existing writes and console summary, add `publishToMetrics(finance)`:
- Read `~/blkout/platform/.env.supabase` in-process (parse `KEY=VALUE` lines), pass `SUPABASE_ACCESS_TOKEN` to a child `node ~/blkout/platform/scripts/supabase-query.mjs "<sql>"` via `env`, **never print it, never pass it on argv**.
- One SQL statement, `SELECT public.metrics_snapshot_put(...)` per measure, all in one call. `period` = `YYYY-MM` of `statementTo`. `source` = `'ingest:build-finance'`. Measures and values:
  `finance.cash` = cash · `finance.receivable` = receivable · `finance.net` = netPosition · `finance.transactions` = transactions · `finance.months_recorded` = monthsRecorded · `finance.nil_months` = count of nil months · `finance.months_unchecked` = monthsToCheck · `finance.funds` = funds.length · `finance.needs_attention` = unmapped.length + flags.length.
  `detail` on EVERY row: `{as_at: periodTo, statement_to: statementTo, generated, check_period: checkPeriod, months_to_check: monthsToCheckKeys, nil_months: <the list>}`; additionally `finance.funds` carries `{funds: [...]}` and `finance.needs_attention` carries `{unmapped, flags}`.
- Exit codes: success prints `Published to metrics.snapshots (period YYYY-MM, 9 measures)`. If the token file or token is missing, or the child fails: print `NOT PUBLISHED — <reason>` to stderr and **exit 2** after the local files are written (the books are still built; Mission Control must see the failure, never a quiet success). `--no-publish` flag skips the step with a printed line.
- Check `missioncontrol/server.mjs` `/finance/statement`: it must surface a non-zero exit from build-finance to the page (read how it runs the builder; if it swallows the exit code, make the failure visible in its response — minimal change, say what you did).
- Append one paragraph to `~/blkout/projects/financial-management/chart-of-accounts.md` under the monthly routine: the publish step, the measures, the `--no-publish` flag, and that a `NOT PUBLISHED` line means the admin page is stale.

### 2. Migration `apps/crm/migrations/017_admin_finance_rpc.sql`
`public.admin_finance_snapshot() RETURNS jsonb`, SECURITY DEFINER, owner postgres, `SET search_path = public, metrics, pg_temp`, house header comment. Returns:
```
{ "books": { "<measure>": { "value", "period", "taken_at", "detail" } … }   -- latest row per finance.* measure (max taken_at), or NULL when none exist
  "subscriptions": [ …all columns of public.subscriptions, ORDER BY name/service… ],
  "subscriptions_cost": { …the single row of metrics.tool_subscriptions_cost… } (or null),
  "generated_at": now() }
```
`REVOKE ALL … FROM PUBLIC, anon, authenticated; GRANT EXECUTE … TO service_role; NOTIFY pgrst, 'reload schema';` Apply with `mcp__supabase__apply_migration` (writer; name `admin_finance_rpc`) or the query helper. Proof SQL: the three `has_function_privilege` checks (f, f, t) and `select admin_finance_snapshot()->'books' is null` (true before the first publish, false after).

### 3. comms-blkout — route, hook, page
- `api/admin/finance.ts`: clone of `api/admin/dashboard.ts` calling `rpc/admin_finance_snapshot`; register in `server.ts` next to the dashboard route. Guard is automatic (prefix).
- `src/hooks/useAdminFinance.ts`: clone of `useAdminDashboard.ts`; typed response; no retry, cache or fallback.
- `src/pages/admin/Finance.tsx` rewritten as **The books**, top to bottom:
  1. Header "Finance — the books" + one line: "The society's ledger, published from the bookkeeping pipeline. Write path: Mission Control monthly statement upload."
  2. **Position**: three tiles — Cash at bank · Grants receivable · Net position — each with the as-at date (`detail.as_at`) beneath; and a status strip: if `finance.months_unchecked` > 0 → amber, loud: "N month(s) not yet checked: <months_to_check>. The position is stale until they are." else green: "Checked to <statement_to>. Nil months: <list or 'none'>." Also "Published <generated> · period <period>".
  3. **Funds**: table from `finance.funds.detail.funds` — fund · funder · restricted · awarded · received · receivable · spent · remaining.
  4. **Needs attention**: unmapped transactions and flags from `finance.needs_attention.detail`; "Nothing outstanding" when both empty AND the row exists.
  5. **Subscriptions**: the existing panel's content, now fed from the same response (`subscriptions` + `subscriptions_cost`). Delete `src/hooks/useSubscriptions.ts` only if nothing else imports it (grep).
  6. Footer card: "Where things live — the ledger and reconciliations: `~/blkout/projects/financial-management/` (Rob's machine); monthly upload: Mission Control; the CRM's transactions page is retired (it never held a row)."
  States, visibly distinct, everywhere: loading "…" · failed red panel with the error text · `books` null → one amber panel "The books have not been published yet — run `node build-finance.mjs` in the financial-management folder" and NO tiles rendered · a real zero renders as 0 with its as-at date. Money via the same `£` formatter as Dashboard.tsx. Never `?? 0` on a fetched value.
- Sidebar label stays "Finance".

### 4. CRM — retire `/financial`
In `apps/crm` (Next.js 14, `next.config.js`, Basic-auth `middleware.ts`; main has ~37 dirty files of Rob's — **worktree**, stage only your files): add `async redirects()` returning `{ source: '/financial', destination: 'https://comms.blkoutuk.com/admin/finance', permanent: true }` and the same for `/financial/:path*`; remove the sidebar entry; delete `app/financial/page.tsx` and any component only it imported (grep first). Leave the `financial_transactions` table and its API route alone; list them in the report as retirement candidates. Include migration 017 in this same PR.

## Hard rules
- Worktrees: comms `~/wt/comms-finance-books` (branch `claude/finance-books`, from `origin/main`), crm `~/wt/crm-retire-financial` (branch `claude/retire-financial`, from `origin/main`). `npm ci --legacy-peer-deps` if plain `npm ci` fails on the known ERESOLVE; never change lockfiles. Never touch `remotion-videos/`.
- No secrets in client code; no new `VITE_` vars; the token is read only inside `build-finance.mjs` and passed only as child env.
- No fallback that parses as a result. No `metrics.*` reads from the browser.
- Do not push to `main` in either repo — branch + PR. `build-finance.mjs` and `chart-of-accounts.md` are not in git: edit in place and show the diff (`diff` against a `.bak` you make first and delete after).
- Do not spawn sub-agents. Work in the order 2 → 3 → 1 → 4, then proofs.

## Proof (paste verbatim)
1. Migration privilege SQL (f, f, t); `admin_finance_snapshot()->'books' is null` before publish.
2. comms: `npm run build` clean; `grep -c "SUPABASE_SERVICE_ROLE_KEY\|SUPABASE_ACCESS_TOKEN" dist/assets/*.js` → 0; local server on PORT=3126 with `.env` sourced in the same shell line: `GET /api/admin/finance` no token → 401, garbage bearer → 401, `/api/health` → answers with `service: comms-blkout`.
3. `node build-finance.mjs --no-publish` from the financial-management dir: output identical to before (diff of finance.json before/after = empty). Then `node build-finance.mjs` (real publish): prints the Published line, exit 0; SQL `select measure, value, period, source from metrics.snapshots where measure like 'finance.%' order by measure` → 9 rows, values matching finance.json (cash 78.88 etc. — read the live file, do not assume); `admin_finance_snapshot()->'books'->'finance.cash'->>'value'` = the same. Then break it on purpose: run once with `SUPABASE_ACCESS_TOKEN` shadowed to empty → `NOT PUBLISHED` on stderr and exit 2, finance.json still written.
4. crm: `npm run build` clean in the worktree (Next build); `grep -n "financial" next.config.js components/sidebar.tsx` shows the redirect and no sidebar link.
5. `git diff --stat` per repo; PR URLs (comms + crm). Commit messages: two paragraphs, trailers `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01UF8shcT3di5zAs3UDwFM9B`.

## Report shape
Done / not done per section; proof outputs verbatim; what this brief got wrong; retirement candidates found; both PR URLs.
