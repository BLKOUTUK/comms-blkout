#!/usr/bin/env npx ts-node
/**
 * BLKOUT Board Recruitment Campaign - Social Media Scheduler
 *
 * This script adds the board recruitment drip campaign to the social media queue.
 *
 * Prerequisites:
 * 1. Images created in Canva and exported
 * 2. Images uploaded to Supabase Storage or accessible URL
 * 3. Environment variables set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 *
 * Usage:
 *   npx ts-node scripts/schedule-board-recruitment-campaign.ts
 *
 * Or with custom image base URL:
 *   IMAGE_BASE_URL=https://your-cdn.com/images npx ts-node scripts/schedule-board-recruitment-campaign.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bgjengudzfickgomjqmz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL || 'https://bgjengudzfickgomjqmz.supabase.co/storage/v1/object/public/campaign-assets/board-recruitment-2026';

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable required');
  console.log('\nSet it with:');
  console.log('export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Campaign Data - 5 positions, drip scheduled
const CAMPAIGN_POSTS = [
  {
    position_id: 'chair',
    position_title: 'Chair',
    position_emoji: '🪑',
    tagline: 'Lead our governance with vision',
    description: 'Guide board meetings and strategic direction. Be the voice of BLKOUT in the world. Champion our community\'s vision.',
    skills: 'Leadership · Facilitation · Strategic thinking',
    image_file: 'chair-slide.png',
    scheduled_date: '2026-01-28T12:00:00Z',
    platforms: ['instagram', 'linkedin', 'twitter'] as const,
  },
  {
    position_id: 'treasurer',
    position_title: 'Treasurer',
    position_emoji: '💷',
    tagline: 'Steward our community resources',
    description: 'Manage our finances with care and transparency. Ensure every pound serves our community\'s liberation.',
    skills: 'Financial literacy · Budgeting · Accountability',
    image_file: 'treasurer-slide.png',
    scheduled_date: '2026-01-30T12:00:00Z',
    platforms: ['instagram', 'linkedin', 'twitter'] as const,
  },
  {
    position_id: 'secretary',
    position_title: 'Secretary',
    position_emoji: '📋',
    tagline: 'Keep our house in order',
    description: 'Document our decisions and keep us accountable. Ensure our governance runs smoothly.',
    skills: 'Organisation · Documentation · Attention to detail',
    image_file: 'secretary-slide.png',
    scheduled_date: '2026-02-01T12:00:00Z',
    platforms: ['instagram', 'linkedin', 'twitter'] as const,
  },
  {
    position_id: 'technology_director',
    position_title: 'Technology Director',
    position_emoji: '💻',
    tagline: 'Guide our digital future',
    description: 'Shape how technology serves our community. Lead our platform development and digital strategy.',
    skills: 'Tech awareness · Digital strategy · Innovation mindset',
    image_file: 'technology-director-slide.png',
    scheduled_date: '2026-02-04T12:00:00Z',
    platforms: ['instagram', 'linkedin', 'twitter'] as const,
  },
  {
    position_id: 'community_director',
    position_title: 'Community Director',
    position_emoji: '🤝',
    tagline: 'Amplify grassroots voices',
    description: 'Be the bridge between board and community. Ensure every decision centers those we serve.',
    skills: 'Community connection · Listening · Advocacy',
    image_file: 'community-director-slide.png',
    scheduled_date: '2026-02-07T12:00:00Z',
    platforms: ['instagram', 'linkedin', 'twitter'] as const,
  },
];

// Platform-specific caption generators
function generateCaption(post: typeof CAMPAIGN_POSTS[0], platform: string): string {
  const baseCaption = `${post.position_emoji} ${post.position_title.toUpperCase()}

${post.tagline}

${post.description}

What you'll bring: ${post.skills}

No formal qualifications needed. Just heart for the work and 4-6 hours monthly.

🗓️ Deadline: February 14, 2026
📍 Apply: blkoutuk.com/governance
💜 Join BLKOUTHUB first: blkouthub.com`;

  if (platform === 'twitter') {
    // Shorter version for Twitter (280 char limit)
    return `${post.position_emoji} BLKOUT Board: ${post.position_title}

${post.tagline}

No formal qualifications needed. Just heart for the work.

Apply by Feb 14 → blkoutuk.com/governance

#BLKOUT #BlackQueerLeadership`;
  }

  return baseCaption;
}

function getHashtags(platform: string): string[] {
  const baseHashtags = [
    'BLKOUT',
    'BlackQueerLeadership',
    'CommunityGovernance',
    'JoinOurBoard',
    'BlackQueerUK',
  ];

  if (platform === 'linkedin') {
    return [...baseHashtags, 'BoardOfDirectors', 'NonProfit', 'Governance'];
  }

  if (platform === 'instagram') {
    return [...baseHashtags, 'BlackQueerCommunity', 'LiberationTech', 'CooperativeGovernance'];
  }

  return baseHashtags;
}

async function createAsset(post: typeof CAMPAIGN_POSTS[0]): Promise<string | null> {
  const imageUrl = `${IMAGE_BASE_URL}/${post.image_file}`;

  const { data, error } = await supabase
    .from('generated_assets')
    .insert({
      media_type: 'image',
      url: imageUrl,
      storage_path: `campaign-assets/board-recruitment-2026/${post.image_file}`,
      aspect_ratio: '1:1',
      style: 'board-recruitment',
      prompt: `Board recruitment - ${post.position_title}`,
      overlay_text: post.tagline,
      tags: ['board-recruitment', 'campaign', post.position_id],
      metadata: {
        campaign: 'board-recruitment-2026',
        position: post.position_id,
      },
    })
    .select('id')
    .single();

  if (error) {
    console.error(`❌ Failed to create asset for ${post.position_title}:`, error.message);
    return null;
  }

  return data.id;
}

async function queuePost(
  post: typeof CAMPAIGN_POSTS[0],
  platform: string,
  assetId: string
): Promise<boolean> {
  const caption = generateCaption(post, platform);
  const hashtags = getHashtags(platform);

  const { error } = await supabase
    .from('social_media_queue')
    .insert({
      asset_id: assetId,
      platform,
      caption,
      hashtags,
      scheduled_for: post.scheduled_date,
      status: 'queued',
    });

  if (error) {
    console.error(`❌ Failed to queue ${post.position_title} for ${platform}:`, error.message);
    return false;
  }

  return true;
}

async function main() {
  console.log('🚀 BLKOUT Board Recruitment Campaign Scheduler\n');
  console.log(`📁 Image base URL: ${IMAGE_BASE_URL}\n`);

  let totalQueued = 0;
  let totalFailed = 0;

  for (const post of CAMPAIGN_POSTS) {
    console.log(`\n📌 Processing: ${post.position_emoji} ${post.position_title}`);
    console.log(`   Scheduled: ${new Date(post.scheduled_date).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`);

    // Create asset entry
    const assetId = await createAsset(post);
    if (!assetId) {
      console.log(`   ⚠️ Skipping platforms due to asset creation failure`);
      totalFailed += post.platforms.length;
      continue;
    }
    console.log(`   ✅ Asset created: ${assetId}`);

    // Queue for each platform
    for (const platform of post.platforms) {
      const success = await queuePost(post, platform, assetId);
      if (success) {
        console.log(`   ✅ Queued for ${platform}`);
        totalQueued++;
      } else {
        totalFailed++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 CAMPAIGN SCHEDULING COMPLETE');
  console.log('='.repeat(50));
  console.log(`✅ Successfully queued: ${totalQueued} posts`);
  console.log(`❌ Failed: ${totalFailed} posts`);
  console.log(`\n📅 Campaign runs: Jan 28 - Feb 7, 2026`);
  console.log(`⏰ N8N will publish when scheduled_for <= now`);
  console.log('\n💡 Next steps:');
  console.log('   1. Ensure images are uploaded to:', IMAGE_BASE_URL);
  console.log('   2. Verify N8N workflow is active');
  console.log('   3. Check platform OAuth credentials are configured');
}

main().catch(console.error);
