/**
 * Preview and Export Handlers
 * Handle newsletter preview and export requests
 */
import { supabase } from '../config.js';
/**
 * Handle preview request
 */
export async function handlePreview(req, res) {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing edition id' });
    }
    const { data: edition, error } = await supabase
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
/**
 * Handle export request
 */
export async function handleExport(req, res) {
    const { id, format = 'html' } = req.query;
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing edition id' });
    }
    const { data: edition, error } = await supabase
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
