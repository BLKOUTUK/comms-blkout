
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useNewsletter, SubscriberTier, NewsletterEdition } from '@/hooks/useNewsletter';
import { useAgentIntelligence } from '@/hooks/useAgentIntelligence';
import { useSendFoxStatus } from '@/hooks/useSendFoxStatus';
import { SendFoxStatusPanel } from '@/components/integrations/SendFoxStatusPanel';
import { SegmentSelector } from '@/components/newsletters/SegmentSelector';
import { ContentEditor } from '@/components/newsletters/ContentEditor';
import { SchedulePublisher, ScheduleBadge } from '@/components/newsletters/SchedulePublisher';
import { PerformanceAnalytics, PerformanceStatBadge } from '@/components/newsletters/PerformanceAnalytics';
import { TemplateLibrary, TemplateQuickSelect, NewsletterTemplate } from '@/components/newsletters/TemplateLibrary';
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
  Sparkles,
  Download,
  RefreshCw,
  Pen,
  MessageSquare,
  Archive,
  Filter,
  XCircle,
  Edit3,
  Calendar,
  BookTemplate,
  X,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

type FilterMode = 'all' | 'drafts' | 'archive';

export function Newsletters() {
  const {
    editions,
    subscriberCounts,
    draftEditions,
    sentEditions,
    isLoading,
    createEdition,
    updateEdition,
    refetch: refetchEditions,
  } = useNewsletter();
  const { highPriorityIntel } = useAgentIntelligence('herald');
  const { isConnected: sendFoxConnected, isLoading: sendFoxLoading, totalSubscribers: sendFoxSubscribers } = useSendFoxStatus();

  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [showSendFoxPanel, setShowSendFoxPanel] = useState(false);
  const [_selectedEdition, setSelectedEdition] = useState<NewsletterEdition | null>(null);
  const [newEditionTier, setNewEditionTier] = useState<SubscriberTier>('weekly_engaged');
  const [newSubject, setNewSubject] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showEditorialModal, setShowEditorialModal] = useState<string | null>(null);
  const [editorialTopic, setEditorialTopic] = useState('');
  const [editorialTakeaway, setEditorialTakeaway] = useState('');
  const [isSubmittingEditorial, setIsSubmittingEditorial] = useState(false);
  const [showSendFoxModal, setShowSendFoxModal] = useState<{
    editionId: string;
    editionType: 'weekly' | 'monthly';
  } | null>(null);
  const [sendFoxSelectedLists, setSendFoxSelectedLists] = useState<number[]>([]);
  const [isSendingToSendFox, setIsSendingToSendFox] = useState(false);
  const [editingEdition, setEditingEdition] = useState<NewsletterEdition | null>(null);
  const [schedulingEdition, setSchedulingEdition] = useState<NewsletterEdition | null>(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NewsletterTemplate | null>(null);
  const [sendFoxResult, setSendFoxResult] = useState<{
    success: boolean;
    html_content?: string;
    subject_line?: string;
    sendfox_campaign_url?: string;
  } | null>(null);

  // Generate newsletter content with Herald API
  const handleGenerateContent = async (editionId: string, editionType: 'weekly' | 'monthly') => {
    setIsGenerating(editionId);
    setGenerationError(null);

    try {
      const response = await fetch('/api/herald/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edition_id: editionId,
          edition_type: editionType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      // Refresh editions list
      window.location.reload();
    } catch (error) {
      console.error('Generation error:', error);
      setGenerationError(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(null);
    }
  };

  // Preview newsletter HTML
  const handlePreview = (editionId: string) => {
    window.open(`/api/herald/generate?action=preview&id=${editionId}`, '_blank');
  };

  // Export newsletter
  const handleExport = (editionId: string, format: 'html' | 'json' | 'text') => {
    window.open(`/api/herald/generate?action=export&id=${editionId}&format=${format}`, '_blank');
  };

  // Submit editorial note
  const handleSubmitEditorial = async () => {
    if (!showEditorialModal || !editorialTopic.trim()) return;

    setIsSubmittingEditorial(true);
    try {
      const response = await fetch('/api/herald/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_editorial',
          edition_id: showEditorialModal,
          topic: editorialTopic,
          key_takeaway: editorialTakeaway
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit editorial');
      }

      // Close modal and refresh
      setShowEditorialModal(null);
      setEditorialTopic('');
      setEditorialTakeaway('');
      window.location.reload();
    } catch (error) {
      console.error('Editorial error:', error);
      setGenerationError(error instanceof Error ? error.message : 'Editorial submission failed');
    } finally {
      setIsSubmittingEditorial(false);
    }
  };

  // Get SendFox lists for segment selector
  const { lists: sendFoxLists } = useSendFoxStatus();

  // Open SendFox modal with segment selection
  const handleOpenSendFoxModal = (editionId: string, editionType: 'weekly' | 'monthly') => {
    setShowSendFoxModal({ editionId, editionType });
    setSendFoxResult(null);
    // Set default list based on edition type
    if (editionType === 'weekly') {
      setSendFoxSelectedLists([538297]); // BLKOUT Hub
    } else {
      setSendFoxSelectedLists([538162]); // Community Circle
    }
  };

  // Send to SendFox after segment selection
  const handleSendToSendFox = async () => {
    if (!showSendFoxModal) return;

    setIsSendingToSendFox(true);

    try {
      const response = await fetch('/api/herald/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendfox_send',
          edition_id: showSendFoxModal.editionId,
          list_id: sendFoxSelectedLists[0] // API supports single list
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to prepare for SendFox');
      }

      setSendFoxResult(data);
    } catch (error) {
      console.error('SendFox error:', error);
      setGenerationError(error instanceof Error ? error.message : 'SendFox preparation failed');
      setShowSendFoxModal(null);
    } finally {
      setIsSendingToSendFox(false);
    }
  };

  // Copy HTML to clipboard
  const handleCopyHtml = async (html: string) => {
    try {
      await navigator.clipboard.writeText(html);
      alert('HTML copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Save edited content
  const handleSaveContent = async (updates: {
    htmlContent?: string;
    subject?: string;
    preheaderText?: string;
  }) => {
    if (!editingEdition) return { success: false, error: 'No edition selected' };

    const result = await updateEdition(editingEdition.id, updates);
    if (result.success) {
      await refetchEditions();
    }
    return result;
  };

  // Apply template to edition
  const handleApplyTemplate = async (template: NewsletterTemplate) => {
    // If we have an edition being edited, apply template to it
    if (editingEdition) {
      const result = await updateEdition(editingEdition.id, {
        htmlContent: template.htmlContent,
        preheaderText: template.preheaderText || undefined,
      });
      if (result.success) {
        await refetchEditions();
        setEditingEdition(null);
      }
    }
    setShowTemplateLibrary(false);
  };

  // Schedule newsletter
  const handleSchedule = async (date: Date | null) => {
    if (!schedulingEdition) return { success: false, error: 'No edition selected' };

    const result = await updateEdition(schedulingEdition.id, {
      scheduledFor: date,
      status: date ? 'scheduled' : 'draft',
    });
    if (result.success) {
      await refetchEditions();
    }
    return result;
  };

  const handleCreateEdition = async () => {
    if (!newSubject.trim()) return;

    const result = await createEdition(newEditionTier, newSubject);
    if (result.success && result.edition) {
      // If a template was selected, apply it to the new edition
      if (selectedTemplate) {
        await updateEdition(result.edition.id, {
          htmlContent: selectedTemplate.htmlContent,
          preheaderText: selectedTemplate.preheaderText || undefined,
        });
        await refetchEditions();
      }
      setSelectedEdition(result.edition);
      setFilterMode('drafts'); // Show drafts tab after creating
      setShowCreateModal(false);
      setNewSubject('');
      setSelectedTemplate(null);
    }
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplateLibrary(true)}
              className="btn btn-outline"
            >
              <BookTemplate size={18} />
              Templates
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus size={18} />
              New Edition
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
          {/* SendFox Status Card */}
          <button
            onClick={() => setShowSendFoxPanel(!showSendFoxPanel)}
            className={`card cursor-pointer transition-all hover:shadow-md ${
              sendFoxConnected ? 'border-green-200 hover:border-green-300' : 'border-red-200 hover:border-red-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">SendFox</p>
                {sendFoxLoading ? (
                  <p className="text-lg font-bold text-gray-400">Checking...</p>
                ) : sendFoxConnected ? (
                  <p className="text-xl font-bold text-green-600">{sendFoxSubscribers.toLocaleString()} subs</p>
                ) : (
                  <p className="text-lg font-bold text-red-600">Disconnected</p>
                )}
              </div>
              {sendFoxLoading ? (
                <RefreshCw className="text-gray-400 animate-spin" size={28} />
              ) : sendFoxConnected ? (
                <CheckCircle className="text-green-600" size={28} />
              ) : (
                <XCircle className="text-red-500" size={28} />
              )}
            </div>
          </button>
        </div>

        {/* SendFox Status Panel (Expandable) */}
        {showSendFoxPanel && (
          <SendFoxStatusPanel showLists={true} />
        )}

        {/* Generation Error Alert */}
        {generationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <div className="text-red-600 font-medium">Generation Error:</div>
            <div className="text-red-700 flex-1">{generationError}</div>
            <button
              onClick={() => setGenerationError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}

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
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    filterMode === 'all'
                      ? 'bg-blkout-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All ({editions.length})
                </button>
                <button
                  onClick={() => setFilterMode('drafts')}
                  className={`px-3 py-1.5 text-sm border-l border-gray-200 transition-colors ${
                    filterMode === 'drafts'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <FileText size={14} />
                    Drafts ({draftEditions.length})
                  </span>
                </button>
                <button
                  onClick={() => setFilterMode('archive')}
                  className={`px-3 py-1.5 text-sm border-l border-gray-200 transition-colors ${
                    filterMode === 'archive'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Archive size={14} />
                    Sent Archive ({sentEditions.length})
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Archive Header when viewing sent editions */}
          {filterMode === 'archive' && sentEditions.length > 0 && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <Archive size={18} />
                <span className="font-medium">Newsletter Archive</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {sentEditions.length} newsletter{sentEditions.length !== 1 ? 's' : ''} sent to the community
              </p>
            </div>
          )}

          {(filterMode === 'all' ? editions : filterMode === 'drafts' ? draftEditions : sentEditions).length === 0 ? (
            <div className="text-center py-12">
              {filterMode === 'archive' ? (
                <>
                  <Archive className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sent newsletters yet</h3>
                  <p className="text-gray-600 mb-4">Newsletters will appear here after they've been sent via SendFox.</p>
                </>
              ) : filterMode === 'drafts' ? (
                <>
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No draft newsletters</h3>
                  <p className="text-gray-600 mb-4">Create a new edition to start drafting.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary"
                  >
                    <Plus size={18} />
                    New Edition
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {(filterMode === 'all'
                ? editions
                : filterMode === 'drafts'
                  ? draftEditions
                  : sentEditions
              ).map((edition) => (
                <div
                  key={edition.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blkout-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-sm text-gray-500">
                          #{edition.editionNumber}
                        </span>
                        {getStatusBadge(edition.status)}
                        {edition.scheduledFor && (
                          <ScheduleBadge scheduledFor={edition.scheduledFor} />
                        )}
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
                      {/* Generate Content Button */}
                      <button
                        onClick={() => handleGenerateContent(
                          edition.id,
                          edition.subscriberTier === 'weekly_engaged' ? 'weekly' : 'monthly'
                        )}
                        disabled={isGenerating === edition.id}
                        className="btn btn-primary btn-sm"
                        title="Generate newsletter content with AI"
                      >
                        {isGenerating === edition.id ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        {isGenerating === edition.id ? 'Generating...' : 'Generate'}
                      </button>

                      {/* Add Editorial Button - only show if content generated */}
                      {edition.htmlContent && (
                        <button
                          onClick={() => setShowEditorialModal(edition.id)}
                          className="btn btn-outline btn-sm border-pink-300 text-pink-600 hover:bg-pink-50"
                          title="Add From the Editor section"
                        >
                          <Pen size={14} />
                          Editorial
                        </button>
                      )}

                      {/* Edit Content Button - only show if HTML exists */}
                      {edition.htmlContent && (
                        <button
                          onClick={() => setEditingEdition(edition)}
                          className="btn btn-outline btn-sm border-blue-300 text-blue-600 hover:bg-blue-50"
                          title="Edit newsletter content"
                        >
                          <Edit3 size={14} />
                          Edit
                        </button>
                      )}

                      {/* SendFox Button - only show if HTML exists */}
                      {edition.htmlContent && (
                        <button
                          onClick={() => handleOpenSendFoxModal(
                            edition.id,
                            edition.subscriberTier === 'weekly_engaged' ? 'weekly' : 'monthly'
                          )}
                          className="btn btn-sm bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                          title="Send to SendFox"
                        >
                          <Send size={14} />
                          SendFox
                        </button>
                      )}

                      {/* Preview Button - only show if HTML exists */}
                      {edition.htmlContent && (
                        <button
                          onClick={() => handlePreview(edition.id)}
                          className="btn btn-outline btn-sm"
                          title="Preview in new tab"
                        >
                          <Eye size={14} />
                          Preview
                        </button>
                      )}

                      {/* Copy HTML Button */}
                      {edition.htmlContent && (
                        <button
                          onClick={() => handleCopyHtml(edition.htmlContent!)}
                          className="btn btn-outline btn-sm"
                          title="Copy HTML for SendFox"
                        >
                          <Copy size={14} />
                          Copy
                        </button>
                      )}

                      {/* Schedule Button - only show if HTML exists and not sent */}
                      {edition.htmlContent && edition.status !== 'sent' && (
                        <button
                          onClick={() => setSchedulingEdition(edition)}
                          className={`btn btn-sm ${
                            edition.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'btn-outline border-green-300 text-green-600 hover:bg-green-50'
                          }`}
                          title={edition.status === 'scheduled' ? 'Reschedule' : 'Schedule send time'}
                        >
                          <Calendar size={14} />
                          {edition.status === 'scheduled' ? 'Reschedule' : 'Schedule'}
                        </button>
                      )}

                      {/* Export Dropdown */}
                      {edition.htmlContent && (
                        <div className="relative group">
                          <button className="btn btn-outline btn-sm">
                            <Download size={14} />
                          </button>
                          <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg py-1 hidden group-hover:block z-10 min-w-[120px]">
                            <button
                              onClick={() => handleExport(edition.id, 'html')}
                              className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
                            >
                              Download HTML
                            </button>
                            <button
                              onClick={() => handleExport(edition.id, 'text')}
                              className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
                            >
                              Download Text
                            </button>
                            <button
                              onClick={() => handleExport(edition.id, 'json')}
                              className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
                            >
                              Export JSON
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Performance metrics for sent editions */}
                  {edition.status === 'sent' && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-sm">
                      <PerformanceStatBadge
                        openRate={edition.openRate}
                        clickRate={edition.clickRate}
                      />
                      <div className="text-gray-500">
                        <span className="text-gray-500">Unsubscribes:</span>{' '}
                        <span className="font-medium text-gray-700">{edition.unsubscribes || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performance Analytics Section - Show when there are sent editions */}
        {sentEditions.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Newsletter Performance</h2>
            <PerformanceAnalytics editions={editions} />
          </div>
        )}

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

              {/* Template Selection */}
              <TemplateQuickSelect
                editionType={newEditionTier === 'weekly_engaged' ? 'weekly' : 'monthly'}
                onSelect={(template) => setSelectedTemplate(template)}
              />
              {selectedTemplate && (
                <div className="flex items-center gap-2 p-2 bg-blkout-50 rounded-lg text-sm">
                  <BookTemplate size={14} className="text-blkout-600" />
                  <span className="text-blkout-700">Using: {selectedTemplate.name}</span>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="ml-auto text-blkout-600 hover:text-blkout-800"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedTemplate(null);
                }}
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

      {/* Template Library Modal */}
      {showTemplateLibrary && (
        <TemplateLibrary
          onSelectTemplate={handleApplyTemplate}
          onClose={() => setShowTemplateLibrary(false)}
          currentContent={editingEdition ? {
            htmlContent: editingEdition.htmlContent || '',
            subject: editingEdition.subject,
            preheaderText: editingEdition.preheaderText || undefined,
            editionType: editingEdition.subscriberTier === 'weekly_engaged' ? 'weekly' : 'monthly',
          } : undefined}
        />
      )}

      {/* Editorial Modal */}
      {showEditorialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 mx-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <Pen size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">From the Editor</h2>
                <p className="text-sm text-gray-500">Add your personal touch to this edition</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What's on your mind this week?
                </label>
                <input
                  type="text"
                  value={editorialTopic}
                  onChange={(e) => setEditorialTopic(e.target.value)}
                  placeholder="e.g., Community resilience, upcoming Pride events, self-care..."
                  className="input w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What should readers take away?
                </label>
                <textarea
                  value={editorialTakeaway}
                  onChange={(e) => setEditorialTakeaway(e.target.value)}
                  placeholder="e.g., Remember to check in on each other, don't miss the workshop this Saturday..."
                  rows={3}
                  className="input w-full resize-none"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <p className="flex items-start gap-2">
                  <MessageSquare size={16} className="mt-0.5 text-pink-500 flex-shrink-0" />
                  <span>Your input will be used to generate a warm, personal ~100 word "From the Editor" section with your avatar.</span>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowEditorialModal(null);
                  setEditorialTopic('');
                  setEditorialTakeaway('');
                }}
                className="btn btn-outline"
                disabled={isSubmittingEditorial}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEditorial}
                disabled={!editorialTopic.trim() || isSubmittingEditorial}
                className="btn bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
              >
                {isSubmittingEditorial ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate Editorial
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SendFox Modal with Segment Selection */}
      {showSendFoxModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Send size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Send to SendFox</h2>
                <p className="text-sm text-gray-500">
                  {showSendFoxModal.editionType === 'weekly' ? 'Weekly Newsletter' : 'Monthly Digest'}
                </p>
              </div>
            </div>

            {isSendingToSendFox ? (
              <div className="text-center py-8">
                <RefreshCw size={32} className="animate-spin mx-auto text-orange-500 mb-3" />
                <p className="text-gray-600">Preparing newsletter for SendFox...</p>
              </div>
            ) : sendFoxResult?.success ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium flex items-center gap-2">
                    <CheckCircle size={18} />
                    Newsletter ready for SendFox!
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Subject Line</label>
                    <p className="text-sm font-medium text-gray-900">{sendFoxResult.subject_line}</p>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={sendFoxResult.sendfox_campaign_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 flex-1"
                    >
                      <ExternalLink size={14} />
                      Open SendFox
                    </a>
                    <button
                      onClick={() => handleCopyHtml(sendFoxResult.html_content || '')}
                      className="btn btn-outline btn-sm"
                    >
                      <Copy size={14} />
                      Copy HTML
                    </button>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-3 text-sm text-orange-800">
                  <p className="font-medium mb-2">Quick Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-orange-700">
                    <li>Click "Open SendFox" above</li>
                    <li>Create new campaign, select your list</li>
                    <li>Choose "Code" editor, paste the HTML</li>
                    <li>Preview and send!</li>
                  </ol>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => {
                      setShowSendFoxModal(null);
                      setSendFoxResult(null);
                    }}
                    className="btn btn-outline"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Select your target audience before preparing the newsletter for SendFox.
                </p>

                <SegmentSelector
                  lists={sendFoxLists}
                  selectedListIds={sendFoxSelectedLists}
                  onSelectionChange={setSendFoxSelectedLists}
                  editionType={showSendFoxModal.editionType}
                />

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowSendFoxModal(null);
                      setSendFoxResult(null);
                    }}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendToSendFox}
                    disabled={sendFoxSelectedLists.length === 0}
                    className="btn bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
                  >
                    <Send size={16} />
                    Prepare for SendFox
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content Editor Modal */}
      {editingEdition && editingEdition.htmlContent && (
        <ContentEditor
          content={editingEdition.htmlContent}
          subject={editingEdition.subject}
          preheaderText={editingEdition.preheaderText}
          onSave={handleSaveContent}
          onClose={() => setEditingEdition(null)}
          isLoading={isLoading}
        />
      )}

      {/* Schedule Publisher Modal */}
      {schedulingEdition && schedulingEdition.htmlContent && (
        <SchedulePublisher
          editionType={schedulingEdition.subscriberTier === 'weekly_engaged' ? 'weekly' : 'monthly'}
          subject={schedulingEdition.subject}
          currentSchedule={schedulingEdition.scheduledFor}
          onSchedule={handleSchedule}
          onClose={() => setSchedulingEdition(null)}
        />
      )}
    </Layout>
  );
}
