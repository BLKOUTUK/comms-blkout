
import { useMemo } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Mail, MousePointerClick,
  UserMinus, Eye, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import type { NewsletterEdition } from '@/hooks/useNewsletter';

interface PerformanceAnalyticsProps {
  editions: NewsletterEdition[];
  compact?: boolean;
}

// Industry benchmarks for comparison
const INDUSTRY_BENCHMARKS = {
  openRate: 21.5, // Average for nonprofits
  clickRate: 2.7, // Average for nonprofits
  unsubscribeRate: 0.2, // Industry average
};

export function PerformanceAnalytics({ editions, compact = false }: PerformanceAnalyticsProps) {
  // Filter to only sent editions with performance data
  const sentEditions = useMemo(() =>
    editions.filter(e => e.status === 'sent' && e.sentAt),
    [editions]
  );

  // Calculate aggregate metrics
  const metrics = useMemo(() => {
    if (sentEditions.length === 0) {
      return {
        totalSent: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
        totalUnsubscribes: 0,
        trend: { openRate: 0, clickRate: 0 },
        bestPerforming: null as NewsletterEdition | null,
        recentPerformance: [] as { edition: NewsletterEdition; openRate: number; clickRate: number }[],
      };
    }

    const withMetrics = sentEditions.filter(e => e.openRate !== null || e.clickRate !== null);

    const totalOpenRate = withMetrics.reduce((sum, e) => sum + (e.openRate || 0), 0);
    const totalClickRate = withMetrics.reduce((sum, e) => sum + (e.clickRate || 0), 0);
    const totalUnsubscribes = sentEditions.reduce((sum, e) => sum + (e.unsubscribes || 0), 0);

    // Calculate trend (compare last 3 vs previous 3)
    const recentThree = withMetrics.slice(0, 3);
    const previousThree = withMetrics.slice(3, 6);

    const recentAvgOpen = recentThree.length > 0
      ? recentThree.reduce((sum, e) => sum + (e.openRate || 0), 0) / recentThree.length
      : 0;
    const previousAvgOpen = previousThree.length > 0
      ? previousThree.reduce((sum, e) => sum + (e.openRate || 0), 0) / previousThree.length
      : recentAvgOpen;

    const recentAvgClick = recentThree.length > 0
      ? recentThree.reduce((sum, e) => sum + (e.clickRate || 0), 0) / recentThree.length
      : 0;
    const previousAvgClick = previousThree.length > 0
      ? previousThree.reduce((sum, e) => sum + (e.clickRate || 0), 0) / previousThree.length
      : recentAvgClick;

    // Find best performing
    const bestPerforming = withMetrics.length > 0
      ? withMetrics.reduce((best, e) =>
          ((e.openRate || 0) + (e.clickRate || 0)) > ((best.openRate || 0) + (best.clickRate || 0)) ? e : best
        )
      : null;

    return {
      totalSent: sentEditions.length,
      avgOpenRate: withMetrics.length > 0 ? totalOpenRate / withMetrics.length : 0,
      avgClickRate: withMetrics.length > 0 ? totalClickRate / withMetrics.length : 0,
      totalUnsubscribes,
      trend: {
        openRate: previousAvgOpen > 0 ? ((recentAvgOpen - previousAvgOpen) / previousAvgOpen) * 100 : 0,
        clickRate: previousAvgClick > 0 ? ((recentAvgClick - previousAvgClick) / previousAvgClick) * 100 : 0,
      },
      bestPerforming,
      recentPerformance: recentThree.map(e => ({
        edition: e,
        openRate: e.openRate || 0,
        clickRate: e.clickRate || 0,
      })),
    };
  }, [sentEditions]);

  // Helper for comparison to benchmark
  const getBenchmarkComparison = (value: number, benchmark: number) => {
    const diff = value - benchmark;
    const percentage = benchmark > 0 ? (diff / benchmark) * 100 : 0;
    return { diff, percentage, isAbove: diff > 0 };
  };

  if (compact) {
    return (
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-blue-500" />
          <span className="text-gray-600">Open Rate:</span>
          <span className="font-semibold">{metrics.avgOpenRate.toFixed(1)}%</span>
          {metrics.trend.openRate !== 0 && (
            <span className={`flex items-center text-xs ${
              metrics.trend.openRate > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.trend.openRate > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(metrics.trend.openRate).toFixed(1)}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <MousePointerClick size={16} className="text-purple-500" />
          <span className="text-gray-600">Click Rate:</span>
          <span className="font-semibold">{metrics.avgClickRate.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-gray-500" />
          <span className="text-gray-600">{metrics.totalSent} sent</span>
        </div>
      </div>
    );
  }

  const openComparison = getBenchmarkComparison(metrics.avgOpenRate, INDUSTRY_BENCHMARKS.openRate);
  const clickComparison = getBenchmarkComparison(metrics.avgClickRate, INDUSTRY_BENCHMARKS.clickRate);

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Open Rate */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Open Rate</span>
            <Eye size={18} className="text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {metrics.avgOpenRate.toFixed(1)}%
            </span>
            {metrics.trend.openRate !== 0 && (
              <span className={`flex items-center text-sm ${
                metrics.trend.openRate > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metrics.trend.openRate > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(metrics.trend.openRate).toFixed(1)}%
              </span>
            )}
          </div>
          <div className={`text-xs mt-2 ${openComparison.isAbove ? 'text-green-600' : 'text-amber-600'}`}>
            {openComparison.isAbove ? 'Above' : 'Below'} industry avg ({INDUSTRY_BENCHMARKS.openRate}%)
          </div>
        </div>

        {/* Click Rate */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Click Rate</span>
            <MousePointerClick size={18} className="text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {metrics.avgClickRate.toFixed(1)}%
            </span>
            {metrics.trend.clickRate !== 0 && (
              <span className={`flex items-center text-sm ${
                metrics.trend.clickRate > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metrics.trend.clickRate > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(metrics.trend.clickRate).toFixed(1)}%
              </span>
            )}
          </div>
          <div className={`text-xs mt-2 ${clickComparison.isAbove ? 'text-green-600' : 'text-amber-600'}`}>
            {clickComparison.isAbove ? 'Above' : 'Below'} industry avg ({INDUSTRY_BENCHMARKS.clickRate}%)
          </div>
        </div>

        {/* Total Sent */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Newsletters Sent</span>
            <Mail size={18} className="text-blkout-500" />
          </div>
          <span className="text-3xl font-bold text-gray-900">
            {metrics.totalSent}
          </span>
          <div className="text-xs text-gray-500 mt-2">
            All time
          </div>
        </div>

        {/* Unsubscribes */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Unsubscribes</span>
            <UserMinus size={18} className="text-red-500" />
          </div>
          <span className="text-3xl font-bold text-gray-900">
            {metrics.totalUnsubscribes}
          </span>
          <div className="text-xs text-gray-500 mt-2">
            Total across all editions
          </div>
        </div>
      </div>

      {/* Recent Performance */}
      {metrics.recentPerformance.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-blkout-600" />
            Recent Performance
          </h3>
          <div className="space-y-3">
            {metrics.recentPerformance.map(({ edition, openRate, clickRate }) => (
              <div
                key={edition.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{edition.subject}</p>
                  <p className="text-xs text-gray-500">
                    #{edition.editionNumber} • {edition.subscriberTier === 'weekly_engaged' ? 'Weekly' : 'Monthly'}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-blue-600">{openRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">Opens</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-purple-600">{clickRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">Clicks</p>
                  </div>
                  {/* Visual bar */}
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${Math.min(openRate * 2, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Performing */}
      {metrics.bestPerforming && (
        <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp size={24} className="text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-green-800 mb-1">Best Performing Newsletter</h4>
              <p className="text-gray-900 font-medium">{metrics.bestPerforming.subject}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-green-700">
                  <Eye size={14} className="inline mr-1" />
                  {(metrics.bestPerforming.openRate || 0).toFixed(1)}% open rate
                </span>
                <span className="text-green-700">
                  <MousePointerClick size={14} className="inline mr-1" />
                  {(metrics.bestPerforming.clickRate || 0).toFixed(1)}% click rate
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {sentEditions.length === 0 && (
        <div className="card text-center py-12">
          <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Yet</h3>
          <p className="text-gray-500">
            Performance data will appear here after you send your first newsletter.
          </p>
        </div>
      )}
    </div>
  );
}

// Mini stat display for dashboard
export function PerformanceStatBadge({
  openRate,
  clickRate,
}: {
  openRate: number | null;
  clickRate: number | null;
}) {
  if (openRate === null && clickRate === null) {
    return (
      <span className="text-xs text-gray-400">No data</span>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      {openRate !== null && (
        <span className="flex items-center gap-1 text-blue-600">
          <Eye size={12} />
          {openRate.toFixed(1)}%
        </span>
      )}
      {clickRate !== null && (
        <span className="flex items-center gap-1 text-purple-600">
          <MousePointerClick size={12} />
          {clickRate.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
