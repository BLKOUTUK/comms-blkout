
import { TrendingUp, FileText, CheckCircle, Clock } from 'lucide-react';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

function StatCard({ icon: Icon, label, value, change, changeType = 'neutral' }: StatCardProps) {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        <div className="bg-blkout-purple bg-opacity-10 p-3 rounded-full">
          <Icon className="h-6 w-6 text-blkout-purple" />
        </div>
      </div>
    </div>
  );
}

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        icon={FileText}
        label="Total Content"
        value={156}
        change="+12% this month"
        changeType="positive"
      />
      <StatCard
        icon={CheckCircle}
        label="Published"
        value={89}
        change="+8% this month"
        changeType="positive"
      />
      <StatCard
        icon={Clock}
        label="Scheduled"
        value={42}
        change="Next 7 days"
        changeType="neutral"
      />
      <StatCard
        icon={TrendingUp}
        label="Engagement Rate"
        value="7.2%"
        change="+1.3% from last month"
        changeType="positive"
      />
    </div>
  );
}
