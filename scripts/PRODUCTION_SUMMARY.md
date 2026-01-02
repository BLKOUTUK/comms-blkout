# Theory of Change v2.0 - Production Summary

## ✅ APPROVED APPROACH: Hybrid Styling

**Visual Strategy:**
- **Animated Protagonists**: X-Men 97 cel-shaded Black queer heroes (diverse presentations throughout)
- **Real Backgrounds**: Actual photography/hyper-realistic environments (4:5 portrait)
- **Final Transition**: Card 40 video shows animated → real crossover (you create manually)

## 📋 Production Documents Created

All documents located in: `/home/robbe/blkout-platform/apps/comms-blkout/scripts/`

1. **THEORY_OF_CHANGE_PHOTO_REQUIREMENTS.md**
   - 40 cards with specific background photo needs
   - Aspect ratios: 4:5 for standard cards, 16:9 for videos
   - Scene descriptions for photo search

2. **THEORY_OF_CHANGE_CTA_STRATEGY.md**
   - 10 strategic CTAs mapped across the journey
   - Links to: Events, Newsroom, IVOR, Governance, CRM, OOMF
   - Analytics tracking plan

3. **VIDEO_2_HEROES_PRODUCTION_PROMPTS.md**
   - Card 34: 4-scene structure (60-90s)
   - Wan 2.6 prompts for each scene
   - Team assembly → What we built → Invitation → Threshold

## 🎬 Video Production Plan

**Video 1 (Card 18)**: "We Don't Know Each Other (Yet)"
- 60-90 seconds
- Fully animated X-Men 97
- **Status**: Prompts needed

**Video 2 (Card 34)**: "Heroes"
- 60-90 seconds, 4 scenes
- Fully animated X-Men 97
- **Status**: ✅ Prompts documented

**Video 3 (Card 40)**: Transition/Crossover
- User-created manual video
- Animated heroes → Real Liberation Collective → Real you
- Ends with OOMF CTA
- **Status**: User production

## 🖼️ Image Production Workflow

### Current Status
- ✅ Wan 2.6 DashScope API connected (`WAN_API_KEY` configured)
- ✅ Hybrid compositing tested and approved
- ✅ 4 sample X-Men 97 images generated (Gemini)
- ✅ 2 hybrid composite tests successful (Wan + real backgrounds)

### Next Steps

**Phase 1: Background Photo Collection** (USER)
- Source 30+ real background photos (4:5 portrait)
- Match to card requirements in THEORY_OF_CHANGE_PHOTO_REQUIREMENTS.md
- Upload to `/home/robbe/blkout-website/public/images/theory-backgrounds/`

**Phase 2: Automated Generation** (CLAUDE)
- Generate 38 hybrid cards (Cards 1-39 excluding videos 18, 34)
- Each card: Animated X-Men 97 character + real background
- Diverse character presentations (hair, age, style, pose variety)
- Output: 4:5 PNG files

**Phase 3: Video Generation** (CLAUDE + USER)
- Generate Video 2 "Heroes" (4 scenes, Card 34)
- User creates Video 3 transition (Card 40)
- Video 1 prompts to be defined

**Phase 4: Integration** (CLAUDE)
- Update TheoryOfChange component with generated visuals
- Update aspect ratios to 4:5 for standard cards
- Add all 10 CTAs with proper links
- Deploy to Coolify

## 🎨 Character Diversity Plan

**Show range of Black queer male presentations:**
- Hair: Locs, afros, fades, twists, waves, braids
- Age: 20s, 30s, 40s, 50s+
- Style: Streetwear, professional, casual, formal, athletic
- Body types: Slim, athletic, larger builds
- Presentation: Masculine, fem, androgynous
- Features: Beards, clean-shaven, facial piercings, glasses

**Goal**: Viewer sees themselves somewhere in the 40-card journey before final "put yourself in the story" invitation.

## 💰 Estimated Costs

- **Images** (38 cards): ~38 × $0.03 = ~$1.14
- **Videos** (2 scenes × 4 clips): ~8 × $0.30 = ~$2.40
- **Total**: ~$3.50-4.00 USD

## 📍 Key File Locations

**Production Documents:**
- `/home/robbe/blkout-platform/apps/comms-blkout/scripts/THEORY_OF_CHANGE_PHOTO_REQUIREMENTS.md`
- `/home/robbe/blkout-platform/apps/comms-blkout/scripts/THEORY_OF_CHANGE_CTA_STRATEGY.md`
- `/home/robbe/blkout-platform/apps/comms-blkout/scripts/VIDEO_2_HEROES_PRODUCTION_PROMPTS.md`
- `/home/robbe/blkout-platform/apps/comms-blkout/scripts/PRODUCTION_SUMMARY.md` (this file)

**Wan API Service:**
- `/home/robbe/blkout-platform/apps/comms-blkout/scripts/services/wan-direct.ts`

**Visual Generator:**
- `/home/robbe/blkout-platform/apps/comms-blkout/scripts/generate-theory-of-change-visuals.ts` (Gemini-based, for reference)
- **To create**: `generate-theory-wan-hybrid.ts` (Wan-based hybrid generator)

**TheoryOfChange Component:**
- `/home/robbe/blkout-website/src/components/movement/TheoryOfChange.tsx`

**Generated Test Images:**
- `/home/robbe/blkout-website/public/images/theory-of-change/`
  - `card-01-isolation.png` (Gemini)
  - `card-02-same.png` (Gemini)
  - `card-09-inversion.png` (Gemini)
  - `card-11-geography.png` (Gemini)
  - `hybrid-test-card-01.png` (Wan hybrid)
  - `hybrid-real-bg-test.png` (Wan + real photo composite)
  - `wan-test-image.png` (Wan test)

---

**Status**: Ready for background photo collection. Once backgrounds provided, automated generation can begin.

---

## 🚨 NEXT TASK AFTER THEORY OF CHANGE

**Article Archive Accessibility Issue**
- **Current**: /stories route exists but has accessibility problems
- **Required**: Fix article archive to be properly accessible
- **Context**: Card 17 CTA points to /stories - must work before deployment
- **Priority**: High - blocks Theory of Change v2.0 launch
