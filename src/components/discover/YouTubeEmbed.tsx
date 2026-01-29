
import { Youtube, Play, ExternalLink } from 'lucide-react';

interface YouTubeEmbedProps {
  videoId?: string;
  playlistId?: string;
  className?: string;
}

export function YouTubeEmbed({
  videoId,
  playlistId,
  className = '',
}: YouTubeEmbedProps) {
  // Build embed URL from specific video or playlist
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}`
    : playlistId
      ? `https://www.youtube.com/embed/videoseries?list=${playlistId}`
      : null;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-500 rounded-xl flex items-center justify-center">
            <Youtube className="h-7 w-7 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold text-gray-900">
              BLKOUT UK Channel
            </h3>
            <p className="text-sm text-gray-600">
              Watch our latest videos and community conversations
            </p>
          </div>
        </div>
        <a
          href="https://www.youtube.com/@blkoutuk"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary flex items-center gap-2 shrink-0"
        >
          <Play size={18} />
          Subscribe
        </a>
      </div>

      {/* YouTube Embed or Channel Link */}
      {embedUrl ? (
        <div
          className="relative w-full rounded-xl overflow-hidden shadow-lg"
          style={{ paddingBottom: '56.25%' }}
        >
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={embedUrl}
            title="BLKOUT UK YouTube"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <a
          href="https://www.youtube.com/@blkoutuk"
          target="_blank"
          rel="noopener noreferrer"
          className="block relative w-full rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-gray-900 to-gray-800 group"
          style={{ paddingBottom: '56.25%' }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {/* Play button */}
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:bg-red-700 group-hover:scale-110 transition-all duration-300 shadow-xl">
              <Play className="h-10 w-10 text-white ml-1" fill="white" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">BLKOUT UK</p>
              <p className="text-gray-400 text-sm">Watch on YouTube</p>
            </div>
          </div>
        </a>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <a
          href="https://www.youtube.com/@blkoutuk/videos"
          target="_blank"
          rel="noopener noreferrer"
          className="text-center py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          All Videos
          <ExternalLink size={14} />
        </a>
        <a
          href="https://www.youtube.com/@blkoutuk/playlists"
          target="_blank"
          rel="noopener noreferrer"
          className="text-center py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          Playlists
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
