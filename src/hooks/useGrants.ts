/**
 * useGrants — the Funding page's data.
 *
 * Rewritten 3 Sep 2026. Until then this file was 1,252 lines, ~1,000 of them mock
 * grants/opportunities/bid-progress returned from every `catch`, and it read the
 * legacy `grants` table (16 rows, last write 25 May 2026). The live pipeline is
 * `grant_pipeline` (the CRM's source of truth), read here through an admin RLS
 * policy and mapped onto the `Grant` shape the components render. No fallback
 * values: a failed fetch leaves the lists empty with `error` set.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  Grant,
  GrantStatus,
  FunderType,
  Priority,
  OpportunityPipeline,
  BidWritingProgress,
  FunderRelationship,
} from '@/types';

// Normalise a funder name for matching across the dashboard and the CRM
// (lowercase, strip punctuation/whitespace) — funder names rarely match exactly.
export const normalizeFunderName = (name: string): string =>
  (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

interface PipelineSummary {
  totalGrants: number;
  totalRequested: number;
  totalAwarded: number;
  successRate: number;
  activeApplications: number;
  upcomingDeadlines: number;
}

const NOT_CONFIGURED = 'Database not configured';

// grant_pipeline.stage (CRM enum) → the status vocabulary the cards use.
const STAGE_TO_STATUS: Record<string, GrantStatus> = {
  research: 'researching',
  preparing: 'preparing',
  submitted: 'submitted',
  under_review: 'under_review',
  interview: 'under_review',
  decision_pending: 'under_review',
  approved: 'awarded',
  active: 'awarded',
  reporting: 'reporting',
  completed: 'reporting',
  rejected: 'declined',
  withdrawn: 'withdrawn',
};

const ORG_TYPE_TO_FUNDER_TYPE = (orgType: string | null | undefined): FunderType => {
  const t = (orgType || '').toLowerCase();
  if (t.includes('foundation')) return 'foundation';
  if (t.includes('government') || t.includes('public_sector') || t.includes('council')) return 'government';
  if (t.includes('corporate') || t.includes('business')) return 'corporate';
  if (t.includes('lottery')) return 'lottery';
  if (t.includes('trust')) return 'trust';
  if (t.includes('individual')) return 'individual';
  return 'other';
};

// Ordering aid only — derived from stage and deadline, not a stored judgement.
const derivePriority = (stage: string, deadline: string | null): Priority => {
  const days = deadline ? (new Date(deadline).getTime() - Date.now()) / 86_400_000 : null;
  if (['submitted', 'under_review', 'interview', 'decision_pending'].includes(stage)) return 'high';
  if (stage === 'preparing') return days !== null && days <= 30 ? 'critical' : 'high';
  if (stage === 'research') return 'medium';
  if (['approved', 'active', 'reporting'].includes(stage)) return 'medium';
  return 'low';
};

interface PipelineRow {
  id: string;
  grant_name: string | null;
  grant_program: string | null;
  description: string | null;
  amount_requested: number | null;
  amount_awarded: number | null;
  stage: string;
  probability: number | null;
  deadline: string | null;
  submitted_at: string | null;
  decision_expected: string | null;
  decision_received: string | null;
  grant_start_date: string | null;
  grant_end_date: string | null;
  application_document_url: string | null;
  notes: string | null;
  updated_at: string;
  funder: { name: string | null; org_type: string | null } | null;
}

const toGrant = (row: PipelineRow): Grant => ({
  id: row.id,
  title: row.grant_name || row.grant_program || 'Untitled application',
  funder_name: row.funder?.name || 'Unknown funder',
  funder_type: ORG_TYPE_TO_FUNDER_TYPE(row.funder?.org_type),
  program_area: row.grant_program || undefined,
  application_url: row.application_document_url || undefined,
  amount_requested: row.amount_requested ?? undefined,
  amount_awarded: row.amount_awarded ?? undefined,
  status: STAGE_TO_STATUS[row.stage] || 'researching',
  deadline_date: row.deadline || undefined,
  submission_date: row.submitted_at || undefined,
  decision_expected_date: row.decision_expected || undefined,
  decision_actual_date: row.decision_received || undefined,
  grant_start_date: row.grant_start_date || undefined,
  grant_end_date: row.grant_end_date || undefined,
  priority: derivePriority(row.stage, row.deadline),
  fit_score: row.probability ?? undefined,
  notes: row.notes || row.description || undefined,
  metadata: { source: 'grant_pipeline', stage: row.stage, updated_at: row.updated_at },
});

export function useGrants() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityPipeline[]>([]);
  const [bidProgress, setBidProgress] = useState<BidWritingProgress[]>([]);
  const [pipelineSummary, setPipelineSummary] = useState<PipelineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const summarise = useCallback((list: Grant[]): PipelineSummary => {
    const totalRequested = list.reduce((sum, g) => sum + (g.amount_requested || 0), 0);
    const totalAwarded = list.reduce((sum, g) => sum + (g.amount_awarded || 0), 0);
    const awardedCount = list.filter((g) => g.status === 'awarded').length;
    const decidedCount = list.filter((g) => ['awarded', 'declined'].includes(g.status)).length;
    const activeApplications = list.filter((g) =>
      ['researching', 'eligible', 'preparing', 'submitted', 'under_review'].includes(g.status)
    ).length;
    const in30 = Date.now() + 30 * 86_400_000;
    const upcomingDeadlines = list.filter((g) => {
      if (!g.deadline_date) return false;
      const t = new Date(g.deadline_date).getTime();
      return t <= in30 && t >= Date.now();
    }).length;
    return {
      totalGrants: list.length,
      totalRequested,
      totalAwarded,
      successRate: decidedCount > 0 ? (awardedCount / decidedCount) * 100 : 0,
      activeApplications,
      upcomingDeadlines,
    };
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!isSupabaseConfigured()) {
      setGrants([]); setOpportunities([]); setBidProgress([]); setPipelineSummary(null);
      setError(NOT_CONFIGURED);
      setLoading(false);
      return;
    }
    try {
      const [pipeline, opps, bids] = await Promise.all([
        supabase
          .from('grant_pipeline')
          .select('id, grant_name, grant_program, description, amount_requested, amount_awarded, stage, probability, deadline, submitted_at, decision_expected, decision_received, grant_start_date, grant_end_date, application_document_url, notes, updated_at, funder:organizations(name, org_type)')
          .order('deadline', { ascending: true, nullsFirst: false }),
        supabase.from('opportunity_pipeline').select('*'),
        supabase.from('bid_writing_progress').select('*'),
      ]);
      if (pipeline.error) throw pipeline.error;
      const list = ((pipeline.data || []) as unknown as PipelineRow[]).map(toGrant);
      setGrants(list);
      setPipelineSummary(summarise(list));
      // The two views are secondary; a failure there is reported, not papered over.
      const secondary: string[] = [];
      if (opps.error) { secondary.push(`opportunities: ${opps.error.message}`); setOpportunities([]); }
      else setOpportunities((opps.data || []) as OpportunityPipeline[]);
      if (bids.error) { secondary.push(`bid progress: ${bids.error.message}`); setBidProgress([]); }
      else setBidProgress((bids.data || []) as BidWritingProgress[]);
      if (secondary.length) setError(secondary.join(' · '));
    } catch (err) {
      console.error('Error fetching grant pipeline:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch grant pipeline');
      setGrants([]); setOpportunities([]); setBidProgress([]); setPipelineSummary(null);
    } finally {
      setLoading(false);
    }
  }, [summarise]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getGrantsByStatus = useCallback((status: string | string[]) => {
    const statuses = Array.isArray(status) ? status : [status];
    return grants.filter((g) => statuses.includes(g.status));
  }, [grants]);

  const getGrantsByPriority = useCallback((priority: Priority | Priority[]) => {
    const priorities = Array.isArray(priority) ? priority : [priority];
    return grants.filter((g) => priorities.includes(g.priority));
  }, [grants]);

  const getUpcomingDeadlines = useCallback((days: number = 30) => {
    const cutoff = Date.now() + days * 86_400_000;
    return grants
      .filter((g) => g.deadline_date && new Date(g.deadline_date).getTime() <= cutoff && new Date(g.deadline_date).getTime() >= Date.now())
      .sort((a, b) => new Date(a.deadline_date!).getTime() - new Date(b.deadline_date!).getTime());
  }, [grants]);

  return {
    grants,
    opportunities,
    bidProgress,
    pipelineSummary,
    loading,
    error,
    refetch: fetchAll,
    getGrantsByStatus,
    getGrantsByPriority,
    getUpcomingDeadlines,
  };
}

// Funder relationships from the CRM's organizations table, keyed by normalised name.
export function useFunderRelationships() {
  const [relationships, setRelationships] = useState<Map<string, FunderRelationship>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        if (!isSupabaseConfigured()) {
          setLoading(false);
          return;
        }
        const { data, error: fetchError } = await supabase
          .from('organizations')
          .select('name, relationship_type, relationship_status, relationship_start_date')
          .or('is_funder.eq.true,org_type.eq.funder_foundation,relationship_type.eq.funder,relationship_type.eq.sponsor')
          .in('relationship_status', ['active', 'developing']);
        if (fetchError) throw fetchError;
        const map = new Map<string, FunderRelationship>();
        (data || []).forEach((org) => {
          if (org?.name) {
            map.set(normalizeFunderName(org.name), {
              name: org.name,
              relationship_type: org.relationship_type ?? null,
              relationship_status: org.relationship_status ?? null,
              relationship_start_date: org.relationship_start_date ?? null,
            });
          }
        });
        setRelationships(map);
      } catch (err) {
        // CRM may be unpopulated with funders, or table unreachable — degrade quietly.
        console.warn('Funder relationships unavailable from CRM:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRelationships();
  }, []);

  return { relationships, loading };
}
