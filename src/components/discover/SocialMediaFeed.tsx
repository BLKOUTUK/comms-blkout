
import { Instagram, Linkedin, Twitter, ExternalLink, Youtube } from 'lucide-react';

const SOCIAL_CHANNELS = [
  {
    id: 'instagram',
    platform: 'Instagram',
    handle: '@blkout_uk',
    url: 'https://instagram.com/blkout_uk',
    description: 'Visual stories from our community, events, and organizing work.',
    icon: Instagram,
    gradient: 'from-purple-500 to-pink-500',
    bgHover: 'hover:from-purple-500/20 hover:to-pink-500/20',
  },
  {
    id: 'youtube',
    platform: 'YouTube',
    handle: '@blkoutuk',
    url: 'https://www.youtube.com/@blkoutuk',
    description: 'Community conversations, event recordings, and campaign videos.',
    icon: Youtube,
    gradient: 'from-red-600 to-red-500',
    bgHover: 'hover:from-red-600/20 hover:to-red-500/20',
  },
  {
    id: 'linkedin',
    platform: 'LinkedIn',
    handle: 'BLKOUT UK',
    url: 'https://linkedin.com/company/blkoutuk',
    description: 'Professional insights, partnerships, and campaign updates.',
    icon: Linkedin,
    gradient: 'from-blue-600 to-blue-400',
    bgHover: 'hover:from-blue-600/20 hover:to-blue-400/20',
  },
  {
    id: 'twitter',
    platform: 'Twitter/X',
    handle: '@blkoutuk',
    url: 'https://twitter.com/blkoutuk',
    description: 'Real-time updates, community news, and conversations.',
    icon: Twitter,
    gradient: 'from-gray-800 to-gray-600',
    bgHover: 'hover:from-gray-800/20 hover:to-gray-600/20',
  },
];

export function SocialMediaFeed() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Instagram className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold text-gray-900">
            Connect With Us
          </h2>
          <p className="text-sm text-gray-600">
            Follow BLKOUT across our social channels
          </p>
        </div>
      </div>

      {/* Social Channel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SOCIAL_CHANNELS.map((channel) => {
          const Icon = channel.icon;
          return (
            <a
              key={channel.id}
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 bg-white"
            >
              <div
                className={`w-12 h-12 bg-gradient-to-br ${channel.gradient} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 group-hover:text-blkout-600 transition-colors">
                    {channel.platform}
                  </h3>
                  <ExternalLink
                    size={14}
                    className="text-gray-300 group-hover:text-blkout-500 transition-colors"
                  />
                </div>
                <p className="text-sm text-blkout-600 font-medium mb-1">
                  {channel.handle}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {channel.description}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
