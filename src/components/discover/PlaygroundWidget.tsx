import { Gamepad2, ExternalLink } from 'lucide-react';

interface PlaygroundItem {
  tag: string;
  title: string;
  description: string;
  url: string;
}

const PLAYGROUND_ITEMS: PlaygroundItem[] = [
  {
    tag: 'Comic',
    title: 'OOMF Interactive',
    description: 'Put yourself in the story — become the hero of your own graphic novel.',
    url: 'https://blkoutuk.com/movement',
  },
  {
    tag: 'Star map',
    title: "What's in your sky?",
    description: 'Tap your people into a night sky and meet your constellation.',
    url: 'https://commons.blkoutuk.com/sky.html',
  },
  {
    tag: 'For gatherings',
    title: 'Constellations',
    description: 'The paper-and-pen version — a mapping exercise for real rooms, kit included.',
    url: 'https://commons.blkoutuk.com/constellations.html',
  },
  {
    tag: 'Journey',
    title: "Ivor's Compass",
    description: 'Navigate Black queer heritage in the company of Ivor Cummings.',
    url: 'https://compass.blkoutuk.com',
  },
];

export function PlaygroundWidget() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blkout-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <Gamepad2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white">
            The Playground
          </h2>
          <p className="text-sm text-gray-400 font-disrupt italic">
            games and playthings from the BLKOUT workshop
          </p>
        </div>
      </div>

      <p className="text-gray-300 text-sm">
        Serious about liberation — not po-faced about it. Take five minutes to play.
      </p>

      {/* Games grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLAYGROUND_ITEMS.map((item) => (
          <a
            key={item.title}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative bg-white/5 border border-purple-500/25 rounded-xl p-5 backdrop-blur-sm hover:bg-white/10 hover:border-purple-400/60 transition-all duration-300"
          >
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full mb-3">
              {item.tag}
            </span>
            <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-purple-300 transition-colors">
              {item.title}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink size={16} className="text-purple-300" />
            </div>
          </a>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        The Playground grows — new games are made with the community, never on it.
      </p>
    </div>
  );
}
