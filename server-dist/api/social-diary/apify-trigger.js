const APIFY_API_KEY = process.env.APIFY_API_KEY;
const WEBHOOK_URL = 'https://comms-blkout.vercel.app/api/social-diary/apify-webhook';
// Instagram hashtags to scrape for events (more reliable than account scraping)
const INSTAGRAM_HASHTAGS = [
    'blackprideLondon',
    'qtipocLondon',
    'blackLGBTQ',
    'blackqueeruk',
    'ukblackpride',
    'blackprideuk',
    'qtipocevents',
    'blackqueerevents'
];
// Eventbrite search terms
const EVENTBRITE_SEARCHES = [
    'black lgbtq london',
    'black pride uk',
    'qtipoc',
    'black queer uk'
];
async function triggerApifyActor(actorId, input, name) {
    if (!APIFY_API_KEY) {
        return { success: false, error: 'Missing API key' };
    }
    try {
        // Webhooks must be passed as a query parameter, not in the body
        const webhooks = encodeURIComponent(JSON.stringify([{
                eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED'],
                requestUrl: WEBHOOK_URL
            }]));
        const response = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_KEY}&webhooks=${webhooks}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Apify Trigger] Failed to start ${name}: ${response.status}`, errorText);
            return { success: false, error: `${response.status}: ${errorText}` };
        }
        const data = await response.json();
        console.log(`[Apify Trigger] Started ${name}: run ${data.data?.id}`);
        return { success: true, runId: data.data?.id };
    }
    catch (error) {
        console.error(`[Apify Trigger] Error starting ${name}:`, error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    // Verify authorization
    const cronSecret = req.headers['authorization'];
    const isAuthorized = cronSecret === `Bearer ${process.env.CRON_SECRET}` ||
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
    // Trigger Instagram Hashtag Scraper (better for event discovery)
    const instagramResult = await triggerApifyActor('apify/instagram-hashtag-scraper', {
        hashtags: INSTAGRAM_HASHTAGS,
        resultsLimit: 20, // 20 posts per hashtag
        resultsType: 'posts', // Focus on posts rather than reels for event details
        addParentData: true // Include hashtag context
    }, 'Instagram');
    results.instagram = {
        triggered: instagramResult.success,
        runId: instagramResult.runId || '',
        error: instagramResult.error || ''
    };
    // Trigger Eventbrite scraper (using dedicated newpo/eventbrite-scraper)
    const eventbriteResult = await triggerApifyActor('newpo/eventbrite-scraper', {
        startUrls: EVENTBRITE_SEARCHES.map(q => ({
            url: `https://www.eventbrite.co.uk/d/united-kingdom--london/${encodeURIComponent(q)}/?page=1`
        })),
        proxy: {
            useApifyProxy: true,
            apifyProxyGroups: ['RESIDENTIAL']
        },
        maxItems: 100 // Limit total results across all searches
    }, 'Eventbrite');
    results.eventbrite = {
        triggered: eventbriteResult.success,
        runId: eventbriteResult.runId || '',
        error: eventbriteResult.error || ''
    };
    // Trigger Outsavvy scraper (using Playwright for JS-rendered content)
    const outsavvyResult = await triggerApifyActor('apify/playwright-scraper', {
        startUrls: [
            { url: 'https://www.outsavvy.com/search?q=black+lgbtq&location=london' },
            { url: 'https://www.outsavvy.com/search?q=black+pride&location=london' },
            { url: 'https://www.outsavvy.com/search?q=qtipoc&location=london' },
            { url: 'https://www.outsavvy.com/search?q=black+queer&location=london' }
        ],
        pageFunction: async ({ page, request }) => {
            // Wait for dynamic content to load
            await page.waitForSelector('article, [class*="EventCard"], a[href*="/event/"]', { timeout: 10000 });
            const events = await page.$$eval('article, [class*="EventCard"], div[class*="event"]', (elements) => {
                return elements.map(el => {
                    const link = el.querySelector('a[href*="/event/"]');
                    const titleEl = el.querySelector('h2, h3, [class*="title"], [class*="Title"]');
                    const dateEl = el.querySelector('[class*="date"], [class*="Date"], time');
                    const venueEl = el.querySelector('[class*="venue"], [class*="Venue"], [class*="location"], [class*="Location"]');
                    const priceEl = el.querySelector('[class*="price"], [class*="Price"]');
                    return {
                        title: titleEl?.textContent?.trim() || '',
                        url: link?.href || '',
                        date: dateEl?.textContent?.trim() || '',
                        venue: venueEl?.textContent?.trim() || '',
                        price: priceEl?.textContent?.trim() || '',
                        description: el.querySelector('p')?.textContent?.trim()?.substring(0, 200) || ''
                    };
                }).filter(e => e.title && e.url);
            });
            return events;
        },
        maxRequestsPerCrawl: 20,
        maxConcurrency: 2,
        navigationTimeoutSecs: 30
    }, 'Outsavvy');
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
