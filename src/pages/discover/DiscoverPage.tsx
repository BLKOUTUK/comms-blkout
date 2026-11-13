
import { useEffect, useState } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { YouTubeEmbed } from '@/components/discover/YouTubeEmbed';
import { SocialMediaFeed } from '@/components/discover/SocialMediaFeed';
import { BlkoutHubWidget } from '@/components/discover/BlkoutHubWidget';
import { NewsletterArchive } from '@/components/discover/NewsletterArchive';
import { NewsWidget } from '@/components/discover/NewsWidget';
import { ArchiveArticleWidget } from '@/components/discover/ArchiveArticleWidget';
import { BlkoutVoicesWidget } from '@/components/discover/BlkoutVoicesWidget';
import { FeaturedEventsWidget } from '@/components/discover/FeaturedEventsWidget';
import { LearningWidget } from '@/components/discover/LearningWidget';
import { PlaygroundWidget } from '@/components/discover/PlaygroundWidget';
import { BoroughDoorsWidget } from '@/components/discover/BoroughDoorsWidget';
import { FeatureRotator, type FeatureSlide } from '@/components/discover/FeatureRotator';
import FoundationLayer from '@/components/foundation/FoundationLayer';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Search } from 'lucide-react';

const VOICES_URL = 'https://voices.blkoutuk.cloud';

/* Dated "now" cards: each shows only between `from` and `until` (UTC), so nothing
   stale lingers (the Icons Quiz sat here for two weeks after it ended). Add the next
   campaign here with its end date. */
type NowCard = { from: string; until: string; label: string; title: string; blurb: string; cta: string; href: string; image?: string; focus?: string };
const NOW_CARDS: readonly NowCard[] = [
  {
    from: '2026-11-13T09:07:00Z', until: '2026-12-01T00:00:00Z',
    label: 'New on Voices · 13 Nov',
    title: 'Jason Jones wins at the Privy Council',
    blurb: "Five justices rule, unanimously, that Trinidad and Tobago's laws criminalising gay men cannot stand.",
    cta: 'Read it',
    href: 'https://voices.blkoutuk.com/articles/jason-jones-wins-at-the-privy-council?utm_source=discover&utm_medium=web&utm_campaign=now-card',
    image: 'https://raw.githubusercontent.com/BLKOUTUK/commons/main/public/voices/jason-jones-privy-council-hero.jpg',
    focus: '92% 25%',
  },
];

/* Explore: the lasting things worth a visit, rotating under the tiles. Add Ten Years,
   Liberation and the latest Drop here once their addresses are confirmed. */
const EXPLORE: FeatureSlide[] = [
  { key: 'hub', eyebrow: 'BLKOUTHUB', title: 'Where we meet online', blurb: 'Our members-first community platform: forums, groups, events.', href: 'https://blkouthub.com', image: '/images/blkouthub_logo.png', fit: 'contain', cta: 'Visit the Hub' },
  { key: 'oomf', eyebrow: 'Play · OOMF', title: "We're the heroes we've been waiting for", blurb: 'Put yourself in the story: an interactive Afrofuturist comic.', href: 'https://oomf.blkoutuk.com/', image: 'https://blkoutuk.com/images/theory-of-change/the%20oomf%20crew.jpg', focus: '50% 20%', cta: 'Play' },
  { key: 'commons', eyebrow: 'The Commons', title: 'Shared ground, shared ambition', blurb: 'Where Black queer men co-create the digital world we deserve.', href: 'https://commons.blkoutuk.com/', image: '/images/foundation/joy-08.jpg', focus: '50% 30%', cta: 'Step in' },
];

const GATEWAY = [
  { title: "What's on", blurb: 'Gatherings, all checked', href: 'https://events.blkoutuk.com', accent: '#ffe600' },
  { title: 'Near you', blurb: 'Your borough, your city', href: '#near-you', accent: '#d4af37' },
  { title: 'Voices', blurb: 'Essays and stories from us', href: 'https://voices.blkoutuk.com', accent: '#00a86b' },
  { title: 'News', blurb: 'The week, voted up by the community', href: 'https://news.blkoutuk.com', accent: '#9b4dca' },
  { title: 'Watch', blurb: 'Films and shorts on YouTube', href: 'https://www.youtube.com/@blkoutuk', accent: '#ff1493' },
  { title: 'Meet AIvor', blurb: 'Our guide to the whole platform', href: 'https://blkoutuk.com/intro', accent: '#5b9bd5' },
  { title: 'Newsletter', blurb: 'Once a month, in your inbox', href: '/preferences', accent: '#d4af37', invert: '#0a0a14' },
  { title: 'Join', blurb: 'Become a member‑owner', href: 'https://blkoutuk.com/governance', accent: '#e31e24', invert: '#f5f1e8', fill: '#a3151a' },
] as const;

const SECTIONS = [
{ id: 'hub', keywords: ['hub', 'community', 'connect', 'blkouthub'] },
  { id: 'events', keywords: ['events', 'calendar', 'upcoming', 'pride', 'picnic'] },
  { id: 'boroughs', keywords: ['borough', 'boroughs', 'local', 'map', 'london', 'near', 'nearby', 'brent', 'camden', 'croydon', 'enfield', 'hackney', 'haringey', 'islington', 'lambeth', 'lewisham', 'newham', 'southwark', 'tower', 'tower hamlets', 'waltham', 'waltham forest', 'westminster', 'birmingham', 'brum', 'door', 'doors'] },
  { id: 'playground', keywords: ['playground', 'games', 'play', 'oomf', 'comic', 'sky', 'constellations', 'compass', 'interactive'] },
  { id: 'social', keywords: ['social', 'media', 'instagram', 'linkedin'] },
  { id: 'newsletter', keywords: ['newsletter', 'email', 'subscribe', 'archive'] },
  { id: 'voices', keywords: ['voices', 'blog', 'articles', 'stories', 'writing'] },
  { id: 'learning', keywords: ['learning', 'courses', 'skills', 'self-improvement', 'certificates', 'mentorship', 'growth', 'development'] },
  { id: 'archive', keywords: ['archive', 'history', 'past', 'article'] },
  { id: 'youtube', keywords: ['youtube', 'video', 'watch', 'channel'] },
] as const;

function matchesSearch(keywords: readonly string[], query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return keywords.some(k => k.includes(q)) || q.split(/\s+/).some(word => keywords.some(k => k.includes(word)));
}

export function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const now = Date.now();
  const nowCards = NOW_CARDS.filter(c => now >= Date.parse(c.from) && now < Date.parse(c.until));
  const [live, setLive] = useState<FeatureSlide[]>([]);

  // Fill the Now box from what we already publish: newest Voices piece, next BLKOUT-run
  // event, this week's top news story. Each source fails quietly on its own.
  useEffect(() => {
    let cancelled = false;
    const today = new Date().toISOString().split('T')[0];
    const voices = fetch(`${VOICES_URL}/api/articles`).then(r => r.json()).then(d => {
      const a = d?.success && Array.isArray(d.data) ? d.data[0] : null;
      return a ? [{ key: `voices-${a.id}`, eyebrow: 'New on Voices', title: a.title, blurb: a.excerpt ?? undefined, href: `https://voices.blkoutuk.com/articles/${a.slug}`, image: a.hero_image ?? null, cta: 'Read it' }] : [];
    }).catch(() => []);
    const event = isSupabaseConfigured()
      ? Promise.resolve(supabase.from('events').select('id, title, date, location, image_url').eq('status', 'approved').gte('date', today).ilike('organizer', '%blkout%').order('date', { ascending: true }).limit(1))
          .then(({ data }) => {
            const e = data?.[0];
            if (!e) return [];
            const day = new Date(`${e.date}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
            return [{ key: `event-${e.id}`, eyebrow: `Next BLKOUT event · ${day}`, title: e.title, blurb: e.location ?? undefined, href: `https://events.blkoutuk.com/e/${e.id}`, image: e.image_url ?? null, cta: 'Find out more' }];
          }).catch(() => [])
      : Promise.resolve([]);
    const news = fetch('https://news.blkoutuk.cloud/api/top-stories?period=week&limit=1').then(r => r.json()).then(d => {
      const n = d?.data?.topStories?.[0];
      return n ? [{ key: `news-${n.id}`, eyebrow: 'This week in news', title: n.title, blurb: n.source_name ? `via ${n.source_name} · vote on the week's stories` : undefined, href: 'https://news.blkoutuk.com', image: n.featured_image ?? null, cta: 'See the week' }] : [];
    }).catch(() => []);
    Promise.all([voices, event, news]).then(parts => { if (!cancelled) setLive(parts.flat() as FeatureSlide[]); });
    return () => { cancelled = true; };
  }, []);

  const manualSlides: FeatureSlide[] = nowCards.map(c => ({ key: c.href, eyebrow: c.label, title: c.title, blurb: c.blurb, href: c.href, image: c.image ?? null, focus: c.focus, cta: c.cta }));
  // A dated card about a Voices piece replaces that piece's automatic slide
  const nowSlides = [...manualSlides, ...live.filter(l => !manualSlides.some(m => m.href.split('?')[0] === l.href))];

  const visible = (id: string) => {
    const section = SECTIONS.find(s => s.id === id);
    return section ? matchesSearch(section.keywords, searchQuery) : true;
  };

  return (
    <PublicLayout>
      {/* GATEWAY — the page people land on from every social bio (blkoutuk.com/now).
          Phone first: who we are in one line, what's on now, then one tap to anywhere. */}
      {/* Hero + Now: stacked on phones; side by side on desktop so the hero's right half isn't empty */}
      <div className={`-mt-4 sm:mt-0 mb-4 grid gap-4 ${nowSlides.length ? 'lg:grid-cols-[3fr_2fr]' : ''}`}>
        <section className="relative overflow-hidden bg-[#0a0a14] border-b-4 border-[#d4af37]">
          {/* Real community photography (BLKOUT's own events), kept low behind the words */}
          {/* Desktop only: on phones the Now box's image sits directly below, and a photo behind the words muddies them */}
          <FoundationLayer src="/images/foundation/joy-07.jpg" anchor="60% 35%" opacity={0.9} className="hidden sm:block !left-[50%]" />
          <div className="hidden sm:block absolute inset-y-0 left-[50%] right-0 pointer-events-none bg-gradient-to-r from-[#0a0a14] via-[#0a0a14]/40 to-transparent" />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_85%_0%,rgba(74,25,66,0.45),transparent_60%)]" />
          <div className="relative px-4 py-5 sm:py-7">
            <p className="font-['IBM_Plex_Mono'] font-medium text-[11px] tracking-[0.3em] uppercase text-[#d4af37] mb-3">
              Discover <span className="text-[#d4af37]">·</span> start here
            </p>
            {/* The header already carries the wordmark; on phones the tagline leads so the tiles reach the first screen */}
            <p aria-hidden="true" className="hidden sm:block font-['Work_Sans'] font-black uppercase leading-[0.85] tracking-[-0.04em] text-[#f5f1e8] text-[clamp(3.5rem,6vw,4.5rem)]">
              BLKOUT<span className="text-[#d4af37]">.</span>
            </p>
            <h1 className="font-['Fraunces'] italic text-[#d4af37] text-2xl sm:text-3xl leading-tight sm:mt-4 sm:max-w-[48%]">
              The Black Queer Men's Liberation Collective
            </h1>
            <p className="text-[#f5f1e8]/85 text-base sm:text-lg mt-2 max-w-xl sm:max-w-[46%]">
              Gatherings, dialogue and community-owned tech for Black gay, bi and trans men in the UK. Member-owned.
            </p>
          </div>
        </section>

        {/* NOW — dated cards plus live slides (Voices, next BLKOUT event, news), rotating */}
        {nowSlides.length > 0 && <FeatureRotator label="On now" slides={nowSlides} />}
      </div>

      {/* ONE TAP — each tile wears its section's colour (DESIGN.md §2.2); the whole tile is the link */}
      <nav aria-label="Go to" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {GATEWAY.map(t => {
          /* Action tiles (newsletter, join) are inverted: filled in their accent so they stand out
             from the navigation tiles. Text flips per DESIGN.md §2.1 "cream on accent". */
          const ink = 'invert' in t ? t.invert : undefined;
          return (
            <a
              key={t.title}
              href={t.href}
              className={`flex flex-col min-h-[112px] lg:min-h-0 border-t-4 p-4 lg:py-6 outline-2 outline-offset-2 hover:outline active:outline ${ink ? '' : 'bg-[#14141f]'}`}
              style={{ borderTopColor: t.accent, outlineColor: t.accent, ...(ink ? { backgroundColor: 'fill' in t ? t.fill : t.accent } : {}) }}
            >
              <span className="flex items-start justify-between gap-4">
                <span className="font-['Work_Sans'] font-black uppercase text-[17px] sm:text-xl leading-none tracking-tight" style={{ color: ink ?? '#f5f1e8' }}>{t.title}</span>
                <span className="shrink-0 text-xl leading-none" style={{ color: ink ?? t.accent }} aria-hidden="true">→</span>
              </span>
              <span className="text-sm mt-2 leading-snug" style={{ color: ink ?? '#a8a195' }}>{t.blurb}</span>
            </a>
          );
        })}
      </nav>

      {/* EXPLORE — lasting features, rotating */}
      <div className="mb-10">
        <p className="font-['IBM_Plex_Mono'] font-medium text-[11px] tracking-[0.3em] uppercase text-[#d4af37] mb-2">Explore</p>
        <FeatureRotator label="Explore BLKOUT" slides={EXPLORE} intervalMs={7000} threeUpOnDesktop className="lg:bg-transparent" />
      </div>

      {/* Search — filters the sections below */}
      <div className="mb-8">
        <label htmlFor="discover-search" className="block font-['IBM_Plex_Mono'] font-medium text-[11px] tracking-[0.3em] uppercase text-[#d4af37] mb-2">
          Everything else <span className="text-[#d4af37]">·</span> search
        </label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#d4af37]" />
          <input
            id="discover-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, news, video"
            className="w-full pl-12 pr-16 py-3.5 bg-[#14141f] border-2 border-[#d4af37]/40 text-[#f5f1e8] text-base placeholder-[#a8a195] focus:outline-none focus:border-[#d4af37] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a8a195] hover:text-[#f5f1e8] text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* BENTO GRID — asymmetric, signature aesthetic.
          Cells: dark canvas + heavy gold border + sharp edges + variable spans.
          Container shell IS the chrome; flex-centered so widget content fills
          the cell vertically (no foot gap when content is shorter than cell). */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 auto-rows-[minmax(180px,auto)] mb-12">

        {/* Newsletter — tall sidebar, vertical newsletter list */}
        {visible('newsletter') && (
          <section className="md:col-span-5 md:row-span-2 border-2 border-liberation-gold-divine/40 hover:border-liberation-gold-divine/70 transition-colors p-6 md:p-8 bg-black/40 flex flex-col justify-center">
            <NewsletterArchive />
          </section>
        )}

        {/* HUB */}
        {visible('hub') && (
          <section className="md:col-span-7 border-2 border-liberation-gold-divine/40 hover:border-liberation-gold-divine/70 transition-colors p-6 md:p-8 bg-black/40 flex flex-col justify-center">
            <BlkoutHubWidget />
          </section>
        )}

        {/* News — top stories from news.blkoutuk.com */}
        <section className="md:col-span-7 border-2 border-news/40 hover:border-news/70 transition-colors p-6 md:p-8 bg-black/40 flex flex-col justify-center">
          <NewsWidget />
        </section>

        {/* YouTube — Critical Frequency, moved up to break the 5-7 alternation */}
        {visible('youtube') && (
          <section className="md:col-span-7 border-2 border-liberation-gold-divine/40 hover:border-liberation-gold-divine/70 transition-colors p-6 md:p-8 bg-black/40 flex flex-col justify-center">
            <YouTubeEmbed
              videoId="BcBwsjtP86Q"
              title="Critical Frequency"
              description="Data invisibility is a political problem, not a comms challenge. Content note: discusses suicide and systemic failure."
            />
          </section>
        )}

        {/* Featured Event — swapped down from above the YouTube cell */}
        {visible('events') && (
          <section className="md:col-span-5 border-2 border-liberation-gold-divine/40 hover:border-liberation-gold-divine/70 transition-colors p-6 md:p-8 bg-black/40 flex flex-col justify-center">
            <FeaturedEventsWidget />
          </section>
        )}

        {/* AIvor Short — looped 9:16 video, fills the previously-empty cell */}
        <section className="md:col-span-5 md:row-span-2 border-2 border-news/40 hover:border-news/70 transition-colors p-3 md:p-4 bg-black flex items-center justify-center overflow-hidden">
          <div className="aspect-[9/16] w-full max-w-[300px] mx-auto">
            <iframe
              src="https://www.youtube.com/embed/XWxFDq4tomw?autoplay=1&loop=1&playlist=XWxFDq4tomw&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0"
              title="AIvor — looping short"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0 block"
            />
          </div>
        </section>

        {/* Borough doors — the London map as a gateway into the local pages */}
        {visible('boroughs') && (
          <section id="near-you" className="md:col-span-7 border-2 border-liberation-gold-divine/40 hover:border-liberation-gold-divine/70 transition-colors p-6 md:p-8 bg-black/40 flex flex-col justify-center">
            <BoroughDoorsWidget />
          </section>
        )}

        {/* From the Archive — pulls from blkoutuk.com/stories (270+ articles 2016-2024) */}
        {visible('archive') && (
          <section className="md:col-span-7 border-2 border-liberation-gold-divine/40 hover:border-liberation-gold-divine/70 transition-colors p-6 md:p-8 bg-black/40 flex flex-col justify-center">
            <ArchiveArticleWidget />
          </section>
        )}

        {/* Voices */}
        {visible('voices') && (
          <section className="md:col-span-7 border-2 border-liberation-gold-divine/40 hover:border-liberation-gold-divine/70 transition-colors p-6 md:p-8 bg-black/40 flex flex-col justify-center">
            <BlkoutVoicesWidget />
          </section>
        )}

        {/* Social Feed */}
        {visible('social') && (
          <section className="md:col-span-5 border-2 border-liberation-gold-divine/40 hover:border-liberation-gold-divine/70 transition-colors p-6 md:p-8 bg-black/40 flex flex-col justify-center">
            <SocialMediaFeed />
          </section>
        )}

        {/* Playground — games and interactive elements */}
        {visible('playground') && (
          <section className="md:col-span-7 border-2 border-liberation-gold-divine/40 hover:border-liberation-gold-divine/70 transition-colors p-6 md:p-8 bg-black/40 flex flex-col justify-center">
            <PlaygroundWidget />
          </section>
        )}

        {/* Learning — full width strip */}
        {visible('learning') && (
          <section className="md:col-span-12 border-2 border-liberation-gold-divine/40 hover:border-liberation-gold-divine/70 transition-colors p-6 md:p-8 bg-black/40 flex flex-col justify-center">
            <LearningWidget />
          </section>
        )}

      </div>

      {/* No results */}
      {searchQuery && !SECTIONS.some(s => matchesSearch(s.keywords, searchQuery)) && (
        <div className="text-center py-16">
          <p className="text-[#a8a195] text-lg">No sections match "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-liberation-gold-divine hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* About — the standard descriptor, verbatim from platform/COMMS.md (approved 16 Sep 2026) */}
      <section className="mb-12 max-w-3xl border-t-4 border-[#d4af37] pt-6">
        <p className="font-['IBM_Plex_Mono'] font-medium text-[11px] tracking-[0.3em] uppercase text-[#d4af37] mb-3">About BLKOUT</p>
        <p className="text-[#f5f1e8]/85 text-base sm:text-lg leading-relaxed">
          BLKOUT is the Black Queer Men's Liberation Collective. We host gatherings, build space for dialogue, and create community-owned technology for the health, wealth and happiness of Black gay, bi and trans men across the UK. Through local chapters, cooperative membership, creative events, shared learning, and digital media, we turn connection into individual well-being and collective power &mdash; owned by and accountable to the people we serve.
        </p>
      </section>

      {/* Stray bottom widgets removed:
          - "Follow Our Journey" Instagram/LinkedIn cards — duplicated SocialMediaFeed in bento
          - Empty leftover NewsletterSignup wrapper section
          - "Explore the Full BLKOUT Platform" CTA — redundant (visitors are on the platform)
          PublicLayout footer carries social links + platform navigation. */}
    </PublicLayout>
  );
}
