
import { BookOpen, ExternalLink, Calendar } from 'lucide-react';

interface ArchiveArticle {
  title: string;
  excerpt: string;
  date: string;
  author: string;
  url: string;
  image?: string;
  category: string;
}

// Featured archive article - update this with current featured content
const FEATURED_ARTICLE: ArchiveArticle = {
  title: 'The Origins of BLKOUT: Building Liberation Technology',
  excerpt: 'How a community of Black queer technologists came together to create a platform centered on sovereignty, safety, and collective power. Our journey from idea to cooperative ownership.',
  date: '2024-06-15',
  author: 'BLKOUT Collective',
  url: 'https://blkout.vercel.app/stories',
  category: 'Community History'
};

export function ArchiveArticleWidget() {
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
          href="https://blkout.vercel.app/stories"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blkout-600 hover:text-blkout-700 font-semibold flex items-center gap-1"
        >
          View all
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Featured Article Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
              {FEATURED_ARTICLE.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar size={12} />
              {new Date(FEATURED_ARTICLE.date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {FEATURED_ARTICLE.title}
          </h3>

          <p className="text-gray-600 mb-4 line-clamp-3">
            {FEATURED_ARTICLE.excerpt}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              By {FEATURED_ARTICLE.author}
            </span>
            <a
              href={FEATURED_ARTICLE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm transition-colors"
            >
              Read Story
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
