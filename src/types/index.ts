
import type { Database } from './database';

// Type aliases for easier use
export type Platform = Database['public']['Tables']['platforms']['Row'];
export type Agent = Database['public']['Tables']['agent_configurations']['Row'];
export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type Content = Database['public']['Tables']['content_calendar']['Row'];
export type ContentDraft = Database['public']['Tables']['content_drafts']['Row'];
export type ContentApproval = Database['public']['Tables']['content_approvals']['Row'];
export type IvorIntelligence = Database['public']['Tables']['ivor_intelligence']['Row'];
export type ContentPerformance = Database['public']['Tables']['content_performance']['Row'];

// Content with relations
export interface ContentWithRelations extends Content {
  platform?: Platform;
  campaign?: Campaign;
  drafts?: ContentDraft[];
  performance?: ContentPerformance;
}

// Agent status
export interface AgentStatus {
  agent: Agent;
  isOnline: boolean;
  lastActivity: string;
  contentGenerated: number;
  successRate: number;
}

// Analytics data
export interface AnalyticsData {
  totalContent: number;
  publishedContent: number;
  scheduledContent: number;
  draftContent: number;
  totalReach: number;
  totalEngagement: number;
  averageEngagementRate: number;
  meaningfulInteractions: number;
  communityActions: number;
  topPerformingContent: ContentWithRelations[];
  platformBreakdown: { platform: string; count: number; engagement: number }[];
  agentBreakdown: { agent: string; count: number }[];
}

// Filters
export interface ContentFilters {
  status?: Content['status'][];
  platform?: string[];
  agent?: string[];
  dateRange?: { start: Date; end: Date };
  searchQuery?: string;
}
