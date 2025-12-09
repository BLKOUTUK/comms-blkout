# BLKOUT Communications Platform (comms-blkout)

## Technical Documentation

**Version**: 1.0
**Last Updated**: December 2025
**Production URL**: https://comms-blkout.vercel.app
**Repository**: `/home/robbe/ACTIVE_PROJECTS/comms-blkout`

---

## Overview

The **comms-blkout** module is BLKOUT UK's centralized communications hub for managing community content, AI-powered content generation, and multi-platform social media coordination. It serves as the backbone for authentic storytelling rooted in Black feminist thought, enabling the organisation to maintain consistent, values-driven messaging across all digital channels.

### Core Purpose

- **Content Management**: Centralized hub for creating, scheduling, and publishing community communications
- **AI Agent System**: Five specialized AI agents that assist with content creation and community engagement
- **Multi-Platform Publishing**: Coordinated publishing to Instagram, TikTok, LinkedIn, Twitter/X, and YouTube
- **Community Intelligence**: Monitoring and responding to community needs and trends
- **Brand Compliance**: Ensuring all content aligns with BLKOUT's values and visual identity

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLKOUT Communications Hub                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  Public Discover │  │  Admin Dashboard │  │ SocialSync    │ │
│  │  Page (/discover)│  │  (/admin)        │  │ Studio        │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘ │
│           │                     │                     │         │
│  ┌────────┴─────────────────────┴─────────────────────┴───────┐ │
│  │                    React Frontend (Vite)                    │ │
│  │              TypeScript + Tailwind CSS                      │ │
│  └─────────────────────────────┬───────────────────────────────┘ │
│                                │                                 │
│  ┌─────────────────────────────┴───────────────────────────────┐ │
│  │                     Supabase Backend                         │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│ │
│  │  │ PostgreSQL  │ │  Auth       │ │  Storage (Assets)       ││ │
│  │  │  Database   │ │  Service    │ │                         ││ │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘│ │
│  │  ┌─────────────────────────────────────────────────────────┐│ │
│  │  │              Real-time Subscriptions                     ││ │
│  │  └─────────────────────────────────────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                │                                 │
│  ┌─────────────────────────────┴───────────────────────────────┐ │
│  │                   External Integrations                      │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐ │ │
│  │  │ Google   │ │Instagram │ │ TikTok   │ │ LinkedIn/X      │ │ │
│  │  │ Gemini AI│ │ Graph API│ │ API      │ │ APIs            │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 + TypeScript | UI Components and State Management |
| **Build Tool** | Vite 7 | Fast development and production builds |
| **Styling** | Tailwind CSS 3.4 | BLKOUT brand-compliant styling |
| **Routing** | React Router v7 | Client-side navigation |
| **Database** | Supabase (PostgreSQL) | Data persistence and real-time sync |
| **Auth** | Supabase Auth | User authentication (optional) |
| **Storage** | Supabase Storage | Asset management |
| **AI Generation** | Google Gemini/Veo | Image and video content creation |
| **Deployment** | Vercel | Production hosting |

---

## AI Agent System

The platform features five specialized AI agents, each with distinct responsibilities aligned with BLKOUT's community-first values.

### Agent Types

#### 1. Griot (Storyteller)
**Role**: Creates authentic content rooted in Black feminist thought

**Capabilities**:
- Generates posts, articles, and narrative content
- Maintains BLKOUT's authentic voice and values
- Creates content for Black History Month, Pride, and community celebrations
- Adapts storytelling for different platforms

**Prompt Focus**: Community stories, liberation narratives, cultural celebration

#### 2. Listener (Intelligence Gatherer)
**Role**: Monitors social media for trends and conversations

**Capabilities**:
- Tracks relevant hashtags and conversations
- Identifies opportunities for community engagement
- Monitors sentiment around Black LGBTQ+ topics
- Gathers community intelligence for strategic planning

**Data Sources**: Twitter/X mentions, Instagram comments, community feedback

#### 3. Weaver (Community Engager)
**Role**: Facilitates community interactions and builds relationships

**Capabilities**:
- Responds to comments and messages
- Facilitates introductions between community members
- Builds trust through consistent, authentic engagement
- Connects community members with relevant resources

**Engagement Style**: "Move at the speed of trust"

#### 4. Strategist (Campaign Planner)
**Role**: Plans content campaigns and coordinates timing

**Capabilities**:
- Develops content calendars
- Coordinates multi-platform publishing schedules
- Analyzes performance and adjusts strategies
- Plans around key community dates and events

**Planning Horizon**: Weekly, monthly, and campaign-based

#### 5. Herald (Newsletter Curator)
**Role**: Curates and delivers community newsletters

**Capabilities**:
- Weekly community roundups
- Monthly in-depth newsletters
- Event announcements and reminders
- Integration with SendFox for delivery

**Distribution**: Email via SendFox integration

### Agent Task Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Task Creation  │───▶│  Agent Queue    │───▶│  Content Gen    │
│  (Manual/Auto)  │    │  (Supabase)     │    │  (Gemini AI)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                                                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Published      │◀───│  Review &       │◀───│  Asset Storage  │
│  Content        │    │  Approval       │    │  (Supabase)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## SocialSync Content Generation Studio

The SocialSync module (`/socialsync-content-generation`) provides AI-powered content creation capabilities.

### Features

- **Multi-Model AI Support**: Google Gemini 3 Pro (images), Veo 3.1 (video)
- **Platform Optimization**: Automatic aspect ratio and format optimization
- **Brand Templates**: Pre-configured templates for common content types
- **Real-time Task Queue**: Live updates via Supabase subscriptions
- **Asset Library**: Centralized storage for generated content

### Content Generation Flow

```typescript
// Example: Creating content via the generation service
import { generateImageAsset } from './services/generation';
import { AIProvider, AspectRatio } from './types';

const imageUrl = await generateImageAsset(
  AIProvider.GOOGLE,
  "Vibrant celebration of Black queer joy, community gathering",
  AspectRatio.SQUARE,
  referenceImageBase64 // Optional reference
);
```

### Supported Formats

| Platform | Image Ratios | Video Ratios | Max Duration |
|----------|--------------|--------------|--------------|
| Instagram | 1:1, 4:5, 1.91:1 | 9:16, 4:5, 1:1 | 60 seconds |
| TikTok | N/A | 9:16 | 3 minutes |
| LinkedIn | 1:1, 16:9 | 16:9, 1:1 | 10 minutes |
| Twitter/X | 1:1, 16:9 | 16:9, 1:1 | 2:20 |

---

## Database Schema

### Core Tables

#### `agent_configurations`
Stores agent settings and capabilities.

```sql
id: uuid (primary key)
agent_name: text (griot, listener, weaver, strategist, herald)
agent_display_name: text
agent_role: text
key_responsibilities: text[]
content_focus: text[]
is_active: boolean
settings: jsonb
created_at: timestamp
updated_at: timestamp
```

#### `socialsync_agent_tasks`
Agent task queue for content generation.

```sql
id: uuid (primary key)
agent_type: enum (news_crawler, viral_trends, event_scheduler, brand_guardian)
title: text
description: text
priority: enum (high, medium, low)
status: enum (pending, in_progress, completed, cancelled)
target_platform: enum (instagram, tiktok, linkedin, twitter)
suggested_config: jsonb
created_at: timestamp
updated_at: timestamp
completed_at: timestamp
assigned_to: uuid (foreign key)
```

#### `generated_assets`
Stores AI-generated content.

```sql
id: uuid (primary key)
task_id: uuid (foreign key to agent_tasks)
media_type: enum (image, video)
url: text
storage_path: text
aspect_ratio: text
style: text
prompt: text
overlay_text: text
logo_id: text
tags: text[]
metadata: jsonb
created_by: uuid
created_at: timestamp
```

#### `social_media_queue`
Publishing queue for social platforms.

```sql
id: uuid (primary key)
asset_id: uuid (foreign key to generated_assets)
platform: enum (instagram, tiktok, linkedin, twitter)
status: enum (queued, scheduled, published, failed)
scheduled_for: timestamp
published_at: timestamp
platform_post_id: text
caption: text
hashtags: text[]
error_message: text
created_at: timestamp
updated_at: timestamp
```

---

## Project Structure

```
comms-blkout/
├── src/
│   ├── components/
│   │   ├── admin/           # Admin-specific components
│   │   ├── agents/          # Agent UI components
│   │   │   └── AgentPromptModal.tsx
│   │   ├── discover/        # Public page components
│   │   │   ├── AdventCalendarWidget.tsx
│   │   │   └── BlkoutHubWidget.tsx
│   │   ├── layout/          # Header, Sidebar, Layout
│   │   ├── shared/          # Reusable components
│   │   └── socialsync/      # Content studio components
│   ├── hooks/
│   │   ├── useAgents.ts     # Agent data fetching
│   │   ├── useAgentTasks.ts # Task CRUD operations
│   │   ├── useAuth.tsx      # Authentication state
│   │   ├── useContent.ts    # Content management
│   │   └── useCalendarContent.ts
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   └── mockData.ts      # Development fallback data
│   ├── pages/
│   │   ├── admin/           # Protected admin pages
│   │   │   ├── Agents.tsx
│   │   │   ├── Calendar.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── SocialSync.tsx
│   │   └── discover/        # Public pages
│   │       └── DiscoverPage.tsx
│   ├── services/
│   │   ├── socialsync/      # SocialSync services
│   │   └── announcementsService.ts
│   ├── types/
│   │   └── index.ts         # TypeScript definitions
│   └── App.tsx              # Main app with routes
├── socialsync-content-generation/
│   ├── services/
│   │   ├── generation.ts    # AI content generation
│   │   ├── gemini.ts        # Google Gemini integration
│   │   ├── integration.ts   # BLKOUT ecosystem integration
│   │   ├── supabase.ts      # Database operations
│   │   └── platforms/       # Social media connectors
│   │       ├── base.ts      # Platform interface
│   │       ├── instagram.ts
│   │       └── tiktok.ts
│   └── types/
│       └── database.ts      # Supabase type definitions
├── public/
│   ├── images/              # Static images
│   │   ├── blkout_logo_roundel_colour.png
│   │   └── blkouthub_logo.png
│   └── branding/
│       └── Blkoutchristmas.mp4
└── supabase/
    └── migrations/          # Database migrations
```

---

## API Reference

### Integration Service

#### `fetchAgentTasks()`
Fetches pending agent tasks from Supabase or mock data.

```typescript
import { fetchAgentTasks } from './services/integration';

const tasks: AgentTask[] = await fetchAgentTasks();
```

#### `pushToAutomation()`
Pushes generated assets to the publishing queue.

```typescript
import { pushToAutomation } from './services/integration';

await pushToAutomation(
  asset,
  SocialPlatform.INSTAGRAM,
  "Community celebration post! 🎉",
  ["BLKOUT", "BlackQueerJoy", "Community"]
);
```

#### `subscribeToTaskUpdates()`
Subscribe to real-time task updates.

```typescript
import { subscribeToTaskUpdates } from './services/integration';

const unsubscribe = subscribeToTaskUpdates((tasks) => {
  console.log('Tasks updated:', tasks);
});
```

### Generation Service

#### `generateImageAsset()`
Generate an image using AI.

```typescript
import { generateImageAsset } from './services/generation';
import { AIProvider, AspectRatio } from './types';

const imageUrl = await generateImageAsset(
  AIProvider.GOOGLE,
  "Your prompt here",
  AspectRatio.SQUARE,
  optionalReferenceBase64
);
```

#### `generateVideoAsset()`
Generate a video using AI.

```typescript
import { generateVideoAsset } from './services/generation';

const videoUrl = await generateVideoAsset(
  AIProvider.GOOGLE,
  "Your prompt here",
  AspectRatio.PORTRAIT,
  VideoStyle.CINEMATIC,
  VideoResolution.FHD_1080P
);
```

---

## Configuration

### Environment Variables

```env
# Supabase Configuration (Required for production)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication Toggle
VITE_AUTH_DISABLED=true  # Set to false for production

# Google AI (Required for content generation)
GEMINI_API_KEY=your_google_genai_api_key

# Social Media Platforms (Optional)
VITE_INSTAGRAM_CLIENT_ID=your_instagram_client_id
VITE_INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
VITE_TIKTOK_CLIENT_KEY=your_tiktok_client_key
VITE_TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

### Development Mode

When Supabase is not configured, the system automatically falls back to mock data:

```typescript
// src/lib/supabase.ts
export const isSupabaseConfigured = () => {
  return Boolean(import.meta.env.VITE_SUPABASE_URL);
};
```

---

## Deployment

### Production Build

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview build locally
npm run preview
```

### Vercel Deployment

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

**Production URL**: https://comms-blkout.vercel.app

---

## Related BLKOUT Projects

| Project | URL | Description |
|---------|-----|-------------|
| Main Platform | blkout.vercel.app | Community platform |
| BLKOUT Hub | blkouthub.com | Digital community home |
| Voices Blog | voices-blkout.up.railway.app | Blog/articles platform |
| Events Calendar | events.blkoutuk.com | Black QTIPOC events |
| IVOR Assistant | ivor.blkoutuk.com | AI community assistant |

---

## Design Philosophy

### BLKOUT Brand Values Reflected in Code

- **Community over metrics**: Focus on engagement quality, not vanity metrics
- **Move at the speed of trust**: Relationship-building prioritized in agent logic
- **Trust the people**: Community-led content and feedback loops
- **Authentic storytelling**: AI prompts emphasize Black feminist thought
- **Quality over quantity**: Thoughtful content curation

### Brand Colors

```css
--blkout-purple: #a855f7;    /* Primary */
--community-warmth: #f59e0b;  /* Amber */
--community-trust: #10b981;   /* Emerald */
--community-wisdom: #6366f1;  /* Indigo */
```

---

## Future Roadmap

- [ ] Complete Instagram Graph API OAuth integration
- [ ] TikTok Content Posting API connection
- [ ] LinkedIn API integration
- [ ] SendFox email integration for Herald agent
- [ ] Enhanced analytics dashboard
- [ ] Mobile app companion
- [ ] Advanced scheduling with drag-and-drop calendar

---

## Support

For technical questions or issues:
- **Email**: blkoutuk@gmail.com
- **Repository Issues**: GitHub issue tracker
- **Documentation**: `/docs` directory

---

*Built with love for BLKOUT UK's mission of community organizing and authentic storytelling rooted in Black feminist thought.*
