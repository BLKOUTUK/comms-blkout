import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Environment variables (set in Vercel dashboard)
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'berkeley@blkoutuk.com';

// Initialize Supabase client
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

// Search queries for Black LGBTQ+ events in UK
const SEARCH_QUERIES = [
  'Black LGBTQ events London 2025',
  'Black Pride UK events',
  'Black queer events UK',
  'QTIPOC events London',
  'Black gay events Manchester Birmingham'
];

const KNOWN_ORGANIZERS = [
  'UK Black Pride',
  'Black Pride',
  'House of Rainbow',
  'BBZ',
  'Pxssy Palace',
  'Bootylicious',
  'QTIPOC London',
  'Queer Black Spaces',
  'Black Out UK',
  'Noir',
  'Afrogay'
];

interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

interface TavilyResponse {
  results: TavilyResult[];
}

interface DiscoveredEvent {
  title: string;
  date: string;
  time?: string;
  location: string;
  organizer?: string;
  url: string;
  description?: string;
  cost?: string;
  relevance_score: number;
  tags?: string[];
  source: string;
}

// Search using Tavily API
async function searchTavily(query: string): Promise<TavilyResult[]> {
  if (!TAVILY_API_KEY) {
    console.error('[Tavily] Missing API key');
    return [];
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `${query}`,
        search_depth: 'basic',
        max_results: 10
      })
    });

    if (!response.ok) {
      console.error(`[Tavily] Search failed: ${response.status}`);
      return [];
    }

    const data: TavilyResponse = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('[Tavily] Error:', error);
    return [];
  }
}

// Curate events using Claude via OpenRouter
async function curateEventsWithAI(searchResults: TavilyResult[]): Promise<DiscoveredEvent[]> {
  if (!OPENROUTER_API_KEY) {
    console.error('[OpenRouter] Missing API key');
    return [];
  }

  if (searchResults.length === 0) {
    return [];
  }

  const prompt = `You are the BLKOUT Social Diary Researcher - a specialized agent that identifies events relevant to the Black LGBTQ+ community in the UK.

## Your Task
Analyze the following search results and extract ONLY events that are:
1. Specifically for or welcoming to Black LGBTQ+/Queer people
2. In the UK (primarily London, but also Manchester, Birmingham, Bristol, Leeds)
3. Happening in the next 60 days
4. Not duplicates

## Search Results to Analyze
${JSON.stringify(searchResults, null, 2)}

## Output Requirements
Return a JSON array of events with this exact structure:
[
  {
    "title": "Event Name",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "location": "Venue Name, City",
    "organizer": "Organizer Name",
    "url": "https://...",
    "description": "Brief 1-2 sentence description",
    "cost": "Free / £X / From £X",
    "relevance_score": 85,
    "tags": ["black-led", "queer", "party", "community"],
    "source": "eventbrite.co.uk"
  }
]

## Scoring Guidelines
- 90-100: Explicitly Black LGBTQ+ event by known organizer
- 80-89: Black-led or QTIPOC-focused event
- 70-79: LGBTQ+ event that's explicitly welcoming to Black attendees
- 60-69: General LGBTQ+ event in diverse area
- Below 60: Don't include

## Known BLKOUT-Relevant Organizers (High Trust)
${KNOWN_ORGANIZERS.join(', ')}

Return ONLY the JSON array, no additional text or markdown.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://comms-blkout.vercel.app',
        'X-Title': 'BLKOUT Social Diary'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'You are an expert event researcher for BLKOUT UK, a community platform serving Black LGBTQ+ people. Always prioritize events that center Black joy, community building, and safe spaces. Be conservative - only include events you\'re confident are relevant. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3
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
      // Handle potential markdown code blocks
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      }

      const events: DiscoveredEvent[] = JSON.parse(jsonStr);
      return Array.isArray(events) ? events : [];
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

// Save events to Supabase
async function saveEventsToSupabase(events: DiscoveredEvent[]): Promise<number> {
  if (!supabase || events.length === 0) {
    return 0;
  }

  const eventsToInsert = events.map(event => ({
    title: event.title,
    description: event.description || '',
    date: event.date,
    start_time: event.time || null,
    location: event.location,
    organizer: event.organizer || 'Unknown',
    url: event.url,
    cost: event.cost || 'TBC',
    tags: event.tags || [],
    source: event.source,
    source_platform: event.source,
    relevance_score: event.relevance_score,
    status: 'pending',
    discovery_method: 'social_diary_api',
    discovered_at: new Date().toISOString()
  }));

  try {
    const { data, error } = await supabase
      .from('events')
      .upsert(eventsToInsert, {
        onConflict: 'url',
        ignoreDuplicates: true
      })
      .select();

    if (error) {
      console.error('[Supabase] Insert error:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('[Supabase] Error:', error);
    return 0;
  }
}

// Send email notification (via Supabase Edge Function or direct SMTP)
async function sendNotification(summary: {
  totalFound: number;
  totalSaved: number;
  topEvents: DiscoveredEvent[];
}): Promise<void> {
  // For now, just log - can integrate with Resend, SendGrid, or Gmail API later
  console.log('[Notification] Summary:', {
    to: NOTIFICATION_EMAIL,
    subject: `🎭 BLKOUT Social Diary: ${summary.totalFound} Events Found`,
    body: `
Run Date: ${new Date().toISOString()}
Events Found: ${summary.totalFound}
Events Saved: ${summary.totalSaved}

Top Events:
${summary.topEvents.slice(0, 5).map((e, i) => `${i + 1}. ${e.title} (Score: ${e.relevance_score})`).join('\n')}

Events saved to Supabase (status: pending) for review.
    `
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow GET for cron, POST for manual triggers
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret for scheduled runs
  const cronSecret = req.headers['authorization'];
  const isAuthorized =
    cronSecret === `Bearer ${process.env.CRON_SECRET}` ||
    req.headers['x-vercel-cron'] === '1' ||
    process.env.NODE_ENV === 'development';

  if (!isAuthorized && req.method === 'GET') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('[Social Diary] Starting research run...');

  try {
    // Step 1: Search for events
    const allResults: TavilyResult[] = [];
    const seenUrls = new Set<string>();

    // Search general queries
    for (const query of SEARCH_QUERIES) {
      console.log(`[Social Diary] Searching: ${query}`);
      const results = await searchTavily(query);
      for (const result of results) {
        if (!seenUrls.has(result.url)) {
          seenUrls.add(result.url);
          allResults.push(result);
        }
      }
    }

    // Search organizer-specific
    for (const organizer of KNOWN_ORGANIZERS.slice(0, 5)) {
      console.log(`[Social Diary] Searching organizer: ${organizer}`);
      const results = await searchTavily(`${organizer} events 2025`);
      for (const result of results) {
        if (!seenUrls.has(result.url)) {
          seenUrls.add(result.url);
          allResults.push(result);
        }
      }
    }

    console.log(`[Social Diary] Found ${allResults.length} unique search results`);

    // Step 2: AI Curation
    const curatedEvents = await curateEventsWithAI(allResults);
    console.log(`[Social Diary] AI curated ${curatedEvents.length} relevant events`);

    // Step 3: Save to database
    const savedCount = await saveEventsToSupabase(curatedEvents);
    console.log(`[Social Diary] Saved ${savedCount} events to Supabase`);

    // Step 4: Send notification
    await sendNotification({
      totalFound: curatedEvents.length,
      totalSaved: savedCount,
      topEvents: curatedEvents.sort((a, b) => b.relevance_score - a.relevance_score)
    });

    return res.status(200).json({
      success: true,
      message: 'Social Diary research complete',
      stats: {
        searchResults: allResults.length,
        curatedEvents: curatedEvents.length,
        savedEvents: savedCount,
        runDate: new Date().toISOString()
      },
      events: curatedEvents
    });

  } catch (error) {
    console.error('[Social Diary] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
