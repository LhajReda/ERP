'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/error-message';
import {
  useBudgetControlPolicy,
  useAddInvoicePayment,
  useDownloadEnterpriseCfoExport,
  useEnterprisePortfolio,
  useExpiringCertifications,
  useFarmBudgetStatus,
  useFarms,
  useInvoices,
  useLowStockAlerts,
  useMarkAllAsRead,
  useNotifications,
  useReliabilityOverview,
  useUnreadCount,
  useUpdateInvoiceStatus,
} from '@/hooks/use-api';
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileDown,
  Package,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

type FarmOption = {
  id?: string;
  _id?: string;
  name?: string;
};

type InvoiceRecord = {
  id: string;
  invoiceNumber?: string;
  status?: string;
  total?: number;
  amountDue?: number;
  dueDate?: string;
  type?: string;
  client?: { name?: string };
  supplier?: { name?: string };
};

type NotificationRecord = {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
  actionUrl?: string;
};

type PortfolioSummary = {
  farmsCount: number;
  totalArea: number;
  activeCycles: number;
  employees: number;
  presentEmployees: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  stockCriticalCount: number;
  expiringCertifications30d: number;
  payrollMonthlyEstimate: number;
};

type RiskFarmRecord = {
  farmId: string;
  farmName: string;
  riskScore: number;
  reasons?: string[];
};

type OperationalAlert = {
  farmId: string;
  farmName: string;
  severity?: string;
  message: string;
};

type PortfolioPayload = {
  summary?: Partial<PortfolioSummary>;
  riskFarms?: RiskFarmRecord[];
  operationalAlerts?: OperationalAlert[];
};

type ReliabilityOverviewPayload = {
  requestVolume?: {
    availabilityPercent?: number;
    errorRatePercent?: number;
  };
  latency?: {
    p95Ms?: number;
  };
  burn?: {
    availabilityGapPercent?: number;
    latencyGapMs?: number;
  };
};

type BudgetStatus = 'NO_BUDGET' | 'HEALTHY' | 'WARNING' | 'HARD_STOP';

type BudgetSnapshot = {
  status?: BudgetStatus;
  monthlyBudget?: number;
  spent?: number;
  remaining?: number;
  utilizationPercent?: number | null;
  warningThresholdAmount?: number;
  hardStopThresholdAmount?: number;
};

type StockAlertRow = {
  id?: string;
  name?: string;
  currentStock?: number;
  minStock?: number;
};

type ExpiringCertificationRow = {
  id?: string;
  type?: string;
  expiryDate?: string;
};

const EMPTY_SUMMARY: PortfolioSummary = {
  farmsCount: 0,
  totalArea: 0,
  activeCycles: 0,
  employees: 0,
  presentEmployees: 0,
  monthlyRevenue: 0,
  monthlyExpenses: 0,
  monthlyBalance: 0,
  stockCriticalCount: 0,
  expiringCertifications30d: 0,
  payrollMonthlyEstimate: 0,
};

const formatMad = (value?: number) => `${(value ?? 0).toLocaleString('fr-MA')} MAD`;

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('fr-MA');
};

const invoiceStatusMeta = (status?: string) => {
  if (status === 'PAYEE') return { label: 'Payee', variant: 'success' as const };
  if (status === 'ANNULEE') return { label: 'Annulee', variant: 'danger' as const };
  if (status === 'ENVOYEE') return { label: 'Envoyee', variant: 'info' as const };
  if (status === 'EN_LITIGE') return { label: 'Litige', variant: 'danger' as const };
  if (status === 'PARTIELLEMENT_PAYEE') {
    return { label: 'Partiellement payee', variant: 'warning' as const };
  }
  if (status === 'VALIDEE') return { label: 'Validee', variant: 'secondary' as const };
  return { label: 'Brouillon', variant: 'warning' as const };
};

const alertVariant = (severity?: string) => {
  if (severity === 'high') return 'danger' as const;
  if (severity === 'medium') return 'warning' as const;
  return 'info' as const;
};

const budgetMeta = (status?: BudgetStatus) => {
  if (status === 'HEALTHY') {
    return { label: 'Sain', variant: 'success' as const, bar: 'bg-emerald-500' };
  }
  if (status === 'WARNING') {
    return { label: 'Alerte', variant: 'warning' as const, bar: 'bg-amber-500' };
  }
  if (status === 'HARD_STOP') {
    return { label: 'Hard-stop', variant: 'danger' as const, bar: 'bg-red-500' };
  }
  return { label: 'Non configure', variant: 'secondary' as const, bar: 'bg-slate-400' };
};

type WorkflowActionType = 'VALIDER' | 'ENVOYER' | 'PAYER';

const workflowActionsByStatus = (status?: string) => {
  if (status === 'BROUILLON') {
    return [{ type: 'VALIDER' as const, label: 'Valider', variant: 'outline' as const }];
  }
  if (status === 'VALIDEE') {
    return [{ type: 'ENVOYER' as const, label: 'Envoyer', variant: 'secondary' as const }];
  }
  if (status === 'ENVOYEE' || status === 'PARTIELLEMENT_PAYEE' || status === 'EN_LITIGE') {
    return [{ type: 'PAYER' as const, label: 'Encaisser', variant: 'success' as const }];
  }
  return [];
};

export default function CommandCenterPage() {
  const locale = useLocale();
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const { data: farms, isLoading: farmsLoading } = useFarms();
  const { data: portfolio, isLoading: portfolioLoading } = useEnterprisePortfolio(6);
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: notifications, isLoading: notificationsLoading } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const { data: reliabilityOverview, isLoading: reliabilityLoading } = useReliabilityOverview();
  const { data: lowStockAlerts, isLoading: lowStockLoading } = useLowStockAlerts(
    activeFarmId || undefined,
  );
  const { data: expiringCertifications, isLoading: expiringLoading } =
    useExpiringCertifications(activeFarmId || undefined);
  const { data: budgetPolicy } = useBudgetControlPolicy();
  const { data: farmBudgetStatus, isLoading: budgetLoading } = useFarmBudgetStatus(
    activeFarmId || undefined,
    currentYear,
    currentMonth,
  );
  const markAllAsRead = useMarkAllAsRead();
  const downloadEnterpriseCfoExport = useDownloadEnterpriseCfoExport();
  const updateInvoiceStatus = useUpdateInvoiceStatus();
  const addInvoicePayment = useAddInvoicePayment();
  const [activeWorkflowInvoiceId, setActiveWorkflowInvoiceId] = useState<string | null>(null);
  const [activeWorkflowAction, setActiveWorkflowAction] = useState<WorkflowActionType | null>(
    null,
  );

  const farmOptions = useMemo(
    () => (Array.isArray(farms) ? (farms as FarmOption[]) : []),
    [farms],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setActiveFarmId(localStorage.getItem('fla7a_farm'));
  }, []);

  useEffect(() => {
    if (activeFarmId || farmOptions.length === 0) return;
    const firstFarmId = farmOptions[0]?.id || farmOptions[0]?._id;
    if (!firstFarmId) return;
    setActiveFarmId(firstFarmId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fla7a_farm', firstFarmId);
    }
  }, [activeFarmId, farmOptions]);

  const portfolioPayload = (portfolio || {}) as PortfolioPayload;
  const reliabilityPayload = (reliabilityOverview || {}) as ReliabilityOverviewPayload;
  const summary = { ...EMPTY_SUMMARY, ...(portfolioPayload.summary || {}) };
  const riskFarms = Array.isArray(portfolioPayload.riskFarms)
    ? portfolioPayload.riskFarms
    : [];
  const operationalAlerts = Array.isArray(portfolioPayload.operationalAlerts)
    ? portfolioPayload.operationalAlerts
    : [];
  const invoiceRows = (Array.isArray(invoices) ? invoices : []) as InvoiceRecord[];
  const notificationRows = (
    Array.isArray(notifications) ? notifications : []
  ) as NotificationRecord[];
  const lowStockRows = Array.isArray(lowStockAlerts) ? lowStockAlerts : [];
  const expiringRows = Array.isArray(expiringCertifications) ? expiringCertifications : [];
  const budgetSnapshot = (farmBudgetStatus || null) as BudgetSnapshot | null;

  const unreadCountValue =
    typeof unreadCount === 'number'
      ? unreadCount
      : Number((unreadCount as { count?: number } | null)?.count || 0);

  const pendingApprovalInvoices = invoiceRows.filter((invoice) =>
    ['BROUILLON', 'VALIDEE', 'ENVOYEE', 'PARTIELLEMENT_PAYEE', 'EN_LITIGE'].includes(
      invoice.status || '',
    ),
  );

  const overdueInvoices = invoiceRows.filter((invoice) => {
    if (!invoice.dueDate) return false;
    if ((invoice.status || '') === 'PAYEE' || (invoice.status || '') === 'ANNULEE') {
      return false;
    }
    const dueDate = new Date(invoice.dueDate);
    if (Number.isNaN(dueDate.getTime())) return false;
    return dueDate < now && (invoice.amountDue ?? invoice.total ?? 0) > 0;
  });

  const pendingAmount = pendingApprovalInvoices.reduce(
    (sum, invoice) => sum + (invoice.amountDue ?? invoice.total ?? 0),
    0,
  );

  const criticalIncidents =
    operationalAlerts.filter((alert) => alert.severity === 'high').length +
    overdueInvoices.length +
    summary.stockCriticalCount +
    summary.expiringCertifications30d;

  const attendanceRate = summary.employees
    ? Math.round((summary.presentEmployees / summary.employees) * 100)
    : 100;
  const availabilityPercent = Number(
    reliabilityPayload.requestVolume?.availabilityPercent || 100,
  );
  const errorRatePercent = Number(
    reliabilityPayload.requestVolume?.errorRatePercent || 0,
  );
  const p95Latency = Number(reliabilityPayload.latency?.p95Ms || 0);
  const availabilityGap = Number(
    reliabilityPayload.burn?.availabilityGapPercent || 0,
  );
  const latencyGap = Number(reliabilityPayload.burn?.latencyGapMs || 0);

  const activeFarmName =
    farmOptions.find((farm) => (farm.id || farm._id) === activeFarmId)?.name ||
    'Ferme active';

  const budgetState = budgetMeta(budgetSnapshot?.status);
  const budgetUtilization = Math.max(
    0,
    Math.min(100, Number(budgetSnapshot?.utilizationPercent || 0)),
  );

  const queue = [
    {
      id: 'ops',
      title: 'Alertes operationnelles',
      count: operationalAlerts.length,
      subtitle: 'Risque cash-flow, stock et execution terrain',
      href: '#operations',
      variant: operationalAlerts.length > 0 ? 'danger' : 'success',
    },
    {
      id: 'finance',
      title: 'Approvals finance',
      count: pendingApprovalInvoices.length,
      subtitle: `${formatMad(pendingAmount)} en attente de traitement`,
      href: `/${locale}/finance`,
      variant: pendingApprovalInvoices.length > 0 ? 'warning' : 'success',
    },
    {
      id: 'compliance',
      title: 'Certifications a renouveler',
      count: summary.expiringCertifications30d,
      subtitle: 'Sur les 30 prochains jours',
      href: `/${locale}/compliance`,
      variant: summary.expiringCertifications30d > 0 ? 'warning' : 'success',
    },
    {
      id: 'stock',
      title: 'Intrants en rupture',
      count: summary.stockCriticalCount,
      subtitle: 'Articles sous stock minimum',
      href: `/${locale}/stock`,
      variant: summary.stockCriticalCount > 0 ? 'danger' : 'success',
    },
  ] as const;

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
    } catch {
      // Keep page responsive even if action fails.
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const { blob, fileName } = await downloadEnterpriseCfoExport.mutateAsync({
        format,
        year: currentYear,
        month: currentMonth,
      });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Silent failure to avoid blocking dashboard usage.
    }
  };

  const handleWorkflowAction = async (
    invoice: InvoiceRecord,
    actionType: WorkflowActionType,
  ) => {
    setActiveWorkflowInvoiceId(invoice.id);
    setActiveWorkflowAction(actionType);
    try {
      if (actionType === 'VALIDER') {
        const reason = window.prompt('Motif de validation (optionnel)', '');
        await updateInvoiceStatus.mutateAsync({
          id: invoice.id,
          status: 'VALIDEE',
          reason: reason || undefined,
        });
        return;
      }

      if (actionType === 'ENVOYER') {
        const reason = window.prompt('Motif d envoi (optionnel)', '');
        await updateInvoiceStatus.mutateAsync({
          id: invoice.id,
          status: 'ENVOYEE',
          reason: reason || undefined,
        });
        return;
      }

      const amountDue = Number(invoice.amountDue ?? invoice.total ?? 0);
      if (!amountDue || amountDue <= 0) {
        alert('Aucun montant restant sur cette facture.');
        return;
      }
      const userInput = window.prompt(
        'Montant encaisse (MAD)',
        amountDue.toFixed(2),
      );
      if (userInput === null) return;
      const amount = Number(userInput.replace(',', '.'));
      if (Number.isNaN(amount) || amount <= 0) {
        alert('Montant invalide.');
        return;
      }
      if (amount > amountDue) {
        alert('Le montant depasse le reste a payer.');
        return;
      }
      await addInvoicePayment.mutateAsync({
        id: invoice.id,
        data: {
          amount,
          date: new Date().toISOString().slice(0, 10),
          method: 'VIREMENT',
          reference: `CC-${Date.now()}`,
          notes: 'Paiement saisi depuis Command Center',
        },
      });
    } catch (error: unknown) {
      alert(`Erreur workflow: ${getErrorMessage(error, 'Action echouee.')}`);
    } finally {
      setActiveWorkflowInvoiceId(null);
      setActiveWorkflowAction(null);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-background to-harvest-50/70 p-6">
        <div className="pointer-events-none absolute -top-14 right-10 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Badge variant={criticalIncidents > 0 ? 'warning' : 'success'} dot>
              Enterprise Command Center
            </Badge>
            <h1 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">
              Pilotage central multi-fermes
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Espace unique pour prioriser les urgences, valider les flux financiers
              et suivre la conformite en temps reel.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              leftIcon={<FileDown className="h-4 w-4" />}
              onClick={() => handleExport('excel')}
              loading={downloadEnterpriseCfoExport.isPending}
            >
              Export CFO
            </Button>
            <Button
              variant="outline"
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              onClick={handleMarkAllRead}
              loading={markAllAsRead.isPending}
            >
              Marquer notif lues
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Card hover={false}>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Incidents critiques</p>
            <p className="mt-1 text-2xl font-semibold">{criticalIncidents}</p>
            <p className="mt-1 text-xs text-muted-foreground">Overdue + high risk + stock + compliance</p>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Approvals finance</p>
            <p className="mt-1 text-2xl font-semibold">{pendingApprovalInvoices.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatMad(pendingAmount)} en attente</p>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Notifications non lues</p>
            <p className="mt-1 text-2xl font-semibold">{unreadCountValue}</p>
            <p className="mt-1 text-xs text-muted-foreground">Actions internes et systeme</p>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Sante RH globale</p>
            <p className="mt-1 text-2xl font-semibold">{attendanceRate}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.presentEmployees}/{summary.employees} presents
            </p>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Disponibilite API</p>
            <p className="mt-1 text-2xl font-semibold">
              {reliabilityLoading ? '-' : `${availabilityPercent.toFixed(2)}%`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {availabilityGap > 0
                ? `Gap SLO: ${availabilityGap.toFixed(2)}%`
                : `Error rate: ${errorRatePercent.toFixed(2)}%`}
            </p>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Latence API P95</p>
            <p className="mt-1 text-2xl font-semibold">
              {reliabilityLoading ? '-' : `${p95Latency.toFixed(0)} ms`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {latencyGap > 0
                ? `Au-dessus SLO: +${latencyGap.toFixed(0)} ms`
                : 'Sous objectif SLO (300 ms)'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card hover={false}>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Queue prioritaire</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Classement des sujets a traiter dans l ordre d impact business.
              </p>
            </div>
            <div className="w-full max-w-xs">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Focus ferme
              </label>
              <select
                value={activeFarmId || ''}
                onChange={(event) => {
                  const nextFarmId = event.target.value || null;
                  setActiveFarmId(nextFarmId);
                  if (typeof window !== 'undefined') {
                    if (nextFarmId) localStorage.setItem('fla7a_farm', nextFarmId);
                    else localStorage.removeItem('fla7a_farm');
                  }
                }}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                {!farmOptions.length && <option value="">Aucune ferme</option>}
                {farmOptions.map((farm) => {
                  const farmId = farm.id || farm._id || '';
                  return (
                    <option key={farmId} value={farmId}>
                      {farm.name || 'Ferme'}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {queue.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group rounded-xl border bg-card p-4 transition-all duration-200 hover:border-primary/35 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
                <Badge variant={item.variant}>{item.count}</Badge>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card hover={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Flux approbation finance
              </CardTitle>
              <Link
                href={`/${locale}/finance`}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Ouvrir finance
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : pendingApprovalInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune facture en attente.</p>
            ) : (
              <div className="space-y-3">
                {pendingApprovalInvoices.slice(0, 6).map((invoice) => {
                  const status = invoiceStatusMeta(invoice.status);
                  const counterparty =
                    invoice.client?.name || invoice.supplier?.name || 'Contrepartie';
                  const workflowActions = workflowActionsByStatus(invoice.status);
                  const isWorkflowBusy =
                    activeWorkflowInvoiceId === invoice.id &&
                    (updateInvoiceStatus.isPending || addInvoicePayment.isPending);
                  return (
                    <div
                      key={invoice.id}
                      className="rounded-lg border bg-secondary/20 px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{invoice.invoiceNumber}</p>
                          <p className="truncate text-xs text-muted-foreground">{counterparty}</p>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Echeance: {formatDate(invoice.dueDate)}</span>
                        <span>{formatMad(invoice.amountDue ?? invoice.total)}</span>
                      </div>
                      {workflowActions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {workflowActions.map((action) => (
                            <Button
                              key={action.type}
                              size="sm"
                              variant={action.variant}
                              loading={
                                isWorkflowBusy && activeWorkflowAction === action.type
                              }
                              onClick={() =>
                                handleWorkflowAction(invoice, action.type)
                              }
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-primary" />
                Feed notifications
              </CardTitle>
              <Badge variant={unreadCountValue > 0 ? 'warning' : 'success'}>
                {unreadCountValue} non lues
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : notificationRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune notification.</p>
            ) : (
              <div className="space-y-3">
                {notificationRows.slice(0, 6).map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-lg border bg-card px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{notification.title || 'Notification'}</p>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {notification.message || 'Mise a jour systeme.'}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card id="operations" hover={false}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Alertes operationnelles multi-fermes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {portfolioLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : operationalAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun signal critique multi-fermes pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {operationalAlerts.map((alert, index) => (
                <div
                  key={`${alert.farmId}-${index}`}
                  className="rounded-lg border bg-secondary/20 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <Badge variant={alertVariant(alert.severity)}>
                      {alert.severity === 'high' ? 'Critique' : 'A surveiller'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{alert.farmName}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card hover={false}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-primary" />
              Stock critique
            </CardTitle>
            <p className="text-xs text-muted-foreground">{activeFarmName}</p>
          </CardHeader>
          <CardContent>
            {lowStockLoading || farmsLoading ? (
              <Skeleton className="h-20" />
            ) : lowStockRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune rupture detectee.</p>
            ) : (
              <div className="space-y-2">
                {(lowStockRows as StockAlertRow[]).slice(0, 5).map((item: StockAlertRow) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-md bg-secondary/20 px-2.5 py-1.5 text-xs"
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="font-semibold text-amber-700">
                      {item.currentStock}/{item.minStock}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-primary" />
              Compliance proche echeance
            </CardTitle>
            <p className="text-xs text-muted-foreground">{activeFarmName}</p>
          </CardHeader>
          <CardContent>
            {expiringLoading ? (
              <Skeleton className="h-20" />
            ) : expiringRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune certification urgente.</p>
            ) : (
              <div className="space-y-2">
                {(expiringRows as ExpiringCertificationRow[]).slice(0, 5).map((item: ExpiringCertificationRow) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-md bg-secondary/20 px-2.5 py-1.5 text-xs"
                  >
                    <span className="truncate">{item.type || 'Certification'}</span>
                    <span className="font-semibold text-amber-700">
                      {formatDate(item.expiryDate)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-primary" />
              Controle budget
            </CardTitle>
            <p className="text-xs text-muted-foreground">{activeFarmName}</p>
          </CardHeader>
          <CardContent>
            {budgetLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={budgetState.variant}>{budgetState.label}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {Number(budgetSnapshot?.utilizationPercent || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${budgetState.bar}`}
                    style={{ width: `${budgetUtilization}%` }}
                  />
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Budget: {formatMad(budgetSnapshot?.monthlyBudget)}</p>
                  <p>Depenses: {formatMad(budgetSnapshot?.spent)}</p>
                  <p>Reste: {formatMad(budgetSnapshot?.remaining)}</p>
                  <p>
                    Seuil alerte: {formatMad(budgetSnapshot?.warningThresholdAmount)} | Hard-stop:{' '}
                    {formatMad(budgetSnapshot?.hardStopThresholdAmount)}
                  </p>
                  <p>
                    Policy globale: {budgetPolicy?.enforceHardStop ? 'Hard-stop actif' : 'Hard-stop off'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card hover={false}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-xs">Fermes a risque</p>
            </div>
            <p className="mt-2 text-xl font-semibold">{riskFarms.length}</p>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-xs">Factures overdue</p>
            </div>
            <p className="mt-2 text-xl font-semibold">{overdueInvoices.length}</p>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              <p className="text-xs">Cycles actifs groupe</p>
            </div>
            <p className="mt-2 text-xl font-semibold">{summary.activeCycles}</p>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <p className="text-xs">Balance mensuelle groupe</p>
            </div>
            <p className="mt-2 text-xl font-semibold">{formatMad(summary.monthlyBalance)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
