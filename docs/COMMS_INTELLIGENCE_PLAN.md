# BLKOUT Communications Intelligence System — Implementation Plan

**Purpose**: Transform comms-blkout from a content management tool into a communications intelligence platform that measures, learns, and recommends — accountable to organisational goals and liberation values.

**Core principle**: Are our communications serving our community and advancing our liberation goals?

---

## Architecture Summary

```
SOURCES              INGESTION           STORAGE            PROCESSING          INTELLIGENCE        OUTPUT
───────              ─────────           ───────            ──────────          ────────────        ──────
SendFox metrics  →   Sync Service    →   newsletter_        process_            Extractors      →   Herald generates
Site analytics   →   Umami API      →   performance         performance_        (8 SQL fn)          smarter content
Social APIs      →   Social Sync    →   content_            feedback()          Pattern             Admin dashboard
IVOR queries     →   Topic Agg.     →   performance         TRIGGER             Matcher             shows strategy
Preferences      →   (exists)       →   ivor_               (auto-adjusts       (10 rules)          Quarterly report
                                        intelligence        relevance)          Insight Gen.        to board
                                                                                comms_insights
```

**Key finding from audit**: ~60% of schema exists, ~30% of functions exist, 0% of ingestion exists. The bottleneck is data flowing in. Once it does, existing triggers activate automatically.

---

## Dependencies

```
Phase 0 ─────→ Phase 1 ─────→ Phase 3 ─────→ Phase 4 ─────→ Phase 5
Verify          SendFox         Recommendation   Herald          Strategic
schema          sync            engine           integration     alignment

                Phase 2 (parallel — no dependency on Phase 1 data)
                Dashboard
                activation

                Phase 6 (independent — can start anytime)
                Umami deploy
```

---

## Phase 0: Verify Infrastructure

**Goal**: Confirm existing analytics tables are applied to production Supabase.

**Context**: The audit found 14+ analytics tables across 6 migration files. These may or may not be applied to the production database. Nothing else works without them.

### Tasks

**0.1** Check which migrations have been applied to production Supabase.

```sql
-- Run against production
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;
```

Cross-reference against:
- `001_create_announcements_table.sql` — announcements, view_count
- `003_newsletter_and_herald_agent.sql` — newsletter_editions, newsletter_subscribers, newsletter_content_items, views, functions
- `004_social_media_workflows.sql` — content_analytics, analytics_summaries, social_media_queue, events
- `005_herald_content_selection_functions.sql` — 7 content selection functions
- `20260128_campaign_content.sql` — campaign_content, variants
- `20260129_newsletter_preferences.sql` — newsletter_preferences, unsubscribe_log, referrals

**0.2** Check community-platform analytics schema:
- `analytics-schema.sql` — content_analytics (liberation-aligned), community_trends, liberation_compliance_metrics, community_health_metrics, differential_privacy_metrics, ml_model_performance
- `003_content_performance_feedback_loop.sql` — content_performance, agent_quality_scores, ivor_intelligence, feedback_loop_events, newsletter_performance, views, triggers, functions

**0.3** Apply any missing migrations.

**0.4** Verify key functions exist:
- `process_performance_feedback()` trigger
- `boost_content_relevance()`
- `reduce_content_relevance()`
- `update_subscriber_engagement()`
- `get_herald_intelligence()`
- `get_newsletter_content()`

### Acceptance criteria
- All analytics tables exist in production Supabase
- All triggers and functions are registered
- `process_performance_feedback()` trigger is attached to `content_performance` table

---

## Phase 1: SendFox Metrics Sync

**Goal**: Pull campaign metrics from SendFox back into the database after each newsletter send. This single service activates the entire existing feedback loop.

**Why first**: Every downstream feature depends on real data in the tables. The `process_performance_feedback()` trigger will auto-adjust content relevance scores as soon as engagement data arrives — the feedback loop starts working immediately.

### Data flow

```
SendFox API                     Supabase tables
───────────                     ───────────────
GET /campaigns/{id}         →   newsletter_editions.open_rate, click_rate, unsubscribes
                                newsletter_editions.open_count, click_count, bounce_count
                                newsletter_editions.unique_opens, unique_clicks, spam_complaints

GET /campaigns/{id}/clicks  →   newsletter_content_items.click_count (per link/item)
                                newsletter_performance.top_clicked_links

Calculated from above       →   newsletter_performance.delivery_rate, click_to_open_rate,
                                peak_open_hour, avg_time_to_open

Per-subscriber engagement   →   newsletter_subscribers.total_opens, total_clicks,
                                last_engaged_at (via update_subscriber_engagement())

INSERT content_performance  →   TRIGGERS process_performance_feedback() automatically
  metric_type='engagement'      → adjusts ivor_intelligence.relevance_score
  source='email'                → logs feedback_loop_events
```

### Tasks

**1.1** Research SendFox API capabilities for campaign metrics retrieval.

SendFox API docs: `https://sendfox.com/api`
Key questions:
- Can we get per-campaign open/click stats?
- Can we get per-link click tracking?
- Is there a webhook option for real-time metrics?
- Rate limits?

**1.2** Build `api/herald/handlers/metrics-sync.ts`

Service that:
1. Queries `newsletter_editions` for editions with `status='sent'` and `sent_at` within last 7 days
2. For each, calls SendFox API to get campaign metrics
3. Updates `newsletter_editions` performance columns
4. Upserts into `newsletter_performance` table
5. Calculates per-content-item clicks and updates `newsletter_content_items.click_count`
6. Calls `update_subscriber_engagement()` for subscriber-level rollups
7. Inserts into `content_performance` (metric_type='engagement', source='email') — this fires the trigger

**1.3** Add API route and scheduling.

- `POST /api/herald/generate?action=sync_metrics` — manual trigger
- `GET /api/herald/generate?job=metrics_sync` — cron trigger
- Schedule: daily at 8am UTC (allows overnight email opens to accumulate)
- Also run 48hrs after each send (peak measurement window)

**1.4** Add to server.ts scheduling (alongside existing weekly scraper pattern).

**1.5** Test with a real sent edition — verify data flows through to `ivor_intelligence` relevance adjustments.

### Acceptance criteria
- After a newsletter send, metrics appear in `newsletter_editions` within 48hrs
- `newsletter_performance` populated with delivery/engagement data
- `content_performance` receives engagement records
- `process_performance_feedback()` trigger fires and adjusts relevance scores
- `feedback_loop_events` logs the adjustments

---

## Phase 2: Dashboard Activation

**Goal**: Replace mock data in admin pages with real Supabase queries.

**Can run in parallel with Phase 1** — even before SendFox sync is live, the dashboard can show real counts from existing tables (edition counts, subscriber counts, content counts).

### Tasks

**2.1** Replace `Analytics.tsx` mock data.

Current: hardcoded `mockCommunityMetrics` object
Replace with queries against:
- `newsletter_performance_summary` view — avg open/click rates, edition counts
- `newsletter_subscribers` — active count by tier
- `analytics_summaries` — daily engagement with connection_score
- `newsletter_editions` — recent edition performance

**2.2** Replace `AnalyticsPage.tsx` mock data.

Current: hardcoded platform engagement rates and agent stats
Replace with queries against:
- `content_analytics` — real social media metrics (when populated)
- `agent_quality_scores` — real agent performance data
- `agent_performance_trends` view — week-over-week changes

**2.3** Replace `DashboardStats.tsx` mock data.

Current: hardcoded "156 content items, 89 published"
Replace with:
```sql
SELECT COUNT(*) as total FROM newsletter_editions;
SELECT COUNT(*) as published FROM newsletter_editions WHERE status = 'sent';
SELECT COUNT(*) as scheduled FROM newsletter_editions WHERE status = 'scheduled';
-- engagement rate from newsletter_performance_summary view
```

**2.4** Wire `PerformanceAnalytics.tsx` to `newsletter_performance` table.

Currently reads from `NewsletterEdition` objects (which have the fields). Enhance to also show:
- `click_to_open_rate` from `newsletter_performance`
- `top_clicked_links` for content item analysis
- `peak_open_hour` for timing insights

### Acceptance criteria
- Admin dashboard shows real numbers from database
- Zero hardcoded mock data in analytics pages
- Dashboard updates as new data arrives (no page deploy needed)

---

## Phase 3: Recommendation Engine

**Goal**: Build the intelligence layer that interprets raw metrics into strategic recommendations.

**Depends on**: Phase 1 (needs real data flowing for meaningful patterns). Can begin development before Phase 1 is complete but needs data for testing.

**Minimum data needed**: 5 sent editions with metrics synced.

### Architecture

```
Extractors (SQL functions)  →  Pattern Matcher (rules)  →  Insight Generator  →  comms_insights table
```

### Tasks

**3.1** Create `comms_insights` table.

```sql
CREATE TABLE comms_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Classification
  insight_type TEXT NOT NULL,
    -- content_mix, timing, audience, campaign, alignment, anomaly, opportunity
  priority TEXT NOT NULL DEFAULT 'medium',
    -- critical, high, medium, low

  -- Content
  headline TEXT NOT NULL,
  detail TEXT,
  recommendation TEXT,
  data_points JSONB DEFAULT '{}',
  data_sources TEXT[] DEFAULT '{}',
  confidence NUMERIC(3,2) DEFAULT 0.5,
  liberation_context TEXT,

  -- Lifecycle
  status TEXT DEFAULT 'active',
    -- active, acted_upon, dismissed, expired, superseded
  acted_upon_at TIMESTAMPTZ,
  action_taken TEXT,
  action_outcome TEXT,
  outcome_measured_at TIMESTAMPTZ,

  -- Herald integration
  applied_to_editions UUID[] DEFAULT '{}',
  herald_weight NUMERIC(3,2) DEFAULT 0.5,

  -- Governance
  community_validated BOOLEAN DEFAULT FALSE,
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ,

  -- Temporal
  analysis_period_start TIMESTAMPTZ,
  analysis_period_end TIMESTAMPTZ,
  superseded_by UUID REFERENCES comms_insights(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comms_insights_active ON comms_insights(status, priority)
  WHERE status = 'active';
CREATE INDEX idx_comms_insights_type ON comms_insights(insight_type, created_at DESC);
CREATE INDEX idx_comms_insights_expiry ON comms_insights(expires_at)
  WHERE status = 'active';
```

**3.2** Create `comms_thresholds` table (community-configurable).

```sql
CREATE TABLE comms_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threshold_key TEXT UNIQUE NOT NULL,
  threshold_value NUMERIC NOT NULL,
  description TEXT,
  set_by UUID REFERENCES auth.users(id),
  set_at TIMESTAMPTZ DEFAULT NOW(),
  rationale TEXT
);

-- Default values (board can adjust)
INSERT INTO comms_thresholds (threshold_key, threshold_value, description) VALUES
  ('content_overperformance',      1.5,  'Over/under index above which content type is recommended for more space'),
  ('content_underperformance',     0.5,  'Below which content format should be investigated'),
  ('preference_gap_alert',         0.20, 'Demand-supply gap percentage that triggers alert'),
  ('trend_decline_alert',         -0.10, 'Percentage decline that triggers concern'),
  ('trend_improvement_notable',    0.15, 'Percentage improvement worth acknowledging'),
  ('liberation_content_minimum',   0.30, 'Minimum share of content that must be liberation-aligned'),
  ('unsubscribe_spike_multiplier', 2.0,  'Multiple of average unsubscribes that triggers anomaly'),
  ('campaign_fatigue_editions',    3,    'Consecutive declining editions before fatigue alert'),
  ('minimum_editions_for_analysis',5,    'Editions needed before generating insights'),
  ('churn_crisis_threshold',       0.05, 'Monthly churn rate that triggers alarm');
```

**3.3** Build 8 extractor functions (Supabase SQL functions).

Each returns a structured result set that the pattern matcher consumes:

| # | Function | Returns |
|---|----------|---------|
| 1 | `extract_content_type_performance(editions INT)` | content_type, space_share, click_share, over_under_index |
| 2 | `extract_send_timing(editions INT)` | day_of_week, hour, avg_open_rate, avg_click_rate, sample_size |
| 3 | `extract_preference_gaps()` | topic, demand_pct, supply_pct, gap, direction |
| 4 | `extract_engagement_trends(window INT)` | metric, recent_avg, previous_avg, change_pct, direction |
| 5 | `extract_campaign_effectiveness(campaign TEXT)` | campaign, edition_clicks[], momentum, cta_conversion |
| 6 | `extract_liberation_alignment(editions INT)` | category, liberation_score, engagement, trend, alert |
| 7 | `extract_subscriber_health(days INT)` | active, new, unsubscribed, net_growth, churn_rate, top_reasons |
| 8 | `extract_content_demand_signals()` | topic, ivor_queries, newsletter_coverage, gap |

**3.4** Build pattern matcher service.

`src/services/intelligence/PatternMatcher.ts`

Calls each extractor, compares results against `comms_thresholds`, produces insight candidates:

```typescript
interface InsightCandidate {
  type: InsightType;
  priority: Priority;
  headline: string;
  detail: string;
  recommendation: string;
  dataPoints: Record<string, number>;
  confidence: number;
  liberationContext: string;
}
```

10 pattern rules (see Logic Layer section for full specification).

**3.5** Build insight generator service.

`src/services/intelligence/InsightGenerator.ts`

- Takes pattern matcher output
- Deduplicates against existing active insights (don't repeat the same insight)
- Supersedes stale insights (mark old version as `superseded_by` new one)
- Sets expiry dates (default: 2 weeks for content_mix, 1 week for anomalies)
- Stores in `comms_insights`

**3.6** Add analysis trigger.

- `POST /api/herald/generate?action=run_analysis` — manual trigger
- Schedule: weekly, after metrics sync completes (e.g. Monday 9am UTC)
- Also triggered after metrics sync if sufficient new data

**3.7** Build insights admin view.

New component or tab in admin showing:
- Active insights ranked by priority
- Insight detail with data backing
- "Act on this" button (records action_taken)
- "Dismiss" button (with reason)
- History of past insights and their outcomes

### Acceptance criteria
- After 5+ editions with synced metrics, system generates meaningful insights
- Insights stored in `comms_insights` with data backing
- Pattern rules fire correctly against thresholds
- Admin can view, act on, and dismiss insights
- Stale insights auto-expire

---

## Phase 4: Herald Integration

**Goal**: Close the generation loop — Herald queries insights and past performance before generating content.

**Depends on**: Phase 3 (needs insight data to query).

### Tasks

**4.1** Modify Herald generation flow.

In `api/herald/generate.ts`, before content generation:

```typescript
// NEW: Query intelligence before generating
const intelligence = await getHeraldIntelligence();        // existing function
const activeInsights = await getActiveInsights();           // query comms_insights
const preferences = await getPreferenceProfile();           // aggregate newsletter_preferences
const contentPerformance = await getContentTypePerformance(); // extractor #1
```

**4.2** Implement content mix adjustment.

Herald currently uses fixed counts (weekly: 3 highlights, 5 events, 2 resources).
Adjust based on content type performance:

```typescript
function adjustContentMix(baseSpec, insights, preferences) {
  // If events over_under_index > 1.5, increase events by 1-2
  // If governance index < 0.5, don't remove — flag for format change
  // Ensure liberation content >= liberation_content_minimum threshold
  // Weight by subscriber preference demand
  return adjustedSpec;
}
```

**4.3** Add generation reasoning.

Attach a `generation_reasoning` JSONB object to each edition:

```json
{
  "content_selection": {
    "events": { "count": 5, "reason": "2.3x performance index, 68% subscriber demand" },
    "articles": { "count": 3, "reason": "Strong CTR, matches community_news preference" },
    "governance": { "count": 1, "reason": "Lower engagement — using Q&A format per insight INS-012" },
    "campaign": { "count": 1, "reason": "Board recruitment momentum positive" }
  },
  "timing_suggestion": "Tuesday 10am — 28% higher opens than current schedule",
  "alignment_check": "Liberation content at 40% — above 30% threshold",
  "insights_applied": ["ins-001", "ins-003", "ins-007"],
  "preference_alignment": {
    "events": { "demand": "68%", "supply": "35%", "status": "improved from 20%" }
  }
}
```

Store in `newsletter_editions.metadata` or a new `generation_reasoning` column.

**4.4** Display reasoning in admin preview.

When admin previews a generated newsletter, show:
- Why each content item was selected
- What insights informed the mix
- Timing recommendation
- Liberation alignment check result

**4.5** Update `applied_to_editions` on insights.

After Herald generates using an insight, update that insight's `applied_to_editions` array. This tracks which insights were actually used.

### Acceptance criteria
- Herald queries past performance and active insights before generating
- Content mix adjusts based on performance data and preferences
- Admin sees generation reasoning (transparent, not black box)
- Insights record which editions used them
- Liberation content minimum enforced regardless of engagement data

---

## Phase 5: Strategic Alignment & Reporting

**Goal**: Connect communications performance to organisational objectives. Generate accountability reports for the board.

**Depends on**: Phases 1-4 (needs data flowing, insights generating, Herald using them).

### Tasks

**5.1** Create `strategic_objectives` table.

```sql
CREATE TABLE strategic_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective TEXT NOT NULL,
  description TEXT,
  target_metric TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  target_period TEXT DEFAULT 'quarterly',
  current_value NUMERIC DEFAULT 0,

  -- Comms contribution tracking
  comms_attribution_method TEXT,
  comms_contribution_value NUMERIC DEFAULT 0,
  comms_contribution_detail TEXT,

  -- Status
  status TEXT DEFAULT 'active',
  trend TEXT DEFAULT 'stable',

  -- Governance
  set_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO strategic_objectives (objective, target_metric, target_value, comms_attribution_method) VALUES
  ('Grow cooperative membership', 'new_coop_members', 50, 'CTA clicks from newsletter to membership page'),
  ('Board recruitment', 'board_applications', 15, 'Applications citing newsletter as source'),
  ('Event attendance', 'avg_event_attendance', 40, 'Event link clicks from newsletter'),
  ('BLKOUTHUB engagement', 'hub_active_users', 200, 'HUB link clicks from newsletter'),
  ('Subscriber growth', 'net_subscriber_growth', 200, 'Direct measurement'),
  ('Subscriber retention', 'monthly_churn_rate', 0.02, 'Direct measurement'),
  ('Liberation alignment', 'liberation_content_share', 0.30, 'Content classification');
```

**5.2** Build objective tracking service.

`src/services/intelligence/ObjectiveTracker.ts`

- Queries relevant tables for each objective's target_metric
- Calculates comms_contribution from newsletter click data
- Updates current_value and trend
- Identifies objectives behind target for prioritisation

**5.3** Build quarterly report generator.

`src/services/intelligence/ReportGenerator.ts`

Produces structured report from:
- `strategic_objectives` — scorecard
- `comms_insights` — what worked, what needs attention
- `extract_content_demand_signals()` — unmet needs
- `extract_liberation_alignment()` — values check
- Recommendations for next quarter

Output: structured JSON that can render as HTML report or be exported.

**5.4** Add report view in admin.

Admin page showing:
- Strategic scorecard (objectives vs actuals)
- Comms contribution to each objective
- Top insights this period
- Unmet content demand signals
- Liberation alignment status
- Recommended actions for next period

**5.5** Enable board-configurable objectives.

Admin UI for:
- Adding/editing strategic objectives
- Setting target values and periods
- Reviewing comms contribution data
- Adjusting `comms_thresholds` values

### Acceptance criteria
- Strategic objectives tracked with comms attribution
- Quarterly report generates automatically from data
- Board can view scorecard, adjust targets, see recommendations
- Liberation alignment prominently featured (not buried)
- Report exportable for board meetings

---

## Phase 6: Additional Data Sources

**Goal**: Broaden the data flowing into the intelligence system beyond email.

**Independent** — can start anytime, each source adds value incrementally.

### Tasks

**6.1** Deploy Umami on Coolify.

- Self-hosted, GDPR-compliant, no cookies, aligns with data sovereignty
- Single Docker container + existing Supabase (or separate Postgres)
- Add tracking script to: comms-blkout, community-platform, events-calendar, blog, main site
- Gives: page views, unique visitors, referrers, device/browser/country, bounce rate, session duration

**6.2** Build Umami → content_performance sync.

Poll Umami API daily:
- Page views per content URL → `content_performance` (metric_type='views', source='direct')
- Referrer data → understand which channels drive traffic
- This triggers `process_performance_feedback()` for web content too

**6.3** Social media metrics sync (when social publishing is active).

If/when social media accounts have API access:
- Instagram insights → `content_analytics`
- LinkedIn analytics → `content_analytics`
- Updates `analytics_summaries.connection_score`

**6.4** IVOR conversation topic aggregation.

Build aggregation query over IVOR conversation logs:
- Extract topic frequencies
- Feed into `extract_content_demand_signals()`
- Identifies what the community is asking about but comms isn't covering

### Acceptance criteria
- Umami providing cross-site traffic data
- Page view data flowing into content_performance
- Additional data sources enriching the intelligence system

---

## System Integrity Rules

These are non-negotiable constraints on the intelligence system:

1. **Aggregate only** — insights about patterns, never individual tracking beyond what SendFox provides
2. **Transparent** — every recommendation shows its data backing; no black box
3. **Liberation floor** — the system can never recommend removing liberation content, only improving its format
4. **Community configurable** — thresholds in `comms_thresholds` are governance decisions, adjustable by the board
5. **Accountable** — insights track whether they were acted upon and whether the action helped
6. **Data sovereign** — all data stays in BLKOUT's infrastructure (Supabase + Coolify), no third-party ad platforms
7. **Honest** — the system flags tensions ("popular content conflicts with liberation goals") rather than hiding them

---

## Files Created/Modified Per Phase

| Phase | New files | Modified files |
|-------|-----------|---------------|
| 0 | — | (Supabase migrations applied) |
| 1 | `api/herald/handlers/metrics-sync.ts` | `api/herald/generate.ts`, `server.ts` (scheduling) |
| 2 | — | `src/pages/admin/Analytics.tsx`, `AnalyticsPage.tsx`, `DashboardStats.tsx`, `PerformanceAnalytics.tsx` |
| 3 | `comms_insights` migration, `src/services/intelligence/PatternMatcher.ts`, `InsightGenerator.ts`, insights admin component | `api/herald/generate.ts` (new action) |
| 4 | — | `api/herald/generate.ts` (query insights), `api/herald/generators/html.ts` (adjusted mix), newsletter admin preview |
| 5 | `strategic_objectives` migration, `src/services/intelligence/ObjectiveTracker.ts`, `ReportGenerator.ts`, report admin page | — |
| 6 | Umami Docker config, analytics sync service | `index.html` (tracking script across apps) |

---

## Verification Checklist

After each phase, verify:

- [ ] **Phase 0**: `SELECT COUNT(*) FROM content_performance` returns 0 (table exists, empty)
- [ ] **Phase 1**: After a newsletter send, `newsletter_editions.open_rate` is populated within 48hrs
- [ ] **Phase 1**: `feedback_loop_events` has entries (trigger fired)
- [ ] **Phase 2**: Admin dashboard shows real numbers, no "Mock" or "Demo" badges
- [ ] **Phase 3**: `comms_insights` has active insights after analysis runs
- [ ] **Phase 3**: Insights match expected patterns (e.g., if events have high clicks, content_mix insight recommends more events)
- [ ] **Phase 4**: Herald's generated edition includes `generation_reasoning` metadata
- [ ] **Phase 4**: Content mix differs from default when data supports a change
- [ ] **Phase 5**: Strategic scorecard shows current values vs targets
- [ ] **Phase 5**: Quarterly report generates without manual data compilation
- [ ] **Phase 6**: Umami shows page views across all BLKOUT sites

---

## The Loop (complete system)

```
BOARD SETS OBJECTIVES          THRESHOLDS CONFIGURED
"50 new coop members"      →   cooperative_conversion: 50
"Liberation content >30%"      liberation_minimum: 0.30
        │
        ▼
HERALD GENERATES (informed by intelligence)
  queries insights + preferences + past performance
  adjusts content mix, suggests timing
  attaches reasoning for admin transparency
        │
        ▼
NEWSLETTER SENT via SendFox
        │
        ▼
METRICS SYNC (daily)
  pulls opens, clicks, unsubscribes
  populates newsletter_performance, content_performance
        │
        ▼
FEEDBACK LOOP TRIGGER (automatic)
  process_performance_feedback() fires
  adjusts ivor_intelligence.relevance_score
  logs feedback_loop_events
        │
        ▼
ANALYSIS ENGINE (weekly)
  8 extractors pull structured metrics
  pattern matcher applies 10 rules against thresholds
  insight generator stores in comms_insights
        │
        ▼
ADMIN DASHBOARD (real-time)
  shows active insights, not charts
  "Events drive 2.3x engagement — feature more"
  "Governance needs format refresh"
  "Financial literacy: 34 IVOR queries, zero coverage"
        │
        ▼
QUARTERLY REPORT (automatic)
  strategic scorecard: objectives vs actuals
  comms contribution attribution
  liberation alignment status
  recommendations for next quarter
        │
        ▼
BOARD REVIEWS AND ADJUSTS → cycle repeats, system gets smarter
```
