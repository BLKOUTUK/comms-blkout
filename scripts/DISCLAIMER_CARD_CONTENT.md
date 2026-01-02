# Theory of Change - Disclaimer Card (Card 0)

**Position**: Opening card before Card 1
**Type**: Statement card
**Aspect Ratio**: 4:5 portrait (1080x1350)
**Background**: Solid gradient (from-indigo-950 via-purple-950 to-black)

---

## Card Content

### Main Text (Large, Centered)
```
THE FOLLOWING IMAGERY CREATED WITH AI
```

### Subtext (Medium, Amber accent)
```
Representing diverse Black queer experiences
```

### Fine Print (Small, Purple-400)
```
Models used:
• Alibaba Wan 2.6 (DashScope) - Image generation
• Google Gemini 3 Pro - Concept development

Real photography appears in:
Cards 20, 27, 29 (Liberation Collective community photos)
Card 39 transition video (community + Rob)
Card 40 OOMF Interactive

All AI-generated characters represent
fictional individuals inspired by our community.
```

---

## Component Implementation

```typescript
{
  id: 0,
  type: 'statement',
  visualStyle: 'text-only',
  content: {
    title: 'THE FOLLOWING IMAGERY CREATED WITH AI',
    body: 'Representing diverse Black queer experiences',
    subtext: `Models used:
• Alibaba Wan 2.6 (DashScope) - Image generation
• Google Gemini 3 Pro - Concept development

Real photography appears in Cards 20, 27, 29, 39, 40`
  },
  background: 'from-indigo-950 via-purple-950 to-black'
}
```

---

## Visual Design

**Typography**:
- Main: Arial Black, text-6xl, uppercase, white, tracking-tight
- Subtext: Arial, text-2xl, amber-400, font-bold
- Fine print: Arial, text-sm, purple-400, leading-relaxed

**Layout**:
- Centered vertically and horizontally
- Max-width: 800px
- Padding: 12 on mobile, 24 on desktop
- No interactive elements (just scroll to continue)

**Duration**:
- Users can scroll past immediately
- No forced delay
- Sets transparent expectations upfront

---

## Alternative: Footer Disclaimer

Instead of opening card, could add persistent footer text on all cards:

```typescript
<p className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-purple-600 text-center max-w-2xl">
  AI-generated imagery (Wan 2.6, Gemini 3) • Real photos: Cards 20,27,29,39,40
</p>
```

**Recommendation**: Opening disclaimer card is clearer and more transparent than small footer text.
