/**
 * Newsletter Generator Service
 *
 * Intelligent content selection and newsletter generation for BLKOUT community.
 * Queries intelligence and content sources to assemble newsletters with
 * optimal content per section.
 *
 * @author Herald Agent System
 * @version 2.0.0
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Types for newsletter content structure
export interface Article {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  interestScore: number;
  category?: string;
  author?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time?: string;
  location?: string;
  url: string;
  imageUrl?: string;
  relevanceScore: number;
  eventType?: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  priority: number;
}

export interface Proposal {
  id: string;
  title: string;
  summary: string;
  status: string;
  votingDeadline?: Date;
  proposer?: string;
}

export interface Achievement {
  id: string;
  memberName: string;
  description: string;
  type: 'milestone' | 'creator' | 'contribution' | 'anniversary';
  date: Date;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  priority: number;
}

// Weekly newsletter structure as per spec
export interface WeeklyNewsletter {
  highlights: Article[];        // 3 max
  upcomingEvents: Event[];      // 5 max
  communityVoice: {
    proposals: Proposal[];
    achievements: Achievement[];
  };
  resourcesSpotlight: Resource[]; // 2 max
  callToAction: Campaign | null;
  intro: string;
  editorNote?: string;
  generatedAt: Date;
}

// Monthly newsletter structure
export interface MonthlyNewsletter {
  highlights: Article[];        // 5 max
  upcomingEvents: Event[];      // 4 max
  communityVoice: {
    proposals: Proposal[];
    achievements: Achievement[];
  };
  resourcesSpotlight: Resource[]; // 3 max
  monthInReview: {
    eventCount: number;
    memberCount: number;
    articleCount: number;
    newCreators: number;
  };
  callToAction: Campaign | null;
  intro: string;
  editorNote?: string;
  generatedAt: Date;
}

// Content selection configuration
interface ContentSelectionConfig {
  maxHighlights: number;
  maxEvents: number;
  maxResources: number;
  lookbackDays: number;
  lookforwardDays: number;
}

const WEEKLY_CONFIG: ContentSelectionConfig = {
  maxHighlights: 3,
  maxEvents: 5,
  maxResources: 2,
  lookbackDays: 7,
  lookforwardDays: 14,
};

const MONTHLY_CONFIG: ContentSelectionConfig = {
  maxHighlights: 5,
  maxEvents: 4,
  maxResources: 3,
  lookbackDays: 30,
  lookforwardDays: 30,
};

/**
 * Newsletter Generator Service
 *
 * Provides methods for content selection and newsletter assembly.
 */
export class NewsletterGeneratorService {
  private static instance: NewsletterGeneratorService;

  private constructor() {}

  static getInstance(): NewsletterGeneratorService {
    if (!NewsletterGeneratorService.instance) {
      NewsletterGeneratorService.instance = new NewsletterGeneratorService();
    }
    return NewsletterGeneratorService.instance;
  }

  /**
   * Fetch top articles based on interest score and recency
   */
  async fetchTopArticles(limit: number, lookbackDays: number): Promise<Article[]> {
    if (!isSupabaseConfigured()) {
      return this.getMockArticles(limit);
    }

    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('id, title, excerpt, source_url, featured_image, published_at, interest_score, category')
        .eq('status', 'published')
        .gte('published_at', lookbackDate.toISOString())
        .order('interest_score', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(a => ({
        id: a.id,
        title: a.title,
        excerpt: a.excerpt || '',
        url: a.source_url || `https://news.blkoutuk.com/article/${a.id}`,
        imageUrl: a.featured_image,
        publishedAt: new Date(a.published_at),
        interestScore: a.interest_score || 0,
        category: a.category,
      }));
    } catch (error) {
      console.error('[NewsletterGenerator] Error fetching articles:', error);
      return [];
    }
  }

  /**
   * Fetch upcoming events sorted by relevance and date
   */
  async fetchUpcomingEvents(limit: number, lookforwardDays: number): Promise<Event[]> {
    if (!isSupabaseConfigured()) {
      return this.getMockEvents(limit);
    }

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + lookforwardDays);

    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, date, start_time, location, url, image_url, relevance_score, event_type')
        .eq('status', 'approved')
        .gte('date', now.toISOString().split('T')[0])
        .lte('date', futureDate.toISOString().split('T')[0])
        .order('relevance_score', { ascending: false })
        .order('date', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(e => ({
        id: e.id,
        title: e.title,
        description: e.description?.substring(0, 200) || '',
        date: new Date(e.date),
        time: e.start_time,
        location: e.location,
        url: e.url || `https://events.blkoutuk.com`,
        imageUrl: e.image_url,
        relevanceScore: e.relevance_score || 0,
        eventType: e.event_type,
      }));
    } catch (error) {
      console.error('[NewsletterGenerator] Error fetching events:', error);
      return [];
    }
  }

  /**
   * Fetch community resources by priority
   */
  async fetchResources(limit: number): Promise<Resource[]> {
    if (!isSupabaseConfigured()) {
      return this.getMockResources(limit);
    }

    try {
      const { data, error } = await supabase
        .from('ivor_resources')
        .select(`
          id, title, description, website_url, priority,
          ivor_categories (name)
        `)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(r => ({
        id: r.id,
        title: r.title,
        description: r.description?.substring(0, 150) || '',
        url: r.website_url || '#',
        category: (r.ivor_categories as any)?.name || 'General',
        priority: r.priority || 0,
      }));
    } catch (error) {
      console.error('[NewsletterGenerator] Error fetching resources:', error);
      return [];
    }
  }

  /**
   * Fetch active governance proposals
   */
  async fetchProposals(limit: number = 3): Promise<Proposal[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('governance_proposals')
        .select('id, title, summary, status, voting_deadline, proposer_id')
        .in('status', ['active', 'voting'])
        .order('voting_deadline', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(p => ({
        id: p.id,
        title: p.title,
        summary: p.summary?.substring(0, 150) || '',
        status: p.status,
        votingDeadline: p.voting_deadline ? new Date(p.voting_deadline) : undefined,
      }));
    } catch (error) {
      console.error('[NewsletterGenerator] Error fetching proposals:', error);
      return [];
    }
  }

  /**
   * Fetch community achievements and milestones
   */
  async fetchAchievements(limit: number = 3): Promise<Achievement[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      // Try to fetch from member milestones or achievements table
      const { data, error } = await supabase
        .from('governance_members')
        .select('id, display_name, creator_sovereignty_verified, verified_at')
        .eq('creator_sovereignty_verified', true)
        .order('verified_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(m => ({
        id: m.id,
        memberName: m.display_name || 'Community Member',
        description: 'Achieved verified creator status',
        type: 'creator' as const,
        date: new Date(m.verified_at || new Date()),
      }));
    } catch (error) {
      console.error('[NewsletterGenerator] Error fetching achievements:', error);
      return [];
    }
  }

  /**
   * Fetch active campaign for CTA
   */
  async fetchActiveCampaign(): Promise<Campaign | null> {
    if (!isSupabaseConfigured()) {
      return this.getMockCampaign();
    }

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, title, description, cta_text, cta_url, priority')
        .eq('status', 'active')
        .order('priority', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        ctaText: data.cta_text || 'Learn More',
        ctaUrl: data.cta_url || 'https://blkoutuk.com',
        priority: data.priority || 0,
      };
    } catch (error) {
      console.error('[NewsletterGenerator] Error fetching campaign:', error);
      return null;
    }
  }

  /**
   * Fetch community intelligence for intro generation
   */
  async fetchIntelligence(): Promise<{
    communitySize: number;
    coopMembers: number;
    recentJoins: number;
    topInsight: string;
  }> {
    if (!isSupabaseConfigured()) {
      return {
        communitySize: 1500,
        coopMembers: 45,
        recentJoins: 12,
        topInsight: 'Community engagement is strong this week',
      };
    }

    try {
      // Fetch from intelligence table
      const { data: intel } = await supabase
        .from('ivor_intelligence')
        .select('intelligence_data, key_insights, summary')
        .eq('ivor_service', 'community')
        .eq('is_stale', false)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      const intelligenceData = intel?.intelligence_data as any;

      return {
        communitySize: intelligenceData?.hubMembers || 0,
        coopMembers: intelligenceData?.govMembers || 0,
        recentJoins: intelligenceData?.recentJoins || 0,
        topInsight: (intel?.key_insights as string[])?.[0] || intel?.summary || '',
      };
    } catch (error) {
      return {
        communitySize: 0,
        coopMembers: 0,
        recentJoins: 0,
        topInsight: '',
      };
    }
  }

  /**
   * Generate a weekly newsletter with optimal content selection
   */
  async generateWeeklyNewsletter(): Promise<WeeklyNewsletter> {
    const config = WEEKLY_CONFIG;

    // Fetch all content in parallel
    const [highlights, events, resources, proposals, achievements, campaign, intelligence] = await Promise.all([
      this.fetchTopArticles(config.maxHighlights, config.lookbackDays),
      this.fetchUpcomingEvents(config.maxEvents, config.lookforwardDays),
      this.fetchResources(config.maxResources),
      this.fetchProposals(2),
      this.fetchAchievements(2),
      this.fetchActiveCampaign(),
      this.fetchIntelligence(),
    ]);

    // Generate intro based on content
    const intro = this.generateIntroText('weekly', {
      articleCount: highlights.length,
      eventCount: events.length,
      ...intelligence,
    });

    return {
      highlights,
      upcomingEvents: events,
      communityVoice: {
        proposals,
        achievements,
      },
      resourcesSpotlight: resources,
      callToAction: campaign,
      intro,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate a monthly newsletter with optimal content selection
   */
  async generateMonthlyNewsletter(): Promise<MonthlyNewsletter> {
    const config = MONTHLY_CONFIG;

    // Fetch all content in parallel
    const [highlights, events, resources, proposals, achievements, campaign, intelligence] = await Promise.all([
      this.fetchTopArticles(config.maxHighlights, config.lookbackDays),
      this.fetchUpcomingEvents(config.maxEvents, config.lookforwardDays),
      this.fetchResources(config.maxResources),
      this.fetchProposals(3),
      this.fetchAchievements(3),
      this.fetchActiveCampaign(),
      this.fetchIntelligence(),
    ]);

    // Generate intro based on content
    const intro = this.generateIntroText('monthly', {
      articleCount: highlights.length,
      eventCount: events.length,
      ...intelligence,
    });

    // Calculate month in review stats
    const monthInReview = {
      eventCount: events.length,
      memberCount: intelligence.communitySize,
      articleCount: highlights.length,
      newCreators: achievements.filter(a => a.type === 'creator').length,
    };

    return {
      highlights,
      upcomingEvents: events,
      communityVoice: {
        proposals,
        achievements,
      },
      resourcesSpotlight: resources,
      monthInReview,
      callToAction: campaign,
      intro,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate newsletter structure (without HTML)
   */
  async generateNewsletterStructure(type: 'weekly' | 'monthly'): Promise<WeeklyNewsletter | MonthlyNewsletter> {
    if (type === 'weekly') {
      return this.generateWeeklyNewsletter();
    }
    return this.generateMonthlyNewsletter();
  }

  /**
   * Generate contextual intro text
   */
  private generateIntroText(
    type: 'weekly' | 'monthly',
    context: {
      articleCount: number;
      eventCount: number;
      communitySize: number;
      topInsight: string;
    }
  ): string {
    const { articleCount, eventCount, communitySize, topInsight: _topInsight } = context; // topInsight reserved for future personalization

    if (type === 'weekly') {
      if (eventCount >= 3) {
        return `It's going to be a busy week for our community! We have ${eventCount} exciting events lined up, plus ${articleCount} stories to catch up on. Here's everything you need to know.`;
      }
      return `Another week of Black queer joy, connection, and community. We've got ${articleCount > 0 ? `${articleCount} stories` : 'updates'} and ${eventCount > 0 ? `${eventCount} events` : 'opportunities'} to share with you.`;
    }

    // Monthly intro
    if (communitySize > 0) {
      return `What a month it's been! Our community of ${communitySize.toLocaleString()} members continues to grow and thrive. Here's your monthly dose of everything BLKOUT - the highlights, the moments, and what's coming next.`;
    }
    return `Welcome to your monthly roundup from BLKOUT. We're celebrating community wins, sharing upcoming opportunities, and keeping you connected to what matters most.`;
  }

  // Mock data methods for development
  private getMockArticles(limit: number): Article[] {
    const articles: Article[] = [
      {
        id: 'mock-1',
        title: 'Black Queer Joy: Community Stories from Pride Month',
        excerpt: 'Members share their experiences of celebration, connection, and resistance during this year\'s Pride celebrations across the UK.',
        url: 'https://news.blkoutuk.com/black-queer-joy',
        imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        interestScore: 95,
        category: 'Community',
      },
      {
        id: 'mock-2',
        title: 'New Mental Health Resources Available for Our Community',
        excerpt: 'IVOR now connects you with culturally competent therapists and support groups specifically for Black LGBTQ+ individuals.',
        url: 'https://news.blkoutuk.com/mental-health-resources',
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        interestScore: 88,
        category: 'Resources',
      },
      {
        id: 'mock-3',
        title: 'Creator Spotlight: Meet Our Newest Verified Creators',
        excerpt: 'We\'re celebrating the artists, writers, and community builders who make BLKOUT special.',
        url: 'https://news.blkoutuk.com/creator-spotlight',
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        interestScore: 82,
        category: 'Spotlight',
      },
    ];
    return articles.slice(0, limit);
  }

  private getMockEvents(limit: number): Event[] {
    const events: Event[] = [
      {
        id: 'event-1',
        title: 'Community Social: Sunday Brunch',
        description: 'Join us for a relaxed Sunday brunch in East London. Great food, better company.',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        time: '12:00',
        location: 'East London',
        url: 'https://events.blkoutuk.com/sunday-brunch',
        relevanceScore: 90,
        eventType: 'Social',
      },
      {
        id: 'event-2',
        title: 'Wellness Workshop: Meditation for Liberation',
        description: 'A guided meditation session focusing on ancestral healing and self-care.',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        time: '19:00',
        location: 'Online',
        url: 'https://events.blkoutuk.com/meditation-workshop',
        relevanceScore: 85,
        eventType: 'Wellness',
      },
      {
        id: 'event-3',
        title: 'Black Queer Book Club',
        description: 'Discussing "Real Life" by Brandon Taylor. All welcome.',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        time: '18:30',
        location: 'Central London',
        url: 'https://events.blkoutuk.com/book-club',
        relevanceScore: 78,
        eventType: 'Cultural',
      },
    ];
    return events.slice(0, limit);
  }

  private getMockResources(limit: number): Resource[] {
    const resources: Resource[] = [
      {
        id: 'resource-1',
        title: 'Black Minds Matter UK',
        description: 'Connecting Black communities with culturally competent mental health support.',
        url: 'https://blackmindsmatteruk.com',
        category: 'Mental Health',
        priority: 95,
      },
      {
        id: 'resource-2',
        title: 'UK Black Pride',
        description: 'Europe\'s largest celebration for LGBTQI+ people of African, Asian, Caribbean, Middle Eastern and Latin American descent.',
        url: 'https://ukblackpride.org.uk',
        category: 'Community',
        priority: 90,
      },
    ];
    return resources.slice(0, limit);
  }

  private getMockCampaign(): Campaign {
    return {
      id: 'campaign-1',
      title: 'Become a BLKOUT Member',
      description: 'Join our cooperative and help shape the future of our community platform.',
      ctaText: 'Join Now',
      ctaUrl: 'https://blkoutuk.com/membership',
      priority: 100,
    };
  }
}

// Export singleton instance
export const newsletterGenerator = NewsletterGeneratorService.getInstance();
