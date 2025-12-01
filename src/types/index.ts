
// Core type definitions for BLKOUT Communications System

// Re-export Grant types for consistent imports
export type {
  Grant,
  GrantStatus,
  Priority,
  FunderType,
  ProjectCategory,
  ScalingTier,
  ReviewRequired,
  GeographicScope,
  GrantReminder,
  GrantStatistics,
  UpcomingDeadline,
  CreateGrantInput,
  UpdateGrantInput,
  GrantOpportunity,
  OpportunityPipeline,
  OpportunityStatus,
  OpportunitySource,
  BidWritingTemplate,
  BidDocument,
  BidWritingSession,
  BidWritingProgress,
} from '../services/grants/types';

export type PlatformType = 'instagram' | 'linkedin' | 'twitter' | 'facebook' | 'tiktok' | 'youtube';

export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export type AgentType = 'griot' | 'listener' | 'weaver' | 'strategist' | 'herald';

export type AgentStatus = 'active' | 'inactive' | 'paused' | 'error';

export interface Platform {
  id: string;
  name: string;
  type: PlatformType;
  isConnected: boolean;
  lastSync?: Date;
  accountHandle?: string;
  accountUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  description: string;
  capabilities: string[];
  configuration?: Record<string, unknown>;
  lastActive?: Date;
  totalContentGenerated?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Content {
  id: string;
  title: string;
  body: string;
  contentType: 'post' | 'story' | 'video' | 'article' | 'thread';
  status: ContentStatus;
  platforms: PlatformType[];
  scheduledFor?: Date;
  publishedAt?: Date;
  agentId?: string;
  agentType?: AgentType;
  mediaUrls?: string[];
  hashtags?: string[];
  mentions?: string[];
  engagementMetrics?: EngagementMetrics;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Draft {
  id: string;
  contentId?: string;
  title: string;
  body: string;
  contentType: 'post' | 'story' | 'video' | 'article' | 'thread';
  platforms: PlatformType[];
  agentId: string;
  agentType: AgentType;
  status: 'pending_review' | 'approved' | 'rejected' | 'needs_revision';
  reviewNotes?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EngagementMetrics {
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  views?: number;
  reach?: number;
  impressions?: number;
  engagementRate?: number;
  conversationDepth?: number; // BLKOUT-specific: quality of community interaction
  relationshipScore?: number; // BLKOUT-specific: trust-building metric
}

export interface CommunityMetrics {
  totalMembers: number;
  activeMembers: number;
  newMembers: number;
  engagementQuality: number; // 0-100 scale
  conversationDepth: number; // Average conversation threads
  trustScore: number; // BLKOUT-specific: community trust indicator
  contentResonance: number; // How well content connects with community
  period: 'day' | 'week' | 'month';
  date: Date;
}

export interface ActivityLog {
  id: string;
  agentId?: string;
  agentType?: AgentType;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
  createdAt: Date;
}

// Auth context type
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Calendar event type
export interface CalendarEvent {
  id: string;
  contentId: string;
  title: string;
  date: Date;
  platforms: PlatformType[];
  agentType?: AgentType;
  status: ContentStatus;
}
