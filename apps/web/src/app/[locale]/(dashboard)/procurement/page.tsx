'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/error-message';
import {
  useCreatePurchaseOrder,
  useDeleteSupplierContract,
  useFarms,
  useProducts,
  usePurchaseOrders,
  usePurchaseOrderReceivingSummary,
  useProcurementOverview,
  useReceivePurchaseOrder,
  useSupplierSlaDashboard,
  useSupplierScorecard,
  useSuppliers,
  useSupplierContracts,
  useUpdatePurchaseOrderStatus,
  useUpsertSupplierContract,
} from '@/hooks/use-api';
import {
  ClipboardList,
  Handshake,
  PackageCheck,
  Plus,
  Trash2,
  Truck,
} from 'lucide-react';

type FarmRecord = { id?: string; _id?: string; name?: string };
type SupplierRecord = { id?: string; _id?: string; name?: string };
type ProductRecord = { id?: string; _id?: string; name?: string; currentStock?: number };
type PurchaseOrderRecord = {
  id: string;
  invoiceNumber?: string;
  status?: string;
  date?: string;
  dueDate?: string;
  total?: number;
  supplier?: { name?: string };
};
type ContractRecord = {
  id: string;
  supplierId: string;
  supplierName?: string;
  title: string;
  startDate: string;
  endDate: string;
  status?: string;
  maxAmount?: number;
  slaTargetDays?: number;
  penaltyRatePercent?: number;
  gracePeriodDays?: number;
  paymentTerms?: string;
  notes?: string;
};

type SupplierScoreRecord = {
  supplierId: string;
  supplierName?: string;
  totalPurchaseOrders?: number;
  paidPurchaseOrders?: number;
  openPurchaseOrders?: number;
  overduePurchaseOrders?: number;
  totalAmount?: number;
  openAmount?: number;
  avgPurchaseOrderAmount?: number;
  onTimePaymentRate?: number | null;
  riskScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  lastPurchaseOrderDate?: string | null;
};

type SupplierSlaRecord = {
  supplierId: string;
  supplierName?: string;
  totalPurchaseOrders?: number;
  overduePurchaseOrders?: number;
  breachCount?: number;
  overdueAmount?: number;
  estimatedPenaltyAmount?: number;
  avgOverdueDays?: number;
  slaTargetDays?: number;
  penaltyRatePercent?: number;
  gracePeriodDays?: number;
  contractStatus?: string | null;
  lastDueDate?: string | null;
};

type SupplierSlaDashboard = {
  summary?: {
    totalSuppliers?: number;
    activeContracts?: number;
    totalOverdueAmount?: number;
    estimatedPenaltyExposure?: number;
    suppliersWithBreaches?: number;
    highRiskSuppliers?: number;
  };
  suppliers?: SupplierSlaRecord[];
};

type PoLineInput = {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
};

type ReceiveItemInput = {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  batchNumber: string;
  expiryDate: string;
};

const UNIT_OPTIONS = ['KG', 'TONNE', 'LITRE', 'ML', 'UNITE', 'SAC', 'BIDON', 'CAISSE'];
const STATUS_OPTIONS = ['BROUILLON', 'VALIDEE', 'ENVOYEE', 'PARTIELLEMENT_PAYEE', 'PAYEE'];
const CONTRACT_STATUS_OPTIONS = ['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'TERMINATED'];
const RECEIVE_ALLOWED = ['VALIDEE', 'ENVOYEE', 'PARTIELLEMENT_PAYEE', 'PAYEE'];

const today = () => new Date().toISOString().slice(0, 10);
const createLocalId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
const defaultPoLine = (): PoLineInput => ({
  id: createLocalId('po-line'),
  description: '',
  quantity: '1',
  unit: 'UNITE',
  unitPrice: '',
});
const defaultReceiveLine = (): ReceiveItemInput => ({
  id: createLocalId('receive-line'),
  productId: '',
  quantity: '',
  unitPrice: '',
  batchNumber: '',
  expiryDate: '',
});
const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('fr-MA');
};
const formatMad = (value?: number) => `${(value ?? 0).toLocaleString('fr-MA')} MAD`;
const riskMeta = (level?: string) => {
  if (level === 'HIGH') return { label: 'Risque eleve', variant: 'danger' as const };
  if (level === 'MEDIUM') return { label: 'Risque moyen', variant: 'warning' as const };
  return { label: 'Risque faible', variant: 'success' as const };
};
const nextPoStatus = (status?: string) => {
  if (status === 'BROUILLON') return 'VALIDEE';
  if (status === 'VALIDEE') return 'ENVOYEE';
  return null;
};

export default function ProcurementPage() {
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPoId, setSelectedPoId] = useState('');
  const [busyPoId, setBusyPoId] = useState<string | null>(null);
  const [poForm, setPoForm] = useState({
    supplierId: '',
    date: today(),
    dueDate: '',
    notes: '',
  });
  const [poLines, setPoLines] = useState<PoLineInput[]>([defaultPoLine()]);
  const [receiveForm, setReceiveForm] = useState({
    reference: '',
    reason: '',
  });
  const [receiveItems, setReceiveItems] = useState<ReceiveItemInput[]>([
    defaultReceiveLine(),
  ]);
  const [contractForm, setContractForm] = useState({
    id: '',
    supplierId: '',
    title: '',
    startDate: today(),
    endDate: '',
    status: 'ACTIVE',
    maxAmount: '',
    slaTargetDays: '7',
    penaltyRatePercent: '1.5',
    gracePeriodDays: '0',
    paymentTerms: '',
    notes: '',
  });

  const { data: farms } = useFarms();
  const farmRows = useMemo(() => (Array.isArray(farms) ? (farms as FarmRecord[]) : []), [farms]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setActiveFarmId(localStorage.getItem('fla7a_farm'));
  }, []);

  useEffect(() => {
    if (activeFarmId || farmRows.length === 0) return;
    const first = farmRows[0]?.id || farmRows[0]?._id;
    if (!first) return;
    setActiveFarmId(first);
    if (typeof window !== 'undefined') localStorage.setItem('fla7a_farm', first);
  }, [activeFarmId, farmRows]);

  const { data: overview, isLoading: isOverviewLoading } = useProcurementOverview(
    activeFarmId || undefined,
  );
  const { data: suppliers } = useSuppliers(activeFarmId || undefined);
  const { data: products } = useProducts(activeFarmId || undefined);
  const { data: purchaseOrders, isLoading: isPoLoading } = usePurchaseOrders(
    activeFarmId || undefined,
    statusFilter || undefined,
  );
  const { data: receivingSummary } = usePurchaseOrderReceivingSummary(
    selectedPoId || undefined,
  );
  const { data: supplierScorecard, isLoading: isSupplierScoreLoading } = useSupplierScorecard(
    activeFarmId || undefined,
  );
  const { data: supplierSlaDashboard, isLoading: isSupplierSlaLoading } =
    useSupplierSlaDashboard(activeFarmId || undefined);
  const { data: contracts, isLoading: isContractsLoading } = useSupplierContracts(
    activeFarmId || undefined,
  );

  const createPurchaseOrder = useCreatePurchaseOrder();
  const updatePurchaseOrderStatus = useUpdatePurchaseOrderStatus();
  const receivePurchaseOrder = useReceivePurchaseOrder();
  const upsertSupplierContract = useUpsertSupplierContract();
  const deleteSupplierContract = useDeleteSupplierContract();

  const supplierRows = useMemo(
    () => (Array.isArray(suppliers) ? (suppliers as SupplierRecord[]) : []),
    [suppliers],
  );
  const productRows = useMemo(
    () => (Array.isArray(products) ? (products as ProductRecord[]) : []),
    [products],
  );
  const poRows = useMemo(
    () => (Array.isArray(purchaseOrders) ? (purchaseOrders as PurchaseOrderRecord[]) : []),
    [purchaseOrders],
  );
  const contractRows = useMemo(
    () => (Array.isArray(contracts) ? (contracts as ContractRecord[]) : []),
    [contracts],
  );
  const supplierScoreRows = useMemo(
    () =>
      Array.isArray(supplierScorecard)
        ? (supplierScorecard as SupplierScoreRecord[])
        : [],
    [supplierScorecard],
  );
  const slaPayload = useMemo(
    () => ((supplierSlaDashboard || {}) as SupplierSlaDashboard),
    [supplierSlaDashboard],
  );
  const supplierSlaRows = useMemo(
    () =>
      Array.isArray(slaPayload.suppliers)
        ? (slaPayload.suppliers as SupplierSlaRecord[])
        : [],
    [slaPayload],
  );
  const receivingSummaryPayload = useMemo(
    () =>
      (receivingSummary as
        | {
            totalReceivedQty?: number;
            totalReceivedValue?: number;
            lines?: Array<{
              productId?: string;
              productName?: string;
              quantity?: number;
              unit?: string;
              value?: number;
            }>;
          }
        | null) || null,
    [receivingSummary],
  );
  const receiveQueue = useMemo(
    () => poRows.filter((po) => RECEIVE_ALLOWED.includes(po.status || '')),
    [poRows],
  );

  useEffect(() => {
    if (!selectedPoId) return;
    const stillExists = receiveQueue.some((po) => po.id === selectedPoId);
    if (!stillExists) setSelectedPoId('');
  }, [receiveQueue, selectedPoId]);

  const kpis = (overview as { kpis?: Record<string, number> } | null)?.kpis || {};

  const handleFarmChange = (farmId: string) => {
    const next = farmId || null;
    setActiveFarmId(next);
    if (typeof window !== 'undefined') {
      if (next) localStorage.setItem('fla7a_farm', next);
      else localStorage.removeItem('fla7a_farm');
    }
  };

  const handleCreatePo = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeFarmId) {
      alert('Selectionnez une ferme active.');
      return;
    }
    if (!poForm.supplierId || !poForm.dueDate) {
      alert('Remplissez les champs obligatoires du PO.');
      return;
    }
    const lines = [];
    for (const line of poLines) {
      const quantity = Number(line.quantity);
      const unitPrice = Number(line.unitPrice);
      if (!line.description.trim()) {
        alert('Chaque ligne PO doit contenir une description.');
        return;
      }
      if (
        Number.isNaN(quantity) ||
        quantity <= 0 ||
        Number.isNaN(unitPrice) ||
        unitPrice < 0
      ) {
        alert('Quantite/prix invalides.');
        return;
      }
      lines.push({
        description: line.description.trim(),
        quantity,
        unit: line.unit,
        unitPrice,
      });
    }
    try {
      await createPurchaseOrder.mutateAsync({
        farmId: activeFarmId,
        supplierId: poForm.supplierId,
        date: poForm.date,
        dueDate: poForm.dueDate,
        notes: poForm.notes || undefined,
        lines,
      });
      setPoForm({
        supplierId: '',
        date: today(),
        dueDate: '',
        notes: '',
      });
      setPoLines([defaultPoLine()]);
      alert('PO cree.');
    } catch (error: unknown) {
      alert(`Erreur creation PO: ${getErrorMessage(error)}`);
    }
  };

  const handlePoStatusAction = async (po: PurchaseOrderRecord) => {
    const status = nextPoStatus(po.status);
    if (!status) return;
    const reason = window.prompt(
      status === 'VALIDEE'
        ? 'Motif de validation (optionnel)'
        : 'Motif d envoi (optionnel)',
      '',
    );
    setBusyPoId(po.id);
    try {
      await updatePurchaseOrderStatus.mutateAsync({
        id: po.id,
        status,
        reason: reason || undefined,
      });
    } catch (error: unknown) {
      alert(`Erreur statut PO: ${getErrorMessage(error)}`);
    } finally {
      setBusyPoId(null);
    }
  };

  const handleReceive = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPoId) {
      alert('Selectionnez PO.');
      return;
    }
    const items = [];
    for (const item of receiveItems) {
      const quantity = Number(item.quantity);
      const unitPrice = item.unitPrice ? Number(item.unitPrice) : undefined;
      if (!item.productId) {
        alert('Chaque ligne de reception doit contenir un produit.');
        return;
      }
      if (Number.isNaN(quantity) || quantity <= 0) {
        alert('Quantite invalide.');
        return;
      }
      if (unitPrice !== undefined && (Number.isNaN(unitPrice) || unitPrice < 0)) {
        alert('Prix unitaire invalide.');
        return;
      }
      items.push({
        productId: item.productId,
        quantity,
        unitPrice,
        batchNumber: item.batchNumber || undefined,
        expiryDate: item.expiryDate || undefined,
      });
    }
    try {
      await receivePurchaseOrder.mutateAsync({
        id: selectedPoId,
        data: {
          reference: receiveForm.reference || undefined,
          reason: receiveForm.reason || undefined,
          items,
        },
      });
      setReceiveForm({
        reference: '',
        reason: '',
      });
      setReceiveItems([defaultReceiveLine()]);
      alert('Reception enregistree.');
    } catch (error: unknown) {
      alert(`Erreur reception: ${getErrorMessage(error)}`);
    }
  };

  const handleSaveContract = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeFarmId || !contractForm.supplierId || !contractForm.title.trim()) {
      alert('Remplissez les champs obligatoires du contrat.');
      return;
    }
    const maxAmount = contractForm.maxAmount ? Number(contractForm.maxAmount) : undefined;
    const slaTargetDays = contractForm.slaTargetDays
      ? Number(contractForm.slaTargetDays)
      : undefined;
    const penaltyRatePercent = contractForm.penaltyRatePercent
      ? Number(contractForm.penaltyRatePercent)
      : undefined;
    const gracePeriodDays = contractForm.gracePeriodDays
      ? Number(contractForm.gracePeriodDays)
      : undefined;
    try {
      await upsertSupplierContract.mutateAsync({
        id: contractForm.id || undefined,
        farmId: activeFarmId,
        supplierId: contractForm.supplierId,
        title: contractForm.title.trim(),
        startDate: contractForm.startDate,
        endDate: contractForm.endDate,
        status: contractForm.status,
        maxAmount,
        slaTargetDays,
        penaltyRatePercent,
        gracePeriodDays,
        paymentTerms: contractForm.paymentTerms || undefined,
        notes: contractForm.notes || undefined,
      });
      setContractForm({
        id: '',
        supplierId: '',
        title: '',
        startDate: today(),
        endDate: '',
        status: 'ACTIVE',
        maxAmount: '',
        slaTargetDays: '7',
        penaltyRatePercent: '1.5',
        gracePeriodDays: '0',
        paymentTerms: '',
        notes: '',
      });
      alert('Contrat enregistre.');
    } catch (error: unknown) {
      alert(`Erreur contrat: ${getErrorMessage(error)}`);
    }
  };

  const handleEditContract = (contract: ContractRecord) => {
    setContractForm({
      id: contract.id,
      supplierId: contract.supplierId,
      title: contract.title || '',
      startDate: contract.startDate ? contract.startDate.slice(0, 10) : '',
      endDate: contract.endDate ? contract.endDate.slice(0, 10) : '',
      status: contract.status || 'ACTIVE',
      maxAmount: typeof contract.maxAmount === 'number' ? String(contract.maxAmount) : '',
      slaTargetDays:
        typeof contract.slaTargetDays === 'number'
          ? String(contract.slaTargetDays)
          : '7',
      penaltyRatePercent:
        typeof contract.penaltyRatePercent === 'number'
          ? String(contract.penaltyRatePercent)
          : '1.5',
      gracePeriodDays:
        typeof contract.gracePeriodDays === 'number'
          ? String(contract.gracePeriodDays)
          : '0',
      paymentTerms: contract.paymentTerms || '',
      notes: contract.notes || '',
    });
  };

  const handleDeleteContract = async (id: string) => {
    if (!window.confirm('Supprimer ce contrat ?')) return;
    try {
      await deleteSupplierContract.mutateAsync(id);
    } catch (error: unknown) {
      alert(`Erreur suppression: ${getErrorMessage(error)}`);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-background to-harvest-50/70 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="info" dot>
              Procurement
            </Badge>
            <h1 className="mt-3 text-2xl font-bold">Achats et reception</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Module PO + reception stock + contrats fournisseurs.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <Select
              label="Ferme active"
              value={activeFarmId || ''}
              onChange={(event) => handleFarmChange(event.target.value)}
            >
              {!farmRows.length && <option value="">Aucune ferme</option>}
              {farmRows.map((farm) => {
                const farmId = farm.id || farm._id || '';
                return (
                  <option key={farmId} value={farmId}>
                    {farm.name || 'Ferme'}
                  </option>
                );
              })}
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card hover={false}>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Pending approvals</p>
            {isOverviewLoading ? <Skeleton className="mt-2 h-8 w-20" /> : <p className="mt-1 text-2xl font-semibold">{kpis.pendingApprovals || 0}</p>}
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Receiving queue</p>
            {isOverviewLoading ? <Skeleton className="mt-2 h-8 w-20" /> : <p className="mt-1 text-2xl font-semibold">{kpis.receivingQueue || 0}</p>}
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Open amount</p>
            {isOverviewLoading ? <Skeleton className="mt-2 h-8 w-28" /> : <p className="mt-1 text-2xl font-semibold">{formatMad(kpis.openAmount || 0)}</p>}
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Active contracts</p>
            {isOverviewLoading ? <Skeleton className="mt-2 h-8 w-20" /> : <p className="mt-1 text-2xl font-semibold">{kpis.activeContracts || 0}</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card hover={false}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Creer PO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleCreatePo}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Select
                  label="Fournisseur"
                  value={poForm.supplierId}
                  onChange={(event) => setPoForm((prev) => ({ ...prev, supplierId: event.target.value }))}
                  required
                >
                  <option value="">Selectionner</option>
                  {supplierRows.map((supplier) => {
                    const supplierId = supplier.id || supplier._id || '';
                    return (
                      <option key={supplierId} value={supplierId}>
                        {supplier.name || 'Fournisseur'}
                      </option>
                    );
                  })}
                </Select>
                <Input
                  label="Date emission"
                  type="date"
                  value={poForm.date}
                  onChange={(event) => setPoForm((prev) => ({ ...prev, date: event.target.value }))}
                  required
                />
                <Input
                  label="Date echeance"
                  type="date"
                  value={poForm.dueDate}
                  onChange={(event) => setPoForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-3 rounded-xl border bg-secondary/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Lignes PO</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => setPoLines((prev) => [...prev, defaultPoLine()])}
                  >
                    Ajouter ligne
                  </Button>
                </div>
                {poLines.map((line, index) => (
                  <div key={line.id} className="rounded-lg border bg-card p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Ligne {index + 1}</p>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() =>
                          setPoLines((prev) =>
                            prev.length === 1
                              ? prev
                              : prev.filter((item) => item.id !== line.id),
                          )
                        }
                        disabled={poLines.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Input
                        label="Description"
                        value={line.description}
                        onChange={(event) =>
                          setPoLines((prev) =>
                            prev.map((item) =>
                              item.id === line.id
                                ? { ...item, description: event.target.value }
                                : item,
                            ),
                          )
                        }
                        containerClassName="lg:col-span-2"
                        required
                      />
                      <Input
                        label="Quantite"
                        type="number"
                        min={0.01}
                        step="0.01"
                        value={line.quantity}
                        onChange={(event) =>
                          setPoLines((prev) =>
                            prev.map((item) =>
                              item.id === line.id
                                ? { ...item, quantity: event.target.value }
                                : item,
                            ),
                          )
                        }
                        required
                      />
                      <Select
                        label="Unite"
                        value={line.unit}
                        onChange={(event) =>
                          setPoLines((prev) =>
                            prev.map((item) =>
                              item.id === line.id
                                ? { ...item, unit: event.target.value }
                                : item,
                            ),
                          )
                        }
                      >
                        {UNIT_OPTIONS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </Select>
                      <Input
                        label="Prix unitaire"
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(event) =>
                          setPoLines((prev) =>
                            prev.map((item) =>
                              item.id === line.id
                                ? { ...item, unitPrice: event.target.value }
                                : item,
                            ),
                          )
                        }
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Textarea
                label="Notes"
                value={poForm.notes}
                onChange={(event) => setPoForm((prev) => ({ ...prev, notes: event.target.value }))}
                className="min-h-[80px]"
              />
              <Button type="submit" variant="success" loading={createPurchaseOrder.isPending}>
                Creer bon de commande
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              Reception stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleReceive}>
              <Select
                label="PO"
                value={selectedPoId}
                onChange={(event) => setSelectedPoId(event.target.value)}
                required
              >
                <option value="">Selectionner PO</option>
                {receiveQueue.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.invoiceNumber || po.id} - {po.supplier?.name || 'Fournisseur'}
                  </option>
                ))}
              </Select>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Reference"
                  value={receiveForm.reference}
                  onChange={(event) =>
                    setReceiveForm((prev) => ({ ...prev, reference: event.target.value }))
                  }
                />
                <Input
                  label="Motif"
                  value={receiveForm.reason}
                  onChange={(event) =>
                    setReceiveForm((prev) => ({ ...prev, reason: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-3 rounded-xl border bg-secondary/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Lignes reception</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => setReceiveItems((prev) => [...prev, defaultReceiveLine()])}
                  >
                    Ajouter ligne
                  </Button>
                </div>
                {receiveItems.map((item, index) => (
                  <div key={item.id} className="rounded-lg border bg-card p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Reception {index + 1}</p>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() =>
                          setReceiveItems((prev) =>
                            prev.length === 1
                              ? prev
                              : prev.filter((line) => line.id !== item.id),
                          )
                        }
                        disabled={receiveItems.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Select
                        label="Produit"
                        value={item.productId}
                        onChange={(event) =>
                          setReceiveItems((prev) =>
                            prev.map((line) =>
                              line.id === item.id
                                ? { ...line, productId: event.target.value }
                                : line,
                            ),
                          )
                        }
                        required
                      >
                        <option value="">Selectionner produit</option>
                        {productRows.map((product) => {
                          const productId = product.id || product._id || '';
                          return (
                            <option key={productId} value={productId}>
                              {product.name || 'Produit'} - stock {product.currentStock || 0}
                            </option>
                          );
                        })}
                      </Select>
                      <Input
                        label="Quantite"
                        type="number"
                        min={0.01}
                        step="0.01"
                        value={item.quantity}
                        onChange={(event) =>
                          setReceiveItems((prev) =>
                            prev.map((line) =>
                              line.id === item.id
                                ? { ...line, quantity: event.target.value }
                                : line,
                            ),
                          )
                        }
                        required
                      />
                      <Input
                        label="Prix unitaire"
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(event) =>
                          setReceiveItems((prev) =>
                            prev.map((line) =>
                              line.id === item.id
                                ? { ...line, unitPrice: event.target.value }
                                : line,
                            ),
                          )
                        }
                      />
                      <Input
                        label="Lot"
                        value={item.batchNumber}
                        onChange={(event) =>
                          setReceiveItems((prev) =>
                            prev.map((line) =>
                              line.id === item.id
                                ? { ...line, batchNumber: event.target.value }
                                : line,
                            ),
                          )
                        }
                      />
                      <Input
                        label="Expiration"
                        type="date"
                        value={item.expiryDate}
                        onChange={(event) =>
                          setReceiveItems((prev) =>
                            prev.map((line) =>
                              line.id === item.id
                                ? { ...line, expiryDate: event.target.value }
                                : line,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              {selectedPoId && receivingSummaryPayload && (
                <div className="rounded-xl border bg-secondary/10 p-3">
                  <p className="text-sm font-medium">Historique reception partielle</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <p>Quantite cumulee: {Number(receivingSummaryPayload.totalReceivedQty || 0).toFixed(2)}</p>
                    <p>Valeur cumulee: {formatMad(receivingSummaryPayload.totalReceivedValue)}</p>
                  </div>
                  {Array.isArray(receivingSummaryPayload.lines) &&
                    receivingSummaryPayload.lines.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {receivingSummaryPayload.lines.slice(0, 5).map((line) => (
                          <div
                            key={`${line.productId}-${line.productName}`}
                            className="flex items-center justify-between text-xs text-muted-foreground"
                          >
                            <span>{line.productName || line.productId}</span>
                            <span>
                              {Number(line.quantity || 0).toFixed(2)} {line.unit || ''} |{' '}
                              {formatMad(line.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}
              <Button type="submit" variant="success" loading={receivePurchaseOrder.isPending} leftIcon={<PackageCheck className="h-4 w-4" />}>
                Valider reception
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card hover={false}>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Workflow PO
            </CardTitle>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="max-w-xs">
              <option value="">Tous statuts</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isPoLoading ? (
            <Skeleton className="h-48" />
          ) : poRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun PO.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/30">
                    <th className="p-3 text-start font-medium text-muted-foreground">PO</th>
                    <th className="p-3 text-start font-medium text-muted-foreground">Fournisseur</th>
                    <th className="p-3 text-start font-medium text-muted-foreground">Date</th>
                    <th className="p-3 text-start font-medium text-muted-foreground">Echeance</th>
                    <th className="p-3 text-start font-medium text-muted-foreground">Montant</th>
                    <th className="p-3 text-start font-medium text-muted-foreground">Statut</th>
                    <th className="p-3 text-start font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {poRows.map((po) => {
                    const next = nextPoStatus(po.status);
                    return (
                      <tr key={po.id} className="border-b">
                        <td className="p-3 font-medium">{po.invoiceNumber || po.id}</td>
                        <td className="p-3">{po.supplier?.name || '-'}</td>
                        <td className="p-3 text-muted-foreground">{formatDate(po.date)}</td>
                        <td className="p-3 text-muted-foreground">{formatDate(po.dueDate)}</td>
                        <td className="p-3 font-semibold">{formatMad(po.total)}</td>
                        <td className="p-3">
                          <Badge variant={po.status === 'PAYEE' ? 'success' : 'secondary'}>
                            {po.status || '-'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            {next && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePoStatusAction(po)}
                                loading={busyPoId === po.id && updatePurchaseOrderStatus.isPending}
                              >
                                {next === 'VALIDEE' ? 'Valider' : 'Envoyer'}
                              </Button>
                            )}
                            {RECEIVE_ALLOWED.includes(po.status || '') && (
                              <Button size="sm" variant="secondary" onClick={() => setSelectedPoId(po.id)}>
                                Recevoir
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card hover={false}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="h-4 w-4 text-primary" />
            Scorecard fournisseurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isSupplierScoreLoading ? (
            <Skeleton className="h-44" />
          ) : supplierScoreRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun score fournisseur disponible pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {supplierScoreRows.slice(0, 8).map((supplier) => {
                const risk = riskMeta(supplier.riskLevel);
                return (
                  <div
                    key={supplier.supplierId}
                    className="rounded-xl border bg-secondary/15 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          {supplier.supplierName || supplier.supplierId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Dernier PO: {formatDate(supplier.lastPurchaseOrderDate || undefined)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={risk.variant}>{risk.label}</Badge>
                        <Badge variant="outline">
                          Score {Number(supplier.riskScore || 0).toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-4">
                      <p>PO: {supplier.totalPurchaseOrders || 0}</p>
                      <p>Overdue: {supplier.overduePurchaseOrders || 0}</p>
                      <p>Ouvert: {formatMad(supplier.openAmount)}</p>
                      <p>
                        On-time: {supplier.onTimePaymentRate === null || supplier.onTimePaymentRate === undefined
                          ? 'N/A'
                          : `${Number(supplier.onTimePaymentRate).toFixed(1)}%`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card hover={false}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="h-4 w-4 text-primary" />
            SLA & penalites fournisseurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isSupplierSlaLoading ? (
            <Skeleton className="h-44" />
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                <div className="rounded-lg border bg-secondary/20 p-2">
                  <p className="text-muted-foreground">Overdue total</p>
                  <p className="font-semibold">
                    {formatMad(slaPayload.summary?.totalOverdueAmount)}
                  </p>
                </div>
                <div className="rounded-lg border bg-secondary/20 p-2">
                  <p className="text-muted-foreground">Exposure penalites</p>
                  <p className="font-semibold">
                    {formatMad(slaPayload.summary?.estimatedPenaltyExposure)}
                  </p>
                </div>
                <div className="rounded-lg border bg-secondary/20 p-2">
                  <p className="text-muted-foreground">Suppliers en breach</p>
                  <p className="font-semibold">
                    {slaPayload.summary?.suppliersWithBreaches || 0}
                  </p>
                </div>
              </div>
              {supplierSlaRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun signal SLA pour le moment.
                </p>
              ) : (
                <div className="space-y-2">
                  {supplierSlaRows.slice(0, 8).map((supplier) => (
                    <div
                      key={supplier.supplierId}
                      className="rounded-lg border bg-secondary/15 p-3"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium">
                          {supplier.supplierName || supplier.supplierId}
                        </p>
                        <Badge
                          variant={
                            (supplier.breachCount || 0) > 0 ? 'danger' : 'success'
                          }
                        >
                          Breaches: {supplier.breachCount || 0}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                        <p>Overdue: {supplier.overduePurchaseOrders || 0}</p>
                        <p>Overdue MAD: {formatMad(supplier.overdueAmount)}</p>
                        <p>Penalty MAD: {formatMad(supplier.estimatedPenaltyAmount)}</p>
                        <p>SLA target: {supplier.slaTargetDays || 7}j</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card hover={false}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-4 w-4 text-primary" />
              Contrat fournisseur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSaveContract}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Select
                  label="Fournisseur"
                  value={contractForm.supplierId}
                  onChange={(event) => setContractForm((prev) => ({ ...prev, supplierId: event.target.value }))}
                  required
                >
                  <option value="">Selectionner</option>
                  {supplierRows.map((supplier) => {
                    const supplierId = supplier.id || supplier._id || '';
                    return (
                      <option key={supplierId} value={supplierId}>
                        {supplier.name || 'Fournisseur'}
                      </option>
                    );
                  })}
                </Select>
                <Input
                  label="Titre"
                  value={contractForm.title}
                  onChange={(event) => setContractForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
                <Input
                  label="Debut"
                  type="date"
                  value={contractForm.startDate}
                  onChange={(event) => setContractForm((prev) => ({ ...prev, startDate: event.target.value }))}
                  required
                />
                <Input
                  label="Fin"
                  type="date"
                  value={contractForm.endDate}
                  onChange={(event) => setContractForm((prev) => ({ ...prev, endDate: event.target.value }))}
                  required
                />
                <Input
                  label="Plafond (MAD)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={contractForm.maxAmount}
                  onChange={(event) => setContractForm((prev) => ({ ...prev, maxAmount: event.target.value }))}
                />
                <Input
                  label="SLA cible (jours)"
                  type="number"
                  min={0}
                  step="1"
                  value={contractForm.slaTargetDays}
                  onChange={(event) =>
                    setContractForm((prev) => ({ ...prev, slaTargetDays: event.target.value }))
                  }
                />
                <Input
                  label="Penalite (% / mois)"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={contractForm.penaltyRatePercent}
                  onChange={(event) =>
                    setContractForm((prev) => ({
                      ...prev,
                      penaltyRatePercent: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Grace (jours)"
                  type="number"
                  min={0}
                  step="1"
                  value={contractForm.gracePeriodDays}
                  onChange={(event) =>
                    setContractForm((prev) => ({ ...prev, gracePeriodDays: event.target.value }))
                  }
                />
                <Select
                  label="Statut"
                  value={contractForm.status}
                  onChange={(event) => setContractForm((prev) => ({ ...prev, status: event.target.value }))}
                >
                  {CONTRACT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </div>
              <Input
                label="Conditions paiement"
                value={contractForm.paymentTerms}
                onChange={(event) => setContractForm((prev) => ({ ...prev, paymentTerms: event.target.value }))}
              />
              <Textarea
                label="Notes"
                value={contractForm.notes}
                onChange={(event) => setContractForm((prev) => ({ ...prev, notes: event.target.value }))}
                className="min-h-[80px]"
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="success" loading={upsertSupplierContract.isPending}>
                  {contractForm.id ? 'Mettre a jour' : 'Creer contrat'}
                </Button>
                {contractForm.id && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setContractForm({
                        id: '',
                        supplierId: '',
                        title: '',
                        startDate: today(),
                        endDate: '',
                        status: 'ACTIVE',
                        maxAmount: '',
                        slaTargetDays: '7',
                        penaltyRatePercent: '1.5',
                        gracePeriodDays: '0',
                        paymentTerms: '',
                        notes: '',
                      })
                    }
                  >
                    Nouveau
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-4 w-4 text-primary" />
              Liste contrats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isContractsLoading ? (
              <Skeleton className="h-48" />
            ) : contractRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun contrat fournisseur.</p>
            ) : (
              <div className="space-y-3">
                {contractRows.map((contract) => (
                  <div key={contract.id} className="rounded-xl border bg-secondary/15 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">{contract.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {contract.supplierName || contract.supplierId}
                        </p>
                      </div>
                      <Badge variant={contract.status === 'ACTIVE' ? 'success' : 'secondary'}>
                        {contract.status || '-'}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                      <p>
                        {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                      </p>
                      <p>Plafond: {formatMad(contract.maxAmount)}</p>
                      <p>
                        SLA/Penalite: {contract.slaTargetDays || 7}j /{' '}
                        {Number(contract.penaltyRatePercent || 1.5).toFixed(1)}% (grace{' '}
                        {contract.gracePeriodDays || 0}j)
                      </p>
                      <p className="sm:col-span-2">Paiement: {contract.paymentTerms || '-'}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditContract(contract)}>
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteContract(contract.id)}
                        loading={deleteSupplierContract.isPending}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
