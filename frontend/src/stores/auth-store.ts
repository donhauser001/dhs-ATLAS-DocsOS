/**
 * Auth Store - 认证状态管理
 * Phase 4.2: 支持多凭证类型登录
 */

import { create } from 'zustand';
import { 
  login as apiLogin, 
  logout as apiLogout, 
  getCurrentUser, 
  type User,
  type CredentialType 
} from '@/api/auth';
import { minimatch } from 'minimatch';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (credential: string, password: string, credentialType?: CredentialType) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  
  // Computed
  isAuthenticated: boolean;
  canCreateProposal: boolean;
  canExecuteProposal: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewAudit: boolean;
  canAccess: (path: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  
  login: async (credential: string, password: string, credentialType: CredentialType = 'username') => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiLogin(credential, password, credentialType);
      set({ user: response.user, loading: false });
      return true;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      set({ error: errorMessage, loading: false });
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

  setUser: (user: User | null) => {
    set({ user });
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

  get canManageUsers() {
    const user = get().user;
    return user?.permissions.can_manage_users ?? false;
  },

  get canManageRoles() {
    const user = get().user;
    return user?.permissions.can_manage_roles ?? false;
  },

  get canViewAudit() {
    const user = get().user;
    return user?.permissions.can_view_audit ?? false;
  },
  
  canAccess: (path: string) => {
    const user = get().user;
    if (!user) return false;
    
    if (user.role === 'admin') return true;
    
    return user.permissions.paths.some(pattern => minimatch(path, pattern));
  },
}));
