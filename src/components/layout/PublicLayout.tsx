
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Skip Link for keyboard navigation - WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-liberation-gold-divine focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Header - matches blkoutuk.com */}
      <nav
        className="sticky top-0 z-40 bg-black border-b border-liberation-gold-divine/30 shadow-lg backdrop-blur-sm"
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a
              href="https://blkoutuk.com"
              className="flex items-center gap-3"
              aria-label="BLKOUT - Go to main platform"
            >
              <img
                src="/images/blkout_logo_roundel_colour.png"
                alt="BLKOUT"
                className="h-10 md:h-12 w-auto hover:scale-105 transition-transform drop-shadow-lg"
              />
              <div className="hidden md:block border-l border-liberation-gold-divine/30 pl-3">
                <div className="text-liberation-gold-divine font-bold text-sm tracking-wider">
                  BLKOUT
                </div>
                <div className="text-gray-400 text-xs">Liberation Platform</div>
              </div>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
              <div className="flex items-center gap-1 px-2 border-r border-liberation-gold-divine/20">
                <a
                  href="https://blkoutuk.com"
                  className="px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 text-gray-300 hover:text-liberation-gold-divine hover:bg-white/5"
                >
                  Home
                </a>
                <Link
                  to="/discover"
                  className="px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 bg-liberation-gold-divine/20 text-liberation-gold-divine"
                >
                  Discover
                </Link>
              </div>

              <div className="flex items-center gap-1 px-2">
                <a
                  href="https://events.blkoutuk.cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 text-gray-300 hover:text-liberation-gold-divine hover:bg-white/5 flex items-center gap-1.5"
                >
                  Events
                  <ExternalLink size={12} />
                </a>
                <a
                  href="https://news.blkoutuk.cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 text-gray-300 hover:text-liberation-gold-divine hover:bg-white/5 flex items-center gap-1.5"
                >
                  News
                  <ExternalLink size={12} />
                </a>
                <a
                  href="https://voices.blkoutuk.cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 text-gray-300 hover:text-liberation-gold-divine hover:bg-white/5 flex items-center gap-1.5"
                >
                  Voices
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Mobile - Platform link */}
            <a
              href="https://blkoutuk.com"
              className="md:hidden px-4 py-2 bg-liberation-gold-divine/10 text-liberation-gold-divine rounded-md text-sm font-semibold border border-liberation-gold-divine/30 hover:bg-liberation-gold-divine/20 transition-colors"
            >
              Platform
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" role="main" aria-label="Main content" tabIndex={-1}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>

      {/* Footer - matches blkoutuk.com */}
      <footer className="bg-black border-t border-liberation-sovereignty-gold/20 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <a
              href="https://blkoutuk.com"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/10"
            >
              Platform
            </a>
            <a
              href="https://events.blkoutuk.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/10"
            >
              Events
            </a>
            <a
              href="https://news.blkoutuk.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/10"
            >
              News
            </a>
            <a
              href="https://voices.blkoutuk.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/10"
            >
              Voices
            </a>
          </div>

          {/* Liberation Values */}
          <div className="border-t border-liberation-sovereignty-gold/10 pt-8">
            <h3 className="text-liberation-sovereignty-gold font-bold text-lg mb-3 text-center">
              LIBERATION VALUES
            </h3>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-gray-400 mb-8">
              <span>Community Sovereignty</span>
              <span className="text-liberation-sovereignty-gold/30">&middot;</span>
              <span>Democratic Governance</span>
              <span className="text-liberation-sovereignty-gold/30">&middot;</span>
              <span>Cooperative Ownership</span>
              <span className="text-liberation-sovereignty-gold/30">&middot;</span>
              <span>Data Justice</span>
              <span className="text-liberation-sovereignty-gold/30">&middot;</span>
              <span>Black Queer Liberation</span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex justify-center gap-6 mb-8">
            <a
              href="https://instagram.com/blkout_uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-liberation-sovereignty-gold transition-colors duration-200"
              aria-label="Instagram"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com/company/blkoutuk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-liberation-sovereignty-gold transition-colors duration-200"
              aria-label="LinkedIn"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a
              href="https://twitter.com/blkoutuk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-liberation-sovereignty-gold transition-colors duration-200"
              aria-label="Twitter/X"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://www.youtube.com/@blkoutuk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-liberation-sovereignty-gold transition-colors duration-200"
              aria-label="YouTube"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>

          {/* Legal */}
          <div className="border-t border-liberation-sovereignty-gold/10 pt-6">
            <div className="flex flex-wrap justify-center gap-4 mb-4 text-xs">
              <a
                href="mailto:info@blkoutuk.com"
                className="text-gray-500 hover:text-liberation-sovereignty-gold transition-colors duration-200"
              >
                Contact
              </a>
              <Link
                to="/admin"
                className="text-gray-500 hover:text-liberation-sovereignty-gold transition-colors duration-200"
              >
                Team Access
              </Link>
            </div>
            <p className="text-center text-xs text-gray-500 max-w-2xl mx-auto">
              BLKOUT Creative Ltd is registered by the Financial Conduct Authority (London) as a
              Community Benefit Society under the Co-operative and Community Benefit Societies Act 2014.
            </p>
            <p className="text-center text-xs text-gray-600 mt-2">
              &copy; {new Date().getFullYear()} BLKOUT UK. Technology for Black Queer Liberation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
