/**
 * Display Config API - 显示配置 API 封装
 * 
 * Phase 3.5: 渲染分区系统
 */

const API_BASE = 'http://localhost:3000/api';

// ============================================================
// 类型定义
// ============================================================

/**
 * Hero Zone 配置
 */
export interface HeroZoneConfig {
  description: string;
  fields: string[];
  showStatusBadge: boolean;
}

/**
 * Body Zone 配置
 */
export interface BodyZoneConfig {
  description: string;
  exclude: string[];
  excludeMetadata: boolean;
}

/**
 * Footer Zone 配置
 */
export interface FooterZoneConfig {
  description: string;
  fields: string[];
  defaultCollapsed: boolean;
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
  version: string;
  zones: ZonesConfig;
  fieldZoneOverrides: Record<string, Partial<ZonesConfig>>;
  metadataFields: string[];
  systemFields: string[];
}

/**
 * 字段分类结果
 */
export interface CategorizedFields {
  heroFields: Array<{ key: string; value: unknown; source: 'machine' | 'frontmatter' }>;
  bodyFields: Array<{ key: string; value: unknown; source: 'machine' | 'frontmatter' }>;
  footerFields: Array<{ key: string; value: unknown; source: 'machine' | 'frontmatter' }>;
}

// ============================================================
// API 函数
// ============================================================

/**
 * 获取完整的显示配置
 */
export async function fetchDisplayConfig(): Promise<DisplayConfig> {
  const response = await fetch(`${API_BASE}/display-config`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch display config: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * 获取特定实体类型的分区配置
 */
export async function fetchZoneConfig(entityType: string): Promise<{
  entityType: string;
  zones: ZonesConfig;
}> {
  const response = await fetch(`${API_BASE}/display-config/${entityType}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch zone config: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * 对字段进行分区分类
 */
export async function categorizeFieldsApi(
  machineData: Record<string, unknown>,
  frontmatter: Record<string, unknown>,
  entityType?: string
): Promise<CategorizedFields> {
  const response = await fetch(`${API_BASE}/display-config/categorize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ machineData, frontmatter, entityType }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to categorize fields: ${response.statusText}`);
  }
  
  return response.json();
}

// ============================================================
// 本地分类函数（前端使用，避免每次都请求后端）
// ============================================================

/**
 * 本地字段分类（使用缓存的配置）
 */
export function categorizeFieldsLocal(
  machineData: Record<string, unknown>,
  frontmatter: Record<string, unknown>,
  config: DisplayConfig,
  entityType?: string
): CategorizedFields {
  // 获取适用的分区配置
  const zones = entityType && config.fieldZoneOverrides[entityType]
    ? mergeZoneConfig(config.zones, config.fieldZoneOverrides[entityType])
    : config.zones;
  
  const heroFields: CategorizedFields['heroFields'] = [];
  const bodyFields: CategorizedFields['bodyFields'] = [];
  const footerFields: CategorizedFields['footerFields'] = [];
  
  const heroFieldSet = new Set(zones.hero.fields);
  const footerFieldSet = new Set(zones.footer.fields);
  
  // 1. Hero 字段（从 machine）
  for (const key of zones.hero.fields) {
    if (machineData[key] !== undefined) {
      heroFields.push({ key, value: machineData[key], source: 'machine' });
    }
  }
  
  // 2. Footer 字段（从 frontmatter）
  for (const key of zones.footer.fields) {
    if (frontmatter[key] !== undefined) {
      footerFields.push({ key, value: frontmatter[key], source: 'frontmatter' });
    }
  }
  
  // 3. Body 字段（排除 Hero、Footer 和系统字段）
  for (const [key, value] of Object.entries(machineData)) {
    if (
      !heroFieldSet.has(key) &&
      !footerFieldSet.has(key) &&
      !shouldExcludeLocal(key, zones, config)
    ) {
      bodyFields.push({ key, value, source: 'machine' });
    }
  }
  
  return { heroFields, bodyFields, footerFields };
}

/**
 * 合并分区配置
 */
function mergeZoneConfig(
  base: ZonesConfig,
  override: Partial<ZonesConfig>
): ZonesConfig {
  return {
    hero: { ...base.hero, ...override.hero },
    body: { ...base.body, ...override.body },
    footer: { ...base.footer, ...override.footer },
  };
}

/**
 * 检查字段是否应该从 Body 排除
 */
function shouldExcludeLocal(
  fieldName: string,
  zones: ZonesConfig,
  config: DisplayConfig
): boolean {
  // 系统字段
  if (config.systemFields.includes(fieldName)) {
    return true;
  }
  
  // 以 _ 或 $ 开头
  if (fieldName.startsWith('_') || fieldName.startsWith('$')) {
    return true;
  }
  
  // 在排除列表中
  if (zones.body.exclude.includes(fieldName)) {
    return true;
  }
  
  // 排除元数据字段
  if (zones.body.excludeMetadata && config.metadataFields.includes(fieldName)) {
    return true;
  }
  
  return false;
}

/**
 * 检查字段是否为元数据字段
 */
export function isMetadataField(fieldName: string, config: DisplayConfig): boolean {
  return config.metadataFields.includes(fieldName);
}

/**
 * 检查字段是否为系统字段
 */
export function isSystemField(fieldName: string, config: DisplayConfig): boolean {
  return (
    config.systemFields.includes(fieldName) ||
    fieldName.startsWith('_') ||
    fieldName.startsWith('$')
  );
}

