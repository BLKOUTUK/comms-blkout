# TheoryOfChange Component Updates Required

## Priority Updates for Theory of Change v2.0

### 1. Card Aspect Ratios (HIGH PRIORITY)
**Current**: All cards use `aspect-video` (16:9)
**Required**: Standard cards should be **4:5 portrait**

**Update locations**:
- Beauty cards: Change `aspect-video` → `aspect-[4/5]`
- Video cards (18, 34, 39): Keep `aspect-video` (16:9)
- OOMF card (40): Custom dimensions for embedded iframe

---

### 2. Act 5 Card Restructure (Cards 37-40)

**Card 37 - Open Response + Horizontal CTA Scroll**
```typescript
{
  id: 37,
  type: 'interactive',
  visualStyle: 'animated',
  content: {
    title: 'If we had everything we needed, what would you want us to build?',
    body: 'Share your vision'
  },
  background: 'from-violet-950 via-fuchsia-950 to-purple-950',
  interactive: {
    type: 'openresponse',
    data: {
      placeholder: 'I would build...'
    }
  },
  cta: {
    type: 'horizontal-scroll',
    options: ['newsletter', 'blkouthub', 'platform', 'your-voice-matters']
  }
}
```

**Card 38 - "The damage is structural. The repair is relational." + Horizontal CTA**
```typescript
{
  id: 38,
  type: 'statement',
  visualStyle: 'animated',
  content: {
    body: 'The damage is structural.',
    highlight: 'The repair is relational.'
  },
  background: 'from-purple-950 via-violet-950 to-indigo-950',
  cta: {
    type: 'horizontal-scroll',
    options: ['newsletter', 'blkouthub', 'platform', 'your-voice-matters']
  }
}
```

**Card 39 - Transition Video (NEW)**
```typescript
{
  id: 39,
  type: 'video',
  visualStyle: 'animated', // but contains real photography
  content: {
    title: 'We\'re the heroes we\'ve been waiting for.'
  },
  background: 'from-indigo-950 via-purple-950 to-black',
  video: {
    title: 'The Transition',
    placeholder: 'Manual Video - User Created',
    duration: '60s',
    style: 'Animated heroes → Real Liberation Collective → Real you',
    videoUrl: '/videos/card-39-transition.mp4' // User uploads
  }
}
```

**Card 40 - OOMF Embedded (REDESIGNED)**
```typescript
{
  id: 40,
  type: 'oomf-embedded',
  visualStyle: 'interactive',
  content: {
    title: 'Create Your Hero Panel',
    body: 'The Liberation Collective awaits your story'
  },
  background: 'from-indigo-950 via-purple-950 to-black',
  oomf: {
    embedUrl: 'https://blkoutuk.github.io/OOMF_Interactive/',
    fallbackUrl: 'https://blkoutuk.github.io/OOMF_Interactive/',
    height: '600px'
  },
  cta: {
    type: 'horizontal-scroll',
    options: ['newsletter', 'blkouthub', 'platform', 'your-voice-matters']
  }
}
```

---

### 3. CTA Fixes

**Card 17**: Update link
```typescript
// CURRENT (WRONG):
// No CTA

// REQUIRED:
cta: {
  type: 'single',
  text: '300+ articles by us, for us →',
  link: '/stories',
  color: 'amber'
}
```

**Card 24**: Update newsroom link
```typescript
cta: {
  type: 'single',
  text: 'Explore our stories →',
  link: '/stories', // Changed from news.blkoutuk.cloud
  color: 'amber'
}
```

---

### 4. Add HorizontalCTAScroll Component

**Import**:
```typescript
import HorizontalCTAScroll from './HorizontalCTAScroll'
```

**Component location**:
- Copy from `/home/robbe/blkout-platform/apps/comms-blkout/scripts/ACT5_HORIZONTAL_CTA_COMPONENT.tsx`
- To: `/home/robbe/blkout-website/src/components/movement/HorizontalCTAScroll.tsx`

---

### 5. Update Card Rendering

**Add new case for 'oomf-embedded'**:
```typescript
case 'oomf-embedded':
  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isActive ? { opacity: 1, y: 0 } : {}}
        className="text-center mb-8"
      >
        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight mb-4">
          {card.content.title}
        </h1>
        <p className="text-xl text-amber-400 font-bold">
          {card.content.body}
        </p>
      </motion.div>

      {/* OOMF Embedded */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isActive ? { opacity: 1, scale: 1 } : {}}
        className="w-full border-2 border-purple-700/50 rounded-2xl overflow-hidden bg-black"
        style={{ height: card.oomf?.height || '600px' }}
      >
        <iframe
          src={card.oomf?.embedUrl}
          className="w-full h-full"
          title="Create Your Hero Panel"
          allow="camera; microphone"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </motion.div>

      {/* Fallback + Alternative Pathways */}
      <div className="mt-8 w-full">
        <motion.a
          href={card.oomf?.fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 0.6 } : {}}
          className="block text-center text-sm text-purple-400 hover:text-purple-300 mb-6"
        >
          Having trouble? Open in new tab →
        </motion.a>

        {card.cta?.type === 'horizontal-scroll' && (
          <>
            <p className="text-center text-purple-400 text-sm mb-4">
              Or explore other ways to connect:
            </p>
            <HorizontalCTAScroll cardId={card.id} />
          </>
        )}
      </div>
    </div>
  )
```

---

### 6. Interface Updates

**Update CardData interface**:
```typescript
interface CardData {
  // ... existing fields
  cta?: {
    type: 'single' | 'horizontal-scroll'
    text?: string
    link?: string
    color?: 'amber' | 'fuchsia'
    options?: string[] // for horizontal scroll
  }
  video?: {
    // ... existing fields
    videoUrl?: string // For actual video file path
  }
}
```

**Update type union**:
```typescript
type: 'text' | 'visual' | 'interactive' | 'video' | 'statement' | 'beauty' | 'cascade' | 'oomf' | 'oomf-embedded'
```

---

## Summary

**Total Changes:**
1. ✅ Aspect ratios: 4:5 for standard cards
2. ✅ Card 17 & 24: Link to /stories
3. ✅ Cards 37-38: Add horizontal CTA scroll
4. ✅ Card 39: Change to transition video (user creates)
5. ✅ Card 40: Embed OOMF widget instead of external link
6. ✅ Import and integrate HorizontalCTAScroll component

**Next Task**: Fix /stories accessibility before deploying Theory of Change v2.0
