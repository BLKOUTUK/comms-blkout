
import { useState, useEffect, useRef } from 'react';
import {
  Eye, Edit3, Save, X, Maximize2, Minimize2, Copy, Check,
  RefreshCw, AlertTriangle, Code, FileText
} from 'lucide-react';

interface ContentEditorProps {
  content: string;
  subject: string;
  preheaderText?: string | null;
  onSave: (updates: {
    htmlContent?: string;
    subject?: string;
    preheaderText?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
  isLoading?: boolean;
}

type EditorMode = 'preview' | 'html' | 'structured';

export function ContentEditor({
  content,
  subject: initialSubject,
  preheaderText: initialPreheader,
  onSave,
  onClose,
  isLoading = false,
}: ContentEditorProps) {
  const [mode, setMode] = useState<EditorMode>('preview');
  const [editedContent, setEditedContent] = useState(content);
  const [editedSubject, setEditedSubject] = useState(initialSubject);
  const [editedPreheader, setEditedPreheader] = useState(initialPreheader || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Track changes
  useEffect(() => {
    const contentChanged = editedContent !== content;
    const subjectChanged = editedSubject !== initialSubject;
    const preheaderChanged = editedPreheader !== (initialPreheader || '');
    setHasChanges(contentChanged || subjectChanged || preheaderChanged);
  }, [editedContent, editedSubject, editedPreheader, content, initialSubject, initialPreheader]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    const updates: { htmlContent?: string; subject?: string; preheaderText?: string } = {};
    if (editedContent !== content) updates.htmlContent = editedContent;
    if (editedSubject !== initialSubject) updates.subject = editedSubject;
    if (editedPreheader !== (initialPreheader || '')) updates.preheaderText = editedPreheader;

    const result = await onSave(updates);

    setIsSaving(false);
    if (!result.success) {
      setSaveError(result.error || 'Failed to save changes');
    } else {
      setHasChanges(false);
    }
  };

  const handleCopyHtml = async () => {
    await navigator.clipboard.writeText(editedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setEditedContent(content);
    setEditedSubject(initialSubject);
    setEditedPreheader(initialPreheader || '');
    setSaveError(null);
  };

  // Parse structured content from HTML for structured editing
  const parseStructuredContent = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const sections: { title: string; content: string }[] = [];
    const headings = doc.querySelectorAll('h2, h3');
    headings.forEach((heading) => {
      const title = heading.textContent || '';
      let content = '';
      let sibling = heading.nextElementSibling;
      while (sibling && !['H2', 'H3'].includes(sibling.tagName)) {
        content += sibling.outerHTML;
        sibling = sibling.nextElementSibling;
      }
      sections.push({ title, content });
    });

    return sections;
  };

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-white'
    : 'fixed inset-4 md:inset-8 z-50 bg-white rounded-2xl shadow-2xl';

  return (
    <div className="fixed inset-0 bg-black/50 z-40">
      <div className={`${containerClass} flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Edit Newsletter Content</h2>
            {hasChanges && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                Unsaved changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="flex bg-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'preview'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye size={14} />
                Preview
              </button>
              <button
                onClick={() => setMode('html')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'html'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Code size={14} />
                HTML
              </button>
              <button
                onClick={() => setMode('structured')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'structured'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText size={14} />
                Sections
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <button
              onClick={handleCopyHtml}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Copy HTML"
            >
              {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Metadata Editor */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-blkout-500"
                placeholder="Newsletter subject..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preheader Text
              </label>
              <input
                type="text"
                value={editedPreheader}
                onChange={(e) => setEditedPreheader(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-blkout-500"
                placeholder="Preview text shown in inbox..."
                maxLength={150}
              />
              <p className="text-xs text-gray-500 mt-1">
                {editedPreheader.length}/150 characters
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {mode === 'preview' && (
            <div className="h-full bg-gray-100 p-4 overflow-auto">
              <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
                <iframe
                  ref={previewRef}
                  srcDoc={editedContent}
                  title="Newsletter Preview"
                  className="w-full h-full min-h-[600px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}

          {mode === 'html' && (
            <div className="h-full flex flex-col">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="flex-1 w-full p-4 font-mono text-sm bg-gray-900 text-gray-100 resize-none focus:outline-none"
                placeholder="HTML content..."
                spellCheck={false}
              />
            </div>
          )}

          {mode === 'structured' && (
            <div className="h-full overflow-auto p-6 bg-gray-50">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <AlertTriangle size={16} />
                    Structured Editor (Read-Only Preview)
                  </div>
                  <p>
                    This view shows the parsed sections from your newsletter. For full editing,
                    use the HTML editor.
                  </p>
                </div>

                {parseStructuredContent(editedContent).map((section, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900">{section.title || `Section ${index + 1}`}</h3>
                    </div>
                    <div
                      className="p-4 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  </div>
                ))}

                {parseStructuredContent(editedContent).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <p>No sections found in the content.</p>
                    <p className="text-sm">Use the HTML editor to add or modify content.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {saveError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertTriangle size={16} />
                {saveError}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Reset Changes
              </button>
            )}

            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {hasChanges ? 'Discard & Close' : 'Close'}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges || isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-blkout-600 text-white rounded-lg hover:bg-blkout-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact preview card for newsletter list
export function ContentPreviewCard({
  content,
  onClick,
}: {
  content: string;
  onClick: () => void;
}) {
  // Extract first paragraph text for preview
  const getPreviewText = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const firstP = doc.querySelector('p');
    return firstP?.textContent?.slice(0, 150) || 'No preview available';
  };

  return (
    <button
      onClick={onClick}
      className="text-left w-full p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blkout-300 hover:bg-blkout-50 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 group-hover:bg-blkout-100">
          <Edit3 size={14} className="text-gray-500 group-hover:text-blkout-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-1">Content Preview</p>
          <p className="text-sm text-gray-700 line-clamp-2">
            {getPreviewText(content)}...
          </p>
          <p className="text-xs text-blkout-600 mt-2 font-medium group-hover:text-blkout-700">
            Click to edit
          </p>
        </div>
      </div>
    </button>
  );
}
