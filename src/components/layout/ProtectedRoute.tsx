
import { Navigate } from 'react-router-dom';
import { useAuth, isAuthDisabled } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // If auth is disabled, allow access
  if (isAuthDisabled()) {
    return <>{children}</>;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blkout-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to discover if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/discover" replace />;
  }

  return <>{children}</>;
}
