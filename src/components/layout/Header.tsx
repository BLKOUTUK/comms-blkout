
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, User, LogOut, Home, Calendar, Newspaper, Brain, ExternalLink, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Second-row pages: Discover, AIvor intro, About (matched by route)
const SECOND_ROW_ROUTES = ['/discover', '/about'];

const secondaryNav = [
  { id: 'discover', label: 'Discover', href: '/discover', internal: true },
  { id: 'community', label: 'Community', href: 'https://blkouthub.com' },
  { id: 'shop', label: 'Shop', href: 'https://blkoutuk.com/shop' },
  { id: 'membership', label: 'Membership', href: 'https://blkoutuk.com/membership' },
  { id: 'about', label: 'About', href: 'https://blkoutuk.com/about' },
];

export function Header() {
  const { user, isAuthenticated, signOut } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showSecondRow = SECOND_ROW_ROUTES.some(r => location.pathname.startsWith(r));

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header
      className="bg-gray-900 border-b border-yellow-500/30 sticky top-0 z-50 shadow-lg backdrop-blur-sm"
      role="banner"
    >
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            {isAdminRoute && (
              <button
                className="lg:hidden text-gray-300 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md p-1"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {isMobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
              </button>
            )}
            <Link to="/discover" className="flex items-center gap-3" aria-label="BLKOUT Communications Hub - Go to homepage">
              <img
                src="/images/blkout_logo_roundel_colour.png"
                alt="BLKOUT"
                className="w-10 h-10 object-contain drop-shadow-lg"
              />
              <div className="border-l border-yellow-500/30 pl-3">
                <h1 className="text-xl font-black text-yellow-500">BLKOUT</h1>
                <p className="text-xs text-gray-400">Communications Hub</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation — Top 5 */}
          <nav className="hidden md:flex items-center gap-4" aria-label="Main navigation">
            <a
              href="https://blkoutuk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-md text-base font-black uppercase tracking-widest transition-all duration-200 text-gray-200 hover:text-yellow-400 hover:bg-yellow-500/10 flex items-center gap-2"
            >
              <Home size={16} />
              Home
            </a>
            <a
              href="https://events.blkoutuk.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-md text-base font-black uppercase tracking-widest transition-all duration-200 text-gray-200 hover:text-yellow-400 hover:bg-yellow-500/10 flex items-center gap-2"
            >
              <Calendar size={16} />
              Events
            </a>
            <a
              href="https://news.blkoutuk.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-md text-base font-black uppercase tracking-widest transition-all duration-200 text-gray-200 hover:text-yellow-400 hover:bg-yellow-500/10 flex items-center gap-2"
            >
              <Newspaper size={16} />
              News
            </a>
            <a
              href="https://ivor.blkoutuk.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-md text-base font-black uppercase tracking-widest transition-all duration-200 text-gray-200 hover:text-yellow-400 hover:bg-yellow-500/10 flex items-center gap-2"
            >
              <Brain size={16} />
              AIvor
            </a>
            <a
              href="https://voices.blkoutuk.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-md text-base font-black uppercase tracking-widest transition-all duration-200 text-gray-200 hover:text-yellow-400 hover:bg-yellow-500/10 flex items-center gap-2"
            >
              <ExternalLink size={16} />
              Voices
            </a>

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
                  className="p-2 text-gray-400 hover:text-yellow-500 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md"
                  aria-label="Sign out"
                >
                  <LogOut size={20} aria-hidden="true" />
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

      {/* Second row — only on Discover and About pages */}
      {showSecondRow && (
        <div className="border-t border-purple-500/30 bg-gray-900/80">
          <div className="px-6 py-1.5">
            <nav className="hidden md:flex items-center gap-2 justify-end" aria-label="Secondary navigation">
              {secondaryNav.map((item) =>
                item.internal ? (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={`px-3 py-1 rounded-md text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                      location.pathname.startsWith(item.href)
                        ? 'bg-purple-500/15 text-purple-400'
                        : 'text-gray-400 hover:text-purple-400 hover:bg-purple-500/10'
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-md text-sm font-bold uppercase tracking-wider transition-all duration-200 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 flex items-center gap-1"
                  >
                    {item.label}
                    <ExternalLink size={10} className="opacity-50" />
                  </a>
                )
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
