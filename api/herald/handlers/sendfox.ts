/**
 * SendFox Integration Handlers
 * Handle SendFox list fetching and campaign preparation
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, SENDFOX_API_KEY, SENDFOX_LISTS } from '../config.js';

/**
 * Handle SendFox lists fetch
 */
export async function handleSendFoxLists(req: VercelRequest, res: VercelResponse) {
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

/**
 * Handle SendFox send — creates a DRAFT campaign in SendFox via its REST API
 * (POST /campaigns), so the monthly edition no longer has to be pasted by hand.
 * Nothing is sent: Rob opens the draft in SendFox, checks it, and presses Send or
 * Schedule there. If SendFox rejects the request the response falls back to the
 * old shape (HTML + paste instructions) and says why. Rewritten 3 Sep 2026.
 */
export async function handleSendFoxSend(req: VercelRequest, res: VercelResponse) {
  if (!SENDFOX_API_KEY) {
    return res.status(500).json({ error: 'SendFox API key not configured' });
  }

  const { edition_id, list_id, title } = req.body;

  if (!edition_id) {
    return res.status(400).json({ error: 'Missing edition_id' });
  }

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

  if (!String(edition.html_content).includes('{{unsubscribe_url}}')) {
    return res.status(400).json({ error: 'Edition HTML has no {{unsubscribe_url}} — SendFox refuses campaigns without one.' });
  }

  const targetListId = Number(list_id) || SENDFOX_LISTS[edition.edition_type as keyof typeof SENDFOX_LISTS] || SENDFOX_LISTS.monthly_circle;
  const subject = edition.subject_line || `BLKOUT ${edition.edition_type === 'weekly' ? 'Weekly' : 'Monthly'} Newsletter`;

  await supabase!
    .from('newsletter_editions')
    .update({ status: 'approved', sendfox_list_id: targetListId, updated_at: new Date().toISOString() })
    .eq('id', edition_id);

  const fallback = {
    success: true,
    campaign_created: false,
    edition_id,
    list_id: targetListId,
    sendfox_campaign_url: 'https://sendfox.com/dashboard/campaigns/create',
    instructions: [
      '1. Open SendFox and start a new campaign',
      '2. Pick the list and enter the subject line',
      '3. Choose the code editor and paste the HTML',
      '4. Preview, then Send or Schedule',
    ],
    html_content: edition.html_content,
    subject_line: subject,
  };

  try {
    const response = await fetch('https://api.sendfox.com/campaigns', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDFOX_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        title: title || edition.title || `${subject} — ${new Date().toISOString().slice(0, 10)}`,
        subject,
        preview_text: edition.preview_text || undefined,
        html: edition.html_content,
        from_name: 'BLKOUT',
        from_email: 'rob@blkoutuk.com',
        lists: [targetListId],
      }),
    });
    const text = await response.text();
    if (!response.ok) {
      console.error('[Herald] SendFox campaign create failed:', response.status, text.slice(0, 300));
      return res.status(200).json({ ...fallback, message: 'SendFox did not accept the campaign — paste it instead', campaign_error: `SendFox ${response.status}: ${text.slice(0, 200)}` });
    }
    const campaign = JSON.parse(text);
    let record_error: string | undefined;
    if (campaign?.id) {
      const { error: recordError } = await supabase!
        .from('newsletter_editions')
        .update({ sendfox_campaign_id: String(campaign.id), updated_at: new Date().toISOString() })
        .eq('id', edition_id);
      if (recordError) {
        console.error('[Herald] could not record sendfox_campaign_id on the edition:', recordError.message);
        record_error = recordError.message;
      }
    }
    return res.status(200).json({
      success: true,
      campaign_created: true,
      campaign_id: campaign.id,
      record_error,
      message: 'Draft campaign created in SendFox — nothing has been sent',
      edition_id,
      list_id: targetListId,
      subject_line: subject,
      sendfox_campaign_url: 'https://sendfox.com/dashboard/campaigns',
      instructions: [
        `1. Open SendFox → Campaigns → "${campaign.title || subject}" (id ${campaign.id})`,
        '2. Check the preview and the audience',
        '3. Send, or Schedule',
      ],
      html_content: edition.html_content,
    });
  } catch (err) {
    console.error('[Herald] SendFox send error:', err);
    return res.status(200).json({ ...fallback, message: 'SendFox unreachable — paste it instead', campaign_error: err instanceof Error ? err.message : String(err) });
  }
}
