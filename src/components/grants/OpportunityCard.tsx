/**
 * Opportunity Card Component
 * Displays a funding opportunity in discovery pipeline
 * Theme: Liberation Teal with source indicators
 */

import {
  Building2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Globe,
  Users,
  Lightbulb
} from 'lucide-react';
import type { OpportunityPipeline, OpportunityStatus, OpportunitySource } from '../../services/grants/types';

interface OpportunityCardProps {
  opportunity: OpportunityPipeline;
  formatCurrency: (amount: number) => string;
  onConvert?: (id: string) => void;
  onDecline?: (id: string) => void;
}

const sourceConfig: Record<OpportunitySource, { icon: typeof Globe; label: string; color: string }> = {
  charity_excellence: { icon: Globe, label: 'Charity Excellence', color: 'text-blue-600 bg-blue-50' },
  '360giving': { icon: Globe, label: '360Giving', color: 'text-purple-600 bg-purple-50' },
  manual: { icon: Users, label: 'Manual Entry', color: 'text-slate-600 bg-slate-50' },
  ivor_research: { icon: Sparkles, label: 'IVOR Research', color: 'text-teal-600 bg-teal-50' },
  referral: { icon: Users, label: 'Referral', color: 'text-amber-600 bg-amber-50' },
  funder_website: { icon: Building2, label: 'Funder Website', color: 'text-indigo-600 bg-indigo-50' },
};

const statusConfig: Record<OpportunityStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  researching: { label: 'Researching', color: 'bg-slate-100 text-slate-700' },
  assessing: { label: 'Assessing', color: 'bg-amber-100 text-amber-700' },
  recommended: { label: 'Recommended', color: 'bg-emerald-100 text-emerald-700' },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700' },
  converted: { label: 'Converted', color: 'bg-teal-100 text-teal-700' },
};

const categoryLabels: Record<string, string> = {
  infrastructure: 'Tech Infrastructure',
  mental_health: 'Mental Health',
  creative: 'Creative & Cultural',
  capacity_building: 'Capacity Building',
  advocacy: 'Advocacy',
  research: 'Research',
};

export function OpportunityCard({
  opportunity,
  formatCurrency,
  onConvert,
  onDecline,
}: OpportunityCardProps) {
  const source = sourceConfig[opportunity.source];
  const status = statusConfig[opportunity.status];
  const SourceIcon = source.icon;

  // Calculate deadline urgency
  const getDeadlineDisplay = () => {
    if (!opportunity.deadline_date) return { text: 'Rolling deadline', urgent: false };

    const daysUntil = opportunity.days_until_deadline;
    if (daysUntil === undefined || daysUntil === null) return { text: 'No deadline', urgent: false };

    if (daysUntil < 0) return { text: 'Expired', urgent: true };
    if (daysUntil === 0) return { text: 'Today!', urgent: true };
    if (daysUntil <= 7) return { text: `${daysUntil}d left`, urgent: true };
    if (daysUntil <= 30) return { text: `${daysUntil} days`, urgent: false };

    return {
      text: new Date(opportunity.deadline_date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short'
      }),
      urgent: false
    };
  };

  const deadline = getDeadlineDisplay();

  // Get funding range display
  const getFundingRange = () => {
    if (opportunity.funding_min && opportunity.funding_max) {
      if (opportunity.funding_min === opportunity.funding_max) {
        return formatCurrency(opportunity.funding_min);
      }
      return `${formatCurrency(opportunity.funding_min)} - ${formatCurrency(opportunity.funding_max)}`;
    }
    if (opportunity.funding_max) return `Up to ${formatCurrency(opportunity.funding_max)}`;
    if (opportunity.funding_min) return `From ${formatCurrency(opportunity.funding_min)}`;
    return 'Amount TBC';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group">
      {/* Header with Source */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${source.color}`}>
          <SourceIcon className="w-3.5 h-3.5" />
          {source.label}
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2">
          {opportunity.title}
        </h3>

        <div className="flex items-center gap-2 mt-2 text-slate-600">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-sm">{opportunity.funder_name}</span>
        </div>

        {/* Funding & Deadline Row */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Funding</p>
            <p className="font-semibold text-teal-700">{getFundingRange()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Deadline</p>
            <p className={`font-medium ${deadline.urgent ? 'text-red-600' : 'text-slate-700'}`}>
              {deadline.text}
            </p>
          </div>
        </div>

        {/* Fit Score */}
        {opportunity.combined_fit_score && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Combined Fit Score</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                    style={{ width: `${(opportunity.combined_fit_score / 10) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-teal-700">
                  {opportunity.combined_fit_score.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Category Tag */}
        {opportunity.project_category && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
              <Lightbulb className="w-3.5 h-3.5" />
              {categoryLabels[opportunity.project_category] || opportunity.project_category}
            </span>
          </div>
        )}

        {/* Funder Intelligence */}
        {opportunity.funder_priorities && opportunity.funder_priorities.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-slate-500 mb-1.5">Funder Priorities</p>
            <div className="flex flex-wrap gap-1">
              {opportunity.funder_priorities.slice(0, 3).map((priority, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-xs"
                >
                  {priority}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Action */}
        {opportunity.status === 'recommended' && (
          <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-800">Recommended for application</p>
                {opportunity.recommended_project && (
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Suggested project: {opportunity.recommended_project}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
        {opportunity.source_url && (
          <a
            href={opportunity.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-teal-600 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Details
          </a>
        )}

        <div className="flex items-center gap-2">
          {opportunity.status !== 'converted' && opportunity.status !== 'declined' && (
            <>
              <button
                onClick={() => onDecline?.(opportunity.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Decline"
              >
                <XCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => onConvert?.(opportunity.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Convert to Grant
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
