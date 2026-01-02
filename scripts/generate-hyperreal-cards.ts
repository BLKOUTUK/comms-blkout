/**
 * Theory of Change v2.0 - Full Hyper-Real Production
 * All elements photorealistic - honest AI-generated imagery
 *
 * Production Spec: 4:5 portrait (1080x1350)
 * Style: Professional photography aesthetic throughout
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const WAN_API_KEY = process.env.WAN_API_KEY;
const DASHSCOPE_BASE = 'https://dashscope-intl.aliyuncs.com/api/v1';

if (!WAN_API_KEY) throw new Error('WAN_API_KEY required');

interface CardProduction {
  card: number;
  bgFile: string;
  filename: string;
  prompt: string;
}

// All 33 cards with photorealistic prompts
const CARDS: CardProduction[] = [
  {
    card: 1,
    bgFile: '1.png',
    filename: 'card-01-isolation.png',
    prompt: `Add photorealistic Black queer man to this museum/gallery scene:

Character: Young (early 20s), natural afro, purple hoodie, blue jeans
- PHOTOREALISTIC portrait quality, professional photography
- Sitting alone on bench with arms crossed, eyes downcast
- Expression: Isolated despite the crowd around him
- Natural skin tones, realistic hair texture, real fabric
- Professional lighting matching the environment

Composition: Real person in real space, documentary photography style
Style: Pure photographic realism - professional portrait composite`
  },
  {
    card: 2,
    bgFile: '10.png',
    filename: 'card-02-recognition.png',
    prompt: `Add photorealistic Black queer man to this bedroom scene:

Character: Mid-30s, short locs, purple button-up shirt
- PHOTOREALISTIC portrait, professional photography
- Seated, quiet contemplative expression
- "I see you" acknowledgment energy
- Natural lighting from window, realistic textures

Style: Documentary photography, authentic moment`
  },
  {
    card: 3,
    bgFile: '3.png',
    filename: 'card-03-wondering.png',
    prompt: `Add photorealistic Black queer man to this community gathering:

Character: Late 20s, high-top fade, violet turtleneck
- PHOTOREALISTIC, professional photography
- Standing slightly apart, observing the group
- Expression: Wondering, contemplative
- Natural lighting, sharp focus on him, crowd soft focus

Style: Documentary portrait in community space`
  },
  {
    card: 4,
    bgFile: '5.png',
    filename: 'card-04-poll.png',
    prompt: `Add photorealistic Black queer man to nighttime park:

Character: Early 40s, short fade with graying temples, black leather jacket
- Professional photography, mature presentation
- Standing alone under streetlight, phone in hand
- Expression: Contemplative, seasoned, isolated
- Natural nighttime lighting

Style: Documentary night photography`
  },
  {
    card: 5,
    bgFile: '28.png',
    filename: 'card-05-one-or-fewer.png',
    prompt: `Add photorealistic Black queer man to minimal space:

Character: Mid-20s, thin build, short twists, simple t-shirt
- Photorealistic, minimal aesthetic
- Sitting alone in sparse environment
- Expression: Quiet acceptance
- Soft natural lighting

Style: Minimalist portrait photography`
  },
  {
    card: 6,
    bgFile: '6.png',
    filename: 'card-06-proximity.png',
    prompt: `Add photorealistic Black queer man on public transit:

Character: 30s, clean-shaven, business casual (shirt, slacks)
- Professional photography
- Sitting on bus/transit surrounded by people
- Expression: Disconnected despite proximity
- Natural transit lighting

Style: Urban documentary photography`
  },
  {
    card: 7,
    bgFile: '7.png',
    filename: 'card-07-survive-alone.png',
    prompt: `Add photorealistic Black queer man before office buildings:

Character: Late 30s, shoulder-length locs, hoodie, jeans
- Photorealistic, working class presentation
- Standing small against corporate structures
- Expression: Structural isolation, resilient
- Evening urban lighting

Style: Urban portrait photography`
  },
  {
    card: 8,
    bgFile: '2.png',
    filename: 'card-08-old-story.png',
    prompt: `Add photorealistic Black queer scholar in library:

Character: 40s, glasses, cardigan over collared shirt, beard
- Professional academic photography
- Reading/studying at desk, thoughtful
- Expression: Wisdom keeper, intellectual
- Warm library lighting

Style: Academic portrait photography`
  },
  {
    card: 9,
    bgFile: '12.png',
    filename: 'card-09-inversion.png',
    prompt: `Add TWO photorealistic Black queer men in conversation:

Characters:
- First: Early 30s, short locs, casual jacket
- Second: Late 20s, fade, fitted shirt
- Both photorealistic, facing each other
- Expression: Realization, connection forming
- Moment of transformation

Style: Documentary photography, authentic interaction`
  },
  {
    card: 10,
    bgFile: '25.png',
    filename: 'card-10-backwards.png',
    prompt: `Add photorealistic Black queer man reaching toward light:

Character: Early 30s, medium afro, reaching forward
- Photorealistic, threshold moment
- Arms extended toward light/doorway
- Expression: Hope, stepping into possibility
- Dramatic B&W with warm light on face

Style: Dramatic portrait photography`
  },
  {
    card: 11,
    bgFile: '17.png',
    filename: 'card-11-geography.png',
    prompt: `Add small photorealistic Black queer men figures on vintage UK map:

Characters: 5-6 small figures in different cities
- Each photorealistic but small scale
- Diverse presentations visible even at small size
- Positioned: London, Manchester, Birmingham, Bristol, etc.
- Expression: Geographic isolation

Style: Conceptual photography composite on map`
  },
  {
    card: 12,
    bgFile: '28.png',
    filename: 'card-12-cascade.png',
    prompt: `Add photorealistic Black queer man fading/disappearing:

Character: Mid-30s, athletic build, fitted t-shirt
- Photorealistic with subtle transparency effect
- Suggesting invisibility, erasure
- Expression: Isolation making him disappear
- Minimal lighting

Style: Conceptual portrait with fade effect`
  },
  {
    card: 13,
    bgFile: '19.png',
    filename: 'card-13-app.png',
    prompt: `Add photorealistic Black queer man holding phone:

Character: Late 20s, stylish streetwear, short hair
- Photorealistic, modern style
- Looking at phone with dating app visible
- Expression: Frustration, alienation
- Natural indoor lighting

Style: Modern lifestyle photography`
  },
  {
    card: 14,
    bgFile: '20.png',
    filename: 'card-14-club.png',
    prompt: `Add photorealistic Black queer man in nightclub:

Character: Mid-20s, fashionable club outfit, fem presentation
- Photorealistic, stylish, confident
- Standing alone in club crowd
- Expression: Alone despite the energy
- Blue/pink club lighting

Style: Nightlife portrait photography`
  },
  {
    card: 15,
    bgFile: 'bg-card-15-phone-messages.png',
    filename: 'card-15-group-chat.png',
    prompt: `Add photorealistic Black queer man looking at phone:

Character: Early 30s, casual hoodie, natural hair
- Photorealistic, relatable everyday presentation
- Staring at phone screen showing inactive messages
- Expression: Disappointment, digital silence
- Dim screen glow lighting

Style: Contemporary portrait photography`
  },
  {
    card: 16,
    bgFile: '5.png',
    filename: 'card-16-swipe.png',
    prompt: `Add photorealistic Black queer man searching at night:

Character: Late 20s, bomber jacket, neat fade
- Photorealistic, urban style
- Walking alone, looking around searching
- Expression: "Where are the rest of us?"
- Nighttime street lighting

Style: Night urban photography`
  },
  {
    card: 17,
    bgFile: '15.png',
    filename: 'card-17-dont-know.png',
    prompt: `Add photorealistic Black queer man in anonymous crowd:

Character: Mid-30s, business casual, from behind
- Photorealistic, back or side profile
- Blending into crowd, faceless in mass
- Suggesting anonymity, not knowing each other
- Natural crowd lighting

Style: Documentary crowd photography`
  },
  {
    card: 19,
    bgFile: '25.png',
    filename: 'card-19-what-if.png',
    prompt: `Add photorealistic Black queer man reaching forward:

Character: Early 30s, reaching toward light/possibility
- Photorealistic, hopeful energy
- Arms extended, stepping into threshold
- Expression: "What if we did?"
- Dramatic B&W with warm light

Style: Dramatic threshold portrait`
  },
  {
    card: 21,
    bgFile: '3.png',
    filename: 'card-21-gatherings.png',
    prompt: `Add photorealistic Black queer man joining circle:

Character: Late 20s, comfortable casual clothing, natural hair
- Photorealistic, relaxed presentation
- Sitting in community circle, engaged
- Expression: Open, vulnerable, present
- Warm community space lighting

Style: Community documentary photography`
  },
  {
    card: 22,
    bgFile: '3.png',
    filename: 'card-22-wordcloud.png',
    prompt: `Add photorealistic Black queer elder in discussion:

Character: 40s-50s, salt-and-pepper beard, cardigan, larger build
- Photorealistic, elder wisdom energy
- Speaking, gesturing while sharing story
- Expression: Wisdom, experience, guidance
- Warm conversational lighting

Style: Portrait of elder storytelling`
  },
  {
    card: 23,
    bgFile: '2.png',
    filename: 'card-23-connection.png',
    prompt: `Add TWO photorealistic Black queer men connecting authentically:

Characters:
- First: Long locs, relaxed in chair
- Second: Medium afro, leaning in listening
- Both photorealistic, genuine connection moment
- Not networking - real conversation
- Warm intimate lighting

Style: Documentary of authentic connection`
  },
  {
    card: 24,
    bgFile: 'bg-card-24-newsroom.png',
    filename: 'card-24-articles.png',
    prompt: `Add photorealistic Black queer writer at desk:

Character: 30s, glasses, comfortable shirt, concentrated
- Photorealistic, creative professional
- Typing at laptop, articles visible on screen
- Expression: Focused, storyteller at work
- Warm desk lamp lighting

Style: Creative workspace photography`
  },
  {
    card: 25,
    bgFile: 'bg-card-25-construction.png',
    filename: 'card-25-infrastructure.png',
    prompt: `Add photorealistic Black queer builder/creator:

Character: Mid-30s, practical work clothing, tools nearby
- Photorealistic, hands-on builder energy
- Working, creating, building with autonomy
- Expression: Determined, permission-less creation
- Natural construction site lighting

Style: Worker portrait photography`
  },
  {
    card: 26,
    bgFile: 'bg-card-26-uk-transport.png',
    filename: 'card-26-map.png',
    prompt: `Add photorealistic Black queer traveler at station:

Character: Late 20s, backpack, casual travel clothing
- Photorealistic, young professional
- Looking at map/phone planning connections
- Expression: Journey, connecting cities
- Natural station lighting

Style: Travel documentary photography`
  },
  {
    card: 28,
    bgFile: 'bg-card-28-tech-human.png',
    filename: 'card-28-digital-human.png',
    prompt: `Add photorealistic Black queer tech worker:

Character: 30s, hoodie, natural hair, focused
- Photorealistic, tech industry presentation
- Working at computer, building technology
- Expression: Human-centered tech creation
- Screen glow + ambient lighting

Style: Tech workspace photography`
  },
  {
    card: 30,
    bgFile: '5.png',
    filename: 'card-30-isolation.png',
    prompt: `Add photorealistic Black queer man alone in park:

Character: Mid-40s, larger build, warm coat
- Photorealistic, mature presence
- Lone figure in vast empty nighttime park
- Expression: Heavy isolation, weighted
- Cold nighttime street lighting

Style: Night documentary photography`
  },
  {
    card: 31,
    bgFile: '10.png',
    filename: 'card-31-problem-is-us.png',
    prompt: `Add photorealistic Black queer man at mirror:

Character: Early 30s, looking at reflection
- Photorealistic, vulnerable moment
- Mirror reflection showing self-doubt
- Expression: Internalization, questioning self
- Natural bedroom lighting

Style: Intimate self-portrait photography`
  },
  {
    card: 32,
    bgFile: '8.png',
    filename: 'card-32-never-us.png',
    prompt: `Add photorealistic Black queer activist:

Character: 40s, determined expression, casual but purposeful
- Photorealistic, activist energy
- Standing before housing estate structures
- Expression: Defiant, structural critique visible
- Natural urban lighting

Style: Activist portrait photography`
  },
  {
    card: 33,
    bgFile: '3.png',
    filename: 'card-33-show-up.png',
    prompt: `Add photorealistic Black queer man in mutual aid moment:

Character: Mid-30s, helping/supporting someone
- Photorealistic, service energy
- Active pose, reaching out to community
- Expression: Showing up for people
- Warm community lighting

Style: Community action photography`
  },
  {
    card: 35,
    bgFile: '9.png',
    filename: 'card-35-structural-damage.png',
    prompt: `Add photorealistic Black queer man before structures:

Character: Late 30s, tired but determined
- Photorealistic, weary but not defeated
- Standing before housing estate/structures
- Expression: Recognizing systemic damage
- Cool urban lighting

Style: Documentary critique photography`
  },
  {
    card: 36,
    bgFile: '25.png',
    filename: 'card-36-relational-repair.png',
    prompt: `Add TWO photorealistic Black queer men embracing:

Characters:
- First: 30s, athletic build
- Second: 40s, larger build
- Both photorealistic, solidarity embrace
- Expression: Healing, connection, repair
- Warm dramatic B&W lighting with color on figures

Style: Intimate solidarity photography`
  },
  {
    card: 37,
    bgFile: 'bg-card-37-horizon.png',
    filename: 'card-37-liberation.png',
    prompt: `Add photorealistic Black queer dreamer facing horizon:

Character: Late 20s, arms open wide, facing sunrise
- Photorealistic, hopeful silhouette
- Open posture toward infinite sky
- Expression: Liberation, possibility, dreaming
- Golden hour sunrise lighting

Style: Inspirational landscape portrait`
  },
  {
    card: 38,
    bgFile: '3.png',
    filename: 'card-38-damage-repair.png',
    prompt: `Add GROUP of 4-5 photorealistic Black queer men in community circle:

Characters (showing diversity):
- Various ages: 20s to 50s
- Hair: Locs, afro, fade, twists, graying
- Builds: Slim, athletic, larger builds
- All photorealistic, in circle formation
- Expression: Relational repair in action, collective power
- Warm community lighting

Style: Community gathering photography`
  }
];

async function generateHyperRealCard(prod: CardProduction): Promise<void> {
  try {
    console.log(`\n📷 Card ${prod.card}: ${prod.filename}`);

    const bgPath = join(process.cwd(), '../../../blkout-website/public/images/theory-backgrounds-resized', prod.bgFile);
    const bgBuffer = readFileSync(bgPath);
    const base64Bg = bgBuffer.toString('base64');
    const bgDataUrl = `data:image/png;base64,${base64Bg}`;

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
              { text: prod.prompt },
              { image: bgDataUrl }
            ]
          }]
        },
        parameters: {
          size: '1080*1350',
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

        const imgResp = await fetch(imageUrl);
        const imgBuffer = Buffer.from(await imgResp.arrayBuffer());

        const outputPath = join(process.cwd(), '../../../blkout-website/public/images/theory-of-change', prod.filename);
        writeFileSync(outputPath, imgBuffer);

        console.log(`✅ Saved: ${(imgBuffer.length / 1024).toFixed(2)} KB`);
        return;
      } else if (status === 'FAILED') {
        const errorMsg = pollData.output?.message || 'Unknown error';
        console.log(`⚠️  Skipping due to: ${errorMsg}`);
        // Don't throw - just skip and continue with next card
        return;
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
  console.log('📷 Theory of Change v2.0 - FULL HYPER-REAL PRODUCTION\n');
  console.log(`📊 Generating ${CARDS.length} test cards (4:5 portrait)`);
  console.log('🎨 Style: Professional photography - all elements photorealistic\n');

  let success = 0;

  for (const card of CARDS) {
    await generateHyperRealCard(card);
    success++;
    console.log(`⏳ Waiting 3s... (${success}/${CARDS.length})\n`);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n✅ Test batch complete!');
  console.log('Review first 3 cards, then expand to all 33.');
}

main();
