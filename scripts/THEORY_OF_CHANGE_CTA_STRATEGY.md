# Theory of Change v2.0 - CTA Integration Strategy

**Goal**: Strategic CTAs throughout the 40-card journey to drive engagement with the platform ecosystem

## CTA Placement Map

### ACT 1: RECOGNITION (Cards 1-10)
**Narrative**: Recognizing isolation and longing for connection

**Card 10 - CTA**: "Start connecting"
- **Link**: https://events.blkoutuk.cloud
- **Copy**: "Join our next gathering →"
- **Why**: After recognizing isolation, immediate actionable step

---

### ACT 2: THE PROBLEM (Cards 11-18)
**Narrative**: Understanding systemic isolation

**Card 17 - CTA**: "Read our stories"
- **Link**: /stories (article archive)
- **Copy**: "300+ articles by us, for us →"
- **Why**: Before video, show proof this community exists
- **NOTE**: Article archive accessibility needs improvement (next task)

**Video Card 18**: No CTA (let video play)

---

### ACT 3: WHAT WE'RE BUILDING (Cards 19-29)
**Narrative**: Showcasing the platform and community infrastructure

**Card 21 - CTA**: "RSVP to next gathering"
- **Link**: https://events.blkoutuk.cloud
- **Copy**: "See what's happening →"
- **Why**: After mentioning monthly gatherings, direct path to join

**Card 24 - CTA**: "Read the newsroom"
- **Link**: https://news.blkoutuk.cloud
- **Copy**: "Explore our stories →"
- **Why**: After stats about articles, invite them to read

**Card 26 - CTA**: "Find your city"
- **Link**: https://events.blkoutuk.cloud (with city filter)
- **Copy**: "Connect locally →"
- **Why**: After map showing geographic spread

**Card 29 - CTA**: "Meet IVOR"
- **Link**: https://ivor.blkoutuk.cloud
- **Copy**: "Your AI companion →"
- **Why**: After tech infrastructure mention, show the AI

---

### ACT 4: THE CORE (Cards 30-34)
**Narrative**: Core insights and emotional resonance

**Card 32 - CTA**: "Learn about governance"
- **Link**: /governance
- **Copy**: "How we're different →"
- **Why**: After structural critique, show alternative model

**Video Card 34**: No CTA (let video build to climax)

---

### ACT 5: THE INVITATION (Cards 35-40)
**Narrative**: Direct invitation to participate

**HORIZONTAL SCROLL CTAs (Cards 37-39)**
Each card features a horizontally scrollable list of engagement pathways:

**Card 37 - CTA Scroll**: "Ways to Connect"
1. **Newsletter**
   - Link: https://crm.blkoutuk.cloud/api/community/join (embedded form)
   - Copy: "Get the newsletter"

2. **BLKOUTHUB**
   - Link: https://blkouthub.com
   - Copy: "Connect @ BLKOUTHUB"

3. **Platform**
   - Link: /platform
   - Copy: "Explore the platform"

4. **Your Voice Matters** (NEW - expands to show options)
   - Social media follow (Instagram, Twitter, etc.)
   - HUB membership
   - Board membership
   - Contribute: Write, film, record, organize with us
   - Email: hello@blkoutuk.com

**Card 38 - CTA**: Newsletter signup
- **Primary**: Newsletter signup form (embedded)
- **Link**: https://crm.blkoutuk.cloud/api/community/join
- **Copy**: "Stay connected →"
- **Why**: After open response, capture their interest

**Card 39 - OOMF EXPLAINER**: "We're the heroes we've been waiting for"
- **Type**: Explainer card with manual transition video
- **Video**: Animated heroes → Real Liberation Collective → Real you (you create)
- **Copy**: "Now it's your turn. Create your hero panel."
- **Why**: Set up for embedded OOMF widget on next card
- **NO external link** - flows directly to Card 40

**Card 40 - PRIMARY CONVERSION**: OOMF Interactive (EMBEDDED)
- **Type**: Interactive widget embedded in page
- **Content**: Full OOMF Interactive experience embedded via iframe
- **Copy**: "Create Your Hero Panel" (header above widget)
- **Implementation**: `<iframe src="https://blkoutuk.github.io/OOMF_Interactive/" />`
- **Why**: Final conversion happens IN the experience, no page exit required
- **Fallback**: If embedding fails, CTA button to open in new tab

---

## CTA Implementation Pattern

**Visual Design** (consistent across all CTAs):
```typescript
<motion.a
  href="[URL]"
  target={isExternal ? "_blank" : undefined}
  rel={isExternal ? "noopener noreferrer" : undefined}
  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold text-lg rounded-lg hover:from-amber-500 hover:to-amber-400 transition-all transform hover:scale-105 uppercase tracking-tight mt-8"
  style={{ fontFamily: "'Arial Black', 'Arial', sans-serif" }}
>
  {ctaText}
  <ExternalLink className="w-5 h-5" />
</motion.a>
```

**Colors**:
- **Primary CTAs** (Cards 38, 40): Fuchsia/Pink gradient (brand primary)
- **Secondary CTAs** (all others): Amber/Gold (accent, less aggressive)

**Placement**:
- Below main card text
- Above card bottom margin
- Centered or left-aligned based on card layout

---

## Analytics Tracking

Update `handleInteraction` to track CTA clicks:
```typescript
const handleCTAClick = (cardId: number, ctaType: string, destination: string) => {
  console.log('CTA Click:', { cardId, ctaType, destination, timestamp: new Date().toISOString() })
  // TODO: Send to analytics
}
```

**Track**:
- Which card CTA was clicked
- Destination URL
- Conversion funnel: View → Interact → Click CTA → Convert

---

## Total CTAs

- **10 strategic CTAs** throughout the journey
- **1 primary conversion** (Card 40 OOMF)
- **1 share button** (persistent top-right)

**Conversion Funnel**:
1. Watch (passive scrolling)
2. Recognize (emotional resonance)
3. Interact (8 interactive moments)
4. Explore (10 CTAs to platform services)
5. Convert (OOMF hero panel creation)
