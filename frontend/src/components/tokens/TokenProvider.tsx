/**
 * TokenProvider - Token 系统提供者
 * 
 * Phase 3.0: 驱逐编码值
 * 
 * 职责：
 * 1. 加载 Token 定义
 * 2. 注入 CSS 变量
 * 3. 提供 Token 上下文
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchTokens, type TokenCache } from '@/api/tokens';

// ============================================================
// 上下文
// ============================================================

interface TokenContextValue {
  /** Token 缓存 */
  cache: TokenCache | null;
  /** 是否加载中 */
  loading: boolean;
  /** 加载错误 */
  error: Error | null;
  /** 解析 Token */
  resolveToken: (path: string) => string | null;
  /** 解析 Token 变体 */
  resolveTokenVariant: (path: string, variant: string) => string | null;
  /** 刷新 Token */
  refresh: () => Promise<void>;
}

const TokenContext = createContext<TokenContextValue | null>(null);

// ============================================================
// Provider 组件
// ============================================================

interface TokenProviderProps {
  children: ReactNode;
}

export function TokenProvider({ children }: TokenProviderProps) {
  const [cache, setCache] = useState<TokenCache | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // 加载 Token
  useEffect(() => {
    loadAndInjectTokens();
  }, []);
  
  async function loadAndInjectTokens() {
    setLoading(true);
    try {
      const data = await fetchTokens();
      setCache(data);
      injectCSSVariables(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('[TokenProvider] Failed to load tokens:', err);
    } finally {
      setLoading(false);
    }
  }
  
  async function refresh() {
    await loadAndInjectTokens();
  }
  
  function resolveToken(path: string): string | null {
    if (!cache) return null;
    const def = cache.index[path];
    return def?.value || null;
  }
  
  function resolveTokenVariant(path: string, variant: string): string | null {
    if (!cache) return null;
    const def = cache.index[path];
    if (!def) return null;
    return def[variant] || def.value || null;
  }
  
  const value: TokenContextValue = {
    cache,
    loading,
    error,
    resolveToken,
    resolveTokenVariant,
    refresh,
  };
  
  return (
    <TokenContext.Provider value={value}>
      {children}
    </TokenContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useTokenContext(): TokenContextValue {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokenContext must be used within a TokenProvider');
  }
  return context;
}

// ============================================================
// CSS 变量注入
// ============================================================

/**
 * 将 Token 注入为 CSS 变量
 */
function injectCSSVariables(cache: TokenCache): void {
  const root = document.documentElement;
  
  for (const [path, def] of Object.entries(cache.index)) {
    // 将 path 转换为 CSS 变量名
    // color.brand.primary -> --color-brand-primary
    const varName = `--${path.replace(/\./g, '-')}`;
    
    // 注入主值
    if (def.value) {
      root.style.setProperty(varName, def.value);
    }
    
    // 注入变体
    for (const [variant, value] of Object.entries(def)) {
      if (variant !== 'value' && variant !== 'description' && value) {
        root.style.setProperty(`${varName}-${variant}`, value);
      }
    }
  }
  
  console.log(`[TokenProvider] Injected ${Object.keys(cache.index).length} tokens as CSS variables`);
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 获取 CSS 变量名
 * 
 * @param path Token 路径，如 "color.brand.primary"
 * @returns CSS 变量引用，如 "var(--color-brand-primary)"
 */
export function tokenVar(path: string): string {
  return `var(--${path.replace(/\./g, '-')})`;
}

/**
 * 获取 CSS 变量名（带变体）
 * 
 * @param path Token 路径
 * @param variant 变体名
 * @returns CSS 变量引用
 */
export function tokenVarVariant(path: string, variant: string): string {
  return `var(--${path.replace(/\./g, '-')}-${variant})`;
}

export default TokenProvider;

