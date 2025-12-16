
import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { CrossModuleNav } from '../shared/CrossModuleNav';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function Layout({ children, showSidebar = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Link for keyboard navigation - WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only sr-only-focusable focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-blkout-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      <CrossModuleNav currentModule="discover" />
      <Header />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main
          id="main-content"
          role="main"
          aria-label="Main content"
          className={`flex-1 ${showSidebar ? 'ml-64' : ''}`}
          tabIndex={-1}
        >
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
