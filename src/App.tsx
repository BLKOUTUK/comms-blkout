
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

// Pages
import { DiscoverPage } from '@/pages/discover/DiscoverPage';
import { Dashboard } from '@/pages/admin/Dashboard';
import { ContentCalendar } from '@/pages/admin/ContentCalendar';
import { Drafts } from '@/pages/admin/Drafts';
import { Agents } from '@/pages/admin/Agents';
import { Analytics } from '@/pages/admin/Analytics';
import { Settings } from '@/pages/admin/Settings';
import { SocialSync } from '@/pages/admin/SocialSync';
import { SocialSyncEditorial } from '@/pages/admin/SocialSyncEditorial';
import { Newsletters } from '@/pages/admin/Newsletters';
import { OAuthCallback } from '@/pages/auth/OAuthCallback';
import Grants from '@/pages/admin/Grants';
import { EventModeration } from '@/pages/admin/EventModeration';
import { NewsModeration } from '@/pages/admin/NewsModeration';
import { DesignStudio } from '@/pages/admin/DesignStudio';
import { CampaignReview } from '@/pages/admin/CampaignReview';
import { CampaignDashboard } from '@/pages/admin/CampaignDashboard';
import { NewsletterPreferences } from '@/pages/preferences/NewsletterPreferences';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/discover" replace />} />
          <Route path="/discover" element={<DiscoverPage />} />

          {/* OAuth Callback Routes */}
          <Route path="/auth/callback/:platform" element={<OAuthCallback />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/calendar"
            element={
              <ProtectedRoute>
                <ContentCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/drafts"
            element={
              <ProtectedRoute>
                <Drafts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/agents"
            element={
              <ProtectedRoute>
                <Agents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/socialsync"
            element={
              <ProtectedRoute>
                <SocialSync />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/editorial"
            element={
              <ProtectedRoute>
                <SocialSyncEditorial />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/newsletters"
            element={
              <ProtectedRoute>
                <Newsletters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/grants"
            element={
              <ProtectedRoute>
                <Grants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute>
                <EventModeration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/news"
            element={
              <ProtectedRoute>
                <NewsModeration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/design-studio"
            element={
              <ProtectedRoute>
                <DesignStudio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/campaigns"
            element={
              <ProtectedRoute>
                <CampaignDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/campaigns/review"
            element={
              <ProtectedRoute>
                <CampaignReview />
              </ProtectedRoute>
            }
          />

          {/* Public Preferences Routes */}
          <Route path="/preferences" element={<NewsletterPreferences />} />
          <Route path="/unsubscribe" element={<NewsletterPreferences />} />
          <Route path="/subscribe" element={<NewsletterPreferences />} />

          {/* 404 - Redirect to discover */}
          <Route path="*" element={<Navigate to="/discover" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
