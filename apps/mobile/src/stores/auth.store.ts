import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: string;
  language: string;
  tenantId: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: { phone: string; password: string; firstName: string; lastName: string; tenantName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  setFarm: (farmId: string) => Promise<void>;
  currentFarmId: string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  currentFarmId: null,

  loadToken: async () => {
    try {
      const token = await SecureStore.getItemAsync('fla7a_token');
      const userStr = await SecureStore.getItemAsync('fla7a_user');
      const farmId = await SecureStore.getItemAsync('fla7a_farm');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isAuthenticated: true, currentFarmId: farmId });
      }
    } catch {
      // Token expired or invalid
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (phone, password) => {
    const res = await authAPI.login(phone, password);
    const { accessToken, refreshToken, user } = res.data.data;
    await SecureStore.setItemAsync('fla7a_token', accessToken);
    await SecureStore.setItemAsync('fla7a_refresh', refreshToken);
    await SecureStore.setItemAsync('fla7a_user', JSON.stringify(user));
    await SecureStore.setItemAsync('fla7a_tenant', user.tenantId);
    set({ token: accessToken, user, isAuthenticated: true });
  },

  register: async (data) => {
    const res = await authAPI.register(data);
    const { accessToken, refreshToken, user } = res.data.data;
    await SecureStore.setItemAsync('fla7a_token', accessToken);
    await SecureStore.setItemAsync('fla7a_refresh', refreshToken);
    await SecureStore.setItemAsync('fla7a_user', JSON.stringify(user));
    await SecureStore.setItemAsync('fla7a_tenant', user.tenantId);
    set({ token: accessToken, user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('fla7a_token');
    await SecureStore.deleteItemAsync('fla7a_refresh');
    await SecureStore.deleteItemAsync('fla7a_user');
    await SecureStore.deleteItemAsync('fla7a_farm');
    set({ user: null, token: null, isAuthenticated: false, currentFarmId: null });
  },

  setFarm: async (farmId) => {
    await SecureStore.setItemAsync('fla7a_farm', farmId);
    set({ currentFarmId: farmId });
  },
}));
