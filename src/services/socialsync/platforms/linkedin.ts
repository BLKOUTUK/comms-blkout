import {
    SocialMediaPlatform,
    PlatformCredentials,
    PublishOptions,
    PublishResult,
    PlatformStatus,
} from './base';

/**
 * LinkedIn API Connector
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/
 */
export class LinkedInPlatform extends SocialMediaPlatform {
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly baseUrl = 'https://api.linkedin.com/v2';

    constructor(clientId: string, clientSecret: string, credentials?: PlatformCredentials) {
        super(credentials);
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    getAuthUrl(redirectUri: string): string {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            redirect_uri: redirectUri,
            scope: 'openid profile email w_member_social',
            state: crypto.randomUUID(),
        });
        return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    }

    async authenticate(authCode: string): Promise<PlatformCredentials> {
        const redirectUri = `${window.location.origin}/auth/callback/linkedin`;

        const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: authCode,
                redirect_uri: redirectUri,
                client_id: this.clientId,
                client_secret: this.clientSecret,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error_description || 'LinkedIn authentication failed');
        }

        // Get user profile
        const profileResponse = await fetch(`${this.baseUrl}/userinfo`, {
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
            },
        });

        const profile = await profileResponse.json();

        this.credentials = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: new Date(Date.now() + data.expires_in * 1000),
            accountId: profile.sub,
            accountName: profile.name,
        };

        return this.credentials;
    }

    async refreshAccessToken(): Promise<PlatformCredentials> {
        if (!this.credentials?.refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: this.credentials.refreshToken,
                client_id: this.clientId,
                client_secret: this.clientSecret,
            }),
        });

        const data = await response.json();

        this.credentials.accessToken = data.access_token;
        this.credentials.expiresAt = new Date(Date.now() + data.expires_in * 1000);

        return this.credentials;
    }

    async publish(
        mediaUrl: string,
        mediaType: 'image' | 'video',
        options: PublishOptions
    ): Promise<PublishResult> {
        if (!this.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const caption = this.buildCaption(options.caption, options.hashtags);

            // Create post
            const postData: Record<string, unknown> = {
                author: `urn:li:person:${this.credentials!.accountId}`,
                lifecycleState: 'PUBLISHED',
                specificContent: {
                    'com.linkedin.ugc.ShareContent': {
                        shareCommentary: {
                            text: caption,
                        },
                        shareMediaCategory: mediaType === 'image' ? 'IMAGE' : 'VIDEO',
                        media: [
                            {
                                status: 'READY',
                                originalUrl: mediaUrl,
                            },
                        ],
                    },
                },
                visibility: {
                    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
                },
            };

            const response = await fetch(`${this.baseUrl}/ugcPosts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.credentials!.accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0',
                },
                body: JSON.stringify(postData),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.message || 'Failed to post to LinkedIn',
                };
            }

            return {
                success: true,
                postId: result.id,
                url: `https://www.linkedin.com/feed/update/${result.id}`,
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
            const response = await fetch(`${this.baseUrl}/userinfo`, {
                headers: {
                    'Authorization': `Bearer ${this.credentials!.accessToken}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                return { connected: false, error: data.message || 'Failed to get profile' };
            }

            return {
                connected: true,
                accountName: data.name,
                accountId: data.sub,
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
            if (fileSize && fileSize > 8 * 1024 * 1024) {
                errors.push('Image file size must be under 8MB');
            }
        } else {
            if (fileSize && fileSize > 200 * 1024 * 1024) {
                errors.push('Video file size must be under 200MB');
            }
        }

        return { valid: errors.length === 0, errors };
    }

    private buildCaption(caption?: string, hashtags?: string[]): string {
        let result = caption || '';
        if (hashtags && hashtags.length > 0) {
            result += '\n\n' + hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
        }
        return result;
    }
}
