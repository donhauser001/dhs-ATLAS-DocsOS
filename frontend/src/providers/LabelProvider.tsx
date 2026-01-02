/**
 * LabelProvider - 系统级标签全局 Provider
 * 
 * 核心原则：
 * - 原始名（key）：写入文档的字段名，如 project_name
 * - 映射名（label）：界面显示的名称，如 项目名称
 * 
 * 文档始终使用原始名，映射名只影响 UI 显示
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { fetchLabelConfig, type LabelConfig, type LabelItem, type ResolvedLabel } from '@/api/labels';

// ============================================================
// Context 类型
// ============================================================

interface LabelContextValue {
  /** 标签配置 */
  config: LabelConfig | null;
  /** 是否加载中 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;

  /**
   * 解析原始名 -> 显示信息
   * @param key 原始名（如 project_name）
   * @returns { key, label, icon, color, hidden }
   */
  resolveLabel: (key: string) => ResolvedLabel;

  /**
   * 获取映射名
   */
  getLabel: (key: string) => string;

  /**
   * 获取图标
   */
  getIcon: (key: string) => string | undefined;

  /**
   * 获取颜色
   */
  getColor: (key: string) => string | undefined;

  /**
   * 检查是否是敏感字段
   */
  isHidden: (key: string) => boolean;

  /**
   * 刷新配置
   */
  refresh: () => Promise<void>;
}

// ============================================================
// Context
// ============================================================

const LabelContext = createContext<LabelContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

interface LabelProviderProps {
  children: ReactNode;
}

export function LabelProvider({ children }: LabelProviderProps) {
  const [config, setConfig] = useState<LabelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 缓存：key -> LabelItem
  const [labelCache, setLabelCache] = useState<Map<string, LabelItem>>(new Map());

  // 加载配置
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLabelConfig();
      setConfig(data);

      // 构建缓存
      const cache = new Map<string, LabelItem>();
      for (const category of data.categories) {
        for (const item of category.items) {
          cache.set(item.key, item);
          cache.set(item.key.toLowerCase(), item);
        }
      }
      setLabelCache(cache);

      console.log(`[LabelProvider] Loaded ${cache.size / 2} labels`);
    } catch (err) {
      console.error('[LabelProvider] Failed to load config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load labels');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // 解析标签
  const resolveLabel = useCallback(
    (key: string): ResolvedLabel => {
      // 检查敏感字段
      if (config?.hiddenFields.includes(key) || config?.hiddenFields.includes(key.toLowerCase())) {
        return {
          key,
          label: key,
          hidden: true,
        };
      }

      // 从缓存获取
      const item = labelCache.get(key) || labelCache.get(key.toLowerCase());

      return {
        key,
        label: item?.label || key,
        icon: item?.icon,
        color: item?.color,
        hidden: false,
      };
    },
    [config, labelCache]
  );

  // 获取映射名
  const getLabel = useCallback(
    (key: string): string => {
      const item = labelCache.get(key) || labelCache.get(key.toLowerCase());
      return item?.label || key;
    },
    [labelCache]
  );

  // 获取图标
  const getIcon = useCallback(
    (key: string): string | undefined => {
      const item = labelCache.get(key) || labelCache.get(key.toLowerCase());
      return item?.icon;
    },
    [labelCache]
  );

  // 获取颜色
  const getColor = useCallback(
    (key: string): string | undefined => {
      const item = labelCache.get(key) || labelCache.get(key.toLowerCase());
      return item?.color;
    },
    [labelCache]
  );

  // 检查敏感字段
  const isHidden = useCallback(
    (key: string): boolean => {
      if (!config) return false;
      return config.hiddenFields.includes(key) || config.hiddenFields.includes(key.toLowerCase());
    },
    [config]
  );

  const value: LabelContextValue = {
    config,
    loading,
    error,
    resolveLabel,
    getLabel,
    getIcon,
    getColor,
    isHidden,
    refresh: loadConfig,
  };

  return <LabelContext.Provider value={value}>{children}</LabelContext.Provider>;
}

// ============================================================
// Hooks
// ============================================================

/**
 * 使用标签系统
 */
export function useLabels(): LabelContextValue {
  const context = useContext(LabelContext);
  if (!context) {
    throw new Error('useLabels must be used within a LabelProvider');
  }
  return context;
}

/**
 * 解析单个标签
 */
export function useLabel(key: string): ResolvedLabel {
  const { resolveLabel } = useLabels();
  return resolveLabel(key);
}

export default LabelProvider;
