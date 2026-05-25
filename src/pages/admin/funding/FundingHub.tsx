/**
 * Funding Hub
 * Unified surface for BLKOUT funding work — bid pipeline + Critical Frequency outreach.
 * Replaces the separate Grants and Fundraising admin pages.
 */

import { useMemo, useState } from 'react';
import {
  Banknote,
  Target,
  Calendar,
  FileText,
  Send,
  Plus,
  Search,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useGrants, useFunderRelationships, normalizeFunderName } from '@/hooks/useGrants';
import { useFundraisingDrafts } from '@/hooks/useFundraisingDrafts';
import { PipelineSection } from './PipelineSection';
import { OpportunitiesSection } from './OpportunitiesSection';
import { BidWritingSection } from './BidWritingSection';
import { OutreachSection } from './OutreachSection';
import type { CfOutreachSummary } from '@/components/grants/CfOutreachBadge';

type Tab = 'pipeline' | 'opportunities' | 'writing' | 'outreach';

export default function FundingHub() {
  const { grants, opportunities, bidProgress, pipelineSummary } = useGrants();
  const { relationships: funderRelationships } = useFunderRelationships();
  const { drafts } = useFundraisingDrafts();

  const [activeTab, setActiveTab] = useState<Tab>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [relationshipOnly, setRelationshipOnly] = useState(false);
  const [outreachPartnerFilter, setOutreachPartnerFilter] = useState<string | undefined>();

  const filteredOpportunities = opportunities.filter((opp) => {
    const q = searchQuery.trim().toLowerCase();
    if (q && !`${opp.title} ${opp.funder_name}`.toLowerCase().includes(q)) return false;
    if (statusFilter !== 'all' && opp.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && opp.project_category !== categoryFilter) return false;
    if (urgencyFilter !== 'all' && opp.deadline_urgency !== urgencyFilter) return false;
    if (relationshipOnly && !funderRelationships.has(normalizeFunderName(opp.funder_name)))
      return false;
    return true;
  });

  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (urgencyFilter !== 'all' ? 1 : 0) +
    (relationshipOnly ? 1 : 0);

  // Outreach KPIs from CF drafts
  const outreachStats = useMemo(() => {
    const inFlight = drafts.filter((d) => d.status === 'draft' || d.status === 'reviewed').length;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const sentThisMonth = drafts.filter((d) => {
      if (!d.sent_at) return false;
      return new Date(d.sent_at) >= startOfMonth;
    }).length;
    return { inFlight, sentThisMonth };
  }, [drafts]);

  // Per-funder CF outreach summary — keyed by normalized funder name.
  // Matches via either draft.partner_name or draft.org_name, so a draft for
  // "Wellcome Mental Health" surfaces on the "Wellcome Trust" grant card iff
  // either name normalises to the same key. Names that drift will simply not
  // cross-link — preferable to false positives.
  const cfOutreachByFunder = useMemo(() => {
    const map = new Map<string, CfOutreachSummary>();
    drafts.forEach((d) => {
      const keys = new Set<string>();
      if (d.partner_name) keys.add(normalizeFunderName(d.partner_name));
      if (d.org_name) keys.add(normalizeFunderName(d.org_name));
      keys.forEach((key) => {
        if (!key) return;
        const existing = map.get(key) ?? { draftCount: 0, sentCount: 0 };
        if (d.status === 'draft' || d.status === 'reviewed') existing.draftCount += 1;
        else if (d.status === 'sent' || d.status === 'responded') existing.sentCount += 1;
        if (d.sent_at) {
          const date = d.sent_at.slice(0, 10);
          if (!existing.lastSentAt || date > existing.lastSentAt) {
            existing.lastSentAt = date;
          }
        }
        map.set(key, existing);
      });
    });
    return map;
  }, [drafts]);

  const handleCfOutreachClick = (funderName: string) => {
    setActiveTab('outreach');
    setOutreachPartnerFilter(funderName);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const getUrgencyClass = (daysUntil: number | null) => {
    if (daysUntil === null) return 'text-slate-500';
    if (daysUntil < 0) return 'text-red-600 font-semibold';
    if (daysUntil <= 7) return 'text-amber-600 font-semibold';
    if (daysUntil <= 30) return 'text-blue-600';
    return 'text-slate-600';
  };

  const tabs: Array<{ id: Tab; label: string; icon: typeof Target }> = [
    { id: 'pipeline', label: 'Pipeline', icon: Target },
    { id: 'opportunities', label: 'Opportunities', icon: Sparkles },
    { id: 'writing', label: 'Bid Writing', icon: FileText },
    { id: 'outreach', label: 'CF Outreach', icon: Send },
  ];

  return (
    <Layout showSidebar>
      <div className="space-y-8">
        {/* Header with Liberation Teal theme */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 p-8 text-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold tracking-tight">Funding</h1>
                <p className="mt-2 text-teal-100 max-w-2xl">
                  Bid pipeline and Critical Frequency outreach in one place. Track opportunities,
                  manage bids, and steward funder relationships.
                </p>
              </div>
              <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-lg transition-all border border-white/20">
                <Plus className="w-5 h-5" />
                <span className="font-medium">New Opportunity</span>
              </button>
            </div>

            {/* Unified KPI strip — 6 stats across pipeline + outreach */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
              <KpiTile
                label="Pipeline Value"
                value={formatCurrency(pipelineSummary?.totalRequested || 0)}
                icon={Banknote}
              />
              <KpiTile
                label="Active Bids"
                value={`${pipelineSummary?.activeApplications || 0}`}
                icon={Target}
              />
              <KpiTile
                label="Upcoming Deadlines"
                value={`${pipelineSummary?.upcomingDeadlines || 0}`}
                icon={Calendar}
              />
              <KpiTile
                label="Drafts in Flight"
                value={`${outreachStats.inFlight}`}
                icon={FileText}
              />
              <KpiTile
                label="Sent This Month"
                value={`${outreachStats.sentThisMonth}`}
                icon={Send}
              />
              <KpiTile
                label="Cultivated Funders"
                value={`${funderRelationships.size}`}
                icon={Sparkles}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={
                  activeTab === 'outreach'
                    ? 'Search drafts (partner, org, path)…'
                    : 'Search grants, funders, or opportunities…'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
              />
            </div>
            {activeTab === 'opportunities' && (
              <button
                onClick={() => setShowFilters((s) => !s)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-teal-600 text-white text-xs font-semibold rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {activeTab === 'opportunities' && showFilters && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-700">Filter opportunities</p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setCategoryFilter('all');
                      setUrgencyFilter('all');
                      setRelationshipOnly(false);
                    }}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs text-slate-500">Status</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="all">All statuses</option>
                    <option value="new">New</option>
                    <option value="researching">Researching</option>
                    <option value="assessing">Assessing</option>
                    <option value="recommended">Recommended</option>
                    <option value="declined">Declined</option>
                    <option value="converted">Converted</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500">Category</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="all">All categories</option>
                    <option value="infrastructure">Tech Infrastructure</option>
                    <option value="mental_health">Mental Health</option>
                    <option value="creative">Creative &amp; Cultural</option>
                    <option value="capacity_building">Capacity Building</option>
                    <option value="advocacy">Advocacy</option>
                    <option value="research">Research</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500">Deadline</span>
                  <select
                    value={urgencyFilter}
                    onChange={(e) => setUrgencyFilter(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="all">Any deadline</option>
                    <option value="urgent">Urgent</option>
                    <option value="approaching">Approaching</option>
                    <option value="future">Future</option>
                    <option value="no_deadline">No deadline / rolling</option>
                    <option value="expired">Expired</option>
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={relationshipOnly}
                  onChange={(e) => setRelationshipOnly(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-700">
                  Only funders we have a cultivated relationship with
                </span>
                <span className="text-xs text-slate-400">
                  ({funderRelationships.size} in CRM)
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'pipeline' && (
          <PipelineSection
            grants={grants}
            searchQuery={searchQuery}
            formatCurrency={formatCurrency}
            getUrgencyClass={getUrgencyClass}
            cfOutreachByFunder={cfOutreachByFunder}
            onCfOutreachClick={handleCfOutreachClick}
          />
        )}

        {activeTab === 'opportunities' && (
          <OpportunitiesSection
            opportunities={opportunities}
            filteredOpportunities={filteredOpportunities}
            funderRelationships={funderRelationships}
            formatCurrency={formatCurrency}
            cfOutreachByFunder={cfOutreachByFunder}
            onCfOutreachClick={handleCfOutreachClick}
          />
        )}

        {activeTab === 'writing' && (
          <BidWritingSection bidProgress={bidProgress} formatCurrency={formatCurrency} />
        )}

        {activeTab === 'outreach' && (
          <OutreachSection
            searchQuery={searchQuery}
            partnerFilter={outreachPartnerFilter}
            onClearPartnerFilter={() => setOutreachPartnerFilter(undefined)}
          />
        )}

        {/* Quick Actions Footer */}
        <div className="bg-gradient-to-r from-slate-50 to-teal-50 rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Need help with funding strategy?</h3>
              <p className="text-slate-600 text-sm mt-1">
                Use IVOR to research opportunities and get AI-assisted bid writing support.
              </p>
            </div>
            <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium">
              <Sparkles className="w-4 h-4" />
              Ask AIvor
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function KpiTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Banknote;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-white/20 rounded-lg">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-teal-100 text-xs truncate">{label}</p>
          <p className="text-lg font-bold leading-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}
