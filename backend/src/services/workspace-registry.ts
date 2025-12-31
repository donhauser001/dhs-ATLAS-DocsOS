/**
 * Workspace Registry - 文档宇宙唯一真理源
 * 
 * Phase 1.5: 范式校正
 * 
 * 硬规则：
 * - 任何模块访问文档，必须先通过 Registry 确认
 * - 直接使用 existsSync() 访问 repository 是禁止行为
 * - Query / Proposal / API 都必须先过 Registry
 * 
 * 这不是一个工具类，这是文档宇宙的唯一入口。
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { config } from '../config.js';
import { parseADL } from '../adl/parser.js';
import type { ADLDocument, Block } from '../adl/types.js';
import type { PublicUser } from './auth-service.js';
import { checkPathPermission } from './auth-service.js';

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
 * 注册文档路径
 * 
 * 当 workspace-service 重建索引时调用
 */
export function registerDocument(relativePath: string): void {
  initializeRegistry();
  state.knownPaths.add(relativePath);
}

/**
 * 注销文档路径
 */
export function unregisterDocument(relativePath: string): void {
  state.knownPaths.delete(relativePath);
}

// ============================================================
// 核心 API - 文档发现
// ============================================================

/**
 * 检查文档是否存在于工作空间
 * 
 * 这是检查文档存在性的唯一正确方式
 */
export function documentExists(relativePath: string): boolean {
  initializeRegistry();
  
  // 首先检查 Registry
  if (state.knownPaths.has(relativePath)) {
    return true;
  }
  
  // 如果 Registry 没有，检查文件系统（但不自动注册）
  const fullPath = join(config.repositoryRoot, relativePath);
  return existsSync(fullPath);
}

/**
 * 解析文档句柄
 * 
 * 返回文档的定位信息，但不加载内容
 */
export function resolveDocument(relativePath: string): DocumentHandle | null {
  initializeRegistry();
  
  const fullPath = join(config.repositoryRoot, relativePath);
  const fileExists = existsSync(fullPath);
  const indexed = state.knownPaths.has(relativePath);
  
  if (!fileExists && !indexed) {
    return null;
  }
  
  let modifiedAt: Date | null = null;
  if (fileExists) {
    try {
      modifiedAt = statSync(fullPath).mtime;
    } catch {
      // ignore
    }
  }
  
  return {
    path: relativePath,
    exists: fileExists,
    indexed,
    modifiedAt,
  };
}

/**
 * 读取文档内容
 * 
 * 这是读取文档的唯一正确方式
 */
export function readDocument(handle: DocumentHandle): DocumentContent | null {
  if (!handle.exists) {
    return null;
  }
  
  const fullPath = join(config.repositoryRoot, handle.path);
  
  try {
    const raw = readFileSync(fullPath, 'utf-8');
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
 */
export function canAccessDocument(user: PublicUser | null, relativePath: string): boolean {
  // 未登录用户无法访问任何文档
  if (!user) {
    return false;
  }
  
  // 首先检查文档是否存在
  if (!documentExists(relativePath)) {
    return false;
  }
  
  // 然后检查权限
  return checkPathPermission(user, relativePath);
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

