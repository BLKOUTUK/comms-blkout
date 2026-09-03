
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Account } from '@/pages/admin/Account';

// Pages
import { DiscoverPage } from '@/pages/discover/DiscoverPage';
import { NewsletterDetail } from '@/pages/discover/NewsletterDetail';
import { Dashboard } from '@/pages/admin/Dashboard';
import { ContentCalendar } from '@/pages/admin/ContentCalendar';
import { Agents } from '@/pages/admin/Agents';
import { Settings } from '@/pages/admin/Settings';
import { Newsletters } from '@/pages/admin/Newsletters';
import Grants from '@/pages/admin/Grants';
import { Finance } from '@/pages/admin/Finance';
import { EventModeration } from '@/pages/admin/EventModeration';
import { NewsModeration } from '@/pages/admin/NewsModeration';
import { NewsletterPreferences } from '@/pages/preferences/NewsletterPreferences';
import { CelebratePage } from '@/pages/celebrate/CelebratePage';
import { Fundraising } from '@/pages/admin/Fundraising';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/discover" replace />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/discover/newsletters/:id" element={<NewsletterDetail />} />

          <Route path="/login" element={<Login />} />

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
            path="/admin/agents"
            element={
              <ProtectedRoute>
                <Agents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/account"
            element={
              <ProtectedRoute>
                <Account />
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
            path="/admin/finance"
            element={
              <ProtectedRoute>
                <Finance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fundraising"
            element={
              <ProtectedRoute>
                <Fundraising />
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


          {/* Public Campaign Routes */}
          <Route path="/10years" element={<CelebratePage />} />

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
