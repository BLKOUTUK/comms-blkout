
import { Link, useLocation } from 'react-router-dom';
import { Menu, User, LogOut, ExternalLink, Calendar, Newspaper } from 'lucide-react';
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
    <header className="bg-gray-900 border-b border-yellow-500/30 sticky top-0 z-50 shadow-lg backdrop-blur-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            {isAdminRoute && (
              <button className="lg:hidden text-gray-300 hover:text-yellow-500">
                <Menu size={24} />
              </button>
            )}
            <Link to="/discover" className="flex items-center gap-3">
              <img
                src="/images/blkout_logo_roundel_colour.png"
                alt="BLKOUT"
                className="w-10 h-10 object-contain drop-shadow-lg"
              />
              <div className="border-l border-yellow-500/30 pl-3">
                <h1 className="text-xl font-display font-bold text-yellow-500">BLKOUT</h1>
                <p className="text-xs text-gray-400">Communications Hub</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Platform Links */}
            <div className="flex items-center gap-1 px-2 border-r border-yellow-500/20">
              <a
                href="https://blkout.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 text-gray-300 hover:text-yellow-500 hover:bg-white/5 flex items-center gap-1.5"
              >
                Platform
                <ExternalLink size={14} />
              </a>
              <Link
                to="/discover"
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                  !isAdminRoute
                    ? 'bg-yellow-500/20 text-yellow-500'
                    : 'text-gray-300 hover:text-yellow-500 hover:bg-white/5'
                }`}
              >
                Discover
              </Link>
            </div>

            {/* External Hubs */}
            <div className="flex items-center gap-1 px-2 border-r border-yellow-500/20">
              <a
                href="https://events-blkout.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 text-gray-300 hover:text-yellow-500 hover:bg-white/5 flex items-center gap-1.5"
              >
                <Calendar size={14} />
                Events
              </a>
              <a
                href="https://news-blkout.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 text-gray-300 hover:text-yellow-500 hover:bg-white/5 flex items-center gap-1.5"
              >
                <Newspaper size={14} />
                Newsroom
              </a>
            </div>

            {/* Admin */}
            {isAuthenticated && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                  isAdminRoute
                    ? 'bg-yellow-500/20 text-yellow-500'
                    : 'text-gray-300 hover:text-yellow-500 hover:bg-white/5'
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
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.role}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <User size={20} className="text-yellow-500" />
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link
                to="/discover"
                className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
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
