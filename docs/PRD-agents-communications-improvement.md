# Product Requirements Document
## BLKOUT Agents Communications Improvement

**Document Version:** 1.0
**Date:** 2025-11-26
**Author:** BLKOUT Development Team
**Status:** Draft for Review

---

## Executive Summary

This PRD outlines improvements to the BLKOUT Agents system to transform it from a static mock-data interface into an intelligent, community-responsive communications platform. The initiative introduces BLKOUTHUB member intelligence integration, IVOR-powered decision making, and a new Newsletter Agent ("The Herald") to close the communication loop with both engaged members and the wider community.

### Key Outcomes
- Agents informed by real community activity and member behavior
- Strategic, user-responsive content generation
- Automated newsletter curation for weekly and monthly communications
- SendFox integration for cost-effective email delivery
- Closed feedback loop between content performance and agent intelligence

---

## Problem Statement

### Current State Issues

1. **Mock Data Dependency**: The Agents UI displays hardcoded mock data instead of real database records, making it non-functional for actual content operations.

2. **No Community Intelligence**: Agents operate without awareness of:
   - What resources members are accessing
   - Which content types drive engagement
   - Current governance participation levels
   - IVOR conversation themes and community needs

3. **Static Agent Descriptions**: Agent capabilities are displayed as fixed text rather than reflecting actual configuration and performance.

4. **Newsletter Gap**: No automated system exists for compiling community activity into regular communications, resulting in:
   - Manual newsletter creation burden
   - Inconsistent communication frequency
   - Missed opportunities to highlight community activity

5. **Non-functional Controls**: "Configure Agents" button shows a placeholder alert with no actual functionality.

### Impact

- Community managers spend excessive time manually curating content
- Members miss important updates and events
- Content strategy is reactive rather than data-informed
- No visibility into what resonates with the community
- Wider circle (non-members) receives inconsistent communication

---

## Goals & Success Metrics

### Primary Goals

| Goal | Description | Success Metric |
|------|-------------|----------------|
| **G1** | Connect agents to real community data | 100% of agent decisions informed by live data |
| **G2** | Integrate BLKOUTHUB member intelligence | Track 5+ member activity signals |
| **G3** | Launch Herald Newsletter Agent | Weekly + Monthly newsletters operational |
| **G4** | Implement SendFox email delivery | 95%+ email delivery rate |
| **G5** | Create feedback loop | Content performance feeds back to agent intelligence |

### Key Performance Indicators (KPIs)

| KPI | Baseline | Target | Timeframe |
|-----|----------|--------|-----------|
| Newsletter open rate (weekly) | N/A | 40%+ | 3 months |
| Newsletter open rate (monthly) | N/A | 25%+ | 3 months |
| Agent-generated content approval rate | N/A | 70%+ | 3 months |
| Time to create newsletter | Manual (2+ hours) | 15 minutes | 1 month |
| Member engagement with agent content | N/A | 20% click-through | 3 months |

---

## User Personas

### Persona 1: Community Manager (Admin)

**Name:** Kai
**Role:** BLKOUT Communications Lead
**Goals:**
- Reduce time spent on routine content curation
- Ensure consistent community communication
- Track what content resonates with members
- Maintain BLKOUT voice across all channels

**Pain Points:**
- Manually compiles newsletters each week
- No visibility into member engagement patterns
- Agents UI doesn't provide actionable insights
- Switching between multiple tools for different tasks

**Needs from this initiative:**
- One dashboard to manage all agent activities
- Auto-generated newsletter drafts ready for review
- Clear metrics on content performance
- Confidence that agent outputs align with BLKOUT values

---

### Persona 2: Engaged Member (Weekly Subscriber)

**Name:** Marcus
**Role:** BLKOUTHUB active member, governance voter
**Goals:**
- Stay informed about community activities
- Discover relevant resources and events
- Participate in governance decisions
- Connect with other community members

**Pain Points:**
- Sometimes misses important updates
- Has to check multiple platforms for information
- Wants more personalized content recommendations

**Needs from this initiative:**
- Reliable weekly updates in inbox
- Content relevant to his interests and participation level
- Easy links to take action (vote, attend, engage)
- Recognition when contributing to community

---

### Persona 3: Wider Circle Supporter (Monthly Subscriber)

**Name:** Priya
**Role:** Ally, occasional event attendee, newsletter subscriber
**Goals:**
- Stay connected to BLKOUT mission
- Learn about major community achievements
- Find opportunities to support or participate
- Share BLKOUT content with her network

**Pain Points:**
- Doesn't have time for frequent updates
- Wants high-level summary, not details
- Needs clear calls-to-action

**Needs from this initiative:**
- Monthly digest with key highlights
- Celebratory tone that's shareable
- Clear ways to get more involved
- Content accessible to non-members

---

## Feature Requirements

### Feature 1: Real Data Connection for Agents

**Priority:** P0 (Critical)
**Effort:** Medium

#### Description
Replace mock data in Agents UI with live database connections to display actual agent status, task queues, and activity logs.

#### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US1.1 | Admin | See real-time agent status | I know which agents are active/idle |
| US1.2 | Admin | View pending task queue | I can prioritize and approve content |
| US1.3 | Admin | See actual activity logs | I can track agent performance over time |
| US1.4 | Admin | View agent configuration | I understand how each agent is set up |

#### Acceptance Criteria

- [ ] Agents page fetches from `agents` and `agent_configurations` tables
- [ ] Task queue displays items from `socialsync_agent_tasks`
- [ ] Activity logs show real operations, not mock data
- [ ] Agent cards display: status, last_active, total_content_generated
- [ ] "Configure Agents" button opens functional configuration modal

#### Technical Requirements

- Update `useAgents.ts` hook to query real tables
- Create `useAgentTasks.ts` hook for task queue
- Add real-time Supabase subscriptions for live updates
- Cache agent configurations for performance

---

### Feature 2: IVOR Intelligence Integration

**Priority:** P0 (Critical)
**Effort:** High

#### Description
Connect agents to IVOR intelligence system so content decisions are informed by community trends, resource access patterns, and conversation themes.

#### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US2.1 | Admin | See IVOR intelligence feeding agents | I understand why content is suggested |
| US2.2 | Agent (Griot) | Access member spotlight data | I can highlight verified creators |
| US2.3 | Agent (Listener) | Monitor trending topics | I can identify emerging community needs |
| US2.4 | Agent (Weaver) | Know high-engagement patterns | I create content that resonates |
| US2.5 | Agent (Strategist) | Track campaign effectiveness | I can adjust strategy based on data |

#### Acceptance Criteria

- [ ] `ivor_intelligence` table populated with community intelligence
- [ ] Each agent queries relevant intelligence types before generating content
- [ ] Intelligence has relevance_score, priority, and expiration
- [ ] Dashboard shows "Intelligence Feed" panel with actionable insights
- [ ] Agents explain "Why this suggestion?" based on intelligence used

#### Data Sources for Intelligence

| Intelligence Type | Source Tables | Agent Consumer |
|-------------------|---------------|----------------|
| `member_activity` | governance_members, content_engagement | All agents |
| `resource_trends` | ivor_resources, ivor_resource_tags | Listener, Weaver |
| `content_performance` | content_ratings, newsroom_analytics | Weaver, Strategist |
| `conversation_themes` | ivor_conversations | Listener, Griot |
| `governance_updates` | governance_members | Strategist, Herald |

---

### Feature 3: BLKOUTHUB Member Intelligence

**Priority:** P1 (High)
**Effort:** Medium

#### Description
Integrate BLKOUTHUB member activity data to make agents responsive to actual community behavior patterns.

#### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US3.1 | Admin | See member activity dashboard | I understand community engagement |
| US3.2 | Agent | Know which resources are trending | I can create timely support content |
| US3.3 | Agent | Track governance participation | I can promote important votes |
| US3.4 | Admin | Identify inactive segments | I can plan re-engagement campaigns |

#### Acceptance Criteria

- [ ] Member Activity Dashboard view created in database
- [ ] Agents query member patterns before content generation
- [ ] Resource access trends visible in UI
- [ ] Governance participation levels inform content priorities
- [ ] Content recommendations tagged with member interest alignment

#### Member Signals to Track

| Signal | Source | Agent Response |
|--------|--------|----------------|
| Resource access spike | ivor_resources analytics | Create support content |
| New verified creators | governance_members | Creator spotlight stories |
| Low governance activity | governance_members | Re-engagement campaigns |
| High event attendance | events, content_engagement | Event promotion focus |
| IVOR conversation themes | ivor_conversations | Address community questions |

---

### Feature 4: Herald Newsletter Agent

**Priority:** P0 (Critical)
**Effort:** High

#### Description
Introduce a fifth agent ("The Herald") dedicated to curating and generating newsletters for two audience tiers: weekly updates for engaged members and monthly digests for the wider circle.

#### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US4.1 | Admin | Generate newsletter drafts automatically | I save hours of manual curation |
| US4.2 | Admin | Preview and edit before sending | I maintain quality control |
| US4.3 | Admin | See newsletter performance metrics | I can improve over time |
| US4.4 | Weekly subscriber | Receive insider updates | I stay engaged with community |
| US4.5 | Monthly subscriber | Get curated highlights | I stay connected without overload |

#### Newsletter Specifications

**Weekly Update (Opt-in Members)**
| Section | Content Source | Max Items |
|---------|----------------|-----------|
| Highlights | news_articles (top by interest_score) | 3 |
| Upcoming Events | events (next 7 days) | 5 |
| Community Voice | content_ratings, governance activity | 1-2 |
| Resources Spotlight | ivor_resources (trending) | 2 |
| Call to Action | Active campaigns, governance votes | 1 |

**Monthly Digest (Wider Circle)**
| Section | Content Source | Max Items |
|---------|----------------|-----------|
| Month in Review | Aggregated highlights | 3-5 |
| Featured Stories | Top performing articles | 2 |
| Celebrations | Member milestones, achievements | 2-3 |
| Coming Up | Major events next month | 3-4 |
| Join the Community | Membership CTA | 1 |

#### Acceptance Criteria

- [ ] Herald agent configuration added to database
- [ ] Newsletter editions table stores generated content
- [ ] Herald queries all other agents for content inputs
- [ ] Two templates: weekly (insider tone) and monthly (accessible tone)
- [ ] Preview UI with edit capability before export
- [ ] HTML export compatible with SendFox editor
- [ ] Archive of past editions accessible in UI

---

### Feature 5: SendFox Integration

**Priority:** P1 (High)
**Effort:** Medium

#### Description
Integrate SendFox email service for cost-effective newsletter delivery, subscriber management, and basic analytics tracking.

#### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US5.1 | Admin | Manage subscribers from one place | I don't switch between tools |
| US5.2 | Admin | Sync subscribers to SendFox | Lists stay up to date |
| US5.3 | Admin | Export newsletter HTML | I can paste into SendFox editor |
| US5.4 | Admin | Log performance metrics | I track open/click rates |
| US5.5 | Subscriber | Subscribe to preferred tier | I get relevant frequency |

#### SendFox API Integration

| Endpoint | Method | Use Case |
|----------|--------|----------|
| `/me` | GET | Verify API connection |
| `/lists` | GET/POST | Manage subscriber lists |
| `/contacts` | GET/POST | Add/query subscribers |
| `/unsubscribe` | PATCH | Handle unsubscribes |
| `/campaigns` | GET | Fetch campaign metrics |

#### Acceptance Criteria

- [ ] SendFox service module created with all API methods
- [ ] Environment variables configured for API key and list IDs
- [ ] Subscriber sync function keeps local DB and SendFox aligned
- [ ] Newsletter export generates SendFox-compatible HTML
- [ ] UI shows SendFox connection status
- [ ] Unsubscribe webhook updates local database

#### Limitations & Workarounds

SendFox API does not support programmatic campaign sending. Workflow:
1. Herald generates content → stored in `newsletter_editions`
2. Admin reviews/approves in UI
3. Export HTML template
4. Paste into SendFox campaign editor
5. Send via SendFox web interface
6. Manually log metrics back to database (or future API enhancement)

---

### Feature 6: Input Regulation & Strategic Controls

**Priority:** P2 (Medium)
**Effort:** Medium

#### Description
Implement governance rules that ensure agent outputs remain strategic, on-brand, and responsive to community needs rather than generating arbitrary content.

#### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US6.1 | Admin | Set content focus rules per agent | Agents stay in their lane |
| US6.2 | Admin | Enforce voice consistency | Brand tone is maintained |
| US6.3 | Admin | Set frequency limits | Agents don't over-generate |
| US6.4 | Admin | Require approval gates | Humans review before publish |
| US6.5 | Admin | Filter by relevance threshold | Low-value suggestions are hidden |

#### Regulation Controls

| Control | Implementation | Default |
|---------|----------------|---------|
| Content Focus | `agent_configurations.content_focus` | Per agent |
| Voice Consistency | `voice_sections_used` templates | Required |
| Frequency Limits | `intelligence_refresh_frequency` | 1 hour |
| Approval Gates | `status` workflow | Required |
| Relevance Threshold | `relevance_score >= threshold` | 70 |

#### Acceptance Criteria

- [ ] Each agent respects `content_focus` array boundaries
- [ ] Generated content includes voice section references
- [ ] Rate limiting prevents excessive content generation
- [ ] All content goes through pending → review → approved workflow
- [ ] Low relevance suggestions (< 70) are deprioritized in UI

---

### Feature 7: Feedback Loop & Analytics

**Priority:** P2 (Medium)
**Effort:** Medium

#### Description
Create a closed loop where content performance data feeds back into agent intelligence, enabling continuous improvement.

#### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US7.1 | Admin | See which agent content performs best | I can adjust configurations |
| US7.2 | Agent | Learn from past performance | My suggestions improve over time |
| US7.3 | Admin | Track approval rates by agent | I identify quality issues |
| US7.4 | Admin | See engagement trends | I understand community interests |

#### Metrics to Track

| Metric | Source | Feeds Into |
|--------|--------|------------|
| Content approval rate | content_approvals | Agent quality score |
| Newsletter open rate | SendFox / manual | Herald effectiveness |
| Click-through rate | Newsletter links | Content relevance |
| Time to approval | Status timestamps | Workflow efficiency |
| User edit frequency | Draft versions | Voice alignment |

#### Acceptance Criteria

- [ ] Performance metrics stored per content item
- [ ] Agent dashboard shows approval rate trends
- [ ] Newsletter analytics displayed after send
- [ ] Low-performing content patterns flagged for config review
- [ ] Monthly agent performance summary generated

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                 │
├──────────────┬──────────────┬──────────────┬──────────────┬────────┤
│  BLKOUTHUB   │    IVOR      │   Newsroom   │   Events     │ Social │
│  Members     │  Resources   │   Articles   │   Calendar   │  Sync  │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┴───┬────┘
       │              │              │              │           │
       └──────────────┴──────────────┴──────────────┴───────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    INTELLIGENCE LAYER                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   ivor_intelligence                          │   │
│  │  • member_activity    • resource_trends    • governance      │   │
│  │  • content_performance • conversation_themes                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       AGENT LAYER                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Griot   │ │ Listener │ │  Weaver  │ │Strategist│ │  Herald  │ │
│  │ Stories  │ │  Trends  │ │ Content  │ │ Planning │ │Newsletter│ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │
│       │            │            │            │            │        │
│       └────────────┴────────────┴────────────┴────────────┘        │
│                                 │                                   │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      OUTPUT LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Social Media │  │  Newsletter  │  │   Campaigns  │              │
│  │   Content    │  │   Editions   │  │   & Tasks    │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼─────────────────┼─────────────────┼───────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DELIVERY LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  SocialSync  │  │   SendFox    │  │   BLKOUTHUB  │              │
│  │  Platforms   │  │    Email     │  │   Platform   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FEEDBACK LOOP                                     │
│  Performance metrics → Intelligence updates → Agent improvements    │
└─────────────────────────────────────────────────────────────────────┘
```

### Database Schema Changes

#### New Tables

| Table | Purpose |
|-------|---------|
| `newsletter_editions` | Store generated newsletter content and metadata |
| `newsletter_subscribers` | Track subscribers with tier preferences |
| `newsletter_content_items` | Link content sources to newsletter sections |

#### Modified Tables

| Table | Changes |
|-------|---------|
| `agent_configurations` | Add Herald agent entry |
| `ivor_intelligence` | Populate with member activity intelligence |

### API Integrations

| Service | Purpose | Auth Method |
|---------|---------|-------------|
| SendFox | Email delivery | OAuth 2.0 Bearer Token |
| Supabase | Database & real-time | API Key |
| Gemini | Content generation | API Key |

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Focus:** Real data connections and database schema

| Task | Owner | Effort |
|------|-------|--------|
| Create newsletter database tables | Dev | 2 days |
| Update useAgents hook for real data | Dev | 2 days |
| Add Herald to agent_configurations | Dev | 1 day |
| Create useAgentTasks hook | Dev | 1 day |
| Build Agent Configuration modal | Dev | 2 days |

**Deliverables:**
- Agents page shows real data
- Newsletter schema migrated
- Herald agent configured

---

### Phase 2: Intelligence Integration (Week 2-3)
**Focus:** IVOR and BLKOUTHUB data flowing to agents

| Task | Owner | Effort |
|------|-------|--------|
| Create useAgentIntelligence hook | Dev | 2 days |
| Build intelligence aggregation queries | Dev | 2 days |
| Populate ivor_intelligence with initial data | Dev | 1 day |
| Add Intelligence Feed panel to UI | Dev | 2 days |
| Connect agents to intelligence queries | Dev | 2 days |

**Deliverables:**
- Intelligence Feed visible in Agents page
- Agents query live intelligence before generating
- Member activity signals tracked

---

### Phase 3: Herald Newsletter Agent (Week 3-4)
**Focus:** Newsletter generation and preview

| Task | Owner | Effort |
|------|-------|--------|
| Build Herald content selection algorithm | Dev | 3 days |
| Create newsletter HTML template generator | Dev | 2 days |
| Build newsletter preview/edit UI | Dev | 3 days |
| Implement edition archive view | Dev | 1 day |
| Add Herald card to Agents page | Dev | 1 day |

**Deliverables:**
- Herald generates weekly and monthly newsletters
- Preview and edit before export
- Archive of past editions

---

### Phase 4: SendFox Integration (Week 4-5)
**Focus:** Email delivery and subscriber management

| Task | Owner | Effort |
|------|-------|--------|
| Create SendFox service module | Dev | 2 days |
| Build subscriber sync functionality | Dev | 2 days |
| Implement HTML export for SendFox | Dev | 1 day |
| Add subscriber management UI | Dev | 2 days |
| Configure environment variables | Dev | 0.5 days |
| Document SendFox workflow | Dev | 0.5 days |

**Deliverables:**
- SendFox API connected
- Subscribers sync between systems
- Export workflow documented

---

### Phase 5: Regulation & Feedback (Week 5-6)
**Focus:** Quality controls and analytics

| Task | Owner | Effort |
|------|-------|--------|
| Implement content focus enforcement | Dev | 1 day |
| Add relevance threshold filtering | Dev | 1 day |
| Build approval workflow UI | Dev | 2 days |
| Create performance analytics dashboard | Dev | 2 days |
| Implement feedback loop queries | Dev | 2 days |

**Deliverables:**
- All regulation controls active
- Analytics dashboard operational
- Feedback loop functional

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SendFox API limitations (no send endpoint) | Confirmed | Medium | Manual send via web interface; document workflow |
| Low initial intelligence data | High | Medium | Seed with manual entries; improve over time |
| Agent content quality inconsistent | Medium | High | Approval gates; voice section enforcement |
| Subscriber sync failures | Low | Medium | Error handling; manual sync fallback |
| Newsletter fatigue | Medium | Medium | Strict frequency limits; unsubscribe easy |

---

## Dependencies

### External Dependencies

| Dependency | Required For | Status |
|------------|--------------|--------|
| SendFox account | Email delivery | Needs setup |
| SendFox API key | API integration | Needs generation |
| SendFox lists | Subscriber segmentation | Needs creation |

### Internal Dependencies

| Dependency | Required For | Status |
|------------|--------------|--------|
| Supabase tables | All features | Exists |
| Agent configurations | Herald agent | Partial (4 agents exist) |
| Voice & Values doc | Voice consistency | Exists |
| IVOR resources | Intelligence data | Exists (224 resources) |

---

## Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| What is the exact SendFox list structure? | Admin | Pending |
| Should Herald have edit access or read-only? | Product | Pending |
| What is the approval workflow for newsletters? | Admin | Pending |
| How do we handle newsletter images/assets? | Dev | Pending |
| What metrics should trigger agent config review? | Product | Pending |

---

## Appendix

### A. Agent Configuration Reference

| Agent | Role | Content Focus |
|-------|------|---------------|
| Griot | Storyteller | Member stories, creator spotlights, heritage narratives |
| Listener | Trend Watcher | Community trends, conversation themes, emerging needs |
| Weaver | Content Creator | Social posts, engagement content, resource promotion |
| Strategist | Planner | Campaigns, governance, strategic initiatives |
| Herald | Newsletter Curator | Weekly updates, monthly digests, community summaries |

### B. Newsletter Frequency Schedule

| Newsletter | Frequency | Send Day | Send Time | Audience |
|------------|-----------|----------|-----------|----------|
| Weekly Update | Weekly | Monday | 9:00 AM GMT | Opt-in members |
| Monthly Digest | Monthly | 1st of month | 10:00 AM GMT | All subscribers |

### C. SendFox List Structure

| List Name | Purpose | Sync Source |
|-----------|---------|-------------|
| BLKOUT Weekly | Weekly update recipients | newsletter_subscribers (tier='weekly' OR 'both') |
| BLKOUT Monthly | Monthly digest recipients | newsletter_subscribers (tier='monthly' OR 'both') |
| BLKOUT All | Master list | All active subscribers |

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| Community Lead | | | |

---

*Document created: 2025-11-26*
*Last updated: 2025-11-26*
