-- Instagram route for the weekly AIvor events video (Rob, 26 Oct 2026: replaces Zapier).
-- media_url: the mp4 in public storage, which the Graph API fetches for the Reel.
-- ig_caption: the caption Rob sees in the Telegram sign-off, posted unchanged.
-- instagram_url: set once the Reel is live, so a retry never posts twice.
alter table public.aivor_event_digests
  add column if not exists media_url text,
  add column if not exists ig_caption text,
  add column if not exists instagram_url text;
