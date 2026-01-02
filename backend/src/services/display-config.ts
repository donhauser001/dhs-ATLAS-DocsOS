/**
 * DisplayConfigService - 显示配置服务
 * 
 * Phase 3.5: 渲染分区系统
 * 
 * 职责：
 * 1. 管理字段分区配置（Hero / Body / Footer）
 * 2. 提供分区查询接口
 * 3. 支持按实体类型覆盖配置
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config, ensureDirectories } from '../config.js';

// ============================================================
// 类型定义
// ============================================================

/**
 * Hero Zone 配置
 */
export interface HeroZoneConfig {
  /** 描述 */
  description: string;
  /** 显示的字段 */
  fields: string[];
  /** 是否显示状态徽章 */
  showStatusBadge: boolean;
}

/**
 * Body Zone 配置
 */
export interface BodyZoneConfig {
  /** 描述 */
  description: string;
  /** 排除的字段 */
  exclude: string[];
  /** 是否排除元数据字段 */
  excludeMetadata: boolean;
}

/**
 * Footer Zone 配置
 */
export interface FooterZoneConfig {
  /** 描述 */
  description: string;
  /** 显示的字段 */
  fields: string[];
  /** 默认是否折叠 */
  defaultCollapsed: boolean;
  /** 是否显示折叠按钮 */
  showToggle: boolean;
}

/**
 * Zone 配置集合
 */
export interface ZonesConfig {
  hero: HeroZoneConfig;
  body: BodyZoneConfig;
  footer: FooterZoneConfig;
}

/**
 * 显示配置
 */
export interface DisplayConfig {
  /** 版本 */
  version: string;
  /** 分区配置 */
  zones: ZonesConfig;
  /** 按实体类型覆盖的配置 */
  fieldZoneOverrides: Record<string, Partial<ZonesConfig>>;
  /** 元数据字段列表（用于判断字段是否为元数据） */
  metadataFields: string[];
  /** 系统字段列表（始终隐藏） */
  systemFields: string[];
}

/**
 * 字段分类结果
 */
export interface CategorizedFields {
  /** Hero Zone 字段 */
  heroFields: Array<{ key: string; value: unknown; source: 'machine' | 'frontmatter' }>;
  /** Body Zone 字段 */
  bodyFields: Array<{ key: string; value: unknown; source: 'machine' | 'frontmatter' }>;
  /** Footer Zone 字段 */
  footerFields: Array<{ key: string; value: unknown; source: 'machine' | 'frontmatter' }>;
}

// ============================================================
// 默认配置
// ============================================================

const DEFAULT_DISPLAY_CONFIG: DisplayConfig = {
  version: '1.0',
  zones: {
    hero: {
      description: '标题区，显示核心身份信息',
      fields: ['title', 'display_name', 'status'],
      showStatusBadge: true,
    },
    body: {
      description: '主体区，显示业务字段',
      exclude: ['type', 'id', 'status', 'title', 'display_name', '$display', '_*'],
      excludeMetadata: true,
    },
    footer: {
      description: '底部区，显示文档元数据',
      fields: ['created', 'updated', 'author', 'version', 'document_type'],
      defaultCollapsed: true,
      showToggle: true,
    },
  },
  fieldZoneOverrides: {
    // 客户类型的特殊配置
    client: {
      footer: {
        description: '客户底部区',
        fields: ['created', 'updated', 'author', 'version', 'contract_date', 'last_contact'],
        defaultCollapsed: true,
        showToggle: true,
      },
    },
    // 项目类型的特殊配置
    project: {
      hero: {
        description: '项目标题区',
        fields: ['title', 'status', 'priority'],
        showStatusBadge: true,
      },
    },
  },
  metadataFields: [
    'version',
    'document_type',
    'created',
    'updated',
    'author',
    'atlas',
  ],
  systemFields: [
    '_checksum',
    '_indexed_at',
    '_source_hash',
    '$display',
  ],
};

// ============================================================
// 缓存
// ============================================================

let cachedConfig: DisplayConfig | null = null;

// ============================================================
// 服务实现
// ============================================================

/**
 * 获取配置文件路径
 */
function getConfigPath(): string {
  return join(config.atlasDataDir, 'config', 'display.json');
}

/**
 * 获取显示配置
 */
export function getDisplayConfig(): DisplayConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  
  const configPath = getConfigPath();
  
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      const loadedConfig: DisplayConfig = { ...DEFAULT_DISPLAY_CONFIG, ...JSON.parse(content) };
      cachedConfig = loadedConfig;
      return loadedConfig;
    } catch (error) {
      console.error('[DisplayConfig] Failed to load config:', error);
    }
  }
  
  // 使用默认配置
  cachedConfig = DEFAULT_DISPLAY_CONFIG;
  return DEFAULT_DISPLAY_CONFIG;
}

/**
 * 保存显示配置
 */
export function saveDisplayConfig(newConfig: Partial<DisplayConfig>): void {
  ensureDirectories();
  
  const configPath = getConfigPath();
  const mergedConfig = { ...getDisplayConfig(), ...newConfig };
  
  writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2), 'utf-8');
  cachedConfig = mergedConfig;
}

/**
 * 初始化默认配置文件
 */
export function initDisplayConfig(): void {
  ensureDirectories();
  
  const configPath = getConfigPath();
  if (!existsSync(configPath)) {
    writeFileSync(configPath, JSON.stringify(DEFAULT_DISPLAY_CONFIG, null, 2), 'utf-8');
    console.log('[DisplayConfig] Created default config file');
  }
}

/**
 * 获取特定实体类型的分区配置
 * 
 * @param entityType - 实体类型（如 'client', 'project'）
 * @returns 合并后的分区配置
 */
export function getZoneConfigForType(entityType?: string): ZonesConfig {
  const baseConfig = getDisplayConfig();
  
  if (!entityType || !baseConfig.fieldZoneOverrides[entityType]) {
    return baseConfig.zones;
  }
  
  // 深度合并覆盖配置
  const override = baseConfig.fieldZoneOverrides[entityType];
  
  return {
    hero: { ...baseConfig.zones.hero, ...override.hero },
    body: { ...baseConfig.zones.body, ...override.body },
    footer: { ...baseConfig.zones.footer, ...override.footer },
  };
}

/**
 * 检查字段是否为元数据字段
 */
export function isMetadataField(fieldName: string): boolean {
  const config = getDisplayConfig();
  return config.metadataFields.includes(fieldName);
}

/**
 * 检查字段是否为系统字段（应该隐藏）
 */
export function isSystemField(fieldName: string): boolean {
  const config = getDisplayConfig();
  
  // 精确匹配
  if (config.systemFields.includes(fieldName)) {
    return true;
  }
  
  // 通配符匹配（_* 表示以 _ 开头的字段）
  if (config.systemFields.includes('_*') && fieldName.startsWith('_')) {
    return true;
  }
  
  // $ 开头的字段是系统命名空间
  if (fieldName.startsWith('$')) {
    return true;
  }
  
  return false;
}

/**
 * 检查字段是否应该排除在 Body Zone 之外
 */
export function shouldExcludeFromBody(
  fieldName: string,
  entityType?: string
): boolean {
  const zoneConfig = getZoneConfigForType(entityType);
  const displayConfig = getDisplayConfig();
  
  // 系统字段始终排除
  if (isSystemField(fieldName)) {
    return true;
  }
  
  // 检查排除列表
  for (const pattern of zoneConfig.body.exclude) {
    if (pattern === fieldName) {
      return true;
    }
    
    // 通配符匹配
    if (pattern === '_*' && fieldName.startsWith('_')) {
      return true;
    }
    if (pattern === '$*' && fieldName.startsWith('$')) {
      return true;
    }
  }
  
  // 如果配置为排除元数据字段
  if (zoneConfig.body.excludeMetadata && displayConfig.metadataFields.includes(fieldName)) {
    return true;
  }
  
  return false;
}

/**
 * 分类字段到各个区域
 * 
 * @param machineData - Block 的 machine zone 数据
 * @param frontmatter - 文档的 frontmatter
 * @param entityType - 实体类型
 * @returns 分类后的字段
 */
export function categorizeFields(
  machineData: Record<string, unknown>,
  frontmatter: Record<string, unknown>,
  entityType?: string
): CategorizedFields {
  const zoneConfig = getZoneConfigForType(entityType);
  
  const heroFields: CategorizedFields['heroFields'] = [];
  const bodyFields: CategorizedFields['bodyFields'] = [];
  const footerFields: CategorizedFields['footerFields'] = [];
  
  const heroFieldSet = new Set(zoneConfig.hero.fields);
  const footerFieldSet = new Set(zoneConfig.footer.fields);
  
  // 1. 从 machine data 提取 Hero 字段
  for (const key of zoneConfig.hero.fields) {
    if (machineData[key] !== undefined) {
      heroFields.push({ key, value: machineData[key], source: 'machine' });
    }
  }
  
  // 2. 从 frontmatter 提取 Footer 字段
  for (const key of zoneConfig.footer.fields) {
    if (frontmatter[key] !== undefined) {
      footerFields.push({ key, value: frontmatter[key], source: 'frontmatter' });
    }
  }
  
  // 3. 其余字段放入 Body（排除 Hero、Footer 和系统字段）
  for (const [key, value] of Object.entries(machineData)) {
    if (
      !heroFieldSet.has(key) &&
      !footerFieldSet.has(key) &&
      !shouldExcludeFromBody(key, entityType)
    ) {
      bodyFields.push({ key, value, source: 'machine' });
    }
  }
  
  return { heroFields, bodyFields, footerFields };
}

/**
 * 清除配置缓存
 */
export function clearDisplayConfigCache(): void {
  cachedConfig = null;
}

/**
 * 获取默认配置（用于重置）
 */
export function getDefaultDisplayConfig(): DisplayConfig {
  return { ...DEFAULT_DISPLAY_CONFIG };
}

