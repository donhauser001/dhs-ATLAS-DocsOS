/**
 * Tokens API - Design Tokens 前端接口
 * 
 * Phase 2.5: 语言与显现校正
 */

const API_BASE = '/api/tokens';

// ============================================================
// 类型定义
// ============================================================

/**
 * Token 定义
 */
export interface TokenDefinition {
  /** 主值 */
  value: string;
  /** 描述 */
  description?: string;
  /** 其他变体（如 bg, text, lucide 等） */
  [key: string]: string | undefined;
}

/**
 * Token 组
 */
export interface TokenGroup {
  /** 组 ID */
  id: string;
  /** 组标题 */
  title: string;
  /** 组内所有 token */
  tokens: Record<string, TokenDefinition>;
}

/**
 * Token 缓存结构
 */
export interface TokenCache {
  /** 所有 token 组（按 id 索引） */
  groups: Record<string, TokenGroup>;
  /** 扁平化的 token 索引（完整路径 -> 定义） */
  index: Record<string, TokenDefinition>;
  /** 更新时间 */
  updated_at: string;
}

/**
 * Token 引用
 */
export interface TokenRef {
  token: string;
}

/**
 * 显现配置
 */
export interface DisplayConfig {
  color: string | null;
  bg: string | null;
  text: string | null;
  icon: string | null;
}

// ============================================================
// API 函数
// ============================================================

/**
 * 获取所有 Tokens
 */
export async function fetchTokens(): Promise<TokenCache> {
  const res = await fetch(API_BASE);
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch tokens');
  }
  
  return data.data;
}

/**
 * 获取所有 Token 组
 */
export async function fetchTokenGroups(): Promise<TokenGroup[]> {
  const res = await fetch(`${API_BASE}/groups`);
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch token groups');
  }
  
  return data.data;
}

/**
 * 解析 Token 路径为值
 * 
 * @param path Token 路径，如 "color.brand.primary"
 * @param variant 可选变体，如 "bg"
 */
export async function resolveToken(path: string, variant?: string): Promise<string | null> {
  const url = variant 
    ? `${API_BASE}/resolve/${path}?variant=${variant}`
    : `${API_BASE}/resolve/${path}`;
    
  const res = await fetch(url);
  const data = await res.json();
  
  if (!data.success) {
    return null;
  }
  
  return data.data.value;
}

/**
 * 获取 Token 完整定义
 */
export async function fetchTokenDefinition(path: string): Promise<TokenDefinition | null> {
  const res = await fetch(`${API_BASE}/resolve/${path}`);
  const data = await res.json();
  
  if (!data.success) {
    return null;
  }
  
  return data.data.definition;
}

/**
 * 获取状态的显现配置
 */
export async function fetchStatusDisplay(status: string): Promise<DisplayConfig> {
  const res = await fetch(`${API_BASE}/status/${status}`);
  const data = await res.json();
  
  if (!data.success) {
    return { color: null, bg: null, text: null, icon: null };
  }
  
  return data.data.display;
}

/**
 * 获取类型的显现配置
 */
export async function fetchTypeDisplay(type: string): Promise<DisplayConfig> {
  const res = await fetch(`${API_BASE}/type/${type}`);
  const data = await res.json();
  
  if (!data.success) {
    return { color: null, bg: null, text: null, icon: null };
  }
  
  return data.data.display;
}

/**
 * 重建 Token 缓存
 */
export async function rebuildTokenCache(): Promise<void> {
  const res = await fetch(`${API_BASE}/rebuild`, { method: 'POST' });
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to rebuild token cache');
  }
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 判断值是否为 TokenRef
 */
export function isTokenRef(value: unknown): value is TokenRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    'token' in value &&
    typeof (value as TokenRef).token === 'string'
  );
}

