/**
 * Audit Log API Client
 * 
 * Phase 4.2: 审计日志 API 客户端
 */

const API_BASE = '/api/audit-logs';

// ============================================================
// 类型定义
// ============================================================

export type AuditEventType = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'ROLE_CHANGE'
  | 'STATUS_CHANGE'
  | 'USER_CREATE'
  | 'USER_DELETE'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED';

export interface AuditLog {
  id: string;
  timestamp: string;
  event_type: AuditEventType;
  user_id: string | null;
  username: string | null;
  target_user_id?: string;
  target_username?: string;
  ip_address: string;
  user_agent: string;
  details: Record<string, unknown>;
  success: boolean;
}

export interface GetAuditLogsParams {
  startDate?: string;
  endDate?: string;
  userId?: string;
  eventType?: AuditEventType;
  limit?: number;
  offset?: number;
}

export interface AuditLogsResponse {
  success: boolean;
  logs: AuditLog[];
  total: number;
}

export interface AuditStats {
  total: number;
  byEventType: Partial<Record<AuditEventType, number>>;
  byDay: Record<string, number>;
  failedLogins: number;
}

export interface AuditStatsResponse {
  success: boolean;
  stats: AuditStats;
}

// ============================================================
// API 函数
// ============================================================

/**
 * 获取审计日志列表
 */
export async function getAuditLogs(params: GetAuditLogsParams = {}): Promise<AuditLogsResponse> {
  const query = new URLSearchParams();
  
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.userId) query.append('userId', params.userId);
  if (params.eventType) query.append('eventType', params.eventType);
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.offset) query.append('offset', params.offset.toString());
  
  const res = await fetch(`${API_BASE}?${query.toString()}`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error('获取审计日志失败');
  }
  
  return res.json();
}

/**
 * 获取审计日志统计
 */
export async function getAuditStats(days: number = 7): Promise<AuditStatsResponse> {
  const res = await fetch(`${API_BASE}/stats?days=${days}`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error('获取统计失败');
  }
  
  return res.json();
}

/**
 * 获取指定用户的审计日志
 */
export async function getUserAuditLogs(userId: string, limit: number = 50): Promise<AuditLogsResponse> {
  const res = await fetch(`${API_BASE}/user/${encodeURIComponent(userId)}?limit=${limit}`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error('获取用户日志失败');
  }
  
  return res.json();
}

/**
 * 获取当前用户的审计日志
 */
export async function getMyAuditLogs(limit: number = 50): Promise<AuditLogsResponse> {
  const res = await fetch(`${API_BASE}/my?limit=${limit}`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error('获取日志失败');
  }
  
  return res.json();
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 获取事件类型的显示名称
 */
export function getEventTypeName(eventType: AuditEventType): string {
  const names: Record<AuditEventType, string> = {
    LOGIN_SUCCESS: '登录成功',
    LOGIN_FAILURE: '登录失败',
    LOGOUT: '登出',
    PASSWORD_CHANGE: '修改密码',
    PASSWORD_RESET: '重置密码',
    ROLE_CHANGE: '角色变更',
    STATUS_CHANGE: '状态变更',
    USER_CREATE: '创建用户',
    USER_DELETE: '删除用户',
    ACCOUNT_LOCKED: '账户锁定',
    ACCOUNT_UNLOCKED: '账户解锁',
  };
  return names[eventType] || eventType;
}

/**
 * 获取事件类型的颜色
 */
export function getEventTypeColor(eventType: AuditEventType): string {
  const colors: Partial<Record<AuditEventType, string>> = {
    LOGIN_SUCCESS: 'text-green-600',
    LOGIN_FAILURE: 'text-red-600',
    LOGOUT: 'text-gray-600',
    PASSWORD_CHANGE: 'text-blue-600',
    PASSWORD_RESET: 'text-orange-600',
    ROLE_CHANGE: 'text-purple-600',
    STATUS_CHANGE: 'text-yellow-600',
    USER_CREATE: 'text-green-600',
    USER_DELETE: 'text-red-600',
    ACCOUNT_LOCKED: 'text-red-600',
    ACCOUNT_UNLOCKED: 'text-green-600',
  };
  return colors[eventType] || 'text-gray-600';
}

