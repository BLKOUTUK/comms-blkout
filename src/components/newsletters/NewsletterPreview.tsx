/**
 * Newsletter Preview Component
 *
 * Shows generated newsletter with section editing capabilities and export options.
 * Supports both visual preview and HTML source view.
 */

import { useState, useEffect, useRef } from 'react';
import {
  Eye,
  Code,
  Copy,
  Download,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  Monitor,
  Smartphone,
  Mail,
  ArrowLeft,
  Save,
  Edit3,
} from 'lucide-react';

interface NewsletterPreviewProps {
  htmlContent: string;
  subject: string;
  preheaderText?: string;
  editionType: 'weekly' | 'monthly';
  onSave?: (updates: { htmlContent?: string; subject?: string; preheaderText?: string }) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
  isLoading?: boolean;
}

type ViewMode = 'preview' | 'source';
type DeviceMode = 'desktop' | 'mobile';

export function NewsletterPreview({
  htmlContent,
  subject,
  preheaderText,
  editionType,
  onSave,
  onClose,
  isLoading = false,
}: NewsletterPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [editedHtml, setEditedHtml] = useState(htmlContent);
  const [editedSubject, setEditedSubject] = useState(subject);
  const [editedPreheader, setEditedPreheader] = useState(preheaderText || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showSubjectEdit, setShowSubjectEdit] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track changes
  useEffect(() => {
    const changed =
      editedHtml !== htmlContent ||
      editedSubject !== subject ||
      editedPreheader !== (preheaderText || '');
    setHasChanges(changed);
  }, [editedHtml, editedSubject, editedPreheader, htmlContent, subject, preheaderText]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedHtml);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      const result = await onSave({
        htmlContent: editedHtml,
        subject: editedSubject,
        preheaderText: editedPreheader || undefined,
      });

      if (!result.success) {
        alert(result.error || 'Failed to save');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle HTML export/download
  const handleDownload = () => {
    const blob = new Blob([editedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blkout-newsletter-${editionType}-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Open in new tab
  const handleOpenInTab = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(editedHtml);
      newWindow.document.close();
    }
  };

  // Reset changes
  const handleReset = () => {
    setEditedHtml(htmlContent);
    setEditedSubject(subject);
    setEditedPreheader(preheaderText || '');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blkout-50 to-purple-50">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/80 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Newsletter Preview</h2>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  editionType === 'weekly'
                    ? 'bg-blkout-100 text-blkout-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {editionType}
                </span>
              </div>
              {showSubjectEdit ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blkout-500 focus:border-blkout-500 w-80"
                    autoFocus
                  />
                  <button
                    onClick={() => setShowSubjectEdit(false)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <Check size={14} className="text-green-600" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSubjectEdit(true)}
                  className="text-sm text-gray-600 hover:text-blkout-600 flex items-center gap-1 mt-1"
                >
                  <Mail size={12} />
                  {editedSubject}
                  <Edit3 size={12} className="opacity-50" />
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                Unsaved changes
              </span>
            )}

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5 mr-2">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye size={14} />
                Preview
              </button>
              <button
                onClick={() => setViewMode('source')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'source'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Code size={14} />
                HTML
              </button>
            </div>

            {/* Device Toggle (preview mode only) */}
            {viewMode === 'preview' && (
              <div className="flex bg-gray-100 rounded-lg p-0.5 mr-2">
                <button
                  onClick={() => setDeviceMode('desktop')}
                  className={`p-1.5 rounded-md transition-colors ${
                    deviceMode === 'desktop'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Desktop view"
                >
                  <Monitor size={16} />
                </button>
                <button
                  onClick={() => setDeviceMode('mobile')}
                  className={`p-1.5 rounded-md transition-colors ${
                    deviceMode === 'mobile'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Mobile view"
                >
                  <Smartphone size={16} />
                </button>
              </div>
            )}

            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                copySuccess
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Copy HTML to clipboard"
            >
              {copySuccess ? <Check size={14} /> : <Copy size={14} />}
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
              title="Download HTML file"
            >
              <Download size={14} />
              Export
            </button>

            <button
              onClick={handleOpenInTab}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={14} />
            </button>

            {hasChanges && (
              <>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                  disabled={isSaving}
                >
                  <RefreshCw size={14} />
                  Reset
                </button>

                {onSave && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving || isLoading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blkout-600 text-white rounded-lg hover:bg-blkout-700 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    Save Changes
                  </button>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preheader Editor */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Preview text:
            </label>
            <input
              type="text"
              value={editedPreheader}
              onChange={(e) => setEditedPreheader(e.target.value)}
              placeholder="Text shown in email preview before opening"
              className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-blkout-500"
            />
            <span className="text-xs text-gray-500">
              {editedPreheader.length}/150
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {viewMode === 'preview' ? (
            /* Preview Mode */
            <div className="flex-1 overflow-auto bg-gray-100 p-6">
              <div
                className={`mx-auto bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${
                  deviceMode === 'mobile' ? 'max-w-[375px]' : 'max-w-[600px]'
                }`}
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={editedHtml}
                  title="Newsletter Preview"
                  className="w-full border-0"
                  style={{
                    height: deviceMode === 'mobile' ? '667px' : '800px',
                    minHeight: '500px',
                  }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          ) : (
            /* Source Code Mode */
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-auto p-4 bg-gray-900">
                <textarea
                  ref={textareaRef}
                  value={editedHtml}
                  onChange={(e) => setEditedHtml(e.target.value)}
                  className="w-full h-full min-h-[600px] bg-gray-800 text-green-400 font-mono text-sm p-4 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blkout-500"
                  spellCheck={false}
                />
              </div>
              <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
                <span>
                  {editedHtml.length.toLocaleString()} characters | ~{Math.ceil(new Blob([editedHtml]).size / 1024)} KB
                </span>
                <span>
                  Tip: Edit HTML directly for fine-grained control
                </span>
              </div>
            </div>
          )}

          {/* Section Editor Panel (optional - shown on right side) */}
          {viewMode === 'preview' && activeSection && (
            <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Edit Section</h3>
                  <button
                    onClick={() => setActiveSection(null)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600">
                  Click on sections in the preview to edit them, or use the HTML editor for full control.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-green-500" />
              Email-safe inline CSS
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-green-500" />
              Mobile responsive
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-green-500" />
              SendFox compatible
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Ready to paste into SendFox Code editor
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsletterPreview;
