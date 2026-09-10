# Council verdict — comms-blkout /admin rebuild
**3 September 2026.** Convened in the shape of `ivor-core/src/services/CouncilService.ts`
(Propose → Peer Review → Synthesise). Four seats: Security & Infrastructure, Estate Architecture,
Community & Values, Delivery Realism. Chair: Claude. `joyQuotient` substituted with `feasibility`,
the subject being infrastructure rather than content.

Peer-review stage collapsed into synthesis: the seats cross-refuted each other substantively
(three independently found the `metrics.*` blocker; two independently refuted the CRM link), and a
verified live data exposure should not wait on another round.

## Verdict

| Seat | relevance | communityNeed | liberationAlignment | feasibility |
|---|---|---|---|---|
| Security & Infrastructure | 4 | 2 | 4 | 2 |
| Estate Architecture | 5 | 3 | 4 | 2 |
| Community & Values | 3 | 2 | 3 | 3 |
| Delivery Realism | 3 | 2 | 4 | 2 |
| **Mean** | **3.75** | **2.25** | **3.75** | **2.25** |

**The audit is sound. The plan is not.** Every one of the plan's ~15 database and row-count claims
survived independent re-derivation by a seat that tried to break them. But it aims at the wrong
tier of harm, its centrepiece cannot be built as written, and its estimates are out by 2.5–3.5×.

Carried unanimously: **Phase 0 is reordered, Phase 2 is unblocked before it is scheduled, and
Phase 3 becomes a convention rather than a task.**

## 1. Member data is readable by anyone. This is the headline, not the Gemini key.

Verified by the chair, count-only, no rows retrieved, using the publishable key that is printed in
the world-readable bundle at comms.blkoutuk.cloud:

| Table | Unauthenticated read | Rows |
|---|---|---|
| `contacts` | HTTP 206 | **3,294** |
| `hub_members` | HTTP 206 | **81** |
| `cf_fundraising_drafts` | HTTP 206 | 17 (anon can also rewrite and delete) |
| `newsletter_preferences` | HTTP 206 | 11 (anon can rewrite any subscriber's) |
| `news_votes` | HTTP 206 | 45 (anon can delete by voter_id — the loop feeding the digest and the IG Reel) |

Offending policies: `public_view_contacts [PUBLIC] USING true`,
`Allow anon read access to hub_members [anon] USING true`,
`cf_drafts_all [anon,authenticated] USING true WITH CHECK true`.

This is contact data for Black queer men, in an organisation that recorded a data-exposure
incident on 6 August. My original Phase 0 put a billable Gemini key first and never found this.
Rotating the Gemini key costs Google money; this costs people. **Seat dissent recorded: if the
chair had kept the original order, this exposure would have survived all of Phase 0 and Phase 1.**
Dissent upheld.

A near-miss worth recording, because it shows the check working: `public.users` (the down-app
table, with `password`, `email`, `ethnicity`, `hiv_status`, lat/long columns) has policies just as
open — `Users can update own profile [PUBLIC] USING true WITH CHECK true` — but the live
unauthenticated call returns **401 permission denied**, because `anon` holds no table GRANT. Not
currently exploitable. One `GRANT SELECT ON users TO anon` re-opens it. The seat flagged that it
nearly asserted the opposite from the catalogue alone.

## 2. Newsletter signup is failing on the live public sites

`crm.blkoutuk.cloud` is behind HTTP Basic on every path including `/api/*`.

```
OPTIONS /api/community/join   Origin: https://events.blkoutuk.com
→ 401, www-authenticate: Basic realm="BLKOUT CRM", no access-control-allow-origin
GET crm.blkoutuk.cloud/join → 401
```

The browser aborts at the preflight; the person filling in the form sees nothing. Confirmed the
endpoint is genuinely referenced in both shipped bundles, searched two ways after a fixed-width
grep gave a false negative: `events.blkoutuk.com/assets/index-CFRX1RaT.js` contains
`crm.blkoutuk.cloud`; `news.blkoutuk.com/assets/index-tGEAG4Uk.js` contains `community/join`.

Live on: **events.blkoutuk.com** (Footer, every page), **news.blkoutuk.com** (homepage),
`apps/blog`, and **`/movement`**, whose "Get the newsletter" CTA lands on a Basic auth prompt —
that page is under active promotion to 29 September.

Onset date unknown; not reproduced in a real browser (automation is dead in this WSL2 setup). The
mechanism is conclusive. ~Half a day: exempt `/api/community/*` from the Basic auth middleware
(the route already carries a correct CORS allowlist), or repoint the widgets at SendFox.

**This is the one cross-app HTTP call already live in the estate, it is broken across three public
sites, and nobody noticed.** That is the empirical answer to "who notices when a link breaks",
and it is the strongest argument against the LINK strategy I proposed.

## 3. What the council refuted in my plan

| My claim | Verdict | What actually holds |
|---|---|---|
| "Point Funding at `crm.blkoutuk.cloud/api/crm/grants`, exactly the Openings pattern" | **REFUTED** | CRM is HTTP Basic, not Supabase sessions. Preflight 401s with no ACAO header, so a browser can never complete it. The route itself has no per-request authz and runs on the service-role key. Making it work means a shared password in a public bundle |
| "CRM = the record; point Finance there" | **REFUTED** | `financial_transactions` = **0 rows**. CRM `/financial` renders £0 with no error. The books are `finance.json` in Mission Control. I would have swapped one fiction for another, and because both render zeros nobody would have noticed |
| "Rebuild the tiles on `metrics.*`" | **REFUTED as written** | `metrics` schema ACL grants USAGE to `service_role` only; PostgREST returns `406 PGRST106 — only public, graphql_public are exposed`. Unreachable from an SPA on the anon key. Needs a server route in `api/` — which now *depends* on the Node 22 fix, rather than being independent of it |
| Phase 0: "add a read policy to `grant_pipeline`; verify anon SELECT returns 12 rows" | **REFUTED — creates a new exposure** | The anon key is in the public bundle. That criterion publishes live bid amounts, funders and decision dates. Correct criterion: **unauthenticated returns zero; a logged-in admin returns 12** |
| "12 pre-existing type errors" | **REFUTED** | `tsc -b` exits 0 across all three configs. I carried this from a stale memory note without testing it |
| "Herald cron jobs run in production" | **REFUTED** | `server.ts` registers request routes only. `api/herald/cron/*` was written for Vercel and is dead under Coolify |
| Leak site is `useSocialConnect.ts` / `canva/auth.ts` | **REFUTED** | Those are `!!(...)` booleans, constant-folded to `!0`. The real inlining is `src/services/socialsync/platforms/index.ts:25-31` and its duplicate, plus `src/services/socialsync/gemini.ts:7` |
| Canva / YouTube / Heartbeat secrets also leak | **REFUTED** | Absent from the bundle — not set as Coolify build args. The ARG/ENV plumbing is present, so adding them to Coolify would leak them silently. Loaded gun, not a live leak |
| "9 `metrics.*` views, already built" | **PARTIALLY** | The migration defines **8**. A 9th (`events_page_state`) exists in the live DB and in no file — definition drift already |
| "32 undefined Tailwind tokens" | **CONFIRMED, count off** | 35, not 32. Zero in the built CSS, verified by compiling and diffing |
| Row counts, last-writes, dead buttons, mock fallbacks, the Node 20 outage, both RLS holes, the ICS and ivor-core dashboard endpoints | **ALL CONFIRMED** | Independently re-derived |

## 4. What the council found that I missed

- **18+ further tables with unconditional anon/PUBLIC write policies**, including
  `social_media_queue` (the `/admin/drafts` approve target), `socialsync_agent_tasks`,
  `moderation_queue`, `financial_transactions` (anon insert — directly undercuts the Financial
  Regulations adopted 26 Aug), `news_votes`, `land_studio_episodes`.
- **The `metrics.*` views sit on anon-writable ground.** They read `first_gestures`,
  `event_rsvps`, `news_votes`, `news_articles`, `events` — all anon-writable today. "Every number
  traceable to a query" is right, but a traceable number computed over a publicly-writable table
  is not yet a trustworthy one. Closing the write policies is a **precondition** for Phase 2.
- **Two relational views nobody surfaced**: `public.open_loops` (22 rows — named people,
  `days_since_met`) and `public.unmet_gestures` (90). The being-met instrument exists; no UI reads it.
- **The being-met feed has recorded nothing for 18 days** (latest gesture 16 Aug). A tile would
  have rendered that silence as a stable number.
- **The 90 unmet are the cohort already ruled on** — 90 of 90 are the `events` surface, the
  picnic/GBP cohort Rob closed on 28 August. A `first_gestures_summary` tile would make a number
  Rob has already declared blind into the permanent headline of the prime metric.
- **`ValuesCheck.tsx`'s only importer is the page Phase 1 deletes.** The only code in the estate
  that asks "do the people shown authentically represent Black queer men?" before publish would be
  orphaned. Rehome it on the `/admin/drafts` approve path in the same commit.
- **No role gating anywhere.** `useAuth.tsx:52` reads `user_metadata.role` (self-writable in
  Supabase), and no component gates on it. One auth user exists, so nothing is exposed today — but
  "add `/admin/account` to the sidebar" is not an answer to "who else can use this".
- **Two auth fail-opens**: `useAuth.tsx:41` returns `MOCK_USER{role:'admin'}` whenever
  `isSupabaseConfigured()` is false, and `Dockerfile:22` defaults `ARG VITE_AUTH_DISABLED=true`.
  Live build is verified auth-ON (`bA=!1` in the bundle); both are one env slip from a public admin.
- **No root `package-lock.json`.** Both `npm install` calls re-resolve semver on every build.
  That floating resolution is what introduced the supabase-js Node≥22 requirement. node:22 fixes
  today's symptom; the missing lockfile is the mechanism that produces the next one.
- **No health endpoint at all** — `/api/health` and `/healthz` both 404. The hardcoded green
  "All Systems Operational" dot has nothing to check even if it were wired.
- **Two hardcoded consumers of the secrets due for rotation**:
  `platform/scripts/linkedin-auth.mjs:15` and `twitter-auth.mjs:64`. They break on rotation.
- **`.dockerignore` excludes `.env.local` but not `.env`.** Not exploitable under Coolify (builds
  from a clone), but any local `docker build .` bakes 25 secrets into an image layer permanently.
- **Five distinct auth models across the estate**: comms (Supabase session), CRM (HTTP Basic),
  ivor-core (**none — all 25 route modules mount bare**), events-calendar (bearer-verified server
  routes *and* a hardcoded `BLKOUT2025!` in client source), Mission Control (localhost). The LINK
  strategy silently assumed one.

## 5. The council itself is broken

Asked whether the existing `CouncilService` was worth surfacing, the Estate seat found it running
weekly and failing silently. `GET ivor.blkoutuk.cloud/api/council/sessions`, no credentials:

| Date | Status | Score | Duration | Verdict |
|---|---|---|---|---|
| 2 Sep | completed | 0.5 | 1,776ms | `[herald unavailable this session]` |
| 19 Aug | completed | 0.5 | 1,271ms | `[herald unavailable this session]` |
| 12 Aug | completed | 0.9 | 15,974ms | real deliberation |

It broke between 12 and 19 August. Both failed runs record `status: completed` with a numeric
liberation score and empty rankings. 26 Aug is missing entirely.

Chair's addition, which no seat caught: **the sessions that "worked" were not useful either.**
Every real deliberation from 24 June to 12 August is about a Christmas advent campaign — "Let's Go
OUT OUT this Christmas", "Unwrapping Liberation: 24 Days" — scoring itself 0.85–0.95 in midsummer.
It ran weekly on a stale use case, then broke, and nobody saw either because no UI ever read it.

That endpoint also returns 200 unauthenticated, so BLKOUT's council deliberations and dissent text
are on the open internet.

## 6. Revised plan

### This week — external forcing function, do regardless of capacity

1. **Close the anon reads** on `contacts`, `hub_members`, `cf_fundraising_drafts`,
   `newsletter_preferences`. Scope to `is_current_user_admin()`.
   *Verify:* unauthenticated count-only returns 401/0; an admin session returns the real count.
2. **Fix the newsletter signup** on events, news, blog and `/movement`. It is community-facing,
   live, and `/movement` is promoted to 29 Sept.
3. **Take "Community Members: 2,847 ↑5.2%" off the dashboard.** BLKOUT has zero CBS members and
   an AGM in November where every director stands down under Rule 70 and a s84 audit-disapplication
   must carry. A director reading that screen forms a materially wrong view of the one fact their
   duties turn on. It belongs here, not in Phase 2 with the tidying.
4. **Rotate the Gemini key**; strip the six `CLIENT_SECRET`/`GEMINI` ARG+ENV pairs; **delete the
   corresponding Coolify vars** (otherwise the next person re-adds the ARG and the leak returns);
   update `linkedin-auth.mjs` and `twitter-auth.mjs` in the same action.
   For the four OAuth secrets: **delete the apps at the provider rather than rotating** — Zapier
   holds its own connections and does the publishing.
   *Verify:* re-grep the redeployed bundle for each value → 0.
5. **`news_articles` / `events` write policies.** *Verify behaviourally, not from `pg_policy`*:
   approve a test row from comms `/admin/events`, from events.blkoutuk.com/moderation, and from
   news moderation — events-calendar writes status with the browser anon client and has no route
   guard, so scoping can break the surface where openings are waiting.
6. **Ride-alongs**: commit `node:22-alpine` (both stages — the builder is EOL and Vite's floor is
   one patch away), add a root lockfile and `"engines": {"node": ">=22"}`, add `.env` to
   `.dockerignore`, add a real health endpoint that names the service and reports Supabase
   connectivity.
7. **Log the closure** in `~/blkout/governance/readiness/evidence-register.md` in the same session
   (guardrail 10; precedent set 6 Aug).

**Dropped from Phase 0:** the `grant_pipeline` anon read policy. It creates an exposure rather
than closing one.

### Also worth doing while you are in there — about half a day

Delete the seven retired routes, `DashboardStats.tsx`, `AnalyticsPage.tsx`, `SettingsPage.tsx` and
`src/socialsync-content-generation/` — **rehoming `ValuesCheck.tsx` onto the `/admin/drafts`
approve path in the same commit**. Fix the 35 undefined Tailwind tokens, verified by diffing built
CSS. Delete `YEAR1_PROJECTION`, keep the subscriptions panel — **and delete its hardcoded
`SUBSCRIPTIONS` fallback at `Finance.tsx:248`**, which is the same silent-fallback pattern the plan
was written to eliminate.

Fix `Drafts.tsx` `handleReject`, which alerts "✅ Draft rejected" and writes nothing. A control
that reports success for work not done is the worst bug in the app.

### Defer to January, with the membership work

Phases 2 and 3 as written. The council was unanimous on feasibility (2.25/5): 4.5 days claimed
against 10–16 real, at a measured velocity of ~14 admin commits in six months, in the month of
BBJC (8 Sep), AKO (11 Sep), CLY (17 Sep) and the National Conversation (23 Sep), with the AGM
following. Building a metrics pipeline in September to display "0 members" is premature —
`memberships_by_tier` correctly returns zero rows until Beam Day. In January there will be numbers
worth fetching.

Phase 3 is not a task. Write "no panel renders a number it did not fetch this session" into the
repo's `CLAUDE.md` and apply it when you touch a panel.

### Two open questions for Rob, not for me

- **The Newsletters page (1,107 lines).** The Delivery seat argues for deleting it outright: the
  `blkout-newsletter` skill delivers the edition end-to-end. Its supporting reason — "SendFox has
  no campaign-send API" — comes from the skill, written 31 July, and is **contradicted by the
  SendFox tooling now available, which exposes `create-campaign` and `send-campaign`.** If that
  path works, your monthly manual paste is avoidable, which matters more than the dashboard does.
  Untested, and testing means sending real mail — a deliberate trial, not a casual one.
- **The council.** Fix it, or retire it? It has produced 24 real deliberations and is currently
  producing degraded ones that report as successful. Either way, close the unauthenticated
  `/api/council/sessions` endpoint.

## 7. Dissent preserved

Recorded because the chair overruled or deferred these, and a minority view should survive.

**1. Community & Values — the diagnosis is one level too shallow.** *"The invented data is the
symptom. Somebody built 'Trust Score' and 'Engagement Quality' because the organisation genuinely
needs to know whether it is meeting people, and had no instrument — so they wrote the answer down.
Delete the fictions and, unless `open_loops` takes their place, the need is still unmet and the
dashboard is merely quieter about it. The measure of success is not 'every number traceable to a
query' — it is that a person opening `/admin` learns the name of someone BLKOUT has left waiting."*

Chair: upheld in principle, deferred in timing. It is the best argument in the whole review and it
belongs in the January work, not in a week that already contains a data exposure.

**2. Community & Values — the deletions are not costless.** Removing `/admin/socialsync` removes
the last route by which anyone who is not Rob-at-a-terminal can make a BLKOUT image, weeks before
the magazine commissions. Retiring is still right; the bottleneck is now named and unsolved.

**3. Estate Architecture — HTTP between apps should require justification, not be the default.**
Five apps, one Postgres. The Openings tab worked for reasons specific to it. Generalised, the
pattern buys a network hop, a second auth model and a CORS surface per hop, to reach data already
in the same database. Chair: upheld in full. The rule is **one writer per table; reads cross
boundaries through SQL**.

**4. Security — "3 routes work" is measured against the wrong bar.** `/admin/news` and
`/admin/events` write through *because the tables accept writes from anyone*. Counting them as the
healthy third of the dashboard, and building Phase 2 on that model, encodes the hole as the pattern.

**5. Delivery — the disposition table is ~60% real delegation, 40% relabelled deletion, and should
say which.** Three LINK targets are genuinely browser-callable. Six CRM ones are hyperlinks to a
Basic auth prompt in another app. Where the relocation is real — `blkout-image-gen`, Zapier,
Mission Control — it is better than the button was. Where it isn't, the honest sentence is *"we
are choosing to stop offering this here, and here is why"* — which is what Rob asked for. He asked
for the reason to be recorded, not for every row to end in a link. Chair: upheld. The disposition
doc is amended accordingly.

**6. Delivery — the plan installs new silent failures while fixing old ones.** ivor-core's
dashboard API returns `{"success":true,…,"total":0}`, and its demo-mode fallback returns a 200 with
*the same empty shape*. A panel fed by it cannot distinguish "nothing pending" from "ivor-core lost
its database credentials". Any cross-app panel must name which app answered and when, and render
FAILED rather than an empty state.

**7. Delivery — the whole exercise is the wrong September priority.** Chair: upheld, with the
security items and the signup fix carved out as this week's work.