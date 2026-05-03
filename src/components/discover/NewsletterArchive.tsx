
import { Mail, Calendar, ChevronRight, Loader2, AlertCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePublicNewsletters } from '@/hooks/usePublicNewsletters';
import { formatDistanceToNow } from 'date-fns';

export function NewsletterArchive() {
  const navigate = useNavigate();
  const { newsletters, isLoading, error, isUsingMockData, refetch } = usePublicNewsletters(4);

  const editionTypeStyles = {
    weekly: 'bg-liberation-gold-divine/10 text-liberation-gold-divine border border-liberation-gold-divine/30',
    monthly: 'bg-purple-500/10 text-purple-300 border border-purple-500/30',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-liberation-gold-divine/10 border border-liberation-gold-divine/30 rounded-xl flex items-center justify-center">
          <Mail className="h-7 w-7 text-liberation-gold-divine" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white">
            Community Newsletter
          </h2>
          <p className="text-sm text-gray-400 font-disrupt italic">
            updates from Herald — our community communications agent
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
          {newsletters.map((newsletter, index) => {
            const isMock = newsletter.id.startsWith('mock-');
            return (
            <div
              key={newsletter.id}
              role="link"
              tabIndex={isMock ? -1 : 0}
              aria-disabled={isMock}
              onClick={() => { if (!isMock) navigate(`/discover/newsletters/${newsletter.id}`); }}
              onKeyDown={(e) => {
                if (isMock) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/discover/newsletters/${newsletter.id}`);
                }
              }}
              className={`bg-white/5 border border-liberation-gold-divine/20 rounded-xl p-6 backdrop-blur-sm transition-all duration-300 group animate-fade-in ${isMock ? 'opacity-70 cursor-default' : 'hover:bg-white/10 hover:border-liberation-gold-divine/50 cursor-pointer'}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${editionTypeStyles[newsletter.editionType]}`}>
                      {newsletter.editionType === 'weekly' ? 'Weekly' : 'Monthly'}
                    </span>
                    <span className="text-xs text-gray-500">
                      #{newsletter.editionNumber}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={12} />
                      {formatDistanceToNow(newsletter.sentAt, { addSuffix: true })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg text-white mb-2 group-hover:text-liberation-gold-divine transition-colors">
                    {newsletter.title}
                  </h3>
                  {newsletter.summary && (
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                      {newsletter.summary}
                    </p>
                  )}
                </div>
                <ChevronRight
                  className="text-gray-500 group-hover:text-liberation-gold-divine group-hover:translate-x-1 transition-all shrink-0"
                  size={20}
                />
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && newsletters.length === 0 && !error && (
        <div className="bg-white/5 border border-white/10 rounded-xl text-center py-12">
          <FileText className="h-12 w-12 text-gray-500 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-2 uppercase tracking-tight">
            No newsletters published yet
          </h3>
          <p className="text-sm text-gray-400 font-disrupt italic">
            subscribe to receive community updates when they're released
          </p>
        </div>
      )}

      {/* Subscribe CTA */}
      {!isLoading && (
        <div className="bg-liberation-gold-divine/5 border border-liberation-gold-divine/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold text-white mb-1 uppercase tracking-tight">
                Get updates in your inbox
              </h3>
              <p className="text-sm text-gray-400 font-disrupt italic">
                weekly for engaged members, monthly for the wider community.
              </p>
            </div>
            <a
              href="/preferences"
              className="bg-liberation-gold-divine hover:bg-liberation-gold-rich text-black font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg whitespace-nowrap flex items-center gap-2 transition-colors"
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
