
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AgentType } from '@/types';

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
