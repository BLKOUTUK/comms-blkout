import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// The newsletter editions, read from public.newsletter_editions.
//
// Rewritten 10 September 2026. Two things were wrong with the version before it, and both
// were silent — nothing errored on screen, the page just showed less than it claimed to:
//
// 1. It mapped five columns that do not exist on the table. `subject`, `subscriber_tier`,
//    `preheader_text` and `unsubscribes` are really `subject_line`, `edition_type`,
//    `preview_text` and `unsubscribe_count`. Every edition heading therefore rendered
//    empty, every edition read as "Monthly" whatever it was, and creating or editing an
//    edition wrote columns Postgres rejects. `get_next_edition_number` was called with
//    `p_tier` when its parameter is `p_edition_type`, so New Edition could not work either.
// 2. It read `newsletter_subscribers`, a table with zero rows, to draw a subscriber-tiers
//    panel. SendFox holds the list; that panel could only ever show 0. The table was
//    dropped on 10 September 2026 (crm migration 020_drop_orphan_tables.sql).
//
// The tier vocabulary ('weekly_engaged' / 'monthly_circle') went with the panel. The table
// has only ever had `edition_type`, which is what the Herald API and SendFox both take.

export type EditionType = 'weekly' | 'monthly';

/** The statuses actually present in the table, plus the two the writes here can set. */
export type EditionStatus = 'draft' | 'approved' | 'scheduled' | 'sent' | 'cancelled';

export interface NewsletterEdition {
  id: string;
  editionNumber: number;
  editionType: EditionType;
  /** The edition's name, e.g. "BLKOUT September 2026 — Thank you for making it real". */
  title: string;
  /** What lands in an inbox. Often shorter than the title, and deliberately different. */
  subjectLine: string;
  previewText: string | null;
  status: EditionStatus | string;
  htmlContent: string | null;
  scheduledFor: Date | null;
  sentAt: Date | null;
  openRate: number | null;
  clickRate: number | null;
  unsubscribes: number;
  createdAt: Date;
  updatedAt: Date;
  /** Rows in newsletter_content_items for this edition. Only the count is shown. */
  contentItemCount: number;
}

export type EditionUpdates = Partial<
  Pick<NewsletterEdition, 'title' | 'subjectLine' | 'previewText' | 'htmlContent' | 'status' | 'scheduledFor'>
>;

export function useNewsletter() {
  const [editions, setEditions] = useState<NewsletterEdition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEditions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isSupabaseConfigured()) {
        setEditions([]);
        setError('Database not configured');
        setIsLoading(false);
        return;
      }

      const { data, error: editionError } = await supabase
        .from('newsletter_editions')
        .select('*, newsletter_content_items (id)')
        .order('created_at', { ascending: false });

      if (editionError) throw editionError;

      const transformed: NewsletterEdition[] = (data || []).map((row: any) => ({
        id: row.id,
        editionNumber: row.edition_number,
        editionType: row.edition_type === 'weekly' ? 'weekly' : 'monthly',
        title: row.title,
        subjectLine: row.subject_line,
        previewText: row.preview_text,
        status: row.status,
        htmlContent: row.html_content,
        scheduledFor: row.scheduled_for ? new Date(row.scheduled_for) : null,
        sentAt: row.sent_at ? new Date(row.sent_at) : null,
        openRate: row.open_rate === null || row.open_rate === undefined ? null : Number(row.open_rate),
        clickRate: row.click_rate === null || row.click_rate === undefined ? null : Number(row.click_rate),
        unsubscribes: row.unsubscribe_count ?? 0,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        contentItemCount: (row.newsletter_content_items || []).length,
      }));

      setEditions(transformed);
    } catch (err) {
      console.error('Error fetching newsletters:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch newsletters');
      setEditions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEditions();
  }, [fetchEditions]);

  const createEdition = async (
    editionType: EditionType,
    title: string
  ): Promise<{ success: boolean; edition?: NewsletterEdition; error?: string }> => {
    if (!isSupabaseConfigured()) return { success: false, error: 'Database not configured' };

    try {
      // The numbering RPC is per edition_type, and its parameter is named for that.
      const { data: nextNumber, error: rpcError } = await supabase.rpc('get_next_edition_number', {
        p_edition_type: editionType,
      });
      if (rpcError) throw rpcError;

      const { data, error: insertError } = await supabase
        .from('newsletter_editions')
        .insert({
          edition_number: nextNumber,
          edition_type: editionType,
          title,
          subject_line: title,
          status: 'draft',
        })
        .select('*')
        .single();

      if (insertError) throw insertError;

      await fetchEditions();

      return {
        success: true,
        edition: {
          id: data.id,
          editionNumber: data.edition_number,
          editionType: data.edition_type === 'weekly' ? 'weekly' : 'monthly',
          title: data.title,
          subjectLine: data.subject_line,
          previewText: data.preview_text,
          status: data.status,
          htmlContent: data.html_content,
          scheduledFor: data.scheduled_for ? new Date(data.scheduled_for) : null,
          sentAt: null,
          openRate: null,
          clickRate: null,
          unsubscribes: 0,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          contentItemCount: 0,
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create edition' };
    }
  };

  const updateEdition = async (
    editionId: string,
    updates: EditionUpdates
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) return { success: false, error: 'Database not configured' };

    try {
      const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.subjectLine !== undefined) dbUpdates.subject_line = updates.subjectLine;
      if (updates.previewText !== undefined) dbUpdates.preview_text = updates.previewText;
      if (updates.htmlContent !== undefined) dbUpdates.html_content = updates.htmlContent;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.scheduledFor !== undefined) {
        dbUpdates.scheduled_for = updates.scheduledFor ? updates.scheduledFor.toISOString() : null;
      }

      const { error: updateError } = await supabase
        .from('newsletter_editions')
        .update(dbUpdates)
        .eq('id', editionId);

      if (updateError) throw updateError;

      await fetchEditions();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update edition' };
    }
  };

  const draftEditions = editions.filter((e) => e.status === 'draft');
  const sentEditions = editions.filter((e) => e.status === 'sent');

  return {
    editions,
    draftEditions,
    sentEditions,
    isLoading,
    error,
    refetch: fetchEditions,
    createEdition,
    updateEdition,
  };
}
