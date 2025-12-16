
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Calendar,
  MapPin,
  Clock,
  User,
  Check,
  X,
  Eye,
  ExternalLink,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  virtual_link: string | null;
  organizer: string | null;
  organizer_id: string | null;
  cost: string | null;
  registration_required: boolean | null;
  capacity: number | null;
  status: string;
  source: string | null;
  tags: string[] | null;
  url: string | null;
  created_at: string;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export function EventModeration() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  const fetchEvents = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase not configured');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  };

  const updateEventStatus = async (eventId: string, newStatus: 'approved' | 'rejected') => {
    setActionLoading(eventId);
    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', eventId);

      if (updateError) throw updateError;

      // Update local state
      setEvents(prev => prev.map(event =>
        event.id === eventId ? { ...event, status: newStatus } : event
      ));
    } catch (err) {
      alert(`Failed to update event: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const statusCounts = {
    all: events.length,
    pending: events.filter(e => e.status === 'pending').length,
    approved: events.filter(e => e.status === 'approved').length,
    rejected: events.filter(e => e.status === 'rejected').length,
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    // Handle both ISO datetime and time-only formats
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return timeStr;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Event Moderation</h1>
            <p className="text-gray-600 mt-1">Review and approve community events</p>
          </div>
          <button
            onClick={fetchEvents}
            className="btn-secondary flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Filter size={16} />}
            Refresh
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === status
                  ? 'bg-blkout-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Events List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="animate-spin mx-auto mb-4" size={48} />
            <p className="text-gray-600">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 card">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No events found</p>
            <p className="text-gray-500 text-sm mt-2">
              {statusFilter !== 'all'
                ? `No events with status: ${statusFilter}`
                : 'No events in the system'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Event Header */}
                <div className="p-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        event.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        event.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {event.status.toUpperCase()}
                      </span>
                      {event.source && (
                        <span className="text-xs text-gray-500">Source: {event.source}</span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>

                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(event.date)}
                      </span>
                      {(event.start_time || event.end_time) && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatTime(event.start_time)}
                          {event.end_time && ` - ${formatTime(event.end_time)}`}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {event.location}
                        </span>
                      )}
                      {event.organizer && (
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {event.organizer}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                      className="p-2 text-gray-500 hover:text-blkout-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye size={20} />
                    </button>
                    {event.url && (
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-blkout-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Open original"
                      >
                        <ExternalLink size={20} />
                      </a>
                    )}
                    {event.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateEventStatus(event.id, 'approved')}
                          disabled={actionLoading === event.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          {actionLoading === event.id ? (
                            <Loader2 className="animate-spin" size={20} />
                          ) : (
                            <Check size={20} />
                          )}
                        </button>
                        <button
                          onClick={() => updateEventStatus(event.id, 'rejected')}
                          disabled={actionLoading === event.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <X size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedEvent === event.id && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {event.description && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-1">Description</h4>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{event.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {event.cost && (
                        <div>
                          <span className="text-gray-500">Cost:</span>
                          <p className="font-medium">{event.cost}</p>
                        </div>
                      )}
                      {event.capacity && (
                        <div>
                          <span className="text-gray-500">Capacity:</span>
                          <p className="font-medium">{event.capacity}</p>
                        </div>
                      )}
                      {event.registration_required !== null && (
                        <div>
                          <span className="text-gray-500">Registration:</span>
                          <p className="font-medium">{event.registration_required ? 'Required' : 'Not required'}</p>
                        </div>
                      )}
                      {event.virtual_link && (
                        <div>
                          <span className="text-gray-500">Virtual Link:</span>
                          <a href={event.virtual_link} target="_blank" rel="noopener noreferrer"
                            className="text-blkout-600 hover:underline block truncate">
                            {event.virtual_link}
                          </a>
                        </div>
                      )}
                    </div>
                    {event.tags && event.tags.length > 0 && (
                      <div className="mt-4">
                        <span className="text-gray-500 text-sm">Tags:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {event.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blkout-100 text-blkout-700 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
