import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Settings, Save, RotateCcw, Sliders, MessageSquare, Zap, Clock, Code, Database, Cpu, FileText } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AgentType } from '@/types';

// Focus trap hook for modal accessibility
function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    const getFocusableElements = () => {
      return container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return;
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

    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return containerRef;
}

interface AgentConfiguration {
  id: string;
  agent_name: AgentType;
  agent_display_name: string;
  agent_role: string;
  tone_description: string;
  key_responsibilities: string[];
  content_focus: string[];
  voice_section_keys: string[];
  voice_sections_used: string[];
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  intelligence_refresh_frequency: number;
  ivor_endpoints_used: string[];
  model_preferences: {
    preferred_model?: string;
    fallback_model?: string;
    use_streaming?: boolean;
  };
  is_active: boolean;
  settings: Record<string, unknown>;
}

interface AgentConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

// Available IVOR endpoints for agents to use
const AVAILABLE_IVOR_ENDPOINTS = [
  { id: 'resources', label: 'Resources API', description: 'Access community resources' },
  { id: 'conversations', label: 'Conversations API', description: 'Chat history and context' },
  { id: 'members', label: 'Members API', description: 'Governance member data' },
  { id: 'events', label: 'Events API', description: 'Community events calendar' },
  { id: 'articles', label: 'Articles API', description: 'Newsroom content' },
  { id: 'intelligence', label: 'Intelligence API', description: 'Community insights' },
];

// Available voice sections
const AVAILABLE_VOICE_SECTIONS = [
  'mission_and_values',
  'tone_guidelines',
  'community_voice',
  'storytelling_principles',
  'inclusive_language',
  'cultural_authenticity',
];

const defaultConfigs: Record<AgentType, Partial<AgentConfiguration>> = {
  griot: {
    tone_description: 'Warm, storytelling voice rooted in Black feminist thought',
    temperature: 0.8,
    max_tokens: 2500,
    ivor_endpoints_used: ['resources', 'members', 'articles'],
  },
  listener: {
    tone_description: 'Observant, analytical, trend-aware',
    temperature: 0.5,
    max_tokens: 1500,
    ivor_endpoints_used: ['conversations', 'intelligence', 'events'],
  },
  weaver: {
    tone_description: 'Engaging, community-focused, relationship-building',
    temperature: 0.7,
    max_tokens: 1000,
    ivor_endpoints_used: ['members', 'events', 'resources'],
  },
  strategist: {
    tone_description: 'Strategic, data-informed, campaign-oriented',
    temperature: 0.6,
    max_tokens: 2000,
    ivor_endpoints_used: ['intelligence', 'members', 'articles'],
  },
  herald: {
    tone_description: 'Curated, celebratory, community-connecting',
    temperature: 0.7,
    max_tokens: 3000,
    ivor_endpoints_used: ['articles', 'events', 'members', 'resources'],
  },
  concierge: {
    tone_description: 'Helpful, welcoming, supportive',
    temperature: 0.7,
    max_tokens: 1500,
    ivor_endpoints_used: ['resources', 'members', 'events', 'conversations'],
  },
};

export function AgentConfigurationModal({ isOpen, onClose, onSave }: AgentConfigurationModalProps) {
  const [configs, setConfigs] = useState<AgentConfiguration[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [editedConfig, setEditedConfig] = useState<AgentConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const focusTrapRef = useFocusTrap(isOpen);

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

  useEffect(() => {
    if (isOpen) {
      fetchConfigurations();
    }
  }, [isOpen]);

  const fetchConfigurations = async () => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setError('Database not configured');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('agent_configurations')
        .select('*')
        .order('agent_name');

      if (fetchError) throw fetchError;

      setConfigs(data || []);
      if (data && data.length > 0 && !selectedAgent) {
        setSelectedAgent(data[0].agent_name);
        setEditedConfig(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentSelect = (agentName: AgentType) => {
    const config = configs.find(c => c.agent_name === agentName);
    setSelectedAgent(agentName);
    setEditedConfig(config || null);
    setSuccessMessage(null);
  };

  const handleFieldChange = (field: keyof AgentConfiguration, value: unknown) => {
    if (!editedConfig) return;
    setEditedConfig({ ...editedConfig, [field]: value });
    setSuccessMessage(null);
  };

  const handleArrayFieldChange = (field: 'key_responsibilities' | 'content_focus' | 'voice_section_keys', index: number, value: string) => {
    if (!editedConfig) return;
    const newArray = [...(editedConfig[field] || [])];
    newArray[index] = value;
    setEditedConfig({ ...editedConfig, [field]: newArray });
  };

  const handleAddArrayItem = (field: 'key_responsibilities' | 'content_focus' | 'voice_section_keys') => {
    if (!editedConfig) return;
    const newArray = [...(editedConfig[field] || []), ''];
    setEditedConfig({ ...editedConfig, [field]: newArray });
  };

  const handleRemoveArrayItem = (field: 'key_responsibilities' | 'content_focus' | 'voice_section_keys', index: number) => {
    if (!editedConfig) return;
    const newArray = [...(editedConfig[field] || [])];
    newArray.splice(index, 1);
    setEditedConfig({ ...editedConfig, [field]: newArray });
  };

  const handleSave = async () => {
    if (!editedConfig || !isSupabaseConfigured()) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error: updateError } = await supabase
        .from('agent_configurations')
        .update({
          agent_display_name: editedConfig.agent_display_name,
          agent_role: editedConfig.agent_role,
          tone_description: editedConfig.tone_description,
          key_responsibilities: editedConfig.key_responsibilities,
          content_focus: editedConfig.content_focus,
          voice_section_keys: editedConfig.voice_section_keys,
          voice_sections_used: editedConfig.voice_sections_used,
          system_prompt: editedConfig.system_prompt,
          temperature: editedConfig.temperature,
          max_tokens: editedConfig.max_tokens,
          intelligence_refresh_frequency: editedConfig.intelligence_refresh_frequency,
          ivor_endpoints_used: editedConfig.ivor_endpoints_used,
          model_preferences: editedConfig.model_preferences,
          is_active: editedConfig.is_active,
          settings: editedConfig.settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editedConfig.id);

      if (updateError) throw updateError;

      setSuccessMessage('Configuration saved successfully');
      await fetchConfigurations();
      onSave?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!selectedAgent || !editedConfig) return;
    const defaults = defaultConfigs[selectedAgent];
    setEditedConfig({
      ...editedConfig,
      ...defaults,
    });
  };

  if (!isOpen) return null;

  const agentColors: Record<AgentType, string> = {
    griot: 'purple',
    listener: 'blue',
    weaver: 'green',
    strategist: 'orange',
    herald: 'indigo',
    concierge: 'pink',
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="config-modal-title"
      aria-describedby="config-modal-description"
    >
      <div
        ref={focusTrapRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blkout-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blkout-100 rounded-lg flex items-center justify-center">
              <Settings size={24} className="text-blkout-600" aria-hidden="true" />
            </div>
            <div>
              <h2 id="config-modal-title" className="text-xl font-semibold text-gray-900">Agent Configuration</h2>
              <p id="config-modal-description" className="text-sm text-gray-600">Customize agent behavior and capabilities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blkout-500"
            aria-label="Close configuration modal"
          >
            <X size={20} className="text-gray-500" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Agent Sidebar */}
          <div className="w-48 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-3 space-y-1">
              {configs.map((config) => {
                const color = agentColors[config.agent_name] || 'gray';
                const isSelected = selectedAgent === config.agent_name;
                return (
                  <button
                    key={config.id}
                    onClick={() => handleAgentSelect(config.agent_name)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      isSelected
                        ? `bg-${color}-100 border border-${color}-300 text-${color}-800`
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="font-medium capitalize text-sm">{config.agent_name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuration Form */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blkout-600"></div>
              </div>
            ) : error && !editedConfig ? (
              <div className="text-center py-12 text-red-600">{error}</div>
            ) : editedConfig ? (
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Identity
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="agent-display-name" className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                      <input
                        id="agent-display-name"
                        type="text"
                        value={editedConfig.agent_display_name || ''}
                        onChange={(e) => handleFieldChange('agent_display_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="agent-role" className="block text-sm font-medium text-gray-700 mb-1">Role Description</label>
                      <textarea
                        id="agent-role"
                        value={editedConfig.agent_role || ''}
                        onChange={(e) => handleFieldChange('agent_role', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="agent-tone" className="block text-sm font-medium text-gray-700 mb-1">Tone Description</label>
                      <input
                        id="agent-tone"
                        type="text"
                        value={editedConfig.tone_description || ''}
                        onChange={(e) => handleFieldChange('tone_description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-transparent"
                        placeholder="e.g., Warm, storytelling, community-focused"
                      />
                    </div>
                  </div>
                </div>

                {/* AI Parameters */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Sliders size={16} />
                    AI Parameters
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="agent-temperature" className="block text-sm font-medium text-gray-700 mb-1">
                        Temperature
                        <span className="text-xs text-gray-500 ml-1">({editedConfig.temperature})</span>
                      </label>
                      <input
                        id="agent-temperature"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={editedConfig.temperature || 0.7}
                        onChange={(e) => handleFieldChange('temperature', parseFloat(e.target.value))}
                        className="w-full accent-blkout-600"
                        aria-describedby="temp-range-description"
                      />
                      <div id="temp-range-description" className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Focused</span>
                        <span>Creative</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="agent-max-tokens" className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
                      <input
                        id="agent-max-tokens"
                        type="number"
                        value={editedConfig.max_tokens || 2000}
                        onChange={(e) => handleFieldChange('max_tokens', parseInt(e.target.value))}
                        min={500}
                        max={8000}
                        step={100}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="agent-refresh-freq" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <Clock size={12} aria-hidden="true" />
                        Refresh (secs)
                      </label>
                      <input
                        id="agent-refresh-freq"
                        type="number"
                        value={editedConfig.intelligence_refresh_frequency || 3600}
                        onChange={(e) => handleFieldChange('intelligence_refresh_frequency', parseInt(e.target.value))}
                        min={60}
                        max={86400}
                        step={60}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Key Responsibilities */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Zap size={16} />
                    Key Responsibilities
                  </h3>
                  <div className="space-y-2">
                    {(editedConfig.key_responsibilities || []).map((resp, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={resp}
                          onChange={(e) => handleArrayFieldChange('key_responsibilities', idx, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-transparent text-sm"
                        />
                        <button
                          onClick={() => handleRemoveArrayItem('key_responsibilities', idx)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddArrayItem('key_responsibilities')}
                      className="text-sm text-blkout-600 hover:text-blkout-700"
                    >
                      + Add responsibility
                    </button>
                  </div>
                </div>

                {/* Content Focus */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText size={16} />
                    Content Focus Areas
                  </h3>
                  <div className="space-y-2">
                    {(editedConfig.content_focus || []).map((focus, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={focus}
                          onChange={(e) => handleArrayFieldChange('content_focus', idx, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-transparent text-sm"
                        />
                        <button
                          onClick={() => handleRemoveArrayItem('content_focus', idx)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddArrayItem('content_focus')}
                      className="text-sm text-blkout-600 hover:text-blkout-700"
                    >
                      + Add focus area
                    </button>
                  </div>
                </div>

                {/* IVOR Endpoints */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Database size={16} />
                    IVOR Data Sources
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Select which IVOR APIs this agent can access for intelligence
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_IVOR_ENDPOINTS.map((endpoint) => {
                      const isSelected = (editedConfig.ivor_endpoints_used || []).includes(endpoint.id);
                      return (
                        <label
                          key={endpoint.id}
                          className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-blkout-300 bg-blkout-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const current = editedConfig.ivor_endpoints_used || [];
                              if (e.target.checked) {
                                handleFieldChange('ivor_endpoints_used', [...current, endpoint.id]);
                              } else {
                                handleFieldChange('ivor_endpoints_used', current.filter(id => id !== endpoint.id));
                              }
                            }}
                            className="mt-0.5 accent-blkout-600"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900">{endpoint.label}</span>
                            <p className="text-xs text-gray-500">{endpoint.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Voice Sections */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Voice & Values Sections
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Which voice guidelines should inform this agent's outputs
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_VOICE_SECTIONS.map((section) => {
                      const isSelected = (editedConfig.voice_sections_used || []).includes(section);
                      return (
                        <button
                          key={section}
                          type="button"
                          onClick={() => {
                            const current = editedConfig.voice_sections_used || [];
                            if (isSelected) {
                              handleFieldChange('voice_sections_used', current.filter(s => s !== section));
                            } else {
                              handleFieldChange('voice_sections_used', [...current, section]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-purple-100 text-purple-700 border border-purple-300'
                              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {section.replace(/_/g, ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* System Prompt */}
                <div>
                  <h3 id="system-prompt-heading" className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Code size={16} aria-hidden="true" />
                    System Prompt
                  </h3>
                  <p id="system-prompt-description" className="text-xs text-gray-500 mb-2">
                    Core instructions that define this agent's behavior and personality
                  </p>
                  <textarea
                    id="agent-system-prompt"
                    value={editedConfig.system_prompt || ''}
                    onChange={(e) => handleFieldChange('system_prompt', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-transparent text-sm font-mono"
                    placeholder="You are a helpful AI assistant that..."
                    aria-labelledby="system-prompt-heading"
                    aria-describedby="system-prompt-description"
                  />
                  <p className="text-xs text-gray-400 mt-1" aria-live="polite">
                    {(editedConfig.system_prompt || '').length} characters
                  </p>
                </div>

                {/* Model Preferences */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Cpu size={16} aria-hidden="true" />
                    Model Preferences
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="preferred-model" className="block text-xs font-medium text-gray-600 mb-1">
                        Preferred Model
                      </label>
                      <select
                        id="preferred-model"
                        value={editedConfig.model_preferences?.preferred_model || 'gemini-1.5-flash'}
                        onChange={(e) => handleFieldChange('model_preferences', {
                          ...editedConfig.model_preferences,
                          preferred_model: e.target.value,
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-transparent text-sm"
                      >
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                        <option value="claude-3-haiku">Claude 3 Haiku</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="fallback-model" className="block text-xs font-medium text-gray-600 mb-1">
                        Fallback Model
                      </label>
                      <select
                        id="fallback-model"
                        value={editedConfig.model_preferences?.fallback_model || 'gemini-1.5-flash'}
                        onChange={(e) => handleFieldChange('model_preferences', {
                          ...editedConfig.model_preferences,
                          fallback_model: e.target.value,
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-transparent text-sm"
                      >
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3">
                  <label htmlFor="agent-active-toggle" className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="agent-active-toggle"
                      type="checkbox"
                      checked={editedConfig.is_active}
                      onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                      className="sr-only peer"
                      role="switch"
                      aria-checked={editedConfig.is_active}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blkout-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blkout-600" aria-hidden="true"></div>
                  </label>
                  <span id="agent-status-label" className="text-sm font-medium text-gray-700">
                    Agent is {editedConfig.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">Select an agent to configure</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {error && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>
          )}
          {successMessage && (
            <div className="mb-3 text-sm text-green-600 bg-green-50 px-3 py-2 rounded">{successMessage}</div>
          )}
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw size={16} />
              Reset to Defaults
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !editedConfig}
                className="flex items-center gap-2 px-4 py-2 bg-blkout-600 text-white rounded-lg hover:bg-blkout-700 disabled:opacity-50 transition-colors"
              >
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
