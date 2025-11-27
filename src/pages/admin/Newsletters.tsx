
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useNewsletter, SubscriberTier, NewsletterEdition } from '@/hooks/useNewsletter';
import { useAgentIntelligence } from '@/hooks/useAgentIntelligence';
import {
  Mail,
  Users,
  FileText,
  Send,
  Plus,
  Clock,
  CheckCircle,
  Eye,
  Copy,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

type ViewMode = 'list' | 'compose';

export function Newsletters() {
  const {
    editions,
    subscriberCounts,
    draftEditions,
    sentEditions,
    isLoading,
    createEdition,
  } = useNewsletter();
  const { highPriorityIntel } = useAgentIntelligence('herald');

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [_selectedEdition, setSelectedEdition] = useState<NewsletterEdition | null>(null);
  const [newEditionTier, setNewEditionTier] = useState<SubscriberTier>('weekly_engaged');
  const [newSubject, setNewSubject] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateEdition = async () => {
    if (!newSubject.trim()) return;

    const result = await createEdition(newEditionTier, newSubject);
    if (result.success && result.edition) {
      setSelectedEdition(result.edition);
      setViewMode('compose');
      setShowCreateModal(false);
      setNewSubject('');
    }
  };

  const handleCopyHtml = (html: string) => {
    navigator.clipboard.writeText(html);
    alert('HTML copied to clipboard! Paste into SendFox to send.');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-yellow-100 text-yellow-700',
      scheduled: 'bg-blue-100 text-blue-700',
      sent: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.draft}`}>
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blkout-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Newsletters</h1>
            <p className="text-gray-600 mt-1">
              Create and manage community newsletters with Herald agent
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus size={18} />
            New Edition
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Weekly Subscribers</p>
                <p className="text-3xl font-bold text-blkout-600">{subscriberCounts.weeklyEngaged}</p>
              </div>
              <Users className="text-blkout-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Circle</p>
                <p className="text-3xl font-bold text-purple-600">{subscriberCounts.monthlyCircle}</p>
              </div>
              <Mail className="text-purple-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Draft Editions</p>
                <p className="text-3xl font-bold text-yellow-600">{draftEditions.length}</p>
              </div>
              <FileText className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Sent This Month</p>
                <p className="text-3xl font-bold text-green-600">{sentEditions.length}</p>
              </div>
              <Send className="text-green-600" size={32} />
            </div>
          </div>
        </div>

        {/* Intelligence Suggestions */}
        {highPriorityIntel.length > 0 && (
          <div className="card border-l-4 border-yellow-500 bg-yellow-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb size={20} className="text-yellow-600" />
              Content Suggestions from IVOR
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {highPriorityIntel.slice(0, 4).map((intel) => (
                <div key={intel.id} className="bg-white rounded-lg p-3 border border-yellow-200">
                  <p className="text-sm font-medium text-gray-900 mb-2">{intel.summary}</p>
                  <div className="flex flex-wrap gap-1">
                    {intel.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Editions List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Newsletter Editions</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded text-sm ${
                  viewMode === 'list' ? 'bg-blkout-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                All Editions
              </button>
            </div>
          </div>

          {editions.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No newsletters yet</h3>
              <p className="text-gray-600 mb-4">Create your first newsletter edition to get started.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <Plus size={18} />
                Create First Edition
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {editions.map((edition) => (
                <div
                  key={edition.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blkout-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-500">
                          #{edition.editionNumber}
                        </span>
                        {getStatusBadge(edition.status)}
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          edition.subscriberTier === 'weekly_engaged'
                            ? 'bg-blkout-100 text-blkout-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {edition.subscriberTier === 'weekly_engaged' ? 'Weekly' : 'Monthly'}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{edition.subject}</h3>
                      {edition.preheaderText && (
                        <p className="text-sm text-gray-600 mb-2">{edition.preheaderText}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDistanceToNow(edition.createdAt, { addSuffix: true })}
                        </span>
                        <span>{edition.contentItems.length} content blocks</span>
                        {edition.sentAt && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle size={12} />
                            Sent {format(edition.sentAt, 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedEdition(edition);
                          setViewMode('compose');
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        <Eye size={14} />
                        Edit
                      </button>
                      {edition.htmlContent && (
                        <button
                          onClick={() => handleCopyHtml(edition.htmlContent!)}
                          className="btn btn-outline btn-sm"
                        >
                          <Copy size={14} />
                          Copy HTML
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Performance metrics for sent editions */}
                  {edition.status === 'sent' && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-6 text-sm">
                      <div>
                        <span className="text-gray-500">Open Rate:</span>{' '}
                        <span className="font-medium">
                          {edition.openRate ? `${(edition.openRate * 100).toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Click Rate:</span>{' '}
                        <span className="font-medium">
                          {edition.clickRate ? `${(edition.clickRate * 100).toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Unsubscribes:</span>{' '}
                        <span className="font-medium">{edition.unsubscribes}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SendFox Integration Note */}
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <ExternalLink className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">SendFox Integration</h3>
              <p className="text-sm text-gray-700">
                Newsletters are composed here, then the HTML is copied to SendFox for delivery.
                SendFox's API doesn't support programmatic campaign sending, so the final send
                step is done through their web dashboard.
              </p>
              <a
                href="https://sendfox.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
              >
                Open SendFox Dashboard
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Create Edition Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Edition</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Newsletter Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewEditionTier('weekly_engaged')}
                    className={`flex-1 p-3 rounded-lg border text-left ${
                      newEditionTier === 'weekly_engaged'
                        ? 'border-blkout-600 bg-blkout-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-gray-900">Weekly Update</div>
                    <div className="text-xs text-gray-600">For engaged members</div>
                  </button>
                  <button
                    onClick={() => setNewEditionTier('monthly_circle')}
                    className={`flex-1 p-3 rounded-lg border text-left ${
                      newEditionTier === 'monthly_circle'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-gray-900">Monthly Digest</div>
                    <div className="text-xs text-gray-600">For wider community</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder={
                    newEditionTier === 'weekly_engaged'
                      ? 'This Week at BLKOUT: ...'
                      : 'BLKOUT Monthly: ...'
                  }
                  className="input w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEdition}
                disabled={!newSubject.trim()}
                className="btn btn-primary"
              >
                Create Edition
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
