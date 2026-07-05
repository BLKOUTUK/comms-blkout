# AIvor Character Reference Prompt — Standard Image Generation Guide

## Use This Document
Feed this as a system/reference prompt whenever generating AIvor images for social media, campaigns, DigestVid, or any BLKOUT visual content. This ensures visual consistency across all outputs.

---

## Character Identity

**Name**: AIvor (named after Ivor Cummings, 1913–1992, Black British civil rights pioneer)
**Gender**: Male
**Age**: Mid-30s to early 40s
**Ethnicity**: Light-skinned Black British man, mixed heritage (Sierra Leonean father, English mother — reflecting the real Ivor Cummings)
**Build**: Slim, upright posture, confident bearing
**Hair**: Short cropped black hair, neat, close to the scalp
**Facial hair**: Clean-shaven or very light stubble
**Expression**: Confident, warm, slight knowing smile — approachable but commanding. Never stiff or corporate. He looks like he knows something you don't, and he's about to share it.
**Era influence**: 1940s–1950s British style, but timeless — could pass as vintage or modern

---

## Three Standard Looks

### Look 1: FORMAL (Primary — use for hero images, launch posts, serious topics)
- Black tuxedo / dinner jacket
- White dress shirt
- Black bow tie
- White pocket square
- Cigarette (optional — can be omitted for health-conscious contexts)
- Dark/moody studio background, grey gradient
- Full body or three-quarter shot
- **Mood**: Elegant, authoritative, evening event

### Look 2: PROFESSIONAL (Use for tech, AI, governance, business topics)
- Camel/brown double-breasted overcoat
- Dark charcoal three-piece suit underneath
- Burgundy/maroon tie
- White pocket square
- Cigarette held casually (optional)
- Warm beige/tan studio background
- Three-quarter or waist-up shot
- **Mood**: Sophisticated, intellectual, approachable authority

### Look 3: CASUAL (Use for community, events, lifestyle, heritage topics)
- Cream/ivory linen short-sleeve shirt, open collar
- Brown high-waisted pleated trousers
- Brown leather sandals
- Panama hat or fedora (straw or dark felt)
- Holding a drink (amber glass, whisky/rum)
- Setting: West African colonial-era street scene — Freetown, Sierra Leone vibes. Palm trees, colonial architecture, golden hour light, bustling market, vintage cars
- Full body shot
- **Mood**: Relaxed, warm, connected to roots, golden hour warmth

### Look 4: SMART CASUAL (Use for everyday posts, learning tools, wellness)
- Dark charcoal double-breasted suit
- Plaid/tartan tie
- Dark fedora hat
- Trench coat draped over shoulder
- Neutral beige studio background
- Three-quarter or full body shot
- **Mood**: Dapper, approachable, man-about-town

---

## Consistent Physical Features (MUST match across all looks)

- Light-skinned Black man, warm undertone
- Short black hair, closely cropped
- Clean-shaven or very minimal stubble
- Brown eyes
- Defined jawline, oval face shape
- Slim build, approximately 5'10"–6'0"
- Upright, confident posture — never slouching
- Slight smile or knowing expression — never grinning, never stern

---

## BLKOUT Brand Overlay Rules

When compositing AIvor images for social media:

- **Background**: Black (#000000) or dark gradient
- **Gold accents**: Sovereignty gold (#FFD700) for text, borders, highlights
- **Logo**: BLKOUT wordmark (white) top-left or bottom-centre
- **Hashtag**: #MeetAIvor in gold, bottom-right
- **Font**: Inter or Space Grotesk
- **Text colour**: White (#FFFFFF) for body, Gold (#FFD700) for headlines
- **No busy backgrounds behind text** — use gradient overlays on AIvor photos for readability

---

## Image Generation Prompt Template

Use this structure when prompting image generators (GPT-4o, Midjourney, Flux, etc.):

```
[SCENE DESCRIPTION]. A light-skinned Black British man in his late 30s,
short cropped black hair, clean-shaven, confident warm expression with
a slight knowing smile. [OUTFIT FROM LOOK 1/2/3/4 ABOVE].
[POSE — standing/seated/gesturing]. Photorealistic portrait style,
studio lighting, [BACKGROUND]. Inspired by 1940s-1950s British style.
Elegant and timeless.
```

### Example — Launch Post (Look 1):
```
Portrait of a light-skinned Black British man in his late 30s, short
cropped black hair, clean-shaven, confident warm expression with a
slight knowing smile. Wearing a black tuxedo with white dress shirt,
black bow tie, and white pocket square. Standing with relaxed confidence,
hands at sides. Photorealistic portrait style, dramatic studio lighting,
dark grey gradient background. Inspired by 1940s-1950s British elegance.
Cinematic quality.
```

### Example — Events Post (Look 3):
```
A light-skinned Black British man in his late 30s, short cropped black
hair, clean-shaven, warm approachable smile. Wearing a cream linen
short-sleeve shirt, brown high-waisted pleated trousers, brown leather
sandals, and a panama hat. Standing in a vibrant West African street
scene at golden hour — colonial architecture, palm trees, market stalls,
vintage cars. Photorealistic, warm golden lighting, cinematic depth of field.
```

---

## What AIvor Is NOT

- Not a woman (early code comments used "she/her" — the avatar is male)
- Not an abstract AI visualisation (he's a specific character)
- Not a generic stock photo model
- Not anime or cartoon style (photorealistic always)
- Not modern streetwear (always 1940s-50s influenced)
- Not stern or intimidating (always warm, approachable)
- Not holding a phone or laptop (he's from the 1940s aesthetic, even though he's AI)

---

## Campaign-Specific Variations

For the **Meet AIvor** campaign (March 2026), use these per-post:

| Post | Look | Scene Notes |
|------|------|-------------|
| Mar 3 — Launch | Look 1 (Formal) | Hero shot, black tuxedo, dramatic lighting |
| Mar 4 — Events | Look 3 (Casual) | Street scene, golden hour, pointing or gesturing |
| Mar 5 — Wellness | Look 2 (Professional) | Warm lighting, seated or leaning, empathetic expression |
| Mar 6 — Learning | Look 4 (Smart Casual) | Standing with coat over shoulder, confident |
| Mar 7 — Crisis | Look 1 (Formal) | Close-up face, serious but warm expression, no cigarette |
| Mar 10 — Voice | Look 3 (Casual) | Speaking/gesturing, mouth slightly open as if talking |
| Mar 11 — Real AI | Look 2 (Professional) | Three-quarter shot, overcoat, intellectual vibe |
| Mar 12 — Community | Look 3 (Casual) | Street scene with community in background |
| Mar 13 — DigestVid | Look 1 (Formal) | Presenting pose, hand gesture, as if on camera |
| Mar 14 — Try It | Look 1 (Formal) | Direct eye contact, warm smile, inviting |

---

## Reference Images

Source files in `apps/ivor-core/public/IvorAvatar/`:

| File | Look | Notes |
|------|------|-------|
| `Ivor Avatar Final/a_without_holding_a_ja.png` | Look 1 | **PRIMARY** — black tuxedo, bow tie, studio shot |
| `b_Use_this_image_to_ge.png` | Look 2 | Camel overcoat, three-piece suit, cigarette |
| `gpt-image-1_b_His_father_is_Sierra.png` | Look 2 | Brown overcoat variant, closer crop |
| `a_This_man_dressed_for (1).png` | Look 3 + Look 4 | Fedora, suspenders, 1940s street scene |
| `b_This_man_dressed_for.png` | Look 3 | Casual linen, panama hat, Freetown street |
| `a_This_man_dressed_for.png` | Look 3 | White shirt, cream trousers, market scene |
| `Ivor Avatar Final/gcp_a_from_this_image,_cre.jpeg` | Look 4 | Fedora, trench coat, double-breasted suit |

---

*Last updated: February 28, 2026*
*For: BLKOUT social media, campaigns, DigestVid, and all AIvor visual content*
