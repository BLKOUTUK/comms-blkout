-- BLKOUT What's On, the weekly AIvor events video (Rob, 26 Oct 2026). Kept apart from
-- aivor_digests, whose newest row the news site shows. Rendered and uploaded unlisted
-- Thursday 10:00; Rob signs off from Telegram; made public from 18:00 only once approved.
-- Applied 26 Oct 2026.
create table public.aivor_event_digests (
  id uuid primary key default gen_random_uuid(),
  week_tag text not null unique,
  week_label text,
  video_id text not null,
  video_url text not null,
  summary text,
  privacy text not null default 'unlisted',
  uploaded_at timestamptz not null default now(),
  approved_at timestamptz,
  published_at timestamptz
);
alter table public.aivor_event_digests enable row level security;
-- No policies: service role only (the render workflow and the events server).
revoke all on public.aivor_event_digests from anon, authenticated;
