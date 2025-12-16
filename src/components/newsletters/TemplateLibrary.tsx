
import { useState, useEffect } from 'react';
import {
  BookTemplate, Plus, X, Copy, Trash2, Eye, Download, Upload,
  FileText, Clock, Check, RefreshCw, AlertTriangle,
  Search, Tag, Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface NewsletterTemplate {
  id: string;
  name: string;
  description: string;
  editionType: 'weekly' | 'monthly';
  htmlContent: string;
  preheaderText?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

interface TemplateLibraryProps {
  onSelectTemplate: (template: NewsletterTemplate) => void;
  onClose: () => void;
  currentContent?: {
    htmlContent: string;
    subject: string;
    preheaderText?: string;
    editionType: 'weekly' | 'monthly';
  };
}

// Default templates for BLKOUT newsletters
const DEFAULT_TEMPLATES: Omit<NewsletterTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[] = [
  {
    name: 'Weekly Community Update',
    description: 'Standard weekly newsletter with events, spotlight, and resources sections',
    editionType: 'weekly',
    tags: ['weekly', 'community', 'events'],
    preheaderText: 'Your weekly dose of Black queer joy and community updates',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BLKOUT Weekly</title>
</head>
<body style="margin:0;padding:0;font-family:Georgia,serif;background-color:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <!-- Header -->
    <div style="background:#dc2626;padding:32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:28px;">BLKOUT Weekly</h1>
      <p style="color:#fecaca;margin:8px 0 0;">Your community, your updates</p>
    </div>

    <!-- Content -->
    <div style="padding:32px;">
      <h2 style="color:#1f2937;border-bottom:2px solid #dc2626;padding-bottom:8px;">This Week's Highlights</h2>
      <p style="color:#4b5563;line-height:1.6;">Add your content here...</p>

      <h2 style="color:#1f2937;border-bottom:2px solid #dc2626;padding-bottom:8px;margin-top:32px;">Upcoming Events</h2>
      <p style="color:#4b5563;line-height:1.6;">Event listings go here...</p>

      <h2 style="color:#1f2937;border-bottom:2px solid #dc2626;padding-bottom:8px;margin-top:32px;">Community Spotlight</h2>
      <p style="color:#4b5563;line-height:1.6;">Featured member or story...</p>
    </div>

    <!-- Footer -->
    <div style="background:#1f2937;padding:24px;text-align:center;">
      <p style="color:#9ca3af;margin:0;font-size:14px;">BLKOUT - Community owned, community led</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: 'Monthly Digest',
    description: 'Comprehensive monthly roundup with highlights, metrics, and upcoming plans',
    editionType: 'monthly',
    tags: ['monthly', 'digest', 'roundup'],
    preheaderText: 'Your monthly community digest from BLKOUT',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BLKOUT Monthly</title>
</head>
<body style="margin:0;padding:0;font-family:Georgia,serif;background-color:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#dc2626,#7c3aed);padding:40px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:32px;">Monthly Digest</h1>
      <p style="color:#fecaca;margin:8px 0 0;font-size:16px;">Community Circle Edition</p>
    </div>

    <!-- Content -->
    <div style="padding:32px;">
      <h2 style="color:#1f2937;">Month in Review</h2>
      <p style="color:#4b5563;line-height:1.6;">Summary of the month's activities...</p>

      <h2 style="color:#1f2937;margin-top:32px;">By the Numbers</h2>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <div style="background:#fef2f2;padding:16px;border-radius:8px;flex:1;min-width:120px;text-align:center;">
          <div style="font-size:32px;font-weight:bold;color:#dc2626;">0</div>
          <div style="color:#4b5563;font-size:14px;">Events Hosted</div>
        </div>
        <div style="background:#f5f3ff;padding:16px;border-radius:8px;flex:1;min-width:120px;text-align:center;">
          <div style="font-size:32px;font-weight:bold;color:#7c3aed;">0</div>
          <div style="color:#4b5563;font-size:14px;">Members Engaged</div>
        </div>
      </div>

      <h2 style="color:#1f2937;margin-top:32px;">Looking Ahead</h2>
      <p style="color:#4b5563;line-height:1.6;">Preview of upcoming plans...</p>
    </div>

    <!-- Footer -->
    <div style="background:#1f2937;padding:24px;text-align:center;">
      <p style="color:#9ca3af;margin:0;font-size:14px;">BLKOUT - Community owned, community led</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: 'Event Announcement',
    description: 'Single event focus with details, registration link, and key info',
    editionType: 'weekly',
    tags: ['event', 'announcement', 'special'],
    preheaderText: 'You\'re invited to something special',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Announcement</title>
</head>
<body style="margin:0;padding:0;font-family:Georgia,serif;background-color:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <!-- Event Hero -->
    <div style="background:#dc2626;padding:48px 32px;text-align:center;">
      <p style="color:#fecaca;margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:2px;">You're Invited</p>
      <h1 style="color:#ffffff;margin:0;font-size:36px;">[Event Name]</h1>
    </div>

    <!-- Event Details -->
    <div style="padding:32px;">
      <div style="background:#fef2f2;border-radius:12px;padding:24px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;margin-bottom:12px;">
          <span style="font-size:20px;margin-right:8px;">📅</span>
          <span style="color:#1f2937;font-weight:600;">[Date]</span>
        </div>
        <div style="display:flex;align-items:center;margin-bottom:12px;">
          <span style="font-size:20px;margin-right:8px;">⏰</span>
          <span style="color:#1f2937;font-weight:600;">[Time]</span>
        </div>
        <div style="display:flex;align-items:center;">
          <span style="font-size:20px;margin-right:8px;">📍</span>
          <span style="color:#1f2937;font-weight:600;">[Location]</span>
        </div>
      </div>

      <h2 style="color:#1f2937;">About This Event</h2>
      <p style="color:#4b5563;line-height:1.6;">Event description goes here...</p>

      <div style="text-align:center;margin-top:32px;">
        <a href="#" style="display:inline-block;background:#dc2626;color:#ffffff;padding:16px 32px;text-decoration:none;border-radius:8px;font-weight:600;">Register Now</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#1f2937;padding:24px;text-align:center;">
      <p style="color:#9ca3af;margin:0;font-size:14px;">BLKOUT - Community owned, community led</p>
    </div>
  </div>
</body>
</html>`,
  },
];

const STORAGE_KEY = 'blkout_newsletter_templates';

// Load templates from localStorage
const loadTemplates = (): NewsletterTemplate[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((t: NewsletterTemplate) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      }));
    }
  } catch (e) {
    console.error('Failed to load templates:', e);
  }

  // Initialize with default templates
  const defaults: NewsletterTemplate[] = DEFAULT_TEMPLATES.map((t, i) => ({
    ...t,
    id: `default-${i}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 0,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
};

// Save templates to localStorage
const saveTemplates = (templates: NewsletterTemplate[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
};

export function TemplateLibrary({
  onSelectTemplate,
  onClose,
  currentContent,
}: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [previewTemplate, setPreviewTemplate] = useState<NewsletterTemplate | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateTags, setNewTemplateTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || t.editionType === filterType;
    return matchesSearch && matchesType;
  });

  // Save current content as template
  const handleSaveAsTemplate = () => {
    if (!currentContent?.htmlContent || !newTemplateName.trim()) return;

    setIsSaving(true);

    const newTemplate: NewsletterTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim() || 'Custom newsletter template',
      editionType: currentContent.editionType,
      htmlContent: currentContent.htmlContent,
      preheaderText: currentContent.preheaderText,
      tags: newTemplateTags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
    };

    const updated = [newTemplate, ...templates];
    setTemplates(updated);
    saveTemplates(updated);

    setShowSaveModal(false);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setNewTemplateTags('');
    setIsSaving(false);
  };

  // Use template
  const handleUseTemplate = (template: NewsletterTemplate) => {
    // Update usage count
    const updated = templates.map(t =>
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1, updatedAt: new Date() } : t
    );
    setTemplates(updated);
    saveTemplates(updated);

    onSelectTemplate(template);
  };

  // Delete template
  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
    setDeleteConfirm(null);
  };

  // Export template as JSON
  const handleExportTemplate = (template: NewsletterTemplate) => {
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-template.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import template from JSON
  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        const newTemplate: NewsletterTemplate = {
          ...imported,
          id: `imported-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
        };
        const updated = [newTemplate, ...templates];
        setTemplates(updated);
        saveTemplates(updated);
      } catch (err) {
        console.error('Failed to import template:', err);
        alert('Failed to import template. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blkout-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blkout-600 rounded-xl flex items-center justify-center">
              <BookTemplate size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Template Library</h2>
              <p className="text-sm text-gray-500">{templates.length} templates available</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-blkout-500"
              />
            </div>

            {/* Filter */}
            <div className="flex bg-gray-200 rounded-lg p-0.5">
              {(['all', 'weekly', 'monthly'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filterType === type
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Actions */}
            {currentContent?.htmlContent && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blkout-600 text-white rounded-lg hover:bg-blkout-700 transition-colors"
              >
                <Plus size={16} />
                Save Current as Template
              </button>
            )}

            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <Upload size={16} />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImportTemplate}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <BookTemplate size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Try a different search term' : 'Save your first template to get started'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:border-blkout-300 hover:shadow-md transition-all group"
                >
                  {/* Template Preview Strip */}
                  <div className={`h-2 ${
                    template.editionType === 'weekly' ? 'bg-blkout-500' : 'bg-purple-500'
                  }`} />

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blkout-600 transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{template.description}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        template.editionType === 'weekly'
                          ? 'bg-blkout-100 text-blkout-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {template.editionType}
                      </span>
                    </div>

                    {/* Tags */}
                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.tags.map((tag, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            <Tag size={10} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDistanceToNow(template.createdAt, { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Copy size={12} />
                        Used {template.usageCount} times
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blkout-600 text-white rounded-lg hover:bg-blkout-700 transition-colors text-sm"
                      >
                        <Sparkles size={14} />
                        Use Template
                      </button>
                      <button
                        onClick={() => setPreviewTemplate(template)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Preview"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleExportTemplate(template)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Export"
                      >
                        <Download size={16} />
                      </button>
                      {!template.id.startsWith('default-') && (
                        <button
                          onClick={() => setDeleteConfirm(template.id)}
                          className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden mx-4 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Preview: {previewTemplate.name}</h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 p-4">
              <iframe
                srcDoc={previewTemplate.htmlContent}
                title="Template Preview"
                className="w-full h-full min-h-[500px] bg-white rounded-lg shadow-sm border-0"
                sandbox="allow-same-origin"
              />
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleUseTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="px-4 py-2 bg-blkout-600 text-white rounded-lg hover:bg-blkout-700"
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save as Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Save as Template</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., Pride Week Special"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-blkout-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  placeholder="What is this template for?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-blkout-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newTemplateTags}
                  onChange={(e) => setNewTemplateTags(e.target.value)}
                  placeholder="e.g., pride, event, special"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-blkout-500"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">Type:</span>{' '}
                  <span className={currentContent?.editionType === 'weekly' ? 'text-blkout-600' : 'text-purple-600'}>
                    {currentContent?.editionType === 'weekly' ? 'Weekly' : 'Monthly'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setNewTemplateName('');
                  setNewTemplateDesc('');
                  setNewTemplateTags('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsTemplate}
                disabled={!newTemplateName.trim() || isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blkout-600 text-white rounded-lg hover:bg-blkout-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Template?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. The template will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTemplate(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Quick template selector for create modal
export function TemplateQuickSelect({
  editionType,
  onSelect,
}: {
  editionType: 'weekly' | 'monthly';
  onSelect: (template: NewsletterTemplate | null) => void;
}) {
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);

  useEffect(() => {
    setTemplates(loadTemplates().filter(t => t.editionType === editionType).slice(0, 3));
  }, [editionType]);

  if (templates.length === 0) return null;

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Start from template (optional)
      </label>
      <div className="space-y-2">
        <button
          onClick={() => onSelect(null)}
          className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">Blank template</span>
          </div>
        </button>
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blkout-300 hover:bg-blkout-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookTemplate size={16} className="text-blkout-500" />
                <span className="text-sm font-medium text-gray-900">{template.name}</span>
              </div>
              <span className="text-xs text-gray-500">Used {template.usageCount}x</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
