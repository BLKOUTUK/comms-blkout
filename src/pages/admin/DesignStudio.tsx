/**
 * Design Studio - Canva Integration Page
 *
 * Create and manage designs for BLKOUT social media content,
 * event graphics, and branded materials.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useCanva } from '@/hooks/useCanva';
import { type CanvaDesign } from '@/services/canva/designs';
import { type CanvaBrandTemplate } from '@/services/canva/brandTemplates';
import {
  Palette,
  Plus,
  Search,
  Loader2,
  ExternalLink,
  Image,
  FileImage,
  Calendar,
  Mail,
  Share2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Download,
  Edit3,
  FolderPlus,
} from 'lucide-react';

type DesignPreset = {
  id: string;
  name: string;
  width: number;
  height: number;
  icon: React.ReactNode;
  category: 'social' | 'event' | 'marketing';
};

const designPresets: DesignPreset[] = [
  { id: 'instagram-post', name: 'Instagram Post', width: 1080, height: 1080, icon: <Image size={20} />, category: 'social' },
  { id: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920, icon: <Image size={20} />, category: 'social' },
  { id: 'facebook-post', name: 'Facebook Post', width: 1200, height: 630, icon: <Share2 size={20} />, category: 'social' },
  { id: 'twitter-post', name: 'Twitter/X Post', width: 1600, height: 900, icon: <Share2 size={20} />, category: 'social' },
  { id: 'linkedin-post', name: 'LinkedIn Post', width: 1200, height: 627, icon: <Share2 size={20} />, category: 'social' },
  { id: 'youtube-thumbnail', name: 'YouTube Thumbnail', width: 1280, height: 720, icon: <FileImage size={20} />, category: 'social' },
  { id: 'event-banner', name: 'Event Banner', width: 1920, height: 1080, icon: <Calendar size={20} />, category: 'event' },
  { id: 'poster-a4', name: 'A4 Poster', width: 2480, height: 3508, icon: <FileImage size={20} />, category: 'event' },
  { id: 'email-header', name: 'Email Header', width: 600, height: 200, icon: <Mail size={20} />, category: 'marketing' },
];

export function DesignStudio() {
  const navigate = useNavigate();
  const canva = useCanva();
  const [activeTab, setActiveTab] = useState<'recent' | 'templates' | 'create'>('recent');
  const [recentDesigns, setRecentDesigns] = useState<CanvaDesign[]>([]);
  const [brandTemplates, setBrandTemplates] = useState<CanvaBrandTemplate[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [newDesignTitle, setNewDesignTitle] = useState('');

  // Redirect if not connected
  useEffect(() => {
    if (!canva.isLoading && !canva.isConnected && canva.isConfigured) {
      navigate('/admin/settings?tab=design');
    }
  }, [canva.isConnected, canva.isLoading, canva.isConfigured, navigate]);

  // Load recent designs
  useEffect(() => {
    if (canva.isConnected && activeTab === 'recent') {
      loadRecentDesigns();
    }
  }, [canva.isConnected, activeTab]);

  // Load brand templates
  useEffect(() => {
    if (canva.isConnected && activeTab === 'templates') {
      loadBrandTemplates();
    }
  }, [canva.isConnected, activeTab]);

  const loadRecentDesigns = async () => {
    setIsLoadingDesigns(true);
    try {
      const designs = await canva.getRecentDesigns();
      setRecentDesigns(designs);
    } catch (err) {
      console.error('Failed to load designs:', err);
    } finally {
      setIsLoadingDesigns(false);
    }
  };

  const loadBrandTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const templates = await canva.getBrandTemplates();
      setBrandTemplates(templates);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleCreateDesign = async () => {
    if (!newDesignTitle.trim()) {
      setCreateError('Please enter a design title');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const result = await canva.createDesign(newDesignTitle);
      // Open design in Canva editor
      window.open(result.editUrl, '_blank');
      // Reset form
      setNewDesignTitle('');
      setSelectedPreset(null);
      // Refresh designs list
      loadRecentDesigns();
      setActiveTab('recent');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create design');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    const title = prompt('Enter a title for your design:');
    if (!title) return;

    setIsCreating(true);
    try {
      const result = await canva.createDesign(title, templateId);
      window.open(result.editUrl, '_blank');
      loadRecentDesigns();
    } catch (err) {
      console.error('Failed to create from template:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleExportDesign = async (designId: string) => {
    try {
      const urls = await canva.exportDesign(designId, 'png');
      // Download the first exported image
      if (urls.length > 0) {
        window.open(urls[0], '_blank');
      }
    } catch (err) {
      console.error('Failed to export design:', err);
    }
  };

  const filteredDesigns = searchQuery
    ? recentDesigns.filter(d =>
        d.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentDesigns;

  const filteredTemplates = searchQuery
    ? brandTemplates.filter(t =>
        t.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : brandTemplates;

  // Show loading state
  if (canva.isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blkout-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading Design Studio...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show not configured state
  if (!canva.isConfigured) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Canva Not Configured</h1>
          <p className="text-gray-600 mb-6">
            To use the Design Studio, you need to configure your Canva API credentials first.
          </p>
          <button
            onClick={() => navigate('/admin/settings')}
            className="btn btn-primary"
          >
            Go to Settings
          </button>
        </div>
      </Layout>
    );
  }

  // Show not connected state
  if (!canva.isConnected) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <div className="w-16 h-16 bg-blkout-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Palette className="h-8 w-8 text-blkout-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect to Canva</h1>
          <p className="text-gray-600 mb-6">
            Connect your Canva account to start creating professional designs for BLKOUT.
          </p>
          <button
            onClick={() => canva.connect()}
            disabled={canva.isLoading}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            {canva.isLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Palette size={16} />
            )}
            Connect Canva Account
          </button>
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
            <h1 className="text-3xl font-display font-bold text-gray-900">Design Studio</h1>
            <p className="text-gray-600 mt-1">
              Create and manage BLKOUT visual content with Canva
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
              <CheckCircle size={14} />
              Connected to Canva
            </span>
            <button
              onClick={() => canva.refresh()}
              className="btn btn-outline"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-8">
            {[
              { id: 'recent', label: 'Recent Designs' },
              { id: 'templates', label: 'Brand Templates' },
              { id: 'create', label: 'Create New' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blkout-600 text-blkout-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Search (for recent and templates) */}
        {(activeTab === 'recent' || activeTab === 'templates') && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'recent' ? 'designs' : 'templates'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
        )}

        {/* Recent Designs Tab */}
        {activeTab === 'recent' && (
          <div>
            {isLoadingDesigns ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blkout-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading your designs...</p>
              </div>
            ) : filteredDesigns.length === 0 ? (
              <div className="text-center py-12">
                <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No designs yet</h3>
                <p className="text-gray-600 mb-4">Create your first design to get started</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Create Design
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredDesigns.map((design) => (
                  <div
                    key={design.id}
                    className="card group hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      {design.thumbnail?.url ? (
                        <img
                          src={design.thumbnail.url}
                          alt={design.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileImage className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 truncate" title={design.title}>
                      {design.title || 'Untitled Design'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(design.updated_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => canva.openDesignEditor(design)}
                        className="btn btn-primary btn-sm flex-1"
                      >
                        <Edit3 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleExportDesign(design.id)}
                        className="btn btn-outline btn-sm"
                        title="Export as PNG"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Brand Templates Tab */}
        {activeTab === 'templates' && (
          <div>
            {isLoadingTemplates ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blkout-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading brand templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <FolderPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No brand templates</h3>
                <p className="text-gray-600 mb-4">
                  Create brand templates in Canva to maintain consistent branding
                </p>
                <a
                  href="https://www.canva.com/brand/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline inline-flex items-center gap-2"
                >
                  <ExternalLink size={16} />
                  Set up Brand Kit in Canva
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="card group hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleCreateFromTemplate(template.id)}
                  >
                    <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      {template.thumbnail?.url ? (
                        <img
                          src={template.thumbnail.url}
                          alt={template.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileImage className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 truncate" title={template.title}>
                      {template.title || 'Untitled Template'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Click to create from template
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create New Tab */}
        {activeTab === 'create' && (
          <div className="space-y-8">
            {/* Quick Create Form */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Create</h2>

              {createError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle size={16} />
                    <span className="text-sm">{createError}</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Design Title
                  </label>
                  <input
                    type="text"
                    value={newDesignTitle}
                    onChange={(e) => setNewDesignTitle(e.target.value)}
                    placeholder="e.g., Pride Month Campaign - Instagram"
                    className="input"
                  />
                </div>
                <button
                  onClick={() => handleCreateDesign()}
                  disabled={isCreating || !newDesignTitle.trim()}
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Design
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Design Presets */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Design Presets</h2>

              {/* Social Media */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Social Media
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {designPresets.filter(p => p.category === 'social').map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedPreset(preset.id);
                        setNewDesignTitle(`BLKOUT ${preset.name}`);
                      }}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        selectedPreset === preset.id
                          ? 'border-blkout-500 bg-blkout-50'
                          : 'border-gray-200 hover:border-blkout-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                          {preset.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{preset.name}</h4>
                          <p className="text-xs text-gray-500">{preset.width} × {preset.height}px</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Materials */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Event Materials
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {designPresets.filter(p => p.category === 'event').map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedPreset(preset.id);
                        setNewDesignTitle(`BLKOUT ${preset.name}`);
                      }}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        selectedPreset === preset.id
                          ? 'border-blkout-500 bg-blkout-50'
                          : 'border-gray-200 hover:border-blkout-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                          {preset.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{preset.name}</h4>
                          <p className="text-xs text-gray-500">{preset.width} × {preset.height}px</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Marketing */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Marketing
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {designPresets.filter(p => p.category === 'marketing').map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedPreset(preset.id);
                        setNewDesignTitle(`BLKOUT ${preset.name}`);
                      }}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        selectedPreset === preset.id
                          ? 'border-blkout-500 bg-blkout-50'
                          : 'border-gray-200 hover:border-blkout-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                          {preset.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{preset.name}</h4>
                          <p className="text-xs text-gray-500">{preset.width} × {preset.height}px</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default DesignStudio;
