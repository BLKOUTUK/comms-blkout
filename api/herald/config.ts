/**
 * Herald Configuration
 * Environment variables and constants
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
export const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const RESEND_API_KEY = process.env.RESEND_API_KEY;
export const SENDFOX_API_KEY = process.env.SENDFOX_API_KEY;
export const EDITOR_EMAIL = process.env.EDITOR_EMAIL || 'rob@blkoutuk.com';
export const EDITOR_NAME = process.env.EDITOR_NAME || 'Rob';
export const EDITOR_AVATAR_URL = process.env.EDITOR_AVATAR_URL || 'https://comms-blkout.vercel.app/images/editor-avatar.png';

// SendFox list mapping
export const SENDFOX_LISTS = {
  weekly_engaged: 538297,    // BLKOUT Hub (93 subscribers)
  monthly_circle: 538162,    // My First List (1,223 subscribers)
  coop_members: 591727,      // Coop Founding Members (13 subscribers)
  founder_members: 592260    // FounderMembers (4 subscribers)
};

// Newsletter content specs from PRD
export const NEWSLETTER_SPECS = {
  weekly: {
    name: 'Weekly Newsletter',
    highlights: 3,
    events: 5,
    resources: 2,
    tone: 'energetic, community-focused, action-oriented'
  },
  monthly: {
    name: 'Monthly Newsletter',
    highlights: 5,
    events: 4,
    resources: 3,
    stories: 2,
    tone: 'reflective, celebratory, comprehensive'
  }
};

// Initialize Supabase client
export const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;
