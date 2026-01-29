// OAuth platform configurations
const PLATFORMS = {
    instagram: {
        tokenUrl: 'https://api.instagram.com/oauth/access_token',
        profileUrl: 'https://graph.instagram.com/v21.0/me?fields=user_id,username,name,account_type,profile_picture_url',
        clientId: () => process.env.VITE_INSTAGRAM_CLIENT_ID,
        clientSecret: () => process.env.VITE_INSTAGRAM_CLIENT_SECRET,
        redirectUri: () => process.env.VITE_INSTAGRAM_REDIRECT_URI || 'https://comms.blkoutuk.cloud/api/auth/callback?platform=instagram',
        exchangeToken: async (code, config) => {
            const response = await fetch('https://api.instagram.com/oauth/access_token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: config.clientId(),
                    client_secret: config.clientSecret(),
                    grant_type: 'authorization_code',
                    redirect_uri: config.redirectUri(),
                    code,
                }),
            });
            return response.json();
        },
    },
    linkedin: {
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        profileUrl: 'https://api.linkedin.com/v2/userinfo',
        clientId: () => process.env.VITE_LINKEDIN_CLIENT_ID,
        clientSecret: () => process.env.VITE_LINKEDIN_CLIENT_SECRET,
        redirectUri: () => process.env.VITE_LINKEDIN_REDIRECT_URI || 'https://comms.blkoutuk.cloud/api/auth/callback?platform=linkedin',
        exchangeToken: async (code, config) => {
            const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    client_id: config.clientId(),
                    client_secret: config.clientSecret(),
                    redirect_uri: config.redirectUri(),
                }),
            });
            return response.json();
        },
    },
    tiktok: {
        tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
        profileUrl: 'https://open.tiktokapis.com/v2/user/info/',
        clientId: () => process.env.VITE_TIKTOK_CLIENT_KEY,
        clientSecret: () => process.env.VITE_TIKTOK_CLIENT_SECRET,
        redirectUri: () => process.env.VITE_TIKTOK_REDIRECT_URI || 'https://comms.blkoutuk.cloud/api/auth/callback?platform=tiktok',
        exchangeToken: async (code, config) => {
            const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_key: config.clientId(),
                    client_secret: config.clientSecret(),
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: config.redirectUri(),
                }),
            });
            return response.json();
        },
    },
    youtube: {
        tokenUrl: 'https://oauth2.googleapis.com/token',
        profileUrl: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        clientId: () => process.env.VITE_YOUTUBE_CLIENT_ID,
        clientSecret: () => process.env.VITE_YOUTUBE_CLIENT_SECRET,
        redirectUri: () => process.env.VITE_YOUTUBE_REDIRECT_URI || 'https://comms.blkoutuk.cloud/api/auth/callback?platform=youtube',
        exchangeToken: async (code, config) => {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: config.clientId(),
                    client_secret: config.clientSecret(),
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: config.redirectUri(),
                }),
            });
            return response.json();
        },
    },
    twitter: {
        tokenUrl: 'https://api.twitter.com/2/oauth2/token',
        profileUrl: 'https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name',
        clientId: () => process.env.VITE_TWITTER_CLIENT_ID,
        clientSecret: () => process.env.VITE_TWITTER_CLIENT_SECRET,
        redirectUri: () => process.env.VITE_TWITTER_REDIRECT_URI || 'https://comms.blkoutuk.cloud/api/auth/callback?platform=twitter',
        exchangeToken: async (code, config) => {
            const basicAuth = Buffer.from(`${config.clientId()}:${config.clientSecret()}`).toString('base64');
            const response = await fetch('https://api.twitter.com/2/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${basicAuth}`,
                },
                body: new URLSearchParams({
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: config.redirectUri(),
                    code_verifier: 'challenge',
                }),
            });
            return response.json();
        },
    },
};
export default async function handler(req, res) {
    const { platform, code, error, error_description } = req.query;
    if (!platform || typeof platform !== 'string') {
        return res.status(400).json({ error: 'Platform required', available: Object.keys(PLATFORMS) });
    }
    const config = PLATFORMS[platform];
    if (!config) {
        return res.status(400).json({ error: 'Invalid platform', available: Object.keys(PLATFORMS) });
    }
    if (error) {
        console.error(`${platform} OAuth error:`, { error, error_description });
        return res.redirect(`/admin/socialsync?${platform}_error=${encodeURIComponent(String(error_description || error))}`);
    }
    if (!code) {
        return res.status(400).json({ error: 'No authorization code provided' });
    }
    try {
        // Exchange code for access token
        const tokenData = await config.exchangeToken(String(code), config);
        if (tokenData.error || tokenData.error_description) {
            console.error(`${platform} token exchange failed:`, tokenData);
            return res.redirect(`/admin/socialsync?${platform}_error=${encodeURIComponent(tokenData.error_description || 'Token exchange failed')}`);
        }
        const accessToken = tokenData.access_token;
        // Get profile info
        let profile = {};
        try {
            const profileResponse = await fetch(config.profileUrl + (config.profileUrl.includes('?') ? '&' : '?') + `access_token=${accessToken}`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                profile = profileData.data || profileData.items?.[0] || profileData;
            }
        }
        catch (e) {
            console.warn(`Failed to fetch ${platform} profile:`, e);
        }
        console.log(`${platform} connected:`, profile);
        // Build success params
        const successParams = new URLSearchParams({
            [`${platform}_connected`]: 'true',
        });
        // Add platform-specific profile data
        if (profile.username)
            successParams.set(`${platform}_username`, profile.username);
        if (profile.name)
            successParams.set(`${platform}_name`, profile.name);
        if (profile.id)
            successParams.set(`${platform}_id`, profile.id);
        if (profile.user_id)
            successParams.set(`${platform}_user_id`, profile.user_id);
        if (profile.open_id)
            successParams.set(`${platform}_open_id`, profile.open_id);
        return res.redirect(`/admin/socialsync?${successParams.toString()}`);
    }
    catch (error) {
        console.error(`${platform} OAuth error:`, error);
        return res.redirect(`/admin/socialsync?${platform}_error=${encodeURIComponent('Authentication failed')}`);
    }
}
