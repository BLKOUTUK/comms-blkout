
import { BookOpen, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        // Get a random featured article from legacy_articles
        const { data } = await supabase
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
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-liberation-gold-divine/10 border border-liberation-gold-divine/30 rounded-xl flex items-center justify-center">
          <BookOpen className="h-7 w-7 text-liberation-gold-divine" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white">
            From the Archive
          </h2>
          <p className="text-sm text-gray-400 font-disrupt italic">
            stories and history from our community
          </p>
        </div>
        <a
          href="https://blkoutuk.com/stories"
          className="text-sm text-liberation-gold-divine hover:text-liberation-gold-rich font-semibold uppercase tracking-wider flex items-center gap-1"
        >
          View 280+ articles →
        </a>
      </div>

      {/* Featured Article Card */}
      <div className="bg-white/5 border border-liberation-gold-divine/20 rounded-xl overflow-hidden backdrop-blur-sm hover:bg-white/10 hover:border-liberation-gold-divine/50 transition-all">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-liberation-gold-divine/10 border border-liberation-gold-divine/30 text-liberation-gold-divine rounded-full text-xs font-semibold uppercase tracking-wider">
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

          <h3 className="text-xl font-bold text-white mb-3">
            {featuredArticle.title}
          </h3>

          <p className="text-gray-400 mb-4 line-clamp-3">
            {featuredArticle.excerpt}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              By {featuredArticle.author}
            </span>
            <a
              href={`https://blkoutuk.com/stories#${featuredArticle.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-liberation-gold-divine hover:bg-liberation-gold-rich text-black rounded-lg font-bold text-sm uppercase tracking-wider transition-colors"
            >
              Read Story →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
