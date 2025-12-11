import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Environment variables (set in Vercel dashboard)
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const APIFY_API_KEY = process.env.APIFY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'berkeley@blkoutuk.com';

// Instagram accounts to scrape for event announcements
const INSTAGRAM_ACCOUNTS = [
  'ukblackpride',
  'bbaborbbz',
  'pxssypalace',
  'bootyliciousldn',
  'houseofrainbow_',
  'outsavvy',
  'noirlondon_',
  'qtipoclondon'
];

// Eventbrite search terms
const EVENTBRITE_SEARCHES = [
  'black lgbtq london',
  'black pride uk',
  'qtipoc',
  'black queer uk'
];

// Outsavvy organizers to monitor
const OUTSAVVY_ORGANIZERS = [
  'uk-black-pride',
  'bbz',
  'pxssy-palace',
  'bootylicious'
];

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

interface ApifyRunResult {
  id: string;
  status: string;
  defaultDatasetId?: string;
}

interface InstagramPost {
  caption?: string;
  timestamp?: string;
  url?: string;
  ownerUsername?: string;
  likesCount?: number;
}

interface EventbriteEvent {
  name?: string;
  url?: string;
  start?: { local?: string };
  venue?: { name?: string; address?: { city?: string } };
  description?: { text?: string };
  is_free?: boolean;
  ticket_availability?: { minimum_ticket_price?: { major_value?: string } };
}

interface OutsavvyEvent {
  title?: string;
  url?: string;
  date?: string;
  venue?: string;
  price?: string;
  description?: string;
}

// Generate a simple hash for URL deduplication
function generateUrlHash(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Run Apify actor and wait for results
async function runApifyActor(actorId: string, input: Record<string, unknown>): Promise<unknown[]> {
  if (!APIFY_API_KEY) {
    console.error('[Apify] Missing API key');
    return [];
  }

  try {
    // Start the actor run
    const startResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      }
    );

    if (!startResponse.ok) {
      console.error(`[Apify] Failed to start actor ${actorId}: ${startResponse.status}`);
      return [];
    }

    const runData: ApifyRunResult = await startResponse.json();
    console.log(`[Apify] Started run ${runData.id} for actor ${actorId}`);

    // Wait for completion (max 60 seconds for serverless timeout)
    const maxWait = 55000;
    const pollInterval = 3000;
    let waited = 0;

    while (waited < maxWait) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      waited += pollInterval;

      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runData.id}?token=${APIFY_API_KEY}`
      );

      if (!statusResponse.ok) continue;

      const statusData: ApifyRunResult = await statusResponse.json();

      if (statusData.status === 'SUCCEEDED') {
        // Get results from dataset
        const datasetResponse = await fetch(
          `https://api.apify.com/v2/datasets/${statusData.defaultDatasetId}/items?token=${APIFY_API_KEY}`
        );

        if (datasetResponse.ok) {
          const items = await datasetResponse.json();
          console.log(`[Apify] Actor ${actorId} returned ${items.length} items`);
          return items;
        }
        return [];
      } else if (statusData.status === 'FAILED' || statusData.status === 'ABORTED') {
        console.error(`[Apify] Actor ${actorId} ${statusData.status}`);
        return [];
      }
    }

    console.warn(`[Apify] Actor ${actorId} timed out after ${maxWait}ms`);
    return [];
  } catch (error) {
    console.error(`[Apify] Error running actor ${actorId}:`, error);
    return [];
  }
}

// Scrape Instagram posts for event announcements
async function scrapeInstagram(): Promise<TavilyResult[]> {
  console.log('[Instagram] Scraping accounts:', INSTAGRAM_ACCOUNTS.join(', '));

  const results: TavilyResult[] = [];

  // Use apify/instagram-profile-scraper actor
  const posts = await runApifyActor('apify/instagram-profile-scraper', {
    usernames: INSTAGRAM_ACCOUNTS,
    resultsLimit: 10, // Last 10 posts per account
    addParentData: true
  }) as InstagramPost[];

  for (const post of posts) {
    if (!post.caption) continue;

    // Filter for posts that look like event announcements
    const caption = post.caption.toLowerCase();
    const eventKeywords = ['event', 'tickets', 'join us', 'link in bio', 'save the date', 'coming soon', 'party', 'night', 'launch', 'celebrate'];

    if (eventKeywords.some(kw => caption.includes(kw))) {
      results.push({
        title: `Instagram: @${post.ownerUsername}`,
        url: post.url || `https://instagram.com/${post.ownerUsername}`,
        content: post.caption.substring(0, 1000)
      });
    }
  }

  console.log(`[Instagram] Found ${results.length} potential event posts`);
  return results;
}

// Scrape Eventbrite for Black LGBTQ+ events
async function scrapeEventbrite(): Promise<DiscoveredEvent[]> {
  console.log('[Eventbrite] Scraping events...');

  const events: DiscoveredEvent[] = [];

  // Use apify/eventbrite-scraper actor
  for (const searchTerm of EVENTBRITE_SEARCHES) {
    const items = await runApifyActor('voyager/eventbrite-scraper', {
      searchQueries: [searchTerm],
      location: 'United Kingdom',
      maxItems: 20
    }) as EventbriteEvent[];

    for (const item of items) {
      if (!item.name || !item.url) continue;

      const startDate = item.start?.local ? item.start.local.split('T')[0] : '';
      const startTime = item.start?.local ? item.start.local.split('T')[1]?.substring(0, 5) : '';

      events.push({
        title: item.name,
        date: startDate,
        time: startTime,
        location: item.venue?.name
          ? `${item.venue.name}, ${item.venue.address?.city || 'UK'}`
          : 'TBC',
        url: item.url,
        description: item.description?.text?.substring(0, 500),
        cost: item.is_free ? 'Free' : (item.ticket_availability?.minimum_ticket_price?.major_value ? `From £${item.ticket_availability.minimum_ticket_price.major_value}` : 'TBC'),
        relevance_score: 75, // Will be re-scored by AI
        tags: ['eventbrite'],
        source: 'eventbrite.co.uk'
      });
    }
  }

  console.log(`[Eventbrite] Found ${events.length} events`);
  return events;
}

// Scrape Outsavvy for events
async function scrapeOutsavvy(): Promise<DiscoveredEvent[]> {
  console.log('[Outsavvy] Scraping events...');

  const events: DiscoveredEvent[] = [];

  // Use web scraper for Outsavvy pages
  const items = await runApifyActor('apify/web-scraper', {
    startUrls: [
      { url: 'https://www.outsavvy.com/search?q=black+lgbtq' },
      { url: 'https://www.outsavvy.com/search?q=black+pride' },
      { url: 'https://www.outsavvy.com/search?q=qtipoc' }
    ],
    pageFunction: `async function pageFunction(context) {
      const { $, request } = context;
      const events = [];

      $('.event-card, .search-result-item, [data-event-id]').each((i, el) => {
        const $el = $(el);
        events.push({
          title: $el.find('.event-title, h3, h2').first().text().trim(),
          url: $el.find('a').first().attr('href'),
          date: $el.find('.event-date, .date').first().text().trim(),
          venue: $el.find('.event-venue, .venue, .location').first().text().trim(),
          price: $el.find('.event-price, .price').first().text().trim()
        });
      });

      return events;
    }`,
    maxPagesPerCrawl: 10
  }) as OutsavvyEvent[];

  for (const item of items) {
    if (!item.title || !item.url) continue;

    events.push({
      title: item.title,
      date: item.date || '',
      location: item.venue || 'TBC',
      url: item.url.startsWith('http') ? item.url : `https://www.outsavvy.com${item.url}`,
      cost: item.price || 'TBC',
      relevance_score: 80, // Outsavvy has high relevance
      tags: ['outsavvy'],
      source: 'outsavvy.com'
    });
  }

  console.log(`[Outsavvy] Found ${events.length} events`);
  return events;
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
    console.log(`[Tavily] Query "${query}" returned ${data.results?.length || 0} results`);
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
    url_hash: generateUrlHash(event.url),
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
    console.log('[Supabase] Attempting to insert', eventsToInsert.length, 'events');
    console.log('[Supabase] First event url_hash:', eventsToInsert[0]?.url_hash);

    const { data, error } = await supabase
      .from('events')
      .insert(eventsToInsert)
      .select();

    if (error) {
      console.error('[Supabase] Insert error:', JSON.stringify(error));
      return 0;
    }

    console.log('[Supabase] Insert successful, returned:', data?.length || 0, 'records');
    return data?.length || 0;
  } catch (error) {
    console.error('[Supabase] Exception:', error instanceof Error ? error.message : error);
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
    // Step 1: Search for events using multiple sources
    const allResults: TavilyResult[] = [];
    const directEvents: DiscoveredEvent[] = [];
    const seenUrls = new Set<string>();

    // 1a. Tavily web search (existing)
    for (const query of SEARCH_QUERIES) {
      console.log(`[Social Diary] Tavily search: ${query}`);
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

    console.log(`[Social Diary] Tavily found ${allResults.length} unique search results`);

    // 1b. Apify Instagram scraping (new)
    if (APIFY_API_KEY) {
      const instagramResults = await scrapeInstagram();
      for (const result of instagramResults) {
        if (!seenUrls.has(result.url)) {
          seenUrls.add(result.url);
          allResults.push(result);
        }
      }

      // 1c. Apify Eventbrite scraping (new)
      const eventbriteEvents = await scrapeEventbrite();
      for (const event of eventbriteEvents) {
        if (!seenUrls.has(event.url)) {
          seenUrls.add(event.url);
          directEvents.push(event);
        }
      }

      // 1d. Apify Outsavvy scraping (new)
      const outsavvyEvents = await scrapeOutsavvy();
      for (const event of outsavvyEvents) {
        if (!seenUrls.has(event.url)) {
          seenUrls.add(event.url);
          directEvents.push(event);
        }
      }
    } else {
      console.log('[Social Diary] Apify not configured, skipping Instagram/Eventbrite/Outsavvy scraping');
    }

    console.log(`[Social Diary] Total: ${allResults.length} search results, ${directEvents.length} direct events`);

    // Step 2: AI Curation for search results (direct events already structured)
    const curatedFromSearch = await curateEventsWithAI(allResults);
    console.log(`[Social Diary] AI curated ${curatedFromSearch.length} events from search results`);

    // Combine AI-curated events with direct-scraped events
    const curatedEvents = [...curatedFromSearch, ...directEvents];
    console.log(`[Social Diary] Total curated events: ${curatedEvents.length}`);

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
        tavilyResults: allResults.length - (APIFY_API_KEY ? directEvents.length : 0),
        instagramPosts: APIFY_API_KEY ? 'scraped' : 'skipped',
        eventbriteEvents: directEvents.filter(e => e.source === 'eventbrite.co.uk').length,
        outsavvyEvents: directEvents.filter(e => e.source === 'outsavvy.com').length,
        totalCurated: curatedEvents.length,
        savedEvents: savedCount,
        runDate: new Date().toISOString(),
        apifyConfigured: !!APIFY_API_KEY,
        supabaseConfigured: !!supabase
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
