/**
 * Query API 客户端
 */

const API_BASE = '/api/adl';

// ============================================================
// 类型定义
// ============================================================

export interface Query {
  type?: string;
  filter?: Record<string, FilterValue>;
  select?: string[];
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
  });
  
  if (!res.ok) {
    throw new Error(`Failed to execute query: ${res.statusText}`);
  }
  
  return res.json();
}
