/**
 * Query Service - ADL 查询服务
 * 
 * Phase 1: 实现 ADL-Query v1.1
 * Phase 2.1: 全面通过 Registry 取路径，支持增量更新
 * 
 * 支持的操作符：
 * - $eq: 等于（默认）
 * - $ne: 不等于
 * - $gt/$gte/$lt/$lte: 数值比较
 * - $in: 在列表中
 * - $contains: 字符串包含
 * - $exists: 字段存在
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { config, ensureDirectories } from '../config.js';
import { getWorkspaceIndex } from './workspace-service.js';
// Phase 2.1: 必须通过 Registry 访问文档（范式强制）
import { getDocument, documentExists } from './workspace-registry.js';

// ============================================================
// 类型定义
// ============================================================

/**
 * Query - ADL 查询
 * 
 * Phase 1.5: 移除 select 字段
 * 
 * Query 只负责「定位」，不负责「取数据」。
 * 不再支持字段投影，因为那是「数据替身」的思维。
 */
export interface Query {
  /** 按 type 过滤 */
  type?: string;
  /** 过滤条件 */
  filter?: Record<string, FilterValue>;
  /** 结果限制 */
  limit?: number;
}

export type FilterValue = 
  | string 
  | number 
  | boolean 
  | FilterOperator;

export interface FilterOperator {
  $eq?: unknown;
  $ne?: unknown;
  $gt?: number;
  $gte?: number;
  $lt?: number;
  $lte?: number;
  $in?: unknown[];
  $contains?: string;
  $exists?: boolean;
}

/**
 * 可搜索字段白名单
 * 
 * Phase 2: Index 去数据库化
 * 只有这些字段可以被索引和过滤
 */
export interface SearchableFields {
  id?: string;
  title?: string;
  status?: string;
  category?: string;
  // 基本元数据，不包含业务数据
}

/**
 * BlockIndexEntry - Block 索引条目
 * 
 * Phase 1.5: 增加文档定位所需的字段
 * Phase 2: 去数据库化，只存储最小字段集合
 * 
 * 核心原则：Index 是「可再生的缓存」，不是「事实来源」
 * 完整数据必须回源文档获取
 */
export interface BlockIndexEntry {
  // === 定位信息（必需） ===
  
  /** Anchor - 稳定定位标识 */
  anchor: string;
  /** 文档路径 */
  document: string;
  
  // === 人类可读摘要（必需） ===
  
  /** Block 标题 */
  heading: string;
  /** Machine title */
  title: string;
  /** Block 类型 */
  type: string;
  /** Block 状态 */
  status?: string;
  
  // === 可搜索字段（白名单） ===
  
  /** 可索引的字段，用于过滤查询 */
  searchable: SearchableFields;
  
  // Phase 2: 不再存储 machine 全量数据
  // 如需完整数据，必须回源文档
}

export interface BlocksIndex {
  blocks: BlockIndexEntry[];
  updated_at: string;
}

/**
 * QueryResult - 查询结果
 * 
 * Phase 1.5: 返回「文档定位」而非「数据替身」
 * 
 * Query 的职责是帮助定位文档中的 Block，
 * 而不是返回 Block 的数据副本。
 * 
 * 如需完整数据，必须通过 /api/adl/block/:anchor 获取。
 */
export interface QueryResult {
  // === 文档定位（强制） ===
  
  /** Anchor - 稳定定位标识 */
  anchor: string;
  /** 文档路径 */
  document: string;
  
  // === 人类可读摘要（强制） ===
  
  /** Block 标题 */
  heading: string;
  /** Machine title */
  title: string;
  /** Block 类型 */
  type: string;
  
  // === 可选：状态信息 ===
  
  /** Block 状态（如果有） */
  status?: string;
}

export interface QueryResponse {
  results: QueryResult[];
  count: number;
  query_time_ms: number;
}

// ============================================================
// 索引管理
// ============================================================

/**
 * 获取 Blocks 索引
 */
export async function getBlocksIndex(): Promise<BlocksIndex> {
  ensureDirectories();
  
  // 检查缓存
  if (existsSync(config.blocksIndexPath)) {
    try {
      const cached = JSON.parse(readFileSync(config.blocksIndexPath, 'utf-8'));
      return cached as BlocksIndex;
    } catch {
      // 缓存损坏，重建
    }
  }
  
  return rebuildBlocksIndex();
}

/**
 * 从文档提取 Block 索引条目
 * 
 * Phase 2.1: 抽取为独立函数，支持增量更新
 */
function extractBlockEntries(docPath: string): BlockIndexEntry[] {
  const entries: BlockIndexEntry[] = [];
  
  // Phase 2.1: 必须通过 Registry 访问文档（范式强制）
  const content = getDocument(docPath);
  if (!content) {
    return entries;
  }
  
  for (const block of content.document.blocks) {
    if (block.machine?.type) {
      // Phase 2: 只提取白名单字段
      const searchable: SearchableFields = {
        id: block.machine.id as string | undefined,
        title: block.machine.title as string | undefined,
        status: block.machine.status as string | undefined,
        category: block.machine.category as string | undefined,
      };
      
      entries.push({
        // 定位信息
        anchor: block.anchor,
        document: docPath,
        // 人类可读摘要
        heading: block.heading,
        title: (block.machine.title as string) || block.heading,
        type: block.machine.type,
        status: block.machine.status as string | undefined,
        // 可搜索字段（白名单）
        searchable,
      });
    }
  }
  
  return entries;
}

/**
 * 重建 Blocks 索引（全量）
 * 
 * Phase 1.5: 存储文档定位所需的完整信息
 * Phase 2: 去数据库化，只存储最小字段集合
 * Phase 2.1: 必须通过 Registry 访问文档（消灭 repositoryRoot + path 拼接）
 */
export async function rebuildBlocksIndex(): Promise<BlocksIndex> {
  ensureDirectories();
  
  // 获取 Workspace 索引中的所有文档
  const wsIndex = await getWorkspaceIndex();
  const blocks: BlockIndexEntry[] = [];
  
  for (const doc of wsIndex.documents) {
    // Phase 2.1: 必须通过 Registry 检查文档存在性（范式强制）
    if (!documentExists(doc.path)) {
      continue;
    }
    
    try {
      const entries = extractBlockEntries(doc.path);
      blocks.push(...entries);
    } catch (error) {
      console.error(`[Query] Failed to index ${doc.path}:`, error);
    }
  }
  
  const index: BlocksIndex = {
    blocks,
    updated_at: new Date().toISOString(),
  };
  
  // 写入缓存
  writeFileSync(config.blocksIndexPath, JSON.stringify(index, null, 2), 'utf-8');
  
  return index;
}

/**
 * 增量更新单个文档的 Blocks 索引
 * 
 * Phase 2.1: 避免每次 Proposal 执行后全量重建
 */
export async function updateBlocksIndexForDocument(docPath: string): Promise<BlocksIndex> {
  ensureDirectories();
  
  // 获取现有索引
  let index = await getBlocksIndex();
  
  // 移除该文档的旧条目
  index.blocks = index.blocks.filter(b => b.document !== docPath);
  
  // Phase 2.1: 通过 Registry 检查文档是否存在
  if (documentExists(docPath)) {
    try {
      const entries = extractBlockEntries(docPath);
      index.blocks.push(...entries);
    } catch (error) {
      console.error(`[Query] Failed to update index for ${docPath}:`, error);
    }
  }
  
  // 更新时间戳
  index.updated_at = new Date().toISOString();
  
  // 写入缓存
  writeFileSync(config.blocksIndexPath, JSON.stringify(index, null, 2), 'utf-8');
  
  return index;
}

// ============================================================
// 查询执行
// ============================================================

/**
 * 执行查询
 * 
 * Phase 1.5: 返回文档定位，而非数据替身
 * Phase 2: 基于 searchable 字段过滤，不再使用 machine 全量
 * 
 * Query 的职责是「定位」，不是「取数据」。
 * 如需完整数据，请使用 /api/adl/block/:anchor
 */
export async function executeQuery(query: Query): Promise<QueryResponse> {
  const startTime = Date.now();
  
  // 获取索引
  const index = await getBlocksIndex();
  let results = index.blocks;
  
  // 按 type 过滤
  if (query.type) {
    results = results.filter(b => b.type === query.type);
  }
  
  // Phase 2: 基于 searchable 字段过滤（只支持白名单字段）
  if (query.filter) {
    results = results.filter(block => matchSearchableFilter(block, query.filter!));
  }
  
  // 应用 limit
  if (query.limit && query.limit > 0) {
    results = results.slice(0, query.limit);
  }
  
  // 返回文档定位，而非数据替身
  const locationResults: QueryResult[] = results.map(block => ({
    // 文档定位（强制）
    anchor: block.anchor,
    document: block.document,
    // 人类可读摘要（强制）
    heading: block.heading,
    title: block.title,
    type: block.type,
    // 可选状态
    status: block.status,
  }));
  
  return {
    results: locationResults,
    count: locationResults.length,
    query_time_ms: Date.now() - startTime,
  };
}

// ============================================================
// 过滤器匹配
// ============================================================

/**
 * Phase 2: 基于 searchable 字段过滤
 * 
 * 只支持白名单字段：id, title, status, category
 * 复杂查询需回源文档
 */
function matchSearchableFilter(block: BlockIndexEntry, filter: Record<string, FilterValue>): boolean {
  // 允许过滤的字段白名单
  const allowedFields = ['id', 'title', 'status', 'category', 'type'];
  
  for (const [path, condition] of Object.entries(filter)) {
    // Phase 2: 检查字段是否在白名单中
    const fieldName = path.split('.')[0]; // 获取顶层字段名
    if (!allowedFields.includes(fieldName)) {
      console.warn(`[Query] Filter field '${path}' is not in searchable whitelist, skipping`);
      continue;
    }
    
    // 从 block 的 searchable 或顶层字段获取值
    let value: unknown;
    if (path === 'type') {
      value = block.type;
    } else if (path === 'status') {
      value = block.status;
    } else {
      value = getNestedValue(block.searchable as Record<string, unknown>, path);
    }
    
    if (!matchCondition(value, condition)) {
      return false;
    }
  }
  
  return true;
}

/**
 * 检查值是否匹配条件
 */
function matchCondition(value: unknown, condition: FilterValue): boolean {
  // 简单值比较（等于）
  if (typeof condition !== 'object' || condition === null) {
    return value === condition;
  }
  
  // 操作符比较
  const op = condition as FilterOperator;
  
  // $eq
  if ('$eq' in op) {
    return value === op.$eq;
  }
  
  // $ne
  if ('$ne' in op) {
    return value !== op.$ne;
  }
  
  // $gt
  if ('$gt' in op && typeof op.$gt === 'number') {
    return typeof value === 'number' && value > op.$gt;
  }
  
  // $gte
  if ('$gte' in op && typeof op.$gte === 'number') {
    return typeof value === 'number' && value >= op.$gte;
  }
  
  // $lt
  if ('$lt' in op && typeof op.$lt === 'number') {
    return typeof value === 'number' && value < op.$lt;
  }
  
  // $lte
  if ('$lte' in op && typeof op.$lte === 'number') {
    return typeof value === 'number' && value <= op.$lte;
  }
  
  // $in
  if ('$in' in op && Array.isArray(op.$in)) {
    return op.$in.includes(value);
  }
  
  // $contains
  if ('$contains' in op && typeof op.$contains === 'string') {
    return typeof value === 'string' && value.includes(op.$contains);
  }
  
  // $exists
  if ('$exists' in op) {
    const exists = value !== undefined && value !== null;
    return op.$exists ? exists : !exists;
  }
  
  return false;
}

/**
 * 获取嵌套值
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}

