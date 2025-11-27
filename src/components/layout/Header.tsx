
import { Link, useLocation } from 'react-router-dom';
import { Menu, User, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user, isAuthenticated, signOut } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            {isAdminRoute && (
              <button className="lg:hidden text-gray-600 hover:text-gray-900">
                <Menu size={24} />
              </button>
            )}
            <Link to="/discover" className="flex items-center gap-3">
              <img
                src="/images/blkout_logo_roundel_colour.png"
                alt="BLKOUT"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-display font-bold text-gray-900">BLKOUT UK</h1>
                <p className="text-xs text-gray-500">Community Communications</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="https://blkout.vercel.app/platform"
              className="text-sm font-medium text-gray-600 hover:text-blkout-600 transition-colors flex items-center gap-1"
            >
              Community Platform
              <ExternalLink size={14} />
            </a>
            <Link
              to="/discover"
              className={`text-sm font-medium transition-colors ${
                !isAdminRoute
                  ? 'text-blkout-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Discover
            </Link>
            {isAuthenticated && (
              <Link
                to="/admin"
                className={`text-sm font-medium transition-colors ${
                  isAdminRoute
                    ? 'text-blkout-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <div className="w-10 h-10 bg-blkout-100 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <User size={20} className="text-blkout-600" />
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link
                to="/discover"
                className="btn btn-primary text-sm"
              >
                Explore Content
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
