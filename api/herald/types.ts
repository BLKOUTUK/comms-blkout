/**
 * Herald Type Definitions
 */

export interface ContentItem {
  id: string;
  type: 'event' | 'article' | 'resource';
  title: string;
  summary?: string;
  date?: string;
  url?: string;
  image_url?: string;
  relevance_score?: number;
}

export interface NewsletterSection {
  type: string;
  title: string;
  items: ContentItem[];
  intro?: string;
}

export interface IntelligenceContext {
  communitySize: number;
  coopMembers: number;
  verifiedCreators: number;
  upcomingEventCount: number;
  weeklyArticleCount: number;
  topArticle: string | null;
  nextEvent: string | null;
  keyInsights: string[];
}

export interface AgentTask {
  id?: string;
  title: string;
  description?: string;
  targetPlatform?: string;
}

export type EditionType = 'weekly' | 'monthly';

export type AgentType = 'griot' | 'weaver' | 'strategist' | 'listener' | 'concierge';

export const VALID_AGENTS: AgentType[] = ['griot', 'weaver', 'strategist', 'listener', 'concierge'];
