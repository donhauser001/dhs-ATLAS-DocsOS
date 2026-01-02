/**
 * ID Generator - 标识符生成服务
 * 
 * Phase 3.5: 固定键系统
 * 
 * 职责：
 * 1. 基于 type + title/display_name 生成唯一 ID
 * 2. 支持中文拼音转换
 * 3. 确保 ID 唯一性
 */

import { pinyin } from 'pinyin-pro';
import type { Block } from '../adl/types.js';
import { TYPE_PREFIX_MAP, getTypePrefix } from './fixed-keys.js';

// ============================================================
// 类型定义
// ============================================================

/**
 * ID 生成选项
 */
export interface IdGeneratorOptions {
  /** 最大长度限制 */
  maxLength?: number;
  /** 已存在的 ID 集合（用于确保唯一性） */
  existingIds?: Set<string>;
  /** 是否使用完整拼音（默认 true） */
  fullPinyin?: boolean;
}

/**
 * ID 生成结果
 */
export interface IdGeneratorResult {
  /** 生成的 ID */
  id: string;
  /** 原始标题 */
  originalTitle: string;
  /** 类型前缀 */
  prefix: string;
  /** 生成的 slug */
  slug: string;
  /** 是否添加了数字后缀（因为冲突） */
  hasSuffix: boolean;
}

// ============================================================
// 常量
// ============================================================

/** 默认最大长度 */
const DEFAULT_MAX_LENGTH = 50;

/** slug 保留字（避免与系统关键字冲突） */
const RESERVED_SLUGS = new Set([
  'new',
  'edit',
  'delete',
  'create',
  'update',
  'list',
  'index',
  'admin',
  'system',
  'config',
  'settings',
  'api',
  'auth',
  'login',
  'logout',
]);

// ============================================================
// 核心函数
// ============================================================

/**
 * 从 Block 生成 ID
 * 
 * @param block - ADL Block
 * @param options - 生成选项
 * @returns 生成的 ID 结果
 */
export function generateIdFromBlock(
  block: Block,
  options: IdGeneratorOptions = {}
): IdGeneratorResult {
  const type = block.machine?.type || 'unknown';
  
  // 获取标题（优先级：title > display_name > heading）
  const title = extractTitle(block);
  
  return generateId(type, title, options);
}

/**
 * 从类型和标题生成 ID
 * 
 * @param type - Block 类型
 * @param title - 标题
 * @param options - 生成选项
 * @returns 生成的 ID 结果
 */
export function generateId(
  type: string,
  title: string,
  options: IdGeneratorOptions = {}
): IdGeneratorResult {
  const { maxLength = DEFAULT_MAX_LENGTH, existingIds, fullPinyin = true } = options;
  
  // 获取类型前缀
  const prefix = getTypePrefix(type);
  
  // 转换标题为 slug
  const slug = titleToSlug(title, {
    maxLength: maxLength - prefix.length - 1, // 减去前缀和连字符的长度
    fullPinyin,
  });
  
  // 生成基础 ID
  const baseId = `${prefix}-${slug}`;
  
  // 确保唯一性
  const { id, hasSuffix } = ensureUniqueId(baseId, existingIds);
  
  return {
    id,
    originalTitle: title,
    prefix,
    slug,
    hasSuffix,
  };
}

/**
 * 将标题转换为 slug
 * 
 * @param title - 标题
 * @param options - 转换选项
 * @returns slug 字符串
 */
export function titleToSlug(
  title: string,
  options: { maxLength?: number; fullPinyin?: boolean } = {}
): string {
  const { maxLength = DEFAULT_MAX_LENGTH, fullPinyin = true } = options;
  
  if (!title || title.trim() === '') {
    return 'unnamed';
  }
  
  // 1. 清理特殊字符（保留中文、字母、数字、空格）
  let cleaned = title
    .replace(/[#\[\](){}【】（）「」『』《》<>]/g, '')
    .replace(/[，。！？、；：""'']/g, ' ')
    .trim();
  
  // 2. 检测是否包含中文
  const hasChinese = /[\u4e00-\u9fa5]/.test(cleaned);
  
  if (hasChinese) {
    // 中文转拼音
    if (fullPinyin) {
      // 完整拼音模式
      cleaned = pinyin(cleaned, {
        toneType: 'none',
        type: 'array',
        nonZh: 'consecutive',
      }).join('-');
    } else {
      // 首字母模式（更短）
      cleaned = pinyin(cleaned, {
        pattern: 'first',
        toneType: 'none',
        type: 'array',
        nonZh: 'consecutive',
      }).join('');
    }
  }
  
  // 3. 转换为 kebab-case
  let slug = cleaned
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // 非字母数字转为连字符
    .replace(/^-+|-+$/g, '')       // 去除首尾连字符
    .replace(/-{2,}/g, '-');       // 合并多个连字符
  
  // 4. 处理保留字
  if (RESERVED_SLUGS.has(slug)) {
    slug = `${slug}-item`;
  }
  
  // 5. 限制长度
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // 确保不以连字符结尾
    slug = slug.replace(/-+$/, '');
  }
  
  // 6. 确保有效
  if (!slug || slug === '-') {
    return 'unnamed';
  }
  
  return slug;
}

/**
 * 确保 ID 唯一性
 * 
 * @param baseId - 基础 ID
 * @param existingIds - 已存在的 ID 集合
 * @returns 唯一的 ID
 */
export function ensureUniqueId(
  baseId: string,
  existingIds?: Set<string>
): { id: string; hasSuffix: boolean } {
  if (!existingIds || !existingIds.has(baseId)) {
    return { id: baseId, hasSuffix: false };
  }
  
  // 添加数字后缀
  let counter = 1;
  let candidateId = `${baseId}-${counter}`;
  
  while (existingIds.has(candidateId)) {
    counter++;
    candidateId = `${baseId}-${counter}`;
    
    // 安全限制，防止无限循环
    if (counter > 9999) {
      // 使用时间戳作为后缀
      candidateId = `${baseId}-${Date.now()}`;
      break;
    }
  }
  
  return { id: candidateId, hasSuffix: true };
}

/**
 * 从 Block 提取标题
 */
export function extractTitle(block: Block): string {
  const machine = block.machine || {};
  
  // 优先级：title > display_name > heading（清理 Markdown 语法）
  if (typeof machine.title === 'string' && machine.title.trim()) {
    return machine.title.trim();
  }
  
  if (typeof machine.display_name === 'string' && machine.display_name.trim()) {
    return machine.display_name.trim();
  }
  
  // 从 heading 提取（移除 Markdown 语法和 anchor）
  if (block.heading) {
    return block.heading
      .replace(/^#+\s*/, '')           // 移除 # 标记
      .replace(/\s*\{#[\w-]+\}\s*$/, '') // 移除 {#anchor}
      .trim();
  }
  
  return '';
}

/**
 * 验证 ID 格式是否有效
 * 
 * @param id - 要验证的 ID
 * @returns 是否有效
 */
export function isValidId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // ID 格式：prefix-slug 或 prefix-slug-number
  // 只允许小写字母、数字和连字符
  const idPattern = /^[a-z][a-z0-9]*-[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  
  // 至少包含一个前缀和一个 slug 部分
  if (id.length < 3) {
    return false;
  }
  
  // 不能以连字符开头或结尾
  if (id.startsWith('-') || id.endsWith('-')) {
    return false;
  }
  
  // 不能有连续的连字符
  if (id.includes('--')) {
    return false;
  }
  
  // 检查格式
  return /^[a-z0-9-]+$/.test(id) && id.includes('-');
}

/**
 * 解析 ID 的各部分
 * 
 * @param id - ID 字符串
 * @returns 解析结果
 */
export function parseId(id: string): {
  prefix: string;
  slug: string;
  suffix?: number;
} | null {
  if (!isValidId(id)) {
    return null;
  }
  
  const parts = id.split('-');
  if (parts.length < 2) {
    return null;
  }
  
  const prefix = parts[0];
  
  // 检查最后一部分是否是数字后缀
  const lastPart = parts[parts.length - 1];
  const isNumericSuffix = /^\d+$/.test(lastPart);
  
  if (isNumericSuffix && parts.length >= 3) {
    return {
      prefix,
      slug: parts.slice(1, -1).join('-'),
      suffix: parseInt(lastPart, 10),
    };
  }
  
  return {
    prefix,
    slug: parts.slice(1).join('-'),
  };
}

/**
 * 从 ID 推断实体类型
 * 
 * @param id - ID 字符串
 * @returns 推断的类型，如果无法推断则返回 null
 */
export function inferTypeFromId(id: string): string | null {
  const parsed = parseId(id);
  if (!parsed) {
    return null;
  }
  
  // 反向查找类型
  for (const [type, prefix] of Object.entries(TYPE_PREFIX_MAP)) {
    if (prefix === parsed.prefix) {
      return type;
    }
  }
  
  return null;
}

/**
 * 批量生成 ID（确保批次内唯一性）
 * 
 * @param blocks - Block 数组
 * @param existingIds - 已存在的 ID 集合
 * @returns ID 映射（anchor -> id）
 */
export function generateIdsForBlocks(
  blocks: Block[],
  existingIds?: Set<string>
): Map<string, IdGeneratorResult> {
  const results = new Map<string, IdGeneratorResult>();
  const allIds = new Set(existingIds || []);
  
  for (const block of blocks) {
    // 如果已有 ID，跳过
    if (block.machine?.id) {
      allIds.add(block.machine.id);
      continue;
    }
    
    const result = generateIdFromBlock(block, {
      existingIds: allIds,
    });
    
    results.set(block.anchor, result);
    allIds.add(result.id);
  }
  
  return results;
}

