
import { BookOpen, ExternalLink, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (using environment variables from comms-blkout)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
);

interface ArchiveArticle {
  title: string;
  excerpt: string;
  published_at: string;
  author: string;
  slug: string;
  category: string;
}

export function ArchiveArticleWidget() {
  const [featuredArticle, setFeaturedArticle] = useState<ArchiveArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeaturedArchiveArticle() {
      try {
        // Get a random featured article from legacy_articles
        const { data, error } = await supabase
          .from('legacy_articles')
          .select('title, excerpt, published_at, author, slug, category_id')
          .eq('status', 'published')
          .not('excerpt', 'is', null)
          .order('published_at', { ascending: false })
          .limit(10);

        if (data && data.length > 0) {
          // Pick random from top 10 most recent
          const randomArticle = data[Math.floor(Math.random() * data.length)];
          setFeaturedArticle({
            title: randomArticle.title,
            excerpt: randomArticle.excerpt || 'Read the full story...',
            published_at: randomArticle.published_at,
            author: randomArticle.author || 'BLKOUT Collective',
            slug: randomArticle.slug,
            category: 'Archive'
          });
        }
      } catch (error) {
        console.error('Error loading archive article:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFeaturedArchiveArticle();
  }, []);

  if (loading || !featuredArticle) {
    return null; // Or loading skeleton
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
          <BookOpen className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold text-gray-900">
            From the Archive
          </h2>
          <p className="text-sm text-gray-600">
            Stories and history from our community
          </p>
        </div>
        <a
          href="https://blkoutuk.com/stories"
          className="text-sm text-blkout-600 hover:text-blkout-700 font-semibold flex items-center gap-1"
        >
          View 280+ articles →
        </a>
      </div>

      {/* Featured Article Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
              {featuredArticle.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar size={12} />
              {new Date(featuredArticle.published_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {featuredArticle.title}
          </h3>

          <p className="text-gray-600 mb-4 line-clamp-3">
            {featuredArticle.excerpt}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              By {featuredArticle.author}
            </span>
            <a
              href={`https://blkoutuk.com/stories#${featuredArticle.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm transition-colors"
            >
              Read Story →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
