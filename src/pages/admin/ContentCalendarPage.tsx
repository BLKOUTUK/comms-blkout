
import { useState } from 'react';
import { ContentCalendarGrid } from '../../components/admin/ContentCalendarGrid';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { useContent } from '../../hooks/useContent';

export function ContentCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { content, loading, error } = useContent({
    status: ['scheduled', 'approved'],
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Content Calendar</h1>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-red-600">Error loading calendar: {error.message}</p>
        </div>
      ) : (
        <ContentCalendarGrid
          content={content}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />
      )}
    </div>
  );
}
