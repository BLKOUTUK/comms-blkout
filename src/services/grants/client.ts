/**
 * Grant Funding Management Client
 * Supabase client for BLKOUT grant tracking and automation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Grant,
  GrantReminder,
  UpcomingDeadline,
  GrantStatistics,
  CreateGrantInput,
  UpdateGrantInput,
  GrantStatus,
  Priority,
  ReminderType,
  // Opportunity Discovery types
  GrantOpportunity,
  CreateOpportunityInput,
  OpportunityPipeline,
  OpportunityStatus,
  // Bid Writing types
  BidWritingTemplate,
  BidDocument,
  CreateBidDocumentInput,
  BidWritingSession,
  GrantResearchNote,
  CreateResearchNoteInput,
  BidWritingProgress,
  TemplateAnalytics,
  FunderType,
  ProjectCategory,
  TemplateType,
  SessionType,
} from './types';

export class GrantsClient {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ==================== GRANTS ====================

  /**
   * Get all grants with optional filters
   */
  async getGrants(filters?: {
    status?: GrantStatus | GrantStatus[];
    priority?: Priority | Priority[];
    funderType?: string;
    tags?: string[];
  }): Promise<Grant[]> {
    let query = this.supabase
      .from('grants')
      .select('*')
      .is('deleted_at', null)
      .order('deadline_date', { ascending: true });

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      query = query.in('status', statuses);
    }

    if (filters?.priority) {
      const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
      query = query.in('priority', priorities);
    }

    if (filters?.funderType) {
      query = query.eq('funder_type', filters.funderType);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single grant by ID
   */
  async getGrant(id: string): Promise<Grant | null> {
    const { data, error } = await this.supabase
      .from('grants')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Create a new grant
   */
  async createGrant(input: CreateGrantInput): Promise<Grant> {
    const { data, error } = await this.supabase
      .from('grants')
      .insert({
        ...input,
        status: 'researching',
        priority: input.priority || 'medium',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing grant
   */
  async updateGrant(id: string, input: UpdateGrantInput): Promise<Grant> {
    const { data, error } = await this.supabase
      .from('grants')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update grant status with automatic timestamp updates
   */
  async updateGrantStatus(id: string, status: GrantStatus, notes?: string): Promise<Grant> {
    const updates: Partial<Grant> = { status };

    // Auto-set dates based on status transitions
    if (status === 'submitted') {
      updates.submission_date = new Date().toISOString();
    } else if (status === 'awarded' || status === 'declined') {
      updates.decision_actual_date = new Date().toISOString().split('T')[0];
    }

    if (notes) {
      updates.notes = notes;
    }

    return this.updateGrant(id, updates);
  }

  /**
   * Soft delete a grant
   */
  async deleteGrant(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('grants')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== DEADLINES ====================

  /**
   * Get upcoming grant deadlines with urgency indicators
   */
  async getUpcomingDeadlines(): Promise<UpcomingDeadline[]> {
    const { data, error } = await this.supabase
      .from('upcoming_grant_deadlines')
      .select('*');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get grants due within a specific number of days
   */
  async getGrantsDueWithin(days: number): Promise<Grant[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await this.supabase
      .from('grants')
      .select('*')
      .is('deleted_at', null)
      .in('status', ['researching', 'eligible', 'preparing'])
      .lte('deadline_date', futureDate.toISOString().split('T')[0])
      .gte('deadline_date', new Date().toISOString().split('T')[0])
      .order('deadline_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // ==================== REMINDERS ====================

  /**
   * Get pending reminders
   */
  async getPendingReminders(): Promise<(GrantReminder & { grant: Grant })[]> {
    const { data, error } = await this.supabase
      .from('grant_reminders')
      .select(`
        *,
        grant:grants(*)
      `)
      .eq('status', 'pending')
      .lte('reminder_date', new Date().toISOString().split('T')[0])
      .order('reminder_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all reminders for a grant
   */
  async getGrantReminders(grantId: string): Promise<GrantReminder[]> {
    const { data, error } = await this.supabase
      .from('grant_reminders')
      .select('*')
      .eq('grant_id', grantId)
      .order('reminder_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a custom reminder
   */
  async createReminder(
    grantId: string,
    reminderType: ReminderType,
    reminderDate: string,
    message: string,
    options?: {
      reminderTime?: string;
      notifyEmails?: string[];
      isRecurring?: boolean;
      recurrenceRule?: { frequency: 'daily' | 'weekly' | 'monthly'; until?: string };
    }
  ): Promise<GrantReminder> {
    const { data, error } = await this.supabase
      .from('grant_reminders')
      .insert({
        grant_id: grantId,
        reminder_type: reminderType,
        reminder_date: reminderDate,
        reminder_time: options?.reminderTime || '09:00',
        message,
        notify_email: options?.notifyEmails,
        is_recurring: options?.isRecurring || false,
        recurrence_rule: options?.recurrenceRule,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mark a reminder as sent
   */
  async markReminderSent(reminderId: string): Promise<void> {
    const { error } = await this.supabase
      .from('grant_reminders')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', reminderId);

    if (error) throw error;
  }

  /**
   * Snooze a reminder
   */
  async snoozeReminder(reminderId: string, snoozeDays: number): Promise<void> {
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + snoozeDays);

    const { error } = await this.supabase
      .from('grant_reminders')
      .update({
        status: 'snoozed',
        snoozed_until: snoozeUntil.toISOString().split('T')[0],
      })
      .eq('id', reminderId);

    if (error) throw error;
  }

  /**
   * Dismiss a reminder
   */
  async dismissReminder(reminderId: string): Promise<void> {
    const { error } = await this.supabase
      .from('grant_reminders')
      .update({ status: 'dismissed' })
      .eq('id', reminderId);

    if (error) throw error;
  }

  // ==================== STATISTICS ====================

  /**
   * Get grant statistics by status
   */
  async getStatistics(): Promise<GrantStatistics[]> {
    const { data, error } = await this.supabase
      .from('grant_statistics')
      .select('*');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get pipeline summary (total requested, awarded, success rate)
   */
  async getPipelineSummary(): Promise<{
    totalGrants: number;
    totalRequested: number;
    totalAwarded: number;
    successRate: number;
    activeApplications: number;
    upcomingDeadlines: number;
  }> {
    const [grants, deadlines] = await Promise.all([
      this.getGrants(),
      this.getUpcomingDeadlines(),
    ]);

    const totalRequested = grants.reduce((sum, g) => sum + (g.amount_requested || 0), 0);
    const totalAwarded = grants.reduce((sum, g) => sum + (g.amount_awarded || 0), 0);
    const awardedCount = grants.filter(g => g.status === 'awarded').length;
    const decidedCount = grants.filter(g => ['awarded', 'declined'].includes(g.status)).length;
    const activeApplications = grants.filter(g =>
      ['researching', 'eligible', 'preparing', 'submitted', 'under_review'].includes(g.status)
    ).length;

    return {
      totalGrants: grants.length,
      totalRequested,
      totalAwarded,
      successRate: decidedCount > 0 ? (awardedCount / decidedCount) * 100 : 0,
      activeApplications,
      upcomingDeadlines: deadlines.length,
    };
  }

  // ==================== SEARCH ====================

  /**
   * Search grants by title, funder, or notes
   */
  async searchGrants(query: string): Promise<Grant[]> {
    const { data, error } = await this.supabase
      .from('grants')
      .select('*')
      .is('deleted_at', null)
      .or(`title.ilike.%${query}%,funder_name.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('deadline_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // ==================== OPPORTUNITY DISCOVERY ====================

  /**
   * Get all grant opportunities with optional filters
   */
  async getOpportunities(filters?: {
    status?: OpportunityStatus | OpportunityStatus[];
    source?: string;
    projectCategory?: ProjectCategory;
    minFitScore?: number;
  }): Promise<GrantOpportunity[]> {
    let query = this.supabase
      .from('grant_opportunities')
      .select('*')
      .order('deadline_date', { ascending: true, nullsFirst: false });

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      query = query.in('status', statuses);
    }

    if (filters?.source) {
      query = query.eq('source', filters.source);
    }

    if (filters?.projectCategory) {
      query = query.eq('project_category', filters.projectCategory);
    }

    if (filters?.minFitScore) {
      query = query.gte('initial_fit_score', filters.minFitScore);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get opportunity pipeline with funder intelligence
   */
  async getOpportunityPipeline(): Promise<OpportunityPipeline[]> {
    const { data, error } = await this.supabase
      .from('opportunity_pipeline')
      .select('*');

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new grant opportunity
   */
  async createOpportunity(input: CreateOpportunityInput): Promise<GrantOpportunity> {
    const { data, error } = await this.supabase
      .from('grant_opportunities')
      .insert({
        ...input,
        status: 'new',
        discovered_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update opportunity status
   */
  async updateOpportunityStatus(
    id: string,
    status: OpportunityStatus,
    notes?: string
  ): Promise<GrantOpportunity> {
    const updates: Partial<GrantOpportunity> = { status };
    if (notes) {
      updates.research_notes = notes;
    }

    const { data, error } = await this.supabase
      .from('grant_opportunities')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Convert opportunity to full grant application
   */
  async convertOpportunityToGrant(
    opportunityId: string,
    grantInput: CreateGrantInput
  ): Promise<{ opportunity: GrantOpportunity; grant: Grant }> {
    // Create the grant
    const grant = await this.createGrant(grantInput);

    // Update opportunity status
    const { data: opportunity, error } = await this.supabase
      .from('grant_opportunities')
      .update({
        status: 'converted',
        converted_grant_id: grant.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', opportunityId)
      .select()
      .single();

    if (error) throw error;
    return { opportunity, grant };
  }

  /**
   * Add research note to opportunity
   */
  async addOpportunityNote(
    opportunityId: string,
    input: Omit<CreateResearchNoteInput, 'opportunity_id'>
  ): Promise<GrantResearchNote> {
    const { data, error } = await this.supabase
      .from('grant_research_notes')
      .insert({
        ...input,
        opportunity_id: opportunityId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== BID WRITING TEMPLATES ====================

  /**
   * Get all bid writing templates
   */
  async getTemplates(filters?: {
    funderType?: FunderType;
    projectCategory?: ProjectCategory;
    templateType?: TemplateType;
  }): Promise<BidWritingTemplate[]> {
    let query = this.supabase
      .from('bid_writing_templates')
      .select('*')
      .eq('is_active', true)
      .order('times_used', { ascending: false });

    if (filters?.funderType) {
      query = query.eq('funder_type', filters.funderType);
    }

    if (filters?.projectCategory) {
      query = query.eq('project_category', filters.projectCategory);
    }

    if (filters?.templateType) {
      query = query.eq('template_type', filters.templateType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string): Promise<BidWritingTemplate | null> {
    const { data, error } = await this.supabase
      .from('bid_writing_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Get recommended templates for a grant based on funder type
   */
  async getRecommendedTemplates(grantId: string): Promise<BidWritingTemplate[]> {
    const grant = await this.getGrant(grantId);
    if (!grant) return [];

    const { data, error } = await this.supabase
      .from('bid_writing_templates')
      .select('*')
      .eq('is_active', true)
      .or(`funder_type.eq.${grant.funder_type},funder_type.is.null`)
      .order('success_rate', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get template analytics
   */
  async getTemplateAnalytics(): Promise<TemplateAnalytics[]> {
    const { data, error } = await this.supabase
      .from('template_analytics')
      .select('*');

    if (error) throw error;
    return data || [];
  }

  // ==================== BID DOCUMENTS ====================

  /**
   * Get all documents for a grant
   */
  async getGrantDocuments(grantId: string): Promise<BidDocument[]> {
    const { data, error } = await this.supabase
      .from('bid_documents')
      .select('*')
      .eq('grant_id', grantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new bid document
   */
  async createBidDocument(input: CreateBidDocumentInput): Promise<BidDocument> {
    // If using a template, increment its usage count
    if (input.template_id) {
      try {
        await this.supabase.rpc('increment_template_usage', {
          template_id: input.template_id,
        });
      } catch {
        // Non-critical if this fails
      }
    }

    const { data, error } = await this.supabase
      .from('bid_documents')
      .insert({
        ...input,
        status: 'draft',
        version: 1,
        sections: [],
        review_comments: [],
        ai_suggestions: [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update document content
   */
  async updateDocumentContent(
    documentId: string,
    content: string,
    sections?: BidDocument['sections']
  ): Promise<BidDocument> {
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    const { data, error } = await this.supabase
      .from('bid_documents')
      .update({
        content,
        sections: sections || [],
        current_word_count: wordCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Submit document for review
   */
  async submitForReview(documentId: string, reviewer: string): Promise<BidDocument> {
    const { data, error } = await this.supabase
      .from('bid_documents')
      .update({
        status: 'in_review',
        reviewer,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Add review comment
   */
  async addReviewComment(
    documentId: string,
    comment: { section: string; comment: string; reviewer: string }
  ): Promise<BidDocument> {
    const doc = await this.supabase
      .from('bid_documents')
      .select('review_comments')
      .eq('id', documentId)
      .single();

    if (doc.error) throw doc.error;

    const comments = [...(doc.data.review_comments || []), {
      ...comment,
      resolved: false,
      date: new Date().toISOString(),
    }];

    const { data, error } = await this.supabase
      .from('bid_documents')
      .update({
        review_comments: comments,
        last_reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Approve document
   */
  async approveDocument(documentId: string): Promise<BidDocument> {
    const { data, error } = await this.supabase
      .from('bid_documents')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get bid writing progress for all active grants
   */
  async getBidWritingProgress(): Promise<BidWritingProgress[]> {
    const { data, error } = await this.supabase
      .from('bid_writing_progress')
      .select('*');

    if (error) throw error;
    return data || [];
  }

  // ==================== WRITING SESSIONS ====================

  /**
   * Start a writing session
   */
  async startWritingSession(
    grantId: string,
    sessionType: SessionType,
    options?: {
      documentId?: string;
      leadWriter?: string;
      collaborators?: string[];
    }
  ): Promise<BidWritingSession> {
    const { data, error } = await this.supabase
      .from('bid_writing_sessions')
      .insert({
        grant_id: grantId,
        document_id: options?.documentId,
        session_type: sessionType,
        lead_writer: options?.leadWriter,
        collaborators: options?.collaborators || [],
        sections_worked: [],
        changes_made: [],
        ai_prompts: [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * End a writing session
   */
  async endWritingSession(
    sessionId: string,
    metrics: {
      wordsWritten?: number;
      wordsEdited?: number;
      timeSpentMinutes?: number;
      sectionsWorked?: string[];
      notes?: string;
    }
  ): Promise<BidWritingSession> {
    const { data, error } = await this.supabase
      .from('bid_writing_sessions')
      .update({
        ended_at: new Date().toISOString(),
        words_written: metrics.wordsWritten || 0,
        words_edited: metrics.wordsEdited || 0,
        time_spent_minutes: metrics.timeSpentMinutes,
        sections_worked: metrics.sectionsWorked || [],
        notes: metrics.notes,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Log AI assistance in session
   */
  async logAIAssistance(
    sessionId: string,
    prompt: string,
    response: string,
    accepted?: boolean
  ): Promise<void> {
    const session = await this.supabase
      .from('bid_writing_sessions')
      .select('ai_prompts')
      .eq('id', sessionId)
      .single();

    if (session.error) throw session.error;

    const prompts = [...(session.data.ai_prompts || []), {
      prompt,
      response,
      accepted,
    }];

    const { error } = await this.supabase
      .from('bid_writing_sessions')
      .update({ ai_prompts: prompts })
      .eq('id', sessionId);

    if (error) throw error;
  }

  // ==================== RESEARCH NOTES ====================

  /**
   * Get research notes for a grant
   */
  async getGrantResearchNotes(grantId: string): Promise<GrantResearchNote[]> {
    const { data, error } = await this.supabase
      .from('grant_research_notes')
      .select('*')
      .eq('grant_id', grantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a research note
   */
  async createResearchNote(input: CreateResearchNoteInput): Promise<GrantResearchNote> {
    const { data, error } = await this.supabase
      .from('grant_research_notes')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get critical research notes across all grants
   */
  async getCriticalNotes(): Promise<GrantResearchNote[]> {
    const { data, error } = await this.supabase
      .from('grant_research_notes')
      .select('*')
      .eq('is_critical', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

// Default instance using environment variables
export function createGrantsClient(): GrantsClient {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return new GrantsClient(supabaseUrl, supabaseKey);
}
