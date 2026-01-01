/**
 * Profile API Client
 * Phase 3.1: Principal + Profile 用户体系
 */

const API_BASE = 'http://localhost:3000/api/profiles';

// ============================================================
// 类型定义
// ============================================================

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

export interface PrincipalSummary {
  id: string;
  display_name: string;
  emails: string[];
  phones: string[];
  document?: string;
  anchor?: string;
}

export interface ProfileWithPrincipal {
  profile: ProfileEntry;
  principal: PrincipalSummary | null;
}

export interface ClientContact extends ProfileEntry {
  principal: PrincipalSummary | null;
}

// ============================================================
// API 函数
// ============================================================

/**
 * 获取所有档案（可按类型筛选）
 */
export async function fetchProfiles(type?: string): Promise<ProfileEntry[]> {
  const url = type 
    ? `${API_BASE}?type=${encodeURIComponent(type)}`
    : API_BASE;
    
  const res = await fetch(url, {
    credentials: 'include',
  });
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch profiles');
  }
  
  return data.data.profiles;
}

/**
 * 获取档案详情（含 principal）
 */
export async function fetchProfile(id: string): Promise<ProfileWithPrincipal> {
  const res = await fetch(`${API_BASE}/${id}`, {
    credentials: 'include',
  });
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch profile');
  }
  
  return data.data;
}

/**
 * 按类型获取档案列表
 */
export async function fetchProfilesByType(type: string): Promise<ProfileEntry[]> {
  const res = await fetch(`${API_BASE}/by-type/${type}`, {
    credentials: 'include',
  });
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch profiles by type');
  }
  
  return data.data.profiles;
}

/**
 * 获取客户的所有联系人档案
 */
export async function fetchClientContacts(clientId: string): Promise<ClientContact[]> {
  const res = await fetch(`${API_BASE}/by-client/${clientId}`, {
    credentials: 'include',
  });
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch client contacts');
  }
  
  return data.data.contacts;
}

/**
 * 获取档案完整上下文（AI 友好）
 */
export async function fetchProfileContext(id: string): Promise<{
  profile: ProfileEntry;
  principal: PrincipalSummary | null;
  client_id?: string;
}> {
  const res = await fetch(`${API_BASE}/${id}/context`, {
    credentials: 'include',
  });
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch profile context');
  }
  
  return data.data;
}

