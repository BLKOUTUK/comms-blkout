/**
 * Meta (Facebook/Instagram) OAuth Callback
 * Exchanges code for long-lived token, fetches Page + IG Business Account IDs,
 * stores tokens in Supabase platform_tokens table.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const CLIENT_ID = process.env.VITE_INSTAGRAM_CLIENT_ID;
const CLIENT_SECRET = process.env.VITE_INSTAGRAM_CLIENT_SECRET;
const REDIRECT_URI = process.env.META_REDIRECT_URI || 'https://comms.blkoutuk.cloud/api/auth/meta/callback';
const GRAPH_API = 'https://graph.facebook.com/v21.0';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error, error_description } = req.query;

  if (error) {
    console.error('[Meta OAuth] Error:', error, error_description);
    return res.redirect(`/?meta_error=${encodeURIComponent(String(error_description || error))}`);
  }

  if (!code || !CLIENT_ID || !CLIENT_SECRET) {
    return res.status(400).json({ error: 'Missing code or app credentials' });
  }

  try {
    // Step 1: Exchange code for short-lived user access token
    const tokenUrl = new URL(`${GRAPH_API}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id', CLIENT_ID);
    tokenUrl.searchParams.set('client_secret', CLIENT_SECRET);
    tokenUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    tokenUrl.searchParams.set('code', String(code));

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('[Meta OAuth] Token exchange failed:', tokenData.error);
      return res.redirect(`/?meta_error=${encodeURIComponent(tokenData.error.message)}`);
    }

    const shortLivedToken = tokenData.access_token;

    // Step 2: Exchange for long-lived user token (60 days)
    const longLivedUrl = new URL(`${GRAPH_API}/oauth/access_token`);
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longLivedUrl.searchParams.set('client_id', CLIENT_ID);
    longLivedUrl.searchParams.set('client_secret', CLIENT_SECRET);
    longLivedUrl.searchParams.set('fb_exchange_token', shortLivedToken);

    const longLivedRes = await fetch(longLivedUrl.toString());
    const longLivedData = await longLivedRes.json();

    const userToken = longLivedData.access_token || shortLivedToken;
    const expiresIn = longLivedData.expires_in || 3600;

    console.log('[Meta OAuth] Got long-lived user token, expires in:', expiresIn, 'seconds');

    // Step 3: Get Pages the user manages
    const pagesRes = await fetch(
      `${GRAPH_API}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${userToken}`
    );
    const pagesData = await pagesRes.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return res.redirect('/?meta_error=' + encodeURIComponent('No Facebook Pages found. Make sure your account manages a Page.'));
    }

    // Use the first page (or the BLKOUT page if found)
    const page = pagesData.data.find((p: any) =>
      p.name?.toLowerCase().includes('blkout')
    ) || pagesData.data[0];

    const pageId = page.id;
    const pageToken = page.access_token; // Page tokens from long-lived user tokens are also long-lived
    const pageName = page.name;
    const igAccount = page.instagram_business_account;
    const igAccountId = igAccount?.id;
    const igUsername = igAccount?.username;

    console.log('[Meta OAuth] Connected page:', pageName, '(ID:', pageId, ')');
    console.log('[Meta OAuth] Instagram Business Account:', igUsername || 'not linked', '(ID:', igAccountId || 'none', ')');

    // Step 4: Store tokens in Supabase
    if (supabase) {
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      // Store Facebook Page token
      await supabase.from('platform_tokens').upsert({
        platform: 'facebook',
        account_id: pageId,
        account_name: pageName,
        access_token: pageToken,
        expires_at: expiresAt,
        updated_at: now,
      }, { onConflict: 'platform' });

      // Store Instagram Business Account token (uses same page token)
      if (igAccountId) {
        await supabase.from('platform_tokens').upsert({
          platform: 'instagram',
          account_id: igAccountId,
          account_name: igUsername || pageName,
          access_token: pageToken,
          expires_at: expiresAt,
          updated_at: now,
        }, { onConflict: 'platform' });
      }

      console.log('[Meta OAuth] Tokens stored in Supabase');
    } else {
      console.warn('[Meta OAuth] Supabase not configured — tokens not stored');
    }

    // Redirect back to admin with success info
    const params = new URLSearchParams({
      meta_connected: 'true',
      meta_page: pageName,
      meta_page_id: pageId,
      ...(igUsername && { meta_ig_username: igUsername }),
      ...(igAccountId && { meta_ig_id: igAccountId }),
    });

    return res.redirect(`/?${params.toString()}`);

  } catch (err) {
    console.error('[Meta OAuth] Error:', err);
    return res.redirect(`/?meta_error=${encodeURIComponent('Connection failed — check server logs')}`);
  }
}
