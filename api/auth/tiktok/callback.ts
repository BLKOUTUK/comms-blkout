import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLIENT_KEY = process.env.VITE_TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.VITE_TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = 'https://comms-blkout.vercel.app/api/auth/tiktok/callback';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error, error_description } = req.query;

  if (error) {
    console.error('TikTok OAuth error:', { error, error_description });
    return res.redirect(`/admin/socialsync?tiktok_error=${encodeURIComponent(String(error_description || error))}`);
  }

  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: CLIENT_KEY!,
        client_secret: CLIENT_SECRET!,
        code: String(code),
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('TikTok token exchange failed:', errorData);
      return res.redirect(`/admin/socialsync?tiktok_error=${encodeURIComponent('Token exchange failed')}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, open_id } = tokenData;

    let userInfo: any = { open_id };
    try {
      const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
        headers: { 'Authorization': `Bearer ${access_token}` },
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        userInfo = userData.data?.user || userInfo;
      }
    } catch (e) {
      console.warn('Failed to fetch TikTok profile:', e);
    }

    console.log('TikTok connected:', userInfo);

    const successParams = new URLSearchParams({
      tiktok_connected: 'true',
      tiktok_open_id: userInfo.open_id || open_id || '',
      tiktok_display_name: userInfo.display_name || '',
    });

    return res.redirect(`/admin/socialsync?${successParams.toString()}`);

  } catch (error) {
    console.error('TikTok OAuth error:', error);
    return res.redirect(`/admin/socialsync?tiktok_error=${encodeURIComponent('Authentication failed')}`);
  }
}
