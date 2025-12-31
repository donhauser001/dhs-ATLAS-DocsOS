/**
 * Query Service - ADL 查询服务
 * 
 * Phase 1: 实现 ADL-Query v1.1
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
import type { Block, MachineBlock } from '../adl/types.js';

// ============================================================
// 类型定义
// ============================================================

export interface Query {
  /** 按 type 过滤 */
  type?: string;
  /** 过滤条件 */
  filter?: Record<string, FilterValue>;
  /** 选择字段 */
  select?: string[];
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

export interface BlockIndexEntry {
  /** Anchor */
  anchor: string;
  /** 文档路径 */
  document: string;
  /** Block 类型 */
  type: string;
  /** Machine 数据 */
  machine: MachineBlock;
}

export interface BlocksIndex {
  blocks: BlockIndexEntry[];
  updated_at: string;
}

export interface QueryResult {
  anchor: string;
  document: string;
  data: Record<string, unknown>;
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
 * 重建 Blocks 索引
 */
export async function rebuildBlocksIndex(): Promise<BlocksIndex> {
  ensureDirectories();
  
  // 获取 Workspace 索引中的所有文档
  const wsIndex = await getWorkspaceIndex();
  const blocks: BlockIndexEntry[] = [];
  
  // 遍历所有文档，解析并提取 Block
  const { parseADL } = await import('../adl/parser.js');
  
  for (const doc of wsIndex.documents) {
    const fullPath = `${config.repositoryRoot}/${doc.path}`;
    
    if (!existsSync(fullPath)) {
      continue;
    }
    
    try {
      const content = readFileSync(fullPath, 'utf-8');
      const adlDoc = parseADL(content, doc.path);
      
      for (const block of adlDoc.blocks) {
        if (block.machine?.type) {
          blocks.push({
            anchor: block.anchor,
            document: doc.path,
            type: block.machine.type,
            machine: block.machine,
          });
        }
      }
    } catch (error) {
      console.error(`Failed to index ${doc.path}:`, error);
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

// ============================================================
// 查询执行
// ============================================================

/**
 * 执行查询
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
  
  // 应用 filter
  if (query.filter) {
    results = results.filter(block => matchFilter(block.machine, query.filter!));
  }
  
  // 应用 limit
  if (query.limit && query.limit > 0) {
    results = results.slice(0, query.limit);
  }
  
  // 应用 select（投影）
  const projectedResults: QueryResult[] = results.map(block => {
    const data: Record<string, unknown> = {};
    
    if (query.select && query.select.length > 0) {
      for (const field of query.select) {
        const value = getNestedValue(block.machine, field);
        if (value !== undefined) {
          data[field] = value;
        }
      }
    } else {
      // 返回所有 machine 字段
      Object.assign(data, block.machine);
    }
    
    return {
      anchor: block.anchor,
      document: block.document,
      data,
    };
  });
  
  return {
    results: projectedResults,
    count: projectedResults.length,
    query_time_ms: Date.now() - startTime,
  };
}

// ============================================================
// 过滤器匹配
// ============================================================

/**
 * 检查对象是否匹配过滤条件
 */
function matchFilter(machine: MachineBlock, filter: Record<string, FilterValue>): boolean {
  for (const [path, condition] of Object.entries(filter)) {
    const value = getNestedValue(machine, path);
    
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

