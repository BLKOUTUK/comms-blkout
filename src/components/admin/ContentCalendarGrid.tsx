
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import type { ContentWithRelations } from '../../types';

interface ContentCalendarGridProps {
  content: ContentWithRelations[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function ContentCalendarGrid({ content, currentDate, onDateChange }: ContentCalendarGridProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getContentForDay = (day: Date) => {
    return content.filter(item => 
      item.scheduled_for && isSameDay(new Date(item.scheduled_for), day)
    );
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-200 text-gray-700',
    review: 'bg-yellow-200 text-yellow-800',
    approved: 'bg-green-200 text-green-800',
    scheduled: 'bg-blue-200 text-blue-800',
    published: 'bg-purple-200 text-purple-800',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2" />
          Week of {format(weekStart, 'MMM d, yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onDateChange(new Date(currentDate.setDate(currentDate.getDate() - 7)))}
            className="btn-secondary"
          >
            Previous
          </button>
          <button
            onClick={() => onDateChange(new Date())}
            className="btn-secondary"
          >
            Today
          </button>
          <button
            onClick={() => onDateChange(new Date(currentDate.setDate(currentDate.getDate() + 7)))}
            className="btn-secondary"
          >
            Next
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-gray-200">
        {days.map((day) => {
          const dayContent = getContentForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toString()} className="min-h-[200px] p-2">
              {/* Day header */}
              <div className={`text-center mb-2 ${isToday ? 'bg-blkout-purple text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                <div className="text-xs font-medium">
                  {format(day, 'EEE')}
                </div>
                <div className={`text-sm ${isToday ? 'font-bold' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>

              {/* Content items */}
              <div className="space-y-1">
                {dayContent.map((item) => (
                  <div
                    key={item.id}
                    className={`text-xs p-2 rounded ${statusColors[item.status] || 'bg-gray-100'} cursor-pointer hover:opacity-80 transition-opacity`}
                  >
                    <div className="font-medium truncate">{item.title}</div>
                    <div className="text-xs opacity-75 truncate">
                      {item.platform?.display_name}
                    </div>
                  </div>
                ))}
                
                {/* Add button */}
                <button className="w-full p-2 border-2 border-dashed border-gray-300 rounded hover:border-blkout-purple hover:bg-purple-50 transition-colors flex items-center justify-center text-gray-400 hover:text-blkout-purple">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
