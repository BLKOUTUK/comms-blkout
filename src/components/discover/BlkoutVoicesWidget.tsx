
import { useState, useEffect } from 'react';
import { Mic2, ExternalLink, Clock, Loader2 } from 'lucide-react';

interface VoicePost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  slug: string;
  heroImage?: string | null;
  url: string;
}

// Real API — repo: BLKOUTUK/blkout-blog, deployed at voices.blkoutuk.cloud
const VOICES_URL = 'https://voices.blkoutuk.cloud';

interface RawVoicesArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  author?: string | null;
  category?: string | null;
  published_at?: string | null;
  hero_image?: string | null;
}

export function BlkoutVoicesWidget() {
  const [posts, setPosts] = useState<VoicePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${VOICES_URL}/api/articles`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (cancelled) return;
        if (data.success && Array.isArray(data.data)) {
          const mapped: VoicePost[] = data.data
            .slice(0, 3)
            .map((a: RawVoicesArticle) => ({
              id: a.id,
              title: a.title,
              excerpt: a.excerpt ?? (a.content ? a.content.substring(0, 160) + '…' : ''),
              date: a.published_at ?? '',
              author: a.author ?? 'BLKOUT',
              category: a.category ?? 'Voices',
              slug: a.slug,
              heroImage: a.hero_image ?? null,
              url: `${VOICES_URL}/articles/${a.slug}`,
            }));
          setPosts(mapped);
        } else {
          setPosts([]);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Voices fetch failed:', err);
        setError('Could not load latest articles. Visit Voices directly.');
        setPosts([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchPosts();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center">
          <Mic2 className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold text-gray-900">
            BLKOUT Voices
          </h2>
          <p className="text-sm text-gray-600">
            Community blog and perspectives
          </p>
        </div>
        <a
          href={VOICES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blkout-600 hover:text-blkout-700 font-semibold flex items-center gap-1"
        >
          Visit blog
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-center">
          <p className="text-amber-900 text-sm mb-3">{error}</p>
          <a
            href={VOICES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-purple-700 font-semibold text-sm"
          >
            Visit Voices <ExternalLink size={14} />
          </a>
        </div>
      ) : posts.length === 0 ? (
        <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 text-center text-gray-600 text-sm">
          No articles published yet. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-purple-300 transition-all group flex flex-col"
            >
              {post.heroImage && (
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={post.heroImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-semibold uppercase tracking-wide">
                    {post.category}
                  </span>
                  {post.date && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock size={12} />
                      {new Date(post.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-sm text-gray-600 mb-3 line-clamp-3 flex-1">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    By {post.author}
                  </span>
                  <ExternalLink size={14} className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg mb-1">Share Your Voice</h3>
            <p className="text-white/80 text-sm">
              Have a story to tell? We're always looking for community contributors.
            </p>
          </div>
          <a
            href={VOICES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap px-6 py-2.5 bg-white text-purple-700 hover:bg-gray-100 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
          >
            Read & Pitch
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
