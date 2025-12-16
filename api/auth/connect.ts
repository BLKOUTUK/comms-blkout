import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// OAuth configuration for each platform
const OAUTH_CONFIG = {
  instagram: {
    authUrl: 'https://www.instagram.com/oauth/authorize',
    clientId: process.env.VITE_INSTAGRAM_CLIENT_ID,
    redirectUri: process.env.VITE_INSTAGRAM_REDIRECT_URI || 'https://comms.blkoutuk.cloud/api/auth/callback?platform=instagram',
    scope: 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish',
    responseType: 'code',
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    clientId: process.env.VITE_LINKEDIN_CLIENT_ID,
    redirectUri: process.env.VITE_LINKEDIN_REDIRECT_URI || 'https://comms.blkoutuk.cloud/api/auth/callback?platform=linkedin',
    scope: 'openid profile email w_member_social',
    responseType: 'code',
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    clientId: process.env.VITE_TIKTOK_CLIENT_KEY,
    redirectUri: process.env.VITE_TIKTOK_REDIRECT_URI || 'https://comms-blkout.vercel.app/api/auth/tiktok/callback',
    scope: 'user.info.basic,video.list,video.publish',
    responseType: 'code',
  },
  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: process.env.VITE_YOUTUBE_CLIENT_ID,
    redirectUri: process.env.VITE_YOUTUBE_REDIRECT_URI || 'https://comms.blkoutuk.cloud/api/auth/callback?platform=youtube',
    scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload',
    responseType: 'code',
    accessType: 'offline',
    prompt: 'consent',
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    clientId: process.env.VITE_TWITTER_CLIENT_ID,
    redirectUri: process.env.VITE_TWITTER_REDIRECT_URI || 'https://comms.blkoutuk.cloud/api/auth/callback?platform=twitter',
    scope: 'tweet.read tweet.write users.read offline.access',
    responseType: 'code',
    codeChallengeMethod: 'plain',
  },
};

type Platform = keyof typeof OAUTH_CONFIG;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { platform } = req.query;

  if (!platform || typeof platform !== 'string') {
    return res.status(400).json({
      error: 'Platform required',
      available: Object.keys(OAUTH_CONFIG)
    });
  }

  const config = OAUTH_CONFIG[platform as Platform];
  if (!config) {
    return res.status(400).json({
      error: 'Invalid platform',
      available: Object.keys(OAUTH_CONFIG)
    });
  }

  if (!config.clientId) {
    return res.status(500).json({
      error: `${platform} OAuth not configured - missing client ID`
    });
  }

  // Generate state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    response_type: config.responseType,
    state,
  });

  // Add platform-specific params
  if (platform === 'youtube') {
    params.append('access_type', 'offline');
    params.append('prompt', 'consent');
  }

  if (platform === 'twitter') {
    // Twitter uses PKCE
    const codeVerifier = 'challenge'; // In production, generate and store securely
    params.append('code_challenge', codeVerifier);
    params.append('code_challenge_method', 'plain');
  }

  const authUrl = `${config.authUrl}?${params.toString()}`;

  // Return the URL for the frontend to redirect to
  return res.json({
    success: true,
    platform,
    authUrl,
    state,
  });
}
