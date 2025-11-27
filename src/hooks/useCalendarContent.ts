
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { PlatformType } from '@/types';

// Types for calendar content from socialsync
export interface CalendarContent {
  id: string;
  title: string;
  body: string;
  platforms: PlatformType[];
  status: 'queued' | 'scheduled' | 'published' | 'failed';
  scheduledFor?: Date;
  publishedAt?: Date;
  mediaUrls?: string[];
  hashtags?: string[];
  assetId?: string;
  assetUrl?: string;
  prompt?: string;
  createdAt: Date;
}

// Map database platform names to PlatformType
function mapPlatformType(platform: string): PlatformType {
  const mapping: Record<string, PlatformType> = {
    'instagram': 'instagram',
    'linkedin': 'linkedin',
    'twitter': 'twitter',
    'facebook': 'facebook',
    'tiktok': 'tiktok',
    'youtube': 'youtube',
  };
  return mapping[platform.toLowerCase()] || 'instagram';
}

// Mock data for when Supabase is not configured
const mockCalendarContent: CalendarContent[] = [
  {
    id: 'mock-1',
    title: 'Community Event Promo',
    body: 'Join us for our monthly gathering celebrating Black queer joy!',
    platforms: ['instagram', 'twitter'],
    status: 'scheduled',
    scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    mediaUrls: [],
    hashtags: ['#BLKOUTStories', '#BlackQueerJoy'],
    createdAt: new Date(),
  },
  {
    id: 'mock-2',
    title: 'Weekly Newsletter Feature',
    body: 'Highlighting community voices and stories of resistance.',
    platforms: ['linkedin', 'facebook'],
    status: 'scheduled',
    scheduledFor: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    mediaUrls: [],
    hashtags: ['#CommunityPower', '#BlackQueerUK'],
    createdAt: new Date(),
  },
];

export function useCalendarContent() {
  const [content, setContent] = useState<CalendarContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // If Supabase is not configured, use mock data
      if (!isSupabaseConfigured()) {
        console.log('📦 Using mock calendar content data');
        setContent(mockCalendarContent);
        setIsLoading(false);
        return;
      }

      // Fetch from socialsync_media_queue with joined asset data
      const { data: queueData, error: queueError } = await supabase
        .from('socialsync_media_queue')
        .select(`
          id,
          platform,
          status,
          scheduled_for,
          published_at,
          caption,
          hashtags,
          created_at,
          asset_id,
          socialsync_generated_assets (
            id,
            url,
            prompt,
            media_type
          )
        `)
        .order('scheduled_for', { ascending: true, nullsFirst: false });

      if (queueError) {
        console.error('Error fetching queue:', queueError);
        // Try without join if it fails
        const { data: simpleData, error: simpleError } = await supabase
          .from('socialsync_media_queue')
          .select('*')
          .order('scheduled_for', { ascending: true, nullsFirst: false });

        if (simpleError) throw simpleError;

        // Transform simple data
        const transformed: CalendarContent[] = (simpleData || []).map((item: any) => ({
          id: item.id,
          title: item.caption?.substring(0, 50) || 'Scheduled Post',
          body: item.caption || '',
          platforms: [mapPlatformType(item.platform)],
          status: item.status as CalendarContent['status'],
          scheduledFor: item.scheduled_for ? new Date(item.scheduled_for) : undefined,
          publishedAt: item.published_at ? new Date(item.published_at) : undefined,
          hashtags: item.hashtags || [],
          assetId: item.asset_id,
          createdAt: new Date(item.created_at),
        }));

        setContent(transformed);
        return;
      }

      // Transform data to CalendarContent format
      const transformed: CalendarContent[] = (queueData || []).map((item: any) => ({
        id: item.id,
        title: item.caption?.substring(0, 50) || 'Scheduled Post',
        body: item.caption || '',
        platforms: [mapPlatformType(item.platform)],
        status: item.status as CalendarContent['status'],
        scheduledFor: item.scheduled_for ? new Date(item.scheduled_for) : undefined,
        publishedAt: item.published_at ? new Date(item.published_at) : undefined,
        hashtags: item.hashtags || [],
        assetId: item.asset_id,
        assetUrl: item.socialsync_generated_assets?.url,
        prompt: item.socialsync_generated_assets?.prompt,
        createdAt: new Date(item.created_at),
      }));

      // Also fetch from content_calendar table if it has entries
      const { data: calendarData } = await supabase
        .from('content_calendar')
        .select(`
          id,
          title,
          primary_content,
          status,
          scheduled_for,
          published_at,
          media_urls,
          hashtags,
          platform_id,
          created_at,
          platforms (
            slug
          )
        `)
        .order('scheduled_for', { ascending: true, nullsFirst: false });

      if (calendarData && calendarData.length > 0) {
        const calendarTransformed: CalendarContent[] = calendarData.map((item: any) => ({
          id: item.id,
          title: item.title || 'Calendar Entry',
          body: item.primary_content || '',
          platforms: [mapPlatformType(item.platforms?.slug || 'instagram')],
          status: (item.status === 'published' ? 'published' :
                  item.status === 'scheduled' ? 'scheduled' : 'queued') as CalendarContent['status'],
          scheduledFor: item.scheduled_for ? new Date(item.scheduled_for) : undefined,
          publishedAt: item.published_at ? new Date(item.published_at) : undefined,
          mediaUrls: item.media_urls || [],
          hashtags: item.hashtags || [],
          createdAt: new Date(item.created_at),
        }));

        // Combine both sources
        setContent([...transformed, ...calendarTransformed]);
      } else {
        setContent(transformed);
      }

    } catch (err) {
      console.error('Error fetching calendar content:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar content');
      // Fallback to mock data on error
      setContent(mockCalendarContent);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const subscription = supabase
      .channel('calendar_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'socialsync_media_queue',
        },
        () => {
          fetchContent();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_calendar',
        },
        () => {
          fetchContent();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchContent]);

  const refetch = () => {
    fetchContent();
  };

  return { content, isLoading, error, refetch };
}

// Function to schedule an asset to the media queue
export async function scheduleAssetToQueue(params: {
  assetId: string;
  platform: PlatformType;
  caption: string;
  hashtags: string[];
  scheduledFor: Date;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    console.log('📦 Mock: Scheduling asset', params);
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('socialsync_media_queue')
      .insert({
        asset_id: params.assetId,
        platform: params.platform,
        caption: params.caption,
        hashtags: params.hashtags,
        scheduled_for: params.scheduledFor.toISOString(),
        status: 'scheduled',
      });

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('Error scheduling asset:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to schedule asset'
    };
  }
}

// Function to update a scheduled post
export async function updateScheduledPost(
  id: string,
  updates: Partial<{
    caption: string;
    hashtags: string[];
    scheduledFor: Date;
    status: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    console.log('📦 Mock: Updating scheduled post', { id, updates });
    return { success: true };
  }

  try {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.caption !== undefined) updateData.caption = updates.caption;
    if (updates.hashtags !== undefined) updateData.hashtags = updates.hashtags;
    if (updates.scheduledFor !== undefined) updateData.scheduled_for = updates.scheduledFor.toISOString();
    if (updates.status !== undefined) updateData.status = updates.status;

    const { error } = await supabase
      .from('socialsync_media_queue')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('Error updating scheduled post:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update scheduled post'
    };
  }
}

// Function to delete a scheduled post
export async function deleteScheduledPost(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    console.log('📦 Mock: Deleting scheduled post', id);
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('socialsync_media_queue')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('Error deleting scheduled post:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete scheduled post'
    };
  }
}
