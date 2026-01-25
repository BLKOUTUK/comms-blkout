import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDFOX_API_KEY = process.env.SENDFOX_API_KEY;
const EDITOR_EMAIL = process.env.EDITOR_EMAIL || 'rob@blkoutuk.com';
const EDITOR_NAME = process.env.EDITOR_NAME || 'Rob';
const EDITOR_AVATAR_URL = process.env.EDITOR_AVATAR_URL || 'https://comms-blkout.vercel.app/images/editor-avatar.png';

// SendFox list mapping
const SENDFOX_LISTS = {
  weekly_engaged: 538297,    // BLKOUT Hub (93 subscribers)
  monthly_circle: 538162,    // My First List (1,223 subscribers)
  coop_members: 591727,      // Coop Founding Members (13 subscribers)
  founder_members: 592260    // FounderMembers (4 subscribers)
};

// Initialize Supabase client
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

// Newsletter content specs from PRD
const NEWSLETTER_SPECS = {
  weekly: {
    name: 'Weekly Newsletter',
    highlights: 3,
    events: 5,
    resources: 2,
    tone: 'energetic, community-focused, action-oriented'
  },
  monthly: {
    name: 'Monthly Newsletter',
    highlights: 5,
    events: 4,
    resources: 3,
    stories: 2,
    tone: 'reflective, celebratory, comprehensive'
  }
};

interface ContentItem {
  id: string;
  type: 'event' | 'article' | 'resource';
  title: string;
  summary?: string;
  date?: string;
  url?: string;
  image_url?: string;
  relevance_score?: number;
}

interface NewsletterSection {
  type: string;
  title: string;
  items: ContentItem[];
  intro?: string;
}

// Fetch upcoming events
async function fetchEvents(limit: number): Promise<ContentItem[]> {
  if (!supabase) return [];

  const now = new Date();
  const twoWeeksOut = new Date(now);
  twoWeeksOut.setDate(now.getDate() + 14);

  const { data, error } = await supabase
    .from('events')
    .select('id, title, description, date, start_time, location, url, relevance_score')
    .eq('status', 'approved')
    .gte('date', now.toISOString().split('T')[0])
    .lte('date', twoWeeksOut.toISOString().split('T')[0])
    .order('relevance_score', { ascending: false })
    .order('date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[Herald] Error fetching events:', error);
    return [];
  }

  return (data || []).map(e => ({
    id: e.id,
    type: 'event' as const,
    title: e.title,
    summary: e.description?.substring(0, 150) + (e.description?.length > 150 ? '...' : ''),
    date: e.date,
    url: e.url || `https://events.blkoutuk.com`,
    relevance_score: e.relevance_score
  }));
}

// Fetch recent articles/news
async function fetchArticles(limit: number): Promise<ContentItem[]> {
  if (!supabase) return [];

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('news_articles')
    .select('id, title, excerpt, featured_image, source_url, interest_score, published_at')
    .eq('status', 'published')
    .gte('published_at', oneWeekAgo.toISOString())
    .order('interest_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Herald] Error fetching articles:', error);
    return [];
  }

  return (data || []).map(a => ({
    id: a.id,
    type: 'article' as const,
    title: a.title,
    summary: a.excerpt,
    url: a.source_url,
    image_url: a.featured_image,
    relevance_score: a.interest_score
  }));
}

// Fetch community resources
async function fetchResources(limit: number): Promise<ContentItem[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('ivor_resources')
    .select('id, title, description, website_url, priority')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Herald] Error fetching resources:', error);
    return [];
  }

  return (data || []).map(r => ({
    id: r.id,
    type: 'resource' as const,
    title: r.title,
    summary: r.description?.substring(0, 150) + (r.description?.length > 150 ? '...' : ''),
    url: r.website_url,
    relevance_score: r.priority
  }));
}

// Fetch agent intelligence for smarter content
interface IntelligenceContext {
  communitySize: number;
  coopMembers: number;
  verifiedCreators: number;
  upcomingEventCount: number;
  weeklyArticleCount: number;
  topArticle: string | null;
  nextEvent: string | null;
  keyInsights: string[];
}

async function fetchIntelligence(): Promise<IntelligenceContext> {
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

  if (!supabase) return defaultContext;

  try {
    // Fetch from ivor_intelligence table directly (view doesn't have intelligence_data)
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

// Generate newsletter intro using Claude with intelligence context
async function generateIntro(
  editionType: string,
  sections: NewsletterSection[],
  intelligence?: IntelligenceContext
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    return editionType === 'weekly'
      ? "Here's what's happening in our community this week!"
      : "Here's your monthly roundup of everything BLKOUT!";
  }

  const eventCount = sections.find(s => s.type === 'events')?.items.length || 0;
  const articleCount = sections.find(s => s.type === 'highlights')?.items.length || 0;

  // Build intelligence-informed context
  let intelligenceContext = '';
  if (intelligence && intelligence.communitySize > 0) {
    intelligenceContext = `
Community Intelligence:
- Our community has grown to ${intelligence.communitySize} hub members${intelligence.coopMembers > 0 ? ` and ${intelligence.coopMembers} coop members` : ''}
${intelligence.verifiedCreators > 0 ? `- ${intelligence.verifiedCreators} verified creators are sharing their work` : ''}
${intelligence.topArticle ? `- This week's top story: "${intelligence.topArticle}"` : ''}
${intelligence.nextEvent ? `- Don't miss: ${intelligence.nextEvent}` : ''}
${intelligence.keyInsights.length > 0 ? `- Key insight: ${intelligence.keyInsights[0]}` : ''}`;
  }

  const prompt = `Write a warm, engaging 2-3 sentence newsletter introduction for BLKOUT UK's ${editionType} newsletter.

Context:
- BLKOUT UK is a community platform for Black LGBTQ+ people in the UK
- This edition features ${eventCount} upcoming events and ${articleCount} community highlights
- Tone: ${NEWSLETTER_SPECS[editionType as keyof typeof NEWSLETTER_SPECS]?.tone || 'warm and community-focused'}
${intelligenceContext}

Write ONLY the introduction text, no greeting or sign-off. Be authentic, not corporate. If there's community growth or notable content, weave it naturally into the intro.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://comms-blkout.vercel.app',
        'X-Title': 'BLKOUT Herald Newsletter'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.error('[Herald] OpenRouter error:', response.status);
      return editionType === 'weekly'
        ? "Here's what's happening in our community this week!"
        : "Here's your monthly roundup of everything BLKOUT!";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "Here's what's happening in our community!";
  } catch (error) {
    console.error('[Herald] Error generating intro:', error);
    return "Here's what's happening in our community!";
  }
}

// Generate HTML newsletter
function generateHTML(
  title: string,
  intro: string,
  sections: NewsletterSection[],
  editionType: string
): string {
  const eventSection = sections.find(s => s.type === 'events');
  const highlightSection = sections.find(s => s.type === 'highlights');
  const resourceSection = sections.find(s => s.type === 'resources');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
    .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #4a1942 100%); padding: 30px; text-align: center; }
    .header img { max-width: 120px; margin-bottom: 15px; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header .subtitle { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 8px; }
    .content { padding: 30px; }
    .intro { font-size: 16px; color: #555; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 20px; color: #1a1a2e; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 3px solid #e91e63; display: inline-block; }
    .event-card { background: #fafafa; border-radius: 8px; padding: 15px; margin-bottom: 12px; border-left: 4px solid #e91e63; }
    .event-card h3 { margin: 0 0 8px 0; font-size: 16px; color: #1a1a2e; }
    .event-card .date { color: #e91e63; font-weight: 600; font-size: 13px; margin-bottom: 5px; }
    .event-card p { margin: 0; font-size: 14px; color: #666; }
    .event-card a { color: #e91e63; text-decoration: none; font-weight: 600; }
    .highlight-card { background: linear-gradient(135deg, #fff5f8 0%, #fff 100%); border-radius: 8px; padding: 15px; margin-bottom: 12px; }
    .highlight-card h3 { margin: 0 0 8px 0; font-size: 16px; color: #1a1a2e; }
    .highlight-card p { margin: 0; font-size: 14px; color: #666; }
    .highlight-card a { color: #e91e63; text-decoration: none; font-weight: 600; }
    .resource-item { padding: 12px 0; border-bottom: 1px solid #eee; }
    .resource-item:last-child { border-bottom: none; }
    .resource-item h4 { margin: 0 0 5px 0; font-size: 15px; }
    .resource-item h4 a { color: #1a1a2e; text-decoration: none; }
    .resource-item p { margin: 0; font-size: 13px; color: #777; }
    .cta-box { background: linear-gradient(135deg, #e91e63 0%, #9c27b0 100%); border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0; }
    .cta-box h3 { color: white; margin: 0 0 10px 0; }
    .cta-box p { color: rgba(255,255,255,0.9); margin: 0 0 15px 0; font-size: 14px; }
    .cta-button { display: inline-block; background: white; color: #e91e63; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600; }
    .footer { background: #1a1a2e; padding: 25px; text-align: center; color: rgba(255,255,255,0.7); font-size: 12px; }
    .footer a { color: #e91e63; text-decoration: none; }
    .social-links { margin: 15px 0; }
    .social-links a { margin: 0 10px; color: white; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://blkoutuk.com/images/blkout_logo_roundel_colour.png" alt="BLKOUT">
      <h1>${title}</h1>
      <div class="subtitle">${editionType === 'weekly' ? 'Weekly Community Update' : 'Monthly Community Roundup'}</div>
    </div>

    <div class="content">
      <div class="intro">${intro}</div>

      ${highlightSection && highlightSection.items.length > 0 ? `
      <div class="section">
        <h2 class="section-title">✨ Community Highlights</h2>
        ${highlightSection.items.map(item => `
        <div class="highlight-card">
          <h3>${item.title}</h3>
          ${item.summary ? `<p>${item.summary}</p>` : ''}
          ${item.url ? `<p style="margin-top: 10px;"><a href="${item.url}">Read more →</a></p>` : ''}
        </div>
        `).join('')}
      </div>
      ` : ''}

      ${eventSection && eventSection.items.length > 0 ? `
      <div class="section">
        <h2 class="section-title">📅 Upcoming Events</h2>
        ${eventSection.items.map(item => `
        <div class="event-card">
          ${item.date ? `<div class="date">${new Date(item.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>` : ''}
          <h3>${item.title}</h3>
          ${item.summary ? `<p>${item.summary}</p>` : ''}
          ${item.url ? `<p style="margin-top: 10px;"><a href="${item.url}">Learn more →</a></p>` : ''}
        </div>
        `).join('')}
      </div>
      ` : ''}

      ${resourceSection && resourceSection.items.length > 0 ? `
      <div class="section">
        <h2 class="section-title">📚 Community Resources</h2>
        ${resourceSection.items.map(item => `
        <div class="resource-item">
          <h4><a href="${item.url || '#'}">${item.title}</a></h4>
          ${item.summary ? `<p>${item.summary}</p>` : ''}
        </div>
        `).join('')}
      </div>
      ` : ''}

      <div class="cta-box">
        <h3>Join Our Community</h3>
        <p>Connect with Black LGBTQ+ people across the UK. Share your experiences, find support, and celebrate together.</p>
        <a href="https://blkoutuk.com" class="cta-button">Visit BLKOUT</a>
      </div>
    </div>

    <div class="footer">
      <div class="social-links">
        <a href="https://instagram.com/blkout_uk">Instagram</a>
        <a href="https://linkedin.com/company/blkout-uk">LinkedIn</a>
      </div>
      <p>BLKOUT UK - Technology for Black Queer Liberation</p>
      <p>
        <a href="https://blkoutuk.com">Website</a> |
        <a href="mailto:info@blkoutuk.com">Contact</a>
      </p>
      <p style="margin-top: 15px; font-size: 11px;">
        You're receiving this because you subscribed to BLKOUT updates.<br>
        <a href="{unsubscribe_url}">Unsubscribe</a> | <a href="{preferences_url}">Update preferences</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// Send editorial prompt email
async function handleSendEditorialPrompt(req: VercelRequest, res: VercelResponse) {
  const { edition_id } = req.body;

  if (!edition_id) {
    return res.status(400).json({ error: 'Missing edition_id' });
  }

  // Get edition details
  const { data: edition, error } = await supabase!
    .from('newsletter_editions')
    .select('id, title, edition_type, content_sections')
    .eq('id', edition_id)
    .single();

  if (error || !edition) {
    return res.status(404).json({ error: 'Edition not found' });
  }

  // Build email content with newsletter summary
  const contentSections = edition.content_sections as {
    highlights?: { title: string }[];
    events?: { title: string; date: string }[];
  } | null;

  const highlights = contentSections?.highlights?.slice(0, 3).map(h => `• ${h.title}`).join('\n') || 'No highlights';
  const events = contentSections?.events?.slice(0, 3).map(e => `• ${e.title} (${e.date})`).join('\n') || 'No events';

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">📝 Editorial Prompt for ${edition.title}</h2>

      <p>Hi ${EDITOR_NAME},</p>

      <p>The Herald agent has prepared a new <strong>${edition.edition_type}</strong> newsletter and needs your "From the Editor" section.</p>

      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">This Week's Content:</h3>
        <p><strong>Highlights:</strong></p>
        <pre style="white-space: pre-wrap; font-family: inherit;">${highlights}</pre>
        <p><strong>Upcoming Events:</strong></p>
        <pre style="white-space: pre-wrap; font-family: inherit;">${events}</pre>
      </div>

      <p><strong>Please reply with:</strong></p>
      <ol>
        <li><strong>Topic:</strong> What's on your mind this week? (1-2 sentences)</li>
        <li><strong>Key Takeaway:</strong> What should readers feel/do after reading? (1 sentence)</li>
      </ol>

      <p style="color: #666; font-size: 14px;">
        Simply reply to this email. The Herald agent will transform your response into a polished ~100 word "From the Editor" section.
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        Edition ID: ${edition_id}<br>
        Auto-generated by Herald Newsletter Agent
      </p>
    </div>
  `;

  // Send via Resend if configured
  if (RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'BLKOUT Herald <noreply@blkoutuk.com>',
          to: EDITOR_EMAIL,
          subject: `📝 Editorial needed: ${edition.title}`,
          html: emailHtml,
          reply_to: EDITOR_EMAIL
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Herald] Resend error:', errorText);
        return res.status(500).json({ error: 'Failed to send email', details: errorText });
      }

      // Update edition to mark prompt sent
      await supabase!
        .from('newsletter_editions')
        .update({
          editor_prompt_sent_at: new Date().toISOString(),
          editor_name: EDITOR_NAME,
          editor_avatar_url: EDITOR_AVATAR_URL
        })
        .eq('id', edition_id);

      return res.status(200).json({
        success: true,
        message: `Editorial prompt sent to ${EDITOR_EMAIL}`,
        edition_id
      });
    } catch (err) {
      console.error('[Herald] Email error:', err);
      return res.status(500).json({ error: 'Failed to send email' });
    }
  }

  // If no email service, return the prompt content for manual sending
  return res.status(200).json({
    success: true,
    message: 'Email service not configured. Use manual prompt below.',
    manual_prompt: {
      to: EDITOR_EMAIL,
      subject: `📝 Editorial needed: ${edition.title}`,
      body: `Topic: What's on your mind this week?\nKey Takeaway: What should readers feel/do?\n\nContent summary:\n${highlights}\n\n${events}`
    },
    edition_id
  });
}

// Process editorial reply and generate From the Editor section
async function handleEditorialReply(req: VercelRequest, res: VercelResponse) {
  const { edition_id, topic, key_takeaway } = req.body;

  if (!edition_id || !topic) {
    return res.status(400).json({ error: 'Missing edition_id or topic' });
  }

  // Generate the editor note using AI
  const prompt = `Write a warm, personal "From the Editor" section for BLKOUT UK's newsletter (~100 words).

Editor's input:
- Topic: ${topic}
- Key takeaway: ${key_takeaway || 'Connect with community'}

Guidelines:
- Write in first person as ${EDITOR_NAME}, the editor
- Be warm, authentic, and community-focused
- Reference Black LGBTQ+ joy and connection
- End with an encouraging message
- Keep it to approximately 100 words
- Do NOT include a greeting like "Dear readers" - start with the content
- Do NOT include a sign-off - that will be added separately

Write ONLY the paragraph text, nothing else.`;

  let editorNote = '';

  if (OPENROUTER_API_KEY) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://comms-blkout.vercel.app',
          'X-Title': 'BLKOUT Herald Newsletter'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-haiku',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        editorNote = data.choices?.[0]?.message?.content?.trim() || '';
      }
    } catch (err) {
      console.error('[Herald] AI generation error:', err);
    }
  }

  // Fallback if AI fails
  if (!editorNote) {
    editorNote = `${topic} ${key_takeaway || 'I hope you find something in this edition that speaks to you.'}`;
  }

  // Update the edition with the editor note
  const { error: updateError } = await supabase!
    .from('newsletter_editions')
    .update({
      editor_note: editorNote,
      editor_prompt_topic: `${topic} | ${key_takeaway || ''}`,
      editor_prompt_responded: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', edition_id);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to save editor note', details: updateError.message });
  }

  // Regenerate the HTML with the editor section
  const { data: edition } = await supabase!
    .from('newsletter_editions')
    .select('*')
    .eq('id', edition_id)
    .single();

  if (edition) {
    // Rebuild HTML with editor section
    const contentSections = edition.content_sections as {
      intro?: string;
      highlights?: { id: string; title: string; summary?: string; url?: string }[];
      events?: { id: string; title: string; summary?: string; date?: string; url?: string }[];
      resources?: { id: string; title: string; summary?: string; url?: string }[];
    } | null;

    const sections = [
      { type: 'highlights', title: 'Community Highlights', items: contentSections?.highlights || [] },
      { type: 'events', title: 'Upcoming Events', items: contentSections?.events || [] },
      { type: 'resources', title: 'Community Resources', items: contentSections?.resources || [] }
    ];

    const htmlContent = generateHTMLWithEditor(
      edition.title,
      contentSections?.intro || '',
      sections as NewsletterSection[],
      edition.edition_type,
      editorNote,
      EDITOR_NAME,
      EDITOR_AVATAR_URL
    );

    await supabase!
      .from('newsletter_editions')
      .update({ html_content: htmlContent })
      .eq('id', edition_id);
  }

  return res.status(200).json({
    success: true,
    editor_note: editorNote,
    edition_id
  });
}

// Generate HTML with editor section
function generateHTMLWithEditor(
  title: string,
  intro: string,
  sections: NewsletterSection[],
  editionType: string,
  editorNote: string,
  editorName: string,
  editorAvatarUrl: string
): string {
  const baseHtml = generateHTML(title, intro, sections, editionType);

  // Insert editor section after intro
  const editorSection = `
      <div class="editor-section" style="background: linear-gradient(135deg, #fef3f8 0%, #fff 100%); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #e91e63;">
        <div style="display: flex; align-items: flex-start; gap: 15px;">
          <img src="${editorAvatarUrl}" alt="${editorName}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 3px solid #e91e63;" onerror="this.style.display='none'">
          <div style="flex: 1;">
            <h3 style="margin: 0 0 10px 0; color: #1a1a2e; font-size: 16px;">From the Editor</h3>
            <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">${editorNote}</p>
            <p style="margin: 12px 0 0 0; font-size: 13px; color: #e91e63; font-weight: 600;">— ${editorName}</p>
          </div>
        </div>
      </div>`;

  // Insert after the intro div
  return baseHtml.replace(
    '</div>\n\n      ',
    `</div>\n\n      ${editorSection}\n\n      `
  );
}

// Handle preview request
async function handlePreview(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing edition id' });
  }

  const { data: edition, error } = await supabase!
    .from('newsletter_editions')
    .select('html_content')
    .eq('id', id)
    .single();

  if (error || !edition?.html_content) {
    return res.status(404).json({ error: 'Edition not found or has no HTML content' });
  }

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(edition.html_content);
}

// Handle export request
async function handleExport(req: VercelRequest, res: VercelResponse) {
  const { id, format = 'html' } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing edition id' });
  }

  const { data: edition, error } = await supabase!
    .from('newsletter_editions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !edition) {
    return res.status(404).json({ error: 'Edition not found' });
  }

  if (format === 'html') {
    const filename = `blkout-newsletter-${edition.edition_type}-${edition.id.substring(0, 8)}.html`;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(edition.html_content || '');
  }

  if (format === 'json') {
    return res.status(200).json({
      id: edition.id,
      edition_type: edition.edition_type,
      title: edition.title,
      subject_line: edition.subject_line,
      html_content: edition.html_content,
      content_sections: edition.content_sections,
      status: edition.status
    });
  }

  if (format === 'text') {
    const plainText = (edition.html_content || '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    const filename = `blkout-newsletter-${edition.edition_type}-${edition.id.substring(0, 8)}.txt`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(plainText);
  }

  return res.status(400).json({ error: 'Invalid format' });
}

// Handle SendFox integration - fetch lists
async function handleSendFoxLists(req: VercelRequest, res: VercelResponse) {
  if (!SENDFOX_API_KEY) {
    return res.status(500).json({ error: 'SendFox API key not configured' });
  }

  try {
    const response = await fetch('https://api.sendfox.com/lists', {
      headers: {
        'Authorization': `Bearer ${SENDFOX_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`SendFox API error: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json({
      success: true,
      lists: data.data.map((list: any) => ({
        id: list.id,
        name: list.name,
        subscribers: list.subscribed_contacts_count
      }))
    });
  } catch (error) {
    console.error('[Herald] SendFox lists error:', error);
    return res.status(500).json({ error: 'Failed to fetch SendFox lists' });
  }
}

// Handle SendFox send - creates campaign draft or copies HTML
async function handleSendFoxSend(req: VercelRequest, res: VercelResponse) {
  if (!SENDFOX_API_KEY) {
    return res.status(500).json({ error: 'SendFox API key not configured' });
  }

  const { edition_id, list_id } = req.body;

  if (!edition_id) {
    return res.status(400).json({ error: 'Missing edition_id' });
  }

  // Fetch the edition
  const { data: edition, error } = await supabase!
    .from('newsletter_editions')
    .select('*')
    .eq('id', edition_id)
    .single();

  if (error || !edition) {
    return res.status(404).json({ error: 'Edition not found' });
  }

  if (!edition.html_content) {
    return res.status(400).json({ error: 'Edition has no HTML content. Generate content first.' });
  }

  // Determine which list to use
  const targetListId = list_id || SENDFOX_LISTS[edition.edition_type as keyof typeof SENDFOX_LISTS] || SENDFOX_LISTS.weekly_engaged;

  // SendFox doesn't have a campaign creation endpoint, so we'll:
  // 1. Return the HTML for manual paste into SendFox
  // 2. Provide the SendFox campaign URL for easy access
  // 3. Update edition status to 'approved' (ready for SendFox)

  try {
    // Update edition status
    await supabase!
      .from('newsletter_editions')
      .update({
        status: 'approved',
        sendfox_list_id: targetListId,
        updated_at: new Date().toISOString()
      })
      .eq('id', edition_id);

    // Return the HTML content and SendFox campaign creation URL
    return res.status(200).json({
      success: true,
      message: 'Newsletter ready for SendFox',
      edition_id,
      list_id: targetListId,
      sendfox_campaign_url: 'https://sendfox.com/dashboard/campaigns/create',
      instructions: [
        '1. Click the SendFox campaign link above',
        '2. Select your list and enter the subject line',
        '3. Choose "Code" editor and paste the HTML',
        '4. Preview and send!'
      ],
      html_content: edition.html_content,
      subject_line: edition.subject_line || `BLKOUT ${edition.edition_type === 'weekly' ? 'Weekly' : 'Monthly'} Newsletter`
    });
  } catch (error) {
    console.error('[Herald] SendFox send error:', error);
    return res.status(500).json({ error: 'Failed to prepare for SendFox' });
  }
}

// Intelligence aggregation handler
async function handleAggregateIntelligence(req: VercelRequest, res: VercelResponse) {
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
    // Valid types: trends, projects, campaigns, viral_mechanics, growth_analytics, resources, community_needs, organizing_events
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
    return res.status(200).json({ success: true, message: 'Intelligence aggregation complete', records_updated: updated, intelligence: intelligenceRecords.map(r => ({ type: r.intelligence_type, summary: r.summary, priority: r.priority })) });
  } catch (error) {
    console.error('[Herald] Intelligence aggregation error:', error);
    return res.status(500).json({ error: 'Intelligence aggregation failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Agent execution prompts by type
const AGENT_PROMPTS: Record<string, (intelligence: IntelligenceContext, task: any) => string> = {
  griot: (intel, task) => `You are the Griot, BLKOUT's storytelling agent rooted in Black feminist thought and community narratives.

COMMUNITY CONTEXT:
- Community size: ${intel.communitySize} hub members, ${intel.coopMembers} coop members
- Verified creators: ${intel.verifiedCreators}
${intel.topArticle ? `- Recent highlight: "${intel.topArticle}"` : ''}
${intel.keyInsights.length > 0 ? `- Key insight: ${intel.keyInsights[0]}` : ''}

TASK: ${task.title}
${task.description ? `Details: ${task.description}` : ''}
Target platform: ${task.targetPlatform || 'social media'}

Create authentic, liberation-centered content that:
- Centers Black queer joy and resilience
- Uses storytelling to build community connection
- Speaks in BLKOUT's warm, empowering voice
- Is appropriate for ${task.targetPlatform || 'social media'}

Generate the content now:`,

  weaver: (intel, task) => `You are the Weaver, BLKOUT's community engagement agent that builds relationships and facilitates connection.

COMMUNITY CONTEXT:
- Active members: ${intel.communitySize} hub members
- Coop governance: ${intel.coopMembers} participating members
- Creators in community: ${intel.verifiedCreators}
${intel.nextEvent ? `- Upcoming event: ${intel.nextEvent}` : ''}
${intel.keyInsights.length > 0 ? `- Community pulse: ${intel.keyInsights[0]}` : ''}

TASK: ${task.title}
${task.description ? `Details: ${task.description}` : ''}
Target platform: ${task.targetPlatform || 'social media'}

Create engagement content that:
- Invites conversation and participation
- Builds bridges within the community
- Uses inclusive, welcoming language
- Encourages members to connect

Generate the engagement content now:`,

  strategist: (intel, task) => `You are the Strategist, BLKOUT's campaign planning agent that coordinates content for maximum community impact.

COMMUNITY INTELLIGENCE:
- Community reach: ${intel.communitySize} hub members, ${intel.coopMembers} coop members
- Content this week: ${intel.weeklyArticleCount} articles published
- Events upcoming: ${intel.upcomingEventCount} in next 7 days
${intel.topArticle ? `- Top performing content: "${intel.topArticle}"` : ''}
${intel.keyInsights.length > 0 ? intel.keyInsights.map(i => `- ${i}`).join('\n') : ''}

TASK: ${task.title}
${task.description ? `Details: ${task.description}` : ''}
Target platform: ${task.targetPlatform || 'multi-platform'}

Create a strategic plan that:
- Leverages community intelligence for timing and content
- Coordinates across platforms effectively
- Maximizes engagement based on community patterns
- Includes actionable steps and timeline

Generate the strategic plan now:`,

  listener: (intel, task) => `You are the Listener, BLKOUT's intelligence gathering agent that monitors community pulse and identifies needs.

CURRENT INTELLIGENCE:
- Community size: ${intel.communitySize} active members
- Recent activity: ${intel.weeklyArticleCount} articles, ${intel.upcomingEventCount} events
${intel.keyInsights.length > 0 ? `Current insights:\n${intel.keyInsights.map(i => `- ${i}`).join('\n')}` : ''}

RESEARCH TASK: ${task.title}
${task.description ? `Details: ${task.description}` : ''}

Provide research insights that:
- Identify community sentiment and needs
- Surface emerging topics and trends
- Recommend content opportunities
- Highlight areas needing attention

Generate research findings now:`,

  concierge: (intel, task) => `You are the Concierge, BLKOUT's member support agent that provides personalized guidance and assistance.

COMMUNITY CONTEXT:
- Active community: ${intel.communitySize} hub members
- Governance participants: ${intel.coopMembers} coop members
- Available resources: Many community resources and support services
${intel.nextEvent ? `- Upcoming opportunity: ${intel.nextEvent}` : ''}

SUPPORT REQUEST: ${task.title}
${task.description ? `Details: ${task.description}` : ''}

Provide helpful guidance that:
- Is warm, welcoming, and trauma-informed
- Points to relevant resources and connections
- Empowers the member to engage
- Reflects BLKOUT's community-first values

Generate the supportive response now:`,
};

// Handle agent execution with intelligence
async function handleAgentExecution(req: VercelRequest, res: VercelResponse) {
  const { agent_type, task_id, title, description, target_platform } = req.body;

  if (!agent_type || !title) {
    return res.status(400).json({ error: 'agent_type and title are required' });
  }

  const validAgents = ['griot', 'weaver', 'strategist', 'listener', 'concierge'];
  if (!validAgents.includes(agent_type)) {
    return res.status(400).json({ error: `Invalid agent_type. Must be one of: ${validAgents.join(', ')}` });
  }

  console.log(`[Agent:${agent_type}] Executing task: ${title}`);

  try {
    // Fetch intelligence context
    const intelligence = await fetchIntelligence();
    console.log(`[Agent:${agent_type}] Intelligence loaded: ${intelligence.communitySize} members`);

    // Build task object
    const task = {
      id: task_id,
      title,
      description,
      targetPlatform: target_platform || 'social media',
    };

    // Get agent-specific prompt
    const promptBuilder = AGENT_PROMPTS[agent_type];
    if (!promptBuilder) {
      return res.status(400).json({ error: 'Agent prompt not configured' });
    }

    const prompt = promptBuilder(intelligence, task);

    // Generate content using AI
    if (!OPENROUTER_API_KEY) {
      return res.status(200).json({
        success: true,
        agent: agent_type,
        task: title,
        content: `[Demo Mode] ${agent_type.charAt(0).toUpperCase() + agent_type.slice(1)} would generate content for: ${title}`,
        intelligence_used: true,
        community_context: {
          members: intelligence.communitySize,
          events: intelligence.upcomingEventCount,
          articles: intelligence.weeklyArticleCount,
        },
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://comms-blkout.vercel.app',
        'X-Title': `BLKOUT ${agent_type.charAt(0).toUpperCase() + agent_type.slice(1)} Agent`,
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Agent:${agent_type}] AI error:`, error);
      return res.status(500).json({ error: 'AI generation failed' });
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content?.trim() || '';

    // Store result in intelligence if it's substantial
    if (generatedContent.length > 100 && supabase) {
      await supabase.from('ivor_intelligence').insert({
        intelligence_type: 'campaigns',
        ivor_service: `${agent_type}_agent`,
        ivor_endpoint: '/api/herald/generate',
        intelligence_data: { task, content_length: generatedContent.length },
        summary: `${agent_type.charAt(0).toUpperCase() + agent_type.slice(1)} Agent: ${title.substring(0, 100)}`,
        key_insights: [generatedContent.substring(0, 200)],
        actionable_items: [`Review ${agent_type} output`, 'Publish when approved'],
        relevance_score: 0.85,
        priority: 'high',
        urgency: 'normal',
        tags: [agent_type, 'agent-generated', target_platform || 'general'],
        data_timestamp: new Date().toISOString(),
        is_stale: false,
      });
    }

    return res.status(200).json({
      success: true,
      agent: agent_type,
      task: title,
      content: generatedContent,
      intelligence_used: true,
      community_context: {
        members: intelligence.communitySize,
        coop_members: intelligence.coopMembers,
        verified_creators: intelligence.verifiedCreators,
        upcoming_events: intelligence.upcomingEventCount,
        weekly_articles: intelligence.weeklyArticleCount,
      },
    });
  } catch (error) {
    console.error(`[Agent:${agent_type}] Execution error:`, error);
    return res.status(500).json({ error: 'Agent execution failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Handle scheduled cron jobs - single dispatcher handles all schedules
async function handleCronJob(jobType: string, res: VercelResponse) {
  console.log(`[Cron] Running job: ${jobType}`);

  // For daily dispatcher, check what jobs should run today
  if (jobType === 'daily-dispatch') {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sunday, 5=Friday
    const dayOfMonth = now.getUTCDate();
    const hour = now.getUTCHours();

    const results: { job: string; success: boolean; preview?: string }[] = [];

    // Listener research runs every day at 7am UTC
    if (hour >= 7 && hour < 12) {
      const listenerResult = await runListenerResearch();
      results.push({ job: 'listener-research', success: true, preview: listenerResult.slice(0, 100) });
    }

    // Herald weekly runs on Fridays (dayOfWeek=5) at 9am UTC
    if (dayOfWeek === 5 && hour >= 9 && hour < 12) {
      const weeklyResult = await runHeraldWeekly();
      results.push({ job: 'herald-weekly', success: true, preview: weeklyResult.slice(0, 100) });
    }

    // Herald monthly runs on 1st of month at 10am UTC
    if (dayOfMonth === 1 && hour >= 10 && hour < 14) {
      const monthlyResult = await runHeraldMonthly();
      results.push({ job: 'herald-monthly', success: true, preview: monthlyResult.slice(0, 100) });
    }

    if (results.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No jobs scheduled for this time',
        time: { dayOfWeek, dayOfMonth, hour }
      });
    }

    return res.status(200).json({ success: true, jobs_run: results });
  }

  // Direct job execution (for testing)
  if (jobType === 'herald-weekly') {
    const content = await runHeraldWeekly();
    return res.status(200).json({ success: true, type: 'herald-weekly', preview: content.slice(0, 200) });
  }

  if (jobType === 'herald-monthly') {
    const content = await runHeraldMonthly();
    return res.status(200).json({ success: true, type: 'herald-monthly', preview: content.slice(0, 200) });
  }

  if (jobType === 'listener-research') {
    const content = await runListenerResearch();
    return res.status(200).json({ success: true, type: 'listener-research', preview: content.slice(0, 200) });
  }

  return res.status(400).json({ error: 'Unknown cron job type' });
}

// Individual job runners
async function runHeraldWeekly(): Promise<string> {
  const intelligence = await fetchIntelligence();
  const prompt = `You are Herald, BLKOUT's newsletter agent. Create a weekly newsletter for our engaged community.

COMMUNITY CONTEXT:
- Community: ${intelligence.communitySize} hub members, ${intelligence.coopMembers} coop members
- Verified creators: ${intelligence.verifiedCreators}
- Upcoming events: ${intelligence.upcomingEventCount}
${intelligence.nextEvent ? `- Featured: "${intelligence.nextEvent}"` : ''}
- Articles this week: ${intelligence.weeklyArticleCount}
${intelligence.topArticle ? `- Top article: "${intelligence.topArticle}"` : ''}

Create a warm, engaging weekly newsletter with:
1. Personal greeting and community highlight
2. Upcoming events section
3. Content spotlights
4. Community call-to-action
5. Affirming close

Keep it concise. Center Black queer joy.`;

  const content = await callAI(prompt);
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  await supabase!.from('socialsync_agent_tasks').insert({
    agent_type: 'herald',
    title: `Weekly Newsletter - ${dateStr}`,
    description: 'Automated weekly newsletter',
    priority: 'high',
    status: 'completed',
    target_platform: 'email',
    suggested_config: { edition_type: 'weekly', automated: true },
    generated_content: content,
    execution_metadata: { cron_triggered: true, triggered_at: new Date().toISOString(), intelligence },
  });

  return content;
}

async function runHeraldMonthly(): Promise<string> {
  const intelligence = await fetchIntelligence();
  const monthName = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const prompt = `You are Herald. Create a monthly community digest for ${monthName}.

STATS:
- Members: ${intelligence.communitySize} (${intelligence.coopMembers} coop)
- Creators: ${intelligence.verifiedCreators}
- Events: ${intelligence.upcomingEventCount}
- Articles: ${intelligence.weeklyArticleCount}

Create a comprehensive monthly digest celebrating achievements, highlighting events, and previewing next month. Make it inspiring for our Black queer community.`;

  const content = await callAI(prompt, 2000);

  await supabase!.from('socialsync_agent_tasks').insert({
    agent_type: 'herald',
    title: `Monthly Digest - ${monthName}`,
    description: 'Automated monthly digest',
    priority: 'high',
    status: 'completed',
    target_platform: 'email',
    suggested_config: { edition_type: 'monthly', automated: true },
    generated_content: content,
    execution_metadata: { cron_triggered: true, triggered_at: new Date().toISOString() },
  });

  return content;
}

async function runListenerResearch(): Promise<string> {
  const intelligence = await fetchIntelligence();
  const snapshot = {
    members: intelligence.communitySize,
    coop: intelligence.coopMembers,
    events: intelligence.upcomingEventCount,
    articles: intelligence.weeklyArticleCount,
  };

  const prompt = `You are Listener, BLKOUT's intelligence agent. Analyze:

SNAPSHOT:
- Members: ${snapshot.members} (${snapshot.coop} coop)
- Events: ${snapshot.events} upcoming
- Articles: ${snapshot.articles} this week

Provide:
1. 3 KEY INSIGHTS about community health
2. 3 CONTENT RECOMMENDATIONS
3. 2 TRENDS TO WATCH

Be specific and actionable for Black queer community.`;

  const content = await callAI(prompt, 1000);
  const dateStr = new Date().toLocaleDateString('en-GB');

  await supabase!.from('socialsync_agent_tasks').insert({
    agent_type: 'listener',
    title: `Daily Research - ${dateStr}`,
    description: 'Automated daily research',
    priority: 'medium',
    status: 'completed',
    target_platform: 'all',
    suggested_config: { research_type: 'daily', automated: true },
    generated_content: content,
    execution_metadata: { cron_triggered: true, triggered_at: new Date().toISOString(), snapshot },
  });

  return content;
}

// Helper for AI calls in cron
async function callAI(prompt: string, maxTokens = 1500): Promise<string> {
  if (!OPENROUTER_API_KEY) return '[Demo Mode] Content would be generated here';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://comms-blkout.vercel.app',
      'X-Title': 'BLKOUT Agent Cron',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-haiku',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Generation failed';
}

// Main handler
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
