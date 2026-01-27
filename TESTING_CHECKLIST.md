# Comms BLKOUT Testing Checklist

**Service**: Comms BLKOUT (Social Media Management & Content Automation)
**URL**: https://comms.blkoutuk.cloud
**Status**: ⚠️ Partially Tested (UI renders, but `content_drafts` table empty)
**Last Updated**: January 8, 2026

---

## Quick Start Testing

```bash
# 1. Start Comms locally
cd /home/robbe/blkout-platform/apps/comms-blkout
npm install
npm run dev

# 2. Open in browser
# Local: http://localhost:5175
# Production: https://comms.blkoutuk.cloud

# 3. Check database status
# Supabase table: content_drafts (expected: 0 rows currently)
# Supabase table: social_media_queue (8 posts: 2 queued, 6 failed)
```

---

## 1. UI Rendering (10 minutes)

### Page Load
- [ ] Navigate to https://comms.blkoutuk.cloud
- [ ] Page loads (HTTP 200)
- [ ] Full UI renders (not just Facebook SDK or blank page)
- [ ] Navigation menu visible
- [ ] No white screen of death
- [ ] No infinite loading spinner

### Navigation
- [ ] Dashboard link works
- [ ] Drafts link works
- [ ] Calendar link works
- [ ] Settings link works (if exists)
- [ ] All pages accessible without errors

### Browser Console
- [ ] Open DevTools (F12)
- [ ] Check Console tab
- [ ] No critical JavaScript errors
- [ ] Facebook SDK messages expected (not errors)
- [ ] No "Failed to fetch" errors

**Issues Found**:
- [ ] None
- [ ] Issue: ________________________________

---

## 2. Content Drafts (30 minutes)

### Database Status Check
```bash
# Check Supabase
# Table: content_drafts
# Expected: 0 rows (as of Jan 2, 2026)
# This means NO DRAFTS exist to test UI with
```

### View Drafts List
- [ ] Navigate to Drafts page
- [ ] Page loads (not blank)
- [ ] Message displays if no drafts (e.g., "No drafts yet")
- [ ] "Create Draft" button visible (if applicable)
- [ ] No "undefined" or "[object Object]" errors

### Create New Draft Manually
- [ ] Click "Create Draft" or "New Post" button
- [ ] Draft creation form appears
- [ ] Form fields:
  - [ ] Content text area
  - [ ] Platform selector (Instagram, Facebook, TikTok, etc.)
  - [ ] Media upload (image/video)
  - [ ] Scheduled date/time (if applicable)
  - [ ] Status (draft, pending review, approved)
- [ ] Enter test draft:
  - Content: "Test post from Comms BLKOUT testing [Your Name] [Date]"
  - Platform: Instagram
  - Status: Draft
- [ ] Submit form
- [ ] Success message appears
- [ ] Draft appears in list
- [ ] Database row created (check `content_drafts` table)

### Edit Draft
- [ ] Find test draft in list
- [ ] Click edit button
- [ ] Form pre-fills with draft data
- [ ] Change content to "UPDATED: Test post..."
- [ ] Submit form
- [ ] Updated content displays
- [ ] Database row updated

### Delete Draft
- [ ] Find test draft
- [ ] Click delete button
- [ ] Confirmation dialog (if applicable)
- [ ] Confirm deletion
- [ ] Draft removed from list
- [ ] Database row deleted

### Change Draft Status
- [ ] Create new test draft
- [ ] Change status from "Draft" to "Pending Review"
- [ ] Status updates in list
- [ ] Database column `status` updates

### Preview Content
- [ ] Open draft detail view
- [ ] Click "Preview" button (if exists)
- [ ] Preview shows how post will look on platform
- [ ] Media displays correctly (if uploaded)
- [ ] Text formatting preserved

**Issues Found**:
- [ ] None
- [ ] Issue: ________________________________

---

## 3. AI Agents (45 minutes)

**CRITICAL UNKNOWN**: How are AI agents triggered? Manual or automatic?

### View Agent Status
- [ ] Navigate to Agents page (if exists)
- [ ] List of agents displays
- [ ] Agent statuses visible (active, idle, error)
- [ ] Last run timestamp shown

### Trigger Content Generation (if manual)
- [ ] Find "Generate Content" or "Run Agent" button
- [ ] Click button
- [ ] Agent starts (loading indicator)
- [ ] Wait for completion
- [ ] Success message appears
- [ ] New draft(s) created in `content_drafts` table
- [ ] Drafts visible in Drafts list

### Automatic Agent Triggering (if exists)
- [ ] Check cron jobs or scheduled tasks
- [ ] Identify schedule (daily? hourly?)
- [ ] Wait for scheduled run (or manually trigger if possible)
- [ ] Verify drafts auto-created after run

### Review Generated Content
- [ ] Navigate to Drafts page
- [ ] Find AI-generated drafts
- [ ] Content quality check:
  - [ ] Text makes sense
  - [ ] Liberation values centered
  - [ ] UK context appropriate
  - [ ] Trauma-informed language
- [ ] Media attached (if applicable)
- [ ] Hashtags relevant

### Edit AI Suggestions
- [ ] Open AI-generated draft
- [ ] Edit content (e.g., fix typo, adjust tone)
- [ ] Save edits
- [ ] Changes persist

### Approve for Posting
- [ ] Find AI-generated draft
- [ ] Change status to "Approved"
- [ ] Draft moves to publishing queue
- [ ] Row added to `social_media_queue` table

**Issues Found**:
- [ ] None
- [ ] Issue: ________________________________
- [ ] Unknown: How to trigger agents? _______________________

---

## 4. Calendar (20 minutes)

### Month View
- [ ] Navigate to Calendar page
- [ ] Calendar displays current month
- [ ] Days of week labeled
- [ ] Current day highlighted
- [ ] Scheduled posts show on calendar (if any exist)

### Schedule New Post
- [ ] Click on future date in calendar
- [ ] "Schedule Post" form appears
- [ ] Enter post content
- [ ] Select platform
- [ ] Select time
- [ ] Submit form
- [ ] Post appears on calendar
- [ ] Database row created in `social_media_queue`

### Edit Scheduled Post
- [ ] Click on scheduled post in calendar
- [ ] Edit form appears
- [ ] Change time from 12:00 to 15:00
- [ ] Save changes
- [ ] Time updates on calendar
- [ ] Database updated

### Delete Scheduled Post
- [ ] Click on scheduled post
- [ ] Delete button visible
- [ ] Confirm deletion
- [ ] Post removed from calendar
- [ ] Database row deleted

### Filter by Platform
- [ ] Find platform filter dropdown
- [ ] Select "Instagram only"
- [ ] Calendar shows only Instagram posts
- [ ] Select "All platforms"
- [ ] All posts visible again

**Issues Found**:
- [ ] None
- [ ] Issue: ________________________________

---

## 5. Social Media Connections (1 hour per platform)

**CRITICAL**: API credentials required for each platform

### Instagram OAuth Flow
- [ ] Navigate to Settings > Connections
- [ ] Find Instagram connection
- [ ] Click "Connect Instagram"
- [ ] Redirects to Instagram OAuth
- [ ] Log in with BLKOUT Instagram account
- [ ] Grant permissions
- [ ] Redirects back to Comms BLKOUT
- [ ] "Connected" status shows
- [ ] Test post to Instagram (from queue or manual)
- [ ] Post appears on Instagram
- [ ] Connection persists after refresh

### Facebook Connection
- [ ] Click "Connect Facebook"
- [ ] OAuth flow completes
- [ ] Select BLKOUT Facebook page
- [ ] Connection successful
- [ ] Test post to Facebook

### TikTok Connection
- [ ] Click "Connect TikTok"
- [ ] OAuth flow completes
- [ ] Connection successful
- [ ] Test post to TikTok (video required)

### LinkedIn Connection
- [ ] Click "Connect LinkedIn"
- [ ] OAuth flow completes
- [ ] Connection successful
- [ ] Test post to LinkedIn

### Twitter/X Connection
- [ ] Click "Connect Twitter"
- [ ] OAuth flow completes
- [ ] Connection successful
- [ ] Test post to Twitter

### YouTube Connection (if applicable)
- [ ] Click "Connect YouTube"
- [ ] OAuth flow completes
- [ ] Connection successful
- [ ] Test video upload to YouTube

**Issues Found**:
- [ ] None
- [ ] Issue: ________________________________
- [ ] Missing: API credentials for _______________

---

## 6. Publishing Workflow (30 minutes)

### Database Status Check
```bash
# Table: social_media_queue
# Current: 8 posts (2 queued, 6 failed as of Jan 2, 2026)
# Need to investigate WHY 6 failed
```

### Approve Draft → Queue
- [ ] Create test draft
- [ ] Change status to "Approved"
- [ ] Draft disappears from Drafts list
- [ ] Draft appears in Publishing Queue
- [ ] Row added to `social_media_queue`
- [ ] Status: "queued"

### Queue Processing
- [ ] Wait for queue processor to run (cron job or manual trigger)
- [ ] Post status changes from "queued" to "publishing"
- [ ] Post status changes to "published" or "failed"
- [ ] Timestamp recorded

### Failed Posts Diagnosis
- [ ] Find 6 failed posts in database
- [ ] Check error messages (in database or logs)
- [ ] Common failure reasons:
  - [ ] API credentials missing/invalid
  - [ ] Token expired
  - [ ] Rate limit exceeded
  - [ ] Media format unsupported
  - [ ] Content violates platform rules

### Retry Failed Post
- [ ] Find failed post in UI (if visible)
- [ ] Click "Retry" button
- [ ] Post queues again
- [ ] Monitor status

### Manual Publish
- [ ] Create draft
- [ ] Click "Publish Now" (if exists)
- [ ] Post immediately sent to social media
- [ ] Success message appears
- [ ] Post visible on platform

**Issues Found**:
- [ ] None
- [ ] Issue: ________________________________
- [ ] Failed posts reason: ________________________________

---

## 7. Analytics (15 minutes)
**Note**: Only test if analytics exist in current version

### View Post Performance
- [ ] Navigate to Analytics page (if exists)
- [ ] List of published posts displays
- [ ] Metrics visible (likes, shares, comments, reach)
- [ ] Metrics accurate (spot-check against platform)

### Platform Comparison
- [ ] Compare performance across platforms
- [ ] Instagram vs. Facebook engagement
- [ ] Charts/graphs display

### Export Analytics
- [ ] Export button exists
- [ ] Click export
- [ ] CSV or PDF downloads
- [ ] Data correct

**Issues Found**:
- [ ] None
- [ ] Issue: ________________________________
- [ ] N/A (Analytics not built yet)

---

## 8. Mobile Responsiveness (10 minutes)

### Mobile View
- [ ] Open Comms BLKOUT on mobile (or resize to 375px)
- [ ] Navigation menu works (hamburger menu?)
- [ ] Drafts list scrolls vertically
- [ ] Calendar usable on mobile
- [ ] Forms not cut off
- [ ] Buttons tappable

### Touch Gestures
- [ ] Swipe to navigate (if applicable)
- [ ] Pinch to zoom disabled
- [ ] Tap accuracy good

**Issues Found**:
- [ ] None
- [ ] Issue: ________________________________

---

## 9. Accessibility (10 minutes)

### Keyboard Navigation
- [ ] Tab through UI
- [ ] Focus indicators visible
- [ ] Can submit forms with Enter key
- [ ] Dropdown menus accessible via keyboard

### Screen Reader
- [ ] Form labels read correctly
- [ ] Button purposes announced
- [ ] Status messages announced

**Issues Found**:
- [ ] None
- [ ] Issue: ________________________________

---

## 10. Performance (10 minutes)

### Page Load
- [ ] Clear cache
- [ ] Load Comms BLKOUT
- [ ] Page loads <3 seconds
- [ ] Dashboard loads <2 seconds

### Drafts List Performance
- [ ] Load Drafts page (once drafts exist)
- [ ] Renders <2 seconds
- [ ] Smooth scrolling

**Issues Found**:
- [ ] None
- [ ] Issue: ________________________________

---

## 11. Security (10 minutes)

### HTTPS
- [ ] URL: https://comms.blkoutuk.cloud
- [ ] Padlock icon visible
- [ ] Certificate valid

### Authentication
- [ ] Log out
- [ ] Try to access /drafts directly
- [ ] Redirects to login

### API Keys Hidden
- [ ] Open DevTools > Network
- [ ] Check API requests
- [ ] No social media API keys exposed in URLs/headers

**Issues Found**:
- [ ] None
- [ ] Issue: ________________________________

---

## Testing Summary

**Date Tested**: _______________
**Tester**: _______________
**Comms Version**: _______________

### Overall Results
- [ ] ✅ All tests passed
- [ ] ⚠️ Minor issues (document below)
- [ ] 🔴 Critical issues (document below)

### Critical Issues Found
1. _______________________________________________
2. _______________________________________________

### Minor Issues Found
1. _______________________________________________
2. _______________________________________________

### Blockers
- [ ] How to trigger AI agents? (manual or automatic?)
- [ ] Why are 6 posts failed in queue?
- [ ] Which social media API credentials are configured?

### Recommendations
1. Document agent triggering process
2. Investigate failed posts
3. Create test drafts to verify UI
4. Configure all social media connections

### Next Steps
1. Create GitHub issues for all bugs
2. Update `/docs/TESTING_PROGRESS.md`
3. Update `/docs/PLATFORM_TESTING_MASTER_CHECKLIST.md`
4. Get social media API credentials from team

---

## Related Documentation
- [Platform Testing Master Checklist](/home/robbe/blkout-platform/docs/PLATFORM_TESTING_MASTER_CHECKLIST.md)
- [Comms Documentation](/home/robbe/blkout-platform/apps/comms-blkout/README.md)
- [Testing Progress Tracker](/home/robbe/blkout-platform/docs/TESTING_PROGRESS.md)
- [Platform Audit Jan 2, 2026](/home/robbe/blkout-platform/docs/PLATFORM_AUDIT_JAN_2_2026.md)

---

*BLKOUT UK Cooperative © 2026 - Testing social liberation* 🏴‍☠️
