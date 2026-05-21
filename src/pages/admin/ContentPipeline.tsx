/**
 * AIvor Content Production Pipeline
 * End-to-end: Brief → Script Generation → Visual → Review → Schedule
 */

import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import {
  Sparkles, Plus, FileText, CheckCircle, Calendar,
  ChevronRight, Clock, Eye, Send, X,
} from 'lucide-react';
import type {
  ContentBrief,
  ContentBriefStatus,
  ContentFormat,
  ContentTone,
  PipelineItem,
} from '@/types/contentBrief';
import {
  FORMAT_LABELS,
  TONE_LABELS,
  FORMAT_TEMPLATES,
  FORMAT_AGENTS,
} from '@/types/contentBrief';
import type { PlatformType } from '@/types/campaign';

const STATUS_LABELS: Record<ContentBriefStatus, string> = {
  draft: 'Draft',
  brief_ready: 'Brief Ready',
  generating: 'Generating...',
  review: 'In Review',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
};

const STATUS_COLORS: Record<ContentBriefStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  brief_ready: 'bg-blue-100 text-blue-700',
  generating: 'bg-yellow-100 text-yellow-700',
  review: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  scheduled: 'bg-indigo-100 text-indigo-700',
  published: 'bg-emerald-100 text-emerald-700',
};

const PLATFORM_OPTIONS: PlatformType[] = ['instagram', 'twitter', 'linkedin', 'facebook', 'tiktok', 'email', 'website'];

// In-memory pipeline state (will be persisted to Supabase in future iteration)
const initialPipeline: PipelineItem[] = [];

export function ContentPipeline() {
  const [pipeline, setPipeline] = useState<PipelineItem[]>(initialPipeline);
  const [showBriefForm, setShowBriefForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PipelineItem | null>(null);
  const [filter, setFilter] = useState<ContentBriefStatus | 'all'>('all');

  // Brief form state
  const [briefTitle, setBriefTitle] = useState('');
  const [briefFormat, setBriefFormat] = useState<ContentFormat>('heritage_spotlight');
  const [briefTone, setBriefTone] = useState<ContentTone>('educational');
  const [briefDescription, setBriefDescription] = useState('');
  const [briefDate, setBriefDate] = useState('');
  const [briefPlatforms, setBriefPlatforms] = useState<PlatformType[]>(['instagram']);
  const [briefKeyMessages, setBriefKeyMessages] = useState('');
  const [briefHashtags, setBriefHashtags] = useState('');
  const [briefVisualDirection, setBriefVisualDirection] = useState('');

  const applyTemplate = (format: ContentFormat) => {
    setBriefFormat(format);
    const template = FORMAT_TEMPLATES[format];
    if (template.tone) setBriefTone(template.tone);
    if (template.platforms) setBriefPlatforms(template.platforms as PlatformType[]);
    if (template.keyMessages) setBriefKeyMessages(template.keyMessages.join('\n'));
    if (template.hashtags) setBriefHashtags(template.hashtags.join(' '));
    if (template.visualDirection) setBriefVisualDirection(template.visualDirection);
  };

  const handleCreateBrief = () => {
    const newItem: PipelineItem = {
      id: `brief-${Date.now()}`,
      brief: {
        id: `brief-${Date.now()}`,
        title: briefTitle,
        format: briefFormat,
        tone: briefTone,
        platforms: briefPlatforms,
        targetDate: briefDate,
        description: briefDescription,
        keyMessages: briefKeyMessages.split('\n').filter(Boolean),
        hashtags: briefHashtags.split(/[,\s]+/).filter(Boolean),
        targetAudience: FORMAT_TEMPLATES[briefFormat]?.targetAudience || '',
        visualDirection: briefVisualDirection,
        status: 'brief_ready',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      platformVariants: [],
      status: 'brief_ready',
      assignedAgent: FORMAT_AGENTS[briefFormat],
    };

    setPipeline(prev => [newItem, ...prev]);
    resetForm();
    setShowBriefForm(false);
  };

  const resetForm = () => {
    setBriefTitle('');
    setBriefFormat('heritage_spotlight');
    setBriefTone('educational');
    setBriefDescription('');
    setBriefDate('');
    setBriefPlatforms(['instagram']);
    setBriefKeyMessages('');
    setBriefHashtags('');
    setBriefVisualDirection('');
  };

  const simulateGeneration = (itemId: string) => {
    setPipeline(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        status: 'generating' as ContentBriefStatus,
        brief: { ...item.brief, status: 'generating' as ContentBriefStatus },
      };
    }));

    // Simulate generation completing after 2s
    setTimeout(() => {
      setPipeline(prev => prev.map(item => {
        if (item.id !== itemId) return item;
        const brief = item.brief;
        return {
          ...item,
          status: 'review' as ContentBriefStatus,
          brief: { ...brief, status: 'review' as ContentBriefStatus },
          generatedScript: generateMockScript(brief),
          generatedVisualPrompt: generateMockVisualPrompt(brief),
          platformVariants: brief.platforms.map(p => ({
            platform: p,
            caption: `[${brief.title}] ${brief.description.slice(0, 200)}...`,
            hashtags: brief.hashtags,
            status: 'draft' as const,
          })),
        };
      }));
    }, 2000);
  };

  const approveItem = (itemId: string) => {
    setPipeline(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        status: 'approved' as ContentBriefStatus,
        brief: { ...item.brief, status: 'approved' as ContentBriefStatus },
      };
    }));
  };

  const scheduleItem = (itemId: string) => {
    setPipeline(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        status: 'scheduled' as ContentBriefStatus,
        brief: { ...item.brief, status: 'scheduled' as ContentBriefStatus },
        scheduledFor: item.brief.targetDate,
      };
    }));
  };

  const filteredPipeline = filter === 'all' ? pipeline : pipeline.filter(i => i.status === filter);

  const statusCounts = pipeline.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const togglePlatform = (platform: PlatformType) => {
    setBriefPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              AIvor Content Pipeline
            </h1>
            <p className="text-sm text-gray-500 mt-1">Brief → Generate → Review → Schedule → Publish</p>
          </div>
          <button
            onClick={() => setShowBriefForm(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Content Brief
          </button>
        </div>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {(['draft', 'brief_ready', 'generating', 'review', 'approved', 'scheduled', 'published'] as ContentBriefStatus[]).map(status => (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? 'all' : status)}
              className={`p-3 rounded-lg border text-center transition-colors ${
                filter === status ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl font-bold text-gray-900">{statusCounts[status] || 0}</div>
              <div className="text-xs text-gray-500">{STATUS_LABELS[status]}</div>
            </button>
          ))}
        </div>

        {/* Pipeline Flow Visualization */}
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 overflow-x-auto">
          <span className="flex items-center gap-1 whitespace-nowrap"><FileText className="h-4 w-4" /> Brief</span>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="flex items-center gap-1 whitespace-nowrap"><Sparkles className="h-4 w-4" /> Generate</span>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="flex items-center gap-1 whitespace-nowrap"><Eye className="h-4 w-4" /> Review</span>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="flex items-center gap-1 whitespace-nowrap"><CheckCircle className="h-4 w-4" /> Approve</span>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="flex items-center gap-1 whitespace-nowrap"><Calendar className="h-4 w-4" /> Schedule</span>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="flex items-center gap-1 whitespace-nowrap"><Send className="h-4 w-4" /> Publish</span>
        </div>

        {/* Brief Form */}
        {showBriefForm && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Content Brief</h2>
              <button onClick={() => { setShowBriefForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={briefTitle}
                  onChange={e => setBriefTitle(e.target.value)}
                  placeholder="e.g. Trans Day of Visibility 2026"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <select
                  value={briefFormat}
                  onChange={e => applyTemplate(e.target.value as ContentFormat)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {Object.entries(FORMAT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                <select
                  value={briefTone}
                  onChange={e => setBriefTone(e.target.value as ContentTone)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {Object.entries(TONE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={briefDate}
                  onChange={e => setBriefDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_OPTIONS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        briefPlatforms.includes(p)
                          ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-400'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description / Brief</label>
              <textarea
                value={briefDescription}
                onChange={e => setBriefDescription(e.target.value)}
                rows={3}
                placeholder="Describe what this content should communicate..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Messages (one per line)</label>
                <textarea
                  value={briefKeyMessages}
                  onChange={e => setBriefKeyMessages(e.target.value)}
                  rows={3}
                  placeholder="Historical significance&#10;Connection to community&#10;Call to action"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visual Direction</label>
                <textarea
                  value={briefVisualDirection}
                  onChange={e => setBriefVisualDirection(e.target.value)}
                  rows={3}
                  placeholder="Describe the visual style..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hashtags</label>
              <input
                type="text"
                value={briefHashtags}
                onChange={e => setBriefHashtags(e.target.value)}
                placeholder="#BLKOUT #BlackQueerJoy"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">
                Agent: <span className="font-medium text-purple-600">{FORMAT_AGENTS[briefFormat]}</span> will generate content from this brief.
              </p>
              <button
                onClick={handleCreateBrief}
                disabled={!briefTitle || !briefDescription}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Brief
              </button>
            </div>
          </div>
        )}

        {/* Pipeline Items */}
        {filteredPipeline.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {pipeline.length === 0 ? 'No content in pipeline' : 'No items match filter'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {pipeline.length === 0
                ? 'Create a content brief to start the production pipeline.'
                : 'Try changing the status filter above.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPipeline.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                          {STATUS_LABELS[item.status]}
                        </span>
                        <span className="text-xs text-gray-500">{FORMAT_LABELS[item.brief.format]}</span>
                        {item.assignedAgent && (
                          <span className="text-xs text-purple-600 font-medium">@{item.assignedAgent}</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{item.brief.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.brief.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {item.brief.targetDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {new Date(item.brief.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          {item.brief.platforms.join(', ')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {item.status === 'brief_ready' && (
                        <button
                          onClick={() => simulateGeneration(item.id)}
                          className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700"
                        >
                          <Sparkles className="h-3 w-3" /> Generate
                        </button>
                      )}
                      {item.status === 'generating' && (
                        <span className="flex items-center gap-1 text-yellow-600 text-xs">
                          <Clock className="h-3 w-3 animate-spin" /> Generating...
                        </span>
                      )}
                      {item.status === 'review' && (
                        <>
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200"
                          >
                            <Eye className="h-3 w-3" /> Preview
                          </button>
                          <button
                            onClick={() => approveItem(item.id)}
                            className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700"
                          >
                            <CheckCircle className="h-3 w-3" /> Approve
                          </button>
                        </>
                      )}
                      {item.status === 'approved' && (
                        <button
                          onClick={() => scheduleItem(item.id)}
                          className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700"
                        >
                          <Calendar className="h-3 w-3" /> Schedule
                        </button>
                      )}
                      {item.status === 'scheduled' && (
                        <span className="flex items-center gap-1 text-indigo-600 text-xs font-medium">
                          <Calendar className="h-3 w-3" /> {item.scheduledFor ? new Date(item.scheduledFor).toLocaleDateString('en-GB') : 'Pending'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Generated content preview */}
                  {item.generatedScript && item.status !== 'brief_ready' && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs font-medium text-gray-600 mb-1">Generated Script:</p>
                      <p className="text-xs text-gray-700 line-clamp-3">{item.generatedScript}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{selectedItem.brief.title}</h2>
                  <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Brief</h3>
                    <p className="text-sm text-gray-800 mt-1">{selectedItem.brief.description}</p>
                  </div>

                  {selectedItem.brief.keyMessages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600">Key Messages</h3>
                      <ul className="mt-1 space-y-1">
                        {selectedItem.brief.keyMessages.map((msg, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-purple-500 mt-0.5">•</span> {msg}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedItem.generatedScript && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600">Generated Script</h3>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
                        {selectedItem.generatedScript}
                      </div>
                    </div>
                  )}

                  {selectedItem.generatedVisualPrompt && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600">Visual Prompt</h3>
                      <div className="mt-1 p-3 bg-purple-50 rounded-lg text-sm text-purple-800">
                        {selectedItem.generatedVisualPrompt}
                      </div>
                    </div>
                  )}

                  {selectedItem.platformVariants.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600">Platform Variants</h3>
                      <div className="mt-1 space-y-2">
                        {selectedItem.platformVariants.map((v, i) => (
                          <div key={i} className="p-3 border border-gray-200 rounded-lg">
                            <span className="text-xs font-medium text-purple-600 uppercase">{v.platform}</span>
                            <p className="text-sm text-gray-700 mt-1">{v.caption}</p>
                            {v.hashtags.length > 0 && (
                              <p className="text-xs text-blue-600 mt-1">{v.hashtags.join(' ')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    onClick={() => { approveItem(selectedItem.id); setSelectedItem(null); }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Mock generation helpers — will be replaced with real GROQ/Gemini calls
function generateMockScript(brief: ContentBrief): string {
  const formatGuide: Record<string, string> = {
    heritage_spotlight: `Today we honour the legacy of ${brief.title}.\n\n${brief.keyMessages.join('\n\n')}\n\nTheir courage paved the way for communities like ours. As BLKOUT celebrates its 10th year, we carry their vision forward.\n\nBlack queer joy is resistance. Black queer love is revolution.\n\n${brief.hashtags.join(' ')}`,
    community_spotlight: `Meet a member of our incredible community.\n\n"${brief.description}"\n\n${brief.keyMessages.join('\n\n')}\n\nThis is what community looks like. By us, for us, always.\n\n${brief.hashtags.join(' ')}`,
    governance_update: `BLKOUT Governance Update\n\n${brief.description}\n\nKey updates:\n${brief.keyMessages.map(m => `• ${m}`).join('\n')}\n\nAs a Community Benefit Society, transparency is at our core.\n\n${brief.hashtags.join(' ')}`,
    aivor_wisdom: `Dear community,\n\n${brief.description}\n\nRemember: ${brief.keyMessages[0] || 'You are worthy of joy and celebration.'}\n\nWith love,\nAIvor\n\n${brief.hashtags.join(' ')}`,
    event_promotion: `You're invited!\n\n${brief.title}\n\n${brief.description}\n\n${brief.keyMessages.map(m => `✦ ${m}`).join('\n')}\n\nRSVP now — spaces are limited.\n\n${brief.hashtags.join(' ')}`,
    campaign_post: `${brief.description}\n\n${brief.keyMessages.join('\n\n')}\n\n${brief.hashtags.join(' ')}`,
    newsletter: `Subject: ${brief.title}\n\nDear community,\n\n${brief.description}\n\n${brief.keyMessages.map(m => `• ${m}`).join('\n')}\n\nWith love,\nBLKOUT`,
    custom: `${brief.description}\n\n${brief.keyMessages.join('\n\n')}\n\n${brief.hashtags.join(' ')}`,
  };

  return formatGuide[brief.format] || formatGuide.custom;
}

function generateMockVisualPrompt(brief: ContentBrief): string {
  return `${brief.visualDirection || 'BLKOUT brand style.'} ${brief.title}. Colour palette: deep purple (#7c3aed), sovereignty gold (#D4AF37), black. Typography: bold, modern. ${brief.format === 'heritage_spotlight' ? 'Historical portrait overlay with quote.' : brief.format === 'aivor_wisdom' ? 'Abstract, symbolic, uplifting.' : 'Clean, impactful design.'}`;
}

export default ContentPipeline;
