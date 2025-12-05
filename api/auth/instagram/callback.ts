import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLIENT_ID = process.env.VITE_INSTAGRAM_CLIENT_ID;
const CLIENT_SECRET = process.env.VITE_INSTAGRAM_CLIENT_SECRET;
const REDIRECT_URI = process.env.VITE_INSTAGRAM_REDIRECT_URI || 'https://comms.blkoutuk.cloud/auth/instagram/callback';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error, error_reason, error_description } = req.query;

  // Handle errors from Instagram
  if (error) {
    console.error('Instagram OAuth error:', { error, error_reason, error_description });
    return res.redirect(`/?instagram_error=${encodeURIComponent(String(error_description || error))}`);
  }

  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code: String(code),
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return res.redirect(`/?instagram_error=${encodeURIComponent('Failed to exchange authorization code')}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, user_id } = tokenData;

    // Exchange short-lived token for long-lived token (60 days)
    const longLivedResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${CLIENT_SECRET}&access_token=${access_token}`
    );

    let finalToken = access_token;
    let expiresIn = 3600; // Default 1 hour for short-lived

    if (longLivedResponse.ok) {
      const longLivedData = await longLivedResponse.json();
      finalToken = longLivedData.access_token;
      expiresIn = longLivedData.expires_in; // ~60 days in seconds
      console.log('Exchanged for long-lived token, expires in:', expiresIn, 'seconds');
    }

    // Get user profile info
    const profileResponse = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=user_id,username,name,account_type,profile_picture_url&access_token=${finalToken}`
    );

    let profile = { user_id };
    if (profileResponse.ok) {
      profile = await profileResponse.json();
    }

    console.log('Instagram connected:', profile);

    // TODO: Store token securely in Supabase
    // For now, redirect with success and pass data via URL params (not ideal for production)
    // In production, store in database and use session/cookie

    const successParams = new URLSearchParams({
      instagram_connected: 'true',
      instagram_user_id: String(profile.user_id || user_id),
      instagram_username: (profile as any).username || '',
    });

    return res.redirect(`/?${successParams.toString()}`);

  } catch (error) {
    console.error('Instagram OAuth error:', error);
    return res.redirect(`/?instagram_error=${encodeURIComponent('Authentication failed')}`);
  }
}
