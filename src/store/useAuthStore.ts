import { create } from 'zustand';
import type { User, UserRole } from '@shared/types';
import { authApi } from '../api';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (username: string, password: string, role: UserRole) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,

  login: async (username, password, role) => {
    const result = await authApi.login({ username, password, role });
    localStorage.setItem('token', result.token);
    set({ token: result.token, user: result.user });
  },

  register: async (data) => {
    const result = await authApi.register(data);
    localStorage.setItem('token', result.token);
    set({ token: result.token, user: result.user });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },

  fetchCurrentUser: async () => {
    try {
      const result = await authApi.getCurrentUser();
      set({ user: result });
    } catch (err) {
      localStorage.removeItem('token');
      set({ token: null, user: null });
    }
  },
}));
