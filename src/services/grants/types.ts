/**
 * Grant Funding Management Types
 * For BLKOUT fundraising automation
 */

export type GrantStatus =
  | 'researching'
  | 'eligible'
  | 'preparing'
  | 'submitted'
  | 'under_review'
  | 'additional_info'
  | 'awarded'
  | 'declined'
  | 'withdrawn'
  | 'reporting'
  | 'completed';

export type FunderType = 'foundation' | 'government' | 'corporate' | 'lottery' | 'trust' | 'individual' | 'other';

export type ScalingTier = 'seed' | 'growth' | 'scale' | 'transformation';

export type GeographicScope = 'local' | 'city' | 'regional' | 'national' | 'uk_wide';

export type ReviewRequired = 'full_external' | 'peer' | 'self' | 'none';

export type CompetitionLevel = 'low' | 'medium' | 'high' | 'very_high';

export type BidClassification = 'critical' | 'high' | 'medium' | 'low';

export interface BlkoutPriorityAlignment {
  liberation: number; // 1-10
  ownership: number;
  mental_health: number;
  economic_justice: number;
  movement_building: number;
}

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type ReminderType =
  | 'deadline_upcoming'
  | 'submission_due'
  | 'decision_expected'
  | 'report_due'
  | 'followup'
  | 'custom';

export type ReminderStatus = 'pending' | 'sent' | 'snoozed' | 'dismissed';

export type DeadlineUrgency = 'overdue' | 'urgent' | 'approaching' | 'upcoming' | 'future';

export interface ReportingScheduleItem {
  type: 'interim' | 'final' | 'quarterly' | 'annual';
  due: string; // ISO date
  submitted?: boolean;
  notes?: string;
}

export interface GrantDocument {
  name: string;
  url: string;
  type: 'application' | 'budget' | 'narrative' | 'support_letter' | 'report' | 'other';
  uploadedAt?: string;
}

export interface Grant {
  id: string;
  title: string;
  funder_name: string;
  funder_type: FunderType;
  program_area?: string;
  application_url?: string;
  contact_email?: string;
  contact_name?: string;
  amount_requested?: number;
  amount_awarded?: number;
  overhead_rate?: number;
  status: GrantStatus;
  deadline_date?: string;
  deadline_time?: string;
  submission_date?: string;
  decision_expected_date?: string;
  decision_actual_date?: string;
  grant_start_date?: string;
  grant_end_date?: string;
  reporting_schedule?: ReportingScheduleItem[];
  priority: Priority;
  fit_score?: number;
  notes?: string;
  campaign_id?: string;
  documents?: GrantDocument[];
  lead_writer?: string;
  team_members?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;

  // Strategic prioritization fields
  strategic_fit_score?: number; // 1-10
  blkout_priority_alignment?: BlkoutPriorityAlignment;
  funder_relationship_score?: number; // 1-10
  funder_advice?: string;

  // Adaptive scaling fields
  scaling_tier?: ScalingTier;
  min_viable_budget?: number;
  max_potential_budget?: number;
  participant_range_min?: number;
  participant_range_max?: number;
  geographic_scope?: GeographicScope;
  scaling_notes?: string;

  // Bid prioritization fields
  bid_priority_score?: number;
  writing_investment_hours?: number;
  review_required?: ReviewRequired;

  // Modularity fields
  is_modular?: boolean;
  module_dependencies?: string[];
  can_fund_independently?: boolean;
  funder_profile_id?: string;

  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GrantReminder {
  id: string;
  grant_id: string;
  reminder_type: ReminderType;
  reminder_date: string;
  reminder_time?: string;
  message?: string;
  status: ReminderStatus;
  sent_at?: string;
  snoozed_until?: string;
  notify_users?: string[];
  notify_email?: string[];
  is_recurring?: boolean;
  recurrence_rule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    until?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface UpcomingDeadline {
  id: string;
  title: string;
  funder_name: string;
  amount_requested?: number;
  deadline_date: string;
  deadline_time?: string;
  status: GrantStatus;
  priority: Priority;
  fit_score?: number;
  days_until_deadline: number;
  urgency: DeadlineUrgency;
}

export interface GrantStatistics {
  status: GrantStatus;
  count: number;
  total_requested: number;
  total_awarded: number;
  avg_fit_score?: number;
}

export interface CreateGrantInput {
  title: string;
  funder_name: string;
  funder_type: FunderType;
  program_area?: string;
  application_url?: string;
  contact_email?: string;
  contact_name?: string;
  amount_requested?: number;
  deadline_date?: string;
  deadline_time?: string;
  priority?: Priority;
  fit_score?: number;
  notes?: string;
  campaign_id?: string;
  tags?: string[];
}

export interface UpdateGrantInput extends Partial<CreateGrantInput> {
  status?: GrantStatus;
  amount_awarded?: number;
  submission_date?: string;
  decision_expected_date?: string;
  decision_actual_date?: string;
  grant_start_date?: string;
  grant_end_date?: string;
  reporting_schedule?: ReportingScheduleItem[];
  documents?: GrantDocument[];
  lead_writer?: string;
  team_members?: string[];

  // Strategic prioritization
  strategic_fit_score?: number;
  blkout_priority_alignment?: BlkoutPriorityAlignment;
  funder_relationship_score?: number;
  funder_advice?: string;

  // Adaptive scaling
  scaling_tier?: ScalingTier;
  min_viable_budget?: number;
  max_potential_budget?: number;
  participant_range_min?: number;
  participant_range_max?: number;
  geographic_scope?: GeographicScope;
  scaling_notes?: string;

  // Bid prioritization
  bid_priority_score?: number;
  writing_investment_hours?: number;
  review_required?: ReviewRequired;

  // Modularity
  is_modular?: boolean;
  module_dependencies?: string[];
  can_fund_independently?: boolean;
}

// Funder Profile types
export interface FunderProfile {
  id: string;
  name: string;
  funder_type: FunderType;
  blkout_fit_score?: number;
  priorities?: string[];
  what_they_fund?: string;
  red_flags?: string;
  key_language?: string[];
  contact_name?: string;
  contact_email?: string;
  relationship_history?: string;
  last_contact_date?: string;
  typical_range_min?: number;
  typical_range_max?: number;
  competition_level?: CompetitionLevel;
  average_success_rate?: number;
  previous_applications?: number;
  successful_applications?: number;
  total_awarded?: number;
  notes?: string;
  website_url?: string;
  application_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFunderProfileInput {
  name: string;
  funder_type: FunderType;
  blkout_fit_score?: number;
  priorities?: string[];
  what_they_fund?: string;
  red_flags?: string;
  key_language?: string[];
  contact_name?: string;
  contact_email?: string;
  typical_range_min?: number;
  typical_range_max?: number;
  competition_level?: CompetitionLevel;
  notes?: string;
  website_url?: string;
  application_url?: string;
}

// Project Scaling Tier types
export interface ProjectScalingTier {
  id: string;
  grant_id: string;
  tier_name: ScalingTier;
  budget_min?: number;
  budget_max?: number;
  staff_fte?: number;
  participant_min?: number;
  participant_max?: number;
  geographic_scope?: GeographicScope;
  deliverables?: string[];
  outcomes?: string[];
  dependencies?: string[];
  prerequisites?: string[];
  description?: string;
  created_at?: string;
}

// Strategic Pipeline View types
export interface StrategicGrantPipeline {
  id: string;
  title: string;
  funder_name: string;
  amount_requested?: number;
  status: GrantStatus;
  deadline_date?: string;
  priority: Priority;
  strategic_fit_score?: number;
  bid_priority_score?: number;
  scaling_tier?: ScalingTier;
  geographic_scope?: GeographicScope;
  participant_range_min?: number;
  participant_range_max?: number;
  writing_investment_hours?: number;
  review_required?: ReviewRequired;
  is_modular?: boolean;
  blkout_priority_alignment?: BlkoutPriorityAlignment;
  funder_fit_score?: number;
  funder_priorities?: string[];
  competition_level?: CompetitionLevel;
  bid_classification: BidClassification;
  days_until_deadline?: number;
}

// ==================== OPPORTUNITY DISCOVERY TYPES ====================

export type OpportunitySource =
  | 'charity_excellence'
  | '360giving'
  | 'manual'
  | 'ivor_research'
  | 'referral'
  | 'funder_website';

export type OpportunityStatus =
  | 'new'
  | 'researching'
  | 'assessing'
  | 'recommended'
  | 'declined'
  | 'converted';

export type ProjectCategory =
  | 'infrastructure'
  | 'mental_health'
  | 'creative'
  | 'capacity_building'
  | 'advocacy'
  | 'research';

export type DeadlineUrgencyLevel = 'no_deadline' | 'expired' | 'urgent' | 'approaching' | 'future';

export interface GrantOpportunity {
  id: string;
  title: string;
  funder_name: string;
  source: OpportunitySource;
  source_url?: string;
  discovered_date: string;
  funding_min?: number;
  funding_max?: number;
  deadline_date?: string;
  initial_fit_score?: number;
  fit_assessment?: string;
  recommended_project?: string;
  status: OpportunityStatus;
  converted_grant_id?: string;
  project_category?: ProjectCategory;
  eligibility_criteria?: string;
  blkout_alignment_notes?: string;
  research_notes?: string;
  next_steps?: string;
  assigned_to?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOpportunityInput {
  title: string;
  funder_name: string;
  source: OpportunitySource;
  source_url?: string;
  funding_min?: number;
  funding_max?: number;
  deadline_date?: string;
  initial_fit_score?: number;
  fit_assessment?: string;
  project_category?: ProjectCategory;
  eligibility_criteria?: string;
  blkout_alignment_notes?: string;
}

export interface OpportunityPipeline extends GrantOpportunity {
  funder_fit_score?: number;
  funder_priorities?: string[];
  competition_level?: CompetitionLevel;
  funder_key_language?: string[];
  deadline_urgency: DeadlineUrgencyLevel;
  days_until_deadline?: number;
  combined_fit_score: number;
}

// ==================== BID WRITING TYPES ====================

export type TemplateType =
  | 'full_application'
  | 'executive_summary'
  | 'theory_of_change'
  | 'budget_narrative'
  | 'evaluation_plan';

export type DocumentStatus = 'draft' | 'in_review' | 'approved' | 'submitted';

export type SessionType = 'drafting' | 'review' | 'ai_assist' | 'collaborative';

export type ResearchNoteType =
  | 'funder_research'
  | 'eligibility_check'
  | 'strategy_note'
  | 'contact_log'
  | 'deadline_info';

export interface TemplateSection {
  section: string;
  guidance: string;
  word_limit?: number;
}

export interface BidWritingTemplate {
  id: string;
  name: string;
  description?: string;
  funder_type?: FunderType;
  project_category?: ProjectCategory;
  template_type: TemplateType;
  structure: TemplateSection[];
  key_language?: string[];
  required_elements?: string[];
  avoid_elements?: string[];
  example_content?: string;
  sample_responses?: Record<string, string>;
  word_limit_min?: number;
  word_limit_max?: number;
  success_rate?: number;
  times_used?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentSection {
  name: string;
  content: string;
  word_count: number;
  status: 'not_started' | 'drafting' | 'complete' | 'needs_review';
}

export interface ReviewComment {
  section: string;
  comment: string;
  resolved: boolean;
  reviewer: string;
  date: string;
}

export interface AISuggestion {
  section: string;
  suggestion: string;
  accepted?: boolean;
}

export interface BidDocument {
  id: string;
  grant_id: string;
  template_id?: string;
  document_type: string;
  title: string;
  content?: string;
  sections: DocumentSection[];
  version: number;
  parent_version_id?: string;
  status: DocumentStatus;
  assigned_to?: string;
  reviewer?: string;
  current_word_count?: number;
  target_word_count?: number;
  review_comments: ReviewComment[];
  last_reviewed_at?: string;
  approved_at?: string;
  ai_suggestions: AISuggestion[];
  ai_generated_content?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBidDocumentInput {
  grant_id: string;
  template_id?: string;
  document_type: string;
  title: string;
  target_word_count?: number;
  assigned_to?: string;
}

export interface BidWritingSession {
  id: string;
  grant_id: string;
  document_id?: string;
  session_type: SessionType;
  started_at: string;
  ended_at?: string;
  lead_writer?: string;
  collaborators?: string[];
  sections_worked?: string[];
  changes_made?: Array<{
    section: string;
    before: string;
    after: string;
    timestamp: string;
  }>;
  ai_prompts?: Array<{
    prompt: string;
    response: string;
    accepted?: boolean;
  }>;
  ai_model_used?: string;
  words_written?: number;
  words_edited?: number;
  time_spent_minutes?: number;
  notes?: string;
  created_at?: string;
}

export interface GrantResearchNote {
  id: string;
  opportunity_id?: string;
  grant_id?: string;
  funder_profile_id?: string;
  note_type: ResearchNoteType;
  title?: string;
  content: string;
  source_url?: string;
  source_document?: string;
  is_critical?: boolean;
  tags?: string[];
  created_by?: string;
  created_at?: string;
}

export interface CreateResearchNoteInput {
  opportunity_id?: string;
  grant_id?: string;
  funder_profile_id?: string;
  note_type: ResearchNoteType;
  title?: string;
  content: string;
  source_url?: string;
  is_critical?: boolean;
  tags?: string[];
}

// ==================== VIEW TYPES ====================

export interface BidWritingProgress {
  grant_id: string;
  grant_title: string;
  funder_name: string;
  deadline_date?: string;
  amount_requested?: number;
  grant_status: GrantStatus;
  writing_investment_hours?: number;
  review_required?: ReviewRequired;
  total_documents: number;
  drafts_in_progress: number;
  documents_in_review: number;
  documents_approved: number;
  total_words_written: number;
  total_target_words: number;
  word_count_progress_pct: number;
  total_sessions: number;
  total_time_spent_minutes?: number;
  days_until_deadline?: number;
  deadline_status: 'no_deadline' | 'overdue' | 'urgent' | 'approaching' | 'on_track';
}

export interface TemplateAnalytics {
  id: string;
  name: string;
  funder_type?: FunderType;
  project_category?: ProjectCategory;
  template_type: TemplateType;
  times_used: number;
  success_rate?: number;
  active_documents: number;
  approved_documents: number;
  current_approval_rate: number;
}
