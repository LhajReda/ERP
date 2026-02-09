import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('fla7a_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const tenantId = localStorage.getItem('fla7a_tenant');
    if (tenantId) config.headers['x-tenant-id'] = tenantId;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('fla7a_token');
      window.location.href = '/fr/login';
    }
    return Promise.reject(error);
  },
);

export default api;
