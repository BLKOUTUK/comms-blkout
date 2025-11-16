
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// ============================================================================
// 🚨 DEVELOPMENT MODE: AUTHENTICATION DISABLED 🚨
// ============================================================================
// Authentication checks are temporarily disabled for development purposes.
// All protected routes are accessible without login.
// To re-enable authentication:
// 1. Set AUTH_DISABLED to false
// 2. The component will automatically enforce authentication checks again
// ============================================================================
const AUTH_DISABLED = true;

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // ============================================================================
  // DEVELOPMENT MODE: Bypass all authentication checks
  // ============================================================================
  if (AUTH_DISABLED) {
    // In development mode, always render children without any checks
    return <>{children}</>;
  }

  // ============================================================================
  // PRODUCTION MODE: Real authentication checks (currently disabled)
  // ============================================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blkout-purple"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
