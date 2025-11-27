
import { useState } from 'react';
import { X, Send, Bot, Sparkles, AlertCircle } from 'lucide-react';
import type { AgentType, PlatformType } from '@/types';

interface AgentPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: AgentTaskInput) => Promise<{ success: boolean; error?: string }>;
  preselectedAgent?: AgentType;
}

export interface AgentTaskInput {
  agentType: AgentType;
  title: string;
  description: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending';
  targetPlatform: string;
  suggestedConfig: Record<string, unknown>;
  assignedTo: string | null;
}

const AGENT_DETAILS: Record<AgentType, { name: string; description: string; icon: string; promptHints: string[] }> = {
  griot: {
    name: 'Griot',
    description: 'Creates authentic storytelling content rooted in Black feminist thought and community narratives.',
    icon: '📖',
    promptHints: [
      'Tell a community spotlight story about...',
      'Create a narrative post celebrating...',
      'Write an origin story for...',
      'Share the history of...',
    ],
  },
  listener: {
    name: 'Listener',
    description: 'Monitors social media and gathers community intelligence to inform content strategy.',
    icon: '👂',
    promptHints: [
      'Research trending topics about...',
      'Gather sentiment on...',
      'Monitor conversations about...',
      'Identify community needs around...',
    ],
  },
  weaver: {
    name: 'Weaver',
    description: 'Facilitates community engagement and builds relationships through thoughtful interactions.',
    icon: '🕸️',
    promptHints: [
      'Craft engagement responses for...',
      'Build connection around...',
      'Create conversation starters about...',
      'Develop community discussion on...',
    ],
  },
  strategist: {
    name: 'Strategist',
    description: 'Plans campaigns and coordinates content timing to maximize community impact.',
    icon: '🎯',
    promptHints: [
      'Plan a campaign for...',
      'Develop a content calendar about...',
      'Create a launch strategy for...',
      'Optimize timing for...',
    ],
  },
  herald: {
    name: 'Herald',
    description: 'Curates newsletters for engaged members and monthly digests for the wider community.',
    icon: '📬',
    promptHints: [
      'Create a weekly newsletter featuring...',
      'Compile community highlights about...',
      'Draft an announcement for...',
      'Summarize this week\'s events...',
    ],
  },
};

const PLATFORMS: { value: PlatformType | 'email' | 'all'; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'email', label: 'Email/Newsletter' },
  { value: 'all', label: 'All Platforms' },
];

export function AgentPromptModal({ isOpen, onClose, onSubmit, preselectedAgent }: AgentPromptModalProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(preselectedAgent || 'griot');
  const [prompt, setPrompt] = useState('');
  const [targetPlatform, setTargetPlatform] = useState<string>('instagram');
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const agentDetails = AGENT_DETAILS[selectedAgent];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a prompt for the agent');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const task: AgentTaskInput = {
      agentType: selectedAgent,
      title: prompt.slice(0, 100) + (prompt.length > 100 ? '...' : ''),
      description: prompt,
      priority,
      status: 'pending',
      targetPlatform,
      suggestedConfig: {
        originalPrompt: prompt,
        requestedAt: new Date().toISOString(),
      },
      assignedTo: null,
    };

    const result = await onSubmit(task);

    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setPrompt('');
        setSuccess(false);
        onClose();
      }, 1500);
    } else {
      setError(result.error || 'Failed to create task');
    }
  };

  const handlePromptHintClick = (hint: string) => {
    setPrompt(hint);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blkout-600 via-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Prompt an Agent</h2>
                <p className="text-white/80 text-sm">Create a task for your AI agents</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Agent Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Agent
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(AGENT_DETAILS) as AgentType[]).map((agentKey) => {
                const details = AGENT_DETAILS[agentKey];
                return (
                  <button
                    key={agentKey}
                    type="button"
                    onClick={() => setSelectedAgent(agentKey)}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      selectedAgent === agentKey
                        ? 'border-blkout-600 bg-blkout-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{details.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{details.name}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-sm text-gray-500">{agentDetails.description}</p>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`What would you like ${agentDetails.name} to do?`}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blkout-500 focus:border-transparent outline-none transition-all resize-none"
              rows={4}
            />
            {/* Prompt Hints */}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Sparkles size={12} />
                Try:
              </span>
              {agentDetails.promptHints.slice(0, 2).map((hint, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePromptHintClick(hint)}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>

          {/* Platform and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Platform
              </label>
              <select
                value={targetPlatform}
                onChange={(e) => setTargetPlatform(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blkout-500 focus:border-transparent outline-none transition-all"
              >
                {PLATFORMS.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blkout-500 focus:border-transparent outline-none transition-all"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700">
              <Sparkles size={18} />
              <span className="text-sm">Task created successfully! The agent will begin working on it.</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !prompt.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-blkout-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send to {agentDetails.name}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
