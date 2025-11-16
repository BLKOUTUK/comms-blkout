
# 🏳️‍🌈 BLKOUT UK Content Calendar & Comms System

A comprehensive Vite + React application for managing BLKOUT UK's content calendar and community communications system, featuring AI-powered content creation with four specialized agents.

## 🌟 Features

### Public "Discover" Page (`/discover`)
- **Hero Section**: Showcasing BLKOUT UK's mission and community impact
- **Dynamic Content Grid**: Latest content from Instagram, LinkedIn, Twitter, TikTok, Facebook, and YouTube
- **Social Media Embeds**: Embedded posts using platform APIs
- **Smart Filtering**: Filter by platform, content type, and search functionality
- **Responsive Design**: Mobile-first, accessible interface

### Admin Backroom (`/admin`)
- **Dashboard**: Overview of content metrics and AI agent status
- **Content Calendar**: Weekly/monthly grid view with scheduling
- **Draft Management**: Review, edit, and approve AI-generated content
- **Agent Status Dashboard**: Monitor all 4 AI agents (Griot, Listener, Weaver, Strategist)
- **Analytics**: Community-focused metrics (conversations, actions, meaningful interactions)
- **Settings**: User profile and notification preferences

## 🛠 Tech Stack

- **Frontend**: Vite + React 18 + TypeScript
- **Routing**: React Router v6
- **Database & Auth**: Supabase
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account with deployed schema
- Supabase project URL and anon key

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd /home/ubuntu/blkout_comms_app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── admin/          # Admin-specific components
│   │   ├── AdminLayout.tsx
│   │   ├── AgentCard.tsx
│   │   ├── ContentCalendarGrid.tsx
│   │   ├── DashboardStats.tsx
│   │   └── DraftList.tsx
│   ├── discover/       # Public discover page components
│   │   ├── ContentCard.tsx
│   │   ├── ContentFilter.tsx
│   │   ├── HeroSection.tsx
│   │   └── SocialEmbed.tsx
│   └── shared/         # Shared components
│       ├── Footer.tsx
│       ├── LoadingSpinner.tsx
│       ├── Navbar.tsx
│       └── ProtectedRoute.tsx
├── hooks/              # Custom React hooks
│   ├── useAgents.ts
│   ├── useAuth.tsx
│   ├── useContent.ts
│   └── usePlatforms.ts
├── lib/                # Library configurations
│   └── supabase.ts
├── pages/              # Page components
│   ├── admin/
│   │   ├── AgentsPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── ContentCalendarPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── DraftsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── DiscoverPage.tsx
│   └── LoginPage.tsx
├── types/              # TypeScript type definitions
│   ├── database.ts
│   └── index.ts
├── App.tsx             # Main app component with routing
├── main.tsx            # App entry point
└── index.css           # Global styles with Tailwind

```

## 🗄️ Database Schema

The application connects to a Supabase database with the following tables:

- `voice_and_values` - BLKOUT Voice & Values document
- `platforms` - Social media platform configurations
- `agent_configurations` - AI agent settings (Griot, Listener, Weaver, Strategist)
- `campaigns` - Campaign planning and tracking
- `content_calendar` - Main content planning and scheduling
- `content_drafts` - AI-generated content drafts with versioning
- `content_approvals` - Approval workflow tracking
- `ivor_intelligence` - Cached IVOR insights
- `content_performance` - Community-focused engagement metrics

## 👥 AI Agents

### Griot - The Storyteller
Content creator specializing in narrative storytelling rooted in Black queer history and liberation practices.

### Listener - Community Monitor
Social monitoring specialist tracking community needs, trends, and content alignment with values.

### Weaver - Community Builder
Engagement specialist optimizing content for platforms and building connections between community members.

### Strategist - Campaign Planner
Strategic planning specialist ensuring content aligns with organizational goals and community needs.

## 🔐 Authentication

The app uses Supabase Auth with Row Level Security (RLS). User roles:
- **Admin**: Full access to all features
- **Editor/Content Lead**: Can create, edit, and manage content
- **Viewer**: Read-only access to published content

To set user roles, update the user's metadata in Supabase:
```json
{
  "role": "admin"
}
```

## 📊 Key Features Explained

### Content Status Workflow
1. **Draft** → AI-generated or manual draft
2. **Review** → Submitted for approval
3. **Approved** → Ready for scheduling
4. **Scheduled** → Set to publish at specific time
5. **Published** → Live on social media

### Community-Focused Metrics
- **Conversations Started**: Comments and meaningful discussions
- **Community Actions**: Sign-ups, event attendance, resource access
- **Meaningful Interactions**: DMs, thoughtful comments, story replies
- **Resources Accessed**: Tangible help provided to community

## 🌐 Deployment

### Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/BLKOUTUK/blkout-comms-app.git
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Import your GitHub repository
   - Add environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
   - Deploy!

### Other Platforms

The app can be deployed to any static hosting service (Netlify, Cloudflare Pages, etc.).

## 🤝 Contributing

This is a community project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

Copyright © 2025 BLKOUT UK. All rights reserved.

## 🙏 Acknowledgments

Built with love for the UK's Black queer community by BLKOUT UK - the UK's only Black queer-led Community Benefit Society.

---

**Note about localhost**: When running locally, the app is accessible at `http://localhost:5173` on the development machine. To access from another device, you'll need to deploy the application or configure network access appropriately.

## 📞 Support

For questions or support, contact the BLKOUT UK team or open an issue in the GitHub repository.
