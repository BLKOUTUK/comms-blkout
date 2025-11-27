import { createClient } from '@supabase/supabase-js';

// Type definitions for database tables
export interface AgentTask {
    id: string;
    agent_type: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    target_platform: string;
    suggested_config: Record<string, any>;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    assigned_to: string | null;
}

export interface GeneratedAssetRow {
    id: string;
    task_id: string | null;
    media_type: string;
    url: string;
    storage_path: string;
    aspect_ratio: string | null;
    style: string | null;
    prompt: string;
    overlay_text: string | null;
    logo_id: string | null;
    tags: string[];
    metadata: Record<string, any>;
    created_by: string | null;
    created_at: string;
}

export interface SocialMediaQueue {
    id: string;
    asset_id: string;
    platform: string;
    status: string;
    scheduled_for: string | null;
    published_at: string | null;
    platform_post_id: string | null;
    caption: string | null;
    hashtags: string[];
    error_message: string | null;
    retry_count: number;
    created_at: string;
    updated_at: string;
}

export type AgentTaskInsert = Partial<AgentTask>;
export type AgentTaskUpdate = Partial<AgentTask>;
export type GeneratedAssetInsert = Partial<GeneratedAssetRow>;
export type GeneratedAssetUpdate = Partial<GeneratedAssetRow>;
export type SocialMediaQueueInsert = Partial<SocialMediaQueue>;
export type SocialMediaQueueUpdate = Partial<SocialMediaQueue>;

// Initialize Supabase client (untyped for flexibility)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetch all pending agent tasks from socialsync_agent_tasks table
 */
export async function fetchAgentTasks(): Promise<AgentTask[]> {
    const { data, error } = await supabase
        .from('socialsync_agent_tasks')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching agent tasks:', error);
        throw error;
    }

    return data || [];
}

/**
 * Update agent task status
 */
export async function updateAgentTaskStatus(
    taskId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
    assignedTo?: string
): Promise<void> {
    const updates: AgentTaskUpdate = {
        status,
        updated_at: new Date().toISOString(),
    };

    if (assignedTo) {
        updates.assigned_to = assignedTo;
    }

    if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from('socialsync_agent_tasks')
        .update(updates)
        .eq('id', taskId);

    if (error) {
        console.error('Error updating task status:', error);
        throw error;
    }
}

/**
 * Create a new generated asset record
 */
export async function createGeneratedAsset(asset: {
    taskId?: string;
    mediaType: 'image' | 'video';
    url: string;
    storagePath: string;
    aspectRatio: string;
    style: string;
    prompt: string;
    overlayText?: string;
    logoId?: string;
    tags?: string[];
    metadata?: Record<string, any>;
}): Promise<GeneratedAssetRow> {
    const { data: { user } } = await supabase.auth.getUser();

    const assetData: GeneratedAssetInsert = {
        task_id: asset.taskId || null,
        media_type: asset.mediaType,
        url: asset.url,
        storage_path: asset.storagePath,
        aspect_ratio: asset.aspectRatio,
        style: asset.style,
        prompt: asset.prompt,
        overlay_text: asset.overlayText || null,
        logo_id: asset.logoId || null,
        tags: asset.tags || [],
        metadata: asset.metadata || {},
        created_by: user?.id || null,
    };

    const { data, error } = await supabase
        .from('generated_assets')
        .insert(assetData)
        .select()
        .single();

    if (error) {
        console.error('Error creating generated asset:', error);
        throw error;
    }

    return data;
}

/**
 * Fetch all generated assets
 */
export async function fetchGeneratedAssets(): Promise<GeneratedAssetRow[]> {
    const { data, error } = await supabase
        .from('generated_assets')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching generated assets:', error);
        throw error;
    }

    return data || [];
}

/**
 * Add asset to social media publishing queue
 */
export async function addToPublishingQueue(
    assetId: string,
    platform: 'instagram' | 'tiktok' | 'linkedin' | 'twitter' | 'youtube',
    caption?: string,
    hashtags?: string[],
    scheduledFor?: Date
): Promise<SocialMediaQueue> {
    const queueData: SocialMediaQueueInsert = {
        asset_id: assetId,
        platform,
        caption: caption || null,
        hashtags: hashtags || [],
        scheduled_for: scheduledFor?.toISOString() || null,
        status: 'queued',
    };

    const { data, error } = await supabase
        .from('social_media_queue')
        .insert(queueData)
        .select()
        .single();

    if (error) {
        console.error('Error adding to publishing queue:', error);
        throw error;
    }

    return data;
}

/**
 * Upload asset to Supabase Storage
 */
export async function uploadAssetToStorage(
    file: Blob,
    fileName: string,
    bucket: string = 'generated-assets'
): Promise<string> {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        console.error('Error uploading to storage:', error);
        throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

    return publicUrl;
}

/**
 * Subscribe to real-time agent task updates
 */
export function subscribeToAgentTasks(callback: (payload: any) => void) {
    return supabase
        .channel('agent_tasks_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'socialsync_agent_tasks',
            },
            callback
        )
        .subscribe();
}

/**
 * Create a new agent task
 */
export async function createAgentTask(task: {
    agentType: string;
    title: string;
    description?: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    targetPlatform: string;
    suggestedConfig: Record<string, any>;
}): Promise<AgentTask> {
    const taskData: AgentTaskInsert = {
        agent_type: task.agentType,
        title: task.title,
        description: task.description || null,
        priority: task.priority,
        status: 'pending',
        target_platform: task.targetPlatform,
        suggested_config: task.suggestedConfig,
    };

    const { data, error } = await supabase
        .from('socialsync_agent_tasks')
        .insert(taskData)
        .select()
        .single();

    if (error) {
        console.error('Error creating agent task:', error);
        throw error;
    }

    return data;
}

