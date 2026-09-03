
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Bot,
  Settings,
  UserCircle,
  Mail,
  Banknote,
  CalendarCheck,
  Newspaper,
  PoundSterling,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Event Moderation', href: '/admin/events', icon: CalendarCheck },
  { name: 'News Moderation', href: '/admin/news', icon: Newspaper },
  { name: 'Content Calendar', href: '/admin/calendar', icon: Calendar },
  { name: 'Funding', href: '/admin/fundraising', icon: Banknote },
  { name: 'Finance', href: '/admin/finance', icon: PoundSterling },
  { name: 'Agents', href: '/admin/agents', icon: Bot },
  { name: 'Newsletters', href: '/admin/newsletters', icon: Mail },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Account', href: '/admin/account', icon: UserCircle },
];


// Status dot reads /api/health. It was a hardcoded green dot until 3 Sep 2026 and
// stayed green through a total API outage.
type Health = 'checking' | 'ok' | 'degraded' | 'down';
const HEALTH_DOT: Record<Health, string> = {
  checking: 'bg-gray-300',
  ok: 'bg-green-500',
  degraded: 'bg-amber-500',
  down: 'bg-red-500',
};
const HEALTH_LABEL: Record<Health, string> = {
  checking: 'Checking API…',
  ok: 'API and database reachable',
  degraded: 'API up, database FAILED',
  down: 'API DOWN',
};

export function Sidebar() {
  const [health, setHealth] = useState<Health>('checking');
  const [detail, setDetail] = useState('');
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const r = await fetch('/api/health', { cache: 'no-store' });
        const j = await r.json().catch(() => null);
        if (cancelled) return;
        if (!j || j.service !== 'comms-blkout') {
          setHealth('down');
          setDetail(`wrong responder (HTTP ${r.status})`);
          return;
        }
        setHealth(j.status === 'ok' ? 'ok' : 'degraded');
        setDetail(String(j.db ?? ''));
      } catch {
        if (!cancelled) {
          setHealth('down');
          setDetail('API unreachable');
        }
      }
    };
    check();
    const t = setInterval(check, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return (
    <aside
      className="hidden lg:block fixed left-0 top-[73px] h-[calc(100vh-73px)] w-64 bg-white border-r border-gray-200"
      role="complementary"
      aria-label="Admin sidebar"
    >
      <nav className="p-4 space-y-1" aria-label="Admin navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/admin'}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} aria-hidden="true" />
                <span>{item.name}</span>
                {isActive && <span className="sr-only">(current page)</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status Indicator — live, from /api/health */}
      <div
        className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${HEALTH_DOT[health]}`} aria-hidden="true" />
          <span className="text-gray-600">
            {HEALTH_LABEL[health]}
            {detail && health !== 'ok' ? ` — ${detail}` : ''}
          </span>
        </div>
      </div>
    </aside>
  );
}
