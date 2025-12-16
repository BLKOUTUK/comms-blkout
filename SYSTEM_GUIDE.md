# BLKOUT Communications System Guide

A comprehensive guide for the BLKOUT UK community communications platform - an AI-powered content management and community engagement system built for Black queer liberation technology.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Features](#features)
5. [AI Agents](#ai-agents)
6. [API Reference](#api-reference)
7. [Configuration](#configuration)
8. [Deployment](#deployment)
9. [Accessibility](#accessibility)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

### Purpose

The BLKOUT Communications System (`comms-blkout`) is a full-stack web application that powers community communications for BLKOUT UK. It provides:

- **Public Discover Page**: Community-facing content hub with events, newsletters, and social media
- **Admin Dashboard**: Protected area for content management and analytics
- **AI Agent System**: Six specialized AI agents for content creation and community engagement
- **Newsletter Platform**: Automated newsletter generation with SendFox integration
- **SocialSync**: AI-powered content generation for social media platforms

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 7 |
| Styling | Tailwind CSS 3.4 |
| Routing | React Router 7 |
| Backend | Supabase (PostgreSQL + Auth) |
| AI | Google Gemini, OpenRouter (Claude) |
| API | Vercel Serverless Functions |
| Email | SendFox, Resend |

---

## Architecture

### Directory Structure

```
comms-blkout/
├── src/
│   ├── components/        # React components
│   │   ├── agents/       # AI agent UI components
│   │   ├── discover/     # Public page widgets
│   │   ├── grants/       # Grant management
│   │   ├── integrations/ # Third-party integrations
│   │   ├── layout/       # App layout (Header, Sidebar, Layout)
│   │   ├── newsletters/  # Newsletter components
│   │   ├── shared/       # Reusable components
│   │   └── socialsync/   # Content generation UI
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities (Supabase client, mock data)
│   ├── pages/            # Page components
│   │   ├── admin/        # Protected admin pages
│   │   ├── auth/         # OAuth callbacks
│   │   └── discover/     # Public discover page
│   ├── services/         # Business logic & API services
│   │   ├── grants/       # Grant management service
│   │   └── socialsync/   # AI generation services
│   ├── styles/           # Global CSS
│   └── types/            # TypeScript definitions
├── api/                  # Vercel serverless functions
│   ├── auth/             # OAuth handlers
│   ├── herald/           # Newsletter generation API
│   ├── social-diary/     # Social content research
│   └── webhooks/         # Platform webhooks
├── supabase/
│   └── migrations/       # Database migrations
├── n8n-workflows/        # Automation workflow configs
└── public/               # Static assets
```

### Data Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │───▶│  Supabase DB     │◀───│  Vercel API     │
│   (Frontend)    │    │  (PostgreSQL)    │    │  (Serverless)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                      │
        ▼                       ▼                      ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Custom Hooks   │    │  Real-time       │    │  OpenRouter AI  │
│  (useAgents,    │    │  Subscriptions   │    │  Google Gemini  │
│   useContent)   │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account (optional for demo mode)
- Google AI API key (for content generation)

### Installation

```bash
# Clone the repository
cd apps/comms-blkout

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication (set to 'true' for development)
VITE_AUTH_DISABLED=true
VITE_MOCK_USER_EMAIL=admin@blkout.dev
VITE_MOCK_USER_NAME=BLKOUT Admin

# AI Content Generation
VITE_GEMINI_API=your_google_genai_credential

# Newsletter Service (backend)
OPENROUTER_API_KEY=your_openrouter_key
SENDFOX_API_KEY=your_sendfox_key
RESEND_API_KEY=your_resend_key
```

### Demo Mode

The app works without Supabase configuration using mock data:
- Mock agents, content, and drafts are provided
- All CRUD operations simulate success
- Perfect for UI development and testing

---

## Features

### 1. Public Discover Page (`/discover`)

The community-facing landing page featuring:

| Widget | Description |
|--------|-------------|
| Hero Section | Brand introduction with values badges |
| Advent Calendar | Seasonal/campaign content |
| BLKOUT HUB | Community platform integration |
| Featured Events | Upcoming events display |
| Social Media Feed | Instagram/LinkedIn embeds |
| Newsletter Archive | Past newsletter access |
| BLKOUT Voices | Blog/article highlights |
| YouTube Embed | Video content |

### 2. Admin Dashboard (`/admin`)

Protected area requiring authentication:

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/admin` | Overview stats and activity |
| Calendar | `/admin/calendar` | Content scheduling calendar |
| Drafts | `/admin/drafts` | Content draft management |
| Agents | `/admin/agents` | AI agent configuration |
| Analytics | `/admin/analytics` | Performance metrics |
| SocialSync | `/admin/socialsync` | Content generation |
| Editorial | `/admin/editorial` | Task-based content workflow |
| Newsletters | `/admin/newsletters` | Newsletter management |
| Grants | `/admin/grants` | Grant opportunity tracking |
| Settings | `/admin/settings` | Platform settings |

### 3. SocialSync Content Generation

AI-powered content creation system:

- **Image Generation**: Google Gemini image creation
- **Video Generation**: AI video content (Gemini)
- **Multi-platform Support**: Instagram, LinkedIn, Twitter, TikTok, YouTube
- **Asset Library**: Save and manage generated assets
- **Preview System**: Platform-specific content preview

### 4. Newsletter System

Automated newsletter creation via Herald agent:

- **Content Aggregation**: Events, articles, resources
- **AI Introduction**: Claude-generated personalized intros
- **Editorial Workflow**: Editor prompt and response system
- **SendFox Integration**: Direct campaign creation
- **Export Options**: HTML, JSON, plain text

---

## AI Agents

The system features six specialized AI agents, each with distinct roles:

### Griot (Storyteller)

**Role**: Content creation rooted in Black feminist thought

**Capabilities**:
- Authentic storytelling
- Cultural context preservation
- Voice and tone consistency
- Liberation-centered narratives

**Use Cases**:
- Community spotlight posts
- Campaign narratives
- Cultural content

### Listener (Intelligence)

**Role**: Social monitoring and community pulse

**Capabilities**:
- Trend identification
- Sentiment analysis
- Community needs assessment
- Intelligence gathering

**Use Cases**:
- Daily research reports
- Topic suggestions
- Community health monitoring

### Weaver (Engagement)

**Role**: Community relationship building

**Capabilities**:
- Conversation facilitation
- Community engagement
- Trust development
- Bridge building

**Use Cases**:
- Response drafting
- Engagement campaigns
- Community connection content

### Strategist (Planning)

**Role**: Campaign coordination and planning

**Capabilities**:
- Campaign planning
- Timeline management
- Cross-platform coordination
- Strategic analysis

**Use Cases**:
- Campaign timelines
- Content calendars
- Multi-platform strategies

### Herald (Communications)

**Role**: Newsletter curation and community updates

**Capabilities**:
- Newsletter generation
- Content aggregation
- SendFox integration
- Editorial workflow

**Use Cases**:
- Weekly newsletters
- Monthly digests
- Community announcements

### Concierge (Support)

**Role**: Member support and onboarding

**Capabilities**:
- Personalized guidance
- Resource navigation
- Community connection
- Benefit explanation

**Use Cases**:
- New member onboarding
- Resource recommendations
- Support responses

### Agent Configuration

Agents are configured in Supabase `agent_configurations` table:

```typescript
interface AgentConfiguration {
  id: string;
  agent_name: string;          // griot, listener, weaver, etc.
  agent_display_name: string;
  agent_role: string;
  key_responsibilities: string[];
  content_focus: string[];
  is_active: boolean;
  settings: {
    preferred_model?: string;
    fallback_model?: string;
    temperature?: number;
    max_tokens?: number;
    tone?: string;
    refresh_frequency?: string;
    system_prompt?: string;
  };
}
```

---

## API Reference

### Herald Newsletter API

**Endpoint**: `POST /api/herald/generate`

#### Generate Newsletter

```json
{
  "action": "generate",
  "edition_type": "weekly" | "monthly",
  "edition_id": "optional-existing-edition-uuid"
}
```

#### Execute Agent

```json
{
  "action": "execute_agent",
  "agent_type": "griot" | "weaver" | "strategist" | "listener" | "concierge",
  "title": "Task title",
  "description": "Task details",
  "target_platform": "instagram" | "linkedin" | etc.
}
```

#### Response Format

```json
{
  "success": true,
  "agent": "griot",
  "content": "Generated content...",
  "intelligence_used": true,
  "community_context": {
    "members": 2847,
    "coop_members": 45,
    "verified_creators": 12,
    "upcoming_events": 5,
    "weekly_articles": 3
  }
}
```

### Social Diary API

**Endpoint**: `POST /api/social-diary/research`

Triggers Apify-based social media research for content opportunities.

### Content Generation Service

```typescript
import { generateImageAsset, generateVideoAsset } from '@/services/socialsync/generation';

// Generate image
const imageUrl = await generateImageAsset(
  AIProvider.GOOGLE,
  "A vibrant celebration of Black queer joy",
  AspectRatio.SQUARE,
  referenceImageBase64
);

// Generate video
const videoUrl = await generateVideoAsset(
  AIProvider.GOOGLE,
  "Community gathering highlight reel",
  AspectRatio.LANDSCAPE,
  VideoStyle.CINEMATIC,
  VideoResolution.HD
);
```

---

## Configuration

### Supabase Tables

The system uses these primary tables:

| Table | Purpose |
|-------|---------|
| `agent_configurations` | AI agent settings |
| `socialsync_agent_tasks` | Task queue and results |
| `newsletter_editions` | Newsletter content |
| `newsletter_content_items` | Edition content pieces |
| `ivor_intelligence` | Community intelligence data |
| `events` | Community events |
| `news_articles` | Newsroom content |
| `ivor_resources` | Community resources |
| `hub_members` | Community membership |
| `governance_members` | Coop membership |

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useAgents()` | Fetch and manage AI agents |
| `useAgentTasks()` | Agent task CRUD operations |
| `useAgentActivity()` | Activity log fetching |
| `useAgentIntelligence()` | Intelligence data access |
| `useContent()` | Content management |
| `useDrafts()` | Draft management |
| `useCalendarContent()` | Calendar scheduling |
| `useNewsletter()` | Newsletter operations |
| `useGrants()` | Grant tracking |
| `useSendFoxStatus()` | Email service status |

---

## Deployment

### Vercel Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Environment Setup

1. Add all environment variables in Vercel dashboard
2. Configure Supabase connection
3. Set up custom domain if needed

### Vercel Configuration

`vercel.json`:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

---

## Accessibility

The application implements WCAG 2.1 AA standards:

### Implemented Features

- **Skip Links**: Keyboard navigation bypass
- **Focus Trapping**: Modal accessibility
- **ARIA Landmarks**: Proper semantic structure
- **Form Labels**: All inputs properly labeled
- **Screen Reader Support**: Announcements for dynamic content
- **Color Independence**: Status indicators use icons + color
- **Keyboard Navigation**: Full keyboard operability

### Accessibility Classes

```css
/* Screen reader only */
.sr-only { /* Visually hidden but accessible */ }

/* Focus visible for keyboard navigation */
.focus-visible-ring:focus-visible {
  @apply outline-none ring-2 ring-blkout-500 ring-offset-2;
}
```

---

## Troubleshooting

### Common Issues

#### "Supabase not configured"

**Solution**: The app will use mock data. For full functionality:
1. Create a Supabase project
2. Run migrations from `supabase/migrations/`
3. Add credentials to `.env.local`

#### AI Generation Fails

**Solution**:
1. Check `VITE_GEMINI_API` environment variable
2. Verify API key has correct permissions
3. Check console for rate limiting errors

#### Build Errors

**Solution**:
```bash
# Clear cache and rebuild
rm -rf node_modules/.vite
npm run build
```

#### Authentication Issues

**Solution**:
- For development: Set `VITE_AUTH_DISABLED=true`
- For production: Configure Supabase Auth

### Debug Mode

Enable verbose logging:
```typescript
// In browser console
localStorage.setItem('DEBUG', 'true');
```

---

## Contributing

### Development Workflow

1. Create feature branch from `main`
2. Implement changes with tests
3. Run `npm run build` to verify
4. Submit PR with description

### Code Style

- TypeScript strict mode
- Tailwind for styling
- Component-based architecture
- Custom hooks for data fetching

---

## Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Contact**: info@blkoutuk.com

---

*BLKOUT UK - Technology for Black Queer Liberation*

*Built with love by and for our communities.*
