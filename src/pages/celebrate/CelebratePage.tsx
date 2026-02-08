/**
 * #BLKOUT10Years — Campaign Page
 *
 * Split video layout:
 *   Left:  "We Are The Heroes" video + Heroes & Theory of Change
 *   Right: "Making Space For What" video (swap for commemorative video on Feb 10)
 *          + "Thank you for 10 / Lead the next" + submission form
 *
 * Confetti bombs on load
 */

import { useState, useRef, useEffect } from 'react';
import { Mic, Send, CheckCircle2, Heart, Sparkles, Crown, ExternalLink } from 'lucide-react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { supabase } from '@/lib/supabase';
import { useConfetti } from '@/hooks/useConfetti';

type TrackType = 'memory' | 'aspiration';

// ── Videos ──
// Swap RIGHT_VIDEO for the commemorative video on Tuesday Feb 10
const LEFT_VIDEO = '/videos/Blkoutheronumber1.mp4';
const RIGHT_VIDEO = '/videos/Making Space For What.mp4';

// ── Community Heroes ──
const HEROES = [
  {
    name: 'Audre Lorde',
    dates: '1934–1992',
    birthday: 'February 18',
    quote: '"Your silence will not protect you."',
    role: 'Poet, warrior, mother — taught us that self-care is political warfare',
  },
  {
    name: 'Justin Fashanu',
    dates: '1961–1998',
    birthday: 'February 19',
    quote: '"I\'d like to think that I was brave enough to do it."',
    role: 'First openly gay professional footballer — broke silence when silence was survival',
  },
  {
    name: 'Marsha P. Johnson',
    dates: '1945–1992',
    birthday: 'August 24',
    quote: '"I was no one, nobody, from Nowheresville, until I became a drag queen."',
    role: 'Stonewall veteran, STAR co-founder — proved liberation is a collective act',
  },
  {
    name: 'James Baldwin',
    dates: '1924–1987',
    birthday: 'August 2',
    quote: '"Not everything that is faced can be changed, but nothing can be changed until it is faced."',
    role: 'Writer who made Black queer existence literary canon',
  },
];

// ── Theory of Change ──
const TOC_STATEMENTS = [
  { text: 'The damage is structural. The repair is relational.', label: 'THE THESIS' },
  { text: "We've learned to survive alone together. That's not community — that's proximity.", label: 'THE RECOGNITION' },
  { text: 'Loving ourselves is learned through community. Self-love requires collective healing.', label: 'THE MISSING LINK' },
  { text: 'Liberation is freedom from harm, and freedom to imagine better.', label: 'THE INVITATION' },
];

// ── Scroll-triggered video ──
function ScrollVideo({ src, className = '' }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      className={className}
      loop
      muted
      playsInline
      preload="metadata"
    />
  );
}

// ── Main Page ──
export function CelebratePage() {
  const [track, setTrack] = useState<TrackType>('memory');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Confetti on page load
  const { celebration } = useConfetti(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await supabase.from('campaign_submissions').insert({
        name: name.trim() || 'Anonymous',
        message: message.trim(),
        track_type: track,
        campaign: 'blkout10years',
        created_at: new Date().toISOString(),
      });
    } catch {
      // Still show success — don't block the experience
    }
    setSubmitted(true);
    setSubmitting(false);
    // Confetti on submission too
    celebration();
  };

  const telegramLink = track === 'memory'
    ? 'https://t.me/blkoutnxtbot?start=memory'
    : 'https://t.me/blkoutnxtbot?start=aspiration';

  return (
    <PublicLayout>
      {/* ─── Hero ─── */}
      <div className="text-center mb-10">
        <p className="text-liberation-sovereignty-gold text-sm uppercase tracking-[0.3em] font-semibold mb-4">
          #BLKOUT10Years
        </p>
        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-4">
          10 YEARS OF LIBERATION
        </h1>
        <p className="text-lg text-gray-300 max-w-lg mx-auto">
          A decade of building community. Now we want to hear from you.
        </p>
      </div>

      {/* ─── Split Video Section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12">
        {/* LEFT VIDEO — Heroes */}
        <div className="relative overflow-hidden rounded-lg group">
          <ScrollVideo
            src={LEFT_VIDEO}
            className="w-full aspect-video object-cover"
          />
          {/* Overlay caption */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <p className="text-liberation-sovereignty-gold text-xs uppercase tracking-widest font-semibold mb-1">
              Our Story
            </p>
            <p className="text-white font-black text-lg uppercase tracking-tight">
              We Are The Heroes We've Been Waiting For
            </p>
          </div>
          {/* Gold border glow on hover */}
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-liberation-sovereignty-gold/50 rounded-lg transition-colors duration-500 pointer-events-none" />
        </div>

        {/* RIGHT VIDEO — Making Space */}
        <div className="relative overflow-hidden rounded-lg group">
          <ScrollVideo
            src={RIGHT_VIDEO}
            className="w-full aspect-video object-cover"
          />
          {/* Overlay caption */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <p className="text-liberation-sovereignty-gold text-xs uppercase tracking-widest font-semibold mb-1">
              The Next Chapter
            </p>
            <p className="text-white font-black text-lg uppercase tracking-tight">
              Making Space For What Matters
            </p>
          </div>
          {/* Gold border glow on hover */}
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-liberation-sovereignty-gold/50 rounded-lg transition-colors duration-500 pointer-events-none" />
        </div>
      </div>

      {/* ─── Split Content Section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

        {/* ═══ LEFT: Heroes & Theory of Change ═══ */}
        <div className="space-y-8">

          {/* Heroes */}
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wide mb-6 flex items-center gap-3">
              <Crown className="w-5 h-5 text-liberation-sovereignty-gold" />
              Our Heroes
            </h2>
            <div className="space-y-4">
              {HEROES.map((hero) => (
                <div
                  key={hero.name}
                  className="bg-[#252547] border-l-4 border-liberation-sovereignty-gold/60 p-5 hover:border-liberation-sovereignty-gold transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-bold text-lg">{hero.name}</h3>
                      <p className="text-gray-500 text-xs">{hero.dates}</p>
                    </div>
                    <span className="text-liberation-sovereignty-gold/60 text-xs font-semibold whitespace-nowrap">
                      {hero.birthday}
                    </span>
                  </div>
                  <p className="text-liberation-sovereignty-gold italic text-sm mb-2">{hero.quote}</p>
                  <p className="text-gray-400 text-sm">{hero.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Theory of Change */}
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wide mb-6">
              Theory of Change
            </h2>
            <div className="space-y-4">
              {TOC_STATEMENTS.map((statement, i) => (
                <div key={i} className="border-b border-liberation-sovereignty-gold/10 pb-4 last:border-0">
                  <p className="text-liberation-sovereignty-gold/50 text-xs uppercase tracking-widest mb-1">
                    {statement.label}
                  </p>
                  <p className="text-white text-lg font-semibold leading-snug">
                    {statement.text}
                  </p>
                </div>
              ))}
            </div>

            <a
              href="https://blkoutuk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-liberation-sovereignty-gold text-sm font-semibold hover:text-yellow-400 transition-colors"
            >
              Experience the full Theory of Change
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* ═══ RIGHT: Thank you for 10 / Lead the next ═══ */}
        <div className="space-y-8">

          {/* Call to Lead */}
          <div className="bg-[#252547] p-6 text-center">
            <p className="text-liberation-sovereignty-gold text-sm uppercase tracking-[0.2em] font-semibold mb-2">
              Thank you for 10 years
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-3">
              Now Lead the Next 10
            </h2>
            <p className="text-gray-300 text-sm mb-4">
              Our board is growing. We need people who believe in collective liberation
              and want to shape what BLKOUT becomes next.
            </p>
            <a
              href="https://blkoutuk.com/governance"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-liberation-sovereignty-gold text-black font-bold uppercase tracking-wide text-sm hover:bg-yellow-400 transition-colors"
            >
              <Crown className="w-4 h-4" />
              Join the Board
            </a>
            <p className="text-gray-500 text-xs mt-3">
              Applications close February 21, 2026
            </p>
          </div>

          {/* Track Toggle */}
          <div className="text-center">
            <p className="text-gray-400 mb-4 text-sm">I want to share...</p>
            <div className="inline-flex gap-3">
              <button
                onClick={() => setTrack('memory')}
                className={`px-5 py-2.5 font-bold uppercase tracking-wide text-sm transition-all ${
                  track === 'memory'
                    ? 'bg-liberation-sovereignty-gold text-black'
                    : 'border-2 border-liberation-sovereignty-gold/40 text-liberation-sovereignty-gold/60 hover:border-liberation-sovereignty-gold hover:text-liberation-sovereignty-gold'
                }`}
              >
                A Memory
              </button>
              <button
                onClick={() => setTrack('aspiration')}
                className={`px-5 py-2.5 font-bold uppercase tracking-wide text-sm transition-all ${
                  track === 'aspiration'
                    ? 'bg-liberation-sovereignty-gold text-black'
                    : 'border-2 border-liberation-sovereignty-gold/40 text-liberation-sovereignty-gold/60 hover:border-liberation-sovereignty-gold hover:text-liberation-sovereignty-gold'
                }`}
              >
                An Aspiration
              </button>
            </div>
          </div>

          {/* Prompt */}
          <div className="bg-[#252547] border-l-4 border-liberation-sovereignty-gold p-6 text-center">
            {track === 'memory' ? (
              <>
                <Heart className="w-8 h-8 text-liberation-sovereignty-gold mx-auto mb-3" />
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                  What's your favourite BLKOUT moment?
                </h3>
                <p className="text-gray-300 text-sm">
                  A gathering that changed you. A conversation that stayed with you.
                  A moment of joy.
                </p>
              </>
            ) : (
              <>
                <Sparkles className="w-8 h-8 text-liberation-sovereignty-gold mx-auto mb-3" />
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                  What would you build for Black queer men?
                </h3>
                <p className="text-gray-300 text-sm">
                  The future you'd create. The change you'd make.
                  The world you'd want to see.
                </p>
              </>
            )}
          </div>

          {/* Voice Note CTA */}
          <div className="text-center">
            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-liberation-sovereignty-gold text-black font-black uppercase tracking-wide hover:bg-yellow-400 transition-colors"
            >
              <Mic className="w-5 h-5" />
              Leave Us a Voice Note
            </a>
            <p className="text-gray-500 text-sm mt-2">
              Just hold the mic and talk. 15 seconds is perfect.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-liberation-sovereignty-gold/20" />
            <span className="text-gray-500 text-xs uppercase tracking-widest">or write it</span>
            <div className="flex-1 h-px bg-liberation-sovereignty-gold/20" />
          </div>

          {/* Text Form */}
          {submitted ? (
            <div className="bg-[#252547] border-t-4 border-liberation-sovereignty-gold p-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-liberation-sovereignty-gold mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Thank you, beloved.</h3>
              <p className="text-gray-300 text-sm">Your voice matters. We'll carry it forward.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full px-4 py-3 bg-[#252547] border border-liberation-sovereignty-gold/20 text-white placeholder-gray-500 focus:border-liberation-sovereignty-gold focus:outline-none text-sm"
              />
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder={
                  track === 'memory'
                    ? 'My BLKOUT moment...'
                    : "The future I'd build..."
                }
                className="w-full px-4 py-3 bg-[#252547] border border-liberation-sovereignty-gold/20 text-white placeholder-gray-500 focus:border-liberation-sovereignty-gold focus:outline-none text-sm"
              />
              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="w-full px-6 py-3 bg-liberation-sovereignty-gold text-black font-bold uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Sending...' : 'Share'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ─── Key Dates ─── */}
      <div className="mt-16 border-t border-liberation-sovereignty-gold/20 pt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-[#252547] p-4">
            <p className="text-liberation-sovereignty-gold font-bold text-lg">Feb 10</p>
            <p className="text-white text-sm font-semibold">10th Anniversary</p>
            <p className="text-gray-500 text-xs">BLKOUT's founding day</p>
          </div>
          <div className="bg-[#252547] p-4">
            <p className="text-liberation-sovereignty-gold font-bold text-lg">Feb 18</p>
            <p className="text-white text-sm font-semibold">Audre Lorde</p>
            <p className="text-gray-500 text-xs">Birthday tribute</p>
          </div>
          <div className="bg-[#252547] p-4">
            <p className="text-liberation-sovereignty-gold font-bold text-lg">Feb 19</p>
            <p className="text-white text-sm font-semibold">Justin Fashanu</p>
            <p className="text-gray-500 text-xs">Birthday tribute</p>
          </div>
          <div className="bg-[#252547] p-4">
            <p className="text-liberation-sovereignty-gold font-bold text-lg">Feb 21</p>
            <p className="text-white text-sm font-semibold">Board Deadline</p>
            <p className="text-gray-500 text-xs">EOI closes</p>
          </div>
        </div>
      </div>

      {/* ─── Hashtag footer ─── */}
      <div className="text-center mt-12">
        <p className="text-liberation-sovereignty-gold font-bold text-lg">#BLKOUT10Years</p>
        <p className="text-gray-500 text-sm mt-2">
          Share on socials too. We're listening everywhere.
        </p>
      </div>
    </PublicLayout>
  );
}
