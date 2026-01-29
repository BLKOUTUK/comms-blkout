import crypto from 'crypto';
// Verify token - set this same value in Meta Developer Portal
const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || 'blkout_instagram_webhook_2025';
const APP_SECRET = process.env.VITE_INSTAGRAM_CLIENT_SECRET;
// Verify webhook signature from Meta
function verifySignature(payload, signature) {
    if (!APP_SECRET || !signature)
        return false;
    const expectedSignature = crypto
        .createHmac('sha256', APP_SECRET)
        .update(payload)
        .digest('hex');
    const providedSignature = signature.replace('sha256=', '');
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature));
}
export default async function handler(req, res) {
    // GET request = Meta verification challenge
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        console.log('Webhook verification request:', { mode, token, challenge: challenge ? 'present' : 'missing' });
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            return res.status(200).send(challenge);
        }
        else {
            console.log('Webhook verification failed - token mismatch');
            return res.status(403).json({ error: 'Verification failed' });
        }
    }
    // POST request = actual webhook event
    if (req.method === 'POST') {
        // Verify signature for security
        const signature = req.headers['x-hub-signature-256'];
        const rawBody = JSON.stringify(req.body);
        if (APP_SECRET && signature && !verifySignature(rawBody, signature)) {
            console.log('Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }
        const body = req.body;
        console.log('Instagram webhook received:', JSON.stringify(body, null, 2));
        // Handle different webhook event types
        if (body.object === 'instagram') {
            for (const entry of body.entry || []) {
                // Handle messaging events
                if (entry.messaging) {
                    for (const event of entry.messaging) {
                        console.log('Message event:', event);
                        // TODO: Process incoming messages, story replies, etc.
                    }
                }
                // Handle changes (comments, mentions, etc.)
                if (entry.changes) {
                    for (const change of entry.changes) {
                        console.log('Change event:', change.field, change.value);
                        // TODO: Process comments, mentions, story_insights
                    }
                }
            }
        }
        // Must respond with 200 quickly to acknowledge receipt
        return res.status(200).json({ received: true });
    }
    // Other methods not allowed
    return res.status(405).json({ error: 'Method not allowed' });
}
