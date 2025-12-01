/**
 * Bid Progress Card Component
 * Displays bid writing progress for a grant
 * Theme: Liberation Teal with progress indicators
 */

import {
  FileText,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import type { BidWritingProgress } from '../../services/grants/types';

interface BidProgressCardProps {
  progress: BidWritingProgress;
  formatCurrency: (amount: number) => string;
  onContinueWriting?: (grantId: string) => void;
}

export function BidProgressCard({
  progress,
  formatCurrency,
  onContinueWriting,
}: BidProgressCardProps) {
  // Get deadline status styling
  const getDeadlineStyle = () => {
    switch (progress.deadline_status) {
      case 'overdue':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle };
      case 'urgent':
        return { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock };
      case 'approaching':
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: Calendar };
      default:
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 };
    }
  };

  const deadlineStyle = getDeadlineStyle();
  const DeadlineIcon = deadlineStyle.icon;

  // Format time spent
  const formatTimeSpent = (minutes?: number) => {
    if (!minutes) return '0h';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Calculate progress bar segments
  const getProgressSegments = () => {
    const total = progress.total_documents || 1;
    return {
      approved: (progress.documents_approved / total) * 100,
      inReview: (progress.documents_in_review / total) * 100,
      drafts: (progress.drafts_in_progress / total) * 100,
    };
  };

  const segments = getProgressSegments();

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all">
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${deadlineStyle.bg} ${deadlineStyle.text}`}>
                <DeadlineIcon className="w-3.5 h-3.5" />
                {progress.deadline_status === 'no_deadline'
                  ? 'No Deadline'
                  : progress.days_until_deadline !== undefined
                    ? progress.days_until_deadline < 0
                      ? `${Math.abs(progress.days_until_deadline)}d overdue`
                      : `${progress.days_until_deadline}d left`
                    : 'Unknown'
                }
              </span>

              {progress.review_required && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  progress.review_required === 'full_external'
                    ? 'bg-purple-100 text-purple-700'
                    : progress.review_required === 'peer'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {progress.review_required.replace('_', ' ')} review
                </span>
              )}
            </div>

            <h3 className="font-semibold text-slate-900 text-lg">
              {progress.grant_title}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {progress.funder_name}
              {progress.amount_requested && (
                <span className="text-teal-700 font-medium ml-2">
                  {formatCurrency(progress.amount_requested)}
                </span>
              )}
            </p>
          </div>

          <button
            onClick={() => onContinueWriting?.(progress.grant_id)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Continue Writing
          </button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="p-5">
        {/* Word Count Progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Word Count Progress</span>
            <span className="text-sm font-medium text-slate-900">
              {progress.total_words_written?.toLocaleString() || 0} / {progress.total_target_words?.toLocaleString() || '?'} words
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress.word_count_progress_pct || 0, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            {progress.word_count_progress_pct?.toFixed(0) || 0}% complete
          </p>
        </div>

        {/* Document Status Progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Documents</span>
            <span className="text-sm text-slate-500">
              {progress.total_documents || 0} total
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
            {segments.approved > 0 && (
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${segments.approved}%` }}
                title={`${progress.documents_approved} approved`}
              />
            )}
            {segments.inReview > 0 && (
              <div
                className="h-full bg-amber-500"
                style={{ width: `${segments.inReview}%` }}
                title={`${progress.documents_in_review} in review`}
              />
            )}
            {segments.drafts > 0 && (
              <div
                className="h-full bg-blue-400"
                style={{ width: `${segments.drafts}%` }}
                title={`${progress.drafts_in_progress} drafts`}
              />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{progress.documents_approved || 0} approved</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{progress.documents_in_review || 0} in review</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span>{progress.drafts_in_progress || 0} drafts</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-600 mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {formatTimeSpent(progress.total_time_spent_minutes)}
            </p>
            <p className="text-xs text-slate-500">Time spent</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-600 mb-1">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {progress.total_sessions || 0}
            </p>
            <p className="text-xs text-slate-500">Sessions</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-600 mb-1">
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {progress.writing_investment_hours || '?'}h
            </p>
            <p className="text-xs text-slate-500">Est. total</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <button className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-teal-600 transition-colors">
          <Sparkles className="w-4 h-4" />
          AI Writing Help
        </button>
        <button className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-teal-600 transition-colors">
          View All Documents
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
