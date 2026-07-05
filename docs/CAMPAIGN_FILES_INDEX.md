# BLKOUT Communications - Campaign Files Index

This document provides navigation to all campaign materials in the comms-blkout application.

---

## Active Campaigns

### 10th Anniversary Campaign (February 2026)

**Campaign:** A Decade of Liberation: BLKOUT's 10th Anniversary
**Duration:** February 1-14, 2026
**Main Event:** February 10th, 2026 @ 7:00 PM GMT

| File | Purpose |
|------|---------|
| [`campaign-content-10th-anniversary-2026.json`](../campaign-content-10th-anniversary-2026.json) | Master campaign configuration with all content, strategy, and metrics |
| [`10TH_ANNIVERSARY_SOCIAL_MEDIA_COPY.md`](./10TH_ANNIVERSARY_SOCIAL_MEDIA_COPY.md) | All social media copy - Instagram, Twitter, TikTok, LinkedIn |
| [`10TH_ANNIVERSARY_DEPLOYMENT_GUIDE.md`](./10TH_ANNIVERSARY_DEPLOYMENT_GUIDE.md) | Complete deployment checklist, schedule, and troubleshooting |
| [`Anniversary10th2026Newsletter.tsx`](../src/components/newsletters/Anniversary10th2026Newsletter.tsx) | React email newsletter component |

**Key Themes:**
- 10 years of community building (2016-2026)
- New platform features introduction
- Community Benefit Society milestone
- Hybrid celebration event (London + Virtual)

**Target Metrics:**
- 100,000+ social media reach
- 700+ event attendees (200 in-person, 500 virtual)
- 3,000+ Critical Frequency beta signups
- 200+ new members

---

### Board Recruitment Campaign (January-February 2026)

**Campaign:** Join Our Board - BLKOUT Board Recruitment
**Duration:** January 27, 2026 - February 14, 2026
**Info Session:** February 15-16, 2026 on BLKOUTHUB

| File | Purpose |
|------|---------|
| [`campaign-content-board-recruitment-2026.json`](../campaign-content-board-recruitment-2026.json) | Master campaign configuration with positions and timeline |
| [`content/campaigns/board-recruitment-2026/social-media-content.md`](../content/campaigns/board-recruitment-2026/social-media-content.md) | Instagram carousel, caption, and Twitter thread |
| [`strategies/board-recruitment-campaign-strategy-2026.md`](../strategies/board-recruitment-campaign-strategy-2026.md) | 3-week campaign strategy with 92 posts planned |
| [`BoardRecruitment2026Newsletter.tsx`](../src/components/newsletters/BoardRecruitment2026Newsletter.tsx) | React email newsletter component |
| [`CANVA_DESIGN_BRIEF.md`](../content/campaigns/board-recruitment-2026/CANVA_DESIGN_BRIEF.md) | Slide-by-slide design specifications |
| [`canva-bulk-create.csv`](../content/campaigns/board-recruitment-2026/canva-bulk-create.csv) | CSV for Canva Bulk Create (6 slides) |
| [`canva-positions-drip.csv`](../content/campaigns/board-recruitment-2026/canva-positions-drip.csv) | CSV for per-position drip campaign |
| [`schedule-board-recruitment-campaign.ts`](../scripts/schedule-board-recruitment-campaign.ts) | Script to add posts to social media queue |
| [`upload-campaign-images.sh`](../scripts/upload-campaign-images.sh) | Script to upload images to Supabase Storage |

**Board Positions:**
- Chair - Lead our governance with vision
- Treasurer - Steward our community resources
- Secretary - Keep our house in order
- Technology Director - Guide our digital future
- Community Director - Amplify grassroots voices

**Target Metrics:**
- 50+ qualified EOI submissions
- 5,000+ social media reach per week
- 80%+ newsletter open rate
- 200+ info session attendees

**Integration:**
- EOI form on Governance page: `blkoutuk.com/governance#board-eoi`
- BLKOUTHUB membership prerequisite
- Database: `board_eoi_submissions` table in Supabase

---

### Holiday 2025 Campaign (December 2025)

**Campaign:** 2025: Building Stronger Foundations - A Holiday Reflection
**Duration:** December 24-28, 2025
**Main Event:** Joseph Beam Day Quiz - December 28th @ 6:00 PM GMT

| File | Purpose |
|------|---------|
| [`campaign-content-holiday-2025.json`](../campaign-content-holiday-2025.json) | Master campaign configuration |
| [`HOLIDAY_2025_SOCIAL_MEDIA_COPY.md`](./HOLIDAY_2025_SOCIAL_MEDIA_COPY.md) | All social media copy |
| [`HOLIDAY_2025_DEPLOYMENT_GUIDE.md`](./HOLIDAY_2025_DEPLOYMENT_GUIDE.md) | Deployment checklist and schedule |
| [`CHRISTMAS_DAY_POSTS.md`](./CHRISTMAS_DAY_POSTS.md) | Special Christmas Day content |
| [`Holiday2025Newsletter.tsx`](../src/components/newsletters/Holiday2025Newsletter.tsx) | React email newsletter component |

---

## Campaign File Structure

```
/blkout-platform/apps/comms-blkout/
├── campaign-content-[name].json          # Master campaign config
├── docs/
│   ├── CAMPAIGN_FILES_INDEX.md           # This file
│   ├── [CAMPAIGN]_SOCIAL_MEDIA_COPY.md   # Platform-specific copy
│   ├── [CAMPAIGN]_DEPLOYMENT_GUIDE.md    # Deployment instructions
│   └── [Additional docs as needed]
└── src/components/newsletters/
    └── [Campaign]Newsletter.tsx          # Email templates
```

---

## Agent Assignments

Each campaign assigns tasks to our 6 AI agents:

| Agent | Role | Campaign Responsibilities |
|-------|------|---------------------------|
| **Griot** | Storyteller | Narrative content, founding stories, IVOR voice |
| **Listener** | Intelligence | Trend monitoring, community sentiment, UGC identification |
| **Weaver** | Engager | Comment responses, community outreach, conversation facilitation |
| **Strategist** | Planner | Posting schedule, analytics, real-time optimization |
| **Herald** | Newsletter | Email campaigns, automation sequences, subscriber content |
| **Concierge** | Support | Platform questions, registration help, onboarding |

---

## Creating New Campaigns

1. Copy the campaign JSON template structure
2. Create social media copy document
3. Create deployment guide
4. Create newsletter React component
5. Update this index
6. Assign agent tasks
7. Set up analytics tracking

---

## Visual Assets Location

Campaign imagery is stored in:
- `/blkout-website/public/images/[campaign-name]/`
- Generated assets: `/generated-campaign-assets/`

---

*Last Updated: January 2026*
*BLKOUT UK - Community-Owned Liberation Technology*
