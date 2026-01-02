/**
 * FixedKeysService - 固定键管理服务
 * 
 * Phase 3.5: 固定键系统
 * 
 * 职责：
 * 1. 定义固定键规范（Structural / Metadata / Function / System）
 * 2. 验证固定键完整性
 * 3. 提供固定键配置查询
 */

import type { Block, ADLDocument, AtlasFrontmatter } from '../adl/types.js';

// ============================================================
// 类型定义
// ============================================================

/**
 * 固定键配置
 */
export interface FixedKeyConfig {
  /** 是否必填 */
  required: boolean;
  /** 是否可自动生成 */
  autoGenerate: boolean;
  /** 默认值 */
  default?: unknown;
  /** 是否不可变（首次设置后不可修改） */
  immutable?: boolean;
  /** 描述 */
  description?: string;
}

/**
 * 固定键类别
 */
export type FixedKeyCategory = 'structural' | 'metadata' | 'function' | 'system';

/**
 * 固定键验证结果
 */
export interface FixedKeyValidationResult {
  valid: boolean;
  errors: FixedKeyValidationError[];
  warnings: FixedKeyValidationWarning[];
}

/**
 * 固定键验证错误
 */
export interface FixedKeyValidationError {
  category: FixedKeyCategory;
  key: string;
  message: string;
  location?: {
    block?: string;
    field?: string;
  };
}

/**
 * 固定键验证警告
 */
export interface FixedKeyValidationWarning {
  category: FixedKeyCategory;
  key: string;
  message: string;
  suggestion?: string;
  location?: {
    block?: string;
    field?: string;
  };
}

// ============================================================
// 固定键定义
// ============================================================

/**
 * 结构键（Block 级别，存在于 machine zone）
 */
export const STRUCTURAL_KEYS: Record<string, FixedKeyConfig> = {
  type: {
    required: true,
    autoGenerate: false,
    description: 'Block 类型，必须由用户指定',
  },
  id: {
    required: true,
    autoGenerate: true,
    description: '唯一标识，可基于 type + title 自动生成',
  },
  status: {
    required: true,
    autoGenerate: true,
    default: 'active',
    description: '状态，默认为 active',
  },
};

/**
 * 元数据键（Document 级别，存在于 frontmatter）
 */
export const METADATA_KEYS: Record<string, FixedKeyConfig> = {
  version: {
    required: false,
    autoGenerate: true,
    default: '1.0',
    description: '文档版本',
  },
  document_type: {
    required: false,
    autoGenerate: true,
    description: '文档类型，可基于 atlas.function 自动推断',
  },
  created: {
    required: false,
    autoGenerate: true,
    immutable: true,
    description: '创建时间，首次索引时自动生成',
  },
  updated: {
    required: false,
    autoGenerate: true,
    description: '更新时间，每次 Proposal 执行时自动更新',
  },
  author: {
    required: false,
    autoGenerate: true,
    description: '作者，首次索引时自动填充当前用户',
  },
};

/**
 * 功能键（Document 级别，存在于 frontmatter.atlas）
 */
export const FUNCTION_KEYS: Record<string, FixedKeyConfig> = {
  'atlas.function': {
    required: false,
    autoGenerate: true,
    description: '功能身份，可基于 Block type 自动推断',
  },
  'atlas.entity_type': {
    required: false,
    autoGenerate: false,
    description: '实体类型，当 function 为 entity_list 时使用',
  },
  'atlas.capabilities': {
    required: false,
    autoGenerate: false,
    description: '能力标签数组',
  },
  'atlas.navigation': {
    required: false,
    autoGenerate: false,
    description: '导航配置',
  },
};

/**
 * 系统键（仅系统使用，不存储在文档中，存在于索引）
 */
export const SYSTEM_KEYS: string[] = [
  '_checksum',      // 内容校验和
  '_indexed_at',    // 索引时间
  '_source_hash',   // 源文件哈希
];

/**
 * 所有固定键定义
 */
export const FIXED_KEYS = {
  structural: STRUCTURAL_KEYS,
  metadata: METADATA_KEYS,
  function: FUNCTION_KEYS,
  system: SYSTEM_KEYS,
} as const;

// ============================================================
// 类型前缀映射（用于 ID 生成）
// ============================================================

/**
 * 类型前缀映射
 * 用于基于 type 生成 ID 前缀
 */
export const TYPE_PREFIX_MAP: Record<string, string> = {
  principal: 'u',
  profile: 'p',
  client: 'c',
  project: 'proj',
  service: 'svc',
  category: 'cat',
  config: 'cfg',
  registry: 'reg',
  directory_index: 'list',
  entity_index: 'idx',
};

/**
 * 功能类型到文档类型的映射
 */
export const FUNCTION_TO_DOCTYPE_MAP: Record<string, string> = {
  principal: 'facts',
  client: 'facts',
  project: 'project',
  config: 'system',
  registry: 'system',
  entity_list: 'navigation',
  entity_detail: 'facts',
  dashboard: 'navigation',
};

/**
 * Block 类型到功能类型的映射
 */
export const TYPE_TO_FUNCTION_MAP: Record<string, string> = {
  principal: 'principal',
  client: 'client',
  project: 'project',
  service: 'service',
  category: 'category',
  config: 'config',
  registry: 'registry',
  directory_index: 'entity_list',
  entity_index: 'entity_list',
};

// ============================================================
// 验证函数
// ============================================================

/**
 * 验证 Block 的结构键
 */
export function validateStructuralKeys(block: Block): FixedKeyValidationResult {
  const errors: FixedKeyValidationError[] = [];
  const warnings: FixedKeyValidationWarning[] = [];
  const machine = block.machine;

  for (const [key, config] of Object.entries(STRUCTURAL_KEYS)) {
    const value = machine[key];

    if (config.required && (value === undefined || value === null || value === '')) {
      if (config.autoGenerate) {
        // 可自动生成的必填字段，作为警告
        warnings.push({
          category: 'structural',
          key,
          message: `结构键 "${key}" 缺失，将自动生成`,
          suggestion: config.default !== undefined 
            ? `默认值: ${config.default}` 
            : '基于上下文自动生成',
          location: { block: block.anchor, field: key },
        });
      } else {
        // 不可自动生成的必填字段，作为错误
        errors.push({
          category: 'structural',
          key,
          message: `缺少必填结构键: ${key}`,
          location: { block: block.anchor, field: key },
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 验证 Document 的元数据键
 */
export function validateMetadataKeys(doc: ADLDocument): FixedKeyValidationResult {
  const errors: FixedKeyValidationError[] = [];
  const warnings: FixedKeyValidationWarning[] = [];
  const frontmatter = doc.frontmatter || {};

  for (const [key, config] of Object.entries(METADATA_KEYS)) {
    const value = frontmatter[key];

    if (config.required && (value === undefined || value === null || value === '')) {
      if (config.autoGenerate) {
        warnings.push({
          category: 'metadata',
          key,
          message: `元数据键 "${key}" 缺失，将自动生成`,
          suggestion: config.default !== undefined 
            ? `默认值: ${config.default}` 
            : '基于上下文自动生成',
          location: { field: key },
        });
      } else {
        errors.push({
          category: 'metadata',
          key,
          message: `缺少必填元数据键: ${key}`,
          location: { field: key },
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 验证 Document 的功能键
 */
export function validateFunctionKeys(doc: ADLDocument): FixedKeyValidationResult {
  const errors: FixedKeyValidationError[] = [];
  const warnings: FixedKeyValidationWarning[] = [];
  const atlas = doc.atlas;

  // 如果没有 atlas 声明，不作为错误
  if (!atlas) {
    return { valid: true, errors, warnings };
  }

  // entity_list 功能应该有 entity_type
  if (atlas.function === 'entity_list' && !atlas.entity_type) {
    warnings.push({
      category: 'function',
      key: 'atlas.entity_type',
      message: 'entity_list 功能建议指定 entity_type',
      suggestion: '添加 atlas.entity_type 以指定列表包含的实体类型',
      location: { field: 'atlas.entity_type' },
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 验证整个文档的固定键
 */
export function validateFixedKeys(doc: ADLDocument): FixedKeyValidationResult {
  const allErrors: FixedKeyValidationError[] = [];
  const allWarnings: FixedKeyValidationWarning[] = [];

  // 验证元数据键
  const metadataResult = validateMetadataKeys(doc);
  allErrors.push(...metadataResult.errors);
  allWarnings.push(...metadataResult.warnings);

  // 验证功能键
  const functionResult = validateFunctionKeys(doc);
  allErrors.push(...functionResult.errors);
  allWarnings.push(...functionResult.warnings);

  // 验证每个 Block 的结构键
  for (const block of doc.blocks) {
    const structuralResult = validateStructuralKeys(block);
    allErrors.push(...structuralResult.errors);
    allWarnings.push(...structuralResult.warnings);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 获取某类固定键的所有键名
 */
export function getFixedKeyNames(category: FixedKeyCategory): string[] {
  switch (category) {
    case 'structural':
      return Object.keys(STRUCTURAL_KEYS);
    case 'metadata':
      return Object.keys(METADATA_KEYS);
    case 'function':
      return Object.keys(FUNCTION_KEYS);
    case 'system':
      return [...SYSTEM_KEYS];
    default:
      return [];
  }
}

/**
 * 检查键是否为固定键
 */
export function isFixedKey(key: string): boolean {
  return (
    key in STRUCTURAL_KEYS ||
    key in METADATA_KEYS ||
    key in FUNCTION_KEYS ||
    SYSTEM_KEYS.includes(key)
  );
}

/**
 * 获取固定键的类别
 */
export function getFixedKeyCategory(key: string): FixedKeyCategory | null {
  if (key in STRUCTURAL_KEYS) return 'structural';
  if (key in METADATA_KEYS) return 'metadata';
  if (key in FUNCTION_KEYS) return 'function';
  if (SYSTEM_KEYS.includes(key)) return 'system';
  return null;
}

/**
 * 获取固定键的配置
 */
export function getFixedKeyConfig(key: string): FixedKeyConfig | null {
  if (key in STRUCTURAL_KEYS) return STRUCTURAL_KEYS[key];
  if (key in METADATA_KEYS) return METADATA_KEYS[key];
  if (key in FUNCTION_KEYS) return FUNCTION_KEYS[key];
  return null;
}

/**
 * 检查字段是否可以自动生成
 */
export function canAutoGenerate(key: string): boolean {
  const config = getFixedKeyConfig(key);
  return config?.autoGenerate ?? false;
}

/**
 * 检查字段是否不可变
 */
export function isImmutable(key: string): boolean {
  const config = getFixedKeyConfig(key);
  return config?.immutable ?? false;
}

/**
 * 获取字段的默认值
 */
export function getDefaultValue(key: string): unknown {
  const config = getFixedKeyConfig(key);
  return config?.default;
}

/**
 * 基于 Block type 推断功能类型
 */
export function inferFunctionFromType(type: string): string | undefined {
  return TYPE_TO_FUNCTION_MAP[type];
}

/**
 * 基于功能类型推断文档类型
 */
export function inferDocTypeFromFunction(functionType: string): string {
  return FUNCTION_TO_DOCTYPE_MAP[functionType] || 'facts';
}

/**
 * 获取类型前缀
 */
export function getTypePrefix(type: string): string {
  return TYPE_PREFIX_MAP[type] || type.substring(0, 3);
}

/**
 * 获取所有需要自动补齐的字段
 */
export function getAutoGeneratableFields(): {
  structural: string[];
  metadata: string[];
  function: string[];
} {
  const structural = Object.entries(STRUCTURAL_KEYS)
    .filter(([, config]) => config.autoGenerate)
    .map(([key]) => key);

  const metadata = Object.entries(METADATA_KEYS)
    .filter(([, config]) => config.autoGenerate)
    .map(([key]) => key);

  const functionKeys = Object.entries(FUNCTION_KEYS)
    .filter(([, config]) => config.autoGenerate)
    .map(([key]) => key);

  return { structural, metadata, function: functionKeys };
}

/**
 * 检测文档中缺失的可自动生成字段
 */
export function detectMissingAutoFields(doc: ADLDocument): {
  frontmatter: string[];
  blocks: { anchor: string; fields: string[] }[];
} {
  const missingFrontmatter: string[] = [];
  const missingBlocks: { anchor: string; fields: string[] }[] = [];

  // 检查 frontmatter 元数据键
  for (const [key, config] of Object.entries(METADATA_KEYS)) {
    if (config.autoGenerate && (doc.frontmatter?.[key] === undefined)) {
      missingFrontmatter.push(key);
    }
  }

  // 检查 atlas 功能键
  if (!doc.atlas?.function) {
    // 检查是否可以自动推断
    const firstBlock = doc.blocks[0];
    if (firstBlock?.machine?.type && TYPE_TO_FUNCTION_MAP[firstBlock.machine.type]) {
      missingFrontmatter.push('atlas.function');
    }
  }

  // 检查每个 Block 的结构键
  for (const block of doc.blocks) {
    const missingFields: string[] = [];
    
    for (const [key, config] of Object.entries(STRUCTURAL_KEYS)) {
      if (config.autoGenerate && (block.machine?.[key] === undefined)) {
        missingFields.push(key);
      }
    }

    if (missingFields.length > 0) {
      missingBlocks.push({
        anchor: block.anchor,
        fields: missingFields,
      });
    }
  }

  return { frontmatter: missingFrontmatter, blocks: missingBlocks };
}

