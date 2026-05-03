import { useEffect, useState } from 'react';
import { Newspaper, ThumbsUp, ExternalLink } from 'lucide-react';

interface TopStory {
  id: string;
  title: string;
  source_name: string;
  source_url: string;
  upvote_count: number;
  category: string;
}

interface ApiResponse {
  success: boolean;
  data?: { topStories?: TopStory[] };
}

export function NewsWidget() {
  const [stories, setStories] = useState<TopStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('https://news.blkoutuk.cloud/api/top-stories?period=week&limit=3');
        if (!res.ok) throw new Error('news fetch failed');
        const json = (await res.json()) as ApiResponse;
        if (!cancelled && json.success && json.data?.topStories) {
          setStories(json.data.topStories);
        }
      } catch {
        // non-blocking — widget hides if no stories
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-6 bg-white/10 rounded w-1/3 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (stories.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-news/10 border border-news/40 rounded-xl flex items-center justify-center">
            <Newspaper className="h-7 w-7 text-news" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white">
              This Week in News
            </h2>
            <p className="text-sm text-gray-400 font-disrupt italic">
              top stories voted up by the community
            </p>
          </div>
        </div>
        <a
          href="https://news.blkoutuk.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-news hover:text-purple-300 font-bold uppercase tracking-wider text-sm flex items-center gap-1 group"
        >
          All news
          <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      <ol className="space-y-3">
        {stories.map((story, idx) => (
          <li key={story.id}>
            <a
              href={story.source_url || 'https://news.blkoutuk.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-news/40 transition-all group"
            >
              <span className="text-news font-bold tabular-nums text-lg leading-snug">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-white group-hover:text-news transition-colors leading-snug line-clamp-2">
                  {story.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{story.source_name}</span>
                  {story.upvote_count > 0 && (
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={11} />
                      {story.upvote_count}
                    </span>
                  )}
                </div>
              </div>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
