import crypto from 'crypto';
const APP_SECRET = process.env.VITE_INSTAGRAM_CLIENT_SECRET;
// Parse signed request from Meta
function parseSignedRequest(signedRequest) {
    if (!APP_SECRET)
        return null;
    const [encodedSig, payload] = signedRequest.split('.');
    // Decode payload
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    // Verify signature
    const expectedSig = crypto
        .createHmac('sha256', APP_SECRET)
        .update(payload)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    if (encodedSig !== expectedSig) {
        console.error('Invalid signature in deauthorize request');
        return null;
    }
    return data;
}
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const signedRequest = req.body?.signed_request;
    if (!signedRequest) {
        return res.status(400).json({ error: 'Missing signed_request' });
    }
    const data = parseSignedRequest(signedRequest);
    if (!data) {
        return res.status(400).json({ error: 'Invalid signed_request' });
    }
    const userId = data.user_id;
    console.log('Instagram deauthorization request for user:', userId);
    // TODO: Remove user's Instagram tokens and data from Supabase
    // await supabase.from('instagram_connections').delete().eq('instagram_user_id', userId);
    // Must respond with success
    return res.status(200).json({ success: true });
}
