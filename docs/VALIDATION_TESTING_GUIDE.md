# Validation Layer Testing Guide - Holiday Campaign

**Date**: December 24, 2025
**Purpose**: Test ValuesCheck component with real holiday campaign graphics
**Status**: Ready for manual testing

---

## 🎯 Test Objective

Validate that the new approval workflow:
1. ✅ Shows validation modal before approval
2. ✅ Blocks approval until all required checks pass
3. ✅ Catches values violations (fabricated data, wrong demographics, missing branding)
4. ✅ Enforces brand voice consistency
5. ✅ Saves validation results for audit trail

---

## 🚀 Setup

### 1. Start Dev Server

```bash
cd /home/robbe/blkout-platform/apps/comms-blkout
npm run dev
```

**Server will start at**: `http://localhost:5173` (or next available port)

### 2. Navigate to Editorial Interface

Open browser: `http://localhost:5173/admin/editorial`

(Or whichever port Vite assigns - check terminal output)

---

## 🧪 Test Scenarios

### Scenario 1: Test with CORRECT Holiday Graphic (v2)
**Graphic**: `generated-campaign-assets-v2/01-festive-logo.png`

**Expected Validation Results**:
- ✅ Data verified: No statistics claimed
- ✅ Demographics authentic: No people shown
- ✅ No fabrication: No claims made
- ✅ Official branding: BLKOUT logo present (or text "BLKOUT")
- ✅ App descriptions: N/A (no apps mentioned)
- ✅ Brand voice recognizable: Purple, gold, green gradient; festive aesthetic
- ✅ Visual consistency: Matches BLKOUT guidelines
- ✅ CTA clear: "BLKOUTUK.COM" present

**Action**: All checks should PASS → Approve successfully

---

### Scenario 2: Test with PROBLEMATIC v1 Graphic
**Graphic**: `generated-campaign-assets/02-achievements-infographic.png` (if still exists)

**Expected Validation Results**:
- ❌ Data verified: Claims "10,000+ connections" - FABRICATED!
- ✅ Demographics authentic: No people shown
- ❌ No fabrication: Contains unverified statistics
- ❌ Official branding: May have text logo instead of official PNG
- ⚠️ App descriptions: Need to check if apps mentioned correctly
- ✅ Brand voice recognizable: Uses BLKOUT colors
- ⚠️ Visual consistency: May vary
- ⚠️ CTA clear: May be vague or missing

**Action**: Should FAIL data verification and no fabrication checks → Block approval

---

### Scenario 3: Test with Down App Mockup (v1)
**Graphic**: `generated-campaign-assets/05-app-previews.png` (if wrong demographics)

**Expected Validation Results**:
- ⚠️ Data verified: Check if statistics shown
- ❌ Demographics authentic: May show Black woman on gay men's app - FAIL!
- ✅ No fabrication: Depends on content
- ⚠️ Official branding: Check logo
- ❌ App descriptions: May have Critical Frequency/Down swapped
- ✅ Brand voice recognizable: BLKOUT colors
- ⚠️ Visual consistency: Check
- ⚠️ CTA clear: Check

**Action**: Should FAIL demographics check → Block approval until regenerated

---

### Scenario 4: Test with CORRECTED App Previews (v2)
**Graphic**: `generated-campaign-assets-v2/05-app-previews-CORRECTED.png`

**Expected Validation Results**:
- ✅ Data verified: No fabricated stats
- ✅ Demographics authentic: Should show Black queer men (verify visually)
- ✅ No fabrication: Factual descriptions
- ✅ Official branding: BLKOUT logo present
- ✅ App descriptions: Critical Frequency = mental health, Down = hook-up
- ✅ Brand voice recognizable: BLKOUT colors and style
- ✅ Visual consistency: Matches guidelines
- ✅ CTA clear: "Subscribe: BLKOUTUK.COM/newsletter"

**Action**: All checks should PASS → Approve successfully

---

## 📋 Manual Testing Checklist

### For Each Test Graphic:

1. **Create New Task**:
   - [ ] Click "New Task" in Editorial interface
   - [ ] Enter prompt: "Holiday campaign - [graphic name]"
   - [ ] Select platform: Instagram
   - [ ] Click "Add"

2. **Upload/Link Graphic**:
   - [ ] If editorial supports image upload, upload test graphic
   - [ ] OR manually set generatedImage state (dev tools)
   - [ ] OR use SocialSync to generate fresh image from prompt

3. **Click "Approve & Save"**:
   - [ ] Validation modal should appear
   - [ ] Modal should show ValuesCheck component
   - [ ] 8 validation checks should be listed

4. **Review Validation Checks**:
   - [ ] Data verified: Check for fabricated statistics
   - [ ] Demographics authentic: Check representation
   - [ ] No fabrication: Check all claims are truthful
   - [ ] Official branding: Check for actual logo files (not AI text)
   - [ ] App descriptions: Verify Critical Frequency/Down accuracy
   - [ ] Brand voice: Check colors (#a855f7, #f59e0b, #10b981, #14b8a6)
   - [ ] Visual consistency: Check BLKOUT aesthetic
   - [ ] CTA clear: Check for action verb + URL

5. **Mark Checks**:
   - [ ] Click ✓ for passes
   - [ ] Click ✗ for fails
   - [ ] Add notes in optional fields (data source, reasoning)

6. **Test Approval Blocking**:
   - [ ] If ANY required check fails → "Confirm Values Check Complete" button should be disabled
   - [ ] Error message: "All required checks must pass before approval"
   - [ ] Fix issues → Mark as pass → Button enables

7. **Complete Approval**:
   - [ ] All required checks pass → Click "Confirm Values Check Complete"
   - [ ] Validation modal closes
   - [ ] Asset saves to database
   - [ ] Task marked completed
   - [ ] Scheduling modal appears

8. **Verify Audit Trail**:
   - [ ] Check browser console / network tab
   - [ ] Validation results should be in asset metadata
   - [ ] Timestamp should be present
   - [ ] Notes should be saved

---

## 🐛 Known Issues / Expected Behaviors

### Issue 1: Image Upload in Editorial
**Current State**: Editorial may not have direct image upload
**Workaround**: Use SocialSync to generate, then test in Editorial queue

### Issue 2: Database Schema
**Current State**: `validation_results` column doesn't exist in `generated_assets` table yet
**Impact**: Validation will work in UI, but results stored in metadata jsonb field
**Next Step**: Create migration to add dedicated validation_results column

### Issue 3: Existing Assets
**Current State**: v1 graphics already in `generated-campaign-assets/` folder
**Test Strategy**:
1. Test with v2 corrected graphics first (should all pass)
2. Test with v1 problematic graphics (should fail specific checks)
3. Demonstrate that validation catches the exact issues we discovered

---

## ✅ Success Criteria

**Validation layer is working correctly if:**

1. ✅ Modal appears before approval (not after)
2. ✅ All 8 validation checks are visible and interactive
3. ✅ Required checks block approval when failed
4. ✅ Approval proceeds only when all required checks pass
5. ✅ Validation results saved in asset metadata
6. ✅ User can add notes to document data sources
7. ✅ Cancel button returns to pending state without approval
8. ✅ Brand voice checks enforce BLKOUT aesthetic

**Real-world validation if:**

1. ✅ Catches fabricated data ("10,000+ connections" without source)
2. ✅ Catches demographic issues (Black woman on gay men's app)
3. ✅ Catches missing logos (AI-generated text instead of PNG)
4. ✅ Catches incorrect app descriptions (swapped Critical Frequency/Down)
5. ✅ Catches brand inconsistency (wrong colors, poor contrast)
6. ✅ Catches missing/vague CTAs

---

## 📊 Test Results Template

```markdown
### Test Session: [Date/Time]
**Tester**: [Name]
**Graphics Tested**: [List]

#### Test 1: Festive Logo (v2)
- Validation modal appeared: ✅ / ❌
- All checks visible: ✅ / ❌
- Data verification: PASS / FAIL - [notes]
- Demographics: PASS / FAIL - [notes]
- No fabrication: PASS / FAIL - [notes]
- Official branding: PASS / FAIL - [notes]
- App descriptions: PASS / FAIL / N/A
- Brand voice: PASS / FAIL - [notes]
- Visual consistency: PASS / FAIL - [notes]
- CTA clear: PASS / FAIL - [notes]
- Approval blocked when required checks failed: ✅ / ❌
- Approval succeeded when all checks passed: ✅ / ❌
- Validation results saved: ✅ / ❌

#### Test 2: [Next graphic]
...

#### Issues Found:
- [List any bugs, UX issues, unclear checks]

#### Suggestions:
- [Improvements to validation criteria, help text, etc.]
```

---

## 🚧 Next Steps After Testing

### If Tests Pass:
1. Create database migration for validation_results column
2. Document validation workflow in BRAND_GUIDELINES.md
3. Train team on using ValuesCheck
4. Start using for all AI-generated content

### If Tests Reveal Issues:
1. Fix bugs in ValuesCheck.tsx
2. Refine validation criteria based on feedback
3. Improve help text for clarity
4. Re-test until all scenarios pass

---

## 💡 Key Learning Points to Validate

**From LEARNINGS_AND_PRIORITIES.md:**

1. **"AI has no ethical guardrails for our specific values"**
   - Validation layer provides those guardrails ✅

2. **"Fabricated data - AI invented statistics without verification"**
   - Data verified check catches this ✅

3. **"Wrong demographics - Black woman on gay men's app"**
   - Demographics authentic check catches this ✅

4. **"No values checking before publishing"**
   - Validation modal blocks approval until verified ✅

5. **"AI doesn't understand Black queer community representation"**
   - Human reviewer enforces cultural authenticity ✅

6. **"Brand voice consistency regardless of AI provider"**
   - Design voice checks ensure BLKOUT aesthetic ✅

---

**Ready to test! Follow checklist above using holiday campaign graphics.** 🚀
