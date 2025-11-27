
import { useState, useCallback } from 'react';
import { platformManager } from '@/services/socialsync/platforms';
import { SocialPlatform } from '@/types/socialsync';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface SocialConnection {
  platform: SocialPlatform;
  isConnected: boolean;
  isConfigured: boolean;
  accountName?: string;
  accountId?: string;
  lastSync?: Date;
  error?: string;
}

interface UseSocialConnectReturn {
  connections: Map<SocialPlatform, SocialConnection>;
  isLoading: boolean;
  error: string | null;
  initiateConnect: (platform: SocialPlatform) => void;
  handleCallback: (platform: SocialPlatform, code: string) => Promise<boolean>;
  disconnect: (platform: SocialPlatform) => Promise<void>;
  refreshStatus: () => Promise<void>;
}

// Check which platforms have credentials configured in environment
function checkPlatformConfiguration(): Map<SocialPlatform, boolean> {
  const config = new Map<SocialPlatform, boolean>();

  // Instagram - primary platform, fully implemented
  config.set(
    SocialPlatform.INSTAGRAM,
    !!(import.meta.env.VITE_INSTAGRAM_CLIENT_ID && import.meta.env.VITE_INSTAGRAM_CLIENT_SECRET)
  );

  // TikTok - implemented
  config.set(
    SocialPlatform.TIKTOK,
    !!(import.meta.env.VITE_TIKTOK_CLIENT_KEY && import.meta.env.VITE_TIKTOK_CLIENT_SECRET)
  );

  // YouTube - check for Google/YouTube credentials
  config.set(
    SocialPlatform.YOUTUBE,
    !!(import.meta.env.VITE_YOUTUBE_CLIENT_ID && import.meta.env.VITE_YOUTUBE_CLIENT_SECRET)
  );

  // LinkedIn and Twitter - not yet implemented
  config.set(SocialPlatform.LINKEDIN, false);
  config.set(SocialPlatform.TWITTER, false);

  return config;
}

export function useSocialConnect(): UseSocialConnectReturn {
  const [connections, setConnections] = useState<Map<SocialPlatform, SocialConnection>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const configuredPlatforms = checkPlatformConfiguration();
      const newConnections = new Map<SocialPlatform, SocialConnection>();

      // Get status for all platforms
      const allPlatforms = [
        SocialPlatform.INSTAGRAM,
        SocialPlatform.TIKTOK,
        SocialPlatform.LINKEDIN,
        SocialPlatform.TWITTER,
      ];

      for (const platform of allPlatforms) {
        const isConfigured = configuredPlatforms.get(platform) || false;
        let connection: SocialConnection = {
          platform,
          isConnected: false,
          isConfigured,
        };

        if (isConfigured) {
          // Check actual connection status from platform manager
          const connector = platformManager.getPlatform(platform);
          if (connector) {
            try {
              const status = await connector.getStatus();
              connection = {
                ...connection,
                isConnected: status.connected,
                accountName: status.accountName,
                accountId: status.accountId,
                lastSync: status.lastSync,
                error: status.error,
              };
            } catch (err) {
              connection.error = err instanceof Error ? err.message : 'Failed to get status';
            }
          }
        }

        // Also check database for stored credentials
        if (isSupabaseConfigured()) {
          try {
            const { data } = await supabase
              .from('socialsync_platform_connections')
              .select('*')
              .eq('platform', platform)
              .single();

            if (data && data.access_token) {
              connection.isConnected = true;
              connection.accountName = data.account_name;
              connection.accountId = data.account_id;
              connection.lastSync = data.last_sync ? new Date(data.last_sync) : undefined;
            }
          } catch {
            // No stored connection - that's fine
          }
        }

        newConnections.set(platform, connection);
      }

      setConnections(newConnections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh platform status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initiateConnect = useCallback((platform: SocialPlatform) => {
    const redirectUri = `${window.location.origin}/auth/callback/${platform.toLowerCase().replace(/[^a-z]/g, '')}`;
    const authUrl = platformManager.getAuthUrl(platform, redirectUri);

    if (!authUrl) {
      setError(`Platform ${platform} is not configured. Please add API credentials to .env file.`);
      return;
    }

    // Store the platform we're connecting in sessionStorage for the callback
    sessionStorage.setItem('connecting_platform', platform);

    // Open OAuth popup or redirect
    const popup = window.open(
      authUrl,
      'social_connect',
      'width=600,height=700,scrollbars=yes'
    );

    if (!popup || popup.closed) {
      // Fallback to redirect if popup blocked
      window.location.href = authUrl;
    }
  }, []);

  const handleCallback = useCallback(async (platform: SocialPlatform, code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await platformManager.handleAuthCallback(platform, code);

      if (success) {
        // Get the account details
        const connector = platformManager.getPlatform(platform);
        if (connector) {
          const status = await connector.getStatus();

          // Store credentials in database
          if (isSupabaseConfigured()) {
            await supabase
              .from('socialsync_platform_connections')
              .upsert({
                platform,
                account_name: status.accountName,
                account_id: status.accountId,
                is_connected: true,
                connected_at: new Date().toISOString(),
                last_sync: new Date().toISOString(),
              });
          }

          // Update local state
          setConnections((prev) => {
            const updated = new Map(prev);
            updated.set(platform, {
              platform,
              isConnected: true,
              isConfigured: true,
              accountName: status.accountName,
              accountId: status.accountId,
              lastSync: new Date(),
            });
            return updated;
          });
        }

        return true;
      }

      setError('Failed to authenticate with platform');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async (platform: SocialPlatform) => {
    setIsLoading(true);
    setError(null);

    try {
      // Remove from database
      if (isSupabaseConfigured()) {
        await supabase
          .from('socialsync_platform_connections')
          .delete()
          .eq('platform', platform);
      }

      // Update local state
      setConnections((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(platform);
        if (existing) {
          updated.set(platform, {
            ...existing,
            isConnected: false,
            accountName: undefined,
            accountId: undefined,
            lastSync: undefined,
          });
        }
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    connections,
    isLoading,
    error,
    initiateConnect,
    handleCallback,
    disconnect,
    refreshStatus,
  };
}
