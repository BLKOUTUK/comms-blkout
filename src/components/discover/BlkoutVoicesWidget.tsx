
import { useState, useEffect } from 'react';
import { Mic2, ExternalLink, Clock, Loader2 } from 'lucide-react';

interface VoicePost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  url: string;
  readTime?: string;
}

// Static posts for when API is not available - update with real content
const STATIC_POSTS: VoicePost[] = [
  {
    id: '1',
    title: 'Community Voices: What Liberation Means to Us',
    excerpt: 'Members of the BLKOUT community share their perspectives on liberation, technology, and building a future that centers Black queer joy.',
    date: '2024-11-20',
    author: 'Community Contributors',
    url: 'https://voices-blkout.up.railway.app',
    readTime: '5 min read'
  },
  {
    id: '2',
    title: 'Tech for the People: Building Ethical AI',
    excerpt: 'How we approach AI development with community values at the center, ensuring technology serves liberation rather than surveillance.',
    date: '2024-11-15',
    author: 'BLKOUT Tech Team',
    url: 'https://voices-blkout.up.railway.app',
    readTime: '7 min read'
  },
  {
    id: '3',
    title: 'Cooperative Ownership: A New Model',
    excerpt: 'Understanding the Community Benefit Society structure and how democratic governance shapes every decision we make.',
    date: '2024-11-10',
    author: 'Governance Working Group',
    url: 'https://voices-blkout.up.railway.app',
    readTime: '4 min read'
  }
];

const VOICES_URL = 'https://voices-blkout.up.railway.app';

export function BlkoutVoicesWidget() {
  const [posts, setPosts] = useState<VoicePost[]>(STATIC_POSTS);
  const [isLoading, setIsLoading] = useState(false);

  // Attempt to fetch latest posts from Voices API
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        // Try to fetch from Voices API - adjust endpoint as needed
        const response = await fetch(`${VOICES_URL}/api/posts?limit=3`);
        if (response.ok) {
          const data = await response.json();
          if (data.posts && data.posts.length > 0) {
            setPosts(data.posts.map((post: any) => ({
              id: post.id || post._id,
              title: post.title,
              excerpt: post.excerpt || post.content?.substring(0, 150) + '...',
              date: post.date || post.createdAt,
              author: post.author || 'BLKOUT Community',
              url: `${VOICES_URL}/post/${post.slug || post.id}`,
              readTime: post.readTime || '5 min read'
            })));
          }
        }
      } catch (error) {
        // Use static posts on error
        console.log('Using static Voices content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-purple-300 transition-all group"
            >
              <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                <Clock size={12} />
                <span>{post.readTime}</span>
                <span className="text-gray-300">|</span>
                <span>
                  {new Date(post.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              </div>

              <h3 className="font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors line-clamp-2">
                {post.title}
              </h3>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {post.excerpt}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {post.author}
                </span>
                <ExternalLink size={14} className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
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
            href={`${VOICES_URL}/submit`}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap px-6 py-2.5 bg-white text-purple-700 hover:bg-gray-100 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
          >
            Submit a Post
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
