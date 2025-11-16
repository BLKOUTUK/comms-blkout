
import { Link } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary nav */}
          <div className="flex">
            <Link to="/" className="flex items-center">
              <Sparkles className="h-8 w-8 text-blkout-purple" />
              <span className="ml-2 text-xl font-bold text-gray-900">BLKOUT UK</span>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link
                to="/discover"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blkout-purple transition-colors"
              >
                Discover
              </Link>
              {user && (
                <Link
                  to="/admin"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blkout-purple transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="btn-secondary"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-900 hover:bg-gray-100"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/discover"
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-900 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              Discover
            </Link>
            {user && (
              <Link
                to="/admin"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-900 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <div className="space-y-1 px-4">
                <p className="text-sm text-gray-600">{user.email}</p>
                <button
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }}
                  className="w-full text-left py-2 text-base font-medium text-red-600 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="px-4">
                <Link
                  to="/login"
                  className="block w-full btn-primary text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
