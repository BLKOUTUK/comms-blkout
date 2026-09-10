# Re-cut against the December horizon
**3 September 2026.** Supersedes the phasing in `admin-dashboard-review-2026-09-03.md` and the
January deferral in `council-verdict-2026-09-03.md`. The audit and disposition findings stand; the
schedule does not.

## The constraint changes the deliverable

Rob, 3 Sep: *"nothing belongs in January, I'll be winding dev funding down before the new year."*

The council reached unanimous agreement on deferring Phases 2 and 3 to January "with the membership
work, when there will be numbers worth putting on a tile." There is no January. Every seat scored
feasibility 2–3 against a runway that does not exist.

**With no development capacity after December, the question stops being "what should the dashboard
do" and becomes "what must be true about this estate before nobody is maintaining it."** On that
question the answer inverts: **deletion stops being cleanup and becomes the main deliverable.**
Every route, cron, integration and fallback left in place from January is something that can break
with nobody to notice or fix it — and this estate's dominant failure mode, documented across 100
kaizen entries, is breaking *without erroring*.

Three consequences:

1. **Nothing defers.** Work that was "later, when it's worth more" is now "before December, or never."
2. **Anything that renders plausible data when its source is unreachable must go before the
   maintainer does.** A mock fallback is survivable while someone is watching. It is not survivable
   afterwards — it is a system that lies to a board with no one left to catch it.
3. **Beam Day (28 Dec) is inside the window. The magazine (Jan–Mar) and Convention Zero (Jun '27)
   are outside it.** Whatever those need from the platform must exist by December or they run
   without platform support. That is a bigger decision than the dashboard.

## What this voids

| Was | Now |
|---|---|
| "Defer Phases 2 and 3 to January, with the membership work" | Void. No January |
| "Building a metrics pipeline in September to display 0 members is premature — revisit when there are numbers" | Inverted. If it isn't built before December it never is; and `memberships_by_tier` starts filling on 28 Dec, three days before the runway ends |
| Community & Values dissent: "surface `open_loops`, it belongs in January" | Upheld and **moved forward**. It was deferred purely on timing |
| "Phase 3 is a convention, not a task — apply it when you touch a panel" | Fails. There is no stream of future touches to ride on. Either the mock fallbacks come out in a deliberate pass this autumn, or they ship into a permanent state |
| The whole "LINK to another app" strategy | Weakens further. Cross-app HTTP adds things that can break unattended, and the estate already proves nobody notices — the CRM signup has been broken across three public sites for an unknown period |

## Re-cut: three tiers to end of December

### Tier 1 — Safety. September, non-negotiable.

Unchanged from the verdict except that the lockfile moves up sharply in importance.

1. Close the anon reads — `contacts` (3,294), `hub_members` (81), `cf_fundraising_drafts` (17),
   `newsletter_preferences` (11). *Verify: unauthenticated count-only returns 401/0.*
2. Fix the newsletter signup on events, news, blog and `/movement`.
3. Take "Community Members: 2,847" off the dashboard — before the November AGM, not after.
4. Rotate Gemini; strip the ARG/ENV pairs; **clear the Coolify vars**; update `linkedin-auth.mjs`
   and `twitter-auth.mjs`. Delete the four OAuth apps at the provider rather than rotating them.
5. Scope the `news_articles` / `events` write policies. *Verify by approving a test row from each
   of the three moderation UIs, not from `pg_policy`.*
6. **Root `package-lock.json` + `"engines": {"node": ">=22"}` + `node:22-alpine` on both stages.**
   This was a hygiene item; it is now load-bearing. With no lockfile, both `npm install` calls
   re-resolve semver on every build — which is exactly how the supabase-js Node≥22 break arrived.
   A rebuild that fails in March with no developer is a dead site, and the next one will not have a
   one-line fix waiting in the tree.
7. `.env` into `.dockerignore`. A real health endpoint that names the service and reports Supabase
   connectivity — because from January, an alert is the only thing standing in for a developer.
8. Log the closure in the evidence register.

### Tier 2 — Reduce the surface that can rot. October.

This is now the main event, not a side-effect.

- **Delete the retired routes**, rehoming `ValuesCheck.tsx` onto the `/admin/drafts` approve path
  in the same commit. Every route kept is a route that can break unattended.
- **Rip out the mock fallbacks — all 11 hooks, deliberately, in one pass.** Not "on touch." A hook
  that returns invented grants from a `catch` is a system that will lie to the board about the
  funding pipeline the first time RLS or a schema change bites, with nobody watching. This is the
  single highest-value change in the whole review under the new constraint, and it was the thing
  the council was most willing to defer.
- **Retire the council rather than fixing it.** A weekly LLM job that burns GROQ credits,
  deliberates on a Christmas campaign in midsummer, has failed since 19 August, and records its
  failures as `status: completed` is a pure liability with nobody watching. Close the
  unauthenticated `/api/council/sessions` endpoint at the same time.
- **Audit the 17 scheduled workflows and kill what isn't earning.** `email-dns-health.yml` has
  never run once. Every cron retained past December must be one whose failure someone would notice.
- Fix the 35 undefined Tailwind tokens; delete `YEAR1_PROJECTION` and the hardcoded
  `SUBSCRIPTIONS` fallback at `Finance.tsx:248`; fix `handleReject`, which reports success for work
  it does not do.
- Correct `CLAUDE.md`: events-calendar's remote is `BLKOUTUK/black-qtipoc-events-calendar`, not
  `BLKOUTUK/events-calendar`.

### Tier 3 — Build what cannot be built later. November–December.

This is where the dashboard question actually gets answered, and the answer is smaller than the
original plan.

- **`open_loops` on `/admin`, before the AGM.** The Community seat's argument now has a deadline:
  *"the measure of success is that a person opening /admin learns the name of someone BLKOUT has
  left waiting."* 22 named people with `days_since_met` are sitting in a view nobody reads. It is
  one page against an existing view — days, not weeks — and after December it never gets built.
  Note the feed has recorded nothing since 16 August; that needs diagnosing first, or the page
  renders a stale silence as calm.
- **Whatever Beam Day needs, done by early December.** Membership opens 28 Dec, three days before
  the runway ends. It cannot be the last thing built.
- **A metrics route in `api/` using the service role** — the only way any tile reaches `metrics.*`,
  and it needs the Node 22 fix under it. Build it once, for the tiles that will still matter in
  March: open loops, pending moderation, live bids.
- **Not** the CRM link, the Settings platforms tab, ContentPipeline persistence, or the campaign
  surfaces. Under this constraint they are new maintenance with no maintainer.

## The decision that outranks the dashboard

Five deployed apps, 17 scheduled workflows, a VPS, Coolify, Supabase, and five distinct
authentication models — for one organisation, about to have no developer. The dashboard is a
symptom of that, not the problem.

**Recommendation: spend the autumn reducing the estate rather than improving it.** The measure for
every December decision is *"if this breaks in March and nobody fixes it, what happens?"* Where the
answer is "a public site stops working", it must be simplified or made boring now. Where the answer
is "nobody notices" — that is the argument for deleting it, not for maintaining it.

That framing also settles the two open questions from the verdict. **Delete the Newsletters page**:
1,107 lines whose capability is delivered by a skill, and untenable to maintain unattended — though
test `send-campaign` first, because if SendFox's API can send, the monthly manual paste is designed
out, and *that* is worth building before December. **Retire the council** rather than fixing it.

## Correcting my own record

The January deferral was mine as chair, endorsed unanimously by four seats. It was wrong, and it
was wrong on information only Rob held — the funding runway. Worth noting for the next review of
this kind: **every seat was asked to score feasibility, and not one asked how long the money
lasts.** Capacity was assessed against the calendar and the commitments list; nobody checked the
runway. That is the question that should have been in the brief.

---

## Actions taken (running log, 3 Sep 2026)

> Recovered 10 Sep 2026 from the session transcript: the original file was written to this path on 3 Sep, never committed, and was missing from disk by 10 Sep. The Tier 1 items 1–2 entries that preceded this were not recoverable; memory `project_anon_reads_closure_2026_09_03` holds the complete record.

### Items 3–8, later the same day

- **3 · No fiction on /admin** — the three mock tiles and hardcoded ↑5.2% deltas replaced by live 7-day event and moderation counts from ivor-core (`useIvorDashboard`, no fallback value — "unavailable" on failure); quick actions are links, "View Analytics" retired; `/admin/analytics` no longer renders mock metrics; `useContent()` no longer substitutes mock content; the sidebar's hardcoded green dot now reads `/api/health`.
- **4 · Write policies** — 32 unconditional anon/PUBLIC write policies across 26 tables closed (`apps/crm/migrations/012_scope_write_policies.sql`), every writer traced first; the events→queue trigger made SECURITY DEFINER; `event_rsvps` public read closed ahead of Beam Day. Verified as the admin session in rolled-back transactions (news update 1, task update 1, event approve 1, queue readable) and as anon (0 rows, RLS refusals over REST, anon submissions still reach the queue). Left with reasons in the migration header: Compass/DR/`seen`/land-studio flows that need app-level auth. **New finding**: ivor-core's `/api/news/:id/moderate` and `/api/event-moderation/*` answer 200 unauthenticated — an API-layer hole RLS cannot fix.
- **5 · Secrets** — Gemini + Instagram/TikTok/LinkedIn/Twitter client secrets confirmed in the served bundle by value match. All `import.meta.env` secret references removed, Dockerfile ARGs gone, 14 Coolify vars deleted, sentinel build 0 hits, live bundle clean. `scripts/linkedin-auth.mjs` had the secret hardcoded → env var. Two deployment-guide docs held 44 plaintext values incl. the service-role key → redacted. **Rotation is Rob's**: the five above, plus YouTube/Canva at leisure.
- **6 · Build** — node:22 both stages, `engines >=22`, `package-lock.json` tracked (it was gitignored; the first push shipped `npm ci` without it and failed), `npm ci`, `VITE_AUTH_DISABLED` defaults false.
- **7 · `.env` out of the build context** (`.env`, `.env.*`) — it was being copied into every image and read by Vite.
- **8 · Health** — `GET /api/health` → `{service, status, node, commit, db}` with a real PostgREST probe, 503 when degraded. Live: Node v22.23.2, db ok; the herald route now returns its own 400 instead of the Node-20 500.

Tier 1 complete, bar Rob's rotation. The two SendFox unsubscribes were honoured at 09:35 on 3 Sep once Rob authorised them.

## Tier 2 — started 3 Sep 2026

### Phase 1 — retire and delete (done, same day)
Nine routes and 63 dead files removed; sidebar 14 → 10 (Pipeline, DigestVid, SocialSync, Analytics, Drafts out; Account in). Each retired intent's home is recorded in the commit message. Two corrections to the plan made on the evidence:
- **`/admin/drafts` retired, not wired.** It read `content_drafts` — a 2-row *versioning* table (`content_calendar_id`, `version_number`, `draft_content`…) with none of the fields the page rendered — so it only ever showed its mock fallback. Agent content awaiting review lives in `socialsync_agent_tasks` (7 of 101 tasks carry generated content, all still pending) and is already served by the ApprovalQueue on `/admin/agents`, which writes approve / reject / revision to the real rows.
- **`ValuesCheck` rehomed onto that ApprovalQueue approve button** — the only approve path — and the button now says "Approve", not "Approve & Publish": nothing reads approved tasks; posting is the routines' job.
- `/admin/design-studio` (not in the original list) retired too: Canva OAuth ran in the browser on a secret that is no longer in the client.

### Phase 2 — no hook falls back to invented data (done, same day)
Every `catch → mock` and `not configured → mock` branch removed from `useAgentActivity`, `useAgentTasks`, `useNewsletter`, `usePublicNewsletters` (which had been feeding the **public** Discover archive with invented editions), `useContent`; `src/lib/mockData.ts` deleted. The "Demo / Not Connected / Live Data" badges went with it — the sidebar health dot is the indicator.

**Funding repointed at `grant_pipeline`.** `useGrants` 1,252 → 260 lines; reads the CRM's live pipeline (15 rows) joined to `organizations`, mapped onto the card shape (stage→status; priority derived from stage + deadline and labelled as an ordering aid). The table had RLS on with **zero policies** — the reason the page never read it — so migration 013 adds an admin SELECT policy. Verified as the admin session: 15 rows with funders, 10 opportunities, 8 bid-progress rows. `opportunity_pipeline` and `bid_writing_progress` turned out to be views (RLS does not apply; anon has no grant).

### Phase 3 — Settings, Finance, Calendar (done, same day)
- **Settings** 622 → 130 lines: six agents from `agent_configurations` with an Enable/Disable that writes `is_active` (verified as the admin session); a "where things live" card for the retired controls. Platforms/Canva/General/Auth tabs gone; 15 orphaned files (platform connectors, Canva service, `useSocialConnect`, `useCanva`) deleted.
- **Finance** 758 → 200 lines: live subscriptions table only (24 rows), "—" until loaded, red panel on failure; ledger card → Mission Control + CRM. `YEAR1_PROJECTION`, the 5-year forecast and the break-even literals gone.
- **Calendar**: "Create Content" (linked to the retired editorial route) removed; quick actions wired — Newsletter Brief → Newsletters page, Export ICS → `events.blkoutuk.com/api/calendar` (verified text/calendar, 9 events), Status Report → live ivor-core counts, Bulk Schedule → read-only "next scheduled".
- **Tailwind tokens**: the 35 undefined tokens all lived in pages deleted in Phase 1. Verified by diffing every colour utility in src (401) against the built CSS: **0 missing**.

### Phase 4 — council, crons, Newsletters (done, same day)
- **Council retired** (ivor-core 833c530): the Wednesday cron, the unauthenticated `/api/council/*` routes (anyone could `POST /convene` and start an LLM session) and `CouncilService` removed; `council_sessions` (26 rows) kept as the record. Verified live: `/api/council/sessions` → 404, `/api/dashboard/content-summary` still 200.
- **Scheduled workflows audited** — 18 files, every one checked against its last three runs via `gh`:
  - *Zombies removed*: ivor-core `scrape-events.yml` (daily "success", posting to the pre-Coolify Railway host — 404); events-calendar `scrape-events.yml` (weekly "success", curling Netlify functions that return "Not Found"; `event-scraper.yml` is the one that writes); dreamcatcher hourly Gemini triage and align daily docker-publish (both auto-disabled by GitHub months ago — schedules removed, dispatch kept); the platform-root `ci.yml` (not in any repo).
  - *Failing*: ivors-compass `day30-digest.yml` — `Supabase 401` since 3 Sep; it uses `SUPABASE_ACCESS_TOKEN`, a Supabase *management* token → **Rob regenerates it** (Supabase dashboard → Access tokens) and `gh secret set SUPABASE_ACCESS_TOKEN -R BLKOUTUK/ivors-compass`.
  - *Correction*: comms `email-dns-health.yml` has "never run" because it was added on 2 Sep and fires Mondays; first run is 7 Sep. Keep.
  - *Earning, keep*: comms weekly-news-video + yt-token-health; events-calendar event-scraper (weekly, writes); news-blkout editorial-pick-request + monthly-news-report; seen ingest (Mon/Wed/Fri); the five weekly security sweeps.
- **Newsletters re-assessed with the API up**: herald preview renders (200, 18 KB, "BLKOUT — September 2026"); generation and agent execution routes answer. "Send to SendFox" used to mark the edition approved and hand back HTML with four paste instructions — the monthly manual step. SendFox's REST API accepts `POST /campaigns`, so the handler now creates a **draft** campaign (subject, preview, HTML, from BLKOUT ‹rob@blkoutuk.com›, chosen list) and returns its id; Send/Schedule stays in SendFox. The monthly default list pointed at "My First List", deleted in today's cleanup — now the Newsletter list.

**Tier 2 complete.** Left for Tier 3 (Nov–Dec): `open_loops` on `/admin` before the AGM, Beam Day needs, the server-side metrics route (and `/admin/analytics` with it).
