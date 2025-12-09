/**
 * Platform Manager - Coordinates all social media platform connectors
 */

import { SocialMediaPlatform, PublishOptions, PublishResult } from './base';
import { InstagramPlatform } from './instagram';
import { TikTokPlatform } from './tiktok';
import { LinkedInPlatform } from './linkedin';
import { TwitterPlatform } from './twitter';
import { SocialPlatform } from '@/types/socialsync';

export * from './base';
export * from './instagram';
export * from './tiktok';
export * from './linkedin';
export * from './twitter';

class PlatformManager {
    private platforms: Map<SocialPlatform, SocialMediaPlatform> = new Map();

    constructor() {
        // Initialize platforms with environment variables
        // In production, these would come from secure backend storage
        const instagramClientId = import.meta.env.VITE_INSTAGRAM_CLIENT_ID || '';
        const instagramClientSecret = import.meta.env.VITE_INSTAGRAM_CLIENT_SECRET || '';
        const tiktokClientKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY || '';
        const tiktokClientSecret = import.meta.env.VITE_TIKTOK_CLIENT_SECRET || '';
        const linkedinClientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID || '';
        const linkedinClientSecret = import.meta.env.VITE_LINKEDIN_CLIENT_SECRET || '';
        const twitterClientId = import.meta.env.VITE_TWITTER_CLIENT_ID || '';
        const twitterClientSecret = import.meta.env.VITE_TWITTER_CLIENT_SECRET || '';

        if (instagramClientId && instagramClientSecret) {
            this.platforms.set(
                SocialPlatform.INSTAGRAM,
                new InstagramPlatform(instagramClientId, instagramClientSecret)
            );
        }

        if (tiktokClientKey && tiktokClientSecret) {
            this.platforms.set(
                SocialPlatform.TIKTOK,
                new TikTokPlatform(tiktokClientKey, tiktokClientSecret)
            );
        }

        if (linkedinClientId && linkedinClientSecret) {
            this.platforms.set(
                SocialPlatform.LINKEDIN,
                new LinkedInPlatform(linkedinClientId, linkedinClientSecret)
            );
        }

        if (twitterClientId && twitterClientSecret) {
            this.platforms.set(
                SocialPlatform.TWITTER,
                new TwitterPlatform(twitterClientId, twitterClientSecret)
            );
        }
    }

    /**
     * Get platform connector
     */
    getPlatform(platform: SocialPlatform): SocialMediaPlatform | undefined {
        return this.platforms.get(platform);
    }

    /**
     * Publish content to a specific platform
     */
    async publish(
        platform: SocialPlatform,
        mediaUrl: string,
        mediaType: 'image' | 'video',
        options: PublishOptions
    ): Promise<PublishResult> {
        const connector = this.platforms.get(platform);

        if (!connector) {
            return {
                success: false,
                error: `Platform ${platform} is not configured`,
            };
        }

        if (!connector.isAuthenticated()) {
            return {
                success: false,
                error: `Not authenticated with ${platform}`,
            };
        }

        // Validate media before publishing
        const validation = connector.validateMedia(mediaType, options.aspectRatio || '1:1');
        if (!validation.valid) {
            return {
                success: false,
                error: `Media validation failed: ${validation.errors.join(', ')}`,
            };
        }

        return await connector.publish(mediaUrl, mediaType, options);
    }

    /**
     * Check if a platform is connected and authenticated
     */
    async isConnected(platform: SocialPlatform): Promise<boolean> {
        const connector = this.platforms.get(platform);
        if (!connector) return false;

        const status = await connector.getStatus();
        return status.connected;
    }

    /**
     * Get status for all platforms
     */
    async getAllStatuses(): Promise<Map<SocialPlatform, any>> {
        const statuses = new Map();

        for (const [platform, connector] of this.platforms.entries()) {
            const status = await connector.getStatus();
            statuses.set(platform, status);
        }

        return statuses;
    }

    /**
     * Get OAuth authorization URL for a platform
     */
    async getAuthUrl(platform: SocialPlatform, redirectUri: string): Promise<string | null> {
        const connector = this.platforms.get(platform);
        if (!connector) return null;
        const url = connector.getAuthUrl(redirectUri);
        return url instanceof Promise ? await url : url;
    }

    /**
     * Handle OAuth callback
     */
    async handleAuthCallback(
        platform: SocialPlatform,
        authCode: string
    ): Promise<boolean> {
        const connector = this.platforms.get(platform);
        if (!connector) return false;

        try {
            await connector.authenticate(authCode);
            return true;
        } catch (error) {
            console.error(`Authentication failed for ${platform}:`, error);
            return false;
        }
    }
}

// Export singleton instance
export const platformManager = new PlatformManager();

// Helper function to publish to multiple platforms
export async function publishToMultiplePlatforms(
    platforms: SocialPlatform[],
    mediaUrl: string,
    mediaType: 'image' | 'video',
    options: PublishOptions
): Promise<Map<SocialPlatform, PublishResult>> {
    const results = new Map<SocialPlatform, PublishResult>();

    await Promise.all(
        platforms.map(async (platform) => {
            const result = await platformManager.publish(
                platform,
                mediaUrl,
                mediaType,
                options
            );
            results.set(platform, result);
        })
    );

    return results;
}

