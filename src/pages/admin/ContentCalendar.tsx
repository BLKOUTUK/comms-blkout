
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useCalendarContent, type CalendarContent, deleteScheduledPost } from '@/hooks/useCalendarContent';
import { ChevronLeft, ChevronRight, Image, Clock, Trash2, ExternalLink, Loader2 } from 'lucide-react';
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

const platformLabels: Record<PlatformType, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

const statusColors: Record<string, string> = {
  queued: 'bg-yellow-100 text-yellow-800',
  scheduled: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export function ContentCalendar() {
  const { content, isLoading, error, refetch } = useCalendarContent();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | 'all'>('all');
  const [selectedContent, setSelectedContent] = useState<CalendarContent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const scheduledContent = content.filter(
    (item) => item.scheduledFor && (item.status === 'scheduled' || item.status === 'queued')
  );

  const getContentForDay = (day: Date) => {
    return scheduledContent.filter((item) => {
      const matchesPlatform =
        selectedPlatform === 'all' || item.platforms.includes(selectedPlatform);
      return matchesPlatform && item.scheduledFor && isSameDay(new Date(item.scheduledFor), day);
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled post?')) return;

    setIsDeleting(true);
    const result = await deleteScheduledPost(id);
    setIsDeleting(false);

    if (result.success) {
      setSelectedContent(null);
      refetch();
    } else {
      alert('Failed to delete: ' + result.error);
    }
  };

  // Stats for header
  const totalScheduled = scheduledContent.length;
  const thisMonthScheduled = scheduledContent.filter(
    item => item.scheduledFor && isSameMonth(new Date(item.scheduledFor), currentMonth)
  ).length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Content Calendar</h1>
            <p className="text-gray-600 mt-1">Schedule and manage your content timeline</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-blkout-600">{thisMonthScheduled}</span> posts this month
              <span className="mx-2">•</span>
              <span className="font-semibold text-blkout-600">{totalScheduled}</span> total scheduled
            </div>
            <a href="/admin/editorial" className="btn btn-primary">
              Create Content
            </a>
          </div>
        </div>

        {/* Error/Loading States */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
            <button onClick={refetch} className="ml-2 underline">Retry</button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-blkout-600" size={32} />
            <span className="ml-2 text-gray-600">Loading calendar...</span>
          </div>
        )}

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

        <div className="flex gap-6">
          {/* Calendar Grid */}
          <div className={`card flex-1 ${selectedContent ? 'w-2/3' : 'w-full'}`}>
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
                          onClick={() => setSelectedContent(item)}
                          className={`text-xs p-1.5 bg-gray-50 rounded border-l-2 hover:bg-gray-100 cursor-pointer transition-colors ${
                            selectedContent?.id === item.id ? 'bg-blkout-50 border-blkout-600' : 'border-blkout-500'
                          }`}
                        >
                          <div className="font-medium text-gray-900 truncate">
                            {item.title}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {item.platforms.map((platform) => (
                              <div
                                key={platform}
                                className={`w-2 h-2 rounded-full ${platformColors[platform]}`}
                                title={platformLabels[platform]}
                              />
                            ))}
                            {item.assetUrl && <Image size={10} className="text-gray-400" />}
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

          {/* Selected Content Detail Panel */}
          {selectedContent && (
            <div className="card w-80 h-fit sticky top-4">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Post Details</h3>
                <button
                  onClick={() => setSelectedContent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Asset Preview */}
              {selectedContent.assetUrl && (
                <div className="mb-4">
                  <img
                    src={selectedContent.assetUrl}
                    alt="Content preview"
                    className="w-full rounded-lg object-cover"
                  />
                </div>
              )}

              {/* Status */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedContent.status]}`}>
                  {selectedContent.status.charAt(0).toUpperCase() + selectedContent.status.slice(1)}
                </span>
              </div>

              {/* Title & Body */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900">{selectedContent.title}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-3">{selectedContent.body}</p>
              </div>

              {/* Platforms */}
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-500 mb-2">Platform</div>
                <div className="flex gap-2">
                  {selectedContent.platforms.map((platform) => (
                    <span
                      key={platform}
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white ${platformColors[platform]}`}
                    >
                      {platformLabels[platform]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              {selectedContent.scheduledFor && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 mb-1">Scheduled For</div>
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Clock size={14} />
                    {format(new Date(selectedContent.scheduledFor), 'PPP p')}
                  </div>
                </div>
              )}

              {/* Hashtags */}
              {selectedContent.hashtags && selectedContent.hashtags.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 mb-2">Hashtags</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedContent.hashtags.map((tag, i) => (
                      <span key={i} className="text-xs text-blkout-600">
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Prompt (if AI generated) */}
              {selectedContent.prompt && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 mb-1">Generation Prompt</div>
                  <p className="text-xs text-gray-600 italic line-clamp-2">{selectedContent.prompt}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedContent.assetUrl && (
                  <a
                    href={selectedContent.assetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary text-sm flex-1 flex items-center justify-center gap-1"
                  >
                    <ExternalLink size={14} />
                    View Asset
                  </a>
                )}
                <button
                  onClick={() => handleDelete(selectedContent.id)}
                  disabled={isDeleting}
                  className="btn btn-secondary text-sm text-red-600 hover:bg-red-50 flex items-center gap-1"
                >
                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Platform Legend</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(platformColors).map(([platform, color]) => (
              <div key={platform} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                <span className="text-sm text-gray-700">{platformLabels[platform as PlatformType]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {!isLoading && scheduledContent.length === 0 && (
          <div className="card text-center py-12">
            <Clock size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scheduled Content</h3>
            <p className="text-gray-600 mb-4">
              Get started by creating and scheduling content from the Editorial workflow.
            </p>
            <a href="/admin/editorial" className="btn btn-primary">
              Go to Editorial
            </a>
          </div>
        )}
      </div>
    </Layout>
  );
}
