/**
 * CF Outreach Badge
 * Surfaces Critical Frequency draft activity for a funder on grant + opportunity cards.
 * Click → switch to Outreach tab pre-filtered by partner.
 */
import { Send } from 'lucide-react';

export interface CfOutreachSummary {
  /** Count of drafts with status in [draft, reviewed]. */
  draftCount: number;
  /** Count of drafts with status in [sent, responded]. */
  sentCount: number;
  /** Most recent sent_at as YYYY-MM-DD, if any. */
  lastSentAt?: string;
}

interface CfOutreachBadgeProps {
  summary: CfOutreachSummary;
  onClick: () => void;
}

export function CfOutreachBadge({ summary, onClick }: CfOutreachBadgeProps) {
  const total = summary.draftCount + summary.sentCount;
  if (total === 0) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={
        `${total} CF draft${total === 1 ? '' : 's'}` +
        (summary.sentCount > 0 ? ` · ${summary.sentCount} sent` : '') +
        (summary.lastSentAt ? ` · last sent ${summary.lastSentAt}` : '') +
        ' — click to view in CF Outreach tab'
      }
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors"
    >
      <Send className="w-3 h-3" />
      <span>
        {total} CF draft{total === 1 ? '' : 's'}
      </span>
      {summary.lastSentAt && (
        <span className="text-teal-500 font-normal hidden sm:inline">
          · {summary.lastSentAt}
        </span>
      )}
    </button>
  );
}
