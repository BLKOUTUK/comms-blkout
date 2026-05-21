/**
 * Content Brief Types for AIvor Production Pipeline
 * Structured input for content generation across the agent system
 */

import type { PlatformType, ContentItemStatus } from './campaign';

export type ContentBriefStatus = 'draft' | 'brief_ready' | 'generating' | 'review' | 'approved' | 'scheduled' | 'published';

export type ContentTone = 'celebratory' | 'educational' | 'advocacy' | 'reflective' | 'call_to_action' | 'informational';

export type ContentFormat = 'heritage_spotlight' | 'community_spotlight' | 'governance_update' | 'aivor_wisdom' | 'event_promotion' | 'campaign_post' | 'newsletter' | 'custom';

export interface ContentBrief {
  id: string;
  title: string;
  format: ContentFormat;
  tone: ContentTone;
  platforms: PlatformType[];
  targetDate: string;
  description: string;
  keyMessages: string[];
  hashtags: string[];
  targetAudience: string;
  visualDirection?: string;
  referenceUrls?: string[];
  status: ContentBriefStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineItem {
  id: string;
  brief: ContentBrief;
  generatedScript?: string;
  generatedVisualPrompt?: string;
  generatedVisualUrl?: string;
  platformVariants: PlatformVariant[];
  status: ContentBriefStatus;
  assignedAgent?: string;
  approvalNotes?: string;
  scheduledFor?: string;
}

export interface PlatformVariant {
  platform: PlatformType;
  caption: string;
  hashtags: string[];
  imageUrl?: string;
  status: ContentItemStatus;
}

export const FORMAT_LABELS: Record<ContentFormat, string> = {
  heritage_spotlight: 'Heritage Spotlight',
  community_spotlight: 'Community Spotlight',
  governance_update: 'Governance Update',
  aivor_wisdom: 'AIvor Says',
  event_promotion: 'Event Promotion',
  campaign_post: 'Campaign Post',
  newsletter: 'Newsletter',
  custom: 'Custom',
};

export const TONE_LABELS: Record<ContentTone, string> = {
  celebratory: 'Celebratory',
  educational: 'Educational',
  advocacy: 'Advocacy',
  reflective: 'Reflective',
  call_to_action: 'Call to Action',
  informational: 'Informational',
};

export const FORMAT_AGENTS: Record<ContentFormat, string> = {
  heritage_spotlight: 'griot',
  community_spotlight: 'griot',
  governance_update: 'strategist',
  aivor_wisdom: 'griot',
  event_promotion: 'weaver',
  campaign_post: 'strategist',
  newsletter: 'herald',
  custom: 'griot',
};

export const FORMAT_TEMPLATES: Record<ContentFormat, Partial<ContentBrief>> = {
  heritage_spotlight: {
    tone: 'educational',
    platforms: ['instagram', 'twitter', 'linkedin'],
    keyMessages: ['Historical significance', 'Connection to Black queer community', 'Call to learn more'],
    hashtags: ['#BLKOUT', '#BlackQueerHistory'],
    targetAudience: 'Community members and allies interested in Black LGBTQ+ history',
    visualDirection: 'Portrait or historical image with quote overlay. Brand colours: purple/gold/black.',
  },
  community_spotlight: {
    tone: 'celebratory',
    platforms: ['instagram', 'twitter'],
    keyMessages: ['Member story', 'Community impact', 'Invitation to join'],
    hashtags: ['#BLKOUTCommunity', '#BlackQueerJoy'],
    targetAudience: 'Current and potential BLKOUT community members',
    visualDirection: 'Photo with consent. Quote card format. Warm, joyful aesthetic.',
  },
  governance_update: {
    tone: 'informational',
    platforms: ['linkedin', 'twitter'],
    keyMessages: ['Transparency update', 'Member participation opportunity', 'CBS governance'],
    hashtags: ['#BLKOUT', '#CommunityGovernance', '#CBS'],
    targetAudience: 'CBS members, potential members, sector professionals',
    visualDirection: 'Clean, professional. Infographic style with key metrics.',
  },
  aivor_wisdom: {
    tone: 'reflective',
    platforms: ['instagram'],
    keyMessages: ['Affirmation or wisdom', 'Historical or cultural reference', 'Community empowerment'],
    hashtags: ['#AIvorSays', '#BLKOUT'],
    targetAudience: 'All community members — daily inspiration',
    visualDirection: 'AI-generated quote card with BLKOUT branding. Abstract or symbolic imagery.',
  },
  event_promotion: {
    tone: 'call_to_action',
    platforms: ['instagram', 'twitter', 'facebook'],
    keyMessages: ['Event details', 'Why attend', 'How to RSVP'],
    hashtags: ['#BLKOUT'],
    targetAudience: 'London/UK-based Black queer men and allies',
    visualDirection: 'Event flyer style. Bold date/time. Venue photo if available.',
  },
  campaign_post: {
    tone: 'advocacy',
    platforms: ['instagram', 'twitter', 'linkedin'],
    keyMessages: [],
    hashtags: ['#BLKOUT'],
    targetAudience: 'Broad audience — awareness and engagement',
  },
  newsletter: {
    tone: 'informational',
    platforms: ['email'],
    keyMessages: ['Community updates', 'Upcoming events', 'Resources'],
    hashtags: [],
    targetAudience: 'Newsletter subscribers',
  },
  custom: {
    tone: 'informational',
    platforms: ['instagram'],
    keyMessages: [],
    hashtags: ['#BLKOUT'],
    targetAudience: '',
  },
};
