import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('fla7a_token');
  const tenantId = await SecureStore.getItemAsync('fla7a_tenant');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers['x-tenant-id'] = tenantId;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('fla7a_token');
      await SecureStore.deleteItemAsync('fla7a_refresh');
    }
    return Promise.reject(error);
  },
);

export default api;

// ---- API functions ----

export const authAPI = {
  login: (phone: string, password: string) =>
    api.post('/auth/login', { phone, password }),
  register: (data: { phone: string; password: string; firstName: string; lastName: string; tenantName?: string }) =>
    api.post('/auth/register', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

export const farmAPI = {
  list: (params?: Record<string, any>) => api.get('/farms', { params }),
  get: (id: string) => api.get(`/farms/${id}`),
  create: (data: any) => api.post('/farms', data),
  update: (id: string, data: any) => api.patch(`/farms/${id}`, data),
  delete: (id: string) => api.delete(`/farms/${id}`),
};

export const cultureAPI = {
  listCycles: (params?: Record<string, any>) => api.get('/culture-cycles', { params }),
  getCycle: (id: string) => api.get(`/culture-cycles/${id}`),
  createCycle: (data: any) => api.post('/culture-cycles', data),
  listActivities: (cycleId: string) => api.get(`/farm-activities?cycleId=${cycleId}`),
  createActivity: (data: any) => api.post('/farm-activities', data),
  listHarvests: (cycleId: string) => api.get(`/harvests?cycleId=${cycleId}`),
  createHarvest: (data: any) => api.post('/harvests', data),
};

export const stockAPI = {
  listProducts: (params?: Record<string, any>) => api.get('/products', { params }),
  getProduct: (id: string) => api.get(`/products/${id}`),
  createProduct: (data: any) => api.post('/products', data),
  createMovement: (data: any) => api.post('/stock-movements', data),
  listSuppliers: (params?: Record<string, any>) => api.get('/suppliers', { params }),
};

export const financeAPI = {
  listInvoices: (params?: Record<string, any>) => api.get('/invoices', { params }),
  createInvoice: (data: any) => api.post('/invoices', data),
  listTransactions: (params?: Record<string, any>) => api.get('/transactions', { params }),
};

export const hrAPI = {
  listEmployees: (params?: Record<string, any>) => api.get('/employees', { params }),
  markAttendance: (data: any) => api.post('/attendance', data),
  listAttendance: (params?: Record<string, any>) => api.get('/attendance', { params }),
};

export const dashboardAPI = {
  getKPIs: (farmId: string) => api.get(`/dashboard/kpis?farmId=${farmId}`),
};

export const chatAPI = {
  send: (data: { message: string; conversationId: string; farmId: string; locale: string }) =>
    api.post('/chat', data),
};
