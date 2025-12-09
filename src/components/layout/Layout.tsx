
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
      <CrossModuleNav currentModule="discover" />
      <Header />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className={`flex-1 ${showSidebar ? 'ml-64' : ''}`}>
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
