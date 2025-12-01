/**
 * Grant Stat Card Component
 * Displays a single statistic with icon and optional trend
 * Theme: Liberation Teal
 */

import { LucideIcon } from 'lucide-react';

interface GrantStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  variant?: 'default' | 'teal' | 'amber' | 'emerald' | 'red';
}

const variantStyles = {
  default: {
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
  teal: {
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
  },
  amber: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  emerald: {
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  red: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
};

export function GrantStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
}: GrantStatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg ${styles.iconBg}`}>
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${
            trend.positive ? 'text-emerald-600' : 'text-red-600'
          }`}>
            <span className="font-medium">
              {trend.positive ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
