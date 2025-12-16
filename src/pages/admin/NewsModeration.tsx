
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Newspaper,
  User,
  Check,
  X,
  Eye,
  ExternalLink,
  Filter,
  Loader2,
  AlertCircle,
  Star,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  tags: string[] | null;
  author: string | null;
  author_id: string | null;
  featured_image: string | null;
  image_alt: string | null;
  source_url: string | null;
  source_name: string | null;
  curator_id: string | null;
  interest_score: number | null;
  total_votes: number | null;
  view_count: number | null;
  is_featured: boolean | null;
  status: string;
  created_at: string;
  published_at: string | null;
}

type StatusFilter = 'all' | 'draft' | 'published' | 'archived';

export function NewsModeration() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, [statusFilter]);

  const fetchArticles = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase not configured');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('news_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setArticles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setIsLoading(false);
    }
  };

  const updateArticleStatus = async (articleId: string, newStatus: 'published' | 'archived' | 'draft') => {
    setActionLoading(articleId);
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'published' && !articles.find(a => a.id === articleId)?.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('news_articles')
        .update(updateData)
        .eq('id', articleId);

      if (updateError) throw updateError;

      // Update local state
      setArticles(prev => prev.map(article =>
        article.id === articleId ? { ...article, status: newStatus, ...updateData } : article
      ));
    } catch (err) {
      alert(`Failed to update article: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleFeatured = async (articleId: string, currentFeatured: boolean | null) => {
    setActionLoading(articleId);
    try {
      const { error: updateError } = await supabase
        .from('news_articles')
        .update({ is_featured: !currentFeatured })
        .eq('id', articleId);

      if (updateError) throw updateError;

      setArticles(prev => prev.map(article =>
        article.id === articleId ? { ...article, is_featured: !currentFeatured } : article
      ));
    } catch (err) {
      alert(`Failed to update article: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const statusCounts = {
    all: articles.length,
    draft: articles.filter(a => a.status === 'draft').length,
    published: articles.filter(a => a.status === 'published').length,
    archived: articles.filter(a => a.status === 'archived').length,
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">News Moderation</h1>
            <p className="text-gray-600 mt-1">Review and manage news articles</p>
          </div>
          <button
            onClick={fetchArticles}
            className="btn-secondary flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Filter size={16} />}
            Refresh
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'draft', 'published', 'archived'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === status
                  ? 'bg-blkout-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Articles List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="animate-spin mx-auto mb-4" size={48} />
            <p className="text-gray-600">Loading articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 card">
            <Newspaper size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No articles found</p>
            <p className="text-gray-500 text-sm mt-2">
              {statusFilter !== 'all'
                ? `No articles with status: ${statusFilter}`
                : 'No articles in the system'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Article Header */}
                <div className="p-4 flex items-start gap-4">
                  {/* Thumbnail */}
                  {article.featured_image && (
                    <img
                      src={article.featured_image}
                      alt={article.image_alt || article.title}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        article.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                        article.status === 'published' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {article.status.toUpperCase()}
                      </span>
                      {article.is_featured && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 flex items-center gap-1">
                          <Star size={12} fill="currentColor" />
                          Featured
                        </span>
                      )}
                      {article.category && (
                        <span className="text-xs text-gray-500">{article.category}</span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{article.title}</h3>

                    {article.excerpt && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{article.excerpt}</p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                      {article.author && (
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {article.author}
                        </span>
                      )}
                      {article.source_name && (
                        <span className="flex items-center gap-1">
                          <ExternalLink size={14} />
                          {article.source_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(article.published_at || article.created_at)}
                      </span>
                      {article.view_count !== null && article.view_count > 0 && (
                        <span className="flex items-center gap-1">
                          <TrendingUp size={14} />
                          {article.view_count} views
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                      className="p-2 text-gray-500 hover:text-blkout-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      onClick={() => toggleFeatured(article.id, article.is_featured)}
                      disabled={actionLoading === article.id}
                      className={`p-2 rounded-lg transition-colors ${
                        article.is_featured
                          ? 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                          : 'text-gray-500 hover:text-purple-600 hover:bg-gray-100'
                      }`}
                      title={article.is_featured ? 'Remove featured' : 'Set as featured'}
                    >
                      <Star size={20} fill={article.is_featured ? 'currentColor' : 'none'} />
                    </button>
                    {article.source_url && (
                      <a
                        href={article.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-blkout-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Open source"
                      >
                        <ExternalLink size={20} />
                      </a>
                    )}
                    {article.status === 'draft' && (
                      <button
                        onClick={() => updateArticleStatus(article.id, 'published')}
                        disabled={actionLoading === article.id}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Publish"
                      >
                        {actionLoading === article.id ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <Check size={20} />
                        )}
                      </button>
                    )}
                    {article.status === 'published' && (
                      <button
                        onClick={() => updateArticleStatus(article.id, 'archived')}
                        disabled={actionLoading === article.id}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Archive"
                      >
                        <X size={20} />
                      </button>
                    )}
                    {article.status === 'archived' && (
                      <button
                        onClick={() => updateArticleStatus(article.id, 'draft')}
                        disabled={actionLoading === article.id}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Restore to draft"
                      >
                        {actionLoading === article.id ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          'Restore'
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedArticle === article.id && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {article.content && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-1">Content</h4>
                        <div className="text-gray-600 text-sm prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: article.content }} />
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {article.interest_score !== null && (
                        <div>
                          <span className="text-gray-500">Interest Score:</span>
                          <p className="font-medium">{article.interest_score}</p>
                        </div>
                      )}
                      {article.total_votes !== null && (
                        <div>
                          <span className="text-gray-500">Total Votes:</span>
                          <p className="font-medium">{article.total_votes}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <p className="font-medium">{formatDate(article.created_at)}</p>
                      </div>
                      {article.published_at && (
                        <div>
                          <span className="text-gray-500">Published:</span>
                          <p className="font-medium">{formatDate(article.published_at)}</p>
                        </div>
                      )}
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div className="mt-4">
                        <span className="text-gray-500 text-sm">Tags:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {article.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blkout-100 text-blkout-700 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
