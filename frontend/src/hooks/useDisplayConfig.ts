/**
 * useDisplayConfig - 显示配置 Hook
 * 
 * Phase 3.5: 渲染分区系统
 * 
 * 职责：
 * 1. 加载并缓存显示配置
 * 2. 提供字段分类功能
 * 3. 支持按实体类型获取配置
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchDisplayConfig,
  categorizeFieldsLocal,
  isMetadataField as isMetadataFieldCheck,
  isSystemField as isSystemFieldCheck,
  type DisplayConfig,
  type ZonesConfig,
  type CategorizedFields,
} from '@/api/display-config';

// ============================================================
// 类型导出
// ============================================================

export type { DisplayConfig, ZonesConfig, CategorizedFields };

// ============================================================
// 全局缓存
// ============================================================

let globalConfig: DisplayConfig | null = null;
let loadPromise: Promise<DisplayConfig> | null = null;

// ============================================================
// Hook 实现
// ============================================================

/**
 * 获取显示配置
 */
export function useDisplayConfig() {
  const [config, setConfig] = useState<DisplayConfig | null>(globalConfig);
  const [loading, setLoading] = useState(!globalConfig);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (globalConfig) {
      setConfig(globalConfig);
      setLoading(false);
      return;
    }
    
    // 避免重复加载
    if (!loadPromise) {
      loadPromise = fetchDisplayConfig();
    }
    
    loadPromise
      .then(data => {
        globalConfig = data;
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
        loadPromise = null;
      });
  }, []);
  
  return { config, loading, error };
}

/**
 * 获取特定实体类型的分区配置
 */
export function useZoneConfig(entityType?: string) {
  const { config, loading, error } = useDisplayConfig();
  
  const zones = useMemo(() => {
    if (!config) return null;
    
    if (!entityType || !config.fieldZoneOverrides[entityType]) {
      return config.zones;
    }
    
    // 合并配置
    const override = config.fieldZoneOverrides[entityType];
    return {
      hero: { ...config.zones.hero, ...override.hero },
      body: { ...config.zones.body, ...override.body },
      footer: { ...config.zones.footer, ...override.footer },
    };
  }, [config, entityType]);
  
  return { zones, loading, error };
}

/**
 * 字段分类 Hook
 */
export function useCategorizedFields(
  machineData: Record<string, unknown>,
  frontmatter: Record<string, unknown>,
  entityType?: string
): {
  categorized: CategorizedFields | null;
  loading: boolean;
  error: Error | null;
} {
  const { config, loading, error } = useDisplayConfig();
  
  const categorized = useMemo(() => {
    if (!config) return null;
    return categorizeFieldsLocal(machineData, frontmatter, config, entityType);
  }, [config, machineData, frontmatter, entityType]);
  
  return { categorized, loading, error };
}

/**
 * 字段类型检查 Hook
 */
export function useFieldChecks() {
  const { config } = useDisplayConfig();
  
  const isMetadataField = useCallback(
    (fieldName: string) => {
      if (!config) return false;
      return isMetadataFieldCheck(fieldName, config);
    },
    [config]
  );
  
  const isSystemField = useCallback(
    (fieldName: string) => {
      if (!config) return false;
      return isSystemFieldCheck(fieldName, config);
    },
    [config]
  );
  
  const shouldExclude = useCallback(
    (fieldName: string, entityType?: string) => {
      if (!config) return false;
      
      // 系统字段
      if (isSystemFieldCheck(fieldName, config)) {
        return true;
      }
      
      // 获取适用的分区配置
      const zones = entityType && config.fieldZoneOverrides[entityType]
        ? { ...config.zones.body, ...config.fieldZoneOverrides[entityType].body }
        : config.zones.body;
      
      // 在排除列表中
      if (zones.exclude?.includes(fieldName)) {
        return true;
      }
      
      // 排除元数据字段
      if (zones.excludeMetadata && isMetadataFieldCheck(fieldName, config)) {
        return true;
      }
      
      return false;
    },
    [config]
  );
  
  return {
    isMetadataField,
    isSystemField,
    shouldExclude,
    config,
  };
}

/**
 * 清除配置缓存（用于刷新）
 */
export function clearDisplayConfigCache(): void {
  globalConfig = null;
  loadPromise = null;
}

