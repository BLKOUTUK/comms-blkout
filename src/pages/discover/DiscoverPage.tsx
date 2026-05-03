
import { useState } from 'react';
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
import { Heart, Users, Sparkles, Search } from 'lucide-react';

const SECTIONS = [
{ id: 'hub', keywords: ['hub', 'community', 'connect', 'blkouthub'] },
  { id: 'events', keywords: ['events', 'calendar', 'upcoming', 'pride'] },
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

  const visible = (id: string) => {
    const section = SECTIONS.find(s => s.id === id);
    return section ? matchesSearch(section.keywords, searchQuery) : true;
  };

  return (
    <PublicLayout>
      {/* Hero Section - dark theme */}
      <div className="relative mb-16 overflow-hidden">
        <div className="relative text-center animate-fade-in py-12">
          <div className="flex justify-center mb-6">
            <img
              src="/images/blkout-sigil-gold.png"
              alt="BLKOUT"
              className="w-36 h-36 object-contain drop-shadow-2xl"
            />
          </div>

          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-white mb-4">
            Discover BLKOUT
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-4">
            Your home for{' '}
            <span className="text-liberation-gold-divine font-semibold">
              Black queer liberation
            </span>{' '}
            technology
          </p>

          <p className="text-lg text-gray-400 max-w-3xl mx-auto text-balance mb-8">
            Built by and for our communities with sovereignty, safety, and collective power at the
            core.
          </p>

          {/* Values badges */}
          <div className="flex flex-wrap gap-3 justify-center text-sm mb-8">
            <span className="px-5 py-2.5 bg-liberation-gold-divine/10 text-liberation-gold-divine rounded-full font-semibold border border-liberation-gold-divine/30 flex items-center gap-2">
              <Heart size={16} />
              Creator Sovereignty
            </span>
            <span className="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-full font-semibold border border-emerald-500/30 flex items-center gap-2">
              <Users size={16} />
              Community Power
            </span>
            <span className="px-5 py-2.5 bg-purple-500/10 text-purple-400 rounded-full font-semibold border border-purple-500/30 flex items-center gap-2">
              <Sparkles size={16} />
              Democratic Governance
            </span>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-2">
            <div className="bg-white/5 border-2 border-liberation-gold-divine/40 rounded-2xl p-6 backdrop-blur-sm">
              <p className="text-center text-gray-300 text-sm mb-3">
                Find events, articles, newsletters, and videos across the BLKOUT platform
              </p>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-liberation-gold-divine" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Try &quot;events&quot;, &quot;newsletter&quot;, &quot;voices&quot;, &quot;video&quot;..."
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-liberation-gold-divine/50 focus:border-liberation-gold-divine/50 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Event: BMHWA Brown Bag Lunch */}
      <section className="mb-12">
        <a
          href="https://events.teams.microsoft.com/event/5214601e-e40d-4f09-aadc-d06712e7cac1@38543a29-5839-4060-90c6-b1aac6064ddf"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-gradient-to-r from-gray-900 via-black to-gray-900 rounded-2xl p-8 border-2 border-liberation-gold-divine/40 shadow-lg hover:border-liberation-gold-divine/70 hover:shadow-2xl transition-all duration-300 group"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0 text-center">
              <div className="bg-liberation-gold-divine/10 border border-liberation-gold-divine/30 rounded-xl px-5 py-3">
                <p className="text-liberation-gold-divine text-xs font-bold uppercase tracking-widest">Wed 25 March</p>
                <p className="text-white text-lg font-bold">12:00 – 13:00</p>
                <p className="text-gray-400 text-xs">GMT · Online · Free</p>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-liberation-gold-divine text-xs font-bold uppercase tracking-widest mb-2">BMHWA Brown Bag Lunch</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white group-hover:text-liberation-gold-divine transition-colors mb-3">
                Can Good Mental Health 'Go Viral'?
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                BLKOUT UK's Critical Frequency project — machine learning, network science, and behavioural economics for mental health intervention with Black queer men. Dr Rob Berkeley presents, Dr Ariel Breaux Torres in conversation.
              </p>
              <p className="text-gray-500 text-xs">
                More info: <span className="text-liberation-gold-divine underline">critical.blkoutuk.com</span>
              </p>
            </div>
            <div className="flex-shrink-0 text-center">
              <span className="inline-flex items-center gap-2 bg-liberation-gold-divine text-black font-bold py-3 px-6 rounded-lg text-sm group-hover:bg-white group-hover:text-black transition-colors shadow-md">
                Register Free →
              </span>
            </div>
          </div>
        </a>
      </section>

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
          <p className="text-gray-400 text-lg">No sections match "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-liberation-gold-divine hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Stray bottom widgets removed:
          - "Follow Our Journey" Instagram/LinkedIn cards — duplicated SocialMediaFeed in bento
          - Empty leftover NewsletterSignup wrapper section
          - "Explore the Full BLKOUT Platform" CTA — redundant (visitors are on the platform)
          PublicLayout footer carries social links + platform navigation. */}
    </PublicLayout>
  );
}
