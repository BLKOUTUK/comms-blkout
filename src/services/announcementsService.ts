
/**
 * BLKOUT UK Communications System
 * Announcements Service
 * 
 * Service layer for fetching and managing announcements from Supabase
 */

import { supabase, isSupabaseConfigured, handleSupabaseError } from '../lib/supabase';
import type { AnnouncementDB, Announcement } from '../types/announcements';
import { convertAnnouncementFromDB } from '../types/announcements';

/**
 * Fetch published announcements for public display
 * @param limit - Maximum number of announcements to fetch (default: 10)
 * @returns Array of published announcements sorted by priority and date
 */
export async function fetchPublishedAnnouncements(
  limit: number = 10
): Promise<{ data: Announcement[] | null; error: string | null }> {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: 'Supabase is not configured. Please set up your environment variables.',
      };
    }

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('priority', { ascending: false })
      .order('display_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching announcements:', error);
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    // Convert database format to display format
    const announcements = data?.map((dbAnnouncement) =>
      convertAnnouncementFromDB(dbAnnouncement as AnnouncementDB)
    ) || [];

    return {
      data: announcements,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching announcements:', error);
    return {
      data: null,
      error: handleSupabaseError(error),
    };
  }
}

/**
 * Fetch announcements by category
 * @param category - The category to filter by
 * @param limit - Maximum number of announcements to fetch
 */
export async function fetchAnnouncementsByCategory(
  category: string,
  limit: number = 10
): Promise<{ data: Announcement[] | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: 'Supabase is not configured',
      };
    }

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'published')
      .eq('category', category)
      .is('deleted_at', null)
      .order('priority', { ascending: false })
      .order('display_date', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    const announcements = data?.map((dbAnnouncement) =>
      convertAnnouncementFromDB(dbAnnouncement as AnnouncementDB)
    ) || [];

    return {
      data: announcements,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: handleSupabaseError(error),
    };
  }
}

/**
 * Increment view count for an announcement
 * @param announcementId - The ID of the announcement to increment
 */
export async function incrementAnnouncementViews(
  announcementId: string
): Promise<{ error: string | null }> {
  try {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase is not configured' };
    }

    const { error } = await supabase.rpc('increment_announcement_views', {
      announcement_id: announcementId,
    });

    if (error) {
      console.error('Error incrementing views:', error);
      return { error: handleSupabaseError(error) };
    }

    return { error: null };
  } catch (error) {
    return { error: handleSupabaseError(error) };
  }
}

/**
 * Fetch all announcements (admin view - includes drafts)
 * @param limit - Maximum number of announcements to fetch
 */
export async function fetchAllAnnouncements(
  limit: number = 50
): Promise<{ data: Announcement[] | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: 'Supabase is not configured',
      };
    }

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      };
    }

    const announcements = data?.map((dbAnnouncement) =>
      convertAnnouncementFromDB(dbAnnouncement as AnnouncementDB)
    ) || [];

    return {
      data: announcements,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: handleSupabaseError(error),
    };
  }
}

/**
 * Mock announcements for fallback when Supabase is not configured
 */
export const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'New Community Hub Features',
    excerpt: 'BLKOUT HUB now includes member forums, resource library, and cooperative decision-making tools.',
    date: '2024-03-15',
    category: 'update',
    link: 'https://blkouthub.com',
  },
  {
    id: '2',
    title: 'Black Queer Liberation Summit 2024',
    excerpt: 'Join us for our annual gathering bringing together activists, artists, and organizers across the UK.',
    date: '2024-04-20',
    category: 'event',
  },
  {
    id: '3',
    title: 'Media Sovereignty Workshop Series',
    excerpt: 'Learn to create liberatory content and build community power through storytelling.',
    date: '2024-03-22',
    category: 'campaign',
  },
];
