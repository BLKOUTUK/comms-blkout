/**
 * #BLKOUT10Years — Campaign Submission Page
 *
 * A/B test: "Share a memory" (Joy track) vs "Share an aspiration" (Futures track)
 * Primary CTA: Voice note via Telegram bot
 * Secondary: Text form → Supabase
 */

import { useState } from 'react';
import { Mic, Send, CheckCircle2, Heart, Sparkles } from 'lucide-react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { supabase } from '@/lib/supabase';

type TrackType = 'memory' | 'aspiration';

export function CelebratePage() {
  const [track, setTrack] = useState<TrackType>('memory');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
  };

  const telegramLink = track === 'memory'
    ? 'https://t.me/blkoutnxtbot?start=memory'
    : 'https://t.me/blkoutnxtbot?start=aspiration';

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <p className="text-liberation-sovereignty-gold text-sm uppercase tracking-[0.3em] font-semibold mb-4">
            #BLKOUT10Years
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
            10 YEARS OF LIBERATION
          </h1>
          <p className="text-lg text-gray-300 max-w-lg mx-auto">
            We want to hear from you.
          </p>
        </div>

        {/* Track Toggle — the A/B test */}
        <div className="text-center mb-8">
          <p className="text-gray-400 mb-4">I want to share...</p>
          <div className="inline-flex gap-3">
            <button
              onClick={() => setTrack('memory')}
              className={`px-6 py-3 font-bold uppercase tracking-wide transition-all ${
                track === 'memory'
                  ? 'bg-liberation-sovereignty-gold text-black'
                  : 'border-2 border-liberation-sovereignty-gold/40 text-liberation-sovereignty-gold/60 hover:border-liberation-sovereignty-gold hover:text-liberation-sovereignty-gold'
              }`}
            >
              A Memory
            </button>
            <button
              onClick={() => setTrack('aspiration')}
              className={`px-6 py-3 font-bold uppercase tracking-wide transition-all ${
                track === 'aspiration'
                  ? 'bg-liberation-sovereignty-gold text-black'
                  : 'border-2 border-liberation-sovereignty-gold/40 text-liberation-sovereignty-gold/60 hover:border-liberation-sovereignty-gold hover:text-liberation-sovereignty-gold'
              }`}
            >
              An Aspiration
            </button>
          </div>
        </div>

        {/* Prompt — changes based on track selection */}
        <div className="bg-[#252547] border-l-4 border-liberation-sovereignty-gold p-8 mb-10 text-center">
          {track === 'memory' ? (
            <>
              <Heart className="w-10 h-10 text-liberation-sovereignty-gold mx-auto mb-4" />
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
                What's your favourite BLKOUT moment?
              </h2>
              <p className="text-gray-300">
                A gathering that changed you. A conversation that stayed with you.
                A moment of joy.
              </p>
            </>
          ) : (
            <>
              <Sparkles className="w-10 h-10 text-liberation-sovereignty-gold mx-auto mb-4" />
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
                What would you build for Black queer men?
              </h2>
              <p className="text-gray-300">
                The future you'd create. The change you'd make.
                The world you'd want to see.
              </p>
            </>
          )}
        </div>

        {/* Voice Note CTA — primary */}
        <div className="text-center mb-12">
          <a
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 bg-liberation-sovereignty-gold text-black font-black uppercase tracking-wide text-lg hover:bg-yellow-400 transition-colors"
          >
            <Mic className="w-6 h-6" />
            Leave Us a Voice Note
          </a>
          <p className="text-gray-500 text-sm mt-3">
            Just hold the mic and talk. 15 seconds is perfect.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-liberation-sovereignty-gold/20" />
          <span className="text-gray-500 text-sm uppercase tracking-widest">or write it</span>
          <div className="flex-1 h-px bg-liberation-sovereignty-gold/20" />
        </div>

        {/* Text Form — secondary */}
        {submitted ? (
          <div className="bg-[#252547] border-t-4 border-liberation-sovereignty-gold p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-liberation-sovereignty-gold mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Thank you, beloved.</h3>
            <p className="text-gray-300">Your voice matters. We'll carry it forward.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full px-4 py-3 bg-[#252547] border border-liberation-sovereignty-gold/20 text-white placeholder-gray-500 focus:border-liberation-sovereignty-gold focus:outline-none"
              />
            </div>
            <div>
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
                className="w-full px-4 py-3 bg-[#252547] border border-liberation-sovereignty-gold/20 text-white placeholder-gray-500 focus:border-liberation-sovereignty-gold focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="w-full px-6 py-3 bg-liberation-sovereignty-gold text-black font-bold uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Sending...' : 'Share'}
            </button>
          </form>
        )}

        {/* Hashtag footer */}
        <div className="text-center mt-12">
          <p className="text-liberation-sovereignty-gold font-bold text-lg">#BLKOUT10Years</p>
          <p className="text-gray-500 text-sm mt-2">
            Share on socials too. We're listening everywhere.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
