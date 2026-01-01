/**
 * useTokens - Design Tokens Hook
 * 
 * Phase 2.5: 语言与显现校正
 * 
 * 提供：
 * - Token 数据加载与缓存
 * - Token 解析
 * - 状态/类型显现配置
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchTokens,
  fetchStatusDisplay,
  fetchTypeDisplay,
  type TokenCache,
  type TokenDefinition,
  type DisplayConfig,
  type TokenRef,
  isTokenRef,
} from '../api/tokens';

// ============================================================
// Hook 状态
// ============================================================

let globalTokenCache: TokenCache | null = null;
let loadingPromise: Promise<TokenCache> | null = null;

// ============================================================
// 主 Hook
// ============================================================

/**
 * useTokens - 获取 Token 系统
 * 
 * @returns Token 缓存、解析函数、加载状态
 */
export function useTokens() {
  const [cache, setCache] = useState<TokenCache | null>(globalTokenCache);
  const [loading, setLoading] = useState(!globalTokenCache);
  const [error, setError] = useState<Error | null>(null);
  
  // 加载 Tokens
  useEffect(() => {
    if (globalTokenCache) {
      setCache(globalTokenCache);
      setLoading(false);
      return;
    }
    
    if (loadingPromise) {
      loadingPromise.then(data => {
        setCache(data);
        setLoading(false);
      }).catch(err => {
        setError(err);
        setLoading(false);
      });
      return;
    }
    
    setLoading(true);
    loadingPromise = fetchTokens();
    
    loadingPromise
      .then(data => {
        globalTokenCache = data;
        setCache(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      })
      .finally(() => {
        loadingPromise = null;
      });
  }, []);
  
  /**
   * 解析 Token 路径为值
   */
  const resolveToken = useCallback((path: string): string | null => {
    if (!cache) return null;
    const def = cache.index[path];
    return def?.value || null;
  }, [cache]);
  
  /**
   * 解析 Token 路径为指定变体
   */
  const resolveTokenVariant = useCallback((path: string, variant: string): string | null => {
    if (!cache) return null;
    const def = cache.index[path];
    if (!def) return null;
    return def[variant] || def.value || null;
  }, [cache]);
  
  /**
   * 获取 Token 完整定义
   */
  const getTokenDefinition = useCallback((path: string): TokenDefinition | null => {
    if (!cache) return null;
    return cache.index[path] || null;
  }, [cache]);
  
  /**
   * 解析值（如果是 TokenRef 则解析，否则返回原值）
   */
  const resolveValue = useCallback(<T>(value: T | TokenRef): T | string | null => {
    if (isTokenRef(value)) {
      return resolveToken(value.token);
    }
    return value;
  }, [resolveToken]);
  
  /**
   * 刷新缓存
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTokens();
      globalTokenCache = data;
      setCache(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    cache,
    loading,
    error,
    resolveToken,
    resolveTokenVariant,
    getTokenDefinition,
    resolveValue,
    refresh,
  };
}

// ============================================================
// 状态显现 Hook
// ============================================================

/**
 * useStatusDisplay - 获取状态的显现配置
 * 
 * @param status 状态名，如 "active"
 */
export function useStatusDisplay(status: string): {
  display: DisplayConfig | null;
  loading: boolean;
} {
  const [display, setDisplay] = useState<DisplayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setLoading(true);
    fetchStatusDisplay(status)
      .then(setDisplay)
      .finally(() => setLoading(false));
  }, [status]);
  
  return { display, loading };
}

/**
 * useTypeDisplay - 获取类型的显现配置
 * 
 * @param type 类型名，如 "service"
 */
export function useTypeDisplay(type: string): {
  display: DisplayConfig | null;
  loading: boolean;
} {
  const [display, setDisplay] = useState<DisplayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setLoading(true);
    fetchTypeDisplay(type)
      .then(setDisplay)
      .finally(() => setLoading(false));
  }, [type]);
  
  return { display, loading };
}

// ============================================================
// 批量显现 Hook
// ============================================================

/**
 * useDisplayConfigs - 批量获取状态和类型的显现配置
 * 
 * 用于 Block 渲染时一次性获取所有需要的显现配置
 */
export function useDisplayConfigs(status: string, type: string): {
  statusDisplay: DisplayConfig | null;
  typeDisplay: DisplayConfig | null;
  loading: boolean;
} {
  const [statusDisplay, setStatusDisplay] = useState<DisplayConfig | null>(null);
  const [typeDisplay, setTypeDisplay] = useState<DisplayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setLoading(true);
    
    Promise.all([
      fetchStatusDisplay(status),
      fetchTypeDisplay(type),
    ])
      .then(([statusRes, typeRes]) => {
        setStatusDisplay(statusRes);
        setTypeDisplay(typeRes);
      })
      .finally(() => setLoading(false));
  }, [status, type]);
  
  return { statusDisplay, typeDisplay, loading };
}

// ============================================================
// 预设颜色（用于 Token 加载失败时的回退）
// ============================================================

const FALLBACK_STATUS_COLORS: Record<string, DisplayConfig> = {
  active: { color: '#22C55E', bg: '#DCFCE7', text: '#166534', icon: 'CheckCircle' },
  draft: { color: '#F59E0B', bg: '#FEF3C7', text: '#92400E', icon: 'PenLine' },
  archived: { color: '#64748B', bg: '#F1F5F9', text: '#475569', icon: 'Archive' },
};

const FALLBACK_TYPE_COLORS: Record<string, DisplayConfig> = {
  service: { color: '#3B82F6', bg: '#DBEAFE', text: '#1E40AF', icon: 'Briefcase' },
  category: { color: '#8B5CF6', bg: '#EDE9FE', text: '#6D28D9', icon: 'FolderTree' },
  event: { color: '#F97316', bg: '#FFEDD5', text: '#C2410C', icon: 'CalendarDays' },
};

/**
 * 获取回退的状态颜色
 */
export function getFallbackStatusColor(status: string): DisplayConfig {
  return FALLBACK_STATUS_COLORS[status] || FALLBACK_STATUS_COLORS.draft;
}

/**
 * 获取回退的类型颜色
 */
export function getFallbackTypeColor(type: string): DisplayConfig {
  return FALLBACK_TYPE_COLORS[type] || FALLBACK_TYPE_COLORS.service;
}

// ============================================================
// 同步版本（使用本地缓存或回退值）
// ============================================================

/**
 * 同步获取状态显现配置（使用缓存或回退值）
 */
export function getStatusDisplaySync(status: string): DisplayConfig {
  if (!globalTokenCache) {
    return getFallbackStatusColor(status);
  }
  
  const colorDef = globalTokenCache.index[`color.status.${status}`];
  const iconDef = globalTokenCache.index[`icon.status.${status}`];
  
  if (!colorDef) {
    return getFallbackStatusColor(status);
  }
  
  return {
    color: colorDef.value || null,
    bg: colorDef.bg || null,
    text: colorDef.text || null,
    icon: iconDef?.lucide || null,
  };
}

/**
 * 同步获取类型显现配置（使用缓存或回退值）
 */
export function getTypeDisplaySync(type: string): DisplayConfig {
  if (!globalTokenCache) {
    return getFallbackTypeColor(type);
  }
  
  const colorDef = globalTokenCache.index[`color.type.${type}`];
  const iconDef = globalTokenCache.index[`icon.type.${type}`];
  
  if (!colorDef) {
    return getFallbackTypeColor(type);
  }
  
  return {
    color: colorDef.value || null,
    bg: colorDef.bg || null,
    text: colorDef.text || null,
    icon: iconDef?.lucide || null,
  };
}

export default useTokens;

