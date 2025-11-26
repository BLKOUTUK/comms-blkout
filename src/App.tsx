
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/discover" replace />} />
          <Route path="/discover" element={<DiscoverPage />} />

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

          {/* 404 - Redirect to discover */}
          <Route path="*" element={<Navigate to="/discover" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
