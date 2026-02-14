'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  useBudgetControlPolicy,
  useClients,
  useCreateInvoice,
  useDownloadEnterpriseCfoExport,
  useFarmBudgetStatus,
  useFarms,
  useInvoices,
  useSuppliers,
  useUpdateBudgetControlPolicy,
  useUpsertFarmBudget,
} from '@/hooks/use-api';
import { getErrorMessage } from '@/lib/error-message';
import {
  AlertTriangle,
  FileDown,
  Plus,
  Receipt,
  ShieldCheck,
  ShieldX,
  Wallet,
} from 'lucide-react';

type BudgetStatus = 'NO_BUDGET' | 'HEALTHY' | 'WARNING' | 'HARD_STOP';
type FarmOption = { id?: string; _id?: string; name?: string };
type PartnerOption = { id?: string; _id?: string; name?: string };
type InvoiceRow = {
  id?: string;
  _id?: string;
  invoiceNumber?: string;
  number?: string;
  status?: string;
  type?: string;
  total?: number;
  amount?: number;
  dueDate?: string;
  client?: { name?: string };
  supplier?: { name?: string };
  clientName?: string;
  clientId?: string;
  supplierId?: string;
};

const monthOptions = [
  { value: '1', label: 'Janvier' },
  { value: '2', label: 'Fevrier' },
  { value: '3', label: 'Mars' },
  { value: '4', label: 'Avril' },
  { value: '5', label: 'Mai' },
  { value: '6', label: 'Juin' },
  { value: '7', label: 'Juillet' },
  { value: '8', label: 'Aout' },
  { value: '9', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Decembre' },
];

const toBudgetBadgeVariant = (status?: BudgetStatus) => {
  if (status === 'HEALTHY') return 'success' as const;
  if (status === 'WARNING') return 'warning' as const;
  if (status === 'HARD_STOP') return 'danger' as const;
  return 'secondary' as const;
};

const toBudgetStatusLabel = (status?: BudgetStatus) => {
  if (status === 'HEALTHY') return 'Sain';
  if (status === 'WARNING') return 'Alerte';
  if (status === 'HARD_STOP') return 'Critique';
  return 'Non configure';
};

const formatMad = (value?: number) => `${(value ?? 0).toLocaleString()} MAD`;

const getInvoiceTypeLabel = (type?: string) => {
  if (type === 'VENTE' || type === 'SALE') return 'Vente';
  if (type === 'ACHAT' || type === 'PURCHASE') return 'Achat';
  if (type === 'AVOIR_VENTE') return 'Avoir vente';
  if (type === 'AVOIR_ACHAT') return 'Avoir achat';
  return type || '-';
};

const getInvoiceStatusMeta = (status?: string) => {
  if (status === 'PAYEE' || status === 'PAID') {
    return { label: 'Payee', variant: 'success' as const };
  }
  if (status === 'ANNULEE') return { label: 'Annulee', variant: 'danger' as const };
  if (status === 'VALIDEE') return { label: 'Validee', variant: 'info' as const };
  if (status === 'EN_LITIGE') return { label: 'Litige', variant: 'danger' as const };
  if (status === 'PARTIELLEMENT_PAYEE') {
    return { label: 'Partiellement payee', variant: 'warning' as const };
  }
  if (status === 'ENVOYEE') return { label: 'Envoyee', variant: 'secondary' as const };
  return { label: 'Brouillon', variant: 'warning' as const };
};

export default function FinancePage() {
  const t = useTranslations('finance');
  const now = useMemo(() => new Date(), []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    supplierId: '',
    amount: '',
    issueDate: now.toISOString().slice(0, 10),
    dueDate: '',
    description: '',
    type: 'VENTE',
  });
  const [policyForm, setPolicyForm] = useState({
    warningThresholdPercent: '85',
    hardStopThresholdPercent: '110',
    enforceHardStop: 'true',
  });
  const [budgetYear, setBudgetYear] = useState(String(now.getFullYear()));
  const [budgetMonth, setBudgetMonth] = useState(String(now.getMonth() + 1));
  const [budgetAmount, setBudgetAmount] = useState('');
  const { data: farms } = useFarms();
  const farmList = Array.isArray(farms) ? (farms as FarmOption[]) : [];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveFarmId(localStorage.getItem('fla7a_farm'));
    }
  }, []);

  useEffect(() => {
    if (activeFarmId || !Array.isArray(farms) || farms.length === 0) {
      return;
    }
    const firstFarmId = farms[0]?.id || farms[0]?._id;
    if (!firstFarmId) return;
    setActiveFarmId(firstFarmId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fla7a_farm', firstFarmId);
    }
  }, [activeFarmId, farms]);

  const selectedYear = Number(budgetYear) || now.getFullYear();
  const selectedMonth = Number(budgetMonth) || now.getMonth() + 1;

  const { data: invoices, isLoading } = useInvoices(activeFarmId || undefined);
  const { data: clients } = useClients(activeFarmId || undefined);
  const { data: suppliers } = useSuppliers(activeFarmId || undefined);
  const invoiceRows = Array.isArray(invoices) ? (invoices as InvoiceRow[]) : [];
  const clientRows = Array.isArray(clients) ? (clients as PartnerOption[]) : [];
  const supplierRows = Array.isArray(suppliers) ? (suppliers as PartnerOption[]) : [];
  const { data: budgetPolicy, isLoading: isBudgetPolicyLoading } = useBudgetControlPolicy();
  const {
    data: farmBudgetStatus,
    isLoading: isFarmBudgetLoading,
  } = useFarmBudgetStatus(activeFarmId || undefined, selectedYear, selectedMonth);
  const createInvoice = useCreateInvoice();
  const downloadEnterpriseCfoExport = useDownloadEnterpriseCfoExport();
  const updateBudgetPolicy = useUpdateBudgetControlPolicy();
  const upsertFarmBudget = useUpsertFarmBudget();

  useEffect(() => {
    if (!budgetPolicy) return;
    setPolicyForm({
      warningThresholdPercent: String(budgetPolicy.warningThresholdPercent ?? 85),
      hardStopThresholdPercent: String(budgetPolicy.hardStopThresholdPercent ?? 110),
      enforceHardStop: budgetPolicy.enforceHardStop ? 'true' : 'false',
    });
  }, [budgetPolicy]);

  useEffect(() => {
    if (!farmBudgetStatus) return;
    setBudgetAmount(String(farmBudgetStatus.monthlyBudget ?? 0));
  }, [farmBudgetStatus, activeFarmId, selectedYear, selectedMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFarmId) {
      alert('Selectionnez une ferme active avant de creer une facture.');
      return;
    }
    const amount = Number(formData.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      alert('Montant invalide.');
      return;
    }
    if (formData.type === 'VENTE' && !formData.clientId) {
      alert('Selectionnez un client.');
      return;
    }
    if (formData.type === 'ACHAT' && !formData.supplierId) {
      alert('Selectionnez un fournisseur.');
      return;
    }

    const lineDescription =
      formData.description.trim() ||
      `Facture ${formData.type === 'VENTE' ? 'vente' : 'achat'}`;

    try {
      await createInvoice.mutateAsync({
        farmId: activeFarmId,
        type: formData.type,
        date: formData.issueDate,
        dueDate: formData.dueDate,
        clientId: formData.type === 'VENTE' ? formData.clientId : undefined,
        supplierId: formData.type === 'ACHAT' ? formData.supplierId : undefined,
        notes: formData.description || undefined,
        lines: [
          {
            description: lineDescription,
            quantity: 1,
            unit: 'UNITE',
            unitPrice: amount,
          },
        ],
      });
      setDialogOpen(false);
      setFormData({
        clientId: '',
        supplierId: '',
        amount: '',
        issueDate: now.toISOString().slice(0, 10),
        dueDate: '',
        description: '',
        type: 'VENTE',
      });
      alert('Facture créée avec succès!');
    } catch (error: unknown) {
      alert(`Erreur: ${getErrorMessage(error)}`);
    }
  };

  const handleBudgetPolicySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const warningThresholdPercent = Number(policyForm.warningThresholdPercent);
    const hardStopThresholdPercent = Number(policyForm.hardStopThresholdPercent);
    if (
      Number.isNaN(warningThresholdPercent) ||
      Number.isNaN(hardStopThresholdPercent) ||
      warningThresholdPercent < 0 ||
      hardStopThresholdPercent < 0
    ) {
      alert('Les seuils budgetaires doivent etre des nombres positifs.');
      return;
    }

    try {
      await updateBudgetPolicy.mutateAsync({
        warningThresholdPercent,
        hardStopThresholdPercent,
        enforceHardStop: policyForm.enforceHardStop === 'true',
      });
      alert('Politique budgetaire mise a jour.');
    } catch (error: unknown) {
      alert(`Erreur: ${getErrorMessage(error)}`);
    }
  };

  const handleFarmBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFarmId) {
      alert('Selectionnez une ferme.');
      return;
    }
    const amount = Number(budgetAmount);
    if (Number.isNaN(amount) || amount < 0) {
      alert('Le budget mensuel doit etre un nombre positif.');
      return;
    }

    try {
      await upsertFarmBudget.mutateAsync({
        farmId: activeFarmId,
        year: selectedYear,
        month: selectedMonth,
        amount,
      });
      alert('Budget mensuel enregistre.');
    } catch (error: unknown) {
      alert(`Erreur: ${getErrorMessage(error)}`);
    }
  };

  const handleFarmChange = (farmId: string) => {
    const nextFarmId = farmId || null;
    setActiveFarmId(nextFarmId);
    if (typeof window !== 'undefined') {
      if (nextFarmId) {
        localStorage.setItem('fla7a_farm', nextFarmId);
      } else {
        localStorage.removeItem('fla7a_farm');
      }
    }
  };

  const handleEnterpriseExport = async (format: 'excel' | 'pdf') => {
    try {
      const { blob, fileName } = await downloadEnterpriseCfoExport.mutateAsync({
        format,
        year: selectedYear,
        month: selectedMonth,
      });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error: unknown) {
      alert(`Erreur export: ${getErrorMessage(error)}`);
    }
  };

  const totalAmount =
    invoiceRows.reduce(
      (sum: number, inv: InvoiceRow) => sum + (inv.total ?? inv.amount ?? 0),
      0,
    );

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? '...' : `${invoiceRows.length} factures - ${totalAmount.toLocaleString()} MAD`}
          </p>
        </div>
        <Button variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>
          Nouvelle facture
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          leftIcon={<FileDown className="h-4 w-4" />}
          onClick={() => handleEnterpriseExport('excel')}
          loading={downloadEnterpriseCfoExport.isPending}
        >
          Export CFO Excel
        </Button>
        <Button
          variant="outline"
          leftIcon={<FileDown className="h-4 w-4" />}
          onClick={() => handleEnterpriseExport('pdf')}
          loading={downloadEnterpriseCfoExport.isPending}
        >
          Export CFO PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card hover={false}>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Politique budgetaire</p>
                <p className="text-xs text-muted-foreground">
                  Gouvernance globale des seuils d alerte et de blocage.
                </p>
              </div>
              <Badge variant={policyForm.enforceHardStop === 'true' ? 'success' : 'warning'} dot>
                {policyForm.enforceHardStop === 'true' ? 'Hard-stop actif' : 'Hard-stop desactive'}
              </Badge>
            </div>

            {isBudgetPolicyLoading ? (
              <Skeleton className="h-36" />
            ) : (
              <form className="space-y-4" onSubmit={handleBudgetPolicySubmit}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Seuil alerte (%)"
                    type="number"
                    min={0}
                    step="0.1"
                    value={policyForm.warningThresholdPercent}
                    onChange={(e) =>
                      setPolicyForm((prev) => ({
                        ...prev,
                        warningThresholdPercent: e.target.value,
                      }))
                    }
                    required
                  />
                  <Input
                    label="Seuil hard-stop (%)"
                    type="number"
                    min={0}
                    step="0.1"
                    value={policyForm.hardStopThresholdPercent}
                    onChange={(e) =>
                      setPolicyForm((prev) => ({
                        ...prev,
                        hardStopThresholdPercent: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <Select
                  label="Blocage depense hard-stop"
                  value={policyForm.enforceHardStop}
                  onChange={(e) =>
                    setPolicyForm((prev) => ({
                      ...prev,
                      enforceHardStop: e.target.value,
                    }))
                  }
                >
                  <option value="true">Activer le blocage automatique</option>
                  <option value="false">Ne pas bloquer (alerte critique)</option>
                </Select>

                <Button type="submit" variant="outline" loading={updateBudgetPolicy.isPending}>
                  Enregistrer la politique
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Budget mensuel par ferme</p>
                <p className="text-xs text-muted-foreground">
                  Pilotage budgetaire ferme par ferme pour exploitation multi-sites.
                </p>
              </div>
              <Badge variant={toBudgetBadgeVariant(farmBudgetStatus?.status)} dot>
                {toBudgetStatusLabel(farmBudgetStatus?.status)}
              </Badge>
            </div>

            <form className="space-y-4" onSubmit={handleFarmBudgetSubmit}>
              <Select
                label="Ferme"
                value={activeFarmId || ''}
                onChange={(e) => handleFarmChange(e.target.value)}
              >
                <option value="">Selectionner une ferme</option>
                {farmList.map((farm: FarmOption) => (
                  <option key={farm.id || farm._id} value={farm.id || farm._id}>
                    {farm.name}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input
                  label="Annee"
                  type="number"
                  min={2000}
                  max={2100}
                  value={budgetYear}
                  onChange={(e) => setBudgetYear(e.target.value)}
                />
                <Select
                  label="Mois"
                  value={budgetMonth}
                  onChange={(e) => setBudgetMonth(e.target.value)}
                >
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Budget (MAD)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                loading={upsertFarmBudget.isPending}
                leftIcon={<Wallet className="h-4 w-4" />}
              >
                Enregistrer budget ferme
              </Button>
            </form>

            {!activeFarmId ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Selectionnez une ferme pour consulter le statut budgetaire mensuel.
              </div>
            ) : isFarmBudgetLoading ? (
              <Skeleton className="h-28" />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">Depenses cumulees</p>
                  <p className="text-sm font-semibold">{formatMad(farmBudgetStatus?.spent)}</p>
                </div>
                <div className="rounded-lg border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">Budget mensuel</p>
                  <p className="text-sm font-semibold">{formatMad(farmBudgetStatus?.monthlyBudget)}</p>
                </div>
                <div className="rounded-lg border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">Reste budget</p>
                  <p
                    className={`text-sm font-semibold ${
                      (farmBudgetStatus?.remaining ?? 0) < 0 ? 'text-red-600' : 'text-foreground'
                    }`}
                  >
                    {formatMad(farmBudgetStatus?.remaining)}
                  </p>
                </div>
                <div className="rounded-lg border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">Utilisation</p>
                  <p className="text-sm font-semibold">
                    {farmBudgetStatus?.utilizationPercent ?? 0}%
                  </p>
                </div>
                <div className="col-span-2 rounded-lg border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">Seuils appliques</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline">
                      Alerte: {farmBudgetStatus?.policy?.warningThresholdPercent ?? 0}%
                    </Badge>
                    <Badge variant="outline">
                      Hard-stop: {farmBudgetStatus?.policy?.hardStopThresholdPercent ?? 0}%
                    </Badge>
                    <Badge
                      variant={farmBudgetStatus?.hardStopEnforced ? 'success' : 'warning'}
                    >
                      {farmBudgetStatus?.hardStopEnforced ? (
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" /> Blocage actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <ShieldX className="h-3.5 w-3.5" /> Blocage inactif
                        </span>
                      )}
                    </Badge>
                    {farmBudgetStatus?.status === 'WARNING' && (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> Seuil alerte depasse
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      ) : invoiceRows.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Aucune facture"
          description="Commencez par créer une facture"
          action={{
            label: 'Creer une facture',
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <Card hover={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/30">
                  <th className="text-start p-3 font-medium text-muted-foreground">Numéro</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">Montant</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">Échéance</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody>
                {invoiceRows.map((invoice: InvoiceRow) => (
                  <tr key={invoice.id || invoice._id} className="border-b hover:bg-secondary/20 transition-colors cursor-pointer">
                    <td className="p-3 font-medium">
                      {invoice.invoiceNumber || invoice.number || invoice.id || '-'}
                    </td>
                    <td className="p-3">
                      {invoice.client?.name ||
                        invoice.supplier?.name ||
                        invoice.clientName ||
                        invoice.clientId ||
                        invoice.supplierId ||
                        'N/A'}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          invoice.type === 'SALE' || invoice.type === 'VENTE'
                            ? 'success'
                            : 'warning'
                        }
                      >
                        {getInvoiceTypeLabel(invoice.type)}
                      </Badge>
                    </td>
                    <td className="p-3 font-semibold">
                      {(invoice.total ?? invoice.amount ?? 0).toLocaleString()} MAD
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-3">
                      <Badge variant={getInvoiceStatusMeta(invoice.status).variant} dot>
                        {getInvoiceStatusMeta(invoice.status).label}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Invoice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle facture</DialogTitle>
            <DialogDescription>Créez une nouvelle facture</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <Select
                label="Type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value,
                    clientId: '',
                    supplierId: '',
                  })
                }
                required
              >
                <option value="VENTE">Vente</option>
                <option value="ACHAT">Achat</option>
              </Select>
              <Select
                label={formData.type === 'VENTE' ? 'Client' : 'Fournisseur'}
                value={formData.type === 'VENTE' ? formData.clientId : formData.supplierId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    clientId: formData.type === 'VENTE' ? e.target.value : '',
                    supplierId: formData.type === 'ACHAT' ? e.target.value : '',
                  })
                }
                required
              >
                <option value="">
                  {formData.type === 'VENTE'
                    ? 'Selectionner un client'
                    : 'Selectionner un fournisseur'}
                </option>
                {formData.type === 'VENTE'
                  ? clientRows.map((c: PartnerOption) => (
                      <option key={c.id || c._id} value={c.id || c._id}>
                        {c.name}
                      </option>
                    ))
                  : supplierRows.map((s: PartnerOption) => (
                      <option key={s.id || s._id} value={s.id || s._id}>
                        {s.name}
                      </option>
                    ))}
              </Select>
              <Input
                label="Date facture"
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                required
              />
              <Input
                label="Montant (MAD)"
                type="number"
                step="0.01"
                placeholder="1000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
              <Input
                label="Date d'échéance"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
              <Textarea
                label="Description"
                placeholder="Description de la facture..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="success" loading={createInvoice.isPending}>
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
