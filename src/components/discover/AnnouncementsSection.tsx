
import { Megaphone, Calendar, ChevronRight, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Announcement } from '../../types/announcements';
import { fetchPublishedAnnouncements, mockAnnouncements } from '../../services/announcementsService';
import { isSupabaseConfigured } from '../../lib/supabase';

const categoryStyles = {
  event: 'bg-community-trust/10 text-community-trust',
  update: 'bg-community-wisdom/10 text-community-wisdom',
  campaign: 'bg-community-warmth/10 text-community-warmth',
  urgent: 'bg-red-100 text-red-700'
};

const categoryLabels = {
  event: 'Event',
  update: 'Update',
  campaign: 'Campaign',
  urgent: 'Urgent'
};

export function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    setIsLoading(true);
    setError(null);

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.info('Supabase not configured, using mock data');
      setAnnouncements(mockAnnouncements);
      setIsUsingMockData(true);
      setIsLoading(false);
      return;
    }

    // Fetch from Supabase
    const { data, error: fetchError } = await fetchPublishedAnnouncements(10);

    if (fetchError) {
      console.error('Failed to fetch announcements:', fetchError);
      setError(fetchError);
      // Fall back to mock data on error
      setAnnouncements(mockAnnouncements);
      setIsUsingMockData(true);
    } else if (data) {
      setAnnouncements(data);
      setIsUsingMockData(false);
    } else {
      // No data returned, use mock data
      setAnnouncements(mockAnnouncements);
      setIsUsingMockData(true);
    }

    setIsLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-community-warmth to-yellow-500 rounded-xl flex items-center justify-center">
          <Megaphone className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold text-gray-900">
            Community Announcements
          </h2>
          <p className="text-sm text-gray-600">
            Stay connected with our latest news and events
          </p>
        </div>
        {isUsingMockData && (
          <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
            Demo Mode
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="h-8 w-8 text-blkout-600 animate-spin" />
          <p className="text-sm text-gray-500">Loading announcements...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="card border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">
                Unable to load announcements
              </h3>
              <p className="text-sm text-amber-700 mb-3">
                We're having trouble connecting to the database. Showing sample announcements instead.
              </p>
              <button
                onClick={loadAnnouncements}
                className="text-sm text-amber-800 hover:text-amber-900 font-semibold underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {!isLoading && announcements.length > 0 && (
        <div className="space-y-4">
          {announcements.map((announcement, index) => (
            <div
              key={announcement.id}
              className="card hover:shadow-lg transition-all duration-300 group cursor-pointer animate-fade-in border border-gray-100"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryStyles[announcement.category]}`}>
                      {categoryLabels[announcement.category]}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={14} />
                      {new Date(announcement.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-blkout-600 transition-colors">
                    {announcement.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {announcement.excerpt}
                  </p>
                  {announcement.authorName && (
                    <p className="text-xs text-gray-500 mt-2">
                      By {announcement.authorName}
                    </p>
                  )}
                </div>
                <ChevronRight 
                  className="text-gray-400 group-hover:text-blkout-600 group-hover:translate-x-1 transition-all shrink-0" 
                  size={20} 
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && announcements.length === 0 && !error && (
        <div className="card text-center py-12">
          <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">
            No announcements yet
          </h3>
          <p className="text-sm text-gray-600">
            Check back soon for community updates and events!
          </p>
        </div>
      )}

      {/* View All Link */}
      {!isLoading && announcements.length > 0 && (
        <div className="text-center pt-4">
          <button className="text-blkout-600 hover:text-blkout-700 font-semibold text-sm flex items-center gap-2 mx-auto group">
            View all announcements
            <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
