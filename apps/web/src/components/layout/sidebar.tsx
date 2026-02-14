'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { useFarms } from '@/hooks/use-api';
import api from '@/lib/api';
import {
  LayoutDashboard,
  Tractor,
  Map,
  Sprout,
  Package,
  ClipboardList,
  Banknote,
  Users,
  ShoppingCart,
  ShieldCheck,
  Settings,
  Command,
  Bot,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'commandCenter', href: '/command-center', icon: Command },
  { key: 'farms', href: '/farms', icon: Tractor },
  { key: 'parcels', href: '/parcels', icon: Map },
  { key: 'culture', href: '/culture', icon: Sprout },
  { key: 'stock', href: '/stock', icon: Package },
  { key: 'procurement', href: '/procurement', icon: ClipboardList },
  { key: 'finance', href: '/finance', icon: Banknote },
  { key: 'hr', href: '/hr', icon: Users },
  { key: 'sales', href: '/sales', icon: ShoppingCart },
  { key: 'compliance', href: '/compliance', icon: ShieldCheck },
  { key: 'settings', href: '/settings', icon: Settings },
];

type FarmOption = {
  id: string;
  _id: string;
  name?: string;
};

export default function Sidebar() {
  const t = useTranslations('nav');
  const { locale } = useParams();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState('Utilisateur');
  const [userRoleLabel, setUserRoleLabel] = useState('Utilisateur');
  const [userInitials, setUserInitials] = useState('US');
  const { data: farms } = useFarms();
  const farmRows = useMemo(
    () => (Array.isArray(farms) ? (farms as FarmOption[]) : []),
    [farms],
  );

  useEffect(() => {
    // Load active farm from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedFarmId = localStorage.getItem('fla7a_farm');
      setActiveFarmId(savedFarmId);

      // If no farm is selected but farms are available, select the first one
      if (!savedFarmId && farmRows.length > 0) {
        const firstFarmId = farmRows[0].id || farmRows[0]._id;
        localStorage.setItem('fla7a_farm', firstFarmId);
        setActiveFarmId(firstFarmId);
      }
    }
  }, [farmRows]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const rawUser = localStorage.getItem('fla7a_user');
    if (!rawUser) return;

    try {
      const user = JSON.parse(rawUser) as {
        firstName?: string;
        lastName?: string;
        name?: string;
        role?: string;
      };
      const fullName =
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.name ||
        'Utilisateur';
      const initials = fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

      setUserDisplayName(fullName);
      setUserInitials(initials || 'US');
      setUserRoleLabel(
        user.role
          ? user.role
              .toLowerCase()
              .split('_')
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ')
          : 'Utilisateur',
      );
    } catch {
      setUserDisplayName('Utilisateur');
      setUserRoleLabel('Utilisateur');
      setUserInitials('US');
    }
  }, []);

  const handleFarmChange = (farmId: string) => {
    localStorage.setItem('fla7a_farm', farmId);
    setActiveFarmId(farmId);
    window.location.reload(); // Reload to refresh data for the new farm
  };

  const isActive = (href: string) => pathname === `/${locale}${href}`;

  return (
    <aside
      className={cn(
        'fixed inset-y-0 start-0 z-40 flex flex-col border-e bg-card transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-gradient">FLA7A</h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">ERP Agricole</p>
            </div>
          )}
        </Link>
      </div>

      {/* Farm Selector */}
      {!collapsed && farmRows.length > 0 && (
        <div className="px-3 py-3 border-b">
          <select
            value={activeFarmId || ''}
            onChange={(e) => handleFarmChange(e.target.value)}
            className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-border bg-card hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
          >
            {farmRows.map((farm: FarmOption) => (
              <option key={farm.id || farm._id} value={farm.id || farm._id}>
                {farm.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              href={`/${locale}${item.href}`}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-primary/10 text-primary shadow-xs'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? t(item.key) : undefined}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-primary')} />
              {!collapsed && <span className="truncate">{t(item.key)}</span>}
              {active && !collapsed && (
                <div className="ms-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* AI Button */}
      <div className="px-3 pb-2">
        <button
          className={cn(
            'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
            'bg-gradient-to-r from-primary/10 to-harvest-50 text-primary hover:from-primary/20 hover:to-harvest-100',
            collapsed && 'justify-center px-2'
          )}
        >
          <Bot className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Agent IA</span>}
        </button>
      </div>

      {/* User section */}
      <div className="border-t p-3">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar initials={userInitials} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium truncate">{userDisplayName}</p>
              <p className="text-[10px] text-muted-foreground">{userRoleLabel}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={async () => {
                try {
                  await api.post('/auth/logout');
                } catch {
                  // Continue with local cleanup even if the API logout fails.
                }
                localStorage.removeItem('fla7a_user');
                localStorage.removeItem('fla7a_tenant');
                localStorage.removeItem('fla7a_farm');
                window.location.href = `/${locale}/login`;
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-20 -end-3 h-6 w-6 rounded-full border bg-card shadow-xs flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
