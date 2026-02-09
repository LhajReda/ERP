'use client';

import { useState } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useNotifications, useUnreadCount, useMarkAsRead } from '@/hooks/use-api';
import { format } from 'date-fns';
import {
  Search,
  Bell,
  Globe,
  ChevronDown,
  X,
} from 'lucide-react';

const languages = [
  { code: 'fr', label: 'Francais', flag: 'FR' },
  { code: 'ar', label: 'العربية', flag: 'AR' },
  { code: 'dar', label: 'Darija', flag: 'DA' },
];

export default function Header() {
  const tc = useTranslations('common');
  const router = useRouter();
  const { locale } = useParams();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifications, isLoading: notificationsLoading } = useNotifications();
  const { data: unreadCountData } = useUnreadCount();
  const markAsRead = useMarkAsRead();

  const currentLang = languages.find((l) => l.code === locale) || languages[0];
  const unreadCount = unreadCountData?.count || unreadCountData?.unreadCount || 0;

  const handleNotificationClick = (notif: any) => {
    if (!notif.read && notif.id) {
      markAsRead.mutate(notif.id || notif._id);
    }
  };

  const switchLocale = (code: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${code}`);
    router.push(newPath);
    setLangOpen(false);
  };

  const breadcrumb = pathname
    .replace(`/${locale}/`, '')
    .split('/')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-card/80 backdrop-blur-md px-6 gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            <span className={i === breadcrumb.length - 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative">
        {searchOpen ? (
          <div className="flex items-center gap-2 animate-scale-in">
            <input
              autoFocus
              placeholder={tc('search')}
              className="h-9 w-64 rounded-lg border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
              onBlur={() => setSearchOpen(false)}
            />
            <button onClick={() => setSearchOpen(false)} className="p-1.5 text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 h-9 px-3 rounded-lg border bg-secondary/50 text-sm text-muted-foreground hover:bg-secondary transition-colors"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">{tc('search')}</span>
            <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-card px-1.5 text-[10px] text-muted-foreground">
              Ctrl+K
            </kbd>
          </button>
        )}
      </div>

      {/* Language */}
      <div className="relative">
        <button
          onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); }}
          className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors"
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium">{currentLang.flag}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        {langOpen && (
          <div className="absolute end-0 top-full mt-1 w-40 rounded-lg border bg-card shadow-float p-1 animate-scale-in z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLocale(lang.code)}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-colors',
                  locale === lang.code ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary'
                )}
              >
                <span className="text-xs font-medium w-6">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setNotifOpen(!notifOpen); setLangOpen(false); }}
          className="relative h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 end-1 h-2 w-2 rounded-full bg-harvest-500 ring-2 ring-card" />
          )}
        </button>
        {notifOpen && (
          <div className="absolute end-0 top-full mt-1 w-80 rounded-lg border bg-card shadow-float animate-scale-in z-50">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="warning" dot>{unreadCount} nouvelles</Badge>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notificationsLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Chargement...
                </div>
              ) : notifications && notifications.length > 0 ? (
                notifications.slice(0, 5).map((n: any) => (
                  <div
                    key={n.id || n._id}
                    onClick={() => handleNotificationClick(n)}
                    className="flex items-start gap-3 p-3 hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <div className={cn(
                      'h-2 w-2 rounded-full mt-1.5 flex-shrink-0',
                      n.type === 'warning' && 'bg-amber-500',
                      n.type === 'error' && 'bg-red-500',
                      n.type === 'success' && 'bg-emerald-500',
                      n.type === 'info' && 'bg-blue-500',
                      !n.type && 'bg-gray-500',
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', !n.read && 'font-medium')}>{n.message || n.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {n.createdAt ? format(new Date(n.createdAt), 'dd/MM/yyyy HH:mm') : 'Récent'}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aucune notification
                </div>
              )}
            </div>
            <div className="p-2 border-t">
              <button
                onClick={() => {
                  router.push(`/${locale}/notifications`);
                  setNotifOpen(false);
                }}
                className="w-full text-center text-xs text-primary font-medium py-1.5 rounded-md hover:bg-primary/5 transition-colors"
              >
                Voir tout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
