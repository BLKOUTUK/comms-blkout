/**
 * Intro Generator
 * Generate newsletter introductions using AI
 */
import { OPENROUTER_API_KEY, NEWSLETTER_SPECS } from '../config.js';
/**
 * Generate newsletter intro using Claude with intelligence context
 */
export async function generateIntro(editionType, sections, intelligence) {
    if (!OPENROUTER_API_KEY) {
        return editionType === 'weekly'
            ? "Here's what's happening in our community this week!"
            : "Here's your monthly roundup of everything BLKOUT!";
    }
    const eventCount = sections.find(s => s.type === 'events')?.items.length || 0;
    const articleCount = sections.find(s => s.type === 'highlights')?.items.length || 0;
    // Build intelligence-informed context
    let intelligenceContext = '';
    if (intelligence && intelligence.communitySize > 0) {
        intelligenceContext = `
Community Intelligence:
- Our community has grown to ${intelligence.communitySize} hub members${intelligence.coopMembers > 0 ? ` and ${intelligence.coopMembers} coop members` : ''}
${intelligence.verifiedCreators > 0 ? `- ${intelligence.verifiedCreators} verified creators are sharing their work` : ''}
${intelligence.topArticle ? `- This week's top story: "${intelligence.topArticle}"` : ''}
${intelligence.nextEvent ? `- Don't miss: ${intelligence.nextEvent}` : ''}
${intelligence.keyInsights.length > 0 ? `- Key insight: ${intelligence.keyInsights[0]}` : ''}`;
    }
    const prompt = `Write a warm, engaging 2-3 sentence newsletter introduction for BLKOUT UK's ${editionType} newsletter.

Context:
- BLKOUT UK is a community platform for Black LGBTQ+ people in the UK
- This edition features ${eventCount} upcoming events and ${articleCount} community highlights
- Tone: ${NEWSLETTER_SPECS[editionType]?.tone || 'warm and community-focused'}
${intelligenceContext}

Write ONLY the introduction text, no greeting or sign-off. Be authentic, not corporate. If there's community growth or notable content, weave it naturally into the intro.`;
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://comms-blkout.vercel.app',
                'X-Title': 'BLKOUT Herald Newsletter'
            },
            body: JSON.stringify({
                model: 'anthropic/claude-3.5-haiku',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 200,
                temperature: 0.7
            })
        });
        if (!response.ok) {
            console.error('[Herald] OpenRouter error:', response.status);
            return editionType === 'weekly'
                ? "Here's what's happening in our community this week!"
                : "Here's your monthly roundup of everything BLKOUT!";
        }
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || "Here's what's happening in our community!";
    }
    catch (error) {
        console.error('[Herald] Error generating intro:', error);
        return "Here's what's happening in our community!";
    }
}
