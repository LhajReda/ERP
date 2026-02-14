'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFarms, useDashboardKPIs, useEnterprisePortfolio } from '@/hooks/use-api';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Tractor,
  Sprout,
  Banknote,
  Users,
  TrendingUp,
  CloudSun,
  Bot,
  ArrowRight,
  MapPin,
  Activity,
  AlertTriangle,
  Package,
  ShieldCheck,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const agents = [
  { name: 'Agro-conseil', emoji: '🌱', desc: 'Recommandations culturales' },
  { name: 'Finance', emoji: '💰', desc: 'Analyse rentabilite' },
  { name: 'Stock', emoji: '📦', desc: 'Gestion inventaire' },
  { name: 'Meteo', emoji: '🌤️', desc: 'Previsions et alertes' },
];

const fallbackRevenue = [
  { month: 'Jan', revenue: 45000, expenses: 32000 },
  { month: 'Fev', revenue: 52000, expenses: 28000 },
  { month: 'Mar', revenue: 61000, expenses: 35000 },
  { month: 'Avr', revenue: 58000, expenses: 30000 },
  { month: 'Mai', revenue: 72000, expenses: 38000 },
  { month: 'Jun', revenue: 85000, expenses: 42000 },
];

const fallbackCropSplit = [
  { name: 'Agrumes', value: 40, color: '#FF6F00' },
  { name: 'Oliviers', value: 30, color: '#1B7340' },
  { name: 'Maraichage', value: 20, color: '#0288D1' },
  { name: 'Cereales', value: 10, color: '#6D4C41' },
];

const fallbackActivities = [
  { text: 'Recolte oranges - Parcelle A1', time: 'Il y a 2h', color: 'text-emerald-500' },
  { text: 'Traitement phytosanitaire - Parcelle B3', time: 'Il y a 4h', color: 'text-sky-500' },
  { text: 'Irrigation programmee - Ferme Souss', time: 'Il y a 6h', color: 'text-primary' },
  { text: 'Alerte stock faible - Engrais NPK', time: 'Hier', color: 'text-amber-500' },
];

const formatMad = (value: number) => `${value.toLocaleString('fr-MA')} MAD`;

const riskVariant = (score: number) => {
  if (score >= 60) return 'danger' as const;
  if (score >= 35) return 'warning' as const;
  return 'info' as const;
};

type ActionPriority = 'critical' | 'important' | 'normal';

type ActionItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  metric: string;
  priority: ActionPriority;
  icon: LucideIcon;
};

type FarmSummary = {
  id?: string;
  _id?: string;
  area?: number;
  totalArea?: number;
};

type TopPerformerRow = {
  farmId: string;
  farmName?: string;
  region?: string;
  monthlyBalance?: number;
  performanceScore?: number;
};

type RiskFarmRow = {
  farmId: string;
  farmName?: string;
  reasons?: string[];
  riskScore?: number;
  monthlyBalance?: number;
};

type CropSplitRow = {
  name?: string;
  value?: number;
  color?: string;
};

type ActivityRow = {
  text?: string;
  description?: string;
  time?: string;
  timestamp?: string;
  color?: string;
};

const actionPriorityVariant = (priority: ActionPriority) => {
  if (priority === 'critical') return 'danger' as const;
  if (priority === 'important') return 'warning' as const;
  return 'info' as const;
};

const actionPriorityLabel = (priority: ActionPriority) => {
  if (priority === 'critical') return 'Urgent';
  if (priority === 'important') return 'Important';
  return 'Planifie';
};

const scorePresentation = (score: number) => {
  if (score >= 80) {
    return {
      label: 'Solide',
      badgeVariant: 'success' as const,
      textClass: 'text-emerald-600',
      progressClass: 'bg-emerald-500',
    };
  }
  if (score >= 60) {
    return {
      label: 'Moyen',
      badgeVariant: 'warning' as const,
      textClass: 'text-amber-600',
      progressClass: 'bg-amber-500',
    };
  }
  return {
    label: 'Fragile',
    badgeVariant: 'danger' as const,
    textClass: 'text-red-600',
    progressClass: 'bg-red-500',
  };
};

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [userName, setUserName] = useState('Utilisateur');

  const { data: farms, isLoading: farmsLoading } = useFarms();
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs(activeFarmId || undefined);
  const { data: portfolio, isLoading: portfolioLoading } = useEnterprisePortfolio(6);
  const farmRows = Array.isArray(farms) ? (farms as FarmSummary[]) : [];
  const revenueSeries = Array.isArray(kpis?.monthlySeries)
    ? kpis.monthlySeries
    : fallbackRevenue;
  const cropSplit = Array.isArray(kpis?.cropSplit)
    ? (kpis.cropSplit as CropSplitRow[])
    : fallbackCropSplit;
  const activityFeed = Array.isArray(kpis?.recentActivities)
    ? (kpis.recentActivities as ActivityRow[])
    : fallbackActivities;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const farmId = localStorage.getItem('fla7a_farm');
      setActiveFarmId(farmId);

      const userRaw = localStorage.getItem('fla7a_user');
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          setUserName(user.name || user.firstName || user.username || 'Utilisateur');
        } catch {}
      }
    }
  }, []);

  const totalFarms = farmRows.length;
  const totalArea =
    farmRows.reduce((sum: number, farm: FarmSummary) => sum + (farm.totalArea || farm.area || 0), 0) ||
    kpis?.totalArea ||
    0;
  const activeCycles = kpis?.activeCycles ?? 0;
  const monthlyRevenue = kpis?.monthlyRevenue ?? 0;
  const employees = kpis?.employees ?? 0;
  const presentEmployees = kpis?.presentEmployees ?? 0;
  const portfolioSummary = portfolio?.summary;
  const topPerformers = Array.isArray(portfolio?.topPerformers)
    ? (portfolio.topPerformers as TopPerformerRow[])
    : [];
  const riskFarms = Array.isArray(portfolio?.riskFarms)
    ? (portfolio.riskFarms as RiskFarmRow[])
    : [];

  const stockCriticalCount = portfolioSummary?.stockCriticalCount || 0;
  const expiringCertifications = portfolioSummary?.expiringCertifications30d || 0;
  const monthlyBalance = portfolioSummary?.monthlyBalance || 0;
  const riskFarmsCount = riskFarms.length;
  const attendanceRate = employees
    ? Math.round((presentEmployees / employees) * 100)
    : 100;
  const absenceRate = Math.max(0, 100 - attendanceRate);

  const enterpriseReadinessScore = Math.max(
    0,
    Math.min(
      100,
      88 -
        Math.min(stockCriticalCount * 8, 30) -
        Math.min(expiringCertifications * 7, 24) -
        Math.min(riskFarmsCount * 6, 24) -
        Math.min(Math.floor(absenceRate / 2), 14) +
        (monthlyBalance > 0 ? 6 : monthlyBalance < 0 ? -8 : 0) +
        ((kpis?.revenueTrend || 0) > 0 ? 4 : 0),
    ),
  );

  const scoreUI = scorePresentation(enterpriseReadinessScore);

  const actionItems: ActionItem[] = [
    {
      id: 'daily-ops',
      title: 'Valider operations culturales du jour',
      description:
        'Confirmer les travaux terrain, irrigation et traitements pour garder la traçabilite propre.',
      href: '/culture',
      metric: `${activeCycles} cycles actifs`,
      priority: 'normal',
      icon: Sprout,
    },
  ];

  if (riskFarmsCount > 0) {
    actionItems.unshift({
      id: 'risk-farms',
      title: 'Traiter les fermes a risque',
      description:
        'Les alertes cumulent compliance/stock/finances. Prioriser ce bloc pour eviter des pertes.',
      href: '/compliance',
      metric: `${riskFarmsCount} fermes sous surveillance`,
      priority: 'critical',
      icon: AlertTriangle,
    });
  }

  if (stockCriticalCount > 0) {
    actionItems.push({
      id: 'stock-critical',
      title: 'Corriger les ruptures stock',
      description:
        'Des intrants critiques sont sous le seuil. Lancer les commandes pour ne pas bloquer les cycles.',
      href: '/stock',
      metric: `${stockCriticalCount} alertes stock`,
      priority: 'important',
      icon: Package,
    });
  }

  if (expiringCertifications > 0) {
    actionItems.push({
      id: 'compliance-expiry',
      title: 'Renouveler les certifications proches',
      description:
        'Des dossiers ONSSA/qualite arrivent a expiration. Anticiper pour rester conforme.',
      href: '/compliance',
      metric: `${expiringCertifications} certifications a renouveler`,
      priority: 'important',
      icon: ShieldCheck,
    });
  }

  if (absenceRate >= 15) {
    actionItems.push({
      id: 'hr-capacity',
      title: 'Stabiliser la capacite RH',
      description:
        'Le taux d absence impacte la cadence terrain. Ajuster planning et remplacements.',
      href: '/hr',
      metric: `${absenceRate}% d absence`,
      priority: 'important',
      icon: Users,
    });
  }

  if (monthlyBalance < 0) {
    actionItems.push({
      id: 'cash-balance',
      title: 'Corriger la tresorerie mensuelle',
      description:
        'Le solde courant est negatif. Revoir depenses et priorites de paiement.',
      href: '/finance',
      metric: `Solde ${formatMad(monthlyBalance)}`,
      priority: 'critical',
      icon: Banknote,
    });
  }

  const urgentActionsCount = actionItems.filter(
    (item) => item.priority === 'critical' || item.priority === 'important',
  ).length;

  return (
    <div className="space-y-6 animate-in">
      {/* Executive hero */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-background to-harvest-50/70 p-6">
        <div className="pointer-events-none absolute -top-16 -right-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-20 h-56 w-56 rounded-full bg-harvest-100/60 blur-3xl" />
        <div className="relative grid gap-5 xl:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="info" dot>
                Cockpit executif
              </Badge>
              <Badge variant={urgentActionsCount > 0 ? 'warning' : 'success'}>
                {urgentActionsCount > 0 ? `${urgentActionsCount} actions prioritaires` : 'Situation stable'}
              </Badge>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">
              Bonjour, {userName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Vue instantanee de la performance groupe: cash, operations terrain,
              risques compliance et capacite RH.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {totalFarms} fermes
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1">
                <Tractor className="h-3.5 w-3.5 text-primary" />
                {totalArea} ha total
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1">
                <CloudSun className="h-3.5 w-3.5 text-harvest-500" />
                24 deg | Souss-Massa
              </span>
            </div>
            <Link
              href={`/${locale}/command-center`}
              className="mt-4 inline-flex items-center gap-1 rounded-lg border border-primary/25 bg-card px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              Ouvrir Command Center
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <Card hover={false} className="bg-card/80 p-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Revenus mensuels</p>
              <p className="text-lg font-semibold">{formatMad(monthlyRevenue)}</p>
              <p className="text-xs text-emerald-600">Trend: {kpis?.revenueTrend ?? 0}%</p>
            </Card>
            <Card hover={false} className="bg-card/80 p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Readiness exploitation</p>
                <Badge variant={scoreUI.badgeVariant}>{scoreUI.label}</Badge>
              </div>
              <p className={cn('text-lg font-semibold', scoreUI.textClass)}>
                {enterpriseReadinessScore}/100
              </p>
              <div className="mt-2 h-2 rounded-full bg-secondary">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', scoreUI.progressClass)}
                  style={{ width: `${enterpriseReadinessScore}%` }}
                />
              </div>
            </Card>
            <Card hover={false} className="bg-card/80 p-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Risque operationnel</p>
              <p className="text-lg font-semibold">
                {stockCriticalCount + expiringCertifications + riskFarmsCount}
              </p>
              <p className="text-xs text-muted-foreground">
                Stock {stockCriticalCount} | Certifs {expiringCertifications} | Fermes {riskFarmsCount}
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpisLoading || farmsLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard title={t('totalArea')} value={`${totalArea} ha`} subtitle={`${totalFarms} fermes actives`} icon={Tractor} trend={{ value: 12, label: 'vs mois dernier' }} variant="green" />
            <StatCard title={t('activeCycles')} value={activeCycles.toString()} subtitle={`${kpis?.harvestReady ?? 0} en récolte`} icon={Sprout} trend={{ value: kpis?.cycleTrend ?? 0 }} variant="blue" />
            <StatCard title={t('monthlyRevenue')} value={`${monthlyRevenue.toLocaleString('fr-MA')} MAD`} subtitle={kpis?.periodLabel ?? ''} icon={Banknote} trend={{ value: kpis?.revenueTrend ?? 0 }} variant="orange" />
            <StatCard title={t('employees')} value={employees.toString()} subtitle={`${presentEmployees} présents`} icon={Users} variant="earth" />
          </>
        )}
      </div>

      {/* Action Center */}
      <Card hover={false} className="border-primary/10">
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Centre d&apos;actions prioritaires</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Bloc decisionnel pour traiter les points qui freinent la performance.
              </p>
            </div>
            <Badge variant={urgentActionsCount > 0 ? 'warning' : 'success'} dot>
              {urgentActionsCount > 0 ? `${urgentActionsCount} a traiter` : 'Aucun blocage majeur'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className="group rounded-xl border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <Badge variant={actionPriorityVariant(item.priority)}>
                    {actionPriorityLabel(item.priority)}
                  </Badge>
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">{item.metric}</p>
                  <Link
                    href={`/${locale}${item.href}`}
                    className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
                  >
                    Traiter
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enterprise Portfolio */}
      <Card hover={false} className="border-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vue Groupe (Mazari3 Kbar)</CardTitle>
            <Badge variant="info" dot>
              Multi-fermes
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {portfolioLoading ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
              <Skeleton className="h-52" />
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="rounded-xl border bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">CA Groupe (mois)</p>
                  <p className="text-lg font-semibold">
                    {formatMad(portfolioSummary?.monthlyRevenue || 0)}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Solde: {formatMad(portfolioSummary?.monthlyBalance || 0)}
                  </p>
                </div>
                <div className="rounded-xl border bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Cycles Actifs Groupe</p>
                  <p className="text-lg font-semibold">{portfolioSummary?.activeCycles || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recolte: {portfolioSummary?.harvestReady || 0}
                  </p>
                </div>
                <div className="rounded-xl border bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Risque Stock / Conformite</p>
                  <p className="text-lg font-semibold">
                    {(portfolioSummary?.stockCriticalCount || 0) +
                      (portfolioSummary?.expiringCertifications30d || 0)}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Stock: {portfolioSummary?.stockCriticalCount || 0} | Certifs: {portfolioSummary?.expiringCertifications30d || 0}
                  </p>
                </div>
                <div className="rounded-xl border bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Capacite RH (presence)</p>
                  <p className="text-lg font-semibold">
                    {portfolioSummary?.employees
                      ? `${Math.round(((portfolioSummary?.presentEmployees || 0) / portfolioSummary.employees) * 100)}%`
                      : '0%'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {portfolioSummary?.presentEmployees || 0}/{portfolioSummary?.employees || 0} presents
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-xl border">
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <p className="text-sm font-semibold">Top Performers</p>
                    <Badge variant="success">{topPerformers.length} fermes</Badge>
                  </div>
                  <div className="divide-y">
                    {topPerformers.slice(0, 5).map((farm: TopPerformerRow) => (
                      <div key={farm.farmId} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{farm.farmName}</p>
                          <p className="text-xs text-muted-foreground truncate">{farm.region}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatMad(farm.monthlyBalance || 0)}</p>
                          <p className="text-xs text-muted-foreground">
                            Score {farm.performanceScore ?? 0}
                          </p>
                        </div>
                      </div>
                    ))}
                    {!topPerformers.length && (
                      <div className="px-4 py-6 text-sm text-muted-foreground">Aucune donnee disponible.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border">
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <p className="text-sm font-semibold">Fermes a risque</p>
                    <Badge variant="warning">{riskFarms.length} alertes</Badge>
                  </div>
                  <div className="divide-y">
                    {riskFarms.slice(0, 5).map((farm: RiskFarmRow) => (
                      <div key={farm.farmId} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{farm.farmName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {(farm.reasons || []).join(' • ')}
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <Badge variant={riskVariant(farm.riskScore || 0)}>
                            Risque {farm.riskScore || 0}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {formatMad(farm.monthlyBalance || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {!riskFarms.length && (
                      <div className="px-4 py-6 text-sm text-muted-foreground">Aucun risque majeur detecte.</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" hover={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenus vs Depenses</CardTitle>
              {kpis?.revenueTrend !== undefined && (
                <Badge variant="success" dot>{kpis.revenueTrend > 0 ? `+${kpis.revenueTrend}%` : `${kpis.revenueTrend}%`}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B7340" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1B7340" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6F00" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#FF6F00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number | string) =>
                    `${Number(value).toLocaleString()} MAD`
                  }
                />
                <Area type="monotone" dataKey="revenue" stroke="#1B7340" strokeWidth={2} fill="url(#gRev)" name="Revenus" />
                <Area type="monotone" dataKey="expenses" stroke="#FF6F00" strokeWidth={2} fill="url(#gExp)" name="Depenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardHeader><CardTitle>Repartition cultures</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={cropSplit} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {cropSplit.map((entry: CropSplitRow, i: number) => <Cell key={i} fill={entry.color || '#1B7340'} />)}
                </Pie>
                <Tooltip formatter={(value: number | string) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {cropSplit.map((crop: CropSplitRow, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: crop.color || '#1B7340' }} />
                    <span className="text-muted-foreground">{crop.name}</span>
                  </div>
                  <span className="font-semibold">{crop.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card hover={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Activite recente</CardTitle>
              <button className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">Voir tout <ArrowRight className="h-3 w-3" /></button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(activityFeed && activityFeed.length > 0 ? activityFeed : fallbackActivities).map((a: ActivityRow, i: number) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Activity className={`h-4 w-4 ${a.color || 'text-primary'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{a.text || a.description}</p>
                    <p className="text-xs text-muted-foreground">{a.time || a.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Agents IA</CardTitle>
              <Badge variant="default">8 agents</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {agents.map((agent, i) => (
                <button key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-secondary/50 hover:shadow-xs transition-all duration-200 text-start">
                  <span className="text-2xl">{agent.emoji}</span>
                  <div>
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-harvest-50 border border-primary/10">
              <p className="text-sm font-medium text-primary flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Conseil IA du jour</p>
              <p className="text-xs text-muted-foreground mt-1">Les conditions sont ideales pour la recolte des agrumes. Temperature: 22-26°C.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
