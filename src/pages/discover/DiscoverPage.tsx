
import { useState } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { YouTubeEmbed } from '@/components/discover/YouTubeEmbed';
import { SocialMediaFeed } from '@/components/discover/SocialMediaFeed';
import { BlkoutHubWidget } from '@/components/discover/BlkoutHubWidget';
import { NewsletterArchive } from '@/components/discover/NewsletterArchive';
import { ArchiveArticleWidget } from '@/components/discover/ArchiveArticleWidget';
import { BlkoutVoicesWidget } from '@/components/discover/BlkoutVoicesWidget';
import { FeaturedEventsWidget } from '@/components/discover/FeaturedEventsWidget';
import { LearningWidget } from '@/components/discover/LearningWidget';
import { NewsletterSignup } from '@/components/discover/NewsletterSignup';
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
              src="/images/blkout_logo_roundel_colour.png"
              alt="BLKOUT"
              className="w-36 h-36 object-contain drop-shadow-lg"
            />
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
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

      {/* BLKOUT HUB Widget */}
      {visible('hub') && (
        <section className="mb-12 bg-white/95 rounded-2xl p-8 shadow-lg backdrop-blur-sm">
          <BlkoutHubWidget />
        </section>
      )}

      {/* Featured Events */}
      {visible('events') && (
        <section className="mb-12 bg-white/95 rounded-2xl p-8 shadow-lg backdrop-blur-sm">
          <FeaturedEventsWidget />
        </section>
      )}

      {/* Social Media Feed */}
      {visible('social') && (
        <section className="mb-12 bg-white/95 rounded-2xl p-8 shadow-lg backdrop-blur-sm">
          <SocialMediaFeed />
        </section>
      )}

      {/* Newsletter Archive */}
      {visible('newsletter') && (
        <section className="mb-12 bg-white/95 rounded-2xl p-8 shadow-lg backdrop-blur-sm">
          <NewsletterArchive />
        </section>
      )}

      {/* BLKOUT Voices Blog */}
      {visible('voices') && (
        <section className="mb-12 bg-white/95 rounded-2xl p-8 shadow-lg backdrop-blur-sm">
          <BlkoutVoicesWidget />
        </section>
      )}

      {/* Learning & Self-Improvement */}
      {visible('learning') && (
        <section className="mb-12 bg-white/95 rounded-2xl p-8 shadow-lg backdrop-blur-sm">
          <LearningWidget />
        </section>
      )}

      {/* Archive Article */}
      {visible('archive') && (
        <section className="mb-12 bg-white/95 rounded-2xl p-8 shadow-lg backdrop-blur-sm">
          <ArchiveArticleWidget />
        </section>
      )}

      {/* Ivor's Compass — Heritage project feature */}
      <section className="mb-12">
        <a
          href="https://compass.blkoutuk.cloud"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-gradient-to-br from-yellow-900/30 via-black to-black border-2 border-liberation-gold-divine/40 rounded-2xl p-8 hover:border-liberation-gold-divine hover:shadow-2xl transition-all duration-300 group"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex-shrink-0 w-20 h-20 rounded-full bg-liberation-gold-divine/10 border-2 border-liberation-gold-divine/40 flex items-center justify-center group-hover:bg-liberation-gold-divine/20 transition-colors">
              <svg className="w-10 h-10 text-liberation-gold-divine" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-widest text-liberation-gold-divine font-bold mb-2">Heritage Project</div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
                Ivor's Compass
              </h2>
              <p className="text-gray-300 text-base md:text-lg mb-4 leading-relaxed">
                A life hidden for a generation. Ivor Cummings was the first Black official in the Colonial Office, welcomed the Windrush generation, and was gay. His story disappeared for thirty years. We brought it back. Explore the digital companion — meditations, a community graphic novel, and a wellness journal grounded in his life.
              </p>
              <span className="inline-flex items-center gap-2 text-liberation-gold-divine font-bold uppercase text-sm group-hover:gap-3 transition-all">
                Open the Compass
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
              </span>
            </div>
          </div>
        </a>
      </section>

      {/* Meet the Board */}
      <section className="mb-12">
        <a
          href="https://blkoutuk.com/our-board/"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-gradient-to-br from-gray-900 to-black border-2 border-liberation-gold-divine/30 rounded-2xl p-8 hover:border-liberation-gold-divine hover:shadow-2xl transition-all duration-300 group"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex-shrink-0 w-20 h-20 rounded-full bg-liberation-gold-divine/10 border-2 border-liberation-gold-divine/40 flex items-center justify-center group-hover:bg-liberation-gold-divine/20 transition-colors">
              <Users className="w-10 h-10 text-liberation-gold-divine" />
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-widest text-liberation-gold-divine font-bold mb-2">Community Benefit Society</div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
                Meet the Board
              </h2>
              <p className="text-gray-300 text-base md:text-lg mb-4 leading-relaxed">
                BLKOUT is owned by its members and governed by Black queer men who volunteer their time to steer this cooperative. Paired leadership, community advisory groups, and full transparency.
              </p>
              <span className="inline-flex items-center gap-2 text-liberation-gold-divine font-bold uppercase text-sm group-hover:gap-3 transition-all">
                See Who We Are
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
              </span>
            </div>
          </div>
        </a>
      </section>

      {/* Watch: Critical Frequency */}
      {visible('youtube') && (
        <section className="mb-12 bg-white/95 rounded-2xl p-8 shadow-lg backdrop-blur-sm">
          <YouTubeEmbed
            videoId="BcBwsjtP86Q"
            title="Critical Frequency"
            description="Data invisibility is a political problem, not a comms challenge. Content note: discusses suicide and systemic failure."
          />
        </section>
      )}

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

      {/* Social Follow Section - dark theme */}
      <div className="mb-12 pt-8 border-t border-liberation-gold-divine/20">
        <h2 className="text-3xl font-display font-bold text-white mb-8 text-center">
          Follow Our Journey
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="https://instagram.com/blkout_uk"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-liberation-gold-divine/30 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-liberation-gold-divine transition-colors">
                  Instagram
                </h3>
                <p className="text-sm text-gray-400">@blkout_uk</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Visual stories from our community and organizing work
            </p>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-liberation-gold-divine/10 text-liberation-gold-divine rounded-lg text-sm font-semibold border border-liberation-gold-divine/30 group-hover:bg-liberation-gold-divine/20 transition-colors">
              View on Instagram
            </span>
          </a>

          <a
            href="https://linkedin.com/company/blkout-uk"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-liberation-gold-divine/30 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-liberation-gold-divine transition-colors">
                  LinkedIn
                </h3>
                <p className="text-sm text-gray-400">BLKOUT UK</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Professional insights and campaign updates
            </p>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-liberation-gold-divine/10 text-liberation-gold-divine rounded-lg text-sm font-semibold border border-liberation-gold-divine/30 group-hover:bg-liberation-gold-divine/20 transition-colors">
              View on LinkedIn
            </span>
          </a>
        </div>
      </div>

      {/* Newsletter Signup */}
      <section className="mb-12 bg-white/95 rounded-2xl p-8 shadow-lg backdrop-blur-sm">
        <NewsletterSignup />
      </section>

      {/* Platform CTA - dark themed */}
      <div className="mb-8 pt-8 border-t border-liberation-gold-divine/20">
        <div className="bg-gradient-to-r from-liberation-gold-divine/10 via-purple-500/10 to-liberation-gold-divine/10 rounded-2xl p-8 text-center border border-liberation-gold-divine/20">
          <h2 className="text-2xl font-display font-bold text-white mb-3">
            Explore the Full BLKOUT Platform
          </h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Access our complete suite of community tools, events calendar, AIvor assistant, and
            more.
          </p>
          <a
            href="https://blkoutuk.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/90 text-black font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
          >
            Visit Community Platform
          </a>
        </div>
      </div>
    </PublicLayout>
  );
}
