/**
 * Intelligence Fetcher
 * Fetch agent intelligence context from Supabase
 */

import { supabase } from '../config.js';
import type { IntelligenceContext } from '../types.js';

const defaultContext: IntelligenceContext = {
  communitySize: 0,
  coopMembers: 0,
  verifiedCreators: 0,
  upcomingEventCount: 0,
  weeklyArticleCount: 0,
  topArticle: null,
  nextEvent: null,
  keyInsights: []
};

/**
 * Fetch agent intelligence for smarter content generation
 */
export async function fetchIntelligence(): Promise<IntelligenceContext> {
  if (!supabase) return defaultContext;

  try {
    const { data: intelligence } = await supabase
      .from('ivor_intelligence')
      .select('intelligence_type, ivor_service, intelligence_data, key_insights, summary')
      .in('ivor_service', ['community', 'events', 'newsroom', 'ivor_resources'])
      .eq('is_stale', false)
      .order('updated_at', { ascending: false });

    if (!intelligence || intelligence.length === 0) return defaultContext;

    const context: IntelligenceContext = { ...defaultContext };

    for (const intel of intelligence) {
      const data = intel.intelligence_data as any;

      // Get member data from community service
      if (intel.ivor_service === 'community' && data) {
        context.communitySize = data.hubMembers || 0;
        context.coopMembers = data.govMembers || 0;
        context.verifiedCreators = data.verifiedCreators || 0;
      }

      // Get event data from events service
      if (intel.ivor_service === 'events' && data) {
        context.upcomingEventCount = data.upcoming || 0;
        context.nextEvent = data.events?.[0] || null;
      }

      // Get article data from newsroom service
      if (intel.ivor_service === 'newsroom' && data) {
        context.weeklyArticleCount = data.count || 0;
        context.topArticle = data.articles?.[0]?.title || null;
      }

      // Collect key insights
      if (intel.key_insights) {
        context.keyInsights.push(...(intel.key_insights as string[]).slice(0, 2));
      }
    }

    console.log('[Herald] Intelligence context:', context);
    return context;
  } catch (error) {
    console.error('[Herald] Error fetching intelligence:', error);
    return defaultContext;
  }
}
