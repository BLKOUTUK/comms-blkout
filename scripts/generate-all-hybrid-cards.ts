/**
 * Theory of Change v2.0 - Complete Hybrid Card Production
 * Generates all 38 cards with diverse X-Men 97 heroes on real backgrounds
 *
 * Production Spec: 4:5 portrait (1080x1350)
 * Diversity: Various ages, hair, styles, body types, presentations
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const WAN_API_KEY = process.env.WAN_API_KEY;
const DASHSCOPE_BASE = 'https://dashscope-intl.aliyuncs.com/api/v1';

if (!WAN_API_KEY) throw new Error('WAN_API_KEY required');

interface CardProduction {
  card: number;
  bgFile: string;
  filename: string;
  heroPrompt: string;
}

// All 38 cards with diverse hero presentations
const CARD_PRODUCTIONS: CardProduction[] = [
  // ACT 1: RECOGNITION (Cards 1-10)
  {
    card: 1,
    bgFile: '1.png',
    filename: 'card-01-isolation.png',
    heroPrompt: `Add X-Men 97 animated character to this photograph:

Young Black queer man (early 20s), natural afro, purple hoodie, blue jeans
- X-Men 97 style: BOLD BLACK OUTLINES, cel-shaded
- Sitting alone, arms crossed, eyes downcast, isolated despite crowd
- Animated style contrasts sharply with real photo background

Keep background COMPLETELY realistic.`
  },
  {
    card: 2,
    bgFile: '10.png',
    filename: 'card-02-recognition.png',
    heroPrompt: `Add X-Men 97 animated character:

Black queer man (mid-30s), short locs, button-up shirt
- BOLD BLACK OUTLINES, cel-shaded purple/gold lighting
- Expression: quiet acknowledgment, "I see you"
- Seated, contemplative pose
- Animated vs realistic bedroom

Keep background realistic.`
  },
  {
    card: 3,
    bgFile: '3.png',
    filename: 'card-03-wondering.png',
    heroPrompt: `Add animated character:

Black queer man (late 20s), high-top fade, violet turtleneck
- X-Men 97: BOLD OUTLINES, cel-shaded
- Standing apart from crowd, observing, wondering
- Position: edge of gathering, looking in

Keep crowd realistic, only central figure animated.`
  },
  {
    card: 4,
    bgFile: '5.png',
    filename: 'card-04-poll.png',
    heroPrompt: `Add animated character:

Black queer man (early 40s), short fade with graying temples, leather jacket
- X-Men 97: BOLD OUTLINES, dramatic nighttime lighting
- Alone under streetlight, phone in hand, contemplative
- Mature, seasoned presentation

Real nighttime park background.`
  },
  {
    card: 5,
    bgFile: '28.png',
    filename: 'card-05-one-or-fewer.png',
    heroPrompt: `Add animated character:

Slim Black queer man (mid-20s), twists, minimal style
- X-Men 97: BOLD OUTLINES, cool blue tones
- Sitting alone in minimal space
- Expression: acceptance of solitude

Stark minimal background.`
  },
  {
    card: 6,
    bgFile: '6.png',
    filename: 'card-06-proximity.png',
    heroPrompt: `Add animated character:

Black queer man (30s), clean-shaven, business casual
- X-Men 97: BOLD OUTLINES, purple shirt cel-shading
- On transit, surrounded by people but disconnected
- Professional presentation, isolated in crowd

Real bus interior background.`
  },
  {
    card: 7,
    bgFile: '7.png',
    filename: 'card-07-survive-alone.png',
    heroPrompt: `Add animated character:

Black queer man (late 30s), short locs, hoodie
- X-Men 97: BOLD OUTLINES, dark purple tones
- Standing before office buildings, small against structure
- Working class, structural isolation

Real corporate building background.`
  },
  {
    card: 8,
    bgFile: '2.png',
    filename: 'card-08-old-story.png',
    heroPrompt: `Add animated character:

Black queer scholar (40s), glasses, cardigan
- X-Men 97: BOLD OUTLINES, warm gold/purple
- Reading in library, thoughtful pose
- Academic presentation, wisdom-keeper energy

Real library background.`
  },
  {
    card: 9,
    bgFile: '12.png',
    filename: 'card-09-inversion.png',
    heroPrompt: `Add TWO animated characters in conversation:

Two Black queer men facing each other, realization moment
- Both X-Men 97 style: BOLD OUTLINES, dramatic lighting
- One: locs, casual; Other: fade, fitted shirt
- Energy: breakthrough, connection forming
- Split composition showing transformation

Real gathering space background.`
  },
  {
    card: 10,
    bgFile: '25.png',
    filename: 'card-10-backwards.png',
    heroPrompt: `Add animated character:

Black queer man (early 30s), afro, reaching toward light
- X-Men 97: BOLD OUTLINES, hopeful gold lighting
- Threshold pose, stepping forward
- Turning point energy

B&W dramatic background, color only on character.`
  },

  // ACT 2: THE PROBLEM (Cards 11-17)
  {
    card: 11,
    bgFile: '17.png',
    filename: 'card-11-geography.png',
    heroPrompt: `Add multiple small animated figures on map:

5-6 Black queer men in different UK cities (London, Manchester, Birmingham, Bristol)
- Each X-Men 97 style: BOLD OUTLINES, isolated bubbles
- Diverse ages and styles
- Small scale, showing geographic separation

Vintage UK map background stays realistic.`
  },
  {
    card: 12,
    bgFile: '28.png',
    filename: 'card-12-cascade.png',
    heroPrompt: `Add animated character:

Black queer man (mid-30s), athletic build, fitted clothing
- X-Men 97: BOLD OUTLINES, fading/disappearing effect
- Expression: isolation, invisibility
- Partially transparent, suggesting erasure

Minimal/empty background.`
  },
  {
    card: 13,
    bgFile: '19.png',
    filename: 'card-13-app.png',
    heroPrompt: `Add animated character holding phone:

Black queer man (late 20s), stylish streetwear, frustrated expression
- X-Men 97: BOLD OUTLINES, cool blue alienation
- Looking at phone with mainstream dating app
- Disconnected energy

Real phone/app background.`
  },
  {
    card: 14,
    bgFile: '20.png',
    filename: 'card-14-club.png',
    heroPrompt: `Add animated character in club:

Black queer man (mid-20s), fashionable club outfit, alone in crowd
- X-Men 97: BOLD OUTLINES, pink/blue club lighting
- Standing alone despite crowd energy
- Fem presentation, confident but isolated

Real club/nightlife background.`
  },
  {
    card: 15,
    bgFile: 'bg-card-15-phone-messages.png',
    filename: 'card-15-group-chat.png',
    heroPrompt: `Add animated character:

Black queer man (early 30s), casual wear, staring at phone
- X-Men 97: BOLD OUTLINES, dim blue screen glow
- Expression: disappointment, digital silence
- Holding phone showing inactive messages

Real phone screen background.`
  },
  {
    card: 16,
    bgFile: '5.png',
    filename: 'card-16-swipe.png',
    heroPrompt: `Add animated character:

Black queer man (late 20s), bomber jacket, searching
- X-Men 97: BOLD OUTLINES, cool tones
- Walking alone at night, looking around
- "Where are the rest of us?" energy

Night street background (reuse 5.png).`
  },
  {
    card: 17,
    bgFile: '15.png',
    filename: 'card-17-dont-know.png',
    heroPrompt: `Add animated character among crowd:

Black queer man (mid-30s), business casual, anonymous
- X-Men 97: BOLD OUTLINES but blending into crowd
- Back visible or side profile, faceless in mass
- Suggesting anonymity

Anonymous crowd background.`
  },

  // ACT 3: WHAT WE'RE BUILDING (Cards 19-29, skip 18=video, 20/27/29=real photos)
  {
    card: 19,
    bgFile: '25.png',
    filename: 'card-19-what-if.png',
    heroPrompt: `Add animated character reaching forward:

Black queer man (early 30s), reaching toward light/doorway
- X-Men 97: BOLD OUTLINES, warm hopeful lighting
- Stepping into possibility
- Forward movement, hope

Hands/light doorway background.`
  },
  {
    card: 21,
    bgFile: '3.png',
    filename: 'card-21-gatherings.png',
    heroPrompt: `Add animated character joining circle:

Black queer man (late 20s), casual comfortable clothing
- X-Men 97: BOLD OUTLINES, warm community colors
- Sitting in circle, engaged in conversation
- Open, vulnerable energy

Real gathering background (reuse 3.png).`
  },
  {
    card: 22,
    bgFile: '3.png',
    filename: 'card-22-wordcloud.png',
    heroPrompt: `Add animated character in discussion:

Black queer man (40s), salt-and-pepper beard, cardigan
- X-Men 97: BOLD OUTLINES, warm discussion lighting
- Speaking, gesturing, sharing story
- Elder energy, wisdom sharing

Conversational setting (reuse 3.png).`
  },
  {
    card: 23,
    bgFile: '2.png',
    filename: 'card-23-connection.png',
    heroPrompt: `Add two animated characters connecting:

Two Black queer men in authentic moment
- Both X-Men 97: BOLD OUTLINES, warm lighting
- One: locs, relaxed; Other: afro, comfortable
- Real connection vs performative networking

Intimate cafe/library setting.`
  },
  {
    card: 24,
    bgFile: 'bg-card-24-newsroom.png',
    filename: 'card-24-articles.png',
    heroPrompt: `Add animated character writing:

Black queer writer (30s), glasses, focused at laptop
- X-Men 97: BOLD OUTLINES, creative flow energy
- Typing, articles visible on screen
- Storyteller presentation

Newsroom/writing desk background.`
  },
  {
    card: 25,
    bgFile: 'bg-card-25-construction.png',
    filename: 'card-25-infrastructure.png',
    heroPrompt: `Add animated character building:

Black queer builder (mid-30s), practical clothing, tools
- X-Men 97: BOLD OUTLINES, constructive energy
- Building, creating, working with hands
- Autonomy, permission-less creation

Construction site background.`
  },
  {
    card: 26,
    bgFile: 'bg-card-26-uk-transport.png',
    filename: 'card-26-map.png',
    heroPrompt: `Add animated character traveling:

Black queer traveler (late 20s), backpack, map/phone
- X-Men 97: BOLD OUTLINES, journey energy
- Looking at connections, planning routes
- Movement between cities

UK transport background.`
  },
  {
    card: 28,
    bgFile: 'bg-card-28-tech-human.png',
    filename: 'card-28-digital-human.png',
    heroPrompt: `Add animated character at computer:

Black queer tech worker (30s), hoodie, coding
- X-Men 97: BOLD OUTLINES, digital glow
- Building technology, human-centered
- Tech + community energy

Tech workspace background.`
  },

  // ACT 4: THE CORE (Cards 30-33, skip 34=video)
  {
    card: 30,
    bgFile: '5.png',
    filename: 'card-30-isolation.png',
    heroPrompt: `Add animated character alone:

Black queer man (mid-40s), larger build, coat
- X-Men 97: BOLD OUTLINES, cool isolation tones
- Lone figure in vast empty space
- Weighted, heavy with isolation

Night park emptiness (reuse 5.png).`
  },
  {
    card: 31,
    bgFile: '10.png',
    filename: 'card-31-problem-is-us.png',
    heroPrompt: `Add animated character at mirror:

Black queer man (early 30s), looking in mirror, self-doubt
- X-Men 97: BOLD OUTLINES, introspective lighting
- Mirror reflection, questioning self
- Internalization visible

Bedroom mirror background.`
  },
  {
    card: 32,
    bgFile: '8.png',
    filename: 'card-32-never-us.png',
    heroPrompt: `Add animated character before structure:

Black queer activist (40s), determined expression, fist raised
- X-Men 97: BOLD OUTLINES, defiant red/purple
- Confronting structures, not broken by them
- Powerful, structural critique pose

Housing estate background.`
  },
  {
    card: 33,
    bgFile: '3.png',
    filename: 'card-33-show-up.png',
    heroPrompt: `Add animated character showing mutual aid:

Black queer man (mid-30s), helping others, community action
- X-Men 97: BOLD OUTLINES, warm amber helping energy
- Active pose, reaching out to help
- Service, showing up for people

Community gathering (reuse 3.png).`
  },

  // ACT 5: THE INVITATION (Cards 35-38, skip 39=video, 40=OOMF embedded)
  {
    card: 35,
    bgFile: '9.png',
    filename: 'card-35-structural-damage.png',
    heroPrompt: `Add animated character:

Black queer man (late 30s), tired but determined
- X-Men 97: BOLD OUTLINES, purple/gray tones
- Standing before structural systems
- Recognizing damage, not defeated

Housing structure background.`
  },
  {
    card: 36,
    bgFile: '25.png',
    filename: 'card-36-relational-repair.png',
    heroPrompt: `Add TWO animated characters embracing/connecting:

Two Black queer men in solidarity embrace
- Both X-Men 97: BOLD OUTLINES, warm healing gold
- Different builds/presentations showing diversity
- Healing, connection, repair energy

B&W hands background, color on characters.`
  },
  {
    card: 37,
    bgFile: 'bg-card-37-horizon.png',
    filename: 'card-37-liberation.png',
    heroPrompt: `Add animated character facing horizon:

Black queer dreamer (late 20s), open posture, looking toward future
- X-Men 97: BOLD OUTLINES, sunrise gold/purple
- Arms open, possibility pose
- Hopeful, expansive energy

Open sky/horizon background.`
  },
  {
    card: 38,
    bgFile: '3.png',
    filename: 'card-38-damage-repair.png',
    heroPrompt: `Add animated characters in circle:

Group of 4-5 diverse Black queer men in community circle
- All X-Men 97: BOLD OUTLINES, various ages/styles
- Showing: locs, afro, fade, twists, different builds
- Connection, relational repair in action

Community circle background (reuse 3.png).`
  }
];

async function generateHybridCard(prod: CardProduction): Promise<void> {
  try {
    console.log(`\n🎨 Card ${prod.card}: ${prod.filename}`);

    // Read background (use resized version to avoid base64 size limit)
    const bgPath = join(process.cwd(), '../../../blkout-website/public/images/theory-backgrounds-resized', prod.bgFile);
    if (!existsSync(bgPath)) {
      throw new Error(`Background not found: ${bgPath}`);
    }

    const bgBuffer = readFileSync(bgPath);
    const base64Bg = bgBuffer.toString('base64');
    const bgDataUrl = `data:image/png;base64,${base64Bg}`;

    // Generate
    const response = await fetch(`${DASHSCOPE_BASE}/services/aigc/image-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WAN_API_KEY}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify({
        model: 'wan2.6-image',
        input: {
          messages: [{
            role: 'user',
            content: [
              { text: prod.heroPrompt },
              { image: bgDataUrl }
            ]
          }]
        },
        parameters: {
          size: '1080*1350', // 4:5 portrait
          n: 1,
          prompt_extend: false,
          watermark: false,
          enable_interleave: false
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API ${response.status}: ${err}`);
    }

    const data = await response.json();
    const taskId = data.output?.task_id;
    if (!taskId) throw new Error('No task_id');

    console.log(`⏳ Task ${taskId}...`);

    // Poll
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const poll = await fetch(`${DASHSCOPE_BASE}/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${WAN_API_KEY}` }
      });

      const pollData = await poll.json();
      const status = pollData.output?.task_status;

      if (status === 'SUCCEEDED') {
        const content = pollData.output?.choices?.[0]?.message?.content || [];
        const images = content.filter((item: any) => item.type === 'image');
        const imageUrl = images[0]?.image;

        if (!imageUrl) throw new Error('No image URL');

        // Download
        const imgResp = await fetch(imageUrl);
        const imgBuffer = Buffer.from(await imgResp.arrayBuffer());

        const outputPath = join(process.cwd(), '../../../blkout-website/public/images/theory-of-change', prod.filename);
        writeFileSync(outputPath, imgBuffer);

        console.log(`✅ Saved: ${(imgBuffer.length / 1024).toFixed(2)} KB`);
        return;
      } else if (status === 'FAILED') {
        throw new Error(`Task failed: ${pollData.output?.message}`);
      }

      if (i % 5 === 0) console.log(`⏳ ${status}...`);
    }

    throw new Error('Timeout');
  } catch (error: any) {
    console.error(`❌ Card ${prod.card} failed:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🎬 Theory of Change v2.0 - FULL HYBRID CARD PRODUCTION\n');
  console.log(`📊 Generating ${CARD_PRODUCTIONS.length} cards (4:5 portrait)`);
  console.log('🎨 Style: X-Men 97 animated heroes + real backgrounds\n');

  let success = 0;
  let failed = 0;

  for (const prod of CARD_PRODUCTIONS) {
    try {
      await generateHybridCard(prod);
      success++;

      console.log(`⏳ Waiting 3s... (${success}/${CARD_PRODUCTIONS.length})\n`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Success: ${success}/${CARD_PRODUCTIONS.length}`);
  console.log(`❌ Failed: ${failed}/${CARD_PRODUCTIONS.length}`);
  console.log('='.repeat(60));

  process.exit(failed > 0 ? 1 : 0);
}

main();
