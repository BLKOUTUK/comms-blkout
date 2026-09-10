# comms /admin — what is left, and the delivery plan
**10 September 2026.** Spec of record: `december-horizon-2026-09-03.md` (Tier 3), which superseded the
phasing in `admin-dashboard-review-2026-09-03.md`. Tiers 1 and 2 landed on 3 Sep. This document is the
audit of what remains, checked against the live estate today, plus the plan to close it.

> The four 3 Sep plan docs were written to this folder, never committed, and were missing from disk by
> 10 Sep. They were recovered from the session transcript and restored here today. The evidence register
> already points at them. They are committed with this plan.

## Verified today (10 Sep, live)

| Check | Result |
|---|---|
| Deployed commit | `0e80f10` = HEAD of main; `/api/health` ok on `.com` and `.cloud`, Node 22, db ok |
| Sidebar | 10 items: Dashboard · Events · News · Calendar · Funding · Finance · Agents · Newsletters · Settings · Account |
| `public.open_loops` | view exists, **22 rows**, 46–100 days waiting (hub 12, compass 10); **no grant to any API role** |
| `metrics.*` | 12 views + `snapshots`; no API grants; schema not exposed over PostgREST |
| Being-met feed | not dead: a gesture fired 4 Sep 15:52 UTC (openings approval); silence since 16 Aug was genuine |
| Never-resurface names | 0 rows in `open_loops` and `first_gestures` (checked by name) |
| `memberships` | table exists (tier/status/zeffy/stripe columns), **0 rows, no app writes it** |
| comms `/api/*` | still unauthenticated except `/api/health` (herald, social-diary, auth/connect, auth/meta/*) |
| ivor-core moderation | `POST /api/news/:id/moderate`, `/api/event-moderation/*` still unauthenticated; callers = events-calendar `/moderation` page (routed, no bearer), news-blkout config, chrome extension. comms admin does NOT call them (writes direct under RLS) |
| Dashboard "Recent Content" | queries `public.content`, which does not exist → permanently "No content yet" |
| Both hostnames serve `/admin` | yes; bundle 1.0 MB (was 1.57) to every visitor. Front/back-of-house split (decision 6 Aug) not begun |
| Password reset | no `/auth/*` route, no forgot link on `/login`. One admin user; dashboard reset is the fallback |
| Rob owes (unchanged) | rotate Gemini · Instagram · TikTok · LinkedIn · X client secrets; Coolify API token. (Compass token done 5 Sep.) X was parked until after 25 Aug — now clear to regenerate |

## What is left

### Tier 3 (the spec) — build before the AGM, not November
1. **Who is waiting** — `open_loops` on `/admin`. The spec's deadline is the AGM (end Oct, date set at the Sept board).
2. **A server-side route on the service role** — the only way any tile reaches `metrics.*` or `open_loops`. The server already holds `SUPABASE_SERVICE_ROLE_KEY` (health + herald use it).
3. **Beam Day** — membership opens 28 Dec. Nothing writes `memberships`; the membership shape is a ~24 Nov board decision (Zeffy vs Stripe, tiers). **This is a decision, not a dashboard task** — see "Decisions for Rob".

### Left open from Tiers 1–2 (security, same shape)
4. Guard comms `/api/*` with a session bearer (one check in `server.ts`; the pattern is `events-calendar/api/pending-openings.ts`). Build it with item 2 — the metrics route needs the same guard.
5. Guard ivor-core moderation endpoints — **cross-app**: events-calendar's `/moderation` page must send a bearer or it breaks. Needs Rob's nod.

### New (Rob, 10 Sep)
6. **Organisation identity card on the `/admin` front page** — legal name, society number, registered office, dates, officers. Only facts already on the public FCA register go in the client bundle (the bundle is public). UTR and insurance identifiers are shown on the card too, but fetched after sign-in from the guarded route (Coolify runtime vars `ORG_*`), never compiled into the bundle — the same line the finance pages already sit on (Rob, 10 Sep).

### Housekeeping found today
7. Delete the dead "Recent Content" panel and `useContent`.
8. Commit the recovered plan docs.

### Not doing, by design (December constraint)
Hostname split for admin · Settings platforms tab · analytics beyond the tiles above · password reset flow (optional, if Rob wants it).

## Work packages and routing

| WP | What | Model | Est. | Depends on |
|---|---|---|---|---|
| **WP1** | `GET /api/admin/dashboard` on the service role behind a bearer guard; same guard on every other `/api/*` (not health, not provider callbacks/webhooks); client `apiFetch` helper sends the session token; migration 016 = one `service_role`-only RPC returning open_loops + metrics views | **Opus agent** | ½ day | — |
| **WP2** | Dashboard front page: identity card · "Who is waiting" panel · live bids tile · membership tile ("opens 28 Dec") · drop Recent Content · four honest states | **Opus agent** (same agent, after WP1) | ½ day | WP1 |
| **WP3** | Commit recovered docs + this plan; task-inbox entries for Rob's owed items | **Sonnet agent** | ½ h | — |
| **WP4** | Bearer guard on ivor-core moderation + events-calendar `/moderation` sends the session token | Sonnet agent | 1–2 h | **Rob's nod** (cross-app) |
| **WP5** | What writes the first `memberships` row on 28 Dec | **Rob / board** | — | ~24 Nov decision; raise at Sept board |
| Verify | Independent checks on WP1–WP2 (401 without token, JSON with; render states; no invented numbers) | **Session model (Fable)** | 1 h | WP1, WP2 |

Routing: **spec Fable · build Opus · records Sonnet · verify session model.**

## Decisions for Rob
1. **WP4** — close the ivor-core moderation hole? It changes events-calendar's moderation page (must sign in). Yes/no.
2. **WP5** — the membership write path (Zeffy or Stripe → `memberships`) needs deciding before the 24 Nov board if Beam Day is to open on a working join. Put it on the September board agenda.
3. Rotations (five secrets + Coolify token) — still with Rob.

## Proof standard
Every tile: live / empty / failed / loading are visibly distinct; no number rendered that was not fetched this session; unauthenticated call → 401; the RPC refuses anon and authenticated. Build clean, deploy verified by `/api/health` commit hash and 6 consecutive requests (stale-container check).


## Status, end of 10 Sep 2026

| WP | Result |
|---|---|
| WP1 + WP2 | **Done.** PR #27 → `aed158e`. Migration 016 in blkout-crm `907d4b4`. Live-verified both hosts: 401 unauthenticated, 200 with a throwaway signed-in user (open_loops 22 · grant_pipeline 15 · memberships 0), garbage token 401 |
| Identifiers (Rob, 10 Sep) | **Done.** PR #28 → `3759de2`. UTR + Zurich policy served after sign-in from Coolify runtime vars `ORG_*`; absent from src and dist; all six fields populated live |
| WP3 | **Done.** Docs committed `8359f2c`; three task-inbox entries |
| WP4 | **Done** (Rob's nod 10 Sep). events-calendar PR #33 `36a8d53` first, then ivor-core PR #9 `08ac529`; live 08:53 UTC, 12/12 401 without a session, open routes still 200 |
| WP5 | **With Rob / September board** — what writes the first `memberships` row on 28 Dec |
| news.blkoutuk.com/admin | **Retired** (Rob, 10 Sep). news-blkout PR #13 `9828d4f`: server-side 301 → comms `/admin/news`; verified 12/12 after a forced redeploy |
| Finance: one system | **Done** (Rob: "go on finance pages"). comms PR #30 `030ad92` + crm PR #9 `61b2da7` (migration 017): the books publish nine `finance.*` measures on every build, `/admin/finance` is "The books", CRM `/financial` 308 → comms. Brief `finance-one-system-brief-2026-09-10.md`. Verified live 09:37 UTC |
| Books version control | **Done** (Rob: "fine, go ahead"). `~/blkout/projects/financial-management` is a git repo, author Rob, `(RB)` messages, auto-commit + push on every build, mirror on the VPS + nightly backup. Brief in that folder |
| Content module | **Done** (Rob: "go on the content module"; "add the new item form, the form should open prompt to Sonnet"). comms PR #34 `4063dc1` + crm PR #10 `e139330` (migrations 018 + 019): `content_calendar` is the register, 197 items imported, JSON out of the bundle, `/admin/calendar` = "Content" with a New-item form that drafts via Sonnet, approvals insert ready rows, crawler triggers dropped, `/campaign` + `/post` on the register with no Canva. Verified live 12:22 UTC |
| News digest | **Telegram on failure** (PR #31) after the silent 6 Sep failure; **records a posted row in the register** on publish (PR #33). First unattended run Sun 13 Sep |
| Canva | **No dependency; cancel before 3 Nov 2026** (Rob, 10 Sep). Decisions log entry; task due 27 Oct |

Found on the way, left open with tasks raised: news.blkoutuk.com/admin (ungated in-app moderation page, now 401s on write — retire → comms `/admin/news`); ivor-core `GET /api/news/pending` open; `/api/moderate*` unguarded by decision (chrome extension caller); ~20 other ivor-core route families unaudited. Rob still owes the five secret rotations + Coolify token.
