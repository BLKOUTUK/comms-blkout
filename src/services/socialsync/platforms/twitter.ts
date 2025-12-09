import {
    SocialMediaPlatform,
    PlatformCredentials,
    PublishOptions,
    PublishResult,
    PlatformStatus,
} from './base';

/**
 * Twitter/X API Connector (OAuth 2.0)
 * Docs: https://developer.twitter.com/en/docs/twitter-api
 */
export class TwitterPlatform extends SocialMediaPlatform {
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly baseUrl = 'https://api.twitter.com/2';
    private codeVerifier: string = '';

    constructor(clientId: string, clientSecret: string, credentials?: PlatformCredentials) {
        super(credentials);
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    private generateCodeVerifier(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    private async generateCodeChallenge(verifier: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(hash)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    async getAuthUrl(redirectUri: string): Promise<string> {
        this.codeVerifier = this.generateCodeVerifier();
        const codeChallenge = await this.generateCodeChallenge(this.codeVerifier);

        // Store code verifier for later use
        sessionStorage.setItem('twitter_code_verifier', this.codeVerifier);

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            redirect_uri: redirectUri,
            scope: 'tweet.read tweet.write users.read offline.access',
            state: crypto.randomUUID(),
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });

        return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
    }

    async authenticate(authCode: string): Promise<PlatformCredentials> {
        const redirectUri = `${window.location.origin}/auth/callback/twitter`;
        const codeVerifier = sessionStorage.getItem('twitter_code_verifier') || this.codeVerifier;

        const response = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: authCode,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error_description || 'Twitter authentication failed');
        }

        // Get user profile
        const profileResponse = await fetch(`${this.baseUrl}/users/me`, {
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
            },
        });

        const profile = await profileResponse.json();

        this.credentials = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: new Date(Date.now() + data.expires_in * 1000),
            accountId: profile.data?.id,
            accountName: profile.data?.username,
        };

        // Clean up
        sessionStorage.removeItem('twitter_code_verifier');

        return this.credentials;
    }

    async refreshAccessToken(): Promise<PlatformCredentials> {
        if (!this.credentials?.refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: this.credentials.refreshToken,
            }),
        });

        const data = await response.json();

        this.credentials.accessToken = data.access_token;
        this.credentials.refreshToken = data.refresh_token;
        this.credentials.expiresAt = new Date(Date.now() + data.expires_in * 1000);

        return this.credentials;
    }

    async publish(
        _mediaUrl: string,
        _mediaType: 'image' | 'video',
        options: PublishOptions
    ): Promise<PublishResult> {
        if (!this.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const text = this.buildCaption(options.caption, options.hashtags);

            // For Twitter, we need to upload media first if present
            // For now, we'll post text-only
            const tweetData = {
                text: text.slice(0, 280), // Twitter character limit
            };

            const response = await fetch(`${this.baseUrl}/tweets`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.credentials!.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tweetData),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.detail || result.title || 'Failed to post tweet',
                };
            }

            return {
                success: true,
                postId: result.data?.id,
                url: `https://twitter.com/i/web/status/${result.data?.id}`,
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    async getStatus(): Promise<PlatformStatus> {
        if (!this.isAuthenticated()) {
            return { connected: false, error: 'Not authenticated' };
        }

        try {
            const response = await fetch(`${this.baseUrl}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${this.credentials!.accessToken}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                return { connected: false, error: data.detail || 'Failed to get profile' };
            }

            return {
                connected: true,
                accountName: `@${data.data?.username}`,
                accountId: data.data?.id,
                lastSync: new Date(),
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                connected: false,
                error: errorMessage,
            };
        }
    }

    validateMedia(
        mediaType: 'image' | 'video',
        _aspectRatio: string,
        fileSize?: number
    ): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (mediaType === 'image') {
            if (fileSize && fileSize > 5 * 1024 * 1024) {
                errors.push('Image file size must be under 5MB');
            }
        } else {
            if (fileSize && fileSize > 512 * 1024 * 1024) {
                errors.push('Video file size must be under 512MB');
            }
        }

        return { valid: errors.length === 0, errors };
    }

    private buildCaption(caption?: string, hashtags?: string[]): string {
        let result = caption || '';
        if (hashtags && hashtags.length > 0) {
            const hashtagText = hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
            // Ensure we don't exceed 280 chars
            if (result.length + hashtagText.length + 2 <= 280) {
                result += '\n\n' + hashtagText;
            }
        }
        return result;
    }
}
