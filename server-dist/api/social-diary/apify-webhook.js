import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APIFY_API_KEY = process.env.APIFY_API_KEY;
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;
function generateUrlHash(url) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}
// Process Eventbrite results (updated for newpo/eventbrite-scraper)
function processEventbriteResults(items) {
    return items
        .filter(item => (item.name || item.title) && item.url)
        .map(item => {
        // Handle both old and new data formats
        const eventTitle = item.title || item.name || '';
        const startDate = item.startDate || (item.start?.local ? item.start.local.split('T')[0] : '');
        const startTime = item.startTime || (item.start?.local ? item.start.local.split('T')[1]?.substring(0, 5) : '');
        const eventLocation = item.location || item.venueName ||
            (item.venue?.name ? `${item.venue.name}, ${item.venue.address?.city || 'UK'}` : 'TBC');
        const eventDescription = item.summary || item.description?.text || '';
        // Determine cost
        let cost = 'TBC';
        if (item.isFree || item.is_free) {
            cost = 'Free';
        }
        else if (item.price) {
            cost = item.price;
        }
        else if (item.ticket_availability?.minimum_ticket_price?.major_value) {
            cost = `From £${item.ticket_availability.minimum_ticket_price.major_value}`;
        }
        return {
            title: eventTitle,
            description: eventDescription.substring(0, 500),
            date: startDate,
            start_time: startTime || null,
            location: eventLocation,
            organizer: item.organizer || 'Via Eventbrite',
            url: item.url,
            url_hash: generateUrlHash(item.url),
            cost,
            tags: ['eventbrite', 'scraped'],
            source: 'eventbrite.co.uk',
            source_platform: 'eventbrite',
            relevance_score: 80, // Higher score for dedicated scraper
            status: 'pending',
            discovery_method: 'apify_eventbrite',
            discovered_at: new Date().toISOString()
        };
    });
}
// Process Outsavvy results
function processOutsavvyResults(items) {
    return items
        .filter(item => item.title && item.url)
        .map(item => ({
        title: item.title,
        description: item.description || '',
        date: item.date || '',
        start_time: null,
        location: item.venue || 'TBC',
        organizer: 'Via Outsavvy',
        url: item.url.startsWith('http') ? item.url : `https://www.outsavvy.com${item.url}`,
        url_hash: generateUrlHash(item.url),
        cost: item.price || 'TBC',
        tags: ['outsavvy', 'scraped'],
        source: 'outsavvy.com',
        source_platform: 'outsavvy',
        relevance_score: 80,
        status: 'pending',
        discovery_method: 'apify_outsavvy',
        discovered_at: new Date().toISOString()
    }));
}
// Process Instagram results - extract event info from hashtag posts
function processInstagramResults(items) {
    const eventKeywords = ['event', 'tickets', 'join us', 'link in bio', 'save the date', 'party', 'night', 'doors', 'entry'];
    return items
        .filter(item => {
        if (!item.caption)
            return false;
        const caption = item.caption.toLowerCase();
        return eventKeywords.some(kw => caption.includes(kw));
    })
        .map(item => {
        // Extract title from first line of caption or use owner username
        const captionLines = item.caption?.split('\n') || [];
        const firstLine = captionLines[0]?.trim() || '';
        const title = firstLine.length > 10 && firstLine.length < 100
            ? firstLine
            : `Event from @${item.ownerUsername}`;
        return {
            title,
            description: item.caption?.substring(0, 500) || '',
            date: item.timestamp ? item.timestamp.split('T')[0] : '',
            start_time: null,
            location: item.locationName || 'See post for details',
            organizer: item.ownerUsername || 'Instagram',
            url: item.url || `https://instagram.com/p/${item.shortCode}`,
            url_hash: generateUrlHash(item.url || `ig_${item.shortCode}`),
            cost: 'TBC',
            tags: ['instagram', 'scraped', ...(item.hashtags?.slice(0, 3) || []), item.ownerUsername || 'unknown'],
            source: 'instagram.com',
            source_platform: 'instagram',
            relevance_score: item.likesCount && item.likesCount > 100 ? 75 : 70, // Higher score for popular posts
            status: 'pending',
            discovery_method: 'apify_instagram_hashtag',
            discovered_at: new Date().toISOString()
        };
    });
}
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    // Verify this is from Apify (check for expected structure or add webhook secret)
    const { resource, eventData } = req.body || {};
    if (!resource || !eventData) {
        console.log('[Apify Webhook] Invalid payload structure');
        return res.status(400).json({ error: 'Invalid webhook payload' });
    }
    const { actorId, defaultDatasetId, status } = resource;
    console.log(`[Apify Webhook] Received callback for actor ${actorId}, status: ${status}`);
    if (status !== 'SUCCEEDED') {
        console.log(`[Apify Webhook] Actor ${actorId} did not succeed: ${status}`);
        return res.status(200).json({ received: true, processed: false, reason: `Status: ${status}` });
    }
    if (!APIFY_API_KEY || !supabase) {
        console.error('[Apify Webhook] Missing API key or Supabase client');
        return res.status(500).json({ error: 'Server configuration error' });
    }
    try {
        // Fetch results from the dataset
        const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${defaultDatasetId}/items?token=${APIFY_API_KEY}`);
        if (!datasetResponse.ok) {
            throw new Error(`Failed to fetch dataset: ${datasetResponse.status}`);
        }
        const items = await datasetResponse.json();
        console.log(`[Apify Webhook] Fetched ${items.length} items from dataset`);
        // Process based on actor type
        let eventsToInsert = [];
        if (actorId.includes('eventbrite') || actorId.includes('newpo')) {
            console.log('[Apify Webhook] Processing Eventbrite results');
            eventsToInsert = processEventbriteResults(items);
        }
        else if (actorId.includes('instagram')) {
            console.log('[Apify Webhook] Processing Instagram results');
            eventsToInsert = processInstagramResults(items);
        }
        else if (actorId.includes('playwright') || actorId.includes('outsavvy')) {
            console.log('[Apify Webhook] Processing Outsavvy/Playwright results');
            eventsToInsert = processOutsavvyResults(items);
        }
        else {
            console.log(`[Apify Webhook] Unknown actor type: ${actorId}`);
            return res.status(200).json({ received: true, processed: false, reason: 'Unknown actor type' });
        }
        if (eventsToInsert.length === 0) {
            return res.status(200).json({ received: true, processed: true, eventsFound: 0 });
        }
        // Insert into Supabase
        const { data, error } = await supabase
            .from('events')
            .insert(eventsToInsert)
            .select();
        if (error) {
            console.error('[Apify Webhook] Insert error:', error);
            // Still return 200 to acknowledge webhook
            return res.status(200).json({
                received: true,
                processed: false,
                error: error.message,
                eventsAttempted: eventsToInsert.length
            });
        }
        console.log(`[Apify Webhook] Saved ${data?.length || 0} events to Supabase`);
        return res.status(200).json({
            received: true,
            processed: true,
            actorId,
            eventsFound: items.length,
            eventsSaved: data?.length || 0
        });
    }
    catch (error) {
        console.error('[Apify Webhook] Error:', error);
        return res.status(200).json({
            received: true,
            processed: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
