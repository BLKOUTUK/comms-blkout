/**
 * Grant Funding Dashboard
 * Main dashboard for BLKOUT grant management
 * Theme: Liberation Teal - Growth, healing, transformative funding
 */

import { useState } from 'react';
import {
  Banknote,
  TrendingUp,
  Clock,
  FileText,
  Target,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Search,
  Filter,
  Plus,
  Sparkles
} from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { GrantPipelineCard } from '../../components/grants/GrantPipelineCard';
import { OpportunityCard } from '../../components/grants/OpportunityCard';
import { BidProgressCard } from '../../components/grants/BidProgressCard';
import { useGrants } from '../../hooks/useGrants';

// Status colors following BLKOUT design system
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

export default function Grants() {
  const {
    grants,
    opportunities,
    bidProgress,
    pipelineSummary,
  } = useGrants();

  const [activeTab, setActiveTab] = useState<'pipeline' | 'opportunities' | 'writing'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate urgency for deadline display
  const getUrgencyClass = (daysUntil: number | null) => {
    if (daysUntil === null) return 'text-slate-500';
    if (daysUntil < 0) return 'text-red-600 font-semibold';
    if (daysUntil <= 7) return 'text-amber-600 font-semibold';
    if (daysUntil <= 30) return 'text-blue-600';
    return 'text-slate-600';
  };

  return (
    <Layout showSidebar>
      <div className="space-y-8">
        {/* Header with Liberation Teal theme */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 p-8 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold tracking-tight">
                  Grant Funding
                </h1>
                <p className="mt-2 text-teal-100 max-w-2xl">
                  Building sustainable funding for Black queer liberation. Track opportunities,
                  manage bids, and grow community resources.
                </p>
              </div>
              <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-lg transition-all border border-white/20">
                <Plus className="w-5 h-5" />
                <span className="font-medium">New Opportunity</span>
              </button>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-teal-100 text-sm">Pipeline Value</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(pipelineSummary?.totalRequested || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-teal-100 text-sm">Active Bids</p>
                    <p className="text-2xl font-bold">
                      {pipelineSummary?.activeApplications || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-teal-100 text-sm">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {pipelineSummary?.successRate?.toFixed(0) || 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-teal-100 text-sm">Upcoming Deadlines</p>
                    <p className="text-2xl font-bold">
                      {pipelineSummary?.upcomingDeadlines || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-8">
            {[
              { id: 'pipeline', label: 'Grant Pipeline', icon: Target },
              { id: 'opportunities', label: 'Opportunities', icon: Sparkles },
              { id: 'writing', label: 'Bid Writing', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
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
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search grants, funders, or opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-slate-700">Filters</span>
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            {/* Priority Grants Section */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Priority Applications
              </h2>
              <div className="grid gap-4">
                {grants
                  .filter(g => ['critical', 'high'].includes(g.priority))
                  .slice(0, 4)
                  .map((grant) => (
                    <GrantPipelineCard
                      key={grant.id}
                      grant={grant}
                      formatCurrency={formatCurrency}
                      statusColors={statusColors}
                      priorityColors={priorityColors}
                      getUrgencyClass={getUrgencyClass}
                    />
                  ))}
              </div>
            </div>

            {/* All Grants by Status */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                All Applications
              </h2>
              <div className="grid gap-4">
                {grants
                  .filter(g =>
                    !searchQuery ||
                    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    g.funder_name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((grant) => (
                    <GrantPipelineCard
                      key={grant.id}
                      grant={grant}
                      formatCurrency={formatCurrency}
                      statusColors={statusColors}
                      priorityColors={priorityColors}
                      getUrgencyClass={getUrgencyClass}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Funding Opportunities
              </h2>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Sparkles className="w-4 h-4" />
                <span>{opportunities.length} opportunities discovered</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>

            {opportunities.length === 0 && (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                  No opportunities yet
                </h3>
                <p className="text-slate-500 mb-4">
                  Start discovering funding opportunities for BLKOUT
                </p>
                <button className="btn btn-primary">
                  <Plus className="w-4 h-4" />
                  Add Opportunity
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'writing' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Bid Writing Progress
              </h2>
              <button className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium">
                <FileText className="w-4 h-4" />
                View Templates
              </button>
            </div>

            <div className="grid gap-4">
              {bidProgress.map((progress) => (
                <BidProgressCard
                  key={progress.grant_id}
                  progress={progress}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>

            {bidProgress.length === 0 && (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                  No bids in progress
                </h3>
                <p className="text-slate-500 mb-4">
                  Start writing a bid for one of your grant applications
                </p>
                <button className="btn btn-primary">
                  Start Writing
                </button>
              </div>
            )}
          </div>
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
              Ask IVOR
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
