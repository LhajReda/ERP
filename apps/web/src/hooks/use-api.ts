'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Helper to get current farm ID
function getActiveFarmId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fla7a_farm');
}

function getUserInfo() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('fla7a_user');
  return raw ? JSON.parse(raw) : null;
}

// ==================== FARMS ====================
export function useFarms() {
  return useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const response = await api.get('/farms');
      return response.data.data || response.data;
    }
  });
}

export function useFarm(id?: string) {
  return useQuery({
    queryKey: ['farms', id],
    queryFn: async () => {
      const response = await api.get(`/farms/${id}`);
      return response.data.data || response.data;
    },
    enabled: !!id
  });
}

export function useCreateFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/farms', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farms'] })
  });
}

export function useUpdateFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
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
      let parcels = response.data.data || response.data;
      if (farmId && Array.isArray(parcels)) {
        parcels = parcels.filter((p: any) => p.farmId === farmId);
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
      return response.data.data || response.data;
    },
    enabled: !!id
  });
}

export function useCreateParcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/parcels', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parcels'] })
  });
}

export function useUpdateParcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
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
      let cycles = response.data.data || response.data;
      if (farmId && Array.isArray(cycles)) {
        cycles = cycles.filter((c: any) => c.farmId === farmId);
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
      return response.data.data || response.data;
    },
    enabled: !!id
  });
}

export function useCreateCultureCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/culture-cycles', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['culture-cycles'] })
  });
}

export function useUpdateCultureCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
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
      return response.data.data || response.data;
    },
    enabled: !!cycleId
  });
}

export function useCreateFarmActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
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
      return response.data.data || response.data;
    },
    enabled: !!cycleId
  });
}

export function useHarvestStats(farmId?: string) {
  return useQuery({
    queryKey: ['harvest-stats', farmId],
    queryFn: async () => {
      const response = await api.get(`/harvests/stats/${farmId}`);
      return response.data.data || response.data;
    },
    enabled: !!farmId
  });
}

export function useCreateHarvest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
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
      let products = response.data.data || response.data;
      if (farmId && Array.isArray(products)) {
        products = products.filter((p: any) => p.farmId === farmId);
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
      return response.data.data || response.data;
    },
    enabled: !!id
  });
}

export function useLowStockAlerts(farmId?: string) {
  return useQuery({
    queryKey: ['low-stock-alerts', farmId],
    queryFn: async () => {
      const response = await api.get(`/products/low-stock-alerts/${farmId}`);
      return response.data.data || response.data;
    },
    enabled: !!farmId
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/products', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] })
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
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
    mutationFn: async (data: any) => {
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
      return response.data.data || response.data;
    },
    enabled: !!farmId
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
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
      let invoices = response.data.data || response.data;
      if (farmId && Array.isArray(invoices)) {
        invoices = invoices.filter((i: any) => i.farmId === farmId);
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
      return response.data.data || response.data;
    },
    enabled: !!id
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/invoices', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] })
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch(`/invoices/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] })
  });
}

export function useAddInvoicePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.post(`/invoices/${id}/payments`, data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] })
  });
}

// ==================== TRANSACTIONS ====================
export function useTransactions(accountId?: string) {
  return useQuery({
    queryKey: ['transactions', accountId],
    queryFn: async () => {
      const response = await api.get(`/transactions/account/${accountId}`);
      return response.data.data || response.data;
    },
    enabled: !!accountId
  });
}

export function useMonthlySummary(farmId?: string) {
  return useQuery({
    queryKey: ['monthly-summary', farmId],
    queryFn: async () => {
      const response = await api.get(`/transactions/monthly-summary/${farmId}`);
      return response.data.data || response.data;
    },
    enabled: !!farmId
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/transactions', data);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['monthly-summary'] });
    }
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
      return response.data.data || response.data;
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
      return response.data.data || response.data;
    },
    enabled: !!farmId
  });
}

// ==================== EMPLOYEES ====================
export function useEmployees(farmId?: string) {
  return useQuery({
    queryKey: ['employees', farmId],
    queryFn: async () => {
      const response = await api.get(`/employees/farm/${farmId}`);
      return response.data.data || response.data;
    },
    enabled: !!farmId
  });
}

export function useEmployee(id?: string) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: async () => {
      const response = await api.get(`/employees/${id}`);
      return response.data.data || response.data;
    },
    enabled: !!id
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/employees', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] })
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
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
    mutationFn: async (data: any) => {
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
        payslips = payslips.filter((p: any) => p.farmId === farmId);
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
    mutationFn: async (data: any) => {
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
      return response.data.data || response.data;
    },
    enabled: !!farmId
  });
}

export function useClient(id?: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const response = await api.get(`/clients/${id}`);
      return response.data.data || response.data;
    },
    enabled: !!id
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/clients', data);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] })
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
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
      return response.data.data || response.data;
    },
    enabled: !!farmId
  });
}

export function useComplianceStatus(farmId?: string) {
  return useQuery({
    queryKey: ['compliance-status', farmId],
    queryFn: async () => {
      const response = await api.get(`/compliance/status/${farmId}`);
      return response.data.data || response.data;
    },
    enabled: !!farmId
  });
}

export function useOnssaCheck(farmId?: string) {
  return useQuery({
    queryKey: ['onssa-check', farmId],
    queryFn: async () => {
      const response = await api.get(`/compliance/onssa-check/${farmId}`);
      return response.data.data || response.data;
    },
    enabled: !!farmId
  });
}

export function useExpiringCertifications(farmId?: string) {
  return useQuery({
    queryKey: ['expiring-certifications', farmId],
    queryFn: async () => {
      const response = await api.get(`/compliance/expiring/${farmId}`);
      return response.data.data || response.data;
    },
    enabled: !!farmId
  });
}

export function useCreateCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
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
      return response.data.data || response.data;
    }
  });
}

// ==================== NOTIFICATIONS ====================
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data.data || response.data;
    }
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await api.get('/notifications/unread-count');
      return response.data.data || response.data;
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
