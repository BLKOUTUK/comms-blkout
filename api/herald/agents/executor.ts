/**
 * Agent Executor
 * Execute agent tasks with intelligence context
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, OPENROUTER_API_KEY } from '../config.js';
import { fetchIntelligence } from '../content/intelligence.js';
import { AGENT_PROMPTS } from './prompts.js';

/**
 * Handle agent execution with intelligence
 */
export async function handleAgentExecution(req: VercelRequest, res: VercelResponse) {
  const { agent_type, task_id, title, description, target_platform } = req.body;

  if (!agent_type || !title) {
    return res.status(400).json({ error: 'agent_type and title are required' });
  }

  const validAgents = ['griot', 'weaver', 'strategist', 'listener', 'concierge'];
  if (!validAgents.includes(agent_type)) {
    return res.status(400).json({ error: `Invalid agent_type. Must be one of: ${validAgents.join(', ')}` });
  }

  console.log(`[Agent:${agent_type}] Executing task: ${title}`);

  try {
    // Fetch intelligence context
    const intelligence = await fetchIntelligence();
    console.log(`[Agent:${agent_type}] Intelligence loaded: ${intelligence.communitySize} members`);

    // Build task object
    const task = {
      id: task_id,
      title,
      description,
      targetPlatform: target_platform || 'social media',
    };

    // Get agent-specific prompt
    const promptBuilder = AGENT_PROMPTS[agent_type];
    if (!promptBuilder) {
      return res.status(400).json({ error: 'Agent prompt not configured' });
    }

    const prompt = promptBuilder(intelligence, task);

    // Generate content using AI. No placeholder: a missing key is a failure, not a
    // result, and an agent that cannot generate must never answer 200 with something
    // that reads as content.
    if (!OPENROUTER_API_KEY) {
      const reason = 'OPENROUTER_API_KEY is not set on this server';
      console.error(`HERALD NOT GENERATED — ${agent_type}: ${reason}`);
      return res.status(502).json({ success: false, agent: agent_type, task: title, error: reason });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://comms-blkout.vercel.app',
        'X-Title': `BLKOUT ${agent_type.charAt(0).toUpperCase() + agent_type.slice(1)} Agent`,
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const reason = `OpenRouter returned HTTP ${response.status}${body ? `: ${body.slice(0, 300)}` : ''}`;
      console.error(`HERALD NOT GENERATED — ${agent_type}: ${reason}`);
      return res.status(502).json({ success: false, agent: agent_type, task: title, error: reason });
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content?.trim() || '';

    if (!generatedContent) {
      const reason = 'OpenRouter returned no content in its response';
      console.error(`HERALD NOT GENERATED — ${agent_type}: ${reason}`);
      return res.status(502).json({ success: false, agent: agent_type, task: title, error: reason });
    }

    // Store result in intelligence if it's substantial
    if (generatedContent.length > 100 && supabase) {
      await supabase.from('ivor_intelligence').insert({
        intelligence_type: 'campaigns',
        ivor_service: `${agent_type}_agent`,
        ivor_endpoint: '/api/herald/generate',
        intelligence_data: { task, content_length: generatedContent.length },
        summary: `${agent_type.charAt(0).toUpperCase() + agent_type.slice(1)} Agent: ${title.substring(0, 100)}`,
        key_insights: [generatedContent.substring(0, 200)],
        actionable_items: [`Review ${agent_type} output`, 'Publish when approved'],
        relevance_score: 0.85,
        priority: 'high',
        urgency: 'normal',
        tags: [agent_type, 'agent-generated', target_platform || 'general'],
        data_timestamp: new Date().toISOString(),
        is_stale: false,
      });
    }

    return res.status(200).json({
      success: true,
      agent: agent_type,
      task: title,
      content: generatedContent,
      intelligence_used: true,
      community_context: {
        members: intelligence.communitySize,
        coop_members: intelligence.coopMembers,
        verified_creators: intelligence.verifiedCreators,
        upcoming_events: intelligence.upcomingEventCount,
        weekly_articles: intelligence.weeklyArticleCount,
      },
    });
  } catch (error) {
    console.error(`[Agent:${agent_type}] Execution error:`, error);
    return res.status(500).json({ error: 'Agent execution failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
