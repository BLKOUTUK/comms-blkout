
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Bot, Sparkles, AlertCircle, Copy, Check, RotateCcw, Brain, Users, Calendar, FileText, ChevronDown, ChevronUp, Award, Lightbulb } from 'lucide-react';
import type { AgentType, PlatformType } from '@/types';
import type { AgentExecutionResult } from '@/hooks/useAgentTasks';

// Focus trap hook for modal accessibility
function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        return; // Let the component handle escape
      }

      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus first element when modal opens
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return containerRef;
}

// Intelligence explanation generator based on community context
function generateIntelligenceExplanations(
  agentType: AgentType,
  context: AgentExecutionResult['communityContext']
): { title: string; explanation: string; icon: React.ReactNode; highlight?: boolean }[] {
  if (!context) return [];

  const explanations: { title: string; explanation: string; icon: React.ReactNode; highlight?: boolean }[] = [];

  // Community size insights
  if (context.members > 0) {
    const memberInsight = context.members > 500
      ? `Content optimized for a growing community of ${context.members.toLocaleString()} members`
      : `Tailored for an intimate community of ${context.members.toLocaleString()} members`;
    explanations.push({
      title: 'Community Scale',
      explanation: memberInsight,
      icon: <Users size={16} className="text-blkout-600" />,
    });
  }

  // Co-op member priority
  if (context.coop_members > 0) {
    explanations.push({
      title: 'Co-op Focus',
      explanation: `Prioritizing ${context.coop_members} co-op member voices and interests`,
      icon: <Award size={16} className="text-purple-600" />,
      highlight: true,
    });
  }

  // Verified creator spotlight
  if (context.verified_creators > 0) {
    explanations.push({
      title: 'Creator Intelligence',
      explanation: `Drawing from content trends among ${context.verified_creators} verified creators`,
      icon: <Sparkles size={16} className="text-yellow-600" />,
    });
  }

  // Events timing
  if (context.upcoming_events > 0) {
    const eventInsight = context.upcoming_events >= 3
      ? `Aligned with ${context.upcoming_events} upcoming events - high activity period`
      : `Referencing ${context.upcoming_events} upcoming community events`;
    explanations.push({
      title: 'Event Awareness',
      explanation: eventInsight,
      icon: <Calendar size={16} className="text-green-600" />,
      highlight: context.upcoming_events >= 3,
    });
  }

  // Content context
  if (context.weekly_articles > 0) {
    explanations.push({
      title: 'Content Context',
      explanation: `Informed by ${context.weekly_articles} articles published this week`,
      icon: <FileText size={16} className="text-blue-600" />,
    });
  }

  // Agent-specific insights
  const agentInsights: Record<AgentType, { title: string; explanation: string }> = {
    herald: {
      title: 'Newsletter Strategy',
      explanation: 'Curated for maximum engagement based on community reading patterns',
    },
    griot: {
      title: 'Storytelling Approach',
      explanation: 'Narrative style adapted to community cultural context and values',
    },
    listener: {
      title: 'Sentiment Analysis',
      explanation: 'Incorporating real-time community sentiment and conversation trends',
    },
    weaver: {
      title: 'Connection Strategy',
      explanation: 'Optimized to strengthen community bonds and facilitate dialogue',
    },
    strategist: {
      title: 'Strategic Timing',
      explanation: 'Content scheduled around peak community engagement windows',
    },
    concierge: {
      title: 'Personalization',
      explanation: 'Tailored guidance based on member journey stage and interests',
    },
  };

  explanations.push({
    title: agentInsights[agentType].title,
    explanation: agentInsights[agentType].explanation,
    icon: <Lightbulb size={16} className="text-orange-600" />,
  });

  return explanations;
}

interface AgentPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: AgentTaskInput) => Promise<AgentExecutionResult & { taskId?: string }>;
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
  concierge: {
    name: 'Concierge',
    description: 'Provides personalized member support, onboarding guidance, and helps navigate community resources.',
    icon: '🛎️',
    promptHints: [
      'Welcome a new member and guide them to...',
      'Help a member find resources about...',
      'Create an onboarding journey for...',
      'Connect a member with opportunities in...',
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
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [communityContext, setCommunityContext] = useState<AgentExecutionResult['communityContext'] | null>(null);
  const [isIntelligenceExpanded, setIsIntelligenceExpanded] = useState(true);

  const focusTrapRef = useFocusTrap(isOpen);
  const agentDetails = AGENT_DETAILS[selectedAgent];
  const intelligenceExplanations = generateIntelligenceExplanations(selectedAgent, communityContext ?? undefined);

  // Handle escape key
  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [handleEscapeKey]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a prompt for the agent');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setGeneratedContent(null);

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

    if (result.success && result.content) {
      setGeneratedContent(result.content);
      setCommunityContext(result.communityContext || null);
    } else {
      setError(result.error || 'Failed to execute agent');
    }
  };

  const handleCopyContent = async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setGeneratedContent(null);
    setCommunityContext(null);
    setPrompt('');
    setError(null);
    setIsIntelligenceExpanded(true);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handlePromptHintClick = (hint: string) => {
    setPrompt(hint);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-prompt-modal-title"
      aria-describedby="agent-prompt-modal-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={focusTrapRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blkout-600 via-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                {generatedContent ? <Sparkles size={24} /> : <Bot size={24} />}
              </div>
              <div>
                <h2 id="agent-prompt-modal-title" className="text-xl font-bold">
                  {generatedContent ? `${agentDetails.name} Generated Content` : 'Prompt an Agent'}
                </h2>
                <p id="agent-prompt-modal-description" className="text-white/80 text-sm">
                  {generatedContent ? 'Content ready to use' : 'Create a task for your AI agents'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close modal"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content */}
        {generatedContent ? (
          /* Result View */
          <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Intelligence Insights Panel */}
            {intelligenceExplanations.length > 0 && (
              <div className="bg-gradient-to-r from-blkout-50 via-purple-50 to-pink-50 rounded-xl border border-blkout-200/50 overflow-hidden">
                <button
                  onClick={() => setIsIntelligenceExpanded(!isIntelligenceExpanded)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Brain size={18} className="text-blkout-600" />
                    <span className="font-semibold text-gray-800">Intelligence Insights</span>
                    <span className="text-xs px-2 py-0.5 bg-blkout-100 text-blkout-700 rounded-full">
                      {intelligenceExplanations.length} factors
                    </span>
                  </div>
                  {isIntelligenceExpanded ? (
                    <ChevronUp size={18} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-500" />
                  )}
                </button>

                {isIntelligenceExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    <p className="text-xs text-gray-600 mb-3">
                      This content was generated using real-time IVOR intelligence from the BLKOUT community:
                    </p>
                    {intelligenceExplanations.map((insight, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${
                          insight.highlight
                            ? 'bg-white/70 border border-purple-200'
                            : 'bg-white/40 hover:bg-white/60'
                        }`}
                      >
                        <div className="mt-0.5">{insight.icon}</div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm text-gray-800 block">
                            {insight.title}
                          </span>
                          <span className="text-xs text-gray-600">
                            {insight.explanation}
                          </span>
                        </div>
                        {insight.highlight && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium uppercase tracking-wide">
                            Key
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Generated Content */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Generated Content</span>
                <button
                  onClick={handleCopyContent}
                  className="flex items-center gap-1 text-sm text-blkout-600 hover:text-blkout-700 transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                {generatedContent}
              </div>
            </div>

            {/* Original Prompt Reference */}
            <div className="text-sm text-gray-500 bg-gray-100 rounded-lg p-3">
              <span className="font-medium">Original prompt:</span> {prompt}
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-gray-200">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <RotateCcw size={16} />
                New Prompt
              </button>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-gradient-to-r from-blkout-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Agent Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Agent
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
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
              <label htmlFor="agent-prompt-input" className="block text-sm font-medium text-gray-700 mb-2">
                Your Prompt
              </label>
              <textarea
                id="agent-prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`What would you like ${agentDetails.name} to do?`}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blkout-500 focus:border-transparent outline-none transition-all resize-none"
                rows={4}
                aria-describedby="prompt-hints"
              />
              {/* Prompt Hints */}
              <div id="prompt-hints" className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Sparkles size={12} aria-hidden="true" />
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
                <label htmlFor="agent-target-platform" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Platform
                </label>
                <select
                  id="agent-target-platform"
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
                <label htmlFor="agent-task-priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="agent-task-priority"
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

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
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
                    Generating...
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
        )}
      </div>
    </div>
  );
}
