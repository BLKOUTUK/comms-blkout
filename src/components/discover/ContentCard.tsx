
import { format } from 'date-fns';
import { Calendar, Heart, Share2, MessageCircle } from 'lucide-react';
import type { ContentWithRelations } from '../../types';

interface ContentCardProps {
  content: ContentWithRelations;
}

export function ContentCard({ content }: ContentCardProps) {
  const platformColors: Record<string, string> = {
    instagram: '#E4405F',
    twitter: '#1DA1F2',
    facebook: '#4267B2',
    tiktok: '#000000',
    linkedin: '#0077B5',
    youtube: '#FF0000',
  };

  const platformColor = content.platform ? platformColors[content.platform.slug] || '#6B46C1' : '#6B46C1';

  return (
    <div className="card hover:shadow-lg transition-shadow">
      {/* Platform badge */}
      <div className="flex items-center justify-between mb-4">
        <div 
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: platformColor }}
        >
          {content.platform?.display_name || 'Unknown Platform'}
        </div>
        {content.published_at && (
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            {format(new Date(content.published_at), 'MMM d, yyyy')}
          </div>
        )}
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {content.title}
      </h3>
      
      {content.primary_content && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {content.primary_content}
        </p>
      )}

      {/* Hashtags */}
      {content.hashtags && content.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {content.hashtags.slice(0, 3).map((tag, index) => (
            <span key={index} className="text-xs text-blkout-purple">
              #{tag}
            </span>
          ))}
          {content.hashtags.length > 3 && (
            <span className="text-xs text-gray-400">
              +{content.hashtags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Agent attribution */}
      {content.generated_by_agent && (
        <div className="text-xs text-gray-500 mb-4">
          Created by {content.generated_by_agent.charAt(0).toUpperCase() + content.generated_by_agent.slice(1)} Agent
        </div>
      )}

      {/* Engagement stats */}
      {content.performance && (
        <div className="flex items-center space-x-4 text-sm text-gray-500 pt-4 border-t">
          <div className="flex items-center">
            <Heart className="h-4 w-4 mr-1" />
            {content.performance.engagement_count}
          </div>
          <div className="flex items-center">
            <MessageCircle className="h-4 w-4 mr-1" />
            {content.performance.comments}
          </div>
          <div className="flex items-center">
            <Share2 className="h-4 w-4 mr-1" />
            {content.performance.shares}
          </div>
        </div>
      )}

      {/* View button */}
      <button className="mt-4 w-full btn-secondary text-sm">
        View on {content.platform?.display_name}
      </button>
    </div>
  );
}
