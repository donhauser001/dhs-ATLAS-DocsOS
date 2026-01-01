/**
 * Token Resolver - Design Tokens 解析服务
 * 
 * Phase 2.5: 语言与显现校正
 * Phase 3.0: 确定性显现映射
 * 
 * 职责：
 * 1. 从 genesis/tokens.md 加载 Token 定义
 * 2. 解析语义引用（{ token: xxx }）为实际值
 * 3. 缓存 Token 到 .atlas/tokens.json
 * 
 * 核心原则：
 * - Token 文档是事实源
 * - .atlas/tokens.json 是派生缓存
 * - 所有语义引用必须能回溯到 Token 定义
 * 
 * Phase 3.0 规则：
 * - 不允许模糊匹配
 * - 不允许 fallback 魔法
 * - 未定义的 token 必须报错
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { config, ensureDirectories } from '../config.js';
import { getDocument, documentExists } from './workspace-registry.js';
import type { TokenRef, DisplayHints } from '../adl/types.js';
import { isTokenRef } from '../adl/types.js';

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
  /** 其他变体 */
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

// ============================================================
// Token 加载与缓存
// ============================================================

const TOKENS_DOC_PATH = 'genesis/tokens.md';
const TOKENS_CACHE_PATH = join(config.atlasDataDir, 'tokens.json');

let cachedTokens: TokenCache | null = null;

/**
 * 加载 Token 定义
 * 
 * 从 genesis/tokens.md 解析所有 token_group 类型的 Block
 */
export async function loadTokens(): Promise<TokenCache> {
  ensureDirectories();
  
  // 如果有缓存，直接返回
  if (cachedTokens) {
    return cachedTokens;
  }
  
  // 尝试从文件缓存加载
  if (existsSync(TOKENS_CACHE_PATH)) {
    try {
      const cached = JSON.parse(readFileSync(TOKENS_CACHE_PATH, 'utf-8'));
      cachedTokens = cached as TokenCache;
      return cachedTokens;
    } catch {
      // 缓存损坏，重建
    }
  }
  
  return rebuildTokenCache();
}

/**
 * 重建 Token 缓存
 * 
 * 从 genesis/tokens.md 解析并缓存
 */
export async function rebuildTokenCache(): Promise<TokenCache> {
  ensureDirectories();
  
  const groups: Record<string, TokenGroup> = {};
  const index: Record<string, TokenDefinition> = {};
  
  // 检查 tokens.md 是否存在
  if (!documentExists(TOKENS_DOC_PATH)) {
    console.warn('[TokenResolver] tokens.md not found, creating empty cache');
    const emptyCache: TokenCache = {
      groups: {},
      index: {},
      updated_at: new Date().toISOString(),
    };
    cachedTokens = emptyCache;
    writeFileSync(TOKENS_CACHE_PATH, JSON.stringify(emptyCache, null, 2), 'utf-8');
    return emptyCache;
  }
  
  // 解析 tokens.md
  const docResult = getDocument(TOKENS_DOC_PATH);
  if (!docResult) {
    throw new Error('[TokenResolver] Failed to load tokens.md');
  }
  
  // 提取所有 token_group 类型的 Block
  for (const block of docResult.document.blocks) {
    if (block.machine?.type === 'token_group') {
      const groupId = block.machine.id as string;
      const tokens = block.machine.tokens as Record<string, TokenDefinition> | undefined;
      
      if (groupId && tokens) {
        const group: TokenGroup = {
          id: groupId,
          title: block.machine.title as string || groupId,
          tokens,
        };
        
        groups[groupId] = group;
        
        // 建立扁平索引
        for (const [tokenName, tokenDef] of Object.entries(tokens)) {
          const fullPath = `${groupId}.${tokenName}`;
          index[fullPath] = tokenDef;
        }
      }
    }
  }
  
  const cache: TokenCache = {
    groups,
    index,
    updated_at: new Date().toISOString(),
  };
  
  // 写入缓存文件
  writeFileSync(TOKENS_CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
  cachedTokens = cache;
  
  console.log(`[TokenResolver] Rebuilt cache: ${Object.keys(groups).length} groups, ${Object.keys(index).length} tokens`);
  
  return cache;
}

/**
 * 清除内存缓存
 */
export function clearTokenCache(): void {
  cachedTokens = null;
}

// ============================================================
// Phase 3.0: 错误类型
// ============================================================

/**
 * Token 解析错误
 */
export class TokenResolveError extends Error {
  constructor(
    public code: string,
    message: string,
    public tokenPath: string
  ) {
    super(message);
    this.name = 'TokenResolveError';
  }
}

// ============================================================
// Token 解析
// ============================================================

/**
 * 获取 Token 定义
 * 
 * @param path Token 路径，如 "color.brand.primary"
 * @returns Token 定义，或 null
 */
export async function getTokenDefinition(path: string): Promise<TokenDefinition | null> {
  const cache = await loadTokens();
  return cache.index[path] || null;
}

/**
 * 解析 Token 为主值
 * 
 * @param path Token 路径，如 "color.brand.primary"
 * @returns 解析后的值，如 "#8B5CF6"
 */
export async function resolveToken(path: string): Promise<string | null> {
  const def = await getTokenDefinition(path);
  return def?.value || null;
}

/**
 * Phase 3.0: 严格模式解析 Token
 * 
 * 不允许模糊匹配，未定义的 token 抛出错误
 * 
 * @param path Token 路径
 * @throws TokenResolveError 如果 token 不存在
 */
export async function resolveTokenStrict(path: string): Promise<string> {
  const def = await getTokenDefinition(path);
  
  if (!def) {
    throw new TokenResolveError(
      'E101',
      `Token '${path}' not found`,
      path
    );
  }
  
  if (!def.value) {
    throw new TokenResolveError(
      'E102',
      `Token '${path}' has no value defined`,
      path
    );
  }
  
  return def.value;
}

/**
 * Phase 3.0: 严格模式解析 Token 变体
 * 
 * @param path Token 路径
 * @param variant 变体名
 * @throws TokenResolveError 如果 token 或变体不存在
 */
export async function resolveTokenVariantStrict(path: string, variant: string): Promise<string> {
  const def = await getTokenDefinition(path);
  
  if (!def) {
    throw new TokenResolveError(
      'E101',
      `Token '${path}' not found`,
      path
    );
  }
  
  const value = def[variant];
  if (!value) {
    throw new TokenResolveError(
      'E103',
      `Token '${path}' has no variant '${variant}'`,
      path
    );
  }
  
  return value;
}

/**
 * 解析 Token 为指定变体
 * 
 * @param path Token 路径
 * @param variant 变体名，如 "bg", "text"
 * @returns 解析后的值
 */
export async function resolveTokenVariant(path: string, variant: string): Promise<string | null> {
  const def = await getTokenDefinition(path);
  if (!def) return null;
  return def[variant] || def.value || null;
}

/**
 * 解析值（如果是 TokenRef 则解析，否则返回原值）
 * 
 * @param value 可能是字面量或 TokenRef
 * @returns 解析后的字面量值
 */
export async function resolveValue(value: unknown): Promise<unknown> {
  if (isTokenRef(value)) {
    const resolved = await resolveToken(value.token);
    return resolved || value; // 解析失败时返回原始引用
  }
  return value;
}

/**
 * Phase 3.0: 严格模式解析值
 * 
 * 如果是 TokenRef 则严格解析，字面量值会被拒绝
 * 
 * @param value 必须是 TokenRef
 * @throws TokenResolveError 如果不是 TokenRef 或 token 不存在
 */
export async function resolveValueStrict(value: unknown): Promise<string> {
  if (!isTokenRef(value)) {
    throw new TokenResolveError(
      'E104',
      'Value must be a token reference, literal values are not allowed',
      String(value)
    );
  }
  
  return resolveTokenStrict(value.token);
}

/**
 * 解析 DisplayHints 中的所有 TokenRef
 * 
 * @param hints DisplayHints 对象
 * @returns 解析后的显现值
 */
export async function resolveDisplayHints(hints: DisplayHints): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  
  for (const [key, tokenRef] of Object.entries(hints)) {
    if (tokenRef && isTokenRef(tokenRef)) {
      result[key] = await resolveToken(tokenRef.token);
    }
  }
  
  return result;
}

/**
 * Phase 3.0: 严格模式解析 DisplayHints
 * 
 * 所有字段必须使用 TokenRef，且 token 必须存在
 * 
 * @throws TokenResolveError 如果任何 token 不存在
 */
export async function resolveDisplayHintsStrict(hints: DisplayHints): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  
  for (const [key, tokenRef] of Object.entries(hints)) {
    if (tokenRef && isTokenRef(tokenRef)) {
      result[key] = await resolveTokenStrict(tokenRef.token);
    }
  }
  
  return result;
}

// ============================================================
// Token 查询
// ============================================================

/**
 * 获取所有 Token 组
 */
export async function getAllTokenGroups(): Promise<TokenGroup[]> {
  const cache = await loadTokens();
  return Object.values(cache.groups);
}

/**
 * 获取指定组的所有 Token
 * 
 * @param groupId 组 ID，如 "color.brand"
 */
export async function getTokensByGroup(groupId: string): Promise<Record<string, TokenDefinition> | null> {
  const cache = await loadTokens();
  return cache.groups[groupId]?.tokens || null;
}

/**
 * 搜索 Token
 * 
 * @param query 搜索词
 * @returns 匹配的 token 路径列表
 */
export async function searchTokens(query: string): Promise<string[]> {
  const cache = await loadTokens();
  const lowerQuery = query.toLowerCase();
  
  return Object.entries(cache.index)
    .filter(([path, def]) => 
      path.toLowerCase().includes(lowerQuery) ||
      (def.description?.toLowerCase().includes(lowerQuery))
    )
    .map(([path]) => path);
}

// ============================================================
// 状态和类型的快捷解析
// ============================================================

/**
 * 获取状态的显现值
 * 
 * @param status 状态名，如 "active"
 * @returns 状态的颜色配置
 */
export async function getStatusDisplay(status: string): Promise<{
  color: string | null;
  bg: string | null;
  text: string | null;
  icon: string | null;
}> {
  const cache = await loadTokens();
  
  // 从 color.status 组获取颜色
  const colorDef = cache.index[`color.status.${status}`];
  // 从 icon.status 组获取图标
  const iconDef = cache.index[`icon.status.${status}`];
  
  return {
    color: colorDef?.value || null,
    bg: colorDef?.bg || null,
    text: colorDef?.text || null,
    icon: iconDef?.lucide || null,
  };
}

/**
 * 获取类型的显现值
 * 
 * @param type 类型名，如 "service"
 * @returns 类型的颜色配置
 */
export async function getTypeDisplay(type: string): Promise<{
  color: string | null;
  bg: string | null;
  text: string | null;
  icon: string | null;
}> {
  const cache = await loadTokens();
  
  // 从 color.type 组获取颜色
  const colorDef = cache.index[`color.type.${type}`];
  // 从 icon.type 组获取图标
  const iconDef = cache.index[`icon.type.${type}`];
  
  return {
    color: colorDef?.value || null,
    bg: colorDef?.bg || null,
    text: colorDef?.text || null,
    icon: iconDef?.lucide || null,
  };
}

