/**
 * Auth API 客户端
 */

const API_BASE = '/api/auth';

// ============================================================
// 类型定义
// ============================================================

export type UserRole = 'admin' | 'staff' | 'client';

export interface UserPermissions {
  paths: string[];
  can_create_proposal: boolean;
  can_execute_proposal: boolean;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  client_id?: string;
  permissions: UserPermissions;
}

export interface LoginResponse {
  success: boolean;
  user: User;
}

export interface MeResponse {
  user: User;
}

// ============================================================
// API 函数
// ============================================================

/**
 * 登录
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(error.error || 'Login failed');
  }
  
  return res.json();
}

/**
 * 登出
 */
export async function logout(): Promise<void> {
  const res = await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error('Logout failed');
  }
}

/**
 * 获取当前用户
 */
export async function getCurrentUser(): Promise<User | null> {
  const res = await fetch(`${API_BASE}/me`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      return null;
    }
    throw new Error('Failed to get current user');
  }
  
  const data: MeResponse = await res.json();
  return data.user;
}
