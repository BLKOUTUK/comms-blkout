-- Facebook Page video for the weekly AIvor events video (Rob, 26 Oct 2026). Set once posted,
-- so a retry never posts twice.
alter table public.aivor_event_digests add column if not exists facebook_url text;
