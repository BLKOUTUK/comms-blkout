/**
 * HTML Template Generators
 * Generate newsletter HTML content
 */
/**
 * Generate HTML newsletter
 */
export function generateHTML(title, intro, sections, editionType) {
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
/**
 * Generate HTML with editor section
 */
export function generateHTMLWithEditor(title, intro, sections, editionType, editorNote, editorName, editorAvatarUrl) {
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
    return baseHtml.replace('</div>\n\n      ', `</div>\n\n      ${editorSection}\n\n      `);
}
