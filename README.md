
# BLKOUT UK Communications System

A comprehensive Vite + React + TypeScript content management and community communications platform for BLKOUT UK, featuring AI-powered content creation with four specialized agents.

## 🎯 Overview

This application helps BLKOUT UK manage their community communications across multiple social media platforms with a focus on authentic storytelling rooted in Black feminist thought. The system features AI agents for content creation, community engagement, and strategic planning.

## ✨ Features

### Public Pages
- **Discover Page** (`/discover`) - Public-facing content showcase
  - Latest published content from Instagram and LinkedIn
  - Filter by platform and search functionality
  - Social media embeds
  - Community-focused design

### Admin Pages (Protected Routes)
- **Dashboard** (`/admin`) - Overview with agent status, recent content, and quick actions
- **Content Calendar** (`/admin/calendar`) - Monthly calendar view with scheduled content
- **Drafts** (`/admin/drafts`) - Review and manage agent-generated content
- **Agents** (`/admin/agents`) - Monitor and configure AI agents
- **Analytics** (`/admin/analytics`) - Community engagement metrics (quality over quantity)
- **Settings** (`/admin/settings`) - Platform connections and system configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- (Optional) Supabase account for production use

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:3000`

## 🔐 Authentication Status

**⚠️ AUTHENTICATION IS CURRENTLY DISABLED**

The application runs in **development mode** with authentication disabled by default. You'll be automatically logged in as a mock admin user with full access to all features.

### Mock Admin User
- **Email:** admin@blkout.dev
- **Role:** Admin
- **Access:** Full system access

### Enabling Authentication

To enable Supabase authentication:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your `.env.example` to `.env`
3. Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_AUTH_DISABLED=false
   ```
4. Restart the development server

## 📦 Tech Stack

- **Framework:** Vite + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router v7
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (disabled by default)
- **Icons:** Lucide React
- **Date Utilities:** date-fns

## 🏗️ Project Structure

```
blkout_comms_app/
├── src/
│   ├── components/
│   │   ├── layout/        # Layout components (Header, Sidebar, etc.)
│   │   ├── shared/        # Reusable components (Cards, Badges, etc.)
│   │   ├── admin/         # Admin-specific components
│   │   └── discover/      # Discover page components
│   ├── pages/
│   │   ├── admin/         # Admin pages
│   │   └── discover/      # Public pages
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions and configs
│   ├── types/             # TypeScript type definitions
│   ├── styles/            # Global styles
│   ├── App.tsx            # Main app with routes
│   └── main.tsx           # Entry point
├── public/                # Static assets
├── .env                   # Environment variables (not in git)
├── .env.example           # Environment variables template
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

## 🤖 AI Agents

The system includes four specialized AI agents:

### 1. **Griot** - Storyteller
- Creates authentic content rooted in Black feminist thought
- Generates posts, articles, and narrative content
- Maintains BLKOUT's voice and values

### 2. **Listener** - Intelligence Gatherer
- Monitors social media for trends and conversations
- Provides community intelligence
- Identifies opportunities for engagement

### 3. **Weaver** - Community Engager
- Facilitates community interactions
- Responds to comments and messages
- Builds relationships and trust

### 4. **Strategist** - Campaign Planner
- Plans content campaigns
- Coordinates timing and platform strategy
- Analyzes performance and adjusts approach

## 🎨 Design Philosophy

### BLKOUT Brand Colors
- **Primary Purple:** `#a855f7` (blkout-500)
- **Community Warmth:** `#f59e0b` (amber)
- **Community Trust:** `#10b981` (emerald)
- **Community Wisdom:** `#6366f1` (indigo)

### Design Principles
- **Community over metrics** - Focus on quality engagement
- **Authentic storytelling** - Rooted in Black feminist thought
- **Move at the speed of trust** - Relationship-building first
- **Trust the people** - Community-led approach

## 📊 Analytics Philosophy

Unlike traditional social media analytics, BLKOUT focuses on:

- **Engagement Quality** - Depth of conversations over vanity metrics
- **Trust Score** - Community trust and relationship building
- **Conversation Depth** - Quality of interactions
- **Content Resonance** - How well content connects with community

## 🔧 Development

### Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Authentication (true = disabled, false = enabled)
VITE_AUTH_DISABLED=true

# Mock User (when auth disabled)
VITE_MOCK_USER_EMAIL=admin@blkout.dev
VITE_MOCK_USER_NAME=BLKOUT Admin
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Mock Data

The application includes comprehensive mock data in `src/lib/mockData.ts` for development and testing when Supabase is not configured. This allows you to develop and test all features without a database connection.

## 🗄️ Database Integration

The application is designed to work with Supabase. When Supabase credentials are not configured, it automatically falls back to mock data.

### Custom Hooks
- `useAuth()` - Authentication state and methods
- `useContent()` - Fetch and manage content
- `useAgents()` - Fetch and manage agents
- `usePlatforms()` - Fetch and manage platform connections
- `useDrafts()` - Fetch and manage draft content

All hooks automatically handle loading states, errors, and fallback to mock data.

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Environment Variables for Production

Make sure to set these environment variables in your hosting platform:

```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_AUTH_DISABLED=false
```

## 📝 To-Do / Future Enhancements

- [ ] Implement actual AI agent integrations
- [ ] Add real-time notifications
- [ ] Implement drag-and-drop content scheduling
- [ ] Add media upload functionality
- [ ] Integrate with social media APIs (Instagram, LinkedIn, etc.)
- [ ] Add user role management
- [ ] Implement content approval workflows
- [ ] Add analytics dashboard with charts
- [ ] Create mobile app version

## 🤝 Contributing

This is a production-ready foundation for BLKOUT UK's communications system. Future development will focus on:

1. AI agent integration with LLM providers
2. Social media platform API integrations
3. Advanced analytics and reporting
4. Real-time collaboration features

## 📄 License

Proprietary - BLKOUT UK

## 🙏 Acknowledgments

Built with ❤️ for BLKOUT UK's mission of community organizing and authentic storytelling rooted in Black feminist thought.

---

**Note:** This application is currently in development mode with authentication disabled. Enable Supabase authentication and configure database connections before deploying to production.

For questions or support, contact the BLKOUT UK tech team.
