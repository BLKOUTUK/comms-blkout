/**
 * Cron Jobs
 * Individual job runners for scheduled tasks
 *
 * NOTHING HERE IS SCHEDULED. `handleCronJob` is exported and reachable at
 * GET /api/herald/generate?job=<type>, but no cron, workflow or timer calls it.
 * These jobs only run when someone hits that URL by hand.
 *
 * NO FALLBACK THAT PARSES AS A RESULT. `callAI` used to return a demo-mode placeholder
 * when the key was absent and a two-word failure label when the call went wrong. Both
 * were ordinary strings: a caller stored them, a preview showed them, and a newsletter
 * that was never generated looked generated. It now throws HeraldGenerationError naming
 * the cause, every job logs `HERALD NOT GENERATED — <reason>` and records nothing, and
 * the dispatcher answers 502 with the reason.
 */

import { OPENROUTER_API_KEY } from '../config.js';
import { fetchIntelligence } from '../content/intelligence.js';

/**
 * Thrown when herald content could not be generated. `reason` names the cause and is
 * safe to log and to return to an admin caller — it never carries the API key.
 */
export class HeraldGenerationError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super(reason);
    this.name = 'HeraldGenerationError';
    this.reason = reason;
  }
}

/** The reason string for any thrown value, for logging and for the 502 body. */
export function generationFailureReason(error: unknown): string {
  if (error instanceof HeraldGenerationError) return error.reason;
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Helper for AI calls in cron jobs.
 * Returns generated content or throws HeraldGenerationError. It never returns a
 * placeholder, an empty string, or an error message dressed as content.
 */
export async function callAI(prompt: string, maxTokens = 1500): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new HeraldGenerationError('OPENROUTER_API_KEY is not set on this server');
  }

  let response: Response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://comms-blkout.vercel.app',
        'X-Title': 'BLKOUT Agent Cron',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
      }),
    });
  } catch (error) {
    throw new HeraldGenerationError(
      `OpenRouter request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new HeraldGenerationError(
      `OpenRouter returned HTTP ${response.status}${body ? `: ${body.slice(0, 300)}` : ''}`
    );
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = await response.json();
  } catch (error) {
    throw new HeraldGenerationError(
      `OpenRouter returned a body that is not JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new HeraldGenerationError('OpenRouter returned no content in its response');
  }

  return content;
}

/**
 * Generate for a named job. On failure: log `HERALD NOT GENERATED — <reason>`,
 * record nothing, and rethrow so the caller can answer 502.
 */
async function generateFor(job: string, prompt: string, maxTokens?: number): Promise<string> {
  try {
    return await callAI(prompt, maxTokens);
  } catch (error) {
    const reason = generationFailureReason(error);
    console.error(`HERALD NOT GENERATED — ${job}: ${reason}`);
    throw error instanceof HeraldGenerationError ? error : new HeraldGenerationError(reason);
  }
}

/**
 * Run weekly Herald newsletter generation
 */
export async function runHeraldWeekly(): Promise<string> {
  const intelligence = await fetchIntelligence();
  const prompt = `You are Herald, BLKOUT's newsletter agent. Create a weekly newsletter for our engaged community.

COMMUNITY CONTEXT:
- Community: ${intelligence.communitySize} hub members, ${intelligence.coopMembers} coop members
- Verified creators: ${intelligence.verifiedCreators}
- Upcoming events: ${intelligence.upcomingEventCount}
${intelligence.nextEvent ? `- Featured: "${intelligence.nextEvent}"` : ''}
- Articles this week: ${intelligence.weeklyArticleCount}
${intelligence.topArticle ? `- Top article: "${intelligence.topArticle}"` : ''}

Create a warm, engaging weekly newsletter with:
1. Personal greeting and community highlight
2. Upcoming events section
3. Content spotlights
4. Community call-to-action
5. Affirming close

Keep it concise. Center Black queer joy.`;

  const content = await generateFor('herald-weekly', prompt);
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  // The agent-task queue this used to write to has been retired. Nothing consumed the
  // rows, so the job now logs what it would have queued and returns the content to its
  // caller. A real destination for this output is still to be chosen.
  console.log(
    `[Herald] Weekly newsletter generated, not stored — would have queued "Weekly Newsletter - ${dateStr}" ` +
    `(${content.length} chars, email, high priority)`
  );

  return content;
}

/**
 * Run monthly Herald newsletter generation
 */
export async function runHeraldMonthly(): Promise<string> {
  const intelligence = await fetchIntelligence();
  const monthName = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const prompt = `You are Herald. Create a monthly community digest for ${monthName}.

STATS:
- Members: ${intelligence.communitySize} (${intelligence.coopMembers} coop)
- Creators: ${intelligence.verifiedCreators}
- Events: ${intelligence.upcomingEventCount}
- Articles: ${intelligence.weeklyArticleCount}

Create a comprehensive monthly digest celebrating achievements, highlighting events, and previewing next month. Make it inspiring for our Black queer community.`;

  const content = await generateFor('herald-monthly', prompt, 2000);

  console.log(
    `[Herald] Monthly digest generated, not stored — would have queued "Monthly Digest - ${monthName}" ` +
    `(${content.length} chars, email, high priority)`
  );

  return content;
}

/**
 * Run Listener daily research
 */
export async function runListenerResearch(): Promise<string> {
  const intelligence = await fetchIntelligence();
  const snapshot = {
    members: intelligence.communitySize,
    coop: intelligence.coopMembers,
    events: intelligence.upcomingEventCount,
    articles: intelligence.weeklyArticleCount,
  };

  const prompt = `You are Listener, BLKOUT's intelligence agent. Analyze:

SNAPSHOT:
- Members: ${snapshot.members} (${snapshot.coop} coop)
- Events: ${snapshot.events} upcoming
- Articles: ${snapshot.articles} this week

Provide:
1. 3 KEY INSIGHTS about community health
2. 3 CONTENT RECOMMENDATIONS
3. 2 TRENDS TO WATCH

Be specific and actionable for Black queer community.`;

  const content = await generateFor('listener-research', prompt, 1000);
  const dateStr = new Date().toLocaleDateString('en-GB');

  console.log(
    `[Herald] Listener research generated, not stored — would have queued "Daily Research - ${dateStr}" ` +
    `(${content.length} chars, all platforms, medium priority, snapshot ${JSON.stringify(snapshot)})`
  );

  return content;
}
