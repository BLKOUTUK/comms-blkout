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

const MONTHLY_INFRA = [
  { service: 'Coolify VPS (Hostinger)', cost: 25 },
  { service: 'Supabase Pro', cost: 20 },
  { service: 'GROQ AI (IVOR)', cost: 50 },
  { service: 'Vercel Pro', cost: 15 },
  { service: 'Domain renewal', cost: 2 },
  { service: 'Contingency', cost: 13 },
];

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
    { id: 'infrastructure', label: 'Infrastructure Costs' },
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
            {/* Monthly Infrastructure */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-amber-600" />
                Monthly Infrastructure Costs
              </h3>
              <div className="space-y-3">
                {MONTHLY_INFRA.map((item) => (
                  <div key={item.service} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-700">{item.service}</span>
                    <span className="text-sm font-medium text-gray-900">{formatGBP(item.cost)}/mo</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 font-semibold">
                  <span className="text-gray-900">Total Monthly</span>
                  <span className="text-gray-900">
                    {formatGBP(MONTHLY_INFRA.reduce((s, i) => s + i.cost, 0))}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>Annual</span>
                  <span>{formatGBP(MONTHLY_INFRA.reduce((s, i) => s + i.cost, 0) * 12)}/yr</span>
                </div>
              </div>
            </div>

            {/* What It Powers */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What £125/month Powers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: 'blkoutuk.com', desc: 'Main website' },
                  { name: 'events.blkoutuk.cloud', desc: 'Events calendar' },
                  { name: 'news.blkoutuk.cloud', desc: 'Community news' },
                  { name: 'comms.blkoutuk.cloud', desc: 'Communications hub' },
                  { name: 'crm.blkoutuk.cloud', desc: 'CRM & governance' },
                  { name: 'ivor.blkoutuk.cloud', desc: 'AI assistant API' },
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
                Plus: Supabase database, IVOR AI responses, health monitoring, automated scrapers, and cron jobs.
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
                  <p className="text-3xl font-bold text-gray-900">20</p>
                  <p className="text-sm text-gray-600 mt-1">members to cover tech costs</p>
                  <p className="text-xs text-gray-400">20 × £75/yr = £1,500</p>
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
