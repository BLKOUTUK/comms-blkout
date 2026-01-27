/**
 * Herald Newsletter Generation API
 * Main handler for newsletter generation and agent coordination
 *
 * Modular structure:
 * - config.ts: Environment variables and constants
 * - types.ts: TypeScript type definitions
 * - content/: Content fetchers (events, articles, resources, intelligence)
 * - generators/: HTML and intro generation
 * - handlers/: API request handlers (editorial, preview, sendfox, intelligence)
 * - agents/: Agent prompts and execution
 * - cron/: Scheduled job handling
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, NEWSLETTER_SPECS } from './config.js';
import type { NewsletterSection } from './types.js';
import { fetchEvents, fetchArticles, fetchResources, fetchIntelligence } from './content/index.js';
import { generateHTML, generateIntro } from './generators/index.js';
import {
  handleSendEditorialPrompt,
  handleEditorialReply,
  handlePreview,
  handleExport,
  handleSendFoxLists,
  handleSendFoxSend,
  handleAggregateIntelligence
} from './handlers/index.js';
import { handleAgentExecution } from './agents/index.js';
import { handleCronJob } from './cron/index.js';

/**
 * Main API handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  // GET requests handle preview, export, and cron jobs
  if (req.method === 'GET') {
    const { action, job } = req.query;
    if (action === 'preview') return handlePreview(req, res);
    if (action === 'export') return handleExport(req, res);
    if (job && typeof job === 'string') return handleCronJob(job, res);
    return res.status(400).json({ error: 'Invalid action. Use ?action=preview, ?action=export, or ?job=<cron-type>' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Handle POST actions
  const { action, edition_id, edition_type = 'weekly' } = req.body;

  // Editorial actions
  if (action === 'send_editorial_prompt') {
    return handleSendEditorialPrompt(req, res);
  }
  if (action === 'submit_editorial') {
    return handleEditorialReply(req, res);
  }

  // SendFox actions
  if (action === 'sendfox_lists') {
    return handleSendFoxLists(req, res);
  }
  if (action === 'sendfox_send') {
    return handleSendFoxSend(req, res);
  }

  // Intelligence aggregation
  if (action === 'aggregate_intelligence') {
    return handleAggregateIntelligence(req, res);
  }

  // Agent execution - all agents use intelligence
  if (action === 'execute_agent') {
    return handleAgentExecution(req, res);
  }

  // Default: generate newsletter
  if (!['weekly', 'monthly'].includes(edition_type)) {
    return res.status(400).json({ error: 'Invalid edition_type. Must be "weekly" or "monthly"' });
  }

  console.log(`[Herald] Generating ${edition_type} newsletter${edition_id ? ` for edition ${edition_id}` : ''}`);

  try {
    const spec = NEWSLETTER_SPECS[edition_type as keyof typeof NEWSLETTER_SPECS];

    // Fetch content and intelligence in parallel
    const [events, articles, resources, intelligence] = await Promise.all([
      fetchEvents(spec.events),
      fetchArticles(spec.highlights),
      fetchResources(spec.resources),
      fetchIntelligence()
    ]);

    console.log(`[Herald] Fetched: ${events.length} events, ${articles.length} articles, ${resources.length} resources`);
    console.log(`[Herald] Intelligence: ${intelligence.communitySize} hub members, ${intelligence.upcomingEventCount} events tracked`);

    // Build sections
    const sections: NewsletterSection[] = [
      { type: 'highlights', title: 'Community Highlights', items: articles },
      { type: 'events', title: 'Upcoming Events', items: events },
      { type: 'resources', title: 'Community Resources', items: resources }
    ];

    // Generate intro with intelligence context
    const intro = await generateIntro(edition_type, sections, intelligence);

    // Generate title
    const now = new Date();
    const title = edition_type === 'weekly'
      ? `BLKOUT Weekly - ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
      : `BLKOUT Monthly - ${now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;

    // Generate HTML
    const htmlContent = generateHTML(title, intro, sections, edition_type);

    // Build content_sections JSONB
    const contentSections = {
      intro,
      highlights: articles.map(a => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        url: a.url,
        image_url: a.image_url
      })),
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        summary: e.summary,
        date: e.date,
        url: e.url
      })),
      resources: resources.map(r => ({
        id: r.id,
        title: r.title,
        summary: r.summary,
        url: r.url
      }))
    };

    // If edition_id provided, update existing edition
    if (edition_id) {
      const { error: updateError } = await supabase
        .from('newsletter_editions')
        .update({
          title,
          content_sections: contentSections,
          html_content: htmlContent,
          generated_by_agent: 'herald',
          generation_model: 'claude-3.5-haiku',
          status: 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', edition_id);

      if (updateError) {
        console.error('[Herald] Error updating edition:', updateError);
        return res.status(500).json({ error: 'Failed to update edition', details: updateError.message });
      }

      // Insert content items
      const contentItems = [
        ...articles.map((a, i) => ({
          newsletter_id: edition_id,
          content_type: 'article',
          content_id: a.id,
          content_table: 'news_articles',
          section: 'highlights',
          display_order: i,
          headline: a.title,
          summary: a.summary,
          image_url: a.image_url,
          cta_url: a.url
        })),
        ...events.map((e, i) => ({
          newsletter_id: edition_id,
          content_type: 'event',
          content_id: e.id,
          content_table: 'events',
          section: 'events',
          display_order: i,
          headline: e.title,
          summary: e.summary,
          cta_url: e.url
        })),
        ...resources.map((r, i) => ({
          newsletter_id: edition_id,
          content_type: 'resource',
          content_id: r.id,
          content_table: 'ivor_resources',
          section: 'resources',
          display_order: i,
          headline: r.title,
          summary: r.summary,
          cta_url: r.url
        }))
      ];

      if (contentItems.length > 0) {
        // Clear existing items first
        await supabase
          .from('newsletter_content_items')
          .delete()
          .eq('newsletter_id', edition_id);

        const { error: itemsError } = await supabase
          .from('newsletter_content_items')
          .insert(contentItems);

        if (itemsError) {
          console.error('[Herald] Error inserting content items:', itemsError);
        }
      }

      return res.status(200).json({
        success: true,
        edition_id,
        title,
        stats: {
          highlights: articles.length,
          events: events.length,
          resources: resources.length
        },
        html_preview: htmlContent.substring(0, 500) + '...'
      });
    }

    // Get next edition number
    const { data: editionNumResult } = await supabase
      .rpc('get_next_edition_number', { p_edition_type: edition_type });
    const editionNumber = editionNumResult || 1;

    // Create new edition
    const { data: newEdition, error: createError } = await supabase
      .from('newsletter_editions')
      .insert({
        edition_type,
        edition_number: editionNumber,
        edition_date: new Date().toISOString().split('T')[0],
        title,
        subject_line: title,
        preview_text: intro.substring(0, 150),
        content_sections: contentSections,
        html_content: htmlContent,
        generated_by_agent: 'herald',
        generation_model: 'claude-3.5-haiku',
        status: 'draft'
      })
      .select()
      .single();

    if (createError) {
      console.error('[Herald] Error creating edition:', createError);
      return res.status(500).json({ error: 'Failed to create edition', details: createError.message });
    }

    // Insert content items for new edition
    const contentItems = [
      ...articles.map((a, i) => ({
        newsletter_id: newEdition.id,
        content_type: 'article',
        content_id: a.id,
        content_table: 'news_articles',
        section: 'highlights',
        display_order: i,
        headline: a.title,
        summary: a.summary,
        image_url: a.image_url,
        cta_url: a.url
      })),
      ...events.map((e, i) => ({
        newsletter_id: newEdition.id,
        content_type: 'event',
        content_id: e.id,
        content_table: 'events',
        section: 'events',
        display_order: i,
        headline: e.title,
        summary: e.summary,
        cta_url: e.url
      })),
      ...resources.map((r, i) => ({
        newsletter_id: newEdition.id,
        content_type: 'resource',
        content_id: r.id,
        content_table: 'ivor_resources',
        section: 'resources',
        display_order: i,
        headline: r.title,
        summary: r.summary,
        cta_url: r.url
      }))
    ];

    if (contentItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('newsletter_content_items')
        .insert(contentItems);

      if (itemsError) {
        console.error('[Herald] Error inserting content items:', itemsError);
      }
    }

    return res.status(200).json({
      success: true,
      edition_id: newEdition.id,
      title,
      stats: {
        highlights: articles.length,
        events: events.length,
        resources: resources.length
      },
      html_preview: htmlContent.substring(0, 500) + '...'
    });

  } catch (error) {
    console.error('[Herald] Error:', error);
    return res.status(500).json({
      error: 'Failed to generate newsletter',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
