/**
 * Cron Jobs
 * Individual job runners for scheduled tasks
 */

import { supabase, OPENROUTER_API_KEY } from '../config.js';
import { fetchIntelligence } from '../content/intelligence.js';

/**
 * Helper for AI calls in cron jobs
 */
export async function callAI(prompt: string, maxTokens = 1500): Promise<string> {
  if (!OPENROUTER_API_KEY) return '[Demo Mode] Content would be generated here';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Generation failed';
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

  const content = await callAI(prompt);
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  await supabase!.from('socialsync_agent_tasks').insert({
    agent_type: 'herald',
    title: `Weekly Newsletter - ${dateStr}`,
    description: 'Automated weekly newsletter',
    priority: 'high',
    status: 'completed',
    target_platform: 'email',
    suggested_config: { edition_type: 'weekly', automated: true },
    generated_content: content,
    execution_metadata: { cron_triggered: true, triggered_at: new Date().toISOString(), intelligence },
  });

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

  const content = await callAI(prompt, 2000);

  await supabase!.from('socialsync_agent_tasks').insert({
    agent_type: 'herald',
    title: `Monthly Digest - ${monthName}`,
    description: 'Automated monthly digest',
    priority: 'high',
    status: 'completed',
    target_platform: 'email',
    suggested_config: { edition_type: 'monthly', automated: true },
    generated_content: content,
    execution_metadata: { cron_triggered: true, triggered_at: new Date().toISOString() },
  });

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

  const content = await callAI(prompt, 1000);
  const dateStr = new Date().toLocaleDateString('en-GB');

  await supabase!.from('socialsync_agent_tasks').insert({
    agent_type: 'listener',
    title: `Daily Research - ${dateStr}`,
    description: 'Automated daily research',
    priority: 'medium',
    status: 'completed',
    target_platform: 'all',
    suggested_config: { research_type: 'daily', automated: true },
    generated_content: content,
    execution_metadata: { cron_triggered: true, triggered_at: new Date().toISOString(), snapshot },
  });

  return content;
}
