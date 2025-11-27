import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import {
  GeneratedAsset,
  MediaType,
  AspectRatio,
  ImageStyle,
  VideoStyle,
  AIProvider,
  AgentTask,
  AgentType
} from '@/types/socialsync';
import {
  generateImageAsset,
  checkProviderApiKey,
} from '@/services/socialsync/generation';
import { fetchAgentTasks, subscribeToTaskUpdates } from '@/services/socialsync/integration';
import * as SupabaseService from '@/services/socialsync/supabase';
import { scheduleAssetToQueue } from '@/hooks/useCalendarContent';
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Check,
  X,
  Clock,
  Image as ImageIcon,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
  Plus,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Edit3,
  Wand2,
  Calendar,
  Send
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import type { PlatformType } from '@/types';

// Priority badge colors
const priorityColors = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

// Platform icons
const platformIcons: Record<string, React.ReactNode> = {
  web: <Globe size={14} />,
  instagram: <Instagram size={14} />,
  linkedin: <Linkedin size={14} />,
  twitter: <Twitter size={14} />,
};

// Platform to PlatformType mapping
const platformMapping: Record<string, PlatformType> = {
  web: 'instagram', // Web hero defaults to Instagram
  instagram: 'instagram',
  linkedin: 'linkedin',
  twitter: 'twitter',
  facebook: 'facebook',
  tiktok: 'tiktok',
  youtube: 'youtube',
};

export function SocialSyncEditorial() {
  // Tasks State
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [editablePrompt, setEditablePrompt] = useState('');
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  // Approval State
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [isPushing, setIsPushing] = useState(false);

  // Scheduling State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [scheduleCaption, setScheduleCaption] = useState('');
  const [scheduleHashtags, setScheduleHashtags] = useState('');
  const [schedulePlatform, setSchedulePlatform] = useState<PlatformType>('instagram');
  const [isScheduling, setIsScheduling] = useState(false);
  const [lastApprovedAssetId, setLastApprovedAssetId] = useState<string | null>(null);

  // Library State
  const [completedAssets, setCompletedAssets] = useState<GeneratedAsset[]>([]);

  // Agent Prompt State (for creating new tasks)
  const [showAgentPrompt, setShowAgentPrompt] = useState(false);
  const [newTaskPrompt, setNewTaskPrompt] = useState('');
  const [newTaskPlatform, setNewTaskPlatform] = useState<string>('web');

  // API State
  const [hasApiKey, setHasApiKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tasks and assets on mount, subscribe to real-time updates
  useEffect(() => {
    loadTasks();
    loadAssets();
    checkProviderApiKey(AIProvider.GOOGLE).then(setHasApiKey);

    // Subscribe to real-time task updates
    const subscription = subscribeToTaskUpdates((updatedTasks) => {
      setTasks(updatedTasks);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Set default schedule date to tomorrow
  useEffect(() => {
    const tomorrow = addDays(new Date(), 1);
    setScheduleDate(format(tomorrow, 'yyyy-MM-dd'));
  }, []);

  const loadAssets = async () => {
    try {
      const assets = await SupabaseService.fetchGeneratedAssets();
      // Transform DB assets to GeneratedAsset type
      const transformed: GeneratedAsset[] = assets.map(a => ({
        id: a.id,
        type: a.media_type === 'video' ? MediaType.VIDEO : MediaType.IMAGE,
        url: a.url,
        prompt: a.prompt,
        timestamp: new Date(a.created_at).getTime(),
        aspectRatio: (a.aspect_ratio as AspectRatio) || AspectRatio.LANDSCAPE,
        provider: AIProvider.GOOGLE,
        isFavorite: false,
        tags: a.tags || []
      }));
      setCompletedAssets(transformed);
    } catch (e) {
      console.error('Failed to load assets:', e);
    }
  };

  const loadTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const fetchedTasks = await fetchAgentTasks();
      setTasks(fetchedTasks);
    } catch (e) {
      console.error('Failed to load tasks:', e);
      setError('Failed to load tasks from database');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleSelectTask = (task: AgentTask) => {
    setSelectedTask(task);
    setEditablePrompt(task.suggestedConfig?.prompt || '');
    setGeneratedImage(null);
    setApprovalStatus(null);
    setIsEditingPrompt(false);
  };

  const handleGenerate = async () => {
    if (!selectedTask || !editablePrompt) return;

    setIsGenerating(true);
    setError(null);
    setApprovalStatus(null);

    try {
      const aspectRatio = selectedTask.suggestedConfig?.aspectRatio || AspectRatio.LANDSCAPE;
      const url = await generateImageAsset(
        AIProvider.GOOGLE,
        editablePrompt,
        aspectRatio as AspectRatio
      );
      setGeneratedImage(url);
      setApprovalStatus('pending');
    } catch (e: any) {
      console.error('Generation failed:', e);
      setError(e?.message || 'Image generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!generatedImage || !selectedTask) return;

    setApprovalStatus('approved');
    setIsPushing(true);

    try {
      // Save asset to Supabase database
      const savedAsset = await SupabaseService.createGeneratedAsset({
        taskId: selectedTask.id,
        mediaType: 'image',
        url: generatedImage,
        storagePath: generatedImage, // In production, would upload to storage first
        aspectRatio: selectedTask.suggestedConfig?.aspectRatio || AspectRatio.LANDSCAPE,
        style: selectedTask.suggestedConfig?.style || '',
        prompt: editablePrompt,
        tags: [selectedTask.title, selectedTask.targetPlatform.toString()],
        metadata: {
          provider: AIProvider.GOOGLE,
          platform: selectedTask.targetPlatform,
        }
      });

      // Mark task as completed in database
      await SupabaseService.updateAgentTaskStatus(selectedTask.id, 'completed');

      // Store the asset ID for potential scheduling
      setLastApprovedAssetId(savedAsset.id);

      // Pre-fill scheduling fields
      const platform = platformMapping[selectedTask.targetPlatform.toString().toLowerCase()] || 'instagram';
      setSchedulePlatform(platform);
      setScheduleCaption(selectedTask.description || selectedTask.title);
      setScheduleHashtags('#BLKOUT #BlackQueerJoy #CommunityPower');

      // Create local asset object for immediate UI update
      const asset: GeneratedAsset = {
        id: savedAsset.id,
        type: MediaType.IMAGE,
        url: generatedImage,
        prompt: editablePrompt,
        timestamp: Date.now(),
        aspectRatio: selectedTask.suggestedConfig?.aspectRatio || AspectRatio.LANDSCAPE,
        provider: AIProvider.GOOGLE,
        isFavorite: false,
        tags: [selectedTask.title, selectedTask.targetPlatform.toString()]
      };

      // Add to completed library
      setCompletedAssets(prev => [asset, ...prev]);

      // Get remaining tasks after removing current
      const remainingTasks = tasks.filter(t => t.id !== selectedTask.id);
      setTasks(remainingTasks);

      // Show scheduling modal
      setShowScheduleModal(true);

    } catch (e: any) {
      console.error('Failed to save approved asset:', e);
      setError('Failed to save approved asset: ' + (e?.message || 'Unknown error'));
      setApprovalStatus('pending'); // Reset to allow retry
    } finally {
      setIsPushing(false);
    }
  };

  const handleSchedule = async () => {
    if (!lastApprovedAssetId || !scheduleDate) return;

    setIsScheduling(true);
    setError(null);

    try {
      // Parse date and time
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      let scheduledFor = new Date(scheduleDate);
      scheduledFor = setHours(scheduledFor, hours);
      scheduledFor = setMinutes(scheduledFor, minutes);

      // Parse hashtags
      const hashtags = scheduleHashtags
        .split(/[\s,]+/)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`);

      // Schedule the asset
      const result = await scheduleAssetToQueue({
        assetId: lastApprovedAssetId,
        platform: schedulePlatform,
        caption: scheduleCaption,
        hashtags,
        scheduledFor,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to schedule');
      }

      // Close modal and reset
      setShowScheduleModal(false);
      setLastApprovedAssetId(null);

      // Auto-select next task if available
      if (tasks.length > 0) {
        const nextTask = tasks[0];
        setSelectedTask(nextTask);
        setEditablePrompt(nextTask.suggestedConfig?.prompt || '');
        setGeneratedImage(null);
        setApprovalStatus(null);
        setIsEditingPrompt(false);
      } else {
        setSelectedTask(null);
        setGeneratedImage(null);
        setApprovalStatus(null);
      }

    } catch (e: any) {
      console.error('Failed to schedule:', e);
      setError('Failed to schedule: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsScheduling(false);
    }
  };

  const handleSkipSchedule = () => {
    setShowScheduleModal(false);
    setLastApprovedAssetId(null);

    // Auto-select next task if available
    if (tasks.length > 0) {
      const nextTask = tasks[0];
      setSelectedTask(nextTask);
      setEditablePrompt(nextTask.suggestedConfig?.prompt || '');
      setGeneratedImage(null);
      setApprovalStatus(null);
      setIsEditingPrompt(false);
    } else {
      setSelectedTask(null);
      setGeneratedImage(null);
      setApprovalStatus(null);
    }
  };

  const handleReject = () => {
    setApprovalStatus('rejected');
    setGeneratedImage(null);
    // Keep task selected for regeneration with modified prompt
  };

  const handleCreateTask = async () => {
    if (!newTaskPrompt.trim()) return;

    setError(null);

    try {
      // Determine aspect ratio based on platform
      const aspectRatio = newTaskPlatform === 'instagram' ? AspectRatio.SQUARE : AspectRatio.LANDSCAPE;

      // Save to Supabase database
      const savedTask = await SupabaseService.createAgentTask({
        agentType: 'manual_request',
        title: newTaskPrompt.substring(0, 50) + (newTaskPrompt.length > 50 ? '...' : ''),
        description: newTaskPrompt,
        priority: 'medium',
        targetPlatform: newTaskPlatform,
        suggestedConfig: {
          mediaType: MediaType.IMAGE,
          prompt: newTaskPrompt,
          aspectRatio: aspectRatio,
          style: ImageStyle.NONE,
          videoStyle: VideoStyle.NONE,
          overlayText: ''
        }
      });

      // Transform to local AgentTask type and add to UI
      const newTask: AgentTask = {
        id: savedTask.id,
        agentName: AgentType.EVENT_SCHEDULER,
        title: savedTask.title,
        description: savedTask.description || '',
        priority: 'MEDIUM',
        timestamp: new Date(savedTask.created_at).getTime(),
        targetPlatform: newTaskPlatform as any,
        suggestedConfig: savedTask.suggested_config as AgentTask['suggestedConfig']
      };

      setTasks(prev => [newTask, ...prev]);
      setNewTaskPrompt('');
      setShowAgentPrompt(false);
    } catch (e: any) {
      console.error('Failed to create task:', e);
      setError('Failed to create task: ' + (e?.message || 'Unknown error'));
    }
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-80px)] bg-slate-950 text-slate-200 overflow-hidden rounded-lg border border-slate-700">

        {/* Left Panel: Task Queue */}
        <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/50">
          {/* Header */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <Link to="/admin" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
                <ArrowLeft size={16} />
                <span>Back</span>
              </Link>
              <button
                onClick={loadTasks}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            <h1 className="text-lg font-bold">Content Queue</h1>
            <p className="text-xs text-slate-500 mt-1">{tasks.length} pending tasks</p>
          </div>

          {/* Add Task Button */}
          <div className="p-3 border-b border-slate-800">
            <button
              onClick={() => setShowAgentPrompt(!showAgentPrompt)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              <span>New Task</span>
            </button>

            {/* Agent Prompt Form */}
            {showAgentPrompt && (
              <div className="mt-3 p-3 bg-slate-800 rounded-lg space-y-3">
                <textarea
                  value={newTaskPrompt}
                  onChange={(e) => setNewTaskPrompt(e.target.value)}
                  placeholder="Describe the content you want to generate..."
                  className="w-full h-20 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-500"
                />
                <div className="flex gap-2">
                  <select
                    value={newTaskPlatform}
                    onChange={(e) => setNewTaskPlatform(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs"
                  >
                    <option value="web">Web Hero</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter/X</option>
                  </select>
                  <button
                    onClick={handleCreateTask}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-xs font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingTasks ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="animate-spin text-slate-500" size={24} />
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                <ImageIcon className="mx-auto mb-2 opacity-50" size={32} />
                <p>No pending tasks</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleSelectTask(task)}
                    className={`w-full p-3 text-left hover:bg-slate-800/50 transition-colors ${
                      selectedTask?.id === task.id ? 'bg-slate-800 border-l-2 border-indigo-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${
                            priorityColors[task.priority.toLowerCase() as keyof typeof priorityColors] || priorityColors.medium
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-slate-500">
                            {platformIcons[task.targetPlatform.toString().toLowerCase()] || platformIcons.web}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium truncate">{task.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{task.agentName}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-600 shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Panel: Editor */}
        <div className="flex-1 flex flex-col bg-slate-950">
          {selectedTask ? (
            <>
              {/* Task Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/30">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${
                    priorityColors[selectedTask.priority.toLowerCase() as keyof typeof priorityColors]
                  }`}>
                    {selectedTask.priority}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    {platformIcons[selectedTask.targetPlatform.toString().toLowerCase()]}
                    {selectedTask.targetPlatform.toString()}
                  </span>
                </div>
                <h2 className="text-xl font-bold">{selectedTask.title}</h2>
                <p className="text-sm text-slate-400 mt-1">{selectedTask.description}</p>
              </div>

              {/* Prompt Editor */}
              <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                    Generation Prompt
                  </label>
                  <button
                    onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    <Edit3 size={12} />
                    {isEditingPrompt ? 'Done' : 'Edit'}
                  </button>
                </div>
                {isEditingPrompt ? (
                  <textarea
                    value={editablePrompt}
                    onChange={(e) => setEditablePrompt(e.target.value)}
                    className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-sm text-slate-300 bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                    {editablePrompt}
                  </p>
                )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !hasApiKey}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} />
                      <span>{generatedImage ? 'Regenerate' : 'Generate Image'}</span>
                    </>
                  )}
                </button>

                {!hasApiKey && (
                  <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Gemini API key not configured
                  </p>
                )}
              </div>

              {/* Preview Area */}
              <div className="flex-1 p-4 overflow-auto">
                {generatedImage ? (
                  <div className="space-y-4">
                    {/* Image Preview */}
                    <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                      <img
                        src={generatedImage}
                        alt="Generated"
                        className="w-full h-auto"
                      />

                      {/* Approval Status Overlay */}
                      {approvalStatus === 'approved' && (
                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                          <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                            <Check size={20} />
                            <span className="font-bold">Approved</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Approval Buttons */}
                    {approvalStatus === 'pending' && (
                      <div className="flex gap-3">
                        <button
                          onClick={handleApprove}
                          disabled={isPushing}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          {isPushing ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <Check size={18} />
                          )}
                          <span>Approve & Save</span>
                        </button>
                        <button
                          onClick={handleReject}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                        >
                          <X size={18} />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}

                    {approvalStatus === 'rejected' && (
                      <div className="text-center py-3 bg-slate-800 rounded-lg">
                        <p className="text-sm text-slate-400">
                          Image rejected. Edit the prompt above and regenerate.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <Sparkles size={48} className="mx-auto mb-3 opacity-30" />
                      <p>Click "Generate Image" to create content</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-500">
                <ImageIcon size={64} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-1">Select a task</h3>
                <p className="text-sm">Choose a task from the queue to start generating</p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/10 border-t border-red-500/30">
              <p className="text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle size={14} />
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Right Panel: Asset Library */}
        <div className="w-72 border-l border-slate-800 flex flex-col bg-slate-900/50">
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold">Asset Library</h2>
                <p className="text-xs text-slate-500 mt-1">{completedAssets.length} completed</p>
              </div>
              <Link
                to="/admin/calendar"
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
              >
                <Calendar size={12} />
                Calendar
              </Link>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {completedAssets.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                <Clock className="mx-auto mb-2 opacity-50" size={24} />
                <p>Approved assets will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {completedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="aspect-square rounded-lg overflow-hidden bg-slate-800 border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
                  >
                    <img
                      src={asset.url}
                      alt={asset.prompt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md mx-4 overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Calendar size={20} className="text-indigo-400" />
                  Schedule to Calendar
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Schedule this content for publishing
                </p>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-4">
                {/* Platform Selection */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">
                    Platform
                  </label>
                  <select
                    value={schedulePlatform}
                    onChange={(e) => setSchedulePlatform(e.target.value as PlatformType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter/X</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="facebook">Facebook</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Caption */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">
                    Caption
                  </label>
                  <textarea
                    value={scheduleCaption}
                    onChange={(e) => setScheduleCaption(e.target.value)}
                    placeholder="Write your caption..."
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Hashtags */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">
                    Hashtags
                  </label>
                  <input
                    type="text"
                    value={scheduleHashtags}
                    onChange={(e) => setScheduleHashtags(e.target.value)}
                    placeholder="#BLKOUT #BlackQueerJoy"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Separate with spaces or commas</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 flex gap-3">
                <button
                  onClick={handleSkipSchedule}
                  className="flex-1 py-2.5 px-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleSchedule}
                  disabled={isScheduling || !scheduleDate}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isScheduling ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                  <span>Schedule</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
