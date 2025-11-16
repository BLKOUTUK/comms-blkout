
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useContent } from '@/hooks/useContent';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import type { PlatformType } from '@/types';

const platformColors: Record<PlatformType, string> = {
  instagram: 'bg-pink-500',
  linkedin: 'bg-blue-500',
  twitter: 'bg-sky-500',
  facebook: 'bg-indigo-500',
  tiktok: 'bg-purple-500',
  youtube: 'bg-red-500',
};

export function ContentCalendar() {
  const { content } = useContent();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | 'all'>('all');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const scheduledContent = content.filter(
    (item) => item.status === 'scheduled' && item.scheduledFor
  );

  const getContentForDay = (day: Date) => {
    return scheduledContent.filter((item) => {
      const matchesPlatform =
        selectedPlatform === 'all' || item.platforms.includes(selectedPlatform);
      return matchesPlatform && item.scheduledFor && isSameDay(new Date(item.scheduledFor), day);
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Content Calendar</h1>
            <p className="text-gray-600 mt-1">Schedule and manage your content timeline</p>
          </div>
          <button className="btn btn-primary">Schedule Content</button>
        </div>

        {/* Calendar Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 min-w-[180px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="btn btn-secondary text-sm"
            >
              Today
            </button>
          </div>

          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value as PlatformType | 'all')}
            className="input min-w-[150px]"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>

        {/* Calendar Grid */}
        <div className="card">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-gray-700 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month start */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[120px]" />
            ))}

            {/* Days of the month */}
            {daysInMonth.map((day) => {
              const dayContent = getContentForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isDayToday = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[120px] border rounded-lg p-2 ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isDayToday ? 'border-blkout-600 border-2' : 'border-gray-200'}`}
                >
                  <div
                    className={`text-sm font-medium mb-2 ${
                      isDayToday
                        ? 'bg-blkout-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                        : 'text-gray-700'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-1">
                    {dayContent.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="text-xs p-1.5 bg-gray-50 rounded border-l-2 border-blkout-500 hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div className="font-medium text-gray-900 truncate">
                          {item.title}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {item.platforms.map((platform) => (
                            <div
                              key={platform}
                              className={`w-2 h-2 rounded-full ${platformColors[platform]}`}
                              title={platform}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    {dayContent.length > 3 && (
                      <div className="text-xs text-gray-500 pl-1.5">
                        +{dayContent.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Platform Legend</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(platformColors).map(([platform, color]) => (
              <div key={platform} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                <span className="text-sm text-gray-700 capitalize">{platform}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
