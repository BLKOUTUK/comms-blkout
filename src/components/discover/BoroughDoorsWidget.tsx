import { MapPin } from 'lucide-react';
import boroughsMap from '@/data/boroughs-map.json';

/**
 * Borough doors gateway — the London map as the way in.
 *
 * The same 33 ONS borough outlines the doors themselves carry
 * (events-calendar `scripts/borough-doors/data/_boroughs-map.json`), used here
 * as navigation: boroughs with a door open are gold and clickable, everything
 * else sits dark. The dark shapes are the point as much as the gold ones —
 * this is the 32-borough ambition, and how far along it is.
 *
 * OPEN_DOORS must be updated when a new door ships. The `/borough-door` skill
 * carries that as a step; there is deliberately no runtime fetch, because a
 * cross-origin call to render a menu is a worse failure mode than a stale list.
 */
const OPEN_DOORS: Record<string, string> = {
  brent: 'Brent',
  croydon: 'Croydon',
  enfield: 'Enfield',
  hackney: 'Hackney',
  haringey: 'Haringey',
  lambeth: 'Lambeth',
  lewisham: 'Lewisham',
  newham: 'Newham',
  southwark: 'Southwark',
  westminster: 'Westminster',
};

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const DOOR_URL = (slug: string) =>
  `https://events.blkoutuk.com/${slug}/?utm_source=discover&utm_medium=map&utm_campaign=borough-doors`;

export function BoroughDoorsWidget() {
  const entries = Object.entries(boroughsMap.paths as Record<string, string>);
  const openCount = Object.keys(OPEN_DOORS).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-liberation-gold-divine to-amber-600 rounded-xl flex items-center justify-center">
          <MapPin className="w-6 h-6 text-black" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white">
            Find your borough
          </h2>
          <span className="inline-block mt-1 px-3 py-0.5 bg-liberation-gold-divine/15 text-liberation-gold-divine border border-liberation-gold-divine/30 text-xs font-bold rounded-full uppercase tracking-wide">
            {openCount} doors open
          </span>
        </div>
      </div>

      <p className="text-gray-300 text-sm leading-relaxed mb-5">
        One community, many doors. Each borough door carries what&apos;s here, what&apos;s beside us,
        what&apos;s worth the journey — and the history that borough made.{' '}
        <span className="text-gray-400">The dark boroughs are the ones still to open.</span>
      </p>

      <svg
        viewBox={boroughsMap.viewBox}
        role="img"
        aria-label={`Map of the 33 London boroughs. Doors are currently open in ${Object.values(
          OPEN_DOORS
        ).join(', ')}.`}
        className="w-full h-auto mb-4"
      >
        {entries.map(([name, d]) => {
          const slug = slugify(name);
          const isOpen = Boolean(OPEN_DOORS[slug]);
          const shape = (
            <path
              d={d}
              className={
                isOpen
                  ? 'fill-liberation-gold-divine stroke-white/70 [stroke-width:2] hover:fill-white transition-colors cursor-pointer'
                  : 'fill-[#171512] stroke-[#39342a] [stroke-width:1.4]'
              }
              style={{ strokeLinejoin: 'round' }}
            >
              <title>{isOpen ? `${name} — door open` : name}</title>
            </path>
          );
          return isOpen ? (
            <a
              key={name}
              href={DOOR_URL(slug)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${name} — open the borough door`}
            >
              {shape}
            </a>
          ) : (
            <g key={name}>{shape}</g>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-2 mb-3">
        {Object.entries(OPEN_DOORS).map(([slug, name]) => (
          <a
            key={slug}
            href={DOOR_URL(slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm font-semibold border border-liberation-gold-divine/50 text-liberation-gold-divine hover:bg-liberation-gold-divine hover:text-black transition-colors"
          >
            {name} →
          </a>
        ))}
      </div>

      <p className="text-[11px] leading-snug text-gray-500">
        {boroughsMap.attribution}
      </p>
    </div>
  );
}
