import { useEffect, useRef, useState } from 'react';

export interface FeatureSlide {
  key: string;
  eyebrow: string;
  title: string;
  blurb?: string;
  href: string;
  image?: string | null;
  cta?: string;
  /** 'contain' for logos and marks; photos default to 'cover' */
  fit?: 'cover' | 'contain';
  /** object-position for photos, e.g. '75% 30%' to keep a face in frame */
  focus?: string;
}

/**
 * A rotating feature box: swipeable on phones (scroll-snap), advances every `intervalMs`,
 * stops for good once someone touches it, pauses on hover/focus, and never moves on its own
 * when the viewer prefers reduced motion. Each slide is one whole-surface link; a photo,
 * when present, sits behind an obsidian gradient so the text stays readable.
 */
export function FeatureRotator({
  label,
  slides,
  intervalMs = 6000,
  className = '',
  threeUpOnDesktop = false,
}: {
  label: string;
  slides: FeatureSlide[];
  intervalMs?: number;
  className?: string;
  /** On large screens show three slides side by side (no rotation when all fit) */
  threeUpOnDesktop?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [broken, setBroken] = useState<Record<string, true>>({});

  const go = (i: number) => {
    const el = track.current;
    const child = el?.children[i] as HTMLElement | undefined;
    if (!el || !child) return;
    el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' });
  };
  const allVisible = () => {
    const el = track.current;
    return !!el && el.scrollWidth <= el.clientWidth + 2;
  };

  useEffect(() => {
    if (slides.length < 2 || paused || stopped) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => { if (!allVisible()) go((index + 1) % slides.length); }, intervalMs);
    return () => window.clearInterval(t);
  }, [index, paused, stopped, slides.length, intervalMs]);

  if (slides.length === 0) return null;

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className={`relative min-w-0 bg-[#14141f] ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setStopped(true)}
    >
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          const first = el.children[0] as HTMLElement | undefined;
          setIndex(Math.round(el.scrollLeft / Math.max(first?.offsetWidth ?? el.clientWidth, 1)));
        }}
        className={`flex h-full overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${threeUpOnDesktop ? 'lg:gap-3 lg:bg-[#0a0a14]' : ''}`}
      >
        {slides.map((s, i) => {
          const img = s.image && !broken[s.key] ? s.image : null;
          return (
            <a
              key={s.key}
              href={s.href}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}: ${s.title}`}
              className={`relative flex w-full ${threeUpOnDesktop ? 'lg:w-[calc((100%-1.5rem)/3)] lg:bg-[#14141f]' : ''} h-full shrink-0 snap-start flex-col justify-end min-h-[300px] border-l-4 border-[#d4af37] pl-3 pr-4 pt-5 ${threeUpOnDesktop ? 'pb-6' : 'pb-12'} outline-2 -outline-offset-2 hover:outline focus-visible:outline outline-[#ffd700]`}
            >
              {s.fit === 'contain' && (
                <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(74,25,66,0.6),transparent_65%)]" aria-hidden="true" />
              )}
              {img && (
                <>
                  <img
                    src={img}
                    alt=""
                    loading={i === 0 ? 'eager' : 'lazy'}
                    onError={() => setBroken(b => ({ ...b, [s.key]: true }))}
                    style={s.fit === 'contain' ? undefined : { objectPosition: s.focus ?? '50% 30%' }}
                    className={s.fit === 'contain'
                      ? 'absolute left-1/2 -translate-x-1/2 top-5 h-24 w-24 object-contain'
                      : 'absolute inset-0 w-full h-full object-cover'}
                  />
                  {s.fit !== 'contain' && (
                    <span className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] from-35% via-[#0a0a14]/90 via-60% to-transparent" aria-hidden="true" />
                  )}
                </>
              )}
              <span className="relative">
                <span className="inline-block bg-[#0a0a14] px-2 py-1 -ml-2 font-['IBM_Plex_Mono'] font-medium text-[11px] tracking-[0.3em] uppercase text-[#d4af37] mb-1">{s.eyebrow}</span>
                <span className="block font-['Work_Sans'] font-black uppercase text-[#f5f1e8] text-xl sm:text-2xl leading-tight tracking-tight">{s.title}</span>
                {s.blurb && <span className="block text-[#f5f1e8]/85 text-sm sm:text-base mt-2 line-clamp-2">{s.blurb}</span>}
                <span className="block mt-2 text-[#d4af37] font-semibold text-sm">{s.cta ?? 'Open'} →</span>
              </span>
            </a>
          );
        })}
      </div>

      {slides.length > 1 && (() => {
        const dots = slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => { setStopped(true); go(i); }}
            aria-label={`Show ${i + 1} of ${slides.length}`}
            aria-current={i === index}
            className="h-11 w-11 flex items-center justify-center"
          >
            <span className={`block h-2 rounded-full transition-all ${i === index ? 'w-6 bg-[#d4af37]' : 'w-2 bg-[#f5f1e8]/50'}`} />
          </button>
        ));
        if (!threeUpOnDesktop) {
          return <div className="absolute bottom-0 left-0 right-4 h-11 flex items-center">{dots}</div>;
        }
        // Row of cards: controls sit in their own row below, not inside a card
        const step = (d: number) => { setStopped(true); go((index + d + slides.length) % slides.length); };
        return (
          <div className={`flex items-center justify-center gap-2 bg-[#0a0a14] pt-2 ${slides.length <= 3 ? 'lg:hidden' : ''}`}>
            <button type="button" onClick={() => step(-1)} aria-label="Previous" className="hidden lg:flex h-10 w-10 items-center justify-center border border-[#d4af37]/40 text-[#d4af37] hover:text-[#ffd700] hover:border-[#ffd700]">←</button>
            <div className="flex items-center">{dots}</div>
            <button type="button" onClick={() => step(1)} aria-label="Next" className="hidden lg:flex h-10 w-10 items-center justify-center border border-[#d4af37]/40 text-[#d4af37] hover:text-[#ffd700] hover:border-[#ffd700]">→</button>
          </div>
        );
      })()}
    </section>
  );
}
