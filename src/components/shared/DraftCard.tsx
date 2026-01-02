
import { useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Eye, Send } from 'lucide-react';
import type { Draft, PlatformType } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { InstagramPreview, FacebookPreview, LinkedInPreview } from '../previews';
import { publishToSocial } from '@/services/socialPublisher';

interface DraftCardProps {
  draft: Draft;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const platformColors: Record<PlatformType, string> = {
  instagram: 'badge-instagram',
  linkedin: 'badge-linkedin',
  twitter: 'badge-twitter',
  facebook: 'badge-facebook',
  tiktok: 'badge-tiktok',
  youtube: 'badge-youtube',
};

const statusConfig = {
  pending_review: {
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    label: 'Pending Review',
  },
  approved: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    label: 'Approved',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    label: 'Rejected',
  },
  needs_revision: {
    icon: AlertCircle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    label: 'Needs Revision',
  },
};

export function DraftCard({ draft, onApprove, onReject, onEdit }: DraftCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const StatusIcon = statusConfig[draft.status].icon;

  const handlePublishNow = async () => {
    if (!confirm(`Publish to ${draft.platforms[0]} immediately?`)) return;

    setIsPublishing(true);
    try {
      const result = await publishToSocial({
        platform: draft.platforms[0] as any,
        caption: draft.body,
        imageUrl: undefined, // TODO: Extract from draft if exists
        link: undefined
      });

      if (result.success) {
        alert(`✅ Published to ${draft.platforms[0]}!`);
        window.location.reload();
      } else {
        alert(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${(error as Error).message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="card card-hover">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{draft.title}</h3>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${statusConfig[draft.status].bg}`}>
              <StatusIcon size={14} className={statusConfig[draft.status].color} />
              <span className={`text-xs font-medium ${statusConfig[draft.status].color}`}>
                {statusConfig[draft.status].label}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {draft.platforms.map((platform) => (
              <span key={platform} className={`badge ${platformColors[platform]}`}>
                {platform}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{draft.body}</p>

      {/* Metadata */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span className="text-xs px-2 py-1 bg-blkout-50 text-blkout-700 rounded-md capitalize">
          Created by {draft.agentType}
        </span>
        <span className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(draft.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Review Notes */}
      {draft.reviewNotes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-1">Review Notes:</p>
          <p className="text-sm text-gray-600">{draft.reviewNotes}</p>
        </div>
      )}

      {/* Actions */}
      {draft.status === 'pending_review' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(true)}
              className="btn btn-outline text-sm flex-1 flex items-center justify-center gap-1"
            >
              <Eye size={16} />
              Preview
            </button>
            <button
              onClick={handlePublishNow}
              disabled={isPublishing}
              className="btn btn-primary text-sm flex-1 flex items-center justify-center gap-1"
            >
              <Send size={16} />
              {isPublishing ? 'Publishing...' : 'Publish Now'}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onReject?.(draft.id)}
              className="btn btn-secondary text-sm flex-1"
            >
              Reject
            </button>
            <button
              onClick={() => onApprove?.(draft.id)}
              className="btn btn-primary text-sm flex-1"
            >
              Queue for Later
            </button>
          </div>
        </div>
      )}

      {draft.status !== 'pending_review' && (
        <button
          onClick={() => onEdit?.(draft.id)}
          className="btn btn-outline text-sm w-full"
        >
          View Details
        </button>
      )}

      {/* Preview Modal */}
      {showPreview && draft.platforms[0] === 'instagram' && (
        <InstagramPreview draft={draft} onClose={() => setShowPreview(false)} />
      )}
      {showPreview && draft.platforms[0] === 'facebook' && (
        <FacebookPreview draft={draft} onClose={() => setShowPreview(false)} />
      )}
      {showPreview && draft.platforms[0] === 'linkedin' && (
        <LinkedInPreview draft={draft} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}
