
import { format } from 'date-fns';
import { FileText, Edit, CheckCircle, XCircle } from 'lucide-react';
import type { ContentWithRelations } from '../../types';

interface DraftListProps {
  drafts: ContentWithRelations[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function DraftList({ drafts, onApprove, onReject, onEdit }: DraftListProps) {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-4">
      {drafts.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts found</h3>
          <p className="text-gray-500">All content has been published or scheduled.</p>
        </div>
      ) : (
        drafts.map((draft) => (
          <div key={draft.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{draft.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[draft.status] || statusColors.draft}`}>
                    {draft.status.charAt(0).toUpperCase() + draft.status.slice(1)}
                  </span>
                </div>

                {/* Content preview */}
                {draft.primary_content && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {draft.primary_content}
                  </p>
                )}

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
                  {draft.platform && (
                    <span className="flex items-center">
                      Platform: <strong className="ml-1">{draft.platform.display_name}</strong>
                    </span>
                  )}
                  {draft.generated_by_agent && (
                    <span className="flex items-center">
                      Agent: <strong className="ml-1">{draft.generated_by_agent.charAt(0).toUpperCase() + draft.generated_by_agent.slice(1)}</strong>
                    </span>
                  )}
                  <span className="flex items-center">
                    Created: {format(new Date(draft.created_at), 'MMM d, yyyy')}
                  </span>
                </div>

                {/* Hashtags */}
                {draft.hashtags && draft.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {draft.hashtags.map((tag, index) => (
                      <span key={index} className="text-xs text-blkout-purple">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 pt-4 border-t">
              {onEdit && (
                <button
                  onClick={() => onEdit(draft.id)}
                  className="btn-secondary flex-1 flex items-center justify-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
              )}
              {onReject && (
                <button
                  onClick={() => onReject(draft.id)}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors flex items-center justify-center"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </button>
              )}
              {onApprove && (
                <button
                  onClick={() => onApprove(draft.id)}
                  className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors flex items-center justify-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
