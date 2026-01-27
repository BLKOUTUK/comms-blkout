/**
 * Intelligence Aggregation Handler
 * Aggregate intelligence from various BLKOUT services
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../config.js';

/**
 * Handle intelligence aggregation from all services
 */
export async function handleAggregateIntelligence(_req: VercelRequest, res: VercelResponse) {
  console.log('[Herald] Starting intelligence aggregation...');

  try {
    // Aggregate resource trends
    const { data: resources } = await supabase!
      .from('ivor_resources')
      .select('category_id, title')
      .limit(100);

    const categoryCount: Record<string, number> = {};
    resources?.forEach((r: any) => {
      const cat = r.category_id || 'uncategorized';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).slice(0, 3);

    // Aggregate events
    const now = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: upcomingEvents } = await supabase!
      .from('events')
      .select('title, date')
      .gte('date', now)
      .lte('date', nextWeek)
      .order('date', { ascending: true })
      .limit(5);

    // Aggregate articles
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentArticles } = await supabase!
      .from('news_articles')
      .select('title, interest_score')
      .gte('created_at', lastWeek)
      .order('interest_score', { ascending: false })
      .limit(5);

    // Aggregate members from hub_members (community) and governance_members (coop)
    const { data: hubMembers } = await supabase!
      .from('hub_members')
      .select('account_status, role, created_at');

    const { data: govMembers } = await supabase!
      .from('governance_members')
      .select('membership_status, creator_sovereignty_verified, created_at');

    const activeHubMembers = hubMembers?.filter((m: any) => m.account_status === 'active').length || 0;
    const verifiedCreators = govMembers?.filter((m: any) => m.creator_sovereignty_verified === true).length || 0;
    const recentHubJoins = hubMembers?.filter((m: any) => new Date(m.created_at) > new Date(lastWeek)).length || 0;
    const activeGovMembers = govMembers?.filter((m: any) => m.membership_status === 'active').length || 0;

    // Create intelligence records with valid intelligence_type values
    const intelligenceRecords = [
      {
        intelligence_type: 'resources',
        ivor_service: 'ivor_resources',
        ivor_endpoint: '/api/intelligence/resources',
        intelligence_data: { total: resources?.length || 0, categories: categoryCount, topCategories },
        summary: `${resources?.length || 0} community resources across ${Object.keys(categoryCount).length} categories`,
        key_insights: [topCategories[0] ? `Top: ${topCategories[0][0]} (${topCategories[0][1]})` : 'Building resources', topCategories[1] ? `Second: ${topCategories[1][0]} (${topCategories[1][1]})` : ''].filter(Boolean),
        actionable_items: ['Weaver: Promote top resources', 'Herald: Feature in newsletter'],
        relevance_score: 0.8,
        priority: 'medium',
        urgency: 'normal',
        tags: ['resources', 'community'],
      },
      {
        intelligence_type: 'organizing_events',
        ivor_service: 'events',
        ivor_endpoint: '/api/intelligence/events',
        intelligence_data: { upcoming: upcomingEvents?.length || 0, events: upcomingEvents?.map((e: any) => e.title) || [] },
        summary: `${upcomingEvents?.length || 0} events in the next 7 days`,
        key_insights: [upcomingEvents?.[0] ? `Next: ${(upcomingEvents[0] as any).title}` : 'No upcoming events', 'Plan event promotions'],
        actionable_items: ['Herald: Feature events in newsletter', 'Strategist: Plan promotion'],
        relevance_score: (upcomingEvents?.length || 0) > 0 ? 0.9 : 0.6,
        priority: (upcomingEvents?.length || 0) > 3 ? 'high' : 'medium',
        urgency: (upcomingEvents?.length || 0) > 3 ? 'elevated' : 'normal',
        tags: ['events', 'calendar'],
      },
      {
        intelligence_type: 'growth_analytics',
        ivor_service: 'newsroom',
        ivor_endpoint: '/api/intelligence/articles',
        intelligence_data: { count: recentArticles?.length || 0, articles: recentArticles?.map((a: any) => ({ title: a.title, score: a.interest_score })) || [] },
        summary: `${recentArticles?.length || 0} articles published this week`,
        key_insights: [recentArticles?.[0] ? `Top: "${(recentArticles[0] as any).title}"` : 'Creating content', 'Weekly publishing active'],
        actionable_items: ['Herald: Lead with top article', 'Weaver: Repurpose for social'],
        relevance_score: (recentArticles?.length || 0) > 0 ? 0.85 : 0.5,
        priority: (recentArticles?.length || 0) > 3 ? 'high' : 'medium',
        urgency: 'normal',
        tags: ['content', 'articles'],
      },
      {
        intelligence_type: 'community_needs',
        ivor_service: 'community',
        ivor_endpoint: '/api/intelligence/members',
        intelligence_data: { hubMembers: activeHubMembers, govMembers: activeGovMembers, verifiedCreators, recentJoins: recentHubJoins },
        summary: `${activeHubMembers} hub members, ${activeGovMembers} coop members, ${verifiedCreators} verified creators`,
        key_insights: [`Active community: ${activeHubMembers}`, `Coop governance: ${activeGovMembers}`, recentHubJoins > 0 ? `New this week: ${recentHubJoins}` : 'Steady membership'],
        actionable_items: [recentHubJoins > 0 ? 'Griot: Welcome new members' : 'Strategist: Plan recruitment', 'Herald: Celebrate community growth'],
        relevance_score: 0.9,
        priority: recentHubJoins > 0 ? 'high' : 'medium',
        urgency: recentHubJoins > 2 ? 'elevated' : 'normal',
        tags: ['members', 'community', 'coop'],
      },
    ];

    // Upsert records
    let updated = 0;
    for (const record of intelligenceRecords) {
      const { data: existing } = await supabase!.from('ivor_intelligence').select('id').eq('intelligence_type', record.intelligence_type).eq('ivor_service', record.ivor_service).single();

      if (existing) {
        await supabase!.from('ivor_intelligence').update({ ...record, data_timestamp: new Date().toISOString(), updated_at: new Date().toISOString(), is_stale: false, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }).eq('id', existing.id);
      } else {
        await supabase!.from('ivor_intelligence').insert({ ...record, data_timestamp: new Date().toISOString(), is_stale: false, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() });
      }
      updated++;
    }

    console.log(`[Herald] Aggregated ${updated} intelligence records`);
    return res.status(200).json({
      success: true,
      message: 'Intelligence aggregation complete',
      records_updated: updated,
      intelligence: intelligenceRecords.map(r => ({ type: r.intelligence_type, summary: r.summary, priority: r.priority }))
    });
  } catch (error) {
    console.error('[Herald] Intelligence aggregation error:', error);
    return res.status(500).json({ error: 'Intelligence aggregation failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
