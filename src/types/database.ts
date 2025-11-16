
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      voice_and_values: {
        Row: {
          id: string
          version: string
          section_number: number
          section_title: string
          section_content: string
          section_key: string
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['voice_and_values']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['voice_and_values']['Insert']>
      }
      platforms: {
        Row: {
          id: string
          name: string
          display_name: string
          slug: string
          icon: string | null
          color: string | null
          is_active: boolean
          character_limit: number | null
          supports_images: boolean
          supports_video: boolean
          supports_carousel: boolean
          supports_threads: boolean
          max_images: number | null
          max_video_duration: number | null
          voice_section_reference: string | null
          posting_guidelines: Json
          optimal_times: Json
          hashtag_recommendations: Json
          content_format_preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['platforms']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['platforms']['Insert']>
      }
      agent_configurations: {
        Row: {
          id: string
          agent_name: 'griot' | 'listener' | 'weaver' | 'strategist'
          agent_display_name: string
          agent_role: string
          voice_sections_used: number[]
          voice_section_keys: string[]
          tone_description: string
          key_responsibilities: string[]
          content_focus: string[]
          system_prompt: string
          temperature: number
          max_tokens: number
          model_preferences: Json
          ivor_endpoints_used: string[]
          intelligence_refresh_frequency: number
          settings: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['agent_configurations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['agent_configurations']['Insert']>
      }
      campaigns: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          campaign_type: string
          status: 'planning' | 'active' | 'paused' | 'completed' | 'archived'
          priority: 'low' | 'medium' | 'high' | 'critical'
          start_date: string | null
          end_date: string | null
          goals: Json
          target_audience: Json
          key_messages: string[]
          content_pillars: string[]
          ivor_organizing_project_id: string | null
          ivor_campaign_id: string | null
          community_needs_addressed: string[]
          target_reach: number | null
          target_engagement_rate: number | null
          actual_reach: number
          actual_engagement_rate: number
          tags: string[]
          metadata: Json
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['campaigns']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>
      }
      content_calendar: {
        Row: {
          id: string
          title: string
          content_type: 'post' | 'thread' | 'carousel' | 'video' | 'story' | 'reel' | 'article'
          status: 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'failed' | 'cancelled'
          platform_id: string
          campaign_id: string | null
          scheduled_for: string | null
          published_at: string | null
          primary_content: string | null
          secondary_content: string | null
          hashtags: string[]
          mentions: string[]
          media_urls: string[]
          media_metadata: Json
          generated_by_agent: 'griot' | 'listener' | 'weaver' | 'strategist' | null
          generation_prompt: string | null
          ivor_intelligence_used: Json
          voice_sections_referenced: number[]
          tone_tags: string[]
          current_draft_id: string | null
          approval_required: boolean
          priority: 'low' | 'medium' | 'high' | 'urgent'
          internal_notes: string | null
          tags: string[]
          metadata: Json
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['content_calendar']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['content_calendar']['Insert']>
      }
      content_drafts: {
        Row: {
          id: string
          content_calendar_id: string
          version_number: number
          is_current: boolean
          draft_content: string
          draft_hashtags: string[]
          draft_mentions: string[]
          draft_metadata: Json
          generated_by_agent: 'griot' | 'listener' | 'weaver' | 'strategist'
          generation_method: 'full_ai' | 'ai_assisted' | 'manual' | 'template' | 'ivor_orchestrated' | null
          ai_model_used: string | null
          ai_prompt: string | null
          ai_temperature: number | null
          ivor_context: Json
          voice_sections_applied: number[]
          feedback: string | null
          changes_requested: string[]
          iteration_notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['content_drafts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['content_drafts']['Insert']>
      }
      content_approvals: {
        Row: {
          id: string
          content_calendar_id: string
          content_draft_id: string | null
          status: 'pending' | 'approved' | 'rejected' | 'revision_requested' | 'withdrawn'
          approver_id: string | null
          approver_role: string | null
          approval_notes: string | null
          changes_requested: string[]
          voice_compliance_score: number | null
          voice_compliance_notes: string | null
          tone_alignment_check: Json
          requested_at: string
          responded_at: string | null
          metadata: Json
        }
        Insert: Omit<Database['public']['Tables']['content_approvals']['Row'], 'id' | 'requested_at'>
        Update: Partial<Database['public']['Tables']['content_approvals']['Insert']>
      }
      ivor_intelligence: {
        Row: {
          id: string
          intelligence_type: string
          ivor_service: string
          ivor_endpoint: string
          intelligence_data: Json
          summary: string | null
          key_insights: string[]
          actionable_items: string[]
          relevance_score: number | null
          priority: 'low' | 'medium' | 'high' | 'critical'
          urgency: 'normal' | 'elevated' | 'high' | 'critical'
          data_timestamp: string
          expires_at: string | null
          is_stale: boolean
          times_used: number
          last_used_at: string | null
          used_in_content_ids: string[]
          tags: string[]
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ivor_intelligence']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['ivor_intelligence']['Insert']>
      }
      content_performance: {
        Row: {
          id: string
          content_calendar_id: string
          reach: number
          impressions: number
          engagement_count: number
          engagement_rate: number
          saves: number
          shares: number
          comments: number
          meaningful_interactions: number
          conversations_started: number
          resources_accessed: number
          community_actions_taken: number
          sentiment_score: number | null
          sentiment_summary: string | null
          positive_feedback_count: number
          constructive_feedback_count: number
          top_hashtags: string[]
          top_mentioned_themes: string[]
          performance_by_hour: Json
          peak_engagement_time: string | null
          reached_target_reach: boolean
          reached_target_engagement: boolean
          last_updated: string
          data_source: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['content_performance']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['content_performance']['Insert']>
      }
    }
  }
}
