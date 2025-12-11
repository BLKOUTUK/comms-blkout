import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

// Platform configurations with character limits and best practices
const PLATFORMS = [
  { name: 'instagram', char_limit: 2200, supports_hashtags: true },
  { name: 'twitter', char_limit: 280, supports_hashtags: true },
  { name: 'facebook', char_limit: 63206, supports_hashtags: false },
  { name: 'linkedin', char_limit: 3000, supports_hashtags: true }
];

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time?: string;
  location?: string;
  organizer?: string;
  cost?: string;
  tags?: string[];
  url?: string;
}

interface SocialCaption {
  platform: string;
  caption: string;
  hashtags: string[];
}

// Generate platform-specific captions using OpenRouter Claude
async function generateSocialCaptions(event: Event): Promise<SocialCaption[]> {
  if (!OPENROUTER_API_KEY) {
    console.error('[OpenRouter] Missing API key');
    return [];
  }

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const prompt = `You are the BLKOUT Social Media Manager - creating engaging social media captions for Black LGBTQ+ community events in the UK.

## Event Details
Title: ${event.title}
Description: ${event.description}
Date: ${formattedDate}
Time: ${event.start_time || 'TBC'}
Location: ${event.location || 'TBC'}
Organizer: ${event.organizer || 'TBC'}
Cost: ${event.cost || 'Free'}
Event URL: ${event.url || ''}
Tags: ${event.tags?.join(', ') || ''}

## Your Task
Create platform-specific captions for Instagram, Twitter, Facebook, and LinkedIn. Each caption should:
- Center Black joy and community building
- Be culturally authentic and liberatory in tone
- Include clear event details (what, when, where)
- Use inclusive language
- Match platform best practices

## Platform Requirements
- Instagram (2200 char max): Longer, visual storytelling with emojis and hashtags at the end
- Twitter (280 char max): Concise, punchy with essential details only
- Facebook (no limit): Community-focused, detailed with call-to-action
- LinkedIn (3000 char max): Professional but warm, emphasize community value

## Output Format
Return ONLY a JSON array with this exact structure:
[
  {
    "platform": "instagram",
    "caption": "Full caption text here...",
    "hashtags": ["BlackLGBTQ", "BLKOUT", "QueerJoy", "LondonEvents"]
  },
  {
    "platform": "twitter",
    "caption": "Short tweet here...",
    "hashtags": ["BlackLGBTQ", "BLKOUT"]
  },
  {
    "platform": "facebook",
    "caption": "Facebook post here...",
    "hashtags": []
  },
  {
    "platform": "linkedin",
    "caption": "Professional post here...",
    "hashtags": ["BlackProfessionals", "LGBTQCommunity"]
  }
]

Return ONLY the JSON array, no additional text or markdown.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://comms-blkout.vercel.app',
        'X-Title': 'BLKOUT Social Diary Queue'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'You are an expert social media manager for BLKOUT UK, a community platform serving Black LGBTQ+ people. Your captions celebrate Black joy, build community, and center liberation. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OpenRouter] API error: ${response.status}`, errorText);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[OpenRouter] No content in response');
      return [];
    }

    // Parse JSON from response
    try {
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      }

      const captions: SocialCaption[] = JSON.parse(jsonStr);
      return Array.isArray(captions) ? captions : [];
    } catch (parseError) {
      console.error('[OpenRouter] Failed to parse JSON:', parseError);
      console.log('[OpenRouter] Raw content:', content);
      return [];
    }
  } catch (error) {
    console.error('[OpenRouter] Error:', error);
    return [];
  }
}

// Calculate optimal posting times (days before event)
function calculateScheduledTimes(eventDate: string): Date[] {
  const event = new Date(eventDate);
  const now = new Date();
  const scheduledTimes: Date[] = [];

  // Post at 10am (optimal engagement time)
  const postTime = new Date(event);
  postTime.setHours(10, 0, 0, 0);

  // Schedule posts at different intervals before event
  const intervals = [14, 7, 3, 1]; // days before event

  for (const days of intervals) {
    const scheduledDate = new Date(event);
    scheduledDate.setDate(scheduledDate.getDate() - days);
    scheduledDate.setHours(10, 0, 0, 0);

    // Only schedule if in the future
    if (scheduledDate > now) {
      scheduledTimes.push(scheduledDate);
    }
  }

  // If event is very soon, schedule at least one post ASAP
  if (scheduledTimes.length === 0 && event > now) {
    const asap = new Date(now);
    asap.setHours(asap.getHours() + 2); // 2 hours from now
    scheduledTimes.push(asap);
  }

  return scheduledTimes;
}

// Queue events to social media
async function queueEventsToSocial(): Promise<{
  queued: number;
  events: string[];
  errors: string[];
}> {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  const result = {
    queued: 0,
    events: [] as string[],
    errors: [] as string[]
  };

  // Fetch approved events that haven't been queued yet
  const { data: events, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'approved')
    .is('archived', false)
    .gte('date', new Date().toISOString().split('T')[0]) // Only future events
    .order('date', { ascending: true })
    .limit(10);

  if (fetchError) {
    console.error('[Supabase] Fetch error:', fetchError);
    throw new Error(`Failed to fetch events: ${fetchError.message}`);
  }

  if (!events || events.length === 0) {
    console.log('[Queue] No approved events to queue');
    return result;
  }

  console.log(`[Queue] Found ${events.length} approved events to process`);

  for (const event of events) {
    try {
      // Check if event already queued (using metadata field)
      const metadata = event.metadata || {};
      if (metadata.social_queued === true) {
        console.log(`[Queue] Event "${event.title}" already queued, skipping`);
        continue;
      }

      console.log(`[Queue] Processing event: "${event.title}"`);

      // Generate social media captions
      const captions = await generateSocialCaptions(event as Event);

      if (captions.length === 0) {
        result.errors.push(`Failed to generate captions for: ${event.title}`);
        continue;
      }

      console.log(`[Queue] Generated ${captions.length} captions for "${event.title}"`);

      // Calculate posting schedule
      const scheduledTimes = calculateScheduledTimes(event.date);

      if (scheduledTimes.length === 0) {
        result.errors.push(`No valid posting times for event: ${event.title} (date: ${event.date})`);
        continue;
      }

      console.log(`[Queue] Calculated ${scheduledTimes.length} posting times for "${event.title}"`);

      // Insert posts into social_media_queue
      const queueInserts = captions.map((caption, index) => ({
        platform: caption.platform,
        caption: caption.caption,
        hashtags: caption.hashtags,
        scheduled_for: scheduledTimes[index % scheduledTimes.length].toISOString(),
        status: 'queued',
        metadata: {
          event_id: event.id,
          event_title: event.title,
          event_date: event.date,
          generation_method: 'ai_claude',
          queued_at: new Date().toISOString()
        }
      }));

      const { error: insertError } = await supabase
        .from('social_media_queue')
        .insert(queueInserts);

      if (insertError) {
        console.error(`[Queue] Insert error for "${event.title}":`, insertError);
        result.errors.push(`Failed to queue posts for: ${event.title}`);
        continue;
      }

      // Mark event as queued
      const { error: updateError } = await supabase
        .from('events')
        .update({
          metadata: {
            ...metadata,
            social_queued: true,
            social_queued_at: new Date().toISOString(),
            social_posts_count: queueInserts.length
          }
        })
        .eq('id', event.id);

      if (updateError) {
        console.error(`[Queue] Failed to mark event as queued:`, updateError);
        // Don't fail the whole operation for this
      }

      result.queued += queueInserts.length;
      result.events.push(event.title);
      console.log(`[Queue] Successfully queued ${queueInserts.length} posts for "${event.title}"`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Queue] Error processing event "${event.title}":`, error);
      result.errors.push(`Error processing ${event.title}: ${errorMsg}`);
    }
  }

  return result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow GET for cron, POST for manual triggers
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authorization
  const cronSecret = req.headers['authorization'];
  const isAuthorized =
    cronSecret === `Bearer ${process.env.CRON_SECRET}` ||
    req.headers['x-vercel-cron'] === '1' ||
    process.env.NODE_ENV === 'development';

  if (!isAuthorized && req.method === 'GET') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('[Queue Events] Starting social media queue process...');

  try {
    const result = await queueEventsToSocial();

    return res.status(200).json({
      success: true,
      message: 'Social media queue process complete',
      stats: {
        postsQueued: result.queued,
        eventsProcessed: result.events.length,
        errors: result.errors.length,
        runDate: new Date().toISOString()
      },
      events: result.events,
      errors: result.errors.length > 0 ? result.errors : undefined
    });

  } catch (error) {
    console.error('[Queue Events] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
