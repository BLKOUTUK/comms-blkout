
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AgentType } from '@/types';

// Herald-specific content types
export interface NewsletterContentItem {
  id: string;
  title: string;
  summary?: string;
  url?: string;
  imageUrl?: string;
  relevanceScore?: number;
  category?: string;
  date?: string;
}

export interface HeraldNewsletterContent {
  editionType: 'weekly' | 'monthly';
  generatedAt: Date;
  sections: {
    highlights: NewsletterContentItem[];
    events: NewsletterContentItem[];
    communityVoice: NewsletterContentItem[];
    resources: NewsletterContentItem[];
    callToAction: NewsletterContentItem[];
  };
  intelligence: {
    activeMembers: number;
    verifiedCreators: number;
    weeklySubscribers: number;
    monthlySubscribers: number;
    totalEventsUpcoming: number;
  };
  contentCounts: {
    highlights: number;
    events: number;
    communityVoice: number;
    resources: number;
    callToAction: number;
  };
}

export interface HeraldIntelligence {
  memberActivity: {
    totalActive: number;
    newThisWeek: number;
    newThisMonth: number;
    verifiedCreators: number;
    facilitators: number;
    proposers: number;
  };
  contentPerformance: {
    articlesThisWeek: number;
    avgInterestScore: number;
    topCategory: string | null;
  };
  governanceActivity: {
    activeProposals: number;
    passedThisMonth: number;
    totalVotesThisMonth: number;
  };
  resourceTrends: {
    totalActiveResources: number;
    topCategories: Array<{ name: string; count: number }>;
  };
  subscriberStats: {
    weeklyTier: number;
    monthlyTier: number;
    newThisWeek: number;
    unsubscribedThisMonth: number;
  };
  generatedAt: Date;
}

export interface AgentIntelligence {
  id: string;
  intelligenceType: string;
  ivorService: string;
  summary: string;
  keyInsights: string[];
  actionableItems: string[];
  relevanceScore: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'elevated' | 'normal' | 'low';
  dataTimestamp: Date;
  expiresAt: Date | null;
  timesUsed: number;
  tags: string[];
  isExpired: boolean;
}

export interface MemberActivityDashboard {
  activeMembers: number;
  verifiedCreators: number;
  pendingMembers: number;
  activeVoters: number;
  activeProposers: number;
  activeFacilitators: number;
  weeklyEngagements: number;
  weeklyRatings: number;
  weeklyConversations: number;
  articlesPublishedThisWeek: number;
  eventsThisWeek: number;
  weeklySubscribers: number;
  monthlySubscribers: number;
  generatedAt: Date;
}

// Mock intelligence data
const mockIntelligence: AgentIntelligence[] = [
  {
    id: 'mock-1',
    intelligenceType: 'trends',
    ivorService: 'blkouthub',
    summary: 'Weekly member activity showing steady engagement',
    keyInsights: [
      'Governance participation strong with 5 votes this week',
      'Two new members joined from event referrals',
      'Mental health resources accessed 40% more',
    ],
    actionableItems: [
      'Herald: Highlight governance in weekly update',
      'Griot: Feature new member stories',
    ],
    relevanceScore: 0.85,
    priority: 'high',
    urgency: 'normal',
    dataTimestamp: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    timesUsed: 0,
    tags: ['member-activity', 'governance'],
    isExpired: false,
  },
];

const mockDashboard: MemberActivityDashboard = {
  activeMembers: 10,
  verifiedCreators: 3,
  pendingMembers: 2,
  activeVoters: 5,
  activeProposers: 2,
  activeFacilitators: 1,
  weeklyEngagements: 24,
  weeklyRatings: 8,
  weeklyConversations: 15,
  articlesPublishedThisWeek: 3,
  eventsThisWeek: 2,
  weeklySubscribers: 0,
  monthlySubscribers: 0,
  generatedAt: new Date(),
};

export function useAgentIntelligence(agentType?: AgentType) {
  const [intelligence, setIntelligence] = useState<AgentIntelligence[]>([]);
  const [dashboard, setDashboard] = useState<MemberActivityDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntelligence = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isSupabaseConfigured()) {
        console.log('📦 Using mock intelligence data');
        // Filter by agent if specified
        const filtered = agentType
          ? mockIntelligence.filter(i =>
              i.actionableItems.some(item =>
                item.toLowerCase().includes(agentType)
              )
            )
          : mockIntelligence;
        setIntelligence(filtered);
        setDashboard(mockDashboard);
        setIsLoading(false);
        return;
      }

      // Fetch from agent_intelligence_feed view
      const { data: intelData, error: intelError } = await supabase
        .from('agent_intelligence_feed')
        .select('*')
        .limit(20);

      if (intelError) {
        console.error('Error fetching intelligence feed:', intelError);
        // Try direct table query if view fails
        const { data: directData } = await supabase
          .from('ivor_intelligence')
          .select('*')
          .eq('is_stale', false)
          .order('relevance_score', { ascending: false })
          .limit(20);

        if (directData) {
          const transformed = transformIntelligenceRows(directData);
          const filtered = agentType
            ? transformed.filter(i =>
                i.actionableItems.some(item =>
                  item.toLowerCase().includes(agentType)
                )
              )
            : transformed;
          setIntelligence(filtered);
        }
      } else if (intelData) {
        const transformed = transformIntelligenceRows(intelData);
        const filtered = agentType
          ? transformed.filter(i =>
              i.actionableItems.some(item =>
                item.toLowerCase().includes(agentType)
              )
            )
          : transformed;
        setIntelligence(filtered);
      }

      // Fetch member activity dashboard
      const { data: dashData, error: dashError } = await supabase
        .from('member_activity_dashboard')
        .select('*')
        .single();

      if (!dashError && dashData) {
        setDashboard({
          activeMembers: dashData.active_members || 0,
          verifiedCreators: dashData.verified_creators || 0,
          pendingMembers: dashData.pending_members || 0,
          activeVoters: dashData.active_voters || 0,
          activeProposers: dashData.active_proposers || 0,
          activeFacilitators: dashData.active_facilitators || 0,
          weeklyEngagements: dashData.weekly_engagements || 0,
          weeklyRatings: dashData.weekly_ratings || 0,
          weeklyConversations: dashData.weekly_conversations || 0,
          articlesPublishedThisWeek: dashData.articles_published_this_week || 0,
          eventsThisWeek: dashData.events_this_week || 0,
          weeklySubscribers: dashData.weekly_subscribers || 0,
          monthlySubscribers: dashData.monthly_subscribers || 0,
          generatedAt: new Date(dashData.generated_at),
        });
      } else {
        setDashboard(mockDashboard);
      }

    } catch (err) {
      console.error('Error fetching intelligence:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch intelligence');
      setIntelligence(mockIntelligence);
      setDashboard(mockDashboard);
    } finally {
      setIsLoading(false);
    }
  }, [agentType]);

  useEffect(() => {
    fetchIntelligence();
  }, [fetchIntelligence]);

  const markAsUsed = async (intelligenceId: string, contentId?: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      console.log('📦 Mock: Marking intelligence as used', intelligenceId);
      return;
    }

    try {
      await supabase.rpc('mark_intelligence_used', {
        p_intelligence_id: intelligenceId,
        p_content_id: contentId || null,
      });
    } catch (err) {
      console.error('Error marking intelligence as used:', err);
    }
  };

  // Get high-priority intelligence
  const highPriorityIntel = intelligence.filter(
    i => i.priority === 'critical' || i.priority === 'high'
  );

  // Get intelligence by type
  const getByType = (type: string) =>
    intelligence.filter(i => i.intelligenceType === type);

  return {
    intelligence,
    highPriorityIntel,
    dashboard,
    isLoading,
    error,
    refetch: fetchIntelligence,
    markAsUsed,
    getByType,
  };
}

function transformIntelligenceRows(rows: any[]): AgentIntelligence[] {
  return rows.map(row => ({
    id: row.id,
    intelligenceType: row.intelligence_type,
    ivorService: row.ivor_service,
    summary: row.summary || '',
    keyInsights: row.key_insights || [],
    actionableItems: row.actionable_items || [],
    relevanceScore: parseFloat(row.relevance_score) || 0,
    priority: row.priority || 'medium',
    urgency: row.urgency || 'normal',
    dataTimestamp: new Date(row.data_timestamp),
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    timesUsed: row.times_used || 0,
    tags: row.tags || [],
    isExpired: row.is_expired || false,
  }));
}

// ============================================================================
// HERALD-SPECIFIC INTELLIGENCE HOOK
// Uses the SQL functions created in migration 005
// ============================================================================

// Mock data for Herald when Supabase not configured
const mockHeraldContent: HeraldNewsletterContent = {
  editionType: 'weekly',
  generatedAt: new Date(),
  sections: {
    highlights: [
      { id: '1', title: 'Community Launch Success', summary: 'BLKOUT platform officially launched', relevanceScore: 95 },
      { id: '2', title: 'New Governance Features', summary: 'Democratic voting now available', relevanceScore: 88 },
    ],
    events: [
      { id: '1', title: 'Community Gathering', summary: 'Monthly meetup in London', date: new Date().toISOString() },
    ],
    communityVoice: [
      { id: '1', title: 'New Community Facilitator', summary: 'Celebrating our newest facilitator' },
    ],
    resources: [
      { id: '1', title: 'Mental Health Support', summary: 'Updated resource directory', category: 'Support' },
    ],
    callToAction: [
      { id: '1', title: 'Join the Coop', summary: 'Become a founding member', url: 'https://blkout.community/coop' },
    ],
  },
  intelligence: {
    activeMembers: 10,
    verifiedCreators: 3,
    weeklySubscribers: 93,
    monthlySubscribers: 1223,
    totalEventsUpcoming: 5,
  },
  contentCounts: {
    highlights: 2,
    events: 1,
    communityVoice: 1,
    resources: 1,
    callToAction: 1,
  },
};

const mockHeraldIntelligence: HeraldIntelligence = {
  memberActivity: {
    totalActive: 10,
    newThisWeek: 2,
    newThisMonth: 5,
    verifiedCreators: 3,
    facilitators: 1,
    proposers: 2,
  },
  contentPerformance: {
    articlesThisWeek: 3,
    avgInterestScore: 75,
    topCategory: 'Community',
  },
  governanceActivity: {
    activeProposals: 2,
    passedThisMonth: 1,
    totalVotesThisMonth: 15,
  },
  resourceTrends: {
    totalActiveResources: 50,
    topCategories: [
      { name: 'Support Groups', count: 20 },
      { name: 'Mental Health', count: 15 },
      { name: 'Legal Aid', count: 10 },
    ],
  },
  subscriberStats: {
    weeklyTier: 93,
    monthlyTier: 1223,
    newThisWeek: 5,
    unsubscribedThisMonth: 2,
  },
  generatedAt: new Date(),
};

export function useHeraldIntelligence() {
  const [newsletterContent, setNewsletterContent] = useState<HeraldNewsletterContent | null>(null);
  const [heraldIntelligence, setHeraldIntelligence] = useState<HeraldIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNewsletterContent = useCallback(async (editionType: 'weekly' | 'monthly' = 'weekly') => {
    if (!isSupabaseConfigured()) {
      console.log('[Herald] Using mock newsletter content');
      setNewsletterContent({ ...mockHeraldContent, editionType });
      return mockHeraldContent;
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('get_newsletter_content', {
        p_edition_type: editionType,
      });

      if (rpcError) {
        console.error('[Herald] Error fetching newsletter content:', rpcError);
        throw rpcError;
      }

      if (data) {
        const content: HeraldNewsletterContent = {
          editionType: data.edition_type,
          generatedAt: new Date(data.generated_at),
          sections: {
            highlights: transformContentItems(data.sections?.highlights || []),
            events: transformContentItems(data.sections?.events || []),
            communityVoice: transformContentItems(data.sections?.community_voice || []),
            resources: transformContentItems(data.sections?.resources || []),
            callToAction: transformContentItems(data.sections?.call_to_action || []),
          },
          intelligence: {
            activeMembers: data.intelligence?.active_members || 0,
            verifiedCreators: data.intelligence?.verified_creators || 0,
            weeklySubscribers: data.intelligence?.weekly_subscribers || 0,
            monthlySubscribers: data.intelligence?.monthly_subscribers || 0,
            totalEventsUpcoming: data.intelligence?.total_events_upcoming || 0,
          },
          contentCounts: {
            highlights: data.content_counts?.highlights || 0,
            events: data.content_counts?.events || 0,
            communityVoice: data.content_counts?.community_voice || 0,
            resources: data.content_counts?.resources || 0,
            callToAction: data.content_counts?.call_to_action || 0,
          },
        };
        setNewsletterContent(content);
        return content;
      }
    } catch (err) {
      console.error('[Herald] Error in fetchNewsletterContent:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch newsletter content');
      setNewsletterContent(mockHeraldContent);
      return mockHeraldContent;
    }
  }, []);

  const fetchHeraldIntelligence = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      console.log('[Herald] Using mock Herald intelligence');
      setHeraldIntelligence(mockHeraldIntelligence);
      return mockHeraldIntelligence;
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('get_herald_intelligence');

      if (rpcError) {
        console.error('[Herald] Error fetching Herald intelligence:', rpcError);
        throw rpcError;
      }

      if (data) {
        const intel: HeraldIntelligence = {
          memberActivity: {
            totalActive: data.member_activity?.total_active || 0,
            newThisWeek: data.member_activity?.new_this_week || 0,
            newThisMonth: data.member_activity?.new_this_month || 0,
            verifiedCreators: data.member_activity?.verified_creators || 0,
            facilitators: data.member_activity?.facilitators || 0,
            proposers: data.member_activity?.proposers || 0,
          },
          contentPerformance: {
            articlesThisWeek: data.content_performance?.articles_this_week || 0,
            avgInterestScore: data.content_performance?.avg_interest_score || 0,
            topCategory: data.content_performance?.top_category || null,
          },
          governanceActivity: {
            activeProposals: data.governance_activity?.active_proposals || 0,
            passedThisMonth: data.governance_activity?.passed_this_month || 0,
            totalVotesThisMonth: data.governance_activity?.total_votes_this_month || 0,
          },
          resourceTrends: {
            totalActiveResources: data.resource_trends?.total_active_resources || 0,
            topCategories: data.resource_trends?.top_categories || [],
          },
          subscriberStats: {
            weeklyTier: data.subscriber_stats?.weekly_tier || 0,
            monthlyTier: data.subscriber_stats?.monthly_tier || 0,
            newThisWeek: data.subscriber_stats?.new_this_week || 0,
            unsubscribedThisMonth: data.subscriber_stats?.unsubscribed_this_month || 0,
          },
          generatedAt: new Date(data.generated_at),
        };
        setHeraldIntelligence(intel);
        return intel;
      }
    } catch (err) {
      console.error('[Herald] Error in fetchHeraldIntelligence:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Herald intelligence');
      setHeraldIntelligence(mockHeraldIntelligence);
      return mockHeraldIntelligence;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchNewsletterContent('weekly'),
          fetchHeraldIntelligence(),
        ]);
      } catch (err) {
        console.error('[Herald] Error in initial fetch:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [fetchNewsletterContent, fetchHeraldIntelligence]);

  return {
    newsletterContent,
    heraldIntelligence,
    isLoading,
    error,
    fetchNewsletterContent,
    fetchHeraldIntelligence,
    refetch: () => Promise.all([fetchNewsletterContent(), fetchHeraldIntelligence()]),
  };
}

// Helper to transform raw content items
function transformContentItems(items: any[]): NewsletterContentItem[] {
  return (items || []).map(item => ({
    id: item.id,
    title: item.title || item.headline || '',
    summary: item.summary || item.description || item.excerpt || '',
    url: item.url || item.source_url || item.event_url || item.website_url || item.cta_url || '',
    imageUrl: item.image_url || item.featured_image || '',
    relevanceScore: item.relevance_score || item.interest_score || item.priority || 0,
    category: item.category || item.category_name || item.voice_type || '',
    date: item.date || item.event_date || item.published_at || item.created_at || '',
  }));
}
