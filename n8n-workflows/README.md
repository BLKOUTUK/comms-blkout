# BLKOUT n8n Workflows

This directory contains n8n workflow definitions for automating BLKOUT's social media operations.

## Workflows

### 1. Social Diary Researcher (`social-diary-researcher.json`)
**Schedule**: Monday & Thursday at 8 AM UTC

Automatically discovers Black LGBTQ+ events in the UK:
- Searches web platforms (Eventbrite, OutSavvy, DesignMyNight, Dice.fm, RA, QX Magazine)
- Scrapes Instagram accounts of known organizers (@ukblackpride, @bbaborbbz, etc.)
- AI curation with Claude 3.5 Sonnet for relevance scoring
- Saves to Supabase `events` table
- Email notification to berkeley@blkoutuk.com

**Required Credentials**:
- Tavily API (search)
- OpenRouter API (Claude access)
- Supabase API (database)
- Gmail OAuth (notifications)
- Apify account (Instagram scraping, ~$5/mo)

---

### 2. Content Publishing Scheduler (`content-publishing-scheduler.json`)
**Schedule**: Every 2 hours

Publishes scheduled content from the queue:
- Fetches posts from `social_media_queue` where `scheduled_for <= now`
- Routes to appropriate platform (Instagram, LinkedIn, Twitter)
- Updates queue status to `published`

**Required Credentials**:
- Supabase API
- Instagram Business OAuth
- LinkedIn OAuth
- Twitter OAuth v2

---

### 3. Analytics Sync (`analytics-sync.json`)
**Schedule**: Daily at 6 AM UTC

Fetches engagement metrics and calculates BLKOUT Connection Score:
- Retrieves metrics for posts published in last 7 days
- Fetches from Instagram Insights and LinkedIn API
- Calculates weighted score: Comments(3x) + Shares(2x) + Likes(1x)
- Saves to `content_analytics` and `analytics_summaries` tables

**Required Credentials**:
- Supabase API
- Instagram Business OAuth
- LinkedIn OAuth

---

### 4. Community Response Generator (`community-response-generator.json`)
**Trigger**: Webhook (POST /webhook/community-question)

Real-time AI response generation:
- Accepts community questions via webhook
- Generates Instagram-ready content with Claude
- Saves to `community_responses` table (status: pending_review)
- High urgency triggers email alert

**Webhook Endpoint**: `POST /webhook/community-question`

**Request Format**:
```json
{
  "question": "What resources are available for...",
  "context": "Member asking about support groups",
  "member_name": "Anonymous",
  "urgency": "normal|high",
  "category": "resources|events|support|general",
  "platforms": ["instagram"]
}
```

**Required Credentials**:
- OpenRouter API (Claude)
- Supabase API
- Gmail OAuth

---

## Installation

### 1. Import Workflows
1. Open n8n at https://n8n.blkoutuk.cloud
2. Go to **Workflows** > **Import from File**
3. Select each `.json` file

### 2. Configure Credentials
For each workflow, set up the required credentials:

**Supabase API**:
- Type: Header Auth
- Header Name: `apikey`
- Header Value: Your Supabase anon key

**OpenRouter API**:
- Type: OpenRouter Account
- API Key: Your OpenRouter key

**Tavily API**:
- Type: Tavily Account
- API Key: Your Tavily key

**Social Platform OAuth**:
- Follow n8n OAuth setup for each platform
- Requires developer accounts on Meta, LinkedIn, Twitter

### 3. Activate Workflows
1. Open each workflow
2. Click **Save**
3. Toggle **Active** to ON

---

## Environment Variables

Set these in your n8n environment:

```env
# Supabase
SUPABASE_URL=https://bgjengudzfickgomjqmz.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# OpenRouter (for Claude access)
OPENROUTER_API_KEY=your_openrouter_key

# Tavily (for web search)
TAVILY_API_KEY=your_tavily_key

# Apify (for Instagram scraping)
APIFY_API_TOKEN=your_apify_token

# Gmail (for notifications)
# Use OAuth2 credentials in n8n
```

---

## Database Tables

These workflows use the following Supabase tables (see migration `004_social_media_workflows.sql`):

| Table | Purpose |
|-------|---------|
| `agent_tasks` | AI agent task queue |
| `generated_assets` | AI-generated media |
| `social_media_queue` | Publishing queue |
| `content_analytics` | Per-post metrics |
| `analytics_summaries` | Daily aggregates |
| `community_responses` | AI-generated responses |
| `events` | Discovered events |

---

## Webhook Integration

The comms-blkout API provides webhook endpoints:

| Endpoint | Purpose |
|----------|---------|
| `POST /api/webhooks/n8n` | General n8n callback handler |
| `POST /api/webhooks/community-question` | Trigger community response generation |
| `POST /api/webhooks/instagram` | Meta/Instagram webhook receiver |

**Authentication**: Include `X-Webhook-Secret` header or `secret` in body.

---

## BLKOUT Values Integration

These workflows embody BLKOUT's core values:

- **Community Connection Score**: Weights meaningful engagement (comments > shares > likes)
- **Trust the people**: AI suggestions require human review before publishing
- **Black feminist thought**: AI prompts include values-aligned instructions
- **Quality over quantity**: Focus on relevance scoring, not volume

---

## Troubleshooting

**Workflow not running**:
- Check if workflow is Active (toggle in top right)
- Verify credentials are valid and not expired
- Check n8n execution logs

**API rate limits**:
- Instagram: 200 calls/hour per user
- LinkedIn: 100 calls/day for basic endpoints
- Tavily: Depends on plan (usually 1000/month free)

**Missing data**:
- Verify Supabase tables exist (run migration)
- Check RLS policies allow service_role access
- Verify anon key vs service key usage

---

## Support

- **n8n Docs**: https://docs.n8n.io
- **BLKOUT Tech**: tech@blkoutuk.com
- **Issues**: Report in comms-blkout repository
