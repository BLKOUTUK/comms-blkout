# Meet AIvor Campaign Strategy

**Campaign**: Meet AIvor — Your AI for Black Queer Life
**Duration**: March 3-16, 2026 (2 weeks) + ongoing measurement through March 31
**Goal**: 100% increase in chatbot, news, and events function usage + brand awareness among Black queer men in the UK

## Objectives & KPIs

### Primary Targets (100% increase = 2x baseline)

| Metric | Baseline (Feb avg) | Target (Mar 31) | Measurement |
|--------|-------------------|-----------------|-------------|
| Daily chat conversations | TBD (query ivor_feedback) | 2x baseline | `campaign_metrics.conversations_started` |
| Events queries via AIvor | TBD | 2x baseline | `campaign_metrics.feature_events` |
| News queries via AIvor | TBD | 2x baseline | `campaign_metrics.feature_news` |
| Widget opens | TBD | 2x baseline | `campaign_metrics.widget_opens` |
| Unique chatbot users/week | TBD | 2x baseline | `campaign_metrics.unique_users` |

### Secondary Targets (Brand Awareness)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Social impressions (campaign total) | 30,000 | Platform analytics (LinkedIn, Instagram, X, Facebook) |
| Social engagement rate | >5% | (likes+comments+shares) / impressions |
| blkoutuk.com referral traffic from social | +50% | UTM tracking: `?utm_campaign=meet-aivor` |
| Newsletter open rate (March issues) | >25% | SendFox metrics |
| New newsletter subscribers | +100 | SendFox subscriber count |

## Campaign Architecture

### Phase 1: WHO IS AIVOR? (Mar 3-7)
**Theme**: Introduction by function — events, wellness, learning tools, crisis support
**Content**: 20 social posts (4 platforms x 5 days) + 1 AIvor video reel + newsletter mention

- **Mar 3**: Launch announcement — "Meet AIvor" across all platforms
- **Mar 4**: Events spotlight — "What's on this weekend?"
- **Mar 5**: Wellness spotlight — "Check in with yourself"
- **Mar 6**: Learning tools — "8 tools you didn't know you had"
- **Mar 7**: Crisis support — "He knows when to be serious"

### Phase 2: WHAT MAKES AIVOR DIFFERENT? (Mar 10-14)
**Theme**: Voice, real AI, community ownership, DigestVid, final CTA
**Content**: 20 social posts + 1 AIvor video reel + newsletter feature

- **Mar 10**: Voice — "Listen to him"
- **Mar 11**: Real AI — "Not a script bot"
- **Mar 12**: Community-owned — "Your data, your AI"
- **Mar 13**: DigestVid — "Your weekly video roundup"
- **Mar 14**: Final CTA — "Try AIvor now: say hello"

### Phase 3: MEASURE & ADJUST (Mar 15-31)
**Theme**: Kaizen — measure what worked, double down on winners, drop losers
**Content**: Reduced cadence (2-3 posts/week), retargeting top performers

## AIvor Video Scripts

Six video scripts are written in AIvor's Register 2 (presenting voice) using the `/aivor-script` skill format. See `scripts/` directory:

1. `01-meet-aivor-reel.md` — 15s launch reel (Hook-Reveal-CTA)
2. `02-events-demo-reel.md` — 15s events spotlight
3. `03-wellness-reel.md` — 15s wellness check-in spotlight
4. `04-newsletter-intro-week1.md` — 60s newsletter intro (Story-Lesson-Bridge)
5. `05-newsletter-intro-week2.md` — 60s newsletter intro
6. `06-platform-introduction.md` — 90s full platform introduction (Three Beats)

## UTM Tracking

All campaign links use consistent UTM parameters:

```
https://blkoutuk.com?chat=open&utm_source={platform}&utm_medium=social&utm_campaign=meet-aivor&utm_content={post-slug}
```

Examples:
- `?utm_source=instagram&utm_medium=social&utm_campaign=meet-aivor&utm_content=launch-announcement`
- `?utm_source=linkedin&utm_medium=social&utm_campaign=meet-aivor&utm_content=events-spotlight`
- `?utm_source=newsletter&utm_medium=email&utm_campaign=meet-aivor&utm_content=week1-intro`

## Self-Improvement Logic (Kaizen Cycle)

### Automated Measurement (Daily)
- Query `campaign_metrics` for daily totals
- Compare against rolling 7-day baseline
- Flag any metric that drops >20% vs previous day

### Weekly Health Check (Every Monday)
1. **Measure**: Pull week's campaign metrics via `get_campaign_health()`
2. **Compare**: Against baseline and target trajectory
3. **Score**: Campaign health score (0-100) based on:
   - Conversation growth rate (30% weight)
   - Feature adoption rate (30% weight)
   - Social engagement rate (20% weight)
   - Referral traffic growth (20% weight)
4. **Adjust**:
   - **Score >70**: Continue current strategy
   - **Score 50-70**: Boost underperforming content types
   - **Score <50**: Emergency pivot — review messaging, increase posting frequency, test new hooks

### Content Performance Loop
Integrated with existing `content_performance` table and `process_performance_feedback()` trigger:

1. Campaign posts tracked with `metadata.campaign = 'meet-aivor'`
2. High-performing posts (engagement > 0.4) → `boost_content_relevance()` → inform next week's content
3. Low-performing posts (engagement < 0.1) → `reduce_content_relevance()` → deprioritise that angle
4. LLM Council (Wednesday 10am) reviews campaign performance in weekly deliberation

### Progress Tests

Run these SQL queries weekly to validate progress:

```sql
-- Test 1: Are conversations increasing?
SELECT date_trunc('week', created_at) as week,
       COUNT(*) as conversations,
       COUNT(DISTINCT session_id) as unique_sessions
FROM ivor_feedback
WHERE created_at >= '2026-02-01'
GROUP BY 1 ORDER BY 1;

-- Test 2: Are events queries increasing?
SELECT date_trunc('week', tracked_at) as week,
       COUNT(*) as events_queries
FROM campaign_metrics
WHERE metric_type = 'feature_usage' AND feature_name = 'events'
  AND tracked_at >= '2026-02-01'
GROUP BY 1 ORDER BY 1;

-- Test 3: Campaign health score
SELECT * FROM get_campaign_health('meet-aivor');

-- Test 4: Social content performance
SELECT title, engagement_rate, impressions, clicks
FROM campaign_social_performance
WHERE campaign_slug = 'meet-aivor'
ORDER BY engagement_rate DESC;
```

## Cost Budget

| Item | Estimated Cost | Notes |
|------|---------------|-------|
| AIvor video reels (3x 15s) | $1.80-$3.60 | Kling Avatar standard |
| AIvor newsletter videos (2x 60s) | $4.80-$10.40 | Kling Avatar (4 segments each) |
| AIvor platform intro (1x 90s) | $3.60-$7.80 | Kling Avatar (6 segments) |
| Social images (10x) | $0.40-$0.90 | Nano Banana 2 via Kie.ai |
| **Total** | **$10.60-$22.70** | |

## Exit Criteria

Campaign is **successful** when:
- [ ] Chat conversations reach 2x February baseline for 7 consecutive days
- [ ] Events queries reach 2x February baseline
- [ ] News queries reach 2x February baseline
- [ ] Campaign health score sustained above 70 for 2 consecutive weeks

Campaign requires **pivot** when:
- [ ] Health score below 50 for 2 consecutive weeks
- [ ] No measurable increase in any metric after Phase 1
- [ ] Social engagement rate below 2% across all platforms
