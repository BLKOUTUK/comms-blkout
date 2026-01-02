# Joseph Beam Archive Accessibility Issue

**Date**: December 24, 2025
**Reporter**: User feedback during Holiday 2025 campaign
**Priority**: Medium (impacts member engagement for Joseph Beam Day Quiz)

---

## 🚨 Issue

> "I would have liked to engage members with the articles in the archive that feature Joseph Beam - the archive remains inaccessible and/or hidden"

**Context**: Joseph Beam Day Quiz scheduled for December 28th @ 6PM GMT. Members should be able to:
- Read articles about/by Joseph Beam
- Engage with archival content
- Prepare for quiz by exploring BLKOUT's Joseph Beam coverage

**Current State**: Archive is either:
1. Technically inaccessible (broken links, permissions issues)
2. Hidden in UI (not discoverable, poor navigation)
3. Not properly tagged/searchable

---

## 🎯 Impact

**For Joseph Beam Day Quiz (Dec 28)**:
- Members can't prepare by reading relevant articles
- Reduced engagement opportunity
- Missed chance to educate about Joseph Beam's legacy
- Quiz feels disconnected from BLKOUT's content

**Broader Impact**:
- Archive content generally underutilized
- Historical Black queer brilliance not discoverable
- SEO opportunities missed
- Content investment not paying dividends

---

## 🔍 Investigation Needed

### 1. Technical Accessibility
**Questions**:
- Are archive URLs working? (404s, 500s, permission errors?)
- Is archive behind authentication that shouldn't be?
- Are there broken database queries?
- Is content actually migrated or still in old system?

**Action**: Test archive URLs, check server logs, verify database records

### 2. Discoverability (UI/UX)
**Questions**:
- Is there a clear "Archive" or "Library" navigation link?
- Can users search archive content?
- Are articles tagged properly (e.g., "Joseph Beam", "In the Life anthology")?
- Is archive visible on mobile?
- Is there a Joseph Beam-specific collection or category?

**Action**: User journey mapping, search functionality audit

### 3. Content Organization
**Questions**:
- How many Joseph Beam articles exist?
- Are they categorized/tagged consistently?
- Is there metadata (author, date, topics)?
- Are there broken image/media links in old articles?

**Action**: Content audit, metadata review

---

## 💡 Proposed Solutions

### Quick Win (Before Dec 28 Quiz)

**Option A: Create "Joseph Beam Collection" Landing Page**
- Temporary page at `/joseph-beam-collection`
- Manually curated list of relevant articles
- Brief bio of Joseph Beam
- CTA: "Prepare for the quiz by exploring these articles"
- Link from quiz promotional materials

**Option B: Email Newsletter Feature**
- Send newsletter to subscribers before Dec 28
- Include 3-5 Joseph Beam article links
- Brief excerpts to entice reading
- Direct engagement without fixing full archive

**Option C: Social Media Thread**
- Twitter/Instagram thread highlighting Joseph Beam articles
- Quote key passages
- Link to individual articles
- Builds excitement for quiz

### Medium-Term (Week 2-3)

**Archive Navigation Overhaul**
1. Add "Archive" or "Library" to main navigation
2. Create archive home page with:
   - Search functionality
   - Filter by topic/author/date
   - Featured collections
3. Tag all content consistently
4. Create topic pages (e.g., `/archive/topics/joseph-beam`)

**Search Enhancement**
1. Implement full-text search across archive
2. Tag articles with people mentioned
3. "Related articles" recommendations
4. Search results show context snippets

### Long-Term (Month 2-3)

**Archive as Engagement Hub**
1. User annotations/highlights
2. Community discussions on articles
3. "Article of the Week" feature
4. Reading lists/collections users can create
5. Integration with events (e.g., quiz references archive articles)

---

## 🏗️ Technical Investigation Checklist

**For next session**:
- [ ] Find archive codebase location
- [ ] Test existing archive URLs
- [ ] Check database schema for articles/content
- [ ] Review search implementation
- [ ] Audit Joseph Beam article count and status
- [ ] Map current user journey to archive
- [ ] Identify quick navigation fixes

---

## 📁 Likely File Locations to Check

Based on BLKOUT platform structure:

**Newsroom/Archive App** (likely separate from comms-blkout):
- `/home/robbe/blkout-platform/apps/newsroom-backend/` (if exists)
- `/home/robbe/blkout-platform/apps/blkout-website/` (archive section?)
- Supabase tables: `articles`, `news_items`, `archive_content`, `posts`

**Search Functionality**:
- Algolia integration? (check env vars)
- PostgreSQL full-text search
- Client-side filtering

**Navigation**:
- `/home/robbe/blkout-platform/apps/blkout-website/src/components/Header.tsx`
- `/home/robbe/blkout-platform/apps/blkout-website/src/components/Navigation.tsx`
- Route configurations

---

## 🎯 Success Criteria

**Immediate (before Dec 28)**:
- ✅ Members can access at least 3 Joseph Beam articles easily
- ✅ Clear pathway from quiz promo to relevant content
- ✅ No 404s or broken links

**Week 2-3**:
- ✅ Archive visible in main navigation
- ✅ Search functionality working
- ✅ All Joseph Beam content tagged and discoverable

**Long-term**:
- ✅ Archive is destination, not afterthought
- ✅ 10%+ of members engage with archive monthly
- ✅ Archive content referenced in events/newsletters
- ✅ SEO traffic to archive articles

---

## 💬 User Quote (Remember This)

> "I would have liked to engage members with the articles in the archive that feature Joseph Beam"

**Translation**: We have valuable content, but it's not working for us. Fix this.

---

**Next Action**: Investigate archive technical implementation and create quick win solution before Dec 28 quiz.
