/**
 * Workspace Registry - 文档宇宙唯一真理源
 * 
 * Phase 1.5: 范式校正
 * Phase 2: 路径边界硬化
 * 
 * 硬规则：
 * - 任何模块访问文档，必须先通过 Registry 确认
 * - 直接使用 existsSync() 访问 repository 是禁止行为
 * - Query / Proposal / API 都必须先过 Registry
 * - 所有路径必须经过 SafePath 解析器验证
 * 
 * 这不是一个工具类，这是文档宇宙的唯一入口。
 */

import { existsSync, readFileSync, statSync, lstatSync, realpathSync } from 'fs';
import { join, relative, resolve, isAbsolute, sep } from 'path';
import { config } from '../config.js';
import { parseADL } from '../adl/parser.js';
import type { ADLDocument, Block } from '../adl/types.js';
import type { PublicUser } from './auth-service.js';
import { checkPathPermission } from './auth-service.js';

// ============================================================
// Phase 2: SafePath 解析器 - 路径边界硬化
// ============================================================

/**
 * SafePath 解析结果
 * 
 * 所有路径访问必须先经过此校验
 */
export interface SafePathResult {
  /** 路径是否安全有效 */
  valid: boolean;
  /** 规范化后的绝对路径（仅当 valid=true） */
  resolved: string | null;
  /** 规范化后的相对路径（仅当 valid=true） */
  relative: string | null;
  /** 错误信息（仅当 valid=false） */
  error?: string;
}

/**
 * 安全路径解析器
 * 
 * Phase 2 核心：防止路径穿越攻击
 * Phase 2.1: 增加目录链路 symlink 防护（realpath 前缀校验）
 * 
 * 检查项：
 * 1. 拒绝绝对路径
 * 2. 拒绝路径穿越（..）
 * 3. 验证解析后的路径在 repository 边界内
 * 4. 拒绝软链接（防止逃逸）
 * 5. Phase 2.1: 使用 realpath 校验整个路径链路
 */
export function resolveSafePath(relativePath: string): SafePathResult {
  // 1. 拒绝空路径
  if (!relativePath || relativePath.trim() === '') {
    return { valid: false, resolved: null, relative: null, error: 'Empty path not allowed' };
  }

  // 2. 拒绝绝对路径
  if (isAbsolute(relativePath)) {
    return { valid: false, resolved: null, relative: null, error: 'Absolute paths not allowed' };
  }

  // 3. 拒绝路径穿越（粗暴但有效）
  if (relativePath.includes('..')) {
    return { valid: false, resolved: null, relative: null, error: 'Path traversal (..) not allowed' };
  }

  // 4. 拒绝 URL 编码的路径穿越尝试
  if (relativePath.includes('%2e') || relativePath.includes('%2E')) {
    return { valid: false, resolved: null, relative: null, error: 'URL-encoded path traversal not allowed' };
  }

  // 5. 规范化并验证边界（初步检查）
  const repoRoot = resolve(config.repositoryRoot);
  const fullPath = resolve(repoRoot, relativePath);

  // 确保解析后的路径在 repository 边界内
  // 注意：需要加 sep 防止 /repo-other 被误认为 /repo 的子目录
  if (!fullPath.startsWith(repoRoot + sep) && fullPath !== repoRoot) {
    return { valid: false, resolved: null, relative: null, error: 'Path outside repository boundary' };
  }

  // 6. Phase 2.1: 使用 realpath 校验整个路径链路（防止目录层级的 symlink 逃逸）
  if (existsSync(fullPath)) {
    try {
      // 获取 repository 根目录的真实路径
      const realRepoRoot = realpathSync(repoRoot);
      // 获取目标文件的真实路径
      const realFullPath = realpathSync(fullPath);

      // 检查真实路径是否在 repository 边界内
      if (!realFullPath.startsWith(realRepoRoot + sep) && realFullPath !== realRepoRoot) {
        return {
          valid: false,
          resolved: null,
          relative: null,
          error: 'Symlink chain escapes repository boundary'
        };
      }

      // 使用真实路径替换解析路径（确保后续操作使用真实路径）
      const normalizedRelative = relative(realRepoRoot, realFullPath);

      // 额外检查：规范化后的相对路径不应以 .. 开头
      if (normalizedRelative.startsWith('..')) {
        return { valid: false, resolved: null, relative: null, error: 'Normalized realpath escapes repository' };
      }

      return {
        valid: true,
        resolved: realFullPath,
        relative: normalizedRelative,
      };
    } catch (err) {
      // realpath 失败（可能是断链的 symlink）
      return {
        valid: false,
        resolved: null,
        relative: null,
        error: `Failed to resolve real path: ${String(err)}`
      };
    }
  }

  // 7. 文件不存在时，仍需验证路径格式
  // 对于不存在的文件，无法使用 realpath，只做基本检查
  const normalizedRelative = relative(repoRoot, fullPath);

  // 8. 额外检查：规范化后的相对路径不应以 .. 开头
  if (normalizedRelative.startsWith('..')) {
    return { valid: false, resolved: null, relative: null, error: 'Normalized path escapes repository' };
  }

  return {
    valid: true,
    resolved: fullPath,
    relative: normalizedRelative,
  };
}

/**
 * 获取安全的绝对路径（供 Executor 使用）
 * 
 * 如果路径不安全，返回 null
 */
export function getSafeAbsolutePath(relativePath: string): string | null {
  const result = resolveSafePath(relativePath);
  return result.valid ? result.resolved : null;
}

// ============================================================
// 核心类型 - 文档句柄
// ============================================================

/**
 * DocumentHandle - 文档的唯一引用
 * 
 * 这不是文档内容，而是文档在宇宙中的"定位符"
 */
export interface DocumentHandle {
  /** 相对于 repository 的路径 */
  readonly path: string;
  /** 文档是否存在于工作空间 */
  readonly exists: boolean;
  /** 文档是否在索引中 */
  readonly indexed: boolean;
  /** 最后修改时间 */
  readonly modifiedAt: Date | null;
}

/**
 * BlockHandle - Block 的文档定位符
 * 
 * 这是 Query 应该返回的东西：定位能力，而非数据替身
 */
export interface BlockHandle {
  /** Anchor - 稳定定位标识 */
  readonly anchor: string;
  /** 所属文档路径 */
  readonly document: string;
  /** Block 标题（human-readable） */
  readonly heading: string;
  /** Machine title */
  readonly title: string;
  /** Block 类型 */
  readonly type: string;
  /** Block 起始行号 */
  readonly startLine: number;
}

/**
 * DocumentContent - 完整的文档内容
 * 
 * 只有通过 resolveDocument().read() 才能获取
 */
export interface DocumentContent {
  /** 文档句柄 */
  handle: DocumentHandle;
  /** 解析后的 ADL 文档 */
  document: ADLDocument;
  /** 原始内容 */
  raw: string;
}

// ============================================================
// Registry 状态
// ============================================================

interface RegistryState {
  /** 已知文档路径集合 */
  knownPaths: Set<string>;
  /** 初始化时间 */
  initializedAt: Date | null;
  /** 是否已初始化 */
  initialized: boolean;
}

const state: RegistryState = {
  knownPaths: new Set(),
  initializedAt: null,
  initialized: false,
};

// ============================================================
// Registry 初始化
// ============================================================

/**
 * 初始化 Registry
 * 
 * 从 workspace.json 加载已知文档列表
 * 这是唯一允许扫描文件系统的地方
 */
export function initializeRegistry(): void {
  if (state.initialized) {
    return;
  }

  state.knownPaths.clear();

  // 从 workspace.json 加载（如果存在）
  if (existsSync(config.workspaceIndexPath)) {
    try {
      const index = JSON.parse(readFileSync(config.workspaceIndexPath, 'utf-8'));
      for (const doc of index.documents || []) {
        state.knownPaths.add(doc.path);
      }
    } catch {
      // 索引损坏，忽略
    }
  }

  state.initializedAt = new Date();
  state.initialized = true;
}

/**
 * 重置 Registry（仅供测试使用）
 */
export function resetRegistry(): void {
  state.knownPaths.clear();
  state.initializedAt = null;
  state.initialized = false;
}

/**
 * 刷新 Registry（热更新）
 * 
 * Phase 3.3: 支持文件移动后无需重启服务器
 * 「双向奔赴」原则 - 无论文档如何移动，系统自动适应
 */
export function refreshRegistry(): void {
  console.log('[Registry] Refreshing - reloading from workspace.json');

  state.knownPaths.clear();

  // 从 workspace.json 重新加载
  if (existsSync(config.workspaceIndexPath)) {
    try {
      const index = JSON.parse(readFileSync(config.workspaceIndexPath, 'utf-8'));
      for (const doc of index.documents || []) {
        state.knownPaths.add(doc.path);
      }
      console.log(`[Registry] Refreshed: ${state.knownPaths.size} documents`);
    } catch (error) {
      console.error('[Registry] Failed to refresh from workspace.json:', error);
    }
  }

  state.initializedAt = new Date();
  state.initialized = true;
}

/**
 * 注册文档路径
 * 
 * 当 workspace-service 重建索引时调用
 * 
 * Phase 2: 使用 SafePath 解析器
 */
export function registerDocument(relativePath: string): void {
  initializeRegistry();

  // Phase 2: 验证路径安全性
  const safePath = resolveSafePath(relativePath);
  if (!safePath.valid) {
    console.warn(`[Registry] registerDocument rejected unsafe path: ${relativePath} - ${safePath.error}`);
    return;
  }

  // 使用规范化的相对路径
  state.knownPaths.add(safePath.relative!);
}

/**
 * 注销文档路径
 * 
 * Phase 2: 使用 SafePath 解析器
 */
export function unregisterDocument(relativePath: string): void {
  const safePath = resolveSafePath(relativePath);
  if (safePath.valid && safePath.relative) {
    state.knownPaths.delete(safePath.relative);
  }
}

// ============================================================
// 核心 API - 文档发现
// ============================================================

/**
 * 检查文档是否存在于工作空间
 * 
 * 这是检查文档存在性的唯一正确方式
 * 
 * Phase 2: 使用 SafePath 解析器
 */
export function documentExists(relativePath: string): boolean {
  initializeRegistry();

  // Phase 2: 先验证路径安全性
  const safePath = resolveSafePath(relativePath);
  if (!safePath.valid) {
    console.warn(`[Registry] documentExists rejected unsafe path: ${relativePath} - ${safePath.error}`);
    return false;
  }

  // 首先检查 Registry（使用规范化的相对路径）
  if (state.knownPaths.has(safePath.relative!)) {
    return true;
  }

  // 如果 Registry 没有，检查文件系统（但不自动注册）
  return existsSync(safePath.resolved!);
}

/**
 * 解析文档句柄
 * 
 * 返回文档的定位信息，但不加载内容
 * 
 * Phase 2: 使用 SafePath 解析器
 */
export function resolveDocument(relativePath: string): DocumentHandle | null {
  initializeRegistry();

  // Phase 2: 先验证路径安全性
  const safePath = resolveSafePath(relativePath);
  if (!safePath.valid) {
    console.warn(`[Registry] resolveDocument rejected unsafe path: ${relativePath} - ${safePath.error}`);
    return null;
  }

  const fileExists = existsSync(safePath.resolved!);
  const indexed = state.knownPaths.has(safePath.relative!);

  if (!fileExists && !indexed) {
    return null;
  }

  let modifiedAt: Date | null = null;
  if (fileExists) {
    try {
      modifiedAt = statSync(safePath.resolved!).mtime;
    } catch {
      // ignore
    }
  }

  return {
    path: safePath.relative!, // 使用规范化的相对路径
    exists: fileExists,
    indexed,
    modifiedAt,
  };
}

/**
 * 读取文档内容
 * 
 * 这是读取文档的唯一正确方式
 * 
 * Phase 2: 使用 SafePath 解析器
 */
export function readDocument(handle: DocumentHandle): DocumentContent | null {
  if (!handle.exists) {
    return null;
  }

  // Phase 2: 再次验证路径安全性（防止句柄被篡改）
  const safePath = resolveSafePath(handle.path);
  if (!safePath.valid) {
    console.warn(`[Registry] readDocument rejected unsafe handle path: ${handle.path} - ${safePath.error}`);
    return null;
  }

  try {
    const raw = readFileSync(safePath.resolved!, 'utf-8');
    const document = parseADL(raw, handle.path);

    return {
      handle,
      document,
      raw,
    };
  } catch {
    return null;
  }
}

/**
 * 获取文档完整内容（快捷方法）
 * 
 * 相当于 resolveDocument + readDocument
 */
export function getDocument(relativePath: string): DocumentContent | null {
  const handle = resolveDocument(relativePath);
  if (!handle) {
    return null;
  }
  return readDocument(handle);
}

// ============================================================
// 核心 API - Block 定位
// ============================================================

/**
 * 从 Block 创建定位句柄
 * 
 * 这是 Query 应该返回的东西
 */
export function createBlockHandle(block: Block, documentPath: string): BlockHandle {
  return {
    anchor: block.anchor,
    document: documentPath,
    heading: block.heading,
    title: block.machine?.title || block.heading,
    type: block.machine?.type || 'unknown',
    startLine: block.startLine,
  };
}

/**
 * 通过 Anchor 解析 Block 句柄
 */
export function resolveBlockByAnchor(
  documentPath: string,
  anchor: string
): BlockHandle | null {
  const content = getDocument(documentPath);
  if (!content) {
    return null;
  }

  const block = content.document.blocks.find(b => b.anchor === anchor);
  if (!block) {
    return null;
  }

  return createBlockHandle(block, documentPath);
}

// ============================================================
// 核心 API - 可见域过滤
// ============================================================

/**
 * 列出用户可见的所有文档
 * 
 * 这是获取文档列表的唯一正确方式
 */
export function listVisibleDocuments(user: PublicUser | null): DocumentHandle[] {
  initializeRegistry();

  const handles: DocumentHandle[] = [];

  for (const path of state.knownPaths) {
    // 权限检查
    if (user && !checkPathPermission(user, path)) {
      continue;
    }

    const handle = resolveDocument(path);
    if (handle) {
      handles.push(handle);
    }
  }

  return handles;
}

/**
 * 检查用户是否可以访问指定文档
 * 
 * Phase 2: 使用 SafePath 解析器
 */
export function canAccessDocument(user: PublicUser | null, relativePath: string): boolean {
  // 未登录用户无法访问任何文档
  if (!user) {
    return false;
  }

  // Phase 2: 先验证路径安全性
  const safePath = resolveSafePath(relativePath);
  if (!safePath.valid) {
    console.warn(`[Registry] canAccessDocument rejected unsafe path: ${relativePath} - ${safePath.error}`);
    return false;
  }

  // 检查文档是否存在（使用规范化路径）
  if (!documentExists(safePath.relative!)) {
    return false;
  }

  // 然后检查权限（使用规范化路径）
  return checkPathPermission(user, safePath.relative!);
}

// ============================================================
// Registry 统计
// ============================================================

/**
 * 获取 Registry 状态
 */
export function getRegistryStats(): {
  documentCount: number;
  initialized: boolean;
  initializedAt: Date | null;
} {
  return {
    documentCount: state.knownPaths.size,
    initialized: state.initialized,
    initializedAt: state.initializedAt,
  };
}

/**
 * 获取所有已知文档路径
 */
export function getKnownPaths(): string[] {
  initializeRegistry();
  return Array.from(state.knownPaths);
}

