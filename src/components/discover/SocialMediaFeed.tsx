
import { useState, useEffect, useRef } from 'react';
import { Instagram, Linkedin, Twitter, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';

interface SocialPost {
  id: string;
  platform: 'instagram' | 'linkedin' | 'twitter';
  embedUrl: string;
  caption?: string;
  date?: string;
}

// BLKOUT UK social media posts - update these with actual post URLs
const SOCIAL_POSTS: SocialPost[] = [
  {
    id: 'ig-1',
    platform: 'instagram',
    embedUrl: 'https://www.instagram.com/p/C8vkPqSNjXE/',
    caption: 'Community moments from BLKOUT',
    date: '2024-06-20'
  },
  {
    id: 'ig-2',
    platform: 'instagram',
    embedUrl: 'https://www.instagram.com/p/C8qHKzjtEIp/',
    caption: 'Black queer joy',
    date: '2024-06-18'
  },
  {
    id: 'ig-3',
    platform: 'instagram',
    embedUrl: 'https://www.instagram.com/p/C8lxwzINjIZ/',
    caption: 'Liberation in action',
    date: '2024-06-16'
  }
];

const platformIcons = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter
};

const platformColors = {
  instagram: 'from-purple-500 to-pink-500',
  linkedin: 'from-blue-600 to-blue-400',
  twitter: 'from-gray-800 to-gray-600'
};

const platformLabels = {
  instagram: '@blkout_uk',
  linkedin: 'BLKOUT UK',
  twitter: '@blkoutuk'
};

export function SocialMediaFeed() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const embedContainerRef = useRef<HTMLDivElement>(null);

  // Load Instagram embed script
  useEffect(() => {
    const loadInstagramScript = () => {
      if (window.instgrm) {
        window.instgrm.Embeds.process();
        setIsLoading(false);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      script.onload = () => {
        setTimeout(() => {
          if (window.instgrm) {
            window.instgrm.Embeds.process();
          }
          setIsLoading(false);
        }, 500);
      };
      document.body.appendChild(script);
    };

    loadInstagramScript();
  }, []);

  // Re-process embeds when index changes
  useEffect(() => {
    if (window.instgrm?.Embeds) {
      setTimeout(() => {
        window.instgrm?.Embeds.process();
      }, 100);
    }
  }, [currentIndex]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % SOCIAL_POSTS.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + SOCIAL_POSTS.length) % SOCIAL_POSTS.length);
  };

  const currentPost = SOCIAL_POSTS[currentIndex];
  const PlatformIcon = platformIcons[currentPost.platform];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 bg-gradient-to-br ${platformColors.instagram} rounded-xl flex items-center justify-center`}>
          <Instagram className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold text-gray-900">
            Social Feed
          </h2>
          <p className="text-sm text-gray-600">
            Latest posts from our community channels
          </p>
        </div>
        <a
          href="https://instagram.com/blkout_uk"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blkout-600 hover:text-blkout-700 font-semibold flex items-center gap-1"
        >
          Follow us
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Navigation buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blkout-600 transition-colors"
          aria-label="Previous post"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blkout-600 transition-colors"
          aria-label="Next post"
        >
          <ChevronRight size={24} />
        </button>

        {/* Embed container */}
        <div
          ref={embedContainerRef}
          className="bg-white rounded-xl border border-gray-200 p-4 overflow-hidden min-h-[500px] flex items-center justify-center"
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Loading social feed...</p>
            </div>
          ) : (
            <div className="w-full max-w-lg mx-auto">
              {currentPost.platform === 'instagram' && (
                <blockquote
                  key={currentPost.id}
                  className="instagram-media"
                  data-instgrm-permalink={currentPost.embedUrl}
                  data-instgrm-version="14"
                  style={{
                    background: '#FFF',
                    border: 0,
                    borderRadius: '3px',
                    boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
                    margin: '1px',
                    maxWidth: '540px',
                    minWidth: '326px',
                    padding: 0,
                    width: '99.375%'
                  }}
                >
                  <a
                    href={currentPost.embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 text-center text-blkout-600 hover:text-blkout-700"
                  >
                    View this post on Instagram
                  </a>
                </blockquote>
              )}
            </div>
          )}
        </div>

        {/* Platform indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${platformColors[currentPost.platform]} text-white text-sm font-semibold`}>
            <PlatformIcon size={16} />
            {platformLabels[currentPost.platform]}
          </div>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-4">
          {SOCIAL_POSTS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-blkout-600 w-6'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to post ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Quick links to all platforms */}
      <div className="grid grid-cols-3 gap-4 pt-4">
        <a
          href="https://instagram.com/blkout_uk"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-colors group"
        >
          <Instagram className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-gray-700">Instagram</span>
        </a>
        <a
          href="https://linkedin.com/company/blkout-uk"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-400/10 hover:from-blue-500/20 hover:to-blue-400/20 transition-colors group"
        >
          <Linkedin className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-gray-700">LinkedIn</span>
        </a>
        <a
          href="https://twitter.com/blkoutuk"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-gray-500/10 to-gray-400/10 hover:from-gray-500/20 hover:to-gray-400/20 transition-colors group"
        >
          <Twitter className="h-6 w-6 text-gray-700 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-gray-700">Twitter/X</span>
        </a>
      </div>
    </div>
  );
}

// Type declaration for Instagram embed script
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}
