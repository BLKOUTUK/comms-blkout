/**
 * #BLKOUT10Years — Campaign Page (Simplified)
 *
 * Single video → Clear CTAs: Share a memory/hope + Join the Board
 * Confetti bombs on load + form submission
 */

import { useState } from 'react';
import { Mic, Send, CheckCircle2, Heart, Sparkles, Crown } from 'lucide-react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { supabase } from '@/lib/supabase';
import { useConfetti } from '@/hooks/useConfetti';

type TrackType = 'memory' | 'aspiration';

// ── Video ──
// Swap for commemorative video on Tuesday Feb 10
const MAIN_VIDEO = '/videos/Blkoutheronumber1.mp4';

// ── Theory of Change (saved — use on /movement page) ──
// const TOC_STATEMENTS = [
//   { text: 'The damage is structural. The repair is relational.', label: 'THE THESIS' },
//   { text: "We've learned to survive alone together. That's not community — that's proximity.", label: 'THE RECOGNITION' },
//   { text: 'Loving ourselves is learned through community. Self-love requires collective healing.', label: 'THE MISSING LINK' },
//   { text: 'Liberation is freedom from harm, and freedom to imagine better.', label: 'THE INVITATION' },
// ];

// ── Scroll-triggered video ──
function ScrollVideo({ src, className = '' }: { src: string; className?: string }) {
  const ref = { current: null as HTMLVideoElement | null };

  return (
    <video
      ref={(el) => {
        ref.current = el;
        if (!el) return;
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) el.play().catch(() => {});
            else el.pause();
          },
          { threshold: 0.3 }
        );
        observer.observe(el);
      }}
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
    celebration();
  };

  const telegramLink = track === 'memory'
    ? 'https://t.me/blkoutnxtbot?start=memory'
    : 'https://t.me/blkoutnxtbot?start=aspiration';

  return (
    <PublicLayout>
      {/* ─── Hero ─── */}
      <div className="text-center mb-8">
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

      {/* ─── Single Video ─── */}
      <div className="relative overflow-hidden rounded-lg group mb-16">
        <ScrollVideo
          src={MAIN_VIDEO}
          className="w-full aspect-video object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <p className="text-liberation-sovereignty-gold text-xs uppercase tracking-widest font-semibold mb-1">
            Our Story
          </p>
          <p className="text-white font-black text-lg uppercase tracking-tight">
            We Are The Heroes We've Been Waiting For
          </p>
        </div>
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-liberation-sovereignty-gold/50 rounded-lg transition-colors duration-500 pointer-events-none" />
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* CTA 1: SHARE A MEMORY / SHARE A HOPE       */}
      {/* ═══════════════════════════════════════════ */}

      <section className="max-w-2xl mx-auto mb-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-3">
            Your Voice. Your Story.
          </h2>
          <p className="text-gray-300">
            10 years of moments, memories, and dreams. Share yours.
          </p>
        </div>

        {/* Track Toggle */}
        <div className="text-center mb-8">
          <p className="text-gray-400 mb-4 text-sm">I want to share...</p>
          <div className="inline-flex gap-3">
            <button
              onClick={() => setTrack('memory')}
              className={`px-6 py-3 font-bold uppercase tracking-wide text-sm transition-all rounded ${
                track === 'memory'
                  ? 'bg-liberation-sovereignty-gold text-black'
                  : 'border-2 border-liberation-sovereignty-gold/40 text-liberation-sovereignty-gold/60 hover:border-liberation-sovereignty-gold hover:text-liberation-sovereignty-gold'
              }`}
            >
              A Memory
            </button>
            <button
              onClick={() => setTrack('aspiration')}
              className={`px-6 py-3 font-bold uppercase tracking-wide text-sm transition-all rounded ${
                track === 'aspiration'
                  ? 'bg-liberation-sovereignty-gold text-black'
                  : 'border-2 border-liberation-sovereignty-gold/40 text-liberation-sovereignty-gold/60 hover:border-liberation-sovereignty-gold hover:text-liberation-sovereignty-gold'
              }`}
            >
              A Hope
            </button>
          </div>
        </div>

        {/* Prompt */}
        <div className="bg-[#252547] border-l-4 border-liberation-sovereignty-gold p-8 text-center mb-8 rounded-r-lg">
          {track === 'memory' ? (
            <>
              <Heart className="w-10 h-10 text-liberation-sovereignty-gold mx-auto mb-4" />
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3">
                What's your favourite BLKOUT moment?
              </h3>
              <p className="text-gray-300 text-sm">
                A gathering that changed you. A conversation that stayed with you.
                A moment of joy.
              </p>
            </>
          ) : (
            <>
              <Sparkles className="w-10 h-10 text-liberation-sovereignty-gold mx-auto mb-4" />
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3">
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
        <div className="text-center mb-6">
          <a
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-liberation-sovereignty-gold text-black font-black uppercase tracking-wide hover:bg-yellow-400 transition-colors rounded"
          >
            <Mic className="w-5 h-5" />
            Leave Us a Voice Note
          </a>
          <p className="text-gray-500 text-sm mt-2">
            Just hold the mic and talk. 15 seconds is perfect.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-liberation-sovereignty-gold/20" />
          <span className="text-gray-500 text-xs uppercase tracking-widest">or write it</span>
          <div className="flex-1 h-px bg-liberation-sovereignty-gold/20" />
        </div>

        {/* Text Form */}
        {submitted ? (
          <div className="bg-[#252547] border-t-4 border-liberation-sovereignty-gold p-8 text-center rounded-b-lg">
            <CheckCircle2 className="w-12 h-12 text-liberation-sovereignty-gold mx-auto mb-3" />
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
              className="w-full px-4 py-3 bg-[#252547] border border-liberation-sovereignty-gold/20 text-white placeholder-gray-500 focus:border-liberation-sovereignty-gold focus:outline-none text-sm rounded"
            />
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder={
                track === 'memory'
                  ? 'My BLKOUT moment...'
                  : "The future I'd build..."
              }
              className="w-full px-4 py-3 bg-[#252547] border border-liberation-sovereignty-gold/20 text-white placeholder-gray-500 focus:border-liberation-sovereignty-gold focus:outline-none text-sm rounded"
            />
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="w-full px-6 py-3 bg-liberation-sovereignty-gold text-black font-bold uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm rounded"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Sending...' : 'Share'}
            </button>
          </form>
        )}
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* CTA 2: JOIN THE BOARD                       */}
      {/* ═══════════════════════════════════════════ */}

      <section className="max-w-2xl mx-auto mb-16">
        <div className="border-t border-liberation-sovereignty-gold/20 pt-16">
          <div className="bg-[#252547] p-10 text-center rounded-lg border border-liberation-sovereignty-gold/20">
            <Crown className="w-10 h-10 text-liberation-sovereignty-gold mx-auto mb-4" />
            <p className="text-liberation-sovereignty-gold text-sm uppercase tracking-[0.2em] font-semibold mb-2">
              Thank you for 10 years
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-4">
              Now Lead the Next 10
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Our board is growing. We need people who believe in collective liberation
              and want to shape what BLKOUT becomes next. You don't need a fancy CV — just
              commitment, integrity, and care for our community.
            </p>
            <a
              href="https://blkoutuk.com/governance"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-liberation-sovereignty-gold text-black font-bold uppercase tracking-wide text-sm hover:bg-yellow-400 transition-colors rounded"
            >
              <Crown className="w-4 h-4" />
              Apply to Join the Board
            </a>
            <p className="text-gray-500 text-xs mt-4">
              Applications close February 21, 2026
            </p>
          </div>
        </div>
      </section>

      {/* ─── Hashtag footer ─── */}
      <div className="text-center mt-8 mb-4">
        <p className="text-liberation-sovereignty-gold font-bold text-lg">#BLKOUT10Years</p>
        <p className="text-gray-500 text-sm mt-2">
          Share on socials too. We're listening everywhere.
        </p>
      </div>
    </PublicLayout>
  );
}
