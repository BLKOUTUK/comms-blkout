/**
 * Newsletter HTML Templates
 *
 * Generates SendFox-compatible HTML email templates with inline CSS.
 * Follows BLKOUT brand guidelines (purple, gold, black).
 *
 * @author Herald Agent System
 * @version 2.0.0
 */

import type {
  WeeklyNewsletter,
  MonthlyNewsletter,
  Article,
  Event,
  Resource,
  Proposal,
  Achievement,
  Campaign,
} from './NewsletterGenerator';

// BLKOUT Brand Colors
const COLORS = {
  primary: '#a855f7',      // Purple
  primaryDark: '#7c3aed',  // Dark purple
  secondary: '#f59e0b',    // Gold
  secondaryDark: '#d97706',// Dark gold
  accent: '#10b981',       // Teal/Green
  dark: '#1f2937',         // Almost black
  darker: '#111827',       // Darker background
  light: '#f9fafb',        // Light background
  white: '#ffffff',
  gray: '#6b7280',
  grayLight: '#9ca3af',
};

// Common styles
const FONT_FAMILY = "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

interface TemplateOptions {
  title: string;
  preheaderText?: string;
  editorNote?: string;
  editorName?: string;
  editorAvatarUrl?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

/**
 * Generate Weekly Newsletter HTML
 */
export function generateWeeklyNewsletterHTML(
  newsletter: WeeklyNewsletter,
  options: TemplateOptions
): string {
  const { title, preheaderText, editorNote, editorName, editorAvatarUrl, unsubscribeUrl, preferencesUrl } = options;

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
  ${preheaderText ? `<!--[if !mso]><!-->
  <span style="display:none;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;visibility:hidden;mso-hide:all;">${preheaderText}</span>
  <!--<![endif]-->` : ''}
  <style>
    body { margin: 0; padding: 0; width: 100%; background-color: ${COLORS.light}; }
    table { border-collapse: collapse; }
    img { border: 0; display: block; max-width: 100%; height: auto; }
    a { color: ${COLORS.primary}; text-decoration: none; }
    .button { display: inline-block; background: ${COLORS.primary}; color: ${COLORS.white} !important; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; }
    .button:hover { background: ${COLORS.primaryDark}; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 0 16px !important; }
      .stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;font-family:${FONT_FAMILY};background-color:${COLORS.light};color:${COLORS.dark};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.light};">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${COLORS.white};border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">

          <!-- Header -->
          ${generateHeader(title, 'weekly')}

          <!-- Intro Section -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <p style="margin:0;font-size:16px;line-height:1.6;color:${COLORS.dark};">
                ${newsletter.intro}
              </p>
            </td>
          </tr>

          <!-- Editor Note (if provided) -->
          ${editorNote ? generateEditorSection(editorNote, editorName, editorAvatarUrl) : ''}

          <!-- Highlights Section -->
          ${newsletter.highlights.length > 0 ? generateHighlightsSection(newsletter.highlights) : ''}

          <!-- Events Section -->
          ${newsletter.upcomingEvents.length > 0 ? generateEventsSection(newsletter.upcomingEvents) : ''}

          <!-- Community Voice Section -->
          ${(newsletter.communityVoice.proposals.length > 0 || newsletter.communityVoice.achievements.length > 0) ?
            generateCommunityVoiceSection(newsletter.communityVoice.proposals, newsletter.communityVoice.achievements) : ''}

          <!-- Resources Section -->
          ${newsletter.resourcesSpotlight.length > 0 ? generateResourcesSection(newsletter.resourcesSpotlight) : ''}

          <!-- CTA Section -->
          ${newsletter.callToAction ? generateCTASection(newsletter.callToAction) : ''}

          <!-- Footer -->
          ${generateFooter(unsubscribeUrl, preferencesUrl)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate Monthly Newsletter HTML
 */
export function generateMonthlyNewsletterHTML(
  newsletter: MonthlyNewsletter,
  options: TemplateOptions
): string {
  const { title, preheaderText, editorNote, editorName, editorAvatarUrl, unsubscribeUrl, preferencesUrl } = options;

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
  ${preheaderText ? `<!--[if !mso]><!-->
  <span style="display:none;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;visibility:hidden;mso-hide:all;">${preheaderText}</span>
  <!--<![endif]-->` : ''}
  <style>
    body { margin: 0; padding: 0; width: 100%; background-color: ${COLORS.light}; }
    table { border-collapse: collapse; }
    img { border: 0; display: block; max-width: 100%; height: auto; }
    a { color: ${COLORS.primary}; text-decoration: none; }
    .button { display: inline-block; background: ${COLORS.primary}; color: ${COLORS.white} !important; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 0 16px !important; }
      .stack { display: block !important; width: 100% !important; }
      .stat-box { display: block !important; width: 100% !important; margin-bottom: 12px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;font-family:${FONT_FAMILY};background-color:${COLORS.light};color:${COLORS.dark};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.light};">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${COLORS.white};border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">

          <!-- Header -->
          ${generateHeader(title, 'monthly')}

          <!-- Intro Section -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <p style="margin:0;font-size:16px;line-height:1.6;color:${COLORS.dark};">
                ${newsletter.intro}
              </p>
            </td>
          </tr>

          <!-- Editor Note (if provided) -->
          ${editorNote ? generateEditorSection(editorNote, editorName, editorAvatarUrl) : ''}

          <!-- Month in Review Stats -->
          ${generateMonthInReviewSection(newsletter.monthInReview)}

          <!-- Highlights Section -->
          ${newsletter.highlights.length > 0 ? generateHighlightsSection(newsletter.highlights) : ''}

          <!-- Events Section -->
          ${newsletter.upcomingEvents.length > 0 ? generateEventsSection(newsletter.upcomingEvents) : ''}

          <!-- Community Voice Section -->
          ${(newsletter.communityVoice.proposals.length > 0 || newsletter.communityVoice.achievements.length > 0) ?
            generateCommunityVoiceSection(newsletter.communityVoice.proposals, newsletter.communityVoice.achievements) : ''}

          <!-- Resources Section -->
          ${newsletter.resourcesSpotlight.length > 0 ? generateResourcesSection(newsletter.resourcesSpotlight) : ''}

          <!-- CTA Section -->
          ${newsletter.callToAction ? generateCTASection(newsletter.callToAction) : ''}

          <!-- Footer -->
          ${generateFooter(unsubscribeUrl, preferencesUrl)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Helper functions for generating sections

function generateHeader(title: string, type: 'weekly' | 'monthly'): string {
  const gradient = type === 'weekly'
    ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`
    : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 50%, ${COLORS.accent} 100%)`;

  const subtitle = type === 'weekly' ? 'Weekly Community Update' : 'Monthly Community Digest';

  return `
  <tr>
    <td style="background:${gradient};padding:40px 32px;text-align:center;">
      <img src="https://blkoutuk.com/images/blkout_logo_roundel_colour.png" alt="BLKOUT" width="80" style="width:80px;height:auto;margin:0 auto 16px;">
      <h1 style="margin:0;font-size:28px;font-weight:700;color:${COLORS.white};text-shadow:0 2px 4px rgba(0,0,0,0.1);">
        ${title}
      </h1>
      <p style="margin:12px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">
        ${subtitle}
      </p>
    </td>
  </tr>`;
}

function generateEditorSection(note: string, name?: string, avatarUrl?: string): string {
  return `
  <tr>
    <td style="padding:0 32px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,${COLORS.light} 0%,#fff5f8 100%);border-radius:12px;border-left:4px solid ${COLORS.primary};">
        <tr>
          <td style="padding:20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                ${avatarUrl ? `
                <td width="60" valign="top">
                  <img src="${avatarUrl}" alt="${name || 'Editor'}" width="50" height="50" style="width:50px;height:50px;border-radius:50%;object-fit:cover;border:3px solid ${COLORS.primary};">
                </td>
                ` : ''}
                <td style="padding-left:${avatarUrl ? '16px' : '0'};">
                  <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;color:${COLORS.primary};">From the Editor</h3>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:${COLORS.dark};">${note}</p>
                  ${name ? `<p style="margin:12px 0 0;font-size:13px;font-weight:600;color:${COLORS.primary};">— ${name}</p>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function generateHighlightsSection(articles: Article[]): string {
  const articleCards = articles.map((article, index) => `
    <tr>
      <td style="padding-bottom:${index < articles.length - 1 ? '16px' : '0'};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.light};border-radius:12px;overflow:hidden;">
          ${article.imageUrl ? `
          <tr>
            <td>
              <img src="${article.imageUrl}" alt="" width="536" style="width:100%;height:auto;max-height:200px;object-fit:cover;">
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:20px;">
              <h3 style="margin:0 0 8px;font-size:18px;font-weight:600;color:${COLORS.dark};">
                <a href="${article.url}" style="color:${COLORS.dark};text-decoration:none;">${article.title}</a>
              </h3>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:${COLORS.gray};">
                ${article.excerpt}
              </p>
              <a href="${article.url}" style="display:inline-block;font-size:14px;font-weight:600;color:${COLORS.primary};">
                Read more &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  return `
  <tr>
    <td style="padding:0 32px 32px;">
      <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:${COLORS.dark};padding-bottom:12px;border-bottom:3px solid ${COLORS.primary};">
        <span style="color:${COLORS.primary};">&#10024;</span> Community Highlights
      </h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${articleCards}
      </table>
    </td>
  </tr>`;
}

function generateEventsSection(events: Event[]): string {
  const eventCards = events.map((event, index) => {
    const dateFormatted = event.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

    return `
    <tr>
      <td style="padding-bottom:${index < events.length - 1 ? '12px' : '0'};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.white};border-radius:8px;border-left:4px solid ${COLORS.secondary};border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:16px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:${COLORS.secondary};text-transform:uppercase;letter-spacing:0.5px;">
                ${dateFormatted}${event.time ? ` &bull; ${event.time}` : ''}
              </p>
              <h3 style="margin:0 0 6px;font-size:16px;font-weight:600;color:${COLORS.dark};">
                <a href="${event.url}" style="color:${COLORS.dark};text-decoration:none;">${event.title}</a>
              </h3>
              ${event.location ? `<p style="margin:0 0 6px;font-size:13px;color:${COLORS.gray};">📍 ${event.location}</p>` : ''}
              <p style="margin:0;font-size:13px;line-height:1.4;color:${COLORS.gray};">
                ${event.description}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
  }).join('');

  return `
  <tr>
    <td style="padding:0 32px 32px;">
      <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:${COLORS.dark};padding-bottom:12px;border-bottom:3px solid ${COLORS.secondary};">
        <span style="color:${COLORS.secondary};">&#128197;</span> Upcoming Events
      </h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${eventCards}
      </table>
    </td>
  </tr>`;
}

function generateCommunityVoiceSection(proposals: Proposal[], achievements: Achievement[]): string {
  let content = '';

  if (proposals.length > 0) {
    const proposalItems = proposals.map(p => `
      <tr>
        <td style="padding:12px;background:${COLORS.light};border-radius:8px;margin-bottom:8px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:${COLORS.accent};text-transform:uppercase;">
            ${p.status}
          </p>
          <p style="margin:0;font-size:14px;font-weight:600;color:${COLORS.dark};">${p.title}</p>
          <p style="margin:4px 0 0;font-size:13px;color:${COLORS.gray};">${p.summary}</p>
        </td>
      </tr>
    `).join('<tr><td style="height:8px;"></td></tr>');

    content += `
    <tr>
      <td style="padding-bottom:${achievements.length > 0 ? '20px' : '0'};">
        <h3 style="margin:0 0 12px;font-size:16px;font-weight:600;color:${COLORS.dark};">
          <span style="color:${COLORS.accent};">&#9997;</span> Active Proposals
        </h3>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${proposalItems}
        </table>
      </td>
    </tr>`;
  }

  if (achievements.length > 0) {
    const achievementItems = achievements.map(a => `
      <tr>
        <td style="padding:10px 12px;background:linear-gradient(90deg,#fef3c7 0%,${COLORS.white} 100%);border-radius:8px;border-left:3px solid ${COLORS.secondary};">
          <p style="margin:0;font-size:14px;color:${COLORS.dark};">
            <strong>${a.memberName}</strong> - ${a.description}
          </p>
        </td>
      </tr>
    `).join('<tr><td style="height:8px;"></td></tr>');

    content += `
    <tr>
      <td>
        <h3 style="margin:0 0 12px;font-size:16px;font-weight:600;color:${COLORS.dark};">
          <span style="color:${COLORS.secondary};">&#127942;</span> Community Achievements
        </h3>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${achievementItems}
        </table>
      </td>
    </tr>`;
  }

  return `
  <tr>
    <td style="padding:0 32px 32px;">
      <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:${COLORS.dark};padding-bottom:12px;border-bottom:3px solid ${COLORS.accent};">
        <span style="color:${COLORS.accent};">&#128172;</span> Community Voice
      </h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${content}
      </table>
    </td>
  </tr>`;
}

function generateResourcesSection(resources: Resource[]): string {
  const resourceItems = resources.map((resource, index) => `
    <tr>
      <td style="padding:16px;background:${COLORS.light};border-radius:8px;${index < resources.length - 1 ? 'margin-bottom:12px;' : ''}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="display:inline-block;padding:4px 10px;background:${COLORS.primary};color:${COLORS.white};font-size:11px;font-weight:600;border-radius:4px;margin-bottom:8px;">
                ${resource.category}
              </span>
              <h4 style="margin:8px 0 6px;font-size:16px;font-weight:600;">
                <a href="${resource.url}" style="color:${COLORS.dark};text-decoration:none;">${resource.title}</a>
              </h4>
              <p style="margin:0;font-size:13px;line-height:1.4;color:${COLORS.gray};">
                ${resource.description}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('<tr><td style="height:12px;"></td></tr>');

  return `
  <tr>
    <td style="padding:0 32px 32px;">
      <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:${COLORS.dark};padding-bottom:12px;border-bottom:3px solid ${COLORS.primary};">
        <span style="color:${COLORS.primary};">&#128218;</span> Resources Spotlight
      </h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${resourceItems}
      </table>
    </td>
  </tr>`;
}

function generateMonthInReviewSection(stats: { eventCount: number; memberCount: number; articleCount: number; newCreators: number }): string {
  const statBoxes = [
    { value: stats.eventCount, label: 'Events', color: COLORS.secondary },
    { value: stats.memberCount.toLocaleString(), label: 'Community', color: COLORS.primary },
    { value: stats.articleCount, label: 'Stories', color: COLORS.accent },
    { value: stats.newCreators, label: 'New Creators', color: COLORS.primaryDark },
  ];

  const boxes = statBoxes.map(stat => `
    <td class="stat-box" width="25%" style="padding:0 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.light};border-radius:8px;border-top:3px solid ${stat.color};">
        <tr>
          <td style="padding:16px;text-align:center;">
            <p style="margin:0;font-size:28px;font-weight:700;color:${stat.color};">${stat.value}</p>
            <p style="margin:4px 0 0;font-size:12px;color:${COLORS.gray};">${stat.label}</p>
          </td>
        </tr>
      </table>
    </td>
  `).join('');

  return `
  <tr>
    <td style="padding:0 32px 32px;">
      <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:${COLORS.dark};padding-bottom:12px;border-bottom:3px solid ${COLORS.secondary};">
        <span style="color:${COLORS.secondary};">&#128200;</span> Month in Review
      </h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${boxes}
        </tr>
      </table>
    </td>
  </tr>`;
}

function generateCTASection(campaign: Campaign): string {
  return `
  <tr>
    <td style="padding:0 32px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,${COLORS.primary} 0%,${COLORS.primaryDark} 100%);border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:32px;text-align:center;">
            <h2 style="margin:0 0 12px;font-size:24px;font-weight:700;color:${COLORS.white};">
              ${campaign.title}
            </h2>
            <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.9);line-height:1.5;">
              ${campaign.description}
            </p>
            <a href="${campaign.ctaUrl}" style="display:inline-block;background:${COLORS.white};color:${COLORS.primary};padding:14px 32px;border-radius:8px;font-weight:700;font-size:16px;text-decoration:none;">
              ${campaign.ctaText}
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function generateFooter(unsubscribeUrl?: string, preferencesUrl?: string): string {
  return `
  <tr>
    <td style="background:${COLORS.darker};padding:32px;text-align:center;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-bottom:16px;">
            <a href="https://instagram.com/blkout_uk" style="display:inline-block;margin:0 8px;color:${COLORS.white};font-size:14px;">Instagram</a>
            <span style="color:${COLORS.grayLight};">&bull;</span>
            <a href="https://twitter.com/blkout_uk" style="display:inline-block;margin:0 8px;color:${COLORS.white};font-size:14px;">Twitter</a>
            <span style="color:${COLORS.grayLight};">&bull;</span>
            <a href="https://linkedin.com/company/blkout-uk" style="display:inline-block;margin:0 8px;color:${COLORS.white};font-size:14px;">LinkedIn</a>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:16px;">
            <p style="margin:0;font-size:14px;font-weight:600;color:${COLORS.white};">BLKOUT UK</p>
            <p style="margin:4px 0 0;font-size:13px;color:${COLORS.grayLight};">Community-Owned Liberation Technology for Black Queer Men</p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:16px;">
            <a href="https://blkoutuk.com" style="display:inline-block;margin:0 8px;color:${COLORS.primary};font-size:13px;">Website</a>
            <span style="color:${COLORS.grayLight};">&bull;</span>
            <a href="mailto:hello@blkoutuk.com" style="display:inline-block;margin:0 8px;color:${COLORS.primary};font-size:13px;">Contact</a>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin:0;font-size:11px;color:${COLORS.grayLight};">
              You're receiving this because you subscribed to BLKOUT updates.<br>
              <a href="${unsubscribeUrl || '{unsubscribe_url}'}" style="color:${COLORS.grayLight};text-decoration:underline;">Unsubscribe</a>
              ${preferencesUrl ? ` | <a href="${preferencesUrl}" style="color:${COLORS.grayLight};text-decoration:underline;">Update preferences</a>` : ''}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// Export template generation function
export function generateNewsletterHTML(
  newsletter: WeeklyNewsletter | MonthlyNewsletter,
  type: 'weekly' | 'monthly',
  options: TemplateOptions
): string {
  if (type === 'weekly') {
    return generateWeeklyNewsletterHTML(newsletter as WeeklyNewsletter, options);
  }
  return generateMonthlyNewsletterHTML(newsletter as MonthlyNewsletter, options);
}
