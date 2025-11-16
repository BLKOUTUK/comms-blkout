
import { Calendar, ExternalLink } from 'lucide-react';
import type { Content, PlatformType } from '@/types';
import { format } from 'date-fns';

interface ContentCardProps {
  content: Content;
  showActions?: boolean;
}

const platformColors: Record<PlatformType, string> = {
  instagram: 'badge-instagram',
  linkedin: 'badge-linkedin',
  twitter: 'badge-twitter',
  facebook: 'badge-facebook',
  tiktok: 'badge-tiktok',
  youtube: 'badge-youtube',
};

export function ContentCard({ content, showActions = false }: ContentCardProps) {
  const displayDate = content.publishedAt || content.scheduledFor || content.createdAt;

  return (
    <div className="card card-hover">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{content.title}</h3>
          <div className="flex flex-wrap gap-2">
            {content.platforms.map((platform) => (
              <span key={platform} className={`badge ${platformColors[platform]}`}>
                {platform}
              </span>
            ))}
          </div>
        </div>
        {content.status === 'published' && (
          <ExternalLink size={18} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
        )}
      </div>

      {/* Body */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{content.body}</p>

      {/* Metadata */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span>
            {content.status === 'published' && 'Published '}
            {content.status === 'scheduled' && 'Scheduled for '}
            {format(new Date(displayDate), 'MMM d, yyyy')}
          </span>
        </div>
        {content.agentType && (
          <span className="text-xs px-2 py-1 bg-blkout-50 text-blkout-700 rounded-md capitalize">
            {content.agentType}
          </span>
        )}
      </div>

      {/* Engagement Metrics */}
      {content.engagementMetrics && content.status === 'published' && (
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            {content.engagementMetrics.likes !== undefined && (
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {content.engagementMetrics.likes}
                </div>
                <div className="text-xs text-gray-500">Likes</div>
              </div>
            )}
            {content.engagementMetrics.comments !== undefined && (
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {content.engagementMetrics.comments}
                </div>
                <div className="text-xs text-gray-500">Comments</div>
              </div>
            )}
            {content.engagementMetrics.shares !== undefined && (
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {content.engagementMetrics.shares}
                </div>
                <div className="text-xs text-gray-500">Shares</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          <button className="btn btn-outline text-sm flex-1">Edit</button>
          <button className="btn btn-primary text-sm flex-1">View Details</button>
        </div>
      )}
    </div>
  );
}
