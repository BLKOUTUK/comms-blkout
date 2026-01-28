/**
 * Campaign types for BLKOUT Communications System
 * Defines structures for campaign management, content tracking, and pipeline health
 */

// Content item status - maps to content readiness
export type ContentItemStatus = 'draft' | 'ready' | 'scheduled' | 'published';

// Platform types
export type PlatformType = 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'tiktok' | 'email' | 'website' | 'newsletter';

// Campaign content types for different platforms
export type CampaignContentType =
  | 'instagram_carousel'
  | 'instagram_story'
  | 'instagram_reel'
  | 'twitter_thread'
  | 'twitter_post'
  | 'linkedin_post'
  | 'tiktok_video'
  | 'newsletter'
  | 'video'
  | 'article'
  | 'social'
  | 'graphic'
  | 'blog';

// Individual content item within a campaign
export interface CampaignContentItem {
  id: string;
  type: CampaignContentType;
  platform: PlatformType | 'all' | 'internal';
  title: string;
  content: string | string[];
  timing?: string;
  scheduledFor?: Date;
  status: ContentItemStatus;
  hashtags?: string[];
  metadata?: Record<string, unknown>;
  assignedAgent?: string;
}

// Agent task assignment
export interface CampaignAgentTask {
  agentType: string;
  agentName?: string;
  taskId: string;
  prompt: string;
  targetPlatform: PlatformType | 'all' | 'email' | 'research';
  priority: 'high' | 'medium' | 'low';
  status: ContentItemStatus;
  tasks?: string[];
}

// Campaign phase/timeline
export interface CampaignPhase {
  id: string;
  name: string;
  dates: string;
  theme: string;
  activities: string[];
}

// Newsletter content structure
export interface CampaignNewsletter {
  enabled: boolean;
  subject?: string;
  subjectLine?: string;
  preheader?: string;
  body?: string;
  sendDate?: string;
  ctaLinks?: string[];
  status?: ContentItemStatus;
}

// Visual assets configuration
export interface CampaignVisuals {
  enabled: boolean;
  canvaFolderId?: string;
  requiredAssets?: string[];
}

// Campaign metrics
export interface CampaignMetrics {
  trackingEnabled: boolean;
  kpis?: string[];
  targetReach?: number;
  targetEngagementRate?: number;
  targetApplications?: number;
  targetRegistrations?: number;
  applications?: number;
  customMetrics?: Record<string, number | string>;
}

// Full campaign definition
export interface Campaign {
  id: string;
  name: string;
  slug: string;
  launchDate: string;
  endDate: string;
  tagline: string;
  mission: string;
  voice: string;
  signaturePhrases: string[];
  phases: CampaignPhase[];
  platforms: PlatformType[];
  content: CampaignContentItem[];
  contentItems: CampaignContentItem[];
  agentTasks: CampaignAgentTask[];
  newsletter: CampaignNewsletter | null;
  visuals: CampaignVisuals;
  metrics: CampaignMetrics;
  rawData?: Record<string, unknown>;
}

// Campaign summary for list views
export interface CampaignSummary {
  id: string;
  name: string;
  slug: string;
  launchDate: string;
  endDate: string;
  tagline: string;
  totalContentItems: number;
  completedContentItems: number;
  totalAgentTasks: number;
  completedAgentTasks: number;
  isActive: boolean;
  progressPercentage: number;
}

// Schedule event type for calendar integration
export interface ScheduleEvent {
  id: string;
  campaignId: string;
  campaignName: string;
  title: string;
  description?: string;
  date: Date;
  endDate?: Date;
  type: 'milestone' | 'content_deadline' | 'publish' | 'review' | 'phase_start' | 'phase_end';
  platform?: PlatformType | 'all' | 'internal';
  contentId?: string;
  status: ContentItemStatus;
  color?: string;
}

// Health check result for pipeline monitoring
export interface HealthCheck {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message?: string;
  category: 'config' | 'content' | 'scheduling' | 'agents' | 'metrics' | 'newsletter' | 'social' | 'visuals';
  campaignId: string;
  checkedAt: Date;
}

// Overall pipeline health status
export type PipelineStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

// Column definition for Kanban/status board views
export interface StatusColumn {
  status: ContentItemStatus;
  items: CampaignContentItem[];
  count: number;
}

// Totals for content status tracking
export interface ContentTotals {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  review: number;
}
