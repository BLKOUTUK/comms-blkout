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
 * Handle SendFox send - creates campaign draft or copies HTML
 */
export async function handleSendFoxSend(req: VercelRequest, res: VercelResponse) {
  if (!SENDFOX_API_KEY) {
    return res.status(500).json({ error: 'SendFox API key not configured' });
  }

  const { edition_id, list_id } = req.body;

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

  const targetListId = list_id || SENDFOX_LISTS[edition.edition_type as keyof typeof SENDFOX_LISTS] || SENDFOX_LISTS.weekly_engaged;

  try {
    await supabase!
      .from('newsletter_editions')
      .update({
        status: 'approved',
        sendfox_list_id: targetListId,
        updated_at: new Date().toISOString()
      })
      .eq('id', edition_id);

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
