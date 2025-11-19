
/**
 * BLKOUT UK Communications System
 * Announcements Type Definitions
 */

export type AnnouncementCategory = 'event' | 'update' | 'campaign' | 'urgent';

export type AnnouncementStatus = 'draft' | 'published' | 'archived';

/**
 * Full announcement object from database
 */
export interface AnnouncementDB {
  id: string;
  title: string;
  excerpt: string;
  content: string | null;
  category: AnnouncementCategory;
  link: string | null;
  status: AnnouncementStatus;
  author_id: string | null;
  author_name: string | null;
  priority: number;
  display_date: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  view_count: number;
  deleted_at: string | null;
}

/**
 * Announcement object for display in components
 */
export interface Announcement {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: AnnouncementCategory;
  link?: string;
  content?: string;
  authorName?: string;
  viewCount?: number;
}

/**
 * Helper to convert database announcement to display announcement
 */
export function convertAnnouncementFromDB(dbAnnouncement: AnnouncementDB): Announcement {
  return {
    id: dbAnnouncement.id,
    title: dbAnnouncement.title,
    excerpt: dbAnnouncement.excerpt,
    date: dbAnnouncement.display_date,
    category: dbAnnouncement.category,
    link: dbAnnouncement.link || undefined,
    content: dbAnnouncement.content || undefined,
    authorName: dbAnnouncement.author_name || undefined,
    viewCount: dbAnnouncement.view_count,
  };
}
