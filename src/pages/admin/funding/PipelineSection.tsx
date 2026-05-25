import { AlertCircle, CheckCircle2, FileText, Search, ArrowRight, Clock } from 'lucide-react';
import { GrantPipelineCard } from '@/components/grants/GrantPipelineCard';
import { normalizeFunderName } from '@/hooks/useGrants';
import type { Grant } from '@/types';
import type { CfOutreachSummary } from '@/components/grants/CfOutreachBadge';

interface Props {
  grants: Grant[];
  searchQuery: string;
  formatCurrency: (n: number) => string;
  getUrgencyClass: (d: number | null) => string;
  cfOutreachByFunder: Map<string, CfOutreachSummary>;
  onCfOutreachClick: (funderName: string) => void;
}

const statusColors = {
  researching: { bg: 'bg-slate-100', text: 'text-slate-700', icon: Search },
  eligible: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle2 },
  preparing: { bg: 'bg-amber-100', text: 'text-amber-700', icon: FileText },
  submitted: { bg: 'bg-purple-100', text: 'text-purple-700', icon: ArrowRight },
  under_review: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Clock },
  awarded: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
  declined: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
  reporting: { bg: 'bg-teal-100', text: 'text-teal-700', icon: FileText },
};

const priorityColors = {
  critical: 'border-l-red-500',
  high: 'border-l-amber-500',
  medium: 'border-l-blue-500',
  low: 'border-l-slate-300',
};

export function PipelineSection({
  grants,
  searchQuery,
  formatCurrency,
  getUrgencyClass,
  cfOutreachByFunder,
  onCfOutreachClick,
}: Props) {
  const q = searchQuery.trim().toLowerCase();
  const priorityGrants = grants
    .filter((g) => ['critical', 'high'].includes(g.priority))
    .slice(0, 4);
  const allGrants = grants.filter(
    (g) =>
      !q ||
      g.title.toLowerCase().includes(q) ||
      g.funder_name.toLowerCase().includes(q),
  );

  const cardProps = (grant: Grant) => {
    const cf = cfOutreachByFunder.get(normalizeFunderName(grant.funder_name));
    return {
      cfOutreach: cf,
      onCfOutreachClick: cf ? () => onCfOutreachClick(grant.funder_name) : undefined,
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          Priority Applications
        </h2>
        <div className="grid gap-4">
          {priorityGrants.map((grant) => (
            <GrantPipelineCard
              key={grant.id}
              grant={grant}
              formatCurrency={formatCurrency}
              statusColors={statusColors}
              priorityColors={priorityColors}
              getUrgencyClass={getUrgencyClass}
              {...cardProps(grant)}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">All Applications</h2>
        <div className="grid gap-4">
          {allGrants.map((grant) => (
            <GrantPipelineCard
              key={grant.id}
              grant={grant}
              formatCurrency={formatCurrency}
              statusColors={statusColors}
              priorityColors={priorityColors}
              getUrgencyClass={getUrgencyClass}
              {...cardProps(grant)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
