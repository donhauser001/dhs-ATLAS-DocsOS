/**
 * Principal API Client
 * Phase 3.1: Principal + Profile 用户体系
 */

const API_BASE = 'http://localhost:3000/api/principals';

// ============================================================
// 类型定义
// ============================================================

export interface PrincipalEntry {
  id: string;
  display_name: string;
  status: string;
  emails: string[];
  phones: string[];
  document: string;
  anchor: string;
  profile_count: number;
  profile_ids: string[];
}

export interface ProfileEntry {
  id: string;
  profile_type: string;
  principal_id: string;
  status: string;
  title: string;
  department?: string;
  client_id?: string;
  role_title?: string;
  document: string;
  anchor: string;
}

export interface PrincipalWithProfiles {
  principal: PrincipalEntry;
  profiles: ProfileEntry[];
}

export interface PrincipalContext extends PrincipalWithProfiles {
  profiles_by_type: Record<string, ProfileEntry[]>;
  summary: {
    profile_count: number;
    profile_types: string[];
    has_employee: boolean;
    has_client_contact: boolean;
  };
}

// ============================================================
// API 函数
// ============================================================

/**
 * 获取所有主体列表
 */
export async function fetchPrincipals(): Promise<PrincipalEntry[]> {
  const res = await fetch(API_BASE, {
    credentials: 'include',
  });
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch principals');
  }
  
  return data.data.principals;
}

/**
 * 获取主体详情（含 profiles）
 */
export async function fetchPrincipal(id: string): Promise<PrincipalWithProfiles> {
  const res = await fetch(`${API_BASE}/${id}`, {
    credentials: 'include',
  });
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch principal');
  }
  
  return data.data;
}

/**
 * 获取主体完整上下文（AI 友好）
 */
export async function fetchPrincipalContext(id: string): Promise<PrincipalContext> {
  const res = await fetch(`${API_BASE}/${id}/context`, {
    credentials: 'include',
  });
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch principal context');
  }
  
  return data.data;
}

/**
 * 搜索主体
 */
export async function searchPrincipals(query: string): Promise<PrincipalEntry[]> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, {
    credentials: 'include',
  });
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to search principals');
  }
  
  return data.data.results;
}

/**
 * 重建索引
 */
export async function rebuildPrincipalIndex(): Promise<{
  principals_count: number;
  profiles_count: number;
  updated_at: string;
}> {
  const res = await fetch(`${API_BASE}/rebuild-index`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to rebuild index');
  }
  
  return data.data;
}

