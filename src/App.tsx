
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Navbar } from './components/shared/Navbar';
import { Footer } from './components/shared/Footer';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';

// Pages
import { DiscoverPage } from './pages/DiscoverPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { ContentCalendarPage } from './pages/admin/ContentCalendarPage';
import { DraftsPage } from './pages/admin/DraftsPage';
import { AgentsPage } from './pages/admin/AgentsPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { SettingsPage } from './pages/admin/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Navigate to="/discover" replace />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Protected admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="calendar" element={<ContentCalendarPage />} />
                <Route path="drafts" element={<DraftsPage />} />
                <Route path="agents" element={<AgentsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<Navigate to="/discover" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
