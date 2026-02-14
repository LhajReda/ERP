'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

type MutationPayload = Record<string, unknown>;
type ApiEntity = Record<string, unknown>;
type ApiEntityList = unknown[];
type FarmScopedEntity = { farmId?: string | null };
type BudgetControlPolicy = {
  warningThresholdPercent?: number;
  hardStopThresholdPercent?: number;
  enforceHardStop?: boolean;
};
type FarmBudgetStatus = {
  status?: 'NO_BUDGET' | 'HEALTHY' | 'WARNING' | 'HARD_STOP';
  monthlyBudget?: number;
  spent?: number;
  remaining?: number;
  actualSpent?: number;
  remainingBudget?: number;
  utilizationPercent?: number;
  warningThresholdAmount?: number;
  hardStopThresholdAmount?: number;
  hardStopEnforced?: boolean;
  policy?: {
    warningThresholdPercent?: number;
    hardStopThresholdPercent?: number;
  } & ApiEntity;
} & ApiEntity;
type FarmRecord = {
  id: string;
  _id?: string;
  name?: string;
  totalArea?: number;
  area?: number;
} & ApiEntity;
type DashboardKpisResponse = {
  totalArea?: number;
  activeCycles?: number;
  harvestReady?: number;
  cycleTrend?: number;
  monthlyRevenue?: number;
  periodLabel?: string;
  employees?: number;
  presentEmployees?: number;
  revenueTrend?: number;
  monthlySeries?: ApiEntityList;
  cropSplit?: ApiEntityList;
  recentActivities?: ApiEntityList;
} & ApiEntity;
type EnterprisePortfolioSummary = {
  stockCriticalCount?: number;
  expiringCertifications30d?: number;
  monthlyRevenue?: number;
  monthlyBalance?: number;
  activeCycles?: number;
  harvestReady?: number;
  employees?: number;
  presentEmployees?: number;
} & ApiEntity;
type EnterprisePortfolioResponse = {
  summary?: EnterprisePortfolioSummary;
  topPerformers?: ApiEntityList;
  riskFarms?: ApiEntityList;
} & ApiEntity;
type UnreadCountResponse = {
  count?: number;
  unreadCount?: number;
} & ApiEntity;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// Normalize API payloads:
// - Global interceptor wraps as { success, data, timestamp, path }
// - List endpoints often wrap again as { data: [...], meta: {...} }
const unwrap = <T = ApiEntity>(payload: unknown): T => {
  const base =
    isRecord(payload) && 'data' in payload
      ? (payload as { data?: unknown }).data
      : payload;

  if (Array.isArray(base)) return base as T;
  if (isRecord(base) && Array.isArray(base.data)) return base.data as T;

  return base as T;
};

const filterByFarmId = <T extends FarmScopedEntity>(items: T[], farmId: string): T[] =>
  items.filter((item) => item.farmId === farmId);

// ==================== FARMS ====================
export function useFarms() {
  return useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const response = await api.get('/farms');
      return unwrap<FarmRecord[]>(response.data);
    }
  });
}

export function useFarm(id?: string) {
  return useQuery({
    queryKey: ['farms', id],
    queryFn: async () => {
      const response = await api.get(`/farms/${id}`);
      return unwrap(response.data);
    },
    enabled: !!id
  });
}

export function useCreateFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/farms', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farms'] })
  });
}

export function useUpdateFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MutationPayload }) => {
      const response = await api.patch(`/farms/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['farms'] });
    }
  });
}

export function useDeleteFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/farms/${id}`);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farms'] })
  });
}

// ==================== PARCELS ====================
export function useParcels(farmId?: string) {
  return useQuery({
    queryKey: ['parcels', farmId],
    queryFn: async () => {
      const response = await api.get('/parcels');
      let parcels = unwrap<ApiEntityList>(response.data);
      if (farmId && Array.isArray(parcels)) {
        parcels = filterByFarmId(parcels as FarmScopedEntity[], farmId);
      }
      return parcels;
    },
    enabled: !!farmId
  });
}

export function useParcel(id?: string) {
  return useQuery({
    queryKey: ['parcels', id],
    queryFn: async () => {
      const response = await api.get(`/parcels/${id}`);
      return unwrap(response.data);
    },
    enabled: !!id
  });
}

export function useCreateParcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/parcels', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parcels'] })
  });
}

export function useUpdateParcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MutationPayload }) => {
      const response = await api.patch(`/parcels/${id}`, data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parcels'] })
  });
}

export function useDeleteParcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/parcels/${id}`);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parcels'] })
  });
}

// ==================== CULTURE CYCLES ====================
export function useCultureCycles(farmId?: string) {
  return useQuery({
    queryKey: ['culture-cycles', farmId],
    queryFn: async () => {
      const response = await api.get('/culture-cycles');
      let cycles = unwrap<ApiEntityList>(response.data);
      if (farmId && Array.isArray(cycles)) {
        cycles = filterByFarmId(cycles as FarmScopedEntity[], farmId);
      }
      return cycles;
    }
  });
}

export function useCultureCycle(id?: string) {
  return useQuery({
    queryKey: ['culture-cycles', id],
    queryFn: async () => {
      const response = await api.get(`/culture-cycles/${id}`);
      return unwrap(response.data);
    },
    enabled: !!id
  });
}

export function useCreateCultureCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/culture-cycles', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culture-cycles'] })
  });
}

export function useUpdateCultureCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MutationPayload }) => {
      const response = await api.put(`/culture-cycles/${id}`, data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culture-cycles'] })
  });
}

export function useDeleteCultureCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/culture-cycles/${id}`);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culture-cycles'] })
  });
}

// ==================== FARM ACTIVITIES ====================
export function useFarmActivities(cycleId?: string) {
  return useQuery({
    queryKey: ['farm-activities', cycleId],
    queryFn: async () => {
      const response = await api.get(`/farm-activities/cycle/${cycleId}`);
      return unwrap(response.data);
    },
    enabled: !!cycleId
  });
}

export function useCreateFarmActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/farm-activities', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farm-activities'] })
  });
}

// ==================== HARVESTS ====================
export function useHarvests(cycleId?: string) {
  return useQuery({
    queryKey: ['harvests', cycleId],
    queryFn: async () => {
      const response = await api.get(`/harvests/cycle/${cycleId}`);
      return unwrap(response.data);
    },
    enabled: !!cycleId
  });
}

export function useHarvestStats(farmId?: string) {
  return useQuery({
    queryKey: ['harvest-stats', farmId],
    queryFn: async () => {
      const response = await api.get(`/harvests/stats/${farmId}`);
      return unwrap(response.data);
    },
    enabled: !!farmId
  });
}

export function useCreateHarvest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/harvests', data);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['harvests'] });
      qc.invalidateQueries({ queryKey: ['harvest-stats'] });
    }
  });
}

// ==================== PRODUCTS ====================
export function useProducts(farmId?: string) {
  return useQuery({
    queryKey: ['products', farmId],
    queryFn: async () => {
      const response = await api.get('/products');
      let products = unwrap<ApiEntityList>(response.data);
      if (farmId && Array.isArray(products)) {
        products = filterByFarmId(products as FarmScopedEntity[], farmId);
      }
      return products;
    }
  });
}

export function useProduct(id?: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      return unwrap(response.data);
    },
    enabled: !!id
  });
}

export function useLowStockAlerts(farmId?: string) {
  return useQuery({
    queryKey: ['low-stock-alerts', farmId],
    queryFn: async () => {
      const response = await api.get(`/products/low-stock-alerts/${farmId}`);
      return unwrap<unknown[]>(response.data);
    },
    enabled: !!farmId
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/products', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] })
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MutationPayload }) => {
      const response = await api.put(`/products/${id}`, data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] })
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] })
  });
}

// ==================== STOCK MOVEMENTS ====================
export function useStockMovements(productId?: string) {
  return useQuery({
    queryKey: ['stock-movements', productId],
    queryFn: async () => {
      const response = await api.get(`/stock-movements/product/${productId}`);
      return response.data.data || response.data;
    },
    enabled: !!productId
  });
}

export function useCreateStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/stock-movements', data);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    }
  });
}

// ==================== SUPPLIERS ====================
export function useSuppliers(farmId?: string) {
  return useQuery({
    queryKey: ['suppliers', farmId],
    queryFn: async () => {
      const response = await api.get(`/suppliers/farm/${farmId}`);
      return unwrap<unknown[]>(response.data);
    },
    enabled: !!farmId
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/suppliers', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] })
  });
}

// ==================== INVOICES ====================
export function useInvoices(farmId?: string) {
  return useQuery({
    queryKey: ['invoices', farmId],
    queryFn: async () => {
      const response = await api.get('/invoices');
      let invoices = unwrap<unknown[]>(response.data);
      if (farmId && Array.isArray(invoices)) {
        invoices = filterByFarmId(invoices as FarmScopedEntity[], farmId);
      }
      return invoices;
    }
  });
}

export function useInvoice(id?: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      const response = await api.get(`/invoices/${id}`);
      return unwrap(response.data);
    },
    enabled: !!id
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/invoices', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] })
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: string;
      reason?: string;
    }) => {
      const response = await api.patch(`/invoices/${id}/status`, { status, reason });
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] })
  });
}

export function useAddInvoicePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MutationPayload }) => {
      const response = await api.post(`/invoices/${id}/payments`, data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] })
  });
}

// ==================== PROCUREMENT ====================
export function useProcurementOverview(farmId?: string) {
  return useQuery({
    queryKey: ['procurement-overview', farmId],
    queryFn: async () => {
      const query = farmId ? `?farmId=${farmId}` : '';
      const response = await api.get(`/procurement/overview${query}`);
      return unwrap(response.data);
    },
  });
}

export function usePurchaseOrders(farmId?: string, status?: string) {
  return useQuery({
    queryKey: ['purchase-orders', farmId, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (farmId) params.append('farmId', farmId);
      if (status) params.append('status', status);
      const query = params.toString();
      const response = await api.get(`/procurement/purchase-orders${query ? `?${query}` : ''}`);
      return unwrap(response.data);
    },
  });
}

export function usePurchaseOrder(id?: string) {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      const response = await api.get(`/procurement/purchase-orders/${id}`);
      return unwrap(response.data);
    },
    enabled: !!id,
  });
}

export function usePurchaseOrderReceivingSummary(id?: string) {
  return useQuery({
    queryKey: ['purchase-order-receiving-summary', id],
    queryFn: async () => {
      const response = await api.get(`/procurement/purchase-orders/${id}/receiving-summary`);
      return unwrap(response.data);
    },
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/procurement/purchase-orders', data);
      return unwrap(response.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['procurement-overview'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['supplier-scorecard'] });
      qc.invalidateQueries({ queryKey: ['supplier-sla-dashboard'] });
    },
  });
}

export function useUpdatePurchaseOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: string;
      reason?: string;
    }) => {
      const response = await api.patch(`/procurement/purchase-orders/${id}/status`, {
        status,
        reason,
      });
      return unwrap(response.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['procurement-overview'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useSupplierSlaDashboard(farmId?: string) {
  return useQuery({
    queryKey: ['supplier-sla-dashboard', farmId],
    queryFn: async () => {
      const query = farmId ? `?farmId=${farmId}` : '';
      const response = await api.get(`/procurement/sla-dashboard${query}`);
      return unwrap(response.data);
    },
  });
}

export function useReceivePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        reference?: string;
        reason?: string;
        items: Array<{
          productId: string;
          quantity: number;
          unitPrice?: number;
          batchNumber?: string;
          expiryDate?: string;
        }>;
      };
    }) => {
      const response = await api.post(`/procurement/purchase-orders/${id}/receive`, data);
      return unwrap(response.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['purchase-order-receiving-summary'] });
      qc.invalidateQueries({ queryKey: ['procurement-overview'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['low-stock-alerts'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      qc.invalidateQueries({ queryKey: ['supplier-scorecard'] });
      qc.invalidateQueries({ queryKey: ['supplier-sla-dashboard'] });
    },
  });
}

export function useSupplierContracts(farmId?: string) {
  return useQuery({
    queryKey: ['supplier-contracts', farmId],
    queryFn: async () => {
      const query = farmId ? `?farmId=${farmId}` : '';
      const response = await api.get(`/procurement/contracts${query}`);
      return unwrap(response.data);
    },
  });
}

export function useSupplierScorecard(farmId?: string) {
  return useQuery({
    queryKey: ['supplier-scorecard', farmId],
    queryFn: async () => {
      const query = farmId ? `?farmId=${farmId}` : '';
      const response = await api.get(`/procurement/supplier-scorecard${query}`);
      return unwrap(response.data);
    },
  });
}

export function useUpsertSupplierContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.put('/procurement/contracts', data);
      return unwrap(response.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier-contracts'] });
      qc.invalidateQueries({ queryKey: ['procurement-overview'] });
      qc.invalidateQueries({ queryKey: ['supplier-sla-dashboard'] });
      qc.invalidateQueries({ queryKey: ['supplier-scorecard'] });
    },
  });
}

export function useDeleteSupplierContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/procurement/contracts/${id}`);
      return unwrap(response.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier-contracts'] });
      qc.invalidateQueries({ queryKey: ['procurement-overview'] });
      qc.invalidateQueries({ queryKey: ['supplier-sla-dashboard'] });
      qc.invalidateQueries({ queryKey: ['supplier-scorecard'] });
    },
  });
}

// ==================== TRANSACTIONS ====================
export function useTransactions(accountId?: string) {
  return useQuery({
    queryKey: ['transactions', accountId],
    queryFn: async () => {
      const response = await api.get(`/transactions/account/${accountId}`);
      return unwrap(response.data);
    },
    enabled: !!accountId
  });
}

export function useMonthlySummary(farmId?: string) {
  return useQuery({
    queryKey: ['monthly-summary', farmId],
    queryFn: async () => {
      const response = await api.get(`/transactions/monthly-summary/${farmId}`);
      return unwrap(response.data);
    },
    enabled: !!farmId
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/transactions', data);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['monthly-summary'] });
    }
  });
}

export function useBudgetControlPolicy() {
  return useQuery({
    queryKey: ['budget-control-policy'],
    queryFn: async () => {
      const response = await api.get('/transactions/budget-policy/current');
      return unwrap<BudgetControlPolicy>(response.data);
    },
  });
}

export function useUpdateBudgetControlPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      warningThresholdPercent?: number;
      hardStopThresholdPercent?: number;
      enforceHardStop?: boolean;
    }) => {
      const response = await api.put('/transactions/budget-policy/current', data);
      return unwrap(response.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget-control-policy'] }),
  });
}

export function useFarmBudgetStatus(farmId?: string, year?: number, month?: number) {
  return useQuery({
    queryKey: ['farm-budget-status', farmId, year, month],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.append('year', String(year));
      if (month) params.append('month', String(month));
      const query = params.toString();
      const response = await api.get(
        `/transactions/budget/${farmId}${query ? `?${query}` : ''}`,
      );
      return unwrap<FarmBudgetStatus>(response.data);
    },
    enabled: !!farmId,
  });
}

export function useUpsertFarmBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      farmId: string;
      year: number;
      month: number;
      amount: number;
    }) => {
      const { farmId, ...payload } = data;
      const response = await api.put(`/transactions/budget/${farmId}`, payload);
      return unwrap(response.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['farm-budget-status'] });
      qc.invalidateQueries({ queryKey: ['monthly-summary'] });
    },
  });
}

// ==================== REPORTS ====================
export function useMonthlyPnL(farmId?: string, year?: number, month?: number) {
  return useQuery({
    queryKey: ['monthly-pnl', farmId, year, month],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (month) params.append('month', month.toString());
      const response = await api.get(`/reports/monthly-pnl/${farmId}?${params}`);
      return unwrap(response.data);
    },
    enabled: !!farmId
  });
}

export function useAnnualSummary(farmId?: string, year?: number) {
  return useQuery({
    queryKey: ['annual-summary', farmId, year],
    queryFn: async () => {
      const params = year ? `?year=${year}` : '';
      const response = await api.get(`/reports/annual-summary/${farmId}${params}`);
      return unwrap(response.data);
    },
    enabled: !!farmId
  });
}

export function useDownloadEnterpriseCfoExport() {
  return useMutation({
    mutationFn: async (params?: {
      format?: 'excel' | 'pdf';
      year?: number;
      month?: number;
    }) => {
      const search = new URLSearchParams();
      if (params?.format) search.append('format', params.format);
      if (params?.year) search.append('year', String(params.year));
      if (params?.month) search.append('month', String(params.month));
      const query = search.toString();
      const response = await api.get(
        `/reports/enterprise-export${query ? `?${query}` : ''}`,
        { responseType: 'blob' },
      );

      const contentDisposition = response.headers?.['content-disposition'] as
        | string
        | undefined;
      const filenameMatch = contentDisposition?.match(
        /filename=\"?([^\";]+)\"?/i,
      );
      const fallbackName =
        params?.format === 'pdf'
          ? 'cfo-export.pdf'
          : 'cfo-export.xlsx';
      const fileName = filenameMatch?.[1] || fallbackName;

      return {
        blob: response.data as Blob,
        fileName,
      };
    },
  });
}

// ==================== EMPLOYEES ====================
export function useEmployees(farmId?: string) {
  return useQuery({
    queryKey: ['employees', farmId],
    queryFn: async () => {
      const response = await api.get(`/employees/farm/${farmId}`);
      return unwrap<unknown[]>(response.data);
    },
    enabled: !!farmId
  });
}

export function useEmployee(id?: string) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: async () => {
      const response = await api.get(`/employees/${id}`);
      return unwrap(response.data);
    },
    enabled: !!id
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/employees', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] })
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MutationPayload }) => {
      const response = await api.put(`/employees/${id}`, data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] })
  });
}

export function useDeactivateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/employees/${id}/deactivate`);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] })
  });
}

// ==================== ATTENDANCE ====================
export function useAttendanceToday(farmId?: string) {
  return useQuery({
    queryKey: ['attendance-today', farmId],
    queryFn: async () => {
      const response = await api.get(`/attendance/today/${farmId}`);
      return response.data.data || response.data;
    },
    enabled: !!farmId
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/attendance', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance-today'] })
  });
}

// ==================== PAYROLL ====================
export function usePayslips(farmId?: string) {
  return useQuery({
    queryKey: ['payslips', farmId],
    queryFn: async () => {
      const response = await api.get('/payroll/payslips');
      let payslips = response.data.data || response.data;
      if (farmId && Array.isArray(payslips)) {
        payslips = filterByFarmId(payslips as FarmScopedEntity[], farmId);
      }
      return payslips;
    }
  });
}

export function useCalculatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (employeeId: string) => {
      const response = await api.post(`/payroll/calculate/${employeeId}`);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payslips'] })
  });
}

export function useGenerateMonthlyPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/payroll/generate-monthly', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payslips'] })
  });
}

// ==================== CLIENTS ====================
export function useClients(farmId?: string) {
  return useQuery({
    queryKey: ['clients', farmId],
    queryFn: async () => {
      const response = await api.get(`/clients/farm/${farmId}`);
      return unwrap<unknown[]>(response.data);
    },
    enabled: !!farmId
  });
}

export function useClient(id?: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const response = await api.get(`/clients/${id}`);
      return unwrap(response.data);
    },
    enabled: !!id
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/clients', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] })
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MutationPayload }) => {
      const response = await api.put(`/clients/${id}`, data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] })
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/clients/${id}`);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] })
  });
}

// ==================== COMPLIANCE ====================
export function useCertifications(farmId?: string) {
  return useQuery({
    queryKey: ['certifications', farmId],
    queryFn: async () => {
      const response = await api.get(`/compliance/certifications/${farmId}`);
      return unwrap<ApiEntityList>(response.data);
    },
    enabled: !!farmId
  });
}

export function useComplianceStatus(farmId?: string) {
  return useQuery({
    queryKey: ['compliance-status', farmId],
    queryFn: async () => {
      const response = await api.get(`/compliance/status/${farmId}`);
      return unwrap(response.data);
    },
    enabled: !!farmId
  });
}

export function useOnssaCheck(farmId?: string) {
  return useQuery({
    queryKey: ['onssa-check', farmId],
    queryFn: async () => {
      const response = await api.get(`/compliance/onssa-check/${farmId}`);
      return unwrap(response.data);
    },
    enabled: !!farmId
  });
}

export function useExpiringCertifications(farmId?: string) {
  return useQuery({
    queryKey: ['expiring-certifications', farmId],
    queryFn: async () => {
      const response = await api.get(`/compliance/expiring/${farmId}`);
      return unwrap(response.data);
    },
    enabled: !!farmId
  });
}

export function useCreateCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/compliance/certifications', data);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certifications'] });
      qc.invalidateQueries({ queryKey: ['compliance-status'] });
    }
  });
}

// ==================== DASHBOARD ====================
export function useDashboardKPIs(farmId?: string) {
  return useQuery({
    queryKey: ['dashboard-kpis', farmId],
    queryFn: async () => {
      const params = farmId ? `?farmId=${farmId}` : '';
      const response = await api.get(`/dashboard/kpis${params}`);
      return unwrap<DashboardKpisResponse>(response.data);
    }
  });
}

export function useEnterprisePortfolio(months = 6) {
  return useQuery({
    queryKey: ['enterprise-portfolio', months],
    queryFn: async () => {
      const response = await api.get(`/dashboard/portfolio?months=${months}`);
      return unwrap<EnterprisePortfolioResponse>(response.data);
    },
  });
}

// ==================== NOTIFICATIONS ====================
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return unwrap<unknown[]>(response.data);
    }
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await api.get('/notifications/unread-count');
      return unwrap<UnreadCountResponse>(response.data);
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    }
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await api.patch('/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    }
  });
}

// ==================== CHAT ====================
export function useSendChat() {
  return useMutation({
    mutationFn: async (data: { message: string; conversationId?: string }) => {
      const response = await api.post('/chat', data);
      return response.data;
    }
  });
}

export function useChatAgents() {
  return useQuery({
    queryKey: ['chat-agents'],
    queryFn: async () => {
      const response = await api.get('/chat/agents');
      return response.data.data || response.data;
    }
  });
}

export function useChatHistory(conversationId?: string) {
  return useQuery({
    queryKey: ['chat-history', conversationId],
    queryFn: async () => {
      const response = await api.get(`/chat/history/${conversationId}`);
      return response.data.data || response.data;
    },
    enabled: !!conversationId
  });
}

// ==================== SOIL ANALYSES ====================
export function useSoilAnalyses(parcelId?: string) {
  return useQuery({
    queryKey: ['soil-analyses', parcelId],
    queryFn: async () => {
      const response = await api.get(`/soil-analyses/parcel/${parcelId}`);
      return unwrap(response.data);
    },
    enabled: !!parcelId
  });
}

export function useCreateSoilAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/soil-analyses', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['soil-analyses'] })
  });
}

export function useDeleteSoilAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/soil-analyses/${id}`);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['soil-analyses'] })
  });
}

// ==================== MARKET PRICES ====================
export function useMarketPrices(cropType?: string, region?: string) {
  return useQuery({
    queryKey: ['market-prices', cropType, region],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (cropType) params.append('cropType', cropType);
      if (region) params.append('region', region);
      const response = await api.get(`/market-prices?${params}`);
      return unwrap(response.data);
    }
  });
}

export function useMarketPriceHistory(cropType?: string, region?: string) {
  return useQuery({
    queryKey: ['market-price-history', cropType, region],
    queryFn: async () => {
      const response = await api.get(`/market-prices/history/${cropType}?region=${region}`);
      return unwrap(response.data);
    },
    enabled: !!cropType && !!region
  });
}

export function useCreateMarketPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/market-prices', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-prices'] })
  });
}

// ==================== BANK ACCOUNTS ====================
export function useBankAccounts(farmId?: string) {
  return useQuery({
    queryKey: ['bank-accounts', farmId],
    queryFn: async () => {
      const response = await api.get(`/bank-accounts/farm/${farmId}`);
      return unwrap(response.data);
    },
    enabled: !!farmId
  });
}

export function useBankAccount(id?: string) {
  return useQuery({
    queryKey: ['bank-accounts', id],
    queryFn: async () => {
      const response = await api.get(`/bank-accounts/${id}`);
      return unwrap(response.data);
    },
    enabled: !!id
  });
}

export function useCreateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/bank-accounts', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-accounts'] })
  });
}

export function useUpdateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MutationPayload }) => {
      const response = await api.patch(`/bank-accounts/${id}`, data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-accounts'] })
  });
}

export function useDeleteBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/bank-accounts/${id}`);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-accounts'] })
  });
}

// ==================== INPUT USAGES ====================
export function useInputUsages(cycleId?: string) {
  return useQuery({
    queryKey: ['input-usages', cycleId],
    queryFn: async () => {
      const response = await api.get(`/input-usages/cycle/${cycleId}`);
      return unwrap(response.data);
    },
    enabled: !!cycleId
  });
}

export function useCreateInputUsage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const response = await api.post('/input-usages', data);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['input-usages'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    }
  });
}

export function useDeleteInputUsage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/input-usages/${id}`);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['input-usages'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    }
  });
}

// ==================== SETTINGS ====================
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return unwrap(response.data);
    }
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const response = await api.put(`/settings/${key}`, { value });
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] })
  });
}

export function useAuditLogs(params?: {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  entityId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', String(params.page));
      if (params?.limit) query.append('limit', String(params.limit));
      if (params?.action) query.append('action', params.action);
      if (params?.entity) query.append('entity', params.entity);
      if (params?.entityId) query.append('entityId', params.entityId);
      if (params?.userId) query.append('userId', params.userId);
      if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
      if (params?.dateTo) query.append('dateTo', params.dateTo);
      if (params?.search) query.append('search', params.search);
      const qs = query.toString();
      const response = await api.get(`/audit-logs${qs ? `?${qs}` : ''}`);
      return response.data;
    },
  });
}

// ==================== CHANGE PASSWORD ====================
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { oldPassword: string; newPassword: string }) => {
      const response = await api.put('/auth/change-password', data);
      return response.data;
    }
  });
}

