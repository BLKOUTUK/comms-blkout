/**
 * Newsletter Generator UI Component
 *
 * Main interface for generating newsletters using the Herald agent.
 * Supports content selection, preview, editing, and export.
 */

import { useState } from 'react';
import {
  Sparkles,
  FileText,
  Calendar,
  Users,
  BookOpen,
  RefreshCw,
  Check,
  AlertCircle,
  Wand2,
  Edit3,
  Settings,
  ArrowRight,
  Clock,
  Target,
  Zap,
} from 'lucide-react';
import { useNewsletterGenerator, type GeneratedNewsletter } from '@/hooks/useNewsletterGenerator';
import { NewsletterPreview } from './NewsletterPreview';

interface ContentCounts {
  articles: number;
  events: number;
  resources: number;
  proposals: number;
  achievements: number;
}

interface NewsletterGeneratorUIProps {
  onSaveEdition?: (newsletter: GeneratedNewsletter) => Promise<{ success: boolean; editionId?: string; error?: string }>;
  // Reserved for future SendFox direct integration
  // onExportToSendFox?: (newsletter: GeneratedNewsletter) => void;
}

export function NewsletterGeneratorUI({
  onSaveEdition,
}: NewsletterGeneratorUIProps) {
  const {
    isGenerating,
    error,
    lastGenerated,
    generate,
    clearError,
    clearGenerated,
  } = useNewsletterGenerator();

  const [selectedType, setSelectedType] = useState<'weekly' | 'monthly'>('weekly');
  const [showPreview, setShowPreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editorNote, setEditorNote] = useState('');
  const [editorName, setEditorName] = useState('Rob');
  const [customTitle, setCustomTitle] = useState('');
  const [customPreheader, setCustomPreheader] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mock content counts - in production, these would come from the generator
  const [contentCounts] = useState<ContentCounts>({
    articles: 5,
    events: 8,
    resources: 12,
    proposals: 2,
    achievements: 3,
  });

  // Handle generate
  const handleGenerate = async () => {
    clearError();

    const options = {
      editorNote: editorNote || undefined,
      editorName: editorName || 'Rob',
      customTitle: customTitle || undefined,
      customPreheader: customPreheader || undefined,
    };

    const result = await generate(selectedType, options);

    if (result) {
      setShowPreview(true);
    }
  };

  // Handle save edition
  const handleSaveEdition = async () => {
    if (!lastGenerated || !onSaveEdition) return;

    setIsSaving(true);
    try {
      const result = await onSaveEdition(lastGenerated);
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(result.error || 'Failed to save edition');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form
  const handleReset = () => {
    clearGenerated();
    setEditorNote('');
    setCustomTitle('');
    setCustomPreheader('');
    setShowPreview(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blkout-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Wand2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Newsletter Generator</h2>
            <p className="text-sm text-gray-600">
              Herald curates the best content for your community
            </p>
          </div>
        </div>

        {lastGenerated && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              <RefreshCw size={14} />
              Start Over
            </button>
            {onSaveEdition && (
              <button
                onClick={handleSaveEdition}
                disabled={isSaving}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  saveSuccess
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blkout-600 text-white hover:bg-blkout-700'
                } disabled:opacity-50`}
              >
                {isSaving ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : saveSuccess ? (
                  <Check size={14} />
                ) : (
                  <FileText size={14} />
                )}
                {saveSuccess ? 'Saved!' : 'Save as Draft'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Available */}
      <div className="card border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Target size={14} />
          Available Content This Week
        </h3>
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center p-3 bg-gradient-to-br from-blkout-50 to-purple-50 rounded-xl">
            <FileText className="h-6 w-6 text-blkout-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blkout-600">{contentCounts.articles}</p>
            <p className="text-xs text-gray-600">Articles</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
            <Calendar className="h-6 w-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-600">{contentCounts.events}</p>
            <p className="text-xs text-gray-600">Events</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            <BookOpen className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{contentCounts.resources}</p>
            <p className="text-xs text-gray-600">Resources</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
            <Edit3 className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{contentCounts.proposals}</p>
            <p className="text-xs text-gray-600">Proposals</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl">
            <Users className="h-6 w-6 text-pink-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-pink-600">{contentCounts.achievements}</p>
            <p className="text-xs text-gray-600">Achievements</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Generation Failed</h3>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={clearError}
                className="text-sm text-red-800 hover:text-red-900 font-semibold underline mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generator Interface */}
      <div className="grid grid-cols-2 gap-6">
        {/* Type Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Select Newsletter Type</h3>

          {/* Weekly Option */}
          <button
            onClick={() => setSelectedType('weekly')}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selectedType === 'weekly'
                ? 'border-blkout-500 bg-blkout-50 ring-2 ring-blkout-500/20'
                : 'border-gray-200 hover:border-blkout-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedType === 'weekly' ? 'bg-blkout-500 text-white' : 'bg-blkout-100 text-blkout-600'
              }`}>
                <Clock size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900">Weekly Newsletter</h4>
                  <span className="text-xs text-blkout-600 bg-blkout-100 px-2 py-0.5 rounded">
                    Engaged Members
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Detailed community updates for active BLKOUTHUB members.
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <FileText size={12} /> 3 highlights
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> 5 events
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} /> 2 resources
                  </span>
                </div>
              </div>
            </div>
          </button>

          {/* Monthly Option */}
          <button
            onClick={() => setSelectedType('monthly')}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selectedType === 'monthly'
                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500/20'
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedType === 'monthly' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600'
              }`}>
                <Calendar size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900">Monthly Digest</h4>
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                    Community Circle
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Comprehensive roundup for the wider community with highlights and stats.
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <FileText size={12} /> 5 highlights
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> 4 events
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} /> 3 resources
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Configuration</h3>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-blkout-600 hover:text-blkout-700 flex items-center gap-1"
            >
              <Settings size={12} />
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </button>
          </div>

          {/* Editor Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Editor Note (optional)
            </label>
            <textarea
              value={editorNote}
              onChange={(e) => setEditorNote(e.target.value)}
              placeholder="Add a personal note from the editor..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-blkout-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              This appears as "From the Editor" section
            </p>
          </div>

          {/* Editor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Editor Name
            </label>
            <input
              type="text"
              value={editorName}
              onChange={(e) => setEditorName(e.target.value)}
              placeholder="Rob"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-blkout-500"
            />
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Leave empty for auto-generated title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-blkout-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Preheader
                </label>
                <input
                  type="text"
                  value={customPreheader}
                  onChange={(e) => setCustomPreheader(e.target.value)}
                  placeholder="Preview text shown before opening email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-blkout-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max 150 characters
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
            selectedType === 'weekly'
              ? 'bg-gradient-to-r from-blkout-500 to-blkout-600 text-white hover:from-blkout-600 hover:to-blkout-700'
              : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
          }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw size={24} className="animate-spin" />
              Generating Newsletter...
            </>
          ) : (
            <>
              <Sparkles size={24} />
              Generate {selectedType === 'weekly' ? 'Weekly' : 'Monthly'} Newsletter
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>

      {/* Generation Steps (shown while generating) */}
      {isGenerating && (
        <div className="card border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Zap size={14} className="text-amber-500" />
            Herald is curating your newsletter...
          </h4>
          <div className="space-y-3">
            {[
              'Fetching top-performing articles',
              'Selecting upcoming community events',
              'Gathering community resources',
              'Checking governance proposals',
              'Generating introduction copy',
              'Building HTML email template',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  i < 3 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < 3 ? <Check size={12} /> : <Clock size={12} />}
                </div>
                <span className={i < 3 ? 'text-gray-900' : 'text-gray-500'}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && lastGenerated && (
        <NewsletterPreview
          htmlContent={lastGenerated.htmlContent}
          subject={lastGenerated.title}
          preheaderText={lastGenerated.preheaderText}
          editionType={lastGenerated.type}
          onClose={() => setShowPreview(false)}
          onSave={async (updates) => {
            // In production, this would update the stored newsletter
            console.log('Saving updates:', updates);
            return { success: true };
          }}
        />
      )}
    </div>
  );
}

export default NewsletterGeneratorUI;
