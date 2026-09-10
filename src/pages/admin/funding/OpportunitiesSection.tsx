import { Filter, Plus, Sparkles } from 'lucide-react';
import { OpportunityCard } from '@/components/grants/OpportunityCard';
import { normalizeFunderName } from '@/hooks/useGrants';
import type { OpportunityPipeline, FunderRelationship } from '@/types';

interface Props {
  opportunities: OpportunityPipeline[];
  filteredOpportunities: OpportunityPipeline[];
  funderRelationships: Map<string, FunderRelationship>;
  formatCurrency: (n: number) => string;
}

export function OpportunitiesSection({
  opportunities,
  filteredOpportunities,
  funderRelationships,
  formatCurrency,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Funding Opportunities</h2>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Sparkles className="w-4 h-4" />
          <span>
            {filteredOpportunities.length}
            {filteredOpportunities.length !== opportunities.length
              ? ` of ${opportunities.length}`
              : ''}{' '}
            opportunities
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOpportunities.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            formatCurrency={formatCurrency}
            relationship={funderRelationships.get(normalizeFunderName(opp.funder_name))}
          />
        ))}
      </div>

      {opportunities.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No opportunities yet</h3>
          <p className="text-slate-500 mb-4">
            Start discovering funding opportunities for BLKOUT
          </p>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add Opportunity
          </button>
        </div>
      )}

      {opportunities.length > 0 && filteredOpportunities.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">
            No opportunities match these filters
          </h3>
          <p className="text-slate-500">Adjust or clear the filters to see more.</p>
        </div>
      )}
    </div>
  );
}
