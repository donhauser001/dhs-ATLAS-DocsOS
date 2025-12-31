/**
 * Auth Store - 认证状态管理
 */

import { create } from 'zustand';
import { login as apiLogin, logout as apiLogout, getCurrentUser, type User } from '@/api/auth';
import { minimatch } from 'minimatch';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  
  // Computed
  isAuthenticated: boolean;
  canCreateProposal: boolean;
  canExecuteProposal: boolean;
  canAccess: (path: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  
  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiLogin(username, password);
      set({ user: response.user, loading: false });
      return true;
    } catch (e) {
      set({ error: String(e), loading: false });
      return false;
    }
  },
  
  logout: async () => {
    set({ loading: true });
    
    try {
      await apiLogout();
    } catch {
      // Ignore logout errors
    }
    
    set({ user: null, loading: false, error: null });
  },
  
  checkAuth: async () => {
    set({ loading: true });
    
    try {
      const user = await getCurrentUser();
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
  
  clearError: () => {
    set({ error: null });
  },
  
  get isAuthenticated() {
    return get().user !== null;
  },
  
  get canCreateProposal() {
    const user = get().user;
    return user?.permissions.can_create_proposal ?? false;
  },
  
  get canExecuteProposal() {
    const user = get().user;
    return user?.permissions.can_execute_proposal ?? false;
  },
  
  canAccess: (path: string) => {
    const user = get().user;
    if (!user) return false;
    
    if (user.role === 'admin') return true;
    
    return user.permissions.paths.some(pattern => minimatch(path, pattern));
  },
}));

