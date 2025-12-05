import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const APP_SECRET = process.env.VITE_INSTAGRAM_CLIENT_SECRET;

// Parse signed request from Meta
function parseSignedRequest(signedRequest: string): any {
  if (!APP_SECRET) return null;

  const [encodedSig, payload] = signedRequest.split('.');

  // Decode payload
  const data = JSON.parse(
    Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
  );

  // Verify signature
  const expectedSig = crypto
    .createHmac('sha256', APP_SECRET)
    .update(payload)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  if (encodedSig !== expectedSig) {
    console.error('Invalid signature in data deletion request');
    return null;
  }

  return data;
}

// Generate confirmation code for data deletion tracking
function generateConfirmationCode(): string {
  return `BLKOUT-DEL-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
  const confirmationCode = generateConfirmationCode();

  console.log('Instagram data deletion request for user:', userId, 'Confirmation:', confirmationCode);

  // TODO: Delete user's Instagram data from Supabase
  // await supabase.from('instagram_connections').delete().eq('instagram_user_id', userId);
  // await supabase.from('instagram_posts').delete().eq('instagram_user_id', userId);

  // TODO: Log deletion request for compliance
  // await supabase.from('data_deletion_requests').insert({
  //   platform: 'instagram',
  //   user_id: userId,
  //   confirmation_code: confirmationCode,
  //   status: 'completed',
  //   requested_at: new Date().toISOString()
  // });

  // Meta requires this specific response format
  return res.status(200).json({
    url: `https://comms.blkoutuk.cloud/data-deletion-status?code=${confirmationCode}`,
    confirmation_code: confirmationCode
  });
}
