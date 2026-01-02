# Cards 39-40 Structure: OOMF Integration

## Card 39: The Explainer + Transition Video

**Type**: Video card with manual transition
**Aspect Ratio**: 16:9 (full-width video like Cards 18 & 34)

**Video Content** (you create manually):
1. **Animated heroes montage** (0-15s)
   - Quick cuts of diverse X-Men 97 heroes from the journey
   - Showcasing variety: different hair, ages, styles, poses
   - Each hero distinct, each powerful

2. **Liberation Collective slideshow** (15-35s)
   - Transition to REAL photography
   - Real BLKOUT community moments
   - Events, gatherings, connections happening

3. **Real you** (35-50s)
   - Final frame: Real photo of you (distinct from animated heroes)
   - You speaking directly to camera or powerful portrait
   - Bridge moment: From their heroes to yours

4. **OOMF preview** (50-60s)
   - Quick glimpse of OOMF Interactive interface
   - Empty hero panel waiting
   - Text: "Now create yours."

**Text Overlay (final frame):**
"We're the heroes we've been waiting for.
Now put yourself in the story."

**No CTA button** - auto-scrolls to Card 40 immediately

---

## Card 40: OOMF Interactive (EMBEDDED)

**Type**: Embedded interactive widget
**Layout**: Full-height card with embedded iframe

**Structure:**
```tsx
<div className="h-screen snap-start flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-black">
  {/* Header */}
  <motion.div className="text-center mb-8">
    <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight mb-4">
      Create Your Hero Panel
    </h1>
    <p className="text-xl text-amber-400 font-bold">
      The Liberation Collective awaits your story
    </p>
  </motion.div>

  {/* OOMF Interactive Embedded */}
  <div className="w-full max-w-6xl h-[600px] border-2 border-purple-700/50 rounded-2xl overflow-hidden bg-black">
    <iframe
      src="https://blkoutuk.github.io/OOMF_Interactive/"
      className="w-full h-full"
      title="Create Your Hero Panel"
      allow="camera; microphone"
      sandbox="allow-same-origin allow-scripts allow-forms"
    />
  </div>

  {/* Fallback if iframe blocked */}
  <motion.a
    href="https://blkoutuk.github.io/OOMF_Interactive/"
    target="_blank"
    rel="noopener noreferrer"
    className="mt-8 px-8 py-4 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-black text-lg rounded-lg hover:from-fuchsia-500 hover:to-pink-500 transition-all"
  >
    Open in New Tab →
  </motion.a>

  {/* Horizontal CTA Scroll at bottom */}
  <div className="mt-12 w-full">
    <p className="text-center text-purple-400 text-sm mb-4">Or explore other ways to connect:</p>
    <HorizontalCTAScroll cardId={40} />
  </div>
</div>
```

**Features:**
- OOMF embedded directly in page
- No page exit required
- Fallback link if embedding blocked
- Additional engagement options below (horizontal scroll)

**Testing Notes:**
- Check if OOMF allows iframe embedding (X-Frame-Options)
- Test camera/microphone permissions in iframe
- Verify OOMF functionality works when embedded
- If blocked: Use modal overlay or new tab fallback

---

## Updated Card Sequence

**Card 38**: Horizontal CTA scroll (Newsletter, HUB, Platform, Your Voice Matters)
**Card 39**: Transition video (animated → real → you)
**Card 40**: OOMF Interactive embedded + horizontal CTA scroll fallback

**Flow**: Story → Video transition → Create hero panel (no page exit) → Additional pathways
