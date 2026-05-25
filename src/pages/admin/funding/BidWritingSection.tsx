import { FileText } from 'lucide-react';
import { BidProgressCard } from '@/components/grants/BidProgressCard';
import type { BidWritingProgress } from '@/types';

interface Props {
  bidProgress: BidWritingProgress[];
  formatCurrency: (n: number) => string;
}

export function BidWritingSection({ bidProgress, formatCurrency }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Bid Writing Progress</h2>
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
          <h3 className="text-lg font-medium text-slate-700 mb-2">No bids in progress</h3>
          <p className="text-slate-500 mb-4">
            Start writing a bid for one of your grant applications
          </p>
          <button className="btn btn-primary">Start Writing</button>
        </div>
      )}
    </div>
  );
}
