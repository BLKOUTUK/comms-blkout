-- LinkedIn company-page post for the weekly AIvor events video (Rob, 26 Oct 2026).
-- li_caption: its own organiser-first copy, shown in the Telegram sign-off.
-- linkedin_url: set once posted, so a retry never posts twice.
alter table public.aivor_event_digests
  add column if not exists li_caption text,
  add column if not exists linkedin_url text;
