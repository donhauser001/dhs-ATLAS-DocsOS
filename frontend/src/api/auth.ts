/**
 * Auth API 客户端
 * Phase 4.2: 支持多凭证类型、密码重置、账户激活
 */

const API_BASE = '/api/auth';

// ============================================================
// 类型定义
// ============================================================

export type UserRole = 'admin' | 'staff' | 'client' | string;
export type UserStatus = 'active' | 'pending' | 'disabled' | 'locked' | 'expired';
export type CredentialType = 'username' | 'email' | 'phone';

export interface UserPermissions {
  paths: string[];
  can_create_proposal: boolean;
  can_execute_proposal: boolean;
  can_manage_users?: boolean;
  can_manage_roles?: boolean;
  can_view_audit?: boolean;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  role: UserRole;
  name: string;
  client_id?: string;
  permissions: UserPermissions;
  status?: UserStatus;
  last_login?: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token?: string;
}

export interface MeResponse {
  user: User;
}

export interface ApiError {
  error: string;
  code?: string;
  status?: UserStatus;
}

// ============================================================
// API 函数 - 认证
// ============================================================

/**
 * 登录 - 支持多种凭证类型
 */
export async function login(
  credential: string, 
  password: string, 
  credentialType: CredentialType = 'username'
): Promise<LoginResponse> {
  // 后端期望 { credential, password } 格式
  const body = { credential, password };
  
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({ error: '登录失败' }));
    throw new Error(error.error || '登录失败');
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
    throw new Error('登出失败');
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
    throw new Error('获取用户信息失败');
  }
  
  const data: MeResponse = await res.json();
  return data.user;
}

/**
 * 修改密码
 */
export async function changePassword(
  currentPassword: string, 
  newPassword: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  
  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({ error: '修改密码失败' }));
    throw new Error(error.error || '修改密码失败');
  }
}

// ============================================================
// API 函数 - 注册
// ============================================================

export interface RegisterData {
  username: string;
  email: string;
  phone?: string;
  password: string;
  name?: string;
}

export interface RegisterResponse {
  success: boolean;
  user_id: string;
  requires_activation: boolean;
  message?: string;
}

/**
 * 注册新用户
 */
export async function register(data: RegisterData): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({ error: '注册失败' }));
    throw new Error(error.error || '注册失败');
  }
  
  return res.json();
}

/**
 * 验证凭证唯一性
 */
export async function validateCredential(
  type: 'username' | 'email' | 'phone',
  value: string,
  excludeUserId?: string
): Promise<{ valid: boolean; message?: string }> {
  const params = new URLSearchParams({ type, value });
  if (excludeUserId) params.set('exclude', excludeUserId);
  
  const res = await fetch(`${API_BASE}/validate-credential?${params}`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({ error: '验证失败' }));
    throw new Error(error.error || '验证失败');
  }
  
  return res.json();
}

/**
 * 生成用户ID
 */
export async function generateUserId(): Promise<{ user_id: string }> {
  const res = await fetch(`${API_BASE}/generate-user-id`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({ error: '生成ID失败' }));
    throw new Error(error.error || '生成ID失败');
  }
  
  return res.json();
}

// ============================================================
// API 函数 - 密码重置
// ============================================================

/**
 * 发送密码重置邮件
 */
export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  
  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({ error: '发送失败' }));
    throw new Error(error.error || '发送失败');
  }
  
  return res.json();
}

/**
 * 验证重置密码 Token
 */
export async function verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
  const res = await fetch(`${API_BASE}/verify-reset-token/${token}`);
  
  if (!res.ok) {
    if (res.status === 404 || res.status === 400) {
      return { valid: false };
    }
    throw new Error('验证失败');
  }
  
  return res.json();
}

/**
 * 重置密码
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  
  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({ error: '重置失败' }));
    throw new Error(error.error || '重置失败');
  }
  
  return res.json();
}

// ============================================================
// API 函数 - 账户激活
// ============================================================

/**
 * 发送激活邮件
 */
export async function sendActivation(email: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/send-activation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  
  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({ error: '发送失败' }));
    throw new Error(error.error || '发送失败');
  }
  
  return res.json();
}

/**
 * 验证激活 Token
 */
export async function verifyActivationToken(token: string): Promise<{ valid: boolean; email?: string }> {
  const res = await fetch(`${API_BASE}/verify-activation-token/${token}`);
  
  if (!res.ok) {
    if (res.status === 404 || res.status === 400) {
      return { valid: false };
    }
    throw new Error('验证失败');
  }
  
  return res.json();
}

/**
 * 激活账户
 */
export async function activateAccount(token: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  
  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({ error: '激活失败' }));
    throw new Error(error.error || '激活失败');
  }
  
  return res.json();
}
