# /admin — disposition of every non-functioning control
**3 September 2026.** Companion to `admin-dashboard-review-2026-09-03.md`.
Rule: **nothing is removed until its intent has a named home.**

Every control below was built to do something. Each row says what, where that capability lives
now, and what happens to the control. Three outcomes only:

- **LINK** — the capability is already live somewhere in the estate. The button becomes a link or
  a fetch. No new capability built.
- **WIRE** — the capability exists in this repo, unconnected. Connect it.
- **BUILD / RETIRE** — genuinely nowhere. Either build it here, or retire it with the reason
  recorded so the intent isn't silently lost.

## Corrections to the first review

- `Newsletters.tsx:694` and `NewsletterArchive.tsx:409` are **not dead** — they are hover-dropdown
  parents whose children carry the `onClick`. Export works.
- I was going to point Analytics at ivor-core's `/api/analytics/*`. **Don't.**
  `analyticsRoutes.ts:162-167` reads `current.totalUsers || 1247`, `|| 423`, `|| 87.5` over an
  in-memory Map that empties on restart, with `topRegion: 'London'` a string literal. The live
  endpoint returns exactly those numbers. It is the same fiction at a different URL.
  ivor-core's **`dashboardRoutes`** is the real one — verified below.

## What already exists (checked, not assumed)

| Capability | Where | Verified |
|---|---|---|
| Grant pipeline UI | **CRM** `crm.blkoutuk.cloud/grants` + `/grants/[id]` (341 + 577 lines), `app/api/crm/grants/route.ts` reads `grant_pipeline` | live, 401-protected |
| Finance ledger UI | **CRM** `/financial` (458 lines: transactions, summary, monthly breakdown) + Mission Control `finance.json` | source read |
| Evidence register UI | **CRM** `/evidence` (387 lines) | source read |
| ICS calendar export | **events-calendar** `/api/calendar` | `200 text/calendar`, 6,868 bytes |
| Content status report | **ivor-core** `/api/dashboard/content-summary` | `200`, real 7-day window (16 events, 6 approved) |
| Moderation queue counts | **ivor-core** `/api/dashboard/moderation-queue` | `200`, 0 pending — matches direct DB query |
| Openings moderation | **events-calendar** `/api/pending-openings` | `401` unauthenticated, correct |
| Publishing to IG/FB/LI | **Zapier MCP + cloud routines** (posting playbook) | proven end-to-end 5 Aug |
| Branded image generation | **`blkout-image-gen` skill** | carries logo overlay, reference image, crop rules |
| Newsletter production | **`blkout-newsletter` skill** | front door, end-to-end |
| Bid writing | **`uk-community-funding` skill** | — |
| Values check on content | **this repo**, `src/components/shared/ValuesCheck.tsx` | used by SocialSyncEditorial |
| Content editor | **this repo**, `src/components/campaigns/ContentEditor.tsx` | — |
| Bid templates | **`bid_writing_templates`** table, 5 rows | queried |
| Community metrics | **`metrics.*`**, 9 views, defined in `crm/migrations/008_metrics_views.sql` | listed |

## Control-by-control

### Dashboard (`/admin`)

| Control | Intent | Disposition |
|---|---|---|
| "Create New Content" | start a piece | **LINK** → `/admin/calendar` new-item flow |
| "Review Drafts" | go to drafts | **LINK** → `/admin/drafts`. It was always a nav link; make it a `<Link>` |
| "View Analytics" | go to analytics | **RETIRE** — redundant once the tiles on this page are real |
| 4 mock stat tiles | show how BLKOUT is doing | **BUILD** on `metrics.first_gestures_summary`, `memberships_by_tier`, `event_interest_by_event`, `grant_pipeline_live` |
| "Recent Content" panel | recent activity | **WIRE** — currently queries a table named `content` that doesn't exist. Point at `content_calendar` + `socialsync_agent_tasks` |

### Content Calendar (`/admin/calendar`)

| Control | Intent | Disposition |
|---|---|---|
| "Export ICS" | download the calendar | **LINK** → `https://events.blkoutuk.com/api/calendar`. One `<a download>`. Already returns valid iCal |
| "Status Report" | progress summary | **LINK** → fetch `ivor.blkoutuk.cloud/api/dashboard/content-summary` and render it |
| "Newsletter Brief" | brief from scheduled content | **WIRE** → `/api/herald/generate` once Node 22 ships; the `blkout-newsletter` skill remains the front door for the actual edition |
| "Bulk Schedule" | schedule many posts | **RETIRE the button, BUILD the panel.** Publishing is solved by Zapier routines and must not be re-implemented here. Replace with a read-only "next scheduled posts" panel so the calendar shows what the routines will do |

### Campaigns (`/admin/campaigns`, `/admin/campaigns/review`)

| Control | Intent | Disposition |
|---|---|---|
| "Deploy All" / "Deploy Campaign" / "Sync Now" | push to platforms | **RETIRE → LINK.** Zapier owns publishing. Surface routine status + last-run, not a second publisher |
| "AI Content Review" | values check | **WIRE** — `ValuesCheck.tsx` is in this repo already |
| "Generate Brief" | campaign brief | **WIRE** → herald, post-Node-22 |
| "ICS Export" / "Status Report" | as above | **LINK**, same endpoints |
| "View Details" | open a campaign | **WIRE** → `<Link>` to the campaign |
| Eye / Edit icons on posts | preview + edit a post | **WIRE** → `ContentEditor.tsx` |
| "Export All" | campaign pack | **BUILD** — small; or retire if the ICS + status report cover it |
| `/admin/campaigns/review` whole page | review before launch | **RETIRE** — hardcoded Holiday-2025 JSON. Its one live capability (newsletter preview) folds into `/admin/campaigns` |

### Funding (`/admin/fundraising`)

The whole surface duplicates the CRM, which owns `grant_pipeline`.

| Control | Intent | Disposition |
|---|---|---|
| Pipeline tab (reads stale `grants`) | see live bids | **LINK** → call `crm.blkoutuk.cloud/api/crm/grants`, exactly the Openings-tab pattern. Needs the `grant_pipeline` RLS policy first |
| "New Opportunity" / "Add Opportunity" | add an opportunity | **LINK** → CRM `/grants`. One writer, not two |
| "View Templates" | see bid templates | **BUILD** — small. `bid_writing_templates` has 5 rows and no UI anywhere in the estate. This is a genuine gap |
| "Start Writing" | begin a bid | **LINK** → CRM `/grants/[id]`; `uk-community-funding` skill does the writing |
| "AI Writing Help" / "Ask AIvor" | AI bid support | **RETIRE** — the skill is the route, and a button that opens a chat you'd have anyway is friction. If it stays, it links to IVOR |
| "View All Documents" | bid documents | **LINK** → CRM grant detail (`application_document_url`, `budget_document_url` live on `grant_pipeline`) |
| Pipeline card arrow | open a grant | **LINK** → CRM `/grants/[id]` |
| CF Outreach tab | steward funder relationships | **KEEP + WIRE** — 17 drafts, all still `draft` since 21 May while Fenton is recorded sent. Status needs to write back |

### Settings (`/admin/settings`)

| Control | Intent | Disposition |
|---|---|---|
| "Save Changes" | persist settings | **WIRE** — a Save button that discards is the worst control on the site |
| Agent enable/disable toggles | turn agents on/off | **WIRE** → `agent_configurations.is_active`. Show all **6** (currently hardcoded to 4; `concierge` and `herald` are missing) |
| Frequency / auto-approve dropdowns | agent scheduling | **BUILD or RETIRE** — no scheduler consumes these. If agent runs are Zapier/cron-driven, retire the dropdowns and link to the routine list |
| Platform connect/disconnect | connect socials | **BUILD** — reads `socialsync_platform_connections`, a table that does not exist. Either create it and move OAuth server-side, or retire the tab and point at Zapier, which is what actually posts |
| "Set up your Supabase project…" | dev onboarding | **RETIRE** — belongs in the README |

### Drafts (`/admin/drafts`)

| Control | Intent | Disposition |
|---|---|---|
| "Reject" | reject a draft | **WIRE — correctness bug.** It currently alerts "✅ Draft rejected" and reloads without writing anything. It reports success for work not done |
| "Edit" | edit a draft | **WIRE** → `ContentEditor.tsx`. Currently `alert('coming soon')` |
| "Approve" | queue for publishing | **WIRE** — writes to `social_media_queue` (0 rows). Confirm whether Zapier reads that table; if not, approval should tag the row the routine actually reads |

### Whole pages

| Page | Intent | Disposition |
|---|---|---|
| `/admin/analytics` | community metrics | **BUILD on `metrics.*`.** Not ivor-core analytics — see correction above |
| `/admin/pipeline` | brief → script → visual → review → schedule | **The intent is real and unserved as a single flow.** It exists as a skill chain: `aivor-scriptwriter` → `blkout-image-gen` → `/admin/calendar` → Zapier. Either persist the page to `content_calendar` (it's in-memory today, everything lost on refresh) or retire it and document the chain. My recommendation: persist it — it's the only place the whole flow is visible |
| `/admin/socialsync`, `/admin/editorial` | branded image/video generation | **RETIRE → skill.** `blkout-image-gen` carries the branding rules these bypass. Keep `ValuesCheck.tsx`, which is the genuinely valuable part |
| `/admin/digestvid` | weekly AIvor video | **MOVE.** It's a launcher for `localhost:8900` — a local tool. Mission Control already has a "Routines & tools" panel, which is where local launchers belong. Retire the route, add the entry there |
| `/admin/finance` | budget vs actual | **SPLIT.** Keep the subscriptions panel (live, 24 rows, correct). `YEAR1_PROJECTION` with every `actual: 0` → **LINK** to CRM `/financial` and Mission Control |

## Two dashboards, and which owns what

The estate has two: **Mission Control** (local, `localhost:8765` — Today, Calendar, Finance, Events
moderation, Open commitments, Signals, Routines & tools) and **comms /admin** (web, shared).
They already overlap on Events moderation and Finance. Worth settling deliberately:

- Mission Control = **Rob's cockpit.** Local tools, commitments, the day.
- comms /admin = **the shared operational surface.** Moderation queues, newsletter, calendar —
  things another person could pick up.
- CRM = **the record.** Grants, contacts, financial transactions, evidence.

On that split, `/admin/finance` and `/admin/fundraising` are surfaces of *the record*, and should
read from the CRM rather than hold their own version.

## Revised counts

Of roughly 30 non-functioning controls: **12 LINK** (capability already live), **11 WIRE** (exists
in this repo, unconnected), **3 BUILD** (real gaps: bid-template list, platform connections,
metrics-backed analytics), **4 RETIRE with the reason recorded** (superseded by skills or routines).

Only four things actually disappear, and each has a written reason.