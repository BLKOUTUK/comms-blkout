/**
 * useGrants Hook
 * React hook for grant funding management
 * Connects UI to GrantsClient service
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  Grant,
  Priority,
  OpportunityPipeline,
  BidWritingProgress,
  BidWritingTemplate,
} from '@/types';

// Pipeline summary type
interface PipelineSummary {
  totalGrants: number;
  totalRequested: number;
  totalAwarded: number;
  successRate: number;
  activeApplications: number;
  upcomingDeadlines: number;
}

// Mock data for development without Supabase
const mockGrants: Grant[] = [
  {
    id: '1',
    title: 'National Lottery Community Fund - Reaching Communities',
    funder_name: 'National Lottery Community Fund',
    funder_type: 'lottery',
    amount_requested: 150000,
    deadline_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'preparing',
    priority: 'critical',
    strategic_fit_score: 9,
    scaling_tier: 'growth',
    writing_investment_hours: 40,
    review_required: 'full_external',
    geographic_scope: 'national',
    participant_range_min: 500,
    participant_range_max: 2000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Paul Hamlyn Foundation - Ideas and Pioneers',
    funder_name: 'Paul Hamlyn Foundation',
    funder_type: 'trust',
    amount_requested: 75000,
    deadline_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'eligible',
    priority: 'high',
    strategic_fit_score: 8,
    scaling_tier: 'seed',
    writing_investment_hours: 24,
    review_required: 'peer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Comic Relief - Tech for Good',
    funder_name: 'Comic Relief',
    funder_type: 'foundation',
    amount_requested: 50000,
    deadline_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'researching',
    priority: 'medium',
    strategic_fit_score: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Esmée Fairbairn Foundation - Social Change',
    funder_name: 'Esmée Fairbairn Foundation',
    funder_type: 'trust',
    amount_requested: 200000,
    deadline_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'submitted',
    priority: 'high',
    strategic_fit_score: 9,
    scaling_tier: 'scale',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockOpportunities: OpportunityPipeline[] = [
  {
    id: '1',
    title: 'Wellcome Trust - Mental Health Research',
    funder_name: 'Wellcome Trust',
    source: 'ivor_research',
    status: 'recommended',
    funding_min: 100000,
    funding_max: 500000,
    deadline_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    days_until_deadline: 45,
    deadline_urgency: 'future',
    combined_fit_score: 8.5,
    project_category: 'mental_health',
    recommended_project: 'IVOR Mental Health Support Module',
    funder_priorities: ['Community-led research', 'Digital innovation', 'Underserved communities'],
    discovered_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Arts Council England - Developing Your Creative Practice',
    funder_name: 'Arts Council England',
    source: 'charity_excellence',
    status: 'new',
    funding_min: 2000,
    funding_max: 10000,
    deadline_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    days_until_deadline: 21,
    deadline_urgency: 'approaching',
    combined_fit_score: 7.2,
    project_category: 'creative',
    funder_priorities: ['Diverse artists', 'Career development'],
    discovered_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'City Bridge Trust - Connecting Communities',
    funder_name: 'City Bridge Trust',
    source: '360giving',
    status: 'assessing',
    funding_min: 50000,
    funding_max: 150000,
    days_until_deadline: 90,
    deadline_urgency: 'future',
    combined_fit_score: 8.0,
    project_category: 'infrastructure',
    funder_priorities: ['London-based', 'Digital inclusion', 'LGBTQ+ communities'],
    discovered_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockBidProgress: BidWritingProgress[] = [
  {
    grant_id: '1',
    grant_title: 'National Lottery Community Fund - Reaching Communities',
    funder_name: 'National Lottery Community Fund',
    amount_requested: 150000,
    deadline_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    days_until_deadline: 14,
    deadline_status: 'urgent',
    grant_status: 'preparing',
    total_documents: 6,
    drafts_in_progress: 2,
    documents_in_review: 3,
    documents_approved: 1,
    total_target_words: 8000,
    total_words_written: 5200,
    word_count_progress_pct: 65,
    total_time_spent_minutes: 720,
    total_sessions: 8,
    writing_investment_hours: 40,
    review_required: 'full_external',
  },
  {
    grant_id: '2',
    grant_title: 'Paul Hamlyn Foundation - Ideas and Pioneers',
    funder_name: 'Paul Hamlyn Foundation',
    amount_requested: 75000,
    deadline_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    days_until_deadline: 30,
    deadline_status: 'approaching',
    grant_status: 'eligible',
    total_documents: 4,
    drafts_in_progress: 3,
    documents_in_review: 1,
    documents_approved: 0,
    total_target_words: 5000,
    total_words_written: 1800,
    word_count_progress_pct: 36,
    total_time_spent_minutes: 240,
    total_sessions: 3,
    writing_investment_hours: 24,
    review_required: 'peer',
  },
];

export function useGrants() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityPipeline[]>([]);
  const [bidProgress, setBidProgress] = useState<BidWritingProgress[]>([]);
  const [pipelineSummary, setPipelineSummary] = useState<PipelineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGrants = useCallback(async () => {
    try {
      if (!isSupabaseConfigured()) {
        console.log('📦 Using mock grants data');
        return mockGrants;
      }

      const { data, error: fetchError } = await supabase
        .from('grants')
        .select('*')
        .is('deleted_at', null)
        .order('deadline_date', { ascending: true });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching grants:', err);
      return mockGrants;
    }
  }, []);

  const fetchOpportunities = useCallback(async () => {
    try {
      if (!isSupabaseConfigured()) {
        console.log('📦 Using mock opportunities data');
        return mockOpportunities;
      }

      const { data, error: fetchError } = await supabase
        .from('opportunity_pipeline')
        .select('*');

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      return mockOpportunities;
    }
  }, []);

  const fetchBidProgress = useCallback(async () => {
    try {
      if (!isSupabaseConfigured()) {
        console.log('📦 Using mock bid progress data');
        return mockBidProgress;
      }

      const { data, error: fetchError } = await supabase
        .from('bid_writing_progress')
        .select('*');

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching bid progress:', err);
      return mockBidProgress;
    }
  }, []);

  const calculatePipelineSummary = useCallback((grantsList: Grant[]): PipelineSummary => {
    const totalRequested = grantsList.reduce((sum, g) => sum + (g.amount_requested || 0), 0);
    const totalAwarded = grantsList.reduce((sum, g) => sum + (g.amount_awarded || 0), 0);
    const awardedCount = grantsList.filter(g => g.status === 'awarded').length;
    const decidedCount = grantsList.filter(g => ['awarded', 'declined'].includes(g.status)).length;
    const activeApplications = grantsList.filter(g =>
      ['researching', 'eligible', 'preparing', 'submitted', 'under_review'].includes(g.status)
    ).length;

    // Count grants with deadlines in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const upcomingDeadlines = grantsList.filter(g => {
      if (!g.deadline_date) return false;
      const deadline = new Date(g.deadline_date);
      return deadline <= thirtyDaysFromNow && deadline >= new Date();
    }).length;

    return {
      totalGrants: grantsList.length,
      totalRequested,
      totalAwarded,
      successRate: decidedCount > 0 ? (awardedCount / decidedCount) * 100 : 0,
      activeApplications,
      upcomingDeadlines,
    };
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [grantsData, opportunitiesData, bidProgressData] = await Promise.all([
        fetchGrants(),
        fetchOpportunities(),
        fetchBidProgress(),
      ]);

      setGrants(grantsData);
      setOpportunities(opportunitiesData);
      setBidProgress(bidProgressData);
      setPipelineSummary(calculatePipelineSummary(grantsData));
    } catch (err) {
      console.error('Error fetching grant data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch grant data');
      // Use mock data as fallback
      setGrants(mockGrants);
      setOpportunities(mockOpportunities);
      setBidProgress(mockBidProgress);
      setPipelineSummary(calculatePipelineSummary(mockGrants));
    } finally {
      setLoading(false);
    }
  }, [fetchGrants, fetchOpportunities, fetchBidProgress, calculatePipelineSummary]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refetch = () => {
    fetchAll();
  };

  // Filter grants by status
  const getGrantsByStatus = useCallback((status: string | string[]) => {
    const statuses = Array.isArray(status) ? status : [status];
    return grants.filter(g => statuses.includes(g.status));
  }, [grants]);

  // Filter grants by priority
  const getGrantsByPriority = useCallback((priority: Priority | Priority[]) => {
    const priorities = Array.isArray(priority) ? priority : [priority];
    return grants.filter(g => priorities.includes(g.priority));
  }, [grants]);

  // Get upcoming deadlines
  const getUpcomingDeadlines = useCallback((days: number = 30) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    return grants
      .filter(g => {
        if (!g.deadline_date) return false;
        const deadline = new Date(g.deadline_date);
        return deadline <= cutoff && deadline >= new Date();
      })
      .sort((a, b) => {
        const dateA = new Date(a.deadline_date!).getTime();
        const dateB = new Date(b.deadline_date!).getTime();
        return dateA - dateB;
      });
  }, [grants]);

  return {
    // Data
    grants,
    opportunities,
    bidProgress,
    pipelineSummary,

    // State
    loading,
    error,

    // Actions
    refetch,

    // Utility functions
    getGrantsByStatus,
    getGrantsByPriority,
    getUpcomingDeadlines,
  };
}

// Hook for fetching a single grant with details
export function useGrant(grantId: string) {
  const [grant, setGrant] = useState<Grant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrant = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured()) {
          const mockGrant = mockGrants.find(g => g.id === grantId) || null;
          setGrant(mockGrant);
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('grants')
          .select('*')
          .eq('id', grantId)
          .is('deleted_at', null)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        setGrant(data);
      } catch (err) {
        console.error('Error fetching grant:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch grant');
      } finally {
        setLoading(false);
      }
    };

    if (grantId) {
      fetchGrant();
    }
  }, [grantId]);

  return { grant, loading, error };
}

// Hook for bid writing templates
export function useTemplates() {
  const [templates, setTemplates] = useState<BidWritingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured()) {
          console.log('📦 Using mock templates');
          setTemplates([]);
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('bid_writing_templates')
          .select('*')
          .eq('is_active', true)
          .order('times_used', { ascending: false });

        if (fetchError) throw fetchError;
        setTemplates(data || []);
      } catch (err) {
        console.error('Error fetching templates:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  return { templates, loading, error };
}
