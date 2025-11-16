
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-blkout-600',
  iconBg = 'bg-blkout-100',
}: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${
              change.trend === 'up' ? 'text-green-600' :
              change.trend === 'down' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {change.trend === 'up' ? '↑' : change.trend === 'down' ? '↓' : '→'} {Math.abs(change.value)}%
              <span className="text-gray-500 ml-1">vs last period</span>
            </p>
          )}
        </div>
        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon size={24} className={iconColor} />
        </div>
      </div>
    </div>
  );
}
