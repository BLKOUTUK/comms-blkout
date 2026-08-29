
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

interface Opening {
  id: string;
  title: string;
  organisation: string | null;
  kind: string | null;
  beat: string | null;
  summary: string | null;
  open_to: string | null;
  pay: string | null;
  location: string | null;
  url: string | null;
  deadline: string | null;
  found_by: string | null;
  status: string;
  source: string | null;
  submitted_at: string;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type ContentType = 'events' | 'openings';

// The events-calendar app owns the openings table and its moderation API —
// both endpoints accept any valid Supabase session bearer token (same auth
// project), so this reuses proven, already-working infrastructure instead of
// re-deriving RLS access to a third table from scratch.
const EVENTS_CALENDAR_API = 'https://events.blkoutuk.com';

export function EventModeration() {
  const [contentType, setContentType] = useState<ContentType>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [openings, setOpenings] = useState<Opening[]>([]);
  const [openingsLoading, setOpeningsLoading] = useState(true);
  const [openingsError, setOpeningsError] = useState<string | null>(null);
  const [expandedOpening, setExpandedOpening] = useState<string | null>(null);
  const [openingActionLoading, setOpeningActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (contentType === 'events') {
      fetchEvents();
    } else {
      fetchOpenings();
    }
  }, [contentType, statusFilter]);

  // Fetch the openings count once on mount too, so the tab badge is accurate
  // before the tab has ever been clicked.
  useEffect(() => {
    fetchOpenings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const fetchOpenings = async () => {
    setOpeningsLoading(true);
    setOpeningsError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setOpeningsError('Sign in required');
        setOpenings([]);
        return;
      }

      const response = await fetch(`${EVENTS_CALENDAR_API}/api/pending-openings`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch openings');
      }

      setOpenings(result.openings || []);
    } catch (err) {
      setOpeningsError(err instanceof Error ? err.message : 'Failed to fetch openings');
    } finally {
      setOpeningsLoading(false);
    }
  };

  const updateOpeningStatus = async (openingId: string, action: 'approve' | 'reject') => {
    setOpeningActionLoading(openingId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sign in required');

      const response = await fetch(`${EVENTS_CALENDAR_API}/api/moderate-opening`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id: openingId, action }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update opening');
      }

      // The moderation queue only ever lists pending items — once acted on,
      // it drops out of this view (mirrors events-calendar's own dashboard).
      setOpenings(prev => prev.filter(o => o.id !== openingId));
    } catch (err) {
      alert(`Failed to update opening: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOpeningActionLoading(null);
    }
  };

  const formatDeadline = (dateStr: string | null) => {
    if (!dateStr) return 'Rolling';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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
            <p className="text-gray-600 mt-1">
              {contentType === 'events' ? 'Review and approve community events' : 'Review and approve openings — jobs, commissions, bursaries, funds'}
            </p>
          </div>
          <button
            onClick={contentType === 'events' ? fetchEvents : fetchOpenings}
            className="btn-secondary flex items-center gap-2"
            disabled={contentType === 'events' ? isLoading : openingsLoading}
          >
            {(contentType === 'events' ? isLoading : openingsLoading)
              ? <Loader2 className="animate-spin" size={16} />
              : <Filter size={16} />}
            Refresh
          </button>
        </div>

        {/* Content Type Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {([
            { key: 'events' as ContentType, label: 'Events' },
            { key: 'openings' as ContentType, label: `Openings (${openings.length})` },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setContentType(key)}
              className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
                contentType === key
                  ? 'border-blkout-600 text-blkout-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {contentType === 'events' && (
        <>
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
        </>
        )}

        {contentType === 'openings' && (
        <>
        {/* Error Message */}
        {openingsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-700">{openingsError}</p>
          </div>
        )}

        {/* Openings List — the queue only ever holds pending items; there is
            no approved/rejected browse view here (matches events-calendar's
            own moderation dashboard, which this reuses). */}
        {openingsLoading ? (
          <div className="text-center py-12">
            <Loader2 className="animate-spin mx-auto mb-4" size={48} />
            <p className="text-gray-600">Loading openings...</p>
          </div>
        ) : openings.length === 0 ? (
          <div className="text-center py-12 card">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No openings waiting</p>
            <p className="text-gray-500 text-sm mt-2">The queue is empty — nothing pending review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {openings.map((opening) => (
              <div
                key={opening.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                        PENDING
                      </span>
                      {opening.kind && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blkout-100 text-blkout-700">
                          {opening.kind.toUpperCase()}
                        </span>
                      )}
                      {opening.source && (
                        <span className="text-xs text-gray-500">Source: {opening.source}</span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{opening.title}</h3>
                    {opening.organisation && (
                      <p className="text-sm text-gray-600">{opening.organisation}</p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {opening.deadline ? `Closes ${formatDeadline(opening.deadline)}` : 'Rolling'}
                      </span>
                      {opening.pay && (
                        <span className="flex items-center gap-1">
                          {opening.pay}
                        </span>
                      )}
                      {opening.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {opening.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setExpandedOpening(expandedOpening === opening.id ? null : opening.id)}
                      className="p-2 text-gray-500 hover:text-blkout-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye size={20} />
                    </button>
                    {opening.url && (
                      <a
                        href={opening.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-blkout-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Open original"
                      >
                        <ExternalLink size={20} />
                      </a>
                    )}
                    <button
                      onClick={() => updateOpeningStatus(opening.id, 'approve')}
                      disabled={openingActionLoading === opening.id}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Approve"
                    >
                      {openingActionLoading === opening.id ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <Check size={20} />
                      )}
                    </button>
                    <button
                      onClick={() => updateOpeningStatus(opening.id, 'reject')}
                      disabled={openingActionLoading === opening.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Reject"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOpening === opening.id && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {opening.summary && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-1">Summary</h4>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{opening.summary}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {opening.open_to && (
                        <div className="col-span-2 md:col-span-4">
                          <span className="text-gray-500">Open to:</span>
                          <p className="font-medium">{opening.open_to}</p>
                        </div>
                      )}
                      {opening.beat && (
                        <div>
                          <span className="text-gray-500">Beat:</span>
                          <p className="font-medium">{opening.beat}</p>
                        </div>
                      )}
                      {opening.found_by && (
                        <div>
                          <span className="text-gray-500">Found by:</span>
                          <p className="font-medium">{opening.found_by}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </div>
    </Layout>
  );
}
