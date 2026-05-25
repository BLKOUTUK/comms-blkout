/**
 * Finance Dashboard
 * CBS financial overview with Year 1 projections and actuals tracking
 * Theme: Liberation Gold - Sovereignty, community wealth
 */

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  BarChart3,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  Receipt,
  Info,
} from 'lucide-react';
import { Layout } from '../../components/layout/Layout';

// Year 1 Conservative Baseline — from CBS Registration Briefing + Business Case
const YEAR1_PROJECTION = {
  revenue: {
    total: 17750,
    streams: [
      { name: 'Member Contributions', projected: 3750, actual: 0, pct: 21 },
      { name: 'Grant Funding', projected: 10000, actual: 0, pct: 56 },
      { name: 'Earned Revenue', projected: 2000, actual: 0, pct: 11 },
      { name: 'Fundraising & Donations', projected: 2000, actual: 0, pct: 11 },
    ],
  },
  expenses: {
    total: 14500,
    categories: [
      { name: 'Programs & Events', projected: 5000, actual: 0, pct: 34 },
      { name: 'Technology & Platform', projected: 3000, actual: 0, pct: 21 },
      { name: 'Admin & Operations', projected: 2000, actual: 0, pct: 14 },
      { name: 'Community Investment', projected: 3500, actual: 0, pct: 24 },
      { name: 'Marketing & Outreach', projected: 1000, actual: 0, pct: 7 },
    ],
  },
  surplus: 3250,
  members: { target: 50, current: 5 },
  breakeven: 45,
};

const QUARTERLY_DATA = [
  { quarter: 'Q1', revenue: 1125, expenses: 3500, net: -2375, members: 10 },
  { quarter: 'Q2', revenue: 4250, expenses: 3500, net: 750, members: 20 },
  { quarter: 'Q3', revenue: 7125, expenses: 3500, net: 3625, members: 35 },
  { quarter: 'Q4', revenue: 5250, expenses: 4000, net: 1250, members: 50 },
];

const FIVE_YEAR = [
  { year: 1, revenue: 17750, expenses: 14500, surplus: 3250, members: 50, grantDep: 56 },
  { year: 2, revenue: 41500, expenses: 40000, surplus: 1500, members: 100, grantDep: 48 },
  { year: 3, revenue: 82000, expenses: 81000, surplus: 1000, members: 200, grantDep: 43 },
  { year: 4, revenue: 125125, expenses: 111000, surplus: 14125, members: 375, grantDep: 36 },
  { year: 5, revenue: 176125, expenses: 153000, surplus: 23125, members: 575, grantDep: 31 },
];

// Active subscriptions — verified against Gmail invoices + service dashboards on 25 May 2026.
// Source = how the amount was confirmed. Billing = how the service charges (annualised to monthly
// for usage and annual). When a service is cancelled, remove from this array; don't keep as a stub.
type BillingCycle = 'monthly' | 'annual' | 'usage';
type SubscriptionSource = 'gmail-receipt' | 'service-dashboard' | 'estimate';
type SubscriptionCategory = 'infrastructure' | 'ai' | 'tools' | 'domain';

interface Subscription {
  service: string;
  category: SubscriptionCategory;
  monthlyCost: number;        // £ — monthly equivalent (annual cost / 12 for annuals)
  annualCost?: number;         // £ — explicit annual cost for annually-billed services
  billing: BillingCycle;
  lastVerified: string;        // YYYY-MM-DD
  source: SubscriptionSource;
  nextRenewal?: string;        // YYYY-MM-DD for annuals
  notes?: string;
}

const SUBSCRIPTIONS: Subscription[] = [
  // Infrastructure
  {
    service: 'Hostinger VPS (Coolify)',
    category: 'infrastructure',
    monthlyCost: 17.99,
    annualCost: 215.86,
    billing: 'annual',
    lastVerified: '2026-05-25',
    source: 'gmail-receipt',
    nextRenewal: '2027-05-07',
    notes: 'Hosts all BLKOUT apps via Coolify',
  },
  {
    service: 'Google Workspace',
    category: 'infrastructure',
    monthlyCost: 14,
    billing: 'monthly',
    lastVerified: '2026-05-25',
    source: 'service-dashboard',
    notes: 'blkoutuk.com workspace',
  },
  // AI
  {
    service: 'Anthropic Claude API',
    category: 'ai',
    monthlyCost: 90,
    billing: 'usage',
    lastVerified: '2026-04-27',
    source: 'gmail-receipt',
    notes: 'Claude API consumption — varies. £75 + £15 VAT April invoice',
  },
  {
    service: 'OpenRouter (Bayard LLM routing)',
    category: 'ai',
    monthlyCost: 12,
    billing: 'usage',
    lastVerified: '2026-05-21',
    source: 'gmail-receipt',
    notes: '~$15 avg across 4 recent invoices',
  },
  {
    service: 'Google Cloud Platform',
    category: 'ai',
    monthlyCost: 3.45,
    billing: 'usage',
    lastVerified: '2026-05-01',
    source: 'gmail-receipt',
    notes: 'Bayard OAuth + APIs — low usage',
  },
  // Tools
  {
    service: 'SendFox',
    category: 'tools',
    monthlyCost: 8,
    billing: 'monthly',
    lastVerified: '2026-05-07',
    source: 'gmail-receipt',
    notes: 'Newsletter platform ($10/mo USD)',
  },
  {
    service: 'Canva',
    category: 'tools',
    monthlyCost: 8.33,
    annualCost: 99.99,
    billing: 'annual',
    lastVerified: '2026-05-25',
    source: 'service-dashboard',
    nextRenewal: '2026-11-03',
    notes: 'Annual design subscription',
  },
  // Domain
  {
    service: 'WordPress.com domain',
    category: 'domain',
    monthlyCost: 1.33,
    annualCost: 16,
    billing: 'annual',
    lastVerified: '2026-05-22',
    source: 'gmail-receipt',
    notes: 'blkoutuk.com domain registrar',
  },
];

const CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  infrastructure: 'Infrastructure',
  ai: 'AI & APIs',
  tools: 'Tools',
  domain: 'Domains',
};

const BILLING_BADGE: Record<BillingCycle, { label: string; classes: string }> = {
  monthly: { label: 'monthly', classes: 'bg-blue-50 text-blue-700' },
  annual: { label: 'annual', classes: 'bg-purple-50 text-purple-700' },
  usage: { label: 'usage', classes: 'bg-amber-50 text-amber-700' },
};

const TOTAL_MONTHLY = SUBSCRIPTIONS.reduce((s, x) => s + x.monthlyCost, 0);
const TOTAL_ANNUAL = TOTAL_MONTHLY * 12;

function formatGBP(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(abs);
  return amount < 0 ? `(${formatted})` : formatted;
}

function ProgressBar({ value, max, color = 'bg-amber-500' }: { value: number; max: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

type TabId = 'overview' | 'projections' | 'infrastructure';

export function Finance() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const totalActualRevenue = YEAR1_PROJECTION.revenue.streams.reduce((s, r) => s + r.actual, 0);
  const totalActualExpenses = YEAR1_PROJECTION.expenses.categories.reduce((s, c) => s + c.actual, 0);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Year 1 Overview' },
    { id: 'projections', label: '5-Year Forecast' },
    { id: 'infrastructure', label: 'Subscriptions' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Finance</h1>
          <p className="text-gray-600 mt-1">
            CBS financial overview — Conservative baseline projection
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Year 1 Revenue</span>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatGBP(YEAR1_PROJECTION.revenue.total)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatGBP(totalActualRevenue)} received so far
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Year 1 Expenses</span>
              <div className="p-2 bg-red-50 rounded-lg">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatGBP(YEAR1_PROJECTION.expenses.total)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatGBP(totalActualExpenses)} spent so far
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Projected Surplus</span>
              <div className="p-2 bg-amber-50 rounded-lg">
                <PiggyBank className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatGBP(YEAR1_PROJECTION.surplus)}</p>
            <p className="text-xs text-gray-500 mt-1">Reinvested for community benefit</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">CBS Members</span>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {YEAR1_PROJECTION.members.current}
              <span className="text-base font-normal text-gray-400"> / {YEAR1_PROJECTION.members.target}</span>
            </p>
            <ProgressBar
              value={YEAR1_PROJECTION.members.current}
              max={YEAR1_PROJECTION.members.target}
              color="bg-purple-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Revenue & Expenses Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                  Revenue Streams
                </h3>
                <div className="space-y-4">
                  {YEAR1_PROJECTION.revenue.streams.map((stream) => (
                    <div key={stream.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{stream.name}</span>
                        <span className="font-medium text-gray-900">
                          {formatGBP(stream.projected)}
                          <span className="text-gray-400 ml-1">({stream.pct}%)</span>
                        </span>
                      </div>
                      <ProgressBar
                        value={stream.actual}
                        max={stream.projected}
                        color="bg-emerald-500"
                      />
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatGBP(stream.actual)} of {formatGBP(stream.projected)} received
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ArrowDownRight className="h-5 w-5 text-red-500" />
                  Expense Categories
                </h3>
                <div className="space-y-4">
                  {YEAR1_PROJECTION.expenses.categories.map((cat) => (
                    <div key={cat.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{cat.name}</span>
                        <span className="font-medium text-gray-900">
                          {formatGBP(cat.projected)}
                          <span className="text-gray-400 ml-1">({cat.pct}%)</span>
                        </span>
                      </div>
                      <ProgressBar
                        value={cat.actual}
                        max={cat.projected}
                        color="bg-red-400"
                      />
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatGBP(cat.actual)} of {formatGBP(cat.projected)} spent
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quarterly P&L */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-amber-600" />
                Quarterly Projection
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-gray-500">
                      <th className="pb-3 pr-4 font-medium">Quarter</th>
                      <th className="pb-3 pr-4 font-medium text-right">Revenue</th>
                      <th className="pb-3 pr-4 font-medium text-right">Expenses</th>
                      <th className="pb-3 pr-4 font-medium text-right">Net</th>
                      <th className="pb-3 font-medium text-right">Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    {QUARTERLY_DATA.map((q) => (
                      <tr key={q.quarter} className="border-b border-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-900">{q.quarter}</td>
                        <td className="py-3 pr-4 text-right text-emerald-600">{formatGBP(q.revenue)}</td>
                        <td className="py-3 pr-4 text-right text-red-500">{formatGBP(q.expenses)}</td>
                        <td className={`py-3 pr-4 text-right font-medium ${q.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {formatGBP(q.net)}
                        </td>
                        <td className="py-3 text-right text-gray-700">{q.members}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold">
                      <td className="pt-3 pr-4 text-gray-900">Year 1 Total</td>
                      <td className="pt-3 pr-4 text-right text-emerald-600">{formatGBP(17750)}</td>
                      <td className="pt-3 pr-4 text-right text-red-500">{formatGBP(14500)}</td>
                      <td className="pt-3 pr-4 text-right text-emerald-600">{formatGBP(3250)}</td>
                      <td className="pt-3 text-right text-gray-700">50</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Surplus Allocation */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-amber-600" />
                Surplus Allocation (CBS Rules — No Dividends)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Community Investment Fund', pct: 40, amount: 1300, color: 'bg-amber-100 text-amber-800' },
                  { label: 'Operating Reserve', pct: 30, amount: 975, color: 'bg-blue-100 text-blue-800' },
                  { label: 'Platform Development', pct: 20, amount: 650, color: 'bg-purple-100 text-purple-800' },
                  { label: 'Movement Building', pct: 10, amount: 325, color: 'bg-emerald-100 text-emerald-800' },
                ].map((item) => (
                  <div key={item.label} className={`rounded-lg p-4 ${item.color}`}>
                    <p className="text-xs font-medium opacity-70">{item.pct}%</p>
                    <p className="text-lg font-bold">{formatGBP(item.amount)}</p>
                    <p className="text-xs mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Assumptions */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-amber-900 flex items-center gap-2 mb-3">
                <Info className="h-4 w-4" />
                Key Assumptions (Conservative Baseline)
              </h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>Volunteer-run — no staff costs in Year 1</li>
                <li>50 members at £75/year average (£6.25/month)</li>
                <li>1-2 small grants (£5,000-£10,000 range)</li>
                <li>Break-even at ~45 members</li>
                <li>Excludes DOWN dating platform (separate P&L)</li>
                <li>Source: CBS Registration Briefing Pack + Business Case (Conservative 1% scenario)</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'projections' && (
          <div className="space-y-6">
            {/* 5-Year Forecast Table */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-600" />
                5-Year Revenue Forecast (Conservative)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-gray-500">
                      <th className="pb-3 pr-4 font-medium">Year</th>
                      <th className="pb-3 pr-4 font-medium text-right">Revenue</th>
                      <th className="pb-3 pr-4 font-medium text-right">Expenses</th>
                      <th className="pb-3 pr-4 font-medium text-right">Surplus</th>
                      <th className="pb-3 pr-4 font-medium text-right">Members</th>
                      <th className="pb-3 font-medium text-right">Grant Dep.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FIVE_YEAR.map((row) => (
                      <tr key={row.year} className={`border-b border-gray-50 ${row.year === 1 ? 'bg-amber-50/50' : ''}`}>
                        <td className="py-3 pr-4 font-medium text-gray-900">
                          Year {row.year}
                          {row.year === 1 && <span className="ml-2 text-xs text-amber-600">(current)</span>}
                        </td>
                        <td className="py-3 pr-4 text-right text-emerald-600">{formatGBP(row.revenue)}</td>
                        <td className="py-3 pr-4 text-right text-red-500">{formatGBP(row.expenses)}</td>
                        <td className={`py-3 pr-4 text-right font-medium ${row.surplus >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {formatGBP(row.surplus)}
                        </td>
                        <td className="py-3 pr-4 text-right text-gray-700">{row.members}</td>
                        <td className="py-3 text-right text-gray-700">{row.grantDep}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                5-year totals: Revenue £352,875 / Expenses £345,500 / Net £7,375.
                Grant dependency decreases from 56% to 31%.
              </p>
            </div>

            {/* Organizational Growth */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizational Development Path</h3>
              <div className="space-y-3">
                {[
                  { year: 1, label: 'Volunteer-based with stipends for key roles', status: 'current' },
                  { year: 2, label: 'Part-time coordinator (20 hours/week)', status: 'planned' },
                  { year: 3, label: 'Full-time coordinator + part-time program staff', status: 'planned' },
                  { year: 5, label: '3-4 full-time cooperative employment positions', status: 'planned' },
                ].map((step) => (
                  <div key={step.year} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step.status === 'current'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {step.year}
                    </div>
                    <div className="pt-1">
                      <p className={`text-sm ${step.status === 'current' ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scenario Context */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scenario Context</h3>
              <p className="text-sm text-gray-600 mb-4">
                This dashboard shows the <strong>Conservative (1%)</strong> scenario.
                The Business Case models three scenarios based on 57,500 addressable community:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-gray-500">
                      <th className="pb-3 pr-4 font-medium">Scenario</th>
                      <th className="pb-3 pr-4 font-medium text-right">Year 1 Rev.</th>
                      <th className="pb-3 pr-4 font-medium text-right">Year 5 Rev.</th>
                      <th className="pb-3 pr-4 font-medium text-right">Year 5 Members</th>
                      <th className="pb-3 font-medium text-right">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-50 bg-amber-50/50">
                      <td className="py-3 pr-4 font-medium text-gray-900">Conservative (1%)</td>
                      <td className="py-3 pr-4 text-right">{formatGBP(17750)}</td>
                      <td className="py-3 pr-4 text-right">{formatGBP(176125)}</td>
                      <td className="py-3 pr-4 text-right">575</td>
                      <td className="py-3 text-right"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">Low</span></td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-3 pr-4 text-gray-700">Moderate (10%)</td>
                      <td className="py-3 pr-4 text-right text-gray-600">{formatGBP(44150)}</td>
                      <td className="py-3 pr-4 text-right text-gray-600">{formatGBP(1055750)}</td>
                      <td className="py-3 pr-4 text-right text-gray-600">5,750</td>
                      <td className="py-3 text-right"><span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">Medium</span></td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-3 pr-4 text-gray-700">Stretch (25%)</td>
                      <td className="py-3 pr-4 text-right text-gray-600">{formatGBP(85300)}</td>
                      <td className="py-3 pr-4 text-right text-gray-600">{formatGBP(2233125)}</td>
                      <td className="py-3 pr-4 text-right text-gray-600">14,375</td>
                      <td className="py-3 text-right"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">High</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'infrastructure' && (
          <div className="space-y-6">
            {/* Totals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm font-medium text-gray-500">Total monthly</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatGBP(TOTAL_MONTHLY)}<span className="text-base font-normal text-gray-500">/mo</span></p>
                <p className="text-xs text-gray-400 mt-1">{SUBSCRIPTIONS.length} active subscriptions</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm font-medium text-gray-500">Total annual</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatGBP(TOTAL_ANNUAL)}<span className="text-base font-normal text-gray-500">/yr</span></p>
                <p className="text-xs text-gray-400 mt-1">Year 1 projected expense: {formatGBP(YEAR1_PROJECTION.expenses.total)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm font-medium text-gray-500">Last verified</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">25 May 2026</p>
                <p className="text-xs text-gray-400 mt-1">Via Gmail invoice scan + dashboards</p>
              </div>
            </div>

            {/* Subscriptions by category */}
            {(Object.keys(CATEGORY_LABELS) as SubscriptionCategory[]).map((cat) => {
              const items = SUBSCRIPTIONS.filter((s) => s.category === cat);
              if (items.length === 0) return null;
              const catTotal = items.reduce((s, x) => s + x.monthlyCost, 0);
              return (
                <div key={cat} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-amber-600" />
                      {CATEGORY_LABELS[cat]}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {formatGBP(catTotal)}/mo · {formatGBP(catTotal * 12)}/yr
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b border-gray-100">
                          <th className="pb-2 pr-3 font-medium">Service</th>
                          <th className="pb-2 pr-3 font-medium text-right">Monthly</th>
                          <th className="pb-2 pr-3 font-medium text-right">Annual</th>
                          <th className="pb-2 pr-3 font-medium">Billing</th>
                          <th className="pb-2 pr-3 font-medium">Verified</th>
                          <th className="pb-2 font-medium">Next renewal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((s) => (
                          <tr key={s.service} className="border-b border-gray-50">
                            <td className="py-2 pr-3">
                              <div className="text-gray-900 font-medium">{s.service}</div>
                              {s.notes && <div className="text-xs text-gray-500">{s.notes}</div>}
                            </td>
                            <td className="py-2 pr-3 text-right text-gray-900">{formatGBP(s.monthlyCost)}</td>
                            <td className="py-2 pr-3 text-right text-gray-700">{formatGBP(s.annualCost ?? s.monthlyCost * 12)}</td>
                            <td className="py-2 pr-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${BILLING_BADGE[s.billing].classes}`}>
                                {BILLING_BADGE[s.billing].label}
                              </span>
                            </td>
                            <td className="py-2 pr-3 text-xs text-gray-500" title={`Source: ${s.source}`}>{s.lastVerified}</td>
                            <td className="py-2 text-xs text-gray-500">{s.nextRenewal ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* What It Powers */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What {formatGBP(TOTAL_MONTHLY)}/month Powers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: 'blkoutuk.com', desc: 'Community platform' },
                  { name: 'commons.blkoutuk.com', desc: 'Commons walkthrough' },
                  { name: 'comms.blkoutuk.com', desc: 'Communications + Funding hub' },
                  { name: 'events.blkoutuk.com', desc: 'Events calendar' },
                  { name: 'news.blkoutuk.com', desc: 'Community news' },
                  { name: 'compass.blkoutuk.com', desc: "Ivor's Compass" },
                  { name: 'crm.blkoutuk.cloud', desc: 'CRM' },
                  { name: 'ivor.blkoutuk.com', desc: 'AIvor API' },
                  { name: 'critical.blkoutuk.com', desc: 'Critical Frequency' },
                ].map((site) => (
                  <div key={site.name} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{site.name}</p>
                      <p className="text-xs text-gray-500">{site.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Plus: Supabase free tier (1 active database), AIvor LLM responses, health monitoring, automated scrapers, cron jobs, and the Bayard personal assistant.
              </p>
            </div>

            {/* Break-even Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-600" />
                Break-even Analysis
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{Math.ceil(TOTAL_ANNUAL / 75)}</p>
                  <p className="text-sm text-gray-600 mt-1">members to cover tech costs</p>
                  <p className="text-xs text-gray-400">{Math.ceil(TOTAL_ANNUAL / 75)} × £75/yr = {formatGBP(Math.ceil(TOTAL_ANNUAL / 75) * 75)}</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-3xl font-bold text-amber-700">45</p>
                  <p className="text-sm text-amber-800 mt-1">members to break even</p>
                  <p className="text-xs text-amber-600">Covers tech + essential admin</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <p className="text-3xl font-bold text-emerald-700">50</p>
                  <p className="text-sm text-emerald-800 mt-1">Year 1 target</p>
                  <p className="text-xs text-emerald-600">Generates £3,250 surplus</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
