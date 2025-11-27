
import { Mail, Calendar, ChevronRight, Loader2, AlertCircle, FileText } from 'lucide-react';
import { usePublicNewsletters } from '@/hooks/usePublicNewsletters';
import { formatDistanceToNow } from 'date-fns';

export function NewsletterArchive() {
  const { newsletters, isLoading, error, isUsingMockData, refetch } = usePublicNewsletters(4);

  const editionTypeStyles = {
    weekly: 'bg-blkout-100 text-blkout-700',
    monthly: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blkout-600 to-purple-600 rounded-xl flex items-center justify-center">
          <Mail className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold text-gray-900">
            Community Newsletter
          </h2>
          <p className="text-sm text-gray-600">
            Updates from Herald - our community communications agent
          </p>
        </div>
        {isUsingMockData && (
          <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
            Demo Mode
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="h-8 w-8 text-blkout-600 animate-spin" />
          <p className="text-sm text-gray-500">Loading newsletters...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="card border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">
                Unable to load newsletters
              </h3>
              <p className="text-sm text-amber-700 mb-3">
                Showing sample newsletters instead.
              </p>
              <button
                onClick={refetch}
                className="text-sm text-amber-800 hover:text-amber-900 font-semibold underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Newsletters List */}
      {!isLoading && newsletters.length > 0 && (
        <div className="space-y-4">
          {newsletters.map((newsletter, index) => (
            <div
              key={newsletter.id}
              className="card hover:shadow-lg transition-all duration-300 group cursor-pointer animate-fade-in border border-gray-100"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${editionTypeStyles[newsletter.editionType]}`}>
                      {newsletter.editionType === 'weekly' ? 'Weekly Update' : 'Monthly Digest'}
                    </span>
                    <span className="text-xs text-gray-500">
                      #{newsletter.editionNumber}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={12} />
                      {formatDistanceToNow(newsletter.sentAt, { addSuffix: true })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-blkout-600 transition-colors">
                    {newsletter.title}
                  </h3>
                  {newsletter.summary && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                      {newsletter.summary}
                    </p>
                  )}
                </div>
                <ChevronRight
                  className="text-gray-400 group-hover:text-blkout-600 group-hover:translate-x-1 transition-all shrink-0"
                  size={20}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && newsletters.length === 0 && !error && (
        <div className="card text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">
            No newsletters published yet
          </h3>
          <p className="text-sm text-gray-600">
            Subscribe to receive community updates when they're released!
          </p>
        </div>
      )}

      {/* Subscribe CTA */}
      {!isLoading && (
        <div className="bg-gradient-to-r from-blkout-50 to-purple-50 rounded-xl p-6 border border-blkout-100">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold text-gray-900 mb-1">
                Get updates in your inbox
              </h3>
              <p className="text-sm text-gray-600">
                Weekly updates for engaged members, monthly digests for the wider community.
              </p>
            </div>
            <a
              href="https://blkouthub.com/newsletter"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary whitespace-nowrap"
            >
              <Mail size={16} />
              Subscribe
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
