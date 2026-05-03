import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, ExternalLink, Sparkles } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface FeaturedEvent {
  id: string;
  title: string;
  date: string;
  start_time?: string;
  location?: string;
  organizer?: string;
  url?: string;
  cost?: string;
  tags?: string[];
}

// Fallback events if API fails
const FALLBACK_EVENTS: FeaturedEvent[] = [
  {
    id: 'fallback-1',
    title: 'BLKOUT Community Meetup',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    location: 'London',
    organizer: 'BLKOUT UK',
    cost: 'Free',
    url: 'https://events.blkoutuk.com'
  }
];

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return '';
  // Handle both "18:30:00" and "18:30" formats
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

export function FeaturedEventsWidget() {
  const [events, setEvents] = useState<FeaturedEvent[]>(FALLBACK_EVENTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeaturedEvents() {
      if (!isSupabaseConfigured()) {
        console.log('Supabase not configured, using fallback events');
        setIsLoading(false);
        return;
      }

      try {
        // Get current date and end of next week
        const now = new Date();
        const endOfNextWeek = new Date(now);
        endOfNextWeek.setDate(now.getDate() + 14);

        // Fetch approved upcoming events
        const { data, error: fetchError } = await supabase
          .from('events')
          .select('id, title, date, start_time, location, organizer, url, cost, tags, relevance_score')
          .eq('status', 'approved')
          .gte('date', now.toISOString().split('T')[0])
          .lte('date', endOfNextWeek.toISOString().split('T')[0])
          .order('date', { ascending: true })
          .order('relevance_score', { ascending: false })
          .limit(10);

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          // Group by week and take top 2 per week
          const thisWeek = getWeekNumber(now);
          const eventsThisWeek: FeaturedEvent[] = [];
          const eventsNextWeek: FeaturedEvent[] = [];

          for (const event of data) {
            const eventWeek = getWeekNumber(new Date(event.date));
            if (eventWeek === thisWeek && eventsThisWeek.length < 2) {
              eventsThisWeek.push(event);
            } else if (eventWeek === thisWeek + 1 && eventsNextWeek.length < 2) {
              eventsNextWeek.push(event);
            }
          }

          // Combine: prioritize this week, fill with next week
          const featured = [...eventsThisWeek, ...eventsNextWeek].slice(0, 2);

          if (featured.length > 0) {
            setEvents(featured);
          }
        }
      } catch (err) {
        console.error('Error fetching featured events:', err);
        setError('Unable to load events');
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeaturedEvents();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white">
              Featured Events
            </h2>
            <p className="text-sm text-gray-400 font-disrupt italic">
              upcoming community gatherings
            </p>
          </div>
        </div>
        <a
          href="https://events.blkoutuk.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-liberation-gold-divine hover:text-liberation-gold-rich font-bold uppercase tracking-wider text-sm flex items-center gap-1 group"
        >
          View all events
          <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
              <div className="h-6 bg-white/10 rounded w-3/4 mb-4" />
              <div className="h-4 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center">
          <p className="text-amber-200">{error}</p>
          <a
            href="https://events.blkoutuk.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-300 hover:text-amber-200 font-medium text-sm mt-2 inline-block"
          >
            Browse events directly →
          </a>
        </div>
      )}

      {/* Events Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <a
              key={event.id}
              href={event.url || 'https://events.blkoutuk.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden bg-white/5 border border-liberation-gold-divine/20 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 hover:border-liberation-gold-divine/50 transition-all duration-300"
            >
              {/* Date badge */}
              <div className="absolute top-4 right-4 bg-liberation-gold-divine text-black text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                {formatEventDate(event.date)}
              </div>

              {/* Content */}
              <div className="pr-24">
                {event.organizer && (
                  <p className="text-xs font-medium text-liberation-gold-divine mb-1 flex items-center gap-1 uppercase tracking-wider">
                    <Sparkles size={12} />
                    {event.organizer}
                  </p>
                )}

                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-liberation-gold-divine transition-colors line-clamp-2">
                  {event.title}
                </h3>

                <div className="space-y-1.5 text-sm text-gray-400">
                  {event.start_time && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-500" />
                      <span>{formatTime(event.start_time)}</span>
                    </div>
                  )}

                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-500" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>

                {/* Cost badge */}
                {event.cost && (
                  <span className={`inline-block mt-3 text-xs font-semibold px-2 py-1 rounded-full ${
                    event.cost.toLowerCase() === 'free'
                      ? 'bg-green-500/15 text-green-300 border border-green-500/30'
                      : 'bg-white/10 text-gray-300 border border-white/20'
                  }`}>
                    {event.cost}
                  </span>
                )}
              </div>

              {/* Hover arrow */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink size={18} className="text-liberation-gold-divine" />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* CTA Banner */}
      <div className="bg-white/5 border border-liberation-gold-divine/20 rounded-xl p-6 text-center backdrop-blur-sm">
        <p className="text-gray-300 mb-3">
          Discover more events for the Black LGBTQ+ community
        </p>
        <a
          href="https://events.blkoutuk.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blkout-600 to-purple-600 text-white font-bold py-2.5 px-6 rounded-lg hover:from-blkout-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <Calendar size={18} />
          Browse Full Calendar
        </a>
      </div>
    </div>
  );
}
