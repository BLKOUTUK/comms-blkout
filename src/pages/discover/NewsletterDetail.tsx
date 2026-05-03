import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { PublicLayout } from '@/components/layout/PublicLayout';

interface NewsletterRow {
  id: string;
  edition_number: number;
  edition_type: string;
  title: string;
  summary: string | null;
  html_content: string | null;
  sent_at: string;
}

export function NewsletterDetail() {
  const { id } = useParams<{ id: string }>();
  const [newsletter, setNewsletter] = useState<NewsletterRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!id) {
      setError('No newsletter id in URL');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        if (!isSupabaseConfigured()) {
          throw new Error('Newsletter archive is not available right now.');
        }
        const { data, error: fetchError } = await supabase
          .from('public_newsletter_archive')
          .select('*')
          .eq('id', id)
          .single();
        if (fetchError) throw fetchError;
        if (!cancelled) setNewsletter(data as NewsletterRow);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load newsletter');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    try {
      const doc = iframe?.contentDocument;
      if (iframe && doc?.body) {
        iframe.style.height = doc.body.scrollHeight + 24 + 'px';
      }
    } catch {
      // sandbox restrictions or cross-origin — leave min-height fallback
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto">
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-liberation-sovereignty-gold mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Discover
        </Link>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="h-8 w-8 text-liberation-sovereignty-gold animate-spin" />
            <p className="text-sm text-gray-400">Loading newsletter…</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="border border-amber-500/30 bg-amber-500/10 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-200 mb-1">Newsletter not found</h3>
                <p className="text-sm text-amber-300/90">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && newsletter && (
          <article className="bg-white/95 rounded-2xl shadow-lg backdrop-blur-sm overflow-hidden">
            <header className="px-8 pt-8 pb-5 border-b border-gray-100">
              <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
                {newsletter.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  Sent {formatDistanceToNow(new Date(newsletter.sent_at), { addSuffix: true })}
                </span>
                <span>Edition #{newsletter.edition_number}</span>
                <span className="capitalize">{newsletter.edition_type}</span>
              </div>
              {newsletter.summary && (
                <p className="mt-4 text-sm text-gray-600 leading-relaxed">{newsletter.summary}</p>
              )}
            </header>
            {newsletter.html_content ? (
              <iframe
                ref={iframeRef}
                title={newsletter.title}
                srcDoc={newsletter.html_content}
                onLoad={handleIframeLoad}
                sandbox="allow-same-origin"
                className="w-full border-0 block"
                style={{ minHeight: '800px' }}
              />
            ) : (
              <div className="p-8 text-sm text-gray-500 italic">
                No archived content available for this edition yet.
              </div>
            )}
          </article>
        )}
      </div>
    </PublicLayout>
  );
}
