/**
 * New item — a brief goes in, a register row comes out.
 *
 * Two ways out, because there are two places Rob writes from. "Draft with Sonnet" posts the
 * brief to the guarded route, which asks Sonnet for a caption in BLKOUT's voice and writes
 * the result to the register as a draft. "Copy as prompt" composes the same instruction as
 * plain text and puts it on the clipboard, for a phone or a claude.ai tab with no server in
 * reach. Neither one posts anything anywhere: a drafted row is a draft, and it sits on the
 * Content page until a person marks it ready and runs /post.
 *
 * Collapsed by default. The page's job is to show what is scheduled; adding is a thing you
 * come here to do, not a thing you should have to scroll past.
 */

import { useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';
import { Plus, Minus, Sparkles, Clipboard, Check } from 'lucide-react';
import type { ContentRow } from '@/hooks/useAdminContent';

const CHANNELS = ['instagram', 'facebook', 'linkedin'] as const;

interface Props {
  campaigns: string[];
  onDrafted: (row: ContentRow) => void;
}

export function NewItemForm({ campaigns, onDrafted }: Props) {
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState('');
  const [title, setTitle] = useState('');
  const [campaign, setCampaign] = useState('');
  const [channels, setChannels] = useState<string[]>([...CHANNELS]);
  const [date, setDate] = useState('');
  const [media, setMedia] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mediaUrls = media.split('\n').map((u) => u.trim()).filter(Boolean);
  const badMedia = mediaUrls.filter((u) => !u.startsWith('https://'));

  const toggleChannel = (c: string) =>
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  /** The same instruction the route sends, as text a person can paste into a Claude session. */
  const promptText = () => [
    'Draft one BLKOUT social post for the content register from this brief and insert it with /campaign add:',
    '',
    `Brief: ${brief.trim()}`,
    campaign.trim() ? `Campaign: ${campaign.trim()}` : null,
    `Channels: ${channels.join(', ') || 'none selected'}`,
    date ? `Goes out: ${date}` : null,
    title.trim() ? `Working title: ${title.trim()}` : null,
    mediaUrls.length ? `Media: ${mediaUrls.join(' ')}` : null,
    '',
    'BLKOUT voice: for and by Black queer men in the UK, community-owned, one member one vote.',
    'Lead with what is being built or offered, not what is missing. We learn, we do not fail.',
    'Specific over generic: a named place, a date, a real thing that happens. Warm, never extractive.',
    'Say members or brothers, never users. UK context, not American framing. The full age range.',
    'Short sentences. Active voice. No em dashes. No markdown. No invented facts, dates or names.',
    'Instagram caption under 2,200 characters, 60 to 150 words, three to six specific hashtags.',
  ].filter((l) => l !== null).join('\n');

  const copyPrompt = async () => {
    setError(null);
    try {
      await navigator.clipboard.writeText(promptText());
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      // A clipboard refusal must say so. Silently doing nothing reads as "it worked".
      setError(`Could not reach the clipboard: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const draft = async () => {
    setError(null);
    setBusy(true);
    try {
      const response = await apiFetch('/api/admin/content/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: brief.trim(),
          title: title.trim() || undefined,
          campaign: campaign.trim() || undefined,
          channels,
          scheduled_for: date || undefined,
          media_urls: mediaUrls,
        }),
      });

      const text = await response.text();
      let payload: { row?: ContentRow; drafted?: boolean; error?: string } = {};
      try { payload = JSON.parse(text); } catch { /* handled below */ }

      if (!response.ok || !payload.row) {
        throw new Error(payload.error || `HTTP ${response.status}: ${text.slice(0, 200)}`);
      }

      onDrafted(payload.row);
      setBrief(''); setTitle(''); setDate(''); setMedia('');
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The brief did not reach the register');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
              className="card w-full flex items-center gap-2 text-left hover:border-blkout-300 text-sm font-medium text-gray-700">
        <Plus size={16} /> New item
      </button>
    );
  }

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">New item</h2>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
          <Minus size={16} />
        </button>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Brief</span>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={3}
          placeholder="What is this post about, for whom, what should it make happen?"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blkout-400 focus:outline-none"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Title <span className="text-gray-400 font-normal">(optional)</span></span>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
                 className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blkout-400 focus:outline-none" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Campaign</span>
          <input list="register-campaigns" value={campaign} onChange={(e) => setCampaign(e.target.value)}
                 className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blkout-400 focus:outline-none" />
          <datalist id="register-campaigns">
            {campaigns.map((c) => <option key={c} value={c} />)}
          </datalist>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <fieldset>
          <legend className="text-sm font-medium text-gray-700">Channels</legend>
          <div className="flex gap-4 mt-1">
            {CHANNELS.map((c) => (
              <label key={c} className="flex items-center gap-1.5 text-sm text-gray-700">
                <input type="checkbox" checked={channels.includes(c)} onChange={() => toggleChannel(c)} />
                {c}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Date <span className="text-gray-400 font-normal">(optional)</span></span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                 className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blkout-400 focus:outline-none" />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Media URLs <span className="text-gray-400 font-normal">(optional, one per line, https:// only)</span></span>
        <textarea value={media} onChange={(e) => setMedia(e.target.value)} rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-blkout-400 focus:outline-none" />
      </label>

      {badMedia.length > 0 && (
        <p className="text-sm text-amber-700">
          {badMedia.length} line{badMedia.length > 1 ? 's' : ''} will be dropped: media URLs must start with https://
        </p>
      )}

      {error && <p className="text-sm text-red-700 font-mono break-all">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={draft}
          disabled={busy || !brief.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blkout-600 text-white text-sm font-medium hover:bg-blkout-700 disabled:opacity-40"
        >
          <Sparkles size={15} /> {busy ? '…' : 'Draft with Sonnet'}
        </button>

        <button
          onClick={copyPrompt}
          disabled={busy || !brief.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-blkout-300 disabled:opacity-40"
        >
          {copied ? <Check size={15} /> : <Clipboard size={15} />}
          {copied ? 'Copied — paste into a Claude session' : 'Copy as prompt'}
        </button>

        <span className="text-xs text-gray-500">
          Either way it lands as a draft. Nothing posts until you mark it ready and run /post.
        </span>
      </div>
    </section>
  );
}
