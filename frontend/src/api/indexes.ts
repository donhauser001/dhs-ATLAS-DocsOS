/**
 * Indexes API 客户端
 * Phase 4.2: 索引管理和用户列表
 */

const API_BASE = '/api/indexes';

// ============================================================
// 类型定义
// ============================================================

export type AccountStatus = 'active' | 'pending' | 'disabled' | 'locked' | 'expired';

export interface AuthIndexStats {
  total_users: number;
  total_documents: number;
  by_status: Record<AccountStatus, number>;
  by_role: Record<string, number>;
  lastUpdate: string | null;
}

export interface UserRecord {
  user_id: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: string;
  role_name: string;
  status: AccountStatus;
  last_login: string | null;
  expired_at: string | null;
  created_at: string;
  updated_at: string;
  _doc_path: string;
}

export interface UserListResponse {
  users: UserRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface RebuildResult {
  success: boolean;
  message: string;
  stats: {
    totalDocuments: number;
    scannedDocuments: number;
    totalUsers: number;
    rebuildTime: number;
  };
}

export interface UserListParams {
  role?: string;
  status?: AccountStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================
// API 函数 - 认证索引
// ============================================================

/**
 * 获取认证索引统计
 */
export async function getAuthIndexStats(): Promise<AuthIndexStats> {
  const res = await fetch(`${API_BASE}/auth/stats`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error('获取统计失败');
  }
  
  return res.json();
}

/**
 * 重建认证索引
 */
export async function rebuildAuthIndex(): Promise<RebuildResult> {
  const res = await fetch(`${API_BASE}/auth/rebuild`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: '重建失败' }));
    throw new Error(error.error || '重建失败');
  }
  
  return res.json();
}

/**
 * 获取用户列表
 */
export async function getAuthUsers(params: UserListParams = {}): Promise<UserListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.role) searchParams.set('role', params.role);
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  
  const res = await fetch(`${API_BASE}/auth/users?${searchParams}`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error('获取用户列表失败');
  }
  
  return res.json();
}

/**
 * 更新用户状态
 */
export async function updateUserStatus(userId: string, status: AccountStatus): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/auth/users/${encodeURIComponent(userId)}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: '更新失败' }));
    throw new Error(error.error || '更新失败');
  }
  
  return res.json();
}

// ============================================================
// API 函数 - 全局索引
// ============================================================

/**
 * 重建所有索引
 */
export async function rebuildAllIndexes(): Promise<{ success: boolean; results: Record<string, unknown> }> {
  const res = await fetch(`${API_BASE}/rebuild-all`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: '重建失败' }));
    throw new Error(error.error || '重建失败');
  }
  
  return res.json();
}

