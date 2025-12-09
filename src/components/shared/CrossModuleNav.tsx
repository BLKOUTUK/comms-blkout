import { ExternalLink, Home, Bot, Newspaper, Calendar, Eye } from 'lucide-react';

interface ModuleLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  current?: boolean;
}

interface CrossModuleNavProps {
  currentModule?: 'home' | 'events' | 'news' | 'ivor' | 'discover' | 'voices';
}

/**
 * CrossModuleNav - Unified navigation across BLKOUT ecosystem
 *
 * Provides consistent navigation between all blkoutuk.com subdomains:
 * - blkoutuk.com (Home)
 * - events.blkoutuk.com (Events)
 * - news.blkoutuk.com (News)
 * - ivor.blkoutuk.com (IVOR AI Assistant)
 * - discover.blkoutuk.com (Discover/Comms)
 * - voices.blkoutuk.com (Voices/Blog)
 */
export function CrossModuleNav({ currentModule = 'discover' }: CrossModuleNavProps) {
  const moduleLinks: ModuleLink[] = [
    {
      label: "Home",
      href: "https://blkoutuk.com",
      icon: <Home className="w-4 h-4" />,
      current: currentModule === 'home'
    },
    {
      label: "Events",
      href: "https://events.blkoutuk.com",
      icon: <Calendar className="w-4 h-4" />,
      current: currentModule === 'events'
    },
    {
      label: "News",
      href: "https://news.blkoutuk.com",
      icon: <Newspaper className="w-4 h-4" />,
      current: currentModule === 'news'
    },
    {
      label: "Ask IVOR",
      href: "https://ivor.blkoutuk.com",
      icon: <Bot className="w-4 h-4" />,
      current: currentModule === 'ivor'
    },
    {
      label: "Discover",
      href: "https://discover.blkoutuk.com",
      icon: <Eye className="w-4 h-4" />,
      current: currentModule === 'discover'
    },
    {
      label: "Voices",
      href: "https://voices.blkoutuk.com",
      icon: <Newspaper className="w-4 h-4" />,
      current: currentModule === 'voices'
    }
  ];

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <span className="text-gray-500 font-medium whitespace-nowrap">BLKOUT UK:</span>
            {moduleLinks.map((module, index) => (
              <a
                key={index}
                href={module.href}
                target={module.current ? '_self' : '_blank'}
                rel={module.current ? undefined : 'noopener noreferrer'}
                className={`flex items-center gap-1 px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                  module.current
                    ? 'bg-blkout-100 text-blkout-700 font-medium'
                    : 'text-gray-600 hover:text-blkout-600 hover:bg-gray-100'
                }`}
              >
                {module.icon}
                <span className="hidden sm:inline">{module.label}</span>
                {!module.current && <ExternalLink className="w-3 h-3 opacity-50" />}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CrossModuleNav;
