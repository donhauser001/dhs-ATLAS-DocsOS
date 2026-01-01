/**
 * Query API 客户端
 */

const API_BASE = '/api/adl';

// ============================================================
// 类型定义
// ============================================================

/**
 * Query - ADL 查询
 * 
 * Phase 1.5: 移除 select 字段
 * Query 只负责「定位」，不负责「取数据」
 */
export interface Query {
  type?: string;
  filter?: Record<string, FilterValue>;
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
 * QueryResult - 查询结果
 * 
 * Phase 1.5: 返回「文档定位」而非「数据替身」
 * 
 * 如需完整 Block 数据，请使用 fetchBlock(anchor, document)
 */
export interface QueryResult {
  // 文档定位（强制）
  anchor: string;
  document: string;
  
  // 人类可读摘要（强制）
  heading: string;
  title: string;
  type: string;
  
  // 可选状态
  status?: string;
}

export interface QueryResponse {
  results: QueryResult[];
  count: number;
  query_time_ms: number;
}

// ============================================================
// API 函数
// ============================================================

/**
 * 执行 ADL 查询
 */
export async function executeQuery(query: Query): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error(`Failed to execute query: ${res.statusText}`);
  }
  
  return res.json();
}
