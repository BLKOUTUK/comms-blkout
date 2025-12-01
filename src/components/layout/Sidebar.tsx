
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Bot,
  BarChart3,
  Settings,
  Zap,
  Mail,
  Banknote,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Content Calendar', href: '/admin/calendar', icon: Calendar },
  { name: 'Drafts', href: '/admin/drafts', icon: FileText },
  { name: 'Grant Funding', href: '/admin/grants', icon: Banknote },
  { name: 'Agents', href: '/admin/agents', icon: Bot },
  { name: 'Newsletters', href: '/admin/newsletters', icon: Mail },
  { name: 'SocialSync', href: '/admin/socialsync', icon: Zap },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:block fixed left-0 top-[73px] h-[calc(100vh-73px)] w-64 bg-white border-r border-gray-200">
      <nav className="p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/admin'}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
            }
          >
            <item.icon size={20} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Status Indicator */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-gray-600">All Systems Operational</span>
        </div>
      </div>
    </aside>
  );
}
