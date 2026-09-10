// POST /api/admin/content/draft — a brief in, a register row out.
//
// The new-item form on /admin/calendar sends a human brief ("Invite Black queer men in
// Lambeth to the Ivor's Table dinner on 18 Oct, warm, one line of what happens there").
// This asks Sonnet for a caption in BLKOUT's voice and puts the result in the register as
// a `draft` — never as `ready`. A machine draft is a starting point, and the person who
// asked for it is the one who decides it is good enough to go out.
//
// THE BRIEF IS NEVER LOST. If the key is missing, the model errors, the call times out, or
// the answer is not JSON, a row is still written with the brief verbatim as its content,
// generated_by_agent null, and internal_notes saying what went wrong. It answers 200 with
// drafted:false. What it must never do is invent a caption, or return a partial body that
// leaves the person thinking their brief was saved when it was not.
//
// Why not `callAI` from api/herald/cron/jobs.ts: it takes no system message, no
// temperature, and returns no token counts. Since 10 September 2026 it does at least fail
// honestly — it throws HeraldGenerationError naming the cause rather than returning a
// placeholder that parses as a draft — but its callers drop the work, and this route must
// not: the brief is kept either way. The endpoint, headers and key accessor here are the
// same as the herald's; what happens on failure deliberately is not.
//
// The session guard is applied in server.ts ('/api/admin' prefix), so an unauthenticated
// POST is answered 401 before this runs. OPENROUTER_API_KEY is read from the server
// environment and never reaches the browser.
import type { Request, Response } from 'express';
import { OPENROUTER_API_KEY } from '../herald/config.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Checked against GET https://openrouter.ai/api/v1/models on 10 September 2026: the newest
// Anthropic Sonnet on OpenRouter, listed 30 June 2026. Re-check before assuming it is
// still current — a retired id fails the call, and this route answers that honestly rather
// than falling back to another model without saying so.
const MODEL = 'anthropic/claude-sonnet-5';

const DEFAULT_CHANNELS = ['instagram', 'facebook', 'linkedin'];

// Distilled from ~/.claude/skills/blkout-voice/SKILL.md and blkout-brand/SKILL.md.
// One deliberate departure from blkout-voice, which says em dashes may be used liberally:
// they are barred here, because an em dash in machine-drafted social copy reads as machine
// copy. Rob's own long-form voice keeps them; this is for captions.
const SYSTEM_PROMPT = `You write social posts for BLKOUT, a community-owned platform for and by Black queer men in the UK. A Community Benefit Society: one member, one vote.

WHO YOU ARE WRITING FOR AND WITH
Black queer men in the UK. Their lived experience comes first, always. UK context and UK language, never imported American framing. Say "members" or "brothers", never "users" or "consumers"; "sustain" or "support", never "monetise".

WHAT THE WRITING DOES
Creation, not loss. Lead with what is being built, offered or gathered, not with what is missing or under threat.
We learn, we do not fail. Name a lesson, never a deficit.
Specific, not generic. A named place, a date, a real thing that happens. "Community" alone says nothing.
Name power plainly when it belongs in the post: racism, homophobia, extractive systems. Pair critique with what we are doing about it.
Warm, never extractive. Invite, do not harvest. Never suggest the reader owes us anything, and never say a thing costs them nothing.
Solidarity, not charity. Build with allied communities; never speak for them.
The full age range. Black queer men are eighteen and seventy, not one narrow demographic.

HOW IT SOUNDS
Revolutionary, warm, direct, unapologetic. Short sentences, average fifteen to twenty words. Vary how sentences begin. A fragment is fine for emphasis. Active voice. Plain words carrying serious ideas.

HARD RULES
No em dashes. Use a full stop, a comma or a colon.
No claims that something is finished, launched, secured or completed unless the brief says so.
No invented facts, numbers, dates, venues, names or quotes. If the brief does not give you a detail, write around it.
Plain text only. No markdown, no headers, no bullet characters.
Instagram caption limit is 2,200 characters. Aim for 60 to 150 words.
Three to six hashtags, specific to BLKOUT and the subject, not trending filler.

RETURN FORMAT
Return ONLY a JSON object, no prose around it, no code fence:
{"title": "a short internal name for this post, under 60 characters", "primary_content": "the caption as it would be posted", "hashtags": ["#Example", "#Two"]}`;

interface DraftResult {
  title: string;
  primary_content: string;
  hashtags: string[];
}

/** Pull a JSON object out of the model's answer. A non-JSON answer is a failure, not a draft. */
function parseDraft(raw: string): DraftResult {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('the answer contained no JSON object');

  const parsed = JSON.parse(text.slice(start, end + 1));
  const content = typeof parsed.primary_content === 'string' ? parsed.primary_content.trim() : '';
  if (!content) throw new Error('the JSON had no primary_content');

  return {
    title: typeof parsed.title === 'string' && parsed.title.trim()
      ? parsed.title.trim().slice(0, 120)
      : content.split('\n')[0].slice(0, 60),
    primary_content: content,
    hashtags: Array.isArray(parsed.hashtags)
      ? parsed.hashtags.map(String).filter(Boolean).slice(0, 8)
      : [],
  };
}

/** Insert through the same service-role function the approval path uses. */
async function insertRow(row: Record<string, unknown>): Promise<unknown> {
  const upstream = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_content_insert`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_row: row }),
    signal: AbortSignal.timeout(15000),
  });
  const text = await upstream.text();
  if (!upstream.ok) throw new Error(`the register refused the row (HTTP ${upstream.status}): ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[admin/content-draft] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
    return res.status(500).json({ error: 'Server misconfigured: the register is unreachable' });
  }

  const body = (req.body || {}) as Record<string, unknown>;
  const brief = typeof body.brief === 'string' ? body.brief.trim() : '';
  if (!brief) return res.status(400).json({ error: 'brief is required' });

  const campaign = typeof body.campaign === 'string' && body.campaign.trim() ? body.campaign.trim() : null;
  const channels = Array.isArray(body.channels) && body.channels.length
    ? body.channels.map(String)
    : DEFAULT_CHANNELS;
  const scheduledFor = typeof body.scheduled_for === 'string' && body.scheduled_for.trim()
    ? body.scheduled_for.trim() : null;
  const mediaUrls = (Array.isArray(body.media_urls) ? body.media_urls : [])
    .map(String).map((u) => u.trim()).filter((u) => u.startsWith('https://'));
  const givenTitle = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null;

  const userPrompt = [
    `Brief: ${brief}`,
    campaign ? `Campaign: ${campaign}` : null,
    `Channels: ${channels.join(', ')}`,
    scheduledFor ? `Goes out: ${scheduledFor}` : null,
    givenTitle ? `Working title: ${givenTitle}` : null,
    mediaUrls.length ? `There ${mediaUrls.length === 1 ? 'is' : 'are'} ${mediaUrls.length} image(s) with this post; write a caption that works alongside them without describing them.` : null,
  ].filter(Boolean).join('\n');

  const fullPrompt = `${SYSTEM_PROMPT}\n\n---\n\n${userPrompt}`;

  // The failure row. Built first so every exit path below has one to write.
  const fallbackRow = (reason: string) => ({
    title: (givenTitle || brief.split('\n')[0]).slice(0, 120),
    content_type: 'post',
    status: 'draft',
    scheduled_for: scheduledFor,
    primary_content: brief,
    hashtags: [],
    media_urls: mediaUrls,
    generated_by_agent: null,
    internal_notes: `Sonnet did not answer: ${reason}`,
    metadata: { campaign, channels, source: 'form:manual', model: MODEL },
  });

  const saveFallback = async (reason: string) => {
    try {
      const result = await insertRow(fallbackRow(reason)) as { row?: unknown };
      return res.status(200).json({ row: result?.row ?? null, drafted: false, error: reason });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[admin/content-draft] Fallback insert failed:', message);
      return res.status(502).json({ error: `${reason}; and the brief could not be saved either: ${message}` });
    }
  };

  if (!OPENROUTER_API_KEY) {
    console.error('[admin/content-draft] OPENROUTER_API_KEY not set');
    return saveFallback('OPENROUTER_API_KEY is not set on this server');
  }

  let answer: string;
  let usage: { prompt_tokens?: number; completion_tokens?: number } = {};
  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://comms.blkoutuk.com',
        'X-Title': 'BLKOUT Content Register',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30000),   // one call, no retries
    });

    const text = await upstream.text();
    if (!upstream.ok) return saveFallback(`OpenRouter answered HTTP ${upstream.status}: ${text.slice(0, 200)}`);

    const payload = JSON.parse(text);
    usage = payload.usage || {};
    answer = payload.choices?.[0]?.message?.content || '';
    if (!answer.trim()) return saveFallback('OpenRouter returned an empty completion');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return saveFallback(`the call to OpenRouter failed: ${message.slice(0, 200)}`);
  }

  console.log(`[admin/content-draft] ${MODEL} prompt_tokens=${usage.prompt_tokens ?? '?'} completion_tokens=${usage.completion_tokens ?? '?'}`);

  let draft: DraftResult;
  try {
    draft = parseDraft(answer);
  } catch (err) {
    return saveFallback(`the answer was not usable JSON: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const result = await insertRow({
      title: givenTitle || draft.title,
      content_type: 'post',
      status: 'draft',
      scheduled_for: scheduledFor,
      primary_content: draft.primary_content,
      hashtags: draft.hashtags,
      media_urls: mediaUrls,
      generated_by_agent: 'sonnet',
      generation_prompt: fullPrompt,
      internal_notes: `Brief: ${brief}`,
      metadata: {
        campaign,
        channels,
        source: 'form:sonnet',
        model: MODEL,
        tokens: { prompt: usage.prompt_tokens ?? null, completion: usage.completion_tokens ?? null },
      },
    }) as { row?: unknown };
    return res.status(200).json({ row: result?.row ?? null, drafted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[admin/content-draft] Insert failed:', message);
    return res.status(502).json({ error: message.slice(0, 500) });
  }
}
