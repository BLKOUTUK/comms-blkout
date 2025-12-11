import type { VercelRequest, VercelResponse } from '@vercel/node';

const APIFY_API_KEY = process.env.APIFY_API_KEY;
const WEBHOOK_URL = 'https://comms-blkout.vercel.app/api/social-diary/apify-webhook';

// Instagram accounts to scrape
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

interface ApifyRunResponse {
  data?: {
    id: string;
    status: string;
  };
}

async function triggerApifyActor(
  actorId: string,
  input: Record<string, unknown>,
  name: string
): Promise<{ success: boolean; runId?: string; error?: string }> {
  if (!APIFY_API_KEY) {
    return { success: false, error: 'Missing API key' };
  }

  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          // Configure webhook to call back when done
          webhooks: [{
            eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED'],
            requestUrl: WEBHOOK_URL
          }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Apify Trigger] Failed to start ${name}: ${response.status}`, errorText);
      return { success: false, error: `${response.status}: ${errorText}` };
    }

    const data: ApifyRunResponse = await response.json();
    console.log(`[Apify Trigger] Started ${name}: run ${data.data?.id}`);
    return { success: true, runId: data.data?.id };

  } catch (error) {
    console.error(`[Apify Trigger] Error starting ${name}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authorization
  const cronSecret = req.headers['authorization'];
  const isAuthorized =
    cronSecret === `Bearer ${process.env.CRON_SECRET}` ||
    req.headers['x-vercel-cron'] === '1' ||
    process.env.NODE_ENV === 'development' ||
    req.method === 'POST';

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!APIFY_API_KEY) {
    return res.status(500).json({ error: 'Apify not configured' });
  }

  console.log('[Apify Trigger] Starting actor runs...');

  const results = {
    instagram: { triggered: false, runId: '', error: '' },
    eventbrite: { triggered: false, runId: '', error: '' },
    outsavvy: { triggered: false, runId: '', error: '' }
  };

  // Trigger Instagram scraper
  const instagramResult = await triggerApifyActor(
    'apify/instagram-profile-scraper',
    {
      usernames: INSTAGRAM_ACCOUNTS,
      resultsLimit: 10
    },
    'Instagram'
  );
  results.instagram = {
    triggered: instagramResult.success,
    runId: instagramResult.runId || '',
    error: instagramResult.error || ''
  };

  // Trigger Eventbrite scraper
  const eventbriteResult = await triggerApifyActor(
    'voyager/eventbrite-scraper',
    {
      searchQueries: EVENTBRITE_SEARCHES,
      location: 'United Kingdom',
      maxItems: 50
    },
    'Eventbrite'
  );
  results.eventbrite = {
    triggered: eventbriteResult.success,
    runId: eventbriteResult.runId || '',
    error: eventbriteResult.error || ''
  };

  // Trigger Outsavvy scraper (web scraper)
  const outsavvyResult = await triggerApifyActor(
    'apify/cheerio-scraper',
    {
      startUrls: [
        { url: 'https://www.outsavvy.com/search?q=black+lgbtq' },
        { url: 'https://www.outsavvy.com/search?q=black+pride' },
        { url: 'https://www.outsavvy.com/search?q=qtipoc' }
      ],
      pageFunction: `async function pageFunction(context) {
        const { $, request } = context;
        const events = [];

        $('a[href*="/event/"]').each((i, el) => {
          const $card = $(el).closest('.event-card, [class*="event"], div');
          events.push({
            title: $card.find('h2, h3, .title').first().text().trim() || $(el).text().trim(),
            url: $(el).attr('href'),
            date: $card.find('[class*="date"], time').first().text().trim(),
            venue: $card.find('[class*="venue"], [class*="location"]').first().text().trim(),
            price: $card.find('[class*="price"]').first().text().trim()
          });
        });

        return events.filter(e => e.title && e.url);
      }`,
      maxPagesPerCrawl: 20
    },
    'Outsavvy'
  );
  results.outsavvy = {
    triggered: outsavvyResult.success,
    runId: outsavvyResult.runId || '',
    error: outsavvyResult.error || ''
  };

  const triggeredCount = Object.values(results).filter(r => r.triggered).length;

  return res.status(200).json({
    success: triggeredCount > 0,
    message: `Triggered ${triggeredCount}/3 Apify actors`,
    webhookUrl: WEBHOOK_URL,
    results,
    timestamp: new Date().toISOString()
  });
}
