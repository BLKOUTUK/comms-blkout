/**
 * Grant Pipeline Card Component
 * Displays a grant in the pipeline with status, deadline, and actions
 * Theme: Liberation Teal with priority indicators
 */

import {
  Calendar,
  Building2,
  ArrowRight,
  ExternalLink,
  Clock,
  Users,
  MapPin,
  LucideIcon
} from 'lucide-react';
import type { Grant, Priority } from '../../types';

interface StatusConfig {
  bg: string;
  text: string;
  icon: LucideIcon;
}

interface GrantPipelineCardProps {
  grant: Grant;
  formatCurrency: (amount: number) => string;
  statusColors: Record<string, StatusConfig>;
  priorityColors: Record<Priority, string>;
  getUrgencyClass: (daysUntil: number | null) => string;
}

export function GrantPipelineCard({
  grant,
  formatCurrency,
  statusColors,
  priorityColors,
  getUrgencyClass,
}: GrantPipelineCardProps) {
  const status = statusColors[grant.status] || statusColors.researching;
  const StatusIcon = status.icon;

  // Calculate days until deadline
  const daysUntil = grant.deadline_date
    ? Math.ceil((new Date(grant.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Format deadline display
  const formatDeadline = () => {
    if (!grant.deadline_date) return 'No deadline';
    if (daysUntil === null) return 'No deadline';
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil === 0) return 'Due today';
    if (daysUntil === 1) return 'Due tomorrow';
    if (daysUntil <= 7) return `${daysUntil} days left`;
    return new Date(grant.deadline_date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get scaling tier label
  const getScalingLabel = (tier?: string) => {
    const labels: Record<string, string> = {
      seed: 'Seed (£10-25K)',
      growth: 'Growth (£50-100K)',
      scale: 'Scale (£150-500K)',
      transformation: 'Transformation (£500K+)',
    };
    return tier ? labels[tier] : null;
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${priorityColors[grant.priority]} overflow-hidden hover:shadow-md transition-all group`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {/* Status Badge */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {grant.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>

              {/* Priority Badge */}
              {grant.priority === 'critical' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                  Critical
                </span>
              )}

              {/* Bid Classification */}
              {grant.bid_priority_score && grant.bid_priority_score >= 8 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                  High Priority Bid
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-slate-900 text-lg group-hover:text-teal-700 transition-colors">
              {grant.title}
            </h3>

            {/* Funder Info */}
            <div className="flex items-center gap-2 mt-2 text-slate-600">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-sm">{grant.funder_name}</span>
              {grant.funder_type && (
                <span className="text-xs text-slate-400 capitalize">
                  • {grant.funder_type}
                </span>
              )}
            </div>

            {/* Meta Info Row */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
              {/* Amount */}
              {grant.amount_requested && (
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="font-semibold text-teal-700">
                    {formatCurrency(grant.amount_requested)}
                  </span>
                  {grant.amount_awarded && grant.status === 'awarded' && (
                    <span className="text-emerald-600">
                      (Awarded: {formatCurrency(grant.amount_awarded)})
                    </span>
                  )}
                </div>
              )}

              {/* Deadline */}
              <div className={`flex items-center gap-1.5 ${getUrgencyClass(daysUntil)}`}>
                <Calendar className="w-4 h-4" />
                <span>{formatDeadline()}</span>
              </div>

              {/* Geographic Scope */}
              {grant.geographic_scope && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-4 h-4" />
                  <span className="capitalize">{grant.geographic_scope.replace('_', ' ')}</span>
                </div>
              )}

              {/* Participant Range */}
              {grant.participant_range_min && grant.participant_range_max && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Users className="w-4 h-4" />
                  <span>{grant.participant_range_min}-{grant.participant_range_max}</span>
                </div>
              )}
            </div>

            {/* Scaling Tier */}
            {grant.scaling_tier && (
              <div className="mt-3">
                <span className="inline-flex items-center px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium">
                  {getScalingLabel(grant.scaling_tier)}
                </span>
              </div>
            )}

            {/* Strategic Fit Score */}
            {grant.strategic_fit_score && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-slate-500">Strategic Fit:</span>
                <div className="flex gap-0.5">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < grant.strategic_fit_score!
                          ? 'bg-teal-500'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-teal-700">
                  {grant.strategic_fit_score}/10
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2">
            <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
              <ArrowRight className="w-5 h-5" />
            </button>
            {grant.application_url && (
              <a
                href={grant.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Writing Investment (if in preparing status) */}
        {grant.status === 'preparing' && grant.writing_investment_hours && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span>Est. {grant.writing_investment_hours}h writing investment</span>
              </div>
              {grant.review_required && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  grant.review_required === 'full_external'
                    ? 'bg-purple-100 text-purple-700'
                    : grant.review_required === 'peer'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {grant.review_required.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Review
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
