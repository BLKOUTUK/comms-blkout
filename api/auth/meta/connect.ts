/**
 * Meta (Facebook/Instagram) OAuth Connect
 * Redirects to Facebook Login with permissions for page posting + Instagram publishing
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLIENT_ID = process.env.VITE_INSTAGRAM_CLIENT_ID;
const REDIRECT_URI = process.env.META_REDIRECT_URI || 'https://comms.blkoutuk.cloud/api/auth/meta/callback';

// Permissions needed for Facebook Page + Instagram publishing
const SCOPES = [
  'pages_manage_posts',      // Post to Facebook Pages
  'pages_read_engagement',   // Read post metrics
  'instagram_basic',         // Basic Instagram account info
  'instagram_content_publish', // Publish to Instagram (requires App Review for production)
  'pages_show_list',         // List pages the user manages
].join(',');

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (!CLIENT_ID) {
    return res.status(500).json({ error: 'META_CLIENT_ID not configured' });
  }

  const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', 'blkout_meta_connect');

  return res.redirect(authUrl.toString());
}
