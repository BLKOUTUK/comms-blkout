
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useCalendarContent, type CalendarContent, deleteScheduledPost } from '@/hooks/useCalendarContent';
import { ChevronLeft, ChevronRight, Image, Clock, Trash2, ExternalLink, Loader2, Send, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { createClient } from '@supabase/supabase-js';
import type { PlatformType } from '@/types';

// Initialize Supabase client for social queue
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface QueuedSocialPost {
  id: string;
  platform: string;
  caption: string;
  hashtags: string[];
  scheduled_for: string;
  status: string;
  created_at: string;
}

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

  // Social queue state
  const [socialQueue, setSocialQueue] = useState<QueuedSocialPost[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);

  // Fetch social queue
  useEffect(() => {
    async function fetchSocialQueue() {
      if (!supabase) {
        setQueueLoading(false);
        return;
      }

      try {
        const { data, error: fetchErr } = await supabase
          .from('social_media_queue')
          .select('id, platform, caption, hashtags, scheduled_for, status, created_at')
          .in('status', ['queued', 'scheduled'])
          .gte('scheduled_for', new Date().toISOString())
          .order('scheduled_for', { ascending: true })
          .limit(10);

        if (fetchErr) throw fetchErr;
        setSocialQueue(data || []);
      } catch (err) {
        console.error('Error fetching social queue:', err);
        setQueueError('Failed to load social queue');
      } finally {
        setQueueLoading(false);
      }
    }

    fetchSocialQueue();
  }, []);

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
              aria-label="Previous month"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 min-w-[180px] text-center" aria-live="polite">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="btn btn-secondary text-sm"
              aria-label="Go to today"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="platform-filter" className="sr-only">Filter by platform</label>
            <select
              id="platform-filter"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as PlatformType | 'all')}
              className="input min-w-[150px]"
              aria-label="Filter content by platform"
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
                                role="img"
                                aria-label={platformLabels[platform]}
                              />
                            ))}
                            {item.assetUrl && <Image size={10} className="text-gray-400" aria-label="Has attached image" />}
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
                    alt={`Preview for scheduled post: ${selectedContent.title}`}
                    className="w-full rounded-lg object-cover"
                  />
                </div>
              )}

              {/* Status */}
              <div className="mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedContent.status]}`}
                  role="status"
                >
                  {/* Status icon for color-independent indication */}
                  {selectedContent.status === 'queued' && <span aria-hidden="true">⏳</span>}
                  {selectedContent.status === 'scheduled' && <span aria-hidden="true">📅</span>}
                  {selectedContent.status === 'published' && <span aria-hidden="true">✓</span>}
                  {selectedContent.status === 'failed' && <span aria-hidden="true">✗</span>}
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

        {/* Social Queue Preview */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blkout-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Send className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Social Diary Queue</h3>
                <p className="text-xs text-gray-500">AI-generated posts from events</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {socialQueue.length} posts queued
            </span>
          </div>

          {queueLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="animate-spin text-blkout-600" size={24} />
            </div>
          )}

          {queueError && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg text-sm">
              <AlertCircle size={16} />
              {queueError}
            </div>
          )}

          {!queueLoading && !queueError && socialQueue.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-sm">
              No posts in social queue. Events will be auto-queued when approved.
            </div>
          )}

          {!queueLoading && !queueError && socialQueue.length > 0 && (
            <div className="space-y-3">
              {socialQueue.slice(0, 5).map((post) => (
                <div
                  key={post.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      post.platform === 'linkedin' ? 'bg-blue-600' :
                      post.platform === 'twitter' ? 'bg-sky-500' :
                      post.platform === 'instagram' ? 'bg-pink-500' : 'bg-gray-500'
                    }`}
                    role="img"
                    aria-label={`${post.platform.charAt(0).toUpperCase()}${post.platform.slice(1)} post`}
                    title={post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                  >
                    {post.platform.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-700 capitalize">
                        {post.platform}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${
                          post.status === 'queued' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                        }`}
                        role="status"
                      >
                        {post.status === 'queued' && <span aria-hidden="true">⏳</span>}
                        {post.status === 'scheduled' && <span aria-hidden="true">📅</span>}
                        {post.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 line-clamp-2">{post.caption}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Clock size={12} />
                      {format(new Date(post.scheduled_for), 'MMM d, yyyy h:mm a')}
                    </div>
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {post.hashtags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-xs text-blkout-600">
                            #{tag}
                          </span>
                        ))}
                        {post.hashtags.length > 3 && (
                          <span className="text-xs text-gray-400">+{post.hashtags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {socialQueue.length > 5 && (
                <div className="text-center text-sm text-gray-500 pt-2">
                  +{socialQueue.length - 5} more posts in queue
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="card" role="region" aria-label="Platform color legend">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Platform Legend</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(platformColors).map(([platform, color]) => (
              <div key={platform} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} aria-hidden="true"></div>
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
