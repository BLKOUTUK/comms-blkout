/**
 * Content Fetchers
 * Fetch events, articles, and resources from Supabase
 */

import { supabase } from '../config.js';
import type { ContentItem } from '../types.js';

/**
 * Fetch upcoming events
 */
export async function fetchEvents(limit: number): Promise<ContentItem[]> {
  if (!supabase) return [];

  const now = new Date();
  const twoWeeksOut = new Date(now);
  twoWeeksOut.setDate(now.getDate() + 14);

  const { data, error } = await supabase
    .from('events')
    .select('id, title, description, date, start_time, location, url, relevance_score')
    .eq('status', 'approved')
    .gte('date', now.toISOString().split('T')[0])
    .lte('date', twoWeeksOut.toISOString().split('T')[0])
    .order('relevance_score', { ascending: false })
    .order('date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[Herald] Error fetching events:', error);
    return [];
  }

  return (data || []).map(e => ({
    id: e.id,
    type: 'event' as const,
    title: e.title,
    summary: e.description?.substring(0, 150) + (e.description?.length > 150 ? '...' : ''),
    date: e.date,
    url: e.url || `https://events.blkoutuk.com`,
    relevance_score: e.relevance_score
  }));
}

/**
 * Fetch recent articles/news
 */
export async function fetchArticles(limit: number): Promise<ContentItem[]> {
  if (!supabase) return [];

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('news_articles')
    .select('id, title, excerpt, featured_image, source_url, interest_score, published_at')
    .eq('status', 'published')
    .gte('published_at', oneWeekAgo.toISOString())
    .order('interest_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Herald] Error fetching articles:', error);
    return [];
  }

  return (data || []).map(a => ({
    id: a.id,
    type: 'article' as const,
    title: a.title,
    summary: a.excerpt,
    url: a.source_url,
    image_url: a.featured_image,
    relevance_score: a.interest_score
  }));
}

/**
 * Fetch community resources
 */
export async function fetchResources(limit: number): Promise<ContentItem[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('ivor_resources')
    .select('id, title, description, website_url, priority')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Herald] Error fetching resources:', error);
    return [];
  }

  return (data || []).map(r => ({
    id: r.id,
    type: 'resource' as const,
    title: r.title,
    summary: r.description?.substring(0, 150) + (r.description?.length > 150 ? '...' : ''),
    url: r.website_url,
    relevance_score: r.priority
  }));
}
