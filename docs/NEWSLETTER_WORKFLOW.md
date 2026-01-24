# BLKOUT Newsletter Workflow Documentation

**Date**: January 24, 2026
**Version**: 1.0
**Status**: Initial workflow analysis and documentation

---

## Executive Summary

The BLKOUT Comms platform includes a newsletter system ("Herald Agent") that generates weekly and monthly newsletters using content from the Supabase database. This document describes the actual workflow based on code analysis and provides guidance for end-to-end testing.

**Key Finding**: Newsletter workflow is CODE-COMPLETE but has NEVER been tested end-to-end with real email delivery.

---

## Current Workflow Status

### ✅ Implemented Components

1. **Database Schema** (`003_newsletter_and_herald_agent.sql`)
   - `newsletter_editions` - stores generated newsletters
   - `newsletter_content_items` - links to source content
   - `newsletter_subscribers` - subscriber management
   - SendFox integration columns

2. **Herald API Endpoint** (`api/herald/generate.ts`)
   - Newsletter generation logic (weekly/monthly)
   - Content aggregation from database
   - HTML email template generation
   - SendFox integration placeholders
   - Editorial workflow (send prompt, receive reply)

3. **Frontend Components**
   - Drafts page (`src/pages/admin/Drafts.tsx`)
   - Draft display hook (`src/hooks/useDrafts.ts`)
   - Database types (`src/types/database.ts`)

### ❌ Not Implemented

1. **Email Sending**
   - Resend API configured (`re_HK47Qpxi_8hfuv32bYXxnb3nzFkoMLrSS`) but not tested
   - SendFox integration written but never executed
   - No proof of actual email delivery

2. **Newsletter UI**
   - No admin page for newsletter management
   - No preview/edit interface
   - No subscriber management interface

3. **Automated Scheduling**
   - Cron jobs defined but not deployed
   - Weekly trigger (Fridays 9am UTC)
   - Monthly trigger (1st of month 10am UTC)

---

## Newsletter Generation Workflow

### Step 1: Content Aggregation

The Herald agent fetches content from multiple database tables:

```typescript
// From api/herald/generate.ts

// 1. Fetch upcoming events (next 14 days)
fetchEvents(limit) → supabase.from('events')
  .eq('status', 'approved')
  .gte('date', now)
  .order('relevance_score', desc)

// 2. Fetch recent articles (past 7 days)
fetchArticles(limit) → supabase.from('news_articles')
  .eq('status', 'published')
  .gte('published_at', oneWeekAgo)
  .order('interest_score', desc)

// 3. Fetch community resources
fetchResources(limit) → supabase.from('ivor_resources')
  .eq('is_active', true)
  .order('priority', desc)

// 4. Fetch community intelligence
fetchIntelligence() → supabase.from('ivor_intelligence')
  .in('ivor_service', ['community', 'events', 'newsroom', 'ivor_resources'])
  .eq('is_stale', false)
```

**Expected Content Counts** (from PRD):
- **Weekly**: 3 highlights, 5 events, 2 resources
- **Monthly**: 5 highlights, 4 events, 3 resources, 2 stories

### Step 2: AI-Powered Intro Generation

Herald uses Claude 3.5 Haiku via OpenRouter to generate personalized newsletter intros:

```typescript
generateIntro(edition_type, sections, intelligence)
  → OpenRouter API
  → Model: anthropic/claude-3.5-haiku
  → Prompt includes: community stats, content summary, tone guidance
  → Output: 2-3 sentence warm introduction
```

**Intelligence Context Used**:
- Community size (hub members + coop members)
- Verified creators count
- Upcoming event count
- Weekly article count
- Top-performing content titles

### Step 3: HTML Email Generation

The `generateHTML()` function creates a responsive email template with:

- **Header**: BLKOUT logo, edition title, subtitle
- **Intro**: AI-generated greeting
- **Community Highlights**: Article cards with images
- **Upcoming Events**: Event cards with dates
- **Community Resources**: Resource links
- **CTA Box**: "Join Our Community" with website link
- **Footer**: Social links, unsubscribe (placeholder)

**Styling**: Inline CSS with purple/pink gradient branding

### Step 4: Database Storage

Newsletter editions saved to `newsletter_editions`:

```sql
INSERT INTO newsletter_editions (
  edition_type,           -- 'weekly' | 'monthly'
  edition_number,         -- Auto-incremented per type
  edition_date,           -- Coverage date
  title,                  -- "BLKOUT Weekly - 24 January 2026"
  subject_line,           -- Same as title
  preview_text,           -- First 150 chars of intro
  content_sections,       -- JSONB with all content
  html_content,           -- Full email HTML
  generated_by_agent,     -- 'herald'
  generation_model,       -- 'claude-3.5-haiku'
  status                  -- 'draft' → 'approved' → 'sent'
)
```

Content items linked in `newsletter_content_items` (tracks source articles/events).

### Step 5: Email Delivery (NOT TESTED)

**Option A: Resend API** (configured but never used)

```typescript
// From api/herald/generate.ts line 491-514
if (RESEND_API_KEY) {
  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'BLKOUT Herald <onboarding@resend.dev>',
      to: EDITOR_EMAIL,
      subject: `📝 Editorial needed: ${edition.title}`,
      html: emailHtml,
      reply_to: EDITOR_EMAIL
    })
  })
}
```

**Option B: SendFox Integration** (PRD specified, partially implemented)

```typescript
// handleSendFoxSend() returns instructions for manual paste
// No actual API campaign creation implemented
{
  success: true,
  message: 'Newsletter ready for SendFox',
  sendfox_campaign_url: 'https://sendfox.com/dashboard/campaigns/create',
  instructions: [
    '1. Click the SendFox campaign link above',
    '2. Select your list and enter the subject line',
    '3. Choose "Code" editor and paste the HTML',
    '4. Preview and send!'
  ]
}
```

**SendFox Lists** (from env):
- `weekly_engaged`: 538297 (BLKOUT Hub - 93 subscribers)
- `monthly_circle`: 538162 (My First List - 1,223 subscribers)
- `coop_members`: 591727 (13 subscribers)
- `founder_members`: 592260 (4 subscribers)

---

## API Endpoints

### POST `/api/herald/generate`

**Default Action**: Generate newsletter (weekly or monthly)

```bash
curl -X POST https://comms.blkoutuk.cloud/api/herald/generate \
  -H "Content-Type: application/json" \
  -d '{"edition_type": "weekly"}'
```

**Response**:
```json
{
  "success": true,
  "edition_id": "uuid",
  "title": "BLKOUT Weekly - 24 January 2026",
  "stats": {
    "highlights": 3,
    "events": 5,
    "resources": 2
  },
  "html_preview": "<!DOCTYPE html>..."
}
```

### POST `/api/herald/generate` (action: send_editorial_prompt)

Send email to editor requesting "From the Editor" section:

```bash
curl -X POST https://comms.blkoutuk.cloud/api/herald/generate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send_editorial_prompt",
    "edition_id": "uuid"
  }'
```

### POST `/api/herald/generate` (action: submit_editorial)

Process editor's reply and regenerate newsletter with editor note:

```bash
curl -X POST https://comms.blkoutuk.cloud/api/herald/generate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "submit_editorial",
    "edition_id": "uuid",
    "topic": "What's on your mind this week",
    "key_takeaway": "What readers should feel/do"
  }'
```

### POST `/api/herald/generate` (action: sendfox_send)

Prepare newsletter for SendFox (returns HTML for manual paste):

```bash
curl -X POST https://comms.blkoutuk.cloud/api/herald/generate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sendfox_send",
    "edition_id": "uuid",
    "list_id": 538297
  }'
```

### GET `/api/herald/generate?action=preview&id=<uuid>`

Preview newsletter HTML in browser:

```bash
curl https://comms.blkoutuk.cloud/api/herald/generate?action=preview&id=uuid
```

### GET `/api/herald/generate?action=export&id=<uuid>&format=html`

Download newsletter (formats: html, json, text):

```bash
curl https://comms.blkoutuk.cloud/api/herald/generate?action=export&id=uuid&format=html
```

### GET `/api/herald/generate?job=herald-weekly`

Trigger weekly newsletter generation (cron endpoint):

```bash
curl https://comms.blkoutuk.cloud/api/herald/generate?job=herald-weekly
```

---

## Environment Variables

**Currently Configured** (from `.env`):

```bash
# Resend API
RESEND_API_KEY=re_HK47Qpxi_8hfuv32bYXxnb3nzFkoMLrSS

# SendFox API
SENDFOX_API_KEY=<needs verification>

# Editor for prompts
EDITOR_EMAIL=rob@blkoutuk.com
EDITOR_NAME=Rob
EDITOR_AVATAR_URL=https://comms-blkout.vercel.app/images/editor-avatar.png

# OpenRouter for AI generation
OPENROUTER_API_KEY=<configured in production>

# Supabase
VITE_SUPABASE_URL=https://bgjengudzfickgomjqmz.supabase.co
VITE_SUPABASE_ANON_KEY=<configured>
SUPABASE_SERVICE_ROLE_KEY=<needed for cron jobs>
```

---

## Database Requirements

### Table Status

**✅ Tables Exist** (from migration 003):
- `newsletter_editions`
- `newsletter_content_items`
- `newsletter_subscribers`

**❓ Content Tables** (must have data for newsletters to work):
- `events` - need approved events with dates
- `news_articles` - need published articles
- `ivor_resources` - need active resources
- `ivor_intelligence` - need community stats

### Data Validation Queries

```sql
-- Check if any newsletter editions exist
SELECT COUNT(*) FROM newsletter_editions;

-- Check available content
SELECT
  (SELECT COUNT(*) FROM events WHERE status = 'approved') as events,
  (SELECT COUNT(*) FROM news_articles WHERE status = 'published') as articles,
  (SELECT COUNT(*) FROM ivor_resources WHERE is_active = true) as resources,
  (SELECT COUNT(*) FROM ivor_intelligence WHERE is_stale = false) as intelligence;

-- Check SendFox integration
SELECT COUNT(*) FROM newsletter_subscribers WHERE sendfox_contact_id IS NOT NULL;
```

---

## Known Issues

### 1. `content_drafts` Empty (Concerning)

**Finding**: The `content_drafts` table is referenced in frontend code but appears to have 0 rows.

**Code Reference**:
```typescript
// src/hooks/useDrafts.ts line 31
const { data, error: fetchError } = await supabase
  .from('content_drafts')
  .select('*')
  .order('created_at', { ascending: false });
```

**Issue**: This table is for SOCIAL MEDIA draft posts (not newsletters), but it's confusingly named. Newsletter drafts are in `newsletter_editions` with status='draft'.

**Resolution**: Rename `content_drafts` to `social_media_drafts` to avoid confusion.

### 2. Email Sending Never Tested

**Issue**: Resend API configured but no evidence of successful email delivery.

**Risk**: Domain verification may not be complete, API key may be invalid, or "onboarding@resend.dev" may not be whitelisted.

**Test Needed**: Send test email to verify Resend integration works.

### 3. Manual SendFox Workflow

**Issue**: SendFox integration requires manual copy-paste of HTML, not automatic campaign creation.

**Limitation**: SendFox API doesn't support campaign creation, only subscriber management.

**Workaround**: API returns HTML content and instructions for manual pasting into SendFox dashboard.

### 4. No Newsletter UI

**Issue**: Admins must use API directly to generate newsletters. No UI exists.

**Impact**: Non-technical users cannot create newsletters.

**Future**: Build `/admin/newsletter` page with generation button and preview.

---

## Testing Checklist

### Pre-Test Validation

- [ ] Verify `events` table has approved events with future dates
- [ ] Verify `news_articles` table has published articles from past week
- [ ] Verify `ivor_resources` table has active resources
- [ ] Verify `ivor_intelligence` table has recent community data
- [ ] Confirm RESEND_API_KEY is valid
- [ ] Confirm OPENROUTER_API_KEY is valid
- [ ] Confirm Supabase connection works from production

### Test 1: Generate Weekly Newsletter

```bash
curl -X POST https://comms.blkoutuk.cloud/api/herald/generate \
  -H "Content-Type: application/json" \
  -d '{"edition_type": "weekly"}' \
  | jq '.'
```

**Expected**: Returns edition_id, title, stats with content counts

**Validation**:
- [ ] edition_id is valid UUID
- [ ] stats.highlights > 0
- [ ] stats.events > 0
- [ ] stats.resources > 0
- [ ] html_preview contains HTML

### Test 2: Preview Newsletter

```bash
EDITION_ID="<from test 1>"
curl "https://comms.blkoutuk.cloud/api/herald/generate?action=preview&id=$EDITION_ID" > newsletter.html
open newsletter.html  # macOS
# or: xdg-open newsletter.html  # Linux
```

**Expected**: Opens formatted HTML email in browser

**Validation**:
- [ ] BLKOUT logo displays
- [ ] Purple/pink gradient styling
- [ ] Community highlights section populated
- [ ] Events section populated
- [ ] Resources section populated
- [ ] CTA button works
- [ ] Footer links present

### Test 3: Send Test Email via Resend

**Option A: Create test script** (see next section)

**Option B: Manual API test**:

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_HK47Qpxi_8hfuv32bYXxnb3nzFkoMLrSS" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "BLKOUT <noreply@blkoutuk.com>",
    "to": ["robbe@blkoutuk.com"],
    "subject": "BLKOUT Newsletter Test - Jan 24, 2026",
    "html": "<h1>Test Newsletter</h1><p>If you receive this, Resend is working!</p>"
  }'
```

**Expected**: Email arrives in inbox within 1-2 minutes

**Validation**:
- [ ] Email received
- [ ] From address correct
- [ ] Subject correct
- [ ] HTML renders properly
- [ ] No spam folder

### Test 4: Domain Verification

Check if `blkoutuk.com` is verified in Resend dashboard:

1. Login to resend.com
2. Go to Domains section
3. Verify `blkoutuk.com` status

**If not verified**:
- Add DNS records as instructed
- Wait for verification (can take 24-48 hours)
- Use `onboarding@resend.dev` for testing until verified

### Test 5: Export Newsletter

```bash
EDITION_ID="<from test 1>"
curl "https://comms.blkoutuk.cloud/api/herald/generate?action=export&id=$EDITION_ID&format=html" \
  -o newsletter-export.html
```

**Validation**:
- [ ] File downloads
- [ ] HTML is complete
- [ ] Can be opened in browser

---

## Next Steps

1. **Immediate**: Run test-newsletter.js script (see next section)
2. **Short-term**: Verify Resend domain or continue using onboarding@resend.dev
3. **Medium-term**: Build `/admin/newsletter` UI page
4. **Long-term**: Automate weekly/monthly cron jobs via Coolify

---

## Related Documentation

- **API Code**: `/apps/comms-blkout/api/herald/generate.ts`
- **Database Schema**: `/apps/comms-blkout/supabase/migrations/003_newsletter_and_herald_agent.sql`
- **PRD**: `/apps/comms-blkout/docs/PRD-agents-communications-improvement.md`
- **Test Script**: `/apps/comms-blkout/scripts/test-newsletter.js` (see next section)

---

**Document Status**: Initial analysis complete, ready for end-to-end testing
**Author**: Claude Code (analysis and documentation)
**Next Action**: Create test script and execute validation
