
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type SubscriberTier = 'weekly_engaged' | 'monthly_circle';
export type EditionStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled';

export interface NewsletterSubscriber {
  id: string;
  memberId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  tier: SubscriberTier;
  sendfoxContactId: number | null;
  isActive: boolean;
  subscribedAt: Date;
  lastEngagement: Date | null;
  engagementScore: number;
}

export interface NewsletterContentItem {
  id: string;
  editionId: string;
  contentType: 'article' | 'event' | 'spotlight' | 'governance' | 'resource' | 'announcement';
  title: string;
  summary: string;
  linkUrl: string | null;
  imageUrl: string | null;
  displayOrder: number;
  sourceIntelligenceId: string | null;
}

export interface NewsletterEdition {
  id: string;
  editionNumber: number;
  subscriberTier: SubscriberTier;
  subject: string;
  preheaderText: string | null;
  status: EditionStatus;
  htmlContent: string | null;
  scheduledFor: Date | null;
  sentAt: Date | null;
  openRate: number | null;
  clickRate: number | null;
  unsubscribes: number;
  createdAt: Date;
  updatedAt: Date;
  contentItems: NewsletterContentItem[];
}

// Mock data for development
const mockEditions: NewsletterEdition[] = [
  {
    id: 'mock-edition-1',
    editionNumber: 1,
    subscriberTier: 'weekly_engaged',
    subject: 'This Week at BLKOUT: Community Updates & Events',
    preheaderText: 'New governance proposals, upcoming events, and member spotlights',
    status: 'draft',
    htmlContent: null,
    scheduledFor: null,
    sentAt: null,
    openRate: null,
    clickRate: null,
    unsubscribes: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    contentItems: [],
  },
];

const mockSubscribers: NewsletterSubscriber[] = [
  {
    id: 'mock-sub-1',
    memberId: null,
    email: 'engaged@example.com',
    firstName: 'Test',
    lastName: 'Subscriber',
    tier: 'weekly_engaged',
    sendfoxContactId: null,
    isActive: true,
    subscribedAt: new Date(),
    lastEngagement: new Date(),
    engagementScore: 85,
  },
];

export function useNewsletter() {
  const [editions, setEditions] = useState<NewsletterEdition[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEditions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isSupabaseConfigured()) {
        console.log('📦 Using mock newsletter data');
        setEditions(mockEditions);
        setSubscribers(mockSubscribers);
        setIsLoading(false);
        return;
      }

      // Fetch editions with content items
      const { data: editionData, error: editionError } = await supabase
        .from('newsletter_editions')
        .select(`
          *,
          newsletter_content_items (*)
        `)
        .order('created_at', { ascending: false });

      if (editionError) throw editionError;

      const transformed: NewsletterEdition[] = (editionData || []).map((row: any) => ({
        id: row.id,
        editionNumber: row.edition_number,
        subscriberTier: row.subscriber_tier,
        subject: row.subject,
        preheaderText: row.preheader_text,
        status: row.status,
        htmlContent: row.html_content,
        scheduledFor: row.scheduled_for ? new Date(row.scheduled_for) : null,
        sentAt: row.sent_at ? new Date(row.sent_at) : null,
        openRate: row.open_rate,
        clickRate: row.click_rate,
        unsubscribes: row.unsubscribes || 0,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        contentItems: (row.newsletter_content_items || []).map((item: any) => ({
          id: item.id,
          editionId: item.edition_id,
          contentType: item.content_type,
          title: item.title,
          summary: item.summary,
          linkUrl: item.link_url,
          imageUrl: item.image_url,
          displayOrder: item.display_order,
          sourceIntelligenceId: item.source_intelligence_id,
        })),
      }));

      setEditions(transformed);

      // Fetch subscriber counts
      const { data: subData } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('is_active', true);

      if (subData) {
        setSubscribers(subData.map((row: any) => ({
          id: row.id,
          memberId: row.member_id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          tier: row.tier,
          sendfoxContactId: row.sendfox_contact_id,
          isActive: row.is_active,
          subscribedAt: new Date(row.subscribed_at),
          lastEngagement: row.last_engagement ? new Date(row.last_engagement) : null,
          engagementScore: row.engagement_score || 0,
        })));
      }

    } catch (err) {
      console.error('Error fetching newsletters:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch newsletters');
      setEditions(mockEditions);
      setSubscribers(mockSubscribers);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEditions();
  }, [fetchEditions]);

  const createEdition = async (
    tier: SubscriberTier,
    subject: string,
    preheaderText?: string
  ): Promise<{ success: boolean; edition?: NewsletterEdition; error?: string }> => {
    if (!isSupabaseConfigured()) {
      const newEdition: NewsletterEdition = {
        id: `mock-${Date.now()}`,
        editionNumber: editions.length + 1,
        subscriberTier: tier,
        subject,
        preheaderText: preheaderText || null,
        status: 'draft',
        htmlContent: null,
        scheduledFor: null,
        sentAt: null,
        openRate: null,
        clickRate: null,
        unsubscribes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        contentItems: [],
      };
      setEditions([newEdition, ...editions]);
      return { success: true, edition: newEdition };
    }

    try {
      // Get next edition number
      const { data: numberData } = await supabase.rpc('get_next_edition_number', {
        p_tier: tier,
      });

      const { data, error } = await supabase
        .from('newsletter_editions')
        .insert({
          edition_number: numberData || 1,
          subscriber_tier: tier,
          subject,
          preheader_text: preheaderText,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      const newEdition: NewsletterEdition = {
        id: data.id,
        editionNumber: data.edition_number,
        subscriberTier: data.subscriber_tier,
        subject: data.subject,
        preheaderText: data.preheader_text,
        status: data.status,
        htmlContent: null,
        scheduledFor: null,
        sentAt: null,
        openRate: null,
        clickRate: null,
        unsubscribes: 0,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        contentItems: [],
      };

      setEditions([newEdition, ...editions]);
      return { success: true, edition: newEdition };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create edition' };
    }
  };

  const updateEdition = async (
    editionId: string,
    updates: Partial<Pick<NewsletterEdition, 'subject' | 'preheaderText' | 'htmlContent' | 'status' | 'scheduledFor'>>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      setEditions(editions.map(e =>
        e.id === editionId ? { ...e, ...updates, updatedAt: new Date() } : e
      ));
      return { success: true };
    }

    try {
      const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
      if (updates.preheaderText !== undefined) dbUpdates.preheader_text = updates.preheaderText;
      if (updates.htmlContent !== undefined) dbUpdates.html_content = updates.htmlContent;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.scheduledFor !== undefined) dbUpdates.scheduled_for = updates.scheduledFor?.toISOString();

      const { error } = await supabase
        .from('newsletter_editions')
        .update(dbUpdates)
        .eq('id', editionId);

      if (error) throw error;

      await fetchEditions();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update edition' };
    }
  };

  const addContentItem = async (
    editionId: string,
    item: Omit<NewsletterContentItem, 'id' | 'editionId'>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      const newItem: NewsletterContentItem = {
        id: `mock-item-${Date.now()}`,
        editionId,
        ...item,
      };
      setEditions(editions.map(e =>
        e.id === editionId
          ? { ...e, contentItems: [...e.contentItems, newItem] }
          : e
      ));
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('newsletter_content_items')
        .insert({
          edition_id: editionId,
          content_type: item.contentType,
          title: item.title,
          summary: item.summary,
          link_url: item.linkUrl,
          image_url: item.imageUrl,
          display_order: item.displayOrder,
          source_intelligence_id: item.sourceIntelligenceId,
        });

      if (error) throw error;

      await fetchEditions();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add content item' };
    }
  };

  const removeContentItem = async (itemId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      setEditions(editions.map(e => ({
        ...e,
        contentItems: e.contentItems.filter(i => i.id !== itemId),
      })));
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('newsletter_content_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await fetchEditions();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to remove content item' };
    }
  };

  // Get subscriber counts by tier
  const subscriberCounts = {
    weeklyEngaged: subscribers.filter(s => s.tier === 'weekly_engaged').length,
    monthlyCircle: subscribers.filter(s => s.tier === 'monthly_circle').length,
    total: subscribers.length,
  };

  // Get editions by status
  const draftEditions = editions.filter(e => e.status === 'draft');
  const sentEditions = editions.filter(e => e.status === 'sent');

  return {
    editions,
    subscribers,
    subscriberCounts,
    draftEditions,
    sentEditions,
    isLoading,
    error,
    refetch: fetchEditions,
    createEdition,
    updateEdition,
    addContentItem,
    removeContentItem,
  };
}
