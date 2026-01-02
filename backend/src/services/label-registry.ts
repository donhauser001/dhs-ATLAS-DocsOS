/**
 * LabelRegistry - 注册制标签系统
 * 
 * Phase 3.3+: 用户友好型标签映射
 * 
 * 核心概念：
 * 1. 用户在 system/labels.md 中注册标签名和图标
 * 2. 在编写文档时，直接使用注册的中文标签名
 * 3. 系统渲染时自动识别并显示对应图标
 * 4. 标签名后加 ! 可隐藏图标
 * 
 * 「文档即系统」：标签定义存储在文档中，用户可直接编辑
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config, ensureDirectories } from '../config.js';
import { parseADL } from '../adl/parser.js';

// ============================================================
// 类型定义
// ============================================================

/**
 * 单个标签定义
 */
export interface LabelDefinition {
  /** 图标名称（Lucide Icons） */
  icon?: string;
  /** 颜色（用于状态等） */
  color?: string;
  /** 别名列表（英文名等） */
  aliases?: string[];
}

/**
 * 标签注册表
 */
export interface LabelRegistry {
  /** 版本 */
  version: string;
  /** 生成时间 */
  generated_at: string;
  /** 标签映射（标签名 -> 定义） */
  labels: Record<string, LabelDefinition>;
  /** 别名索引（别名 -> 标签名） */
  aliasIndex: Record<string, string>;
  /** 敏感字段列表 */
  hiddenFields: string[];
}

// ============================================================
// 常量
// ============================================================

const LABELS_DOC_PATH = 'system/labels.md';
const LABELS_CACHE_PATH = join(config.atlasDataDir, 'labels.json');

// ============================================================
// 内存缓存
// ============================================================

let cachedLabels: LabelRegistry | null = null;

// ============================================================
// 服务实现
// ============================================================

/**
 * 获取标签注册表
 */
export async function getLabelRegistry(): Promise<LabelRegistry> {
  // 内存缓存
  if (cachedLabels) {
    return cachedLabels;
  }

  ensureDirectories();

  // 文件缓存
  if (existsSync(LABELS_CACHE_PATH)) {
    try {
      const cached = JSON.parse(readFileSync(LABELS_CACHE_PATH, 'utf-8')) as LabelRegistry;
      cachedLabels = cached;
      return cached;
    } catch {
      // 缓存损坏，重建
    }
  }

  // 重建
  return rebuildLabelRegistry();
}

/**
 * 重建标签注册表
 */
export async function rebuildLabelRegistry(): Promise<LabelRegistry> {
  ensureDirectories();

  const fullPath = join(config.repositoryRoot, LABELS_DOC_PATH);

  // 默认标签
  const defaultRegistry: LabelRegistry = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    labels: {
      '状态': { icon: 'activity' },
      '标题': { icon: 'heading' },
      '描述': { icon: 'align-left' },
    },
    aliasIndex: {
      'status': '状态',
      'title': '标题',
      'description': '描述',
    },
    hiddenFields: ['password_hash', 'auth'],
  };

  if (!existsSync(fullPath)) {
    console.warn('[LabelRegistry] labels.md not found, using defaults');
    cachedLabels = defaultRegistry;
    writeFileSync(LABELS_CACHE_PATH, JSON.stringify(defaultRegistry, null, 2), 'utf-8');
    return defaultRegistry;
  }

  try {
    const content = readFileSync(fullPath, 'utf-8');
    const doc = parseADL(content, LABELS_DOC_PATH);

    // 查找 label_registry block
    const registryBlock = doc.blocks.find(b => b.machine?.type === 'label_registry');
    if (!registryBlock) {
      console.warn('[LabelRegistry] No label_registry block found, using defaults');
      cachedLabels = defaultRegistry;
      writeFileSync(LABELS_CACHE_PATH, JSON.stringify(defaultRegistry, null, 2), 'utf-8');
      return defaultRegistry;
    }

    const machine = registryBlock.machine;
    const rawLabels = machine.labels as Record<string, LabelDefinition> || {};
    const hiddenFields = machine.hidden_fields as string[] || [];

    // 构建标签映射和别名索引
    const labels: Record<string, LabelDefinition> = {};
    const aliasIndex: Record<string, string> = {};

    for (const [labelName, def] of Object.entries(rawLabels)) {
      labels[labelName] = {
        icon: def.icon,
        color: def.color,
        aliases: def.aliases,
      };

      // 建立别名索引
      if (def.aliases) {
        for (const alias of def.aliases) {
          aliasIndex[alias] = labelName;
          aliasIndex[alias.toLowerCase()] = labelName;
        }
      }

      // 标签名本身也加入索引（用于反向查找）
      aliasIndex[labelName] = labelName;
    }

    const registry: LabelRegistry = {
      version: '1.0',
      generated_at: new Date().toISOString(),
      labels,
      aliasIndex,
      hiddenFields,
    };

    // 写入缓存
    writeFileSync(LABELS_CACHE_PATH, JSON.stringify(registry, null, 2), 'utf-8');
    cachedLabels = registry;

    console.log(`[LabelRegistry] Rebuilt: ${Object.keys(labels).length} labels, ${Object.keys(aliasIndex).length} aliases`);

    return registry;
  } catch (error) {
    console.error('[LabelRegistry] Failed to parse labels.md:', error);
    cachedLabels = defaultRegistry;
    writeFileSync(LABELS_CACHE_PATH, JSON.stringify(defaultRegistry, null, 2), 'utf-8');
    return defaultRegistry;
  }
}

/**
 * 获取标签定义
 * 
 * 支持：
 * - 直接使用标签名（如 "项目名称"）
 * - 使用别名（如 "project_name"）
 * - 标签名后加 ! 表示隐藏图标
 * 
 * @returns { label: 显示名, icon: 图标名, hideIcon: 是否隐藏图标 } 或 null
 */
export async function getLabel(fieldName: string): Promise<{
  label: string;
  icon?: string;
  color?: string;
  hideIcon: boolean;
} | null> {
  const registry = await getLabelRegistry();

  // 检查是否有 ! 后缀（隐藏图标标记）
  const hideIcon = fieldName.endsWith('!');
  const cleanName = hideIcon ? fieldName.slice(0, -1) : fieldName;

  // 1. 直接查找标签名
  if (registry.labels[cleanName]) {
    const def = registry.labels[cleanName];
    return {
      label: cleanName,
      icon: hideIcon ? undefined : def.icon,
      color: def.color,
      hideIcon,
    };
  }

  // 2. 通过别名查找
  const labelName = registry.aliasIndex[cleanName] || registry.aliasIndex[cleanName.toLowerCase()];
  if (labelName && registry.labels[labelName]) {
    const def = registry.labels[labelName];
    return {
      label: labelName,  // 返回注册的标签名
      icon: hideIcon ? undefined : def.icon,
      color: def.color,
      hideIcon,
    };
  }

  // 3. 未找到，返回原字段名
  return {
    label: cleanName,
    icon: undefined,
    color: undefined,
    hideIcon,
  };
}

/**
 * 批量获取标签定义
 */
export async function getLabels(fieldNames: string[]): Promise<Record<string, {
  label: string;
  icon?: string;
  color?: string;
  hideIcon: boolean;
}>> {
  const result: Record<string, {
    label: string;
    icon?: string;
    color?: string;
    hideIcon: boolean;
  }> = {};

  for (const fieldName of fieldNames) {
    const labelInfo = await getLabel(fieldName);
    if (labelInfo) {
      result[fieldName] = labelInfo;
    }
  }

  return result;
}

/**
 * 检查字段是否应该隐藏
 */
export async function isHiddenField(fieldName: string): Promise<boolean> {
  const registry = await getLabelRegistry();
  const cleanName = fieldName.endsWith('!') ? fieldName.slice(0, -1) : fieldName;
  return registry.hiddenFields.includes(cleanName);
}

/**
 * 清除缓存
 */
export function clearLabelCache(): void {
  cachedLabels = null;
}

export default {
  getLabelRegistry,
  rebuildLabelRegistry,
  getLabel,
  getLabels,
  isHiddenField,
  clearLabelCache,
};
