/**
 * Audit Log Service - 审计日志服务
 * 
 * Phase 4.2: 记录用户认证相关的重要操作
 * 
 * 功能：
 * - 登录/登出日志
 * - 密码变更日志
 * - 角色/状态变更日志
 * - 用户创建日志
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { config, ensureDirectories } from '../config.js';

// ============================================================
// 类型定义
// ============================================================

/** 审计事件类型 */
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

/** 审计日志条目 */
export interface AuditLog {
  /** 日志 ID */
  id: string;
  /** 时间戳 */
  timestamp: string;
  /** 事件类型 */
  event_type: AuditEventType;
  /** 操作用户 ID */
  user_id: string | null;
  /** 操作用户名 */
  username: string | null;
  /** 目标用户 ID（如角色变更） */
  target_user_id?: string;
  /** 目标用户名 */
  target_username?: string;
  /** IP 地址 */
  ip_address: string;
  /** User Agent */
  user_agent: string;
  /** 详细信息 */
  details: Record<string, unknown>;
  /** 是否成功 */
  success: boolean;
}

/** 日期日志文件 */
interface DailyLogFile {
  date: string;
  logs: AuditLog[];
}

// ============================================================
// 路径和工具函数
// ============================================================

/** 获取审计日志目录 */
function getAuditLogDir(): string {
  return join(config.atlasDataDir, 'logs', 'audit');
}

/** 获取日期对应的日志文件路径 */
function getLogFilePath(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const monthDir = join(getAuditLogDir(), `${year}-${month}`);
  return join(monthDir, `${year}-${month}-${day}.json`);
}

/** 确保日志目录存在 */
function ensureLogDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/** 生成日志 ID */
function generateLogId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/** 读取日志文件 */
function readLogFile(filePath: string): DailyLogFile {
  if (!existsSync(filePath)) {
    const date = filePath.split('/').pop()?.replace('.json', '') || '';
    return { date, logs: [] };
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    const date = filePath.split('/').pop()?.replace('.json', '') || '';
    return { date, logs: [] };
  }
}

/** 写入日志文件 */
function writeLogFile(filePath: string, data: DailyLogFile): void {
  ensureLogDir(filePath);
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================================
// 核心函数
// ============================================================

/**
 * 记录审计日志
 */
export async function logAuditEvent(
  eventType: AuditEventType,
  options: {
    userId?: string | null;
    username?: string | null;
    targetUserId?: string;
    targetUsername?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
    success?: boolean;
  } = {}
): Promise<AuditLog> {
  const now = new Date();
  const filePath = getLogFilePath(now);
  
  // 创建日志条目
  const log: AuditLog = {
    id: generateLogId(),
    timestamp: now.toISOString(),
    event_type: eventType,
    user_id: options.userId ?? null,
    username: options.username ?? null,
    target_user_id: options.targetUserId,
    target_username: options.targetUsername,
    ip_address: options.ipAddress || 'unknown',
    user_agent: options.userAgent || 'unknown',
    details: options.details || {},
    success: options.success ?? true,
  };
  
  // 读取现有日志
  const logFile = readLogFile(filePath);
  
  // 添加新日志
  logFile.logs.push(log);
  
  // 写入文件
  writeLogFile(filePath, logFile);
  
  console.log(`[AuditLog] ${eventType} - User: ${log.username || log.user_id || 'anonymous'}`);
  
  return log;
}

/**
 * 获取指定日期范围的审计日志
 */
export async function getAuditLogs(options: {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  eventType?: AuditEventType;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLog[]; total: number }> {
  const endDate = options.endDate || new Date();
  const startDate = options.startDate || new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 默认7天
  
  const allLogs: AuditLog[] = [];
  
  // 遍历日期范围内的所有日志文件
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const filePath = getLogFilePath(currentDate);
    const logFile = readLogFile(filePath);
    allLogs.push(...logFile.logs);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // 过滤
  let filteredLogs = allLogs;
  
  if (options.userId) {
    filteredLogs = filteredLogs.filter(log => 
      log.user_id === options.userId || log.target_user_id === options.userId
    );
  }
  
  if (options.eventType) {
    filteredLogs = filteredLogs.filter(log => log.event_type === options.eventType);
  }
  
  // 按时间倒序
  filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const total = filteredLogs.length;
  
  // 分页
  const offset = options.offset || 0;
  const limit = options.limit || 50;
  const pagedLogs = filteredLogs.slice(offset, offset + limit);
  
  return { logs: pagedLogs, total };
}

/**
 * 获取指定用户的审计日志
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  const result = await getAuditLogs({
    userId,
    limit,
  });
  return result.logs;
}

/**
 * 获取审计日志统计
 */
export async function getAuditStats(days: number = 7): Promise<{
  total: number;
  byEventType: Record<AuditEventType, number>;
  byDay: Record<string, number>;
  failedLogins: number;
}> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  
  const result = await getAuditLogs({
    startDate,
    endDate,
    limit: 10000,
  });
  
  const byEventType: Partial<Record<AuditEventType, number>> = {};
  const byDay: Record<string, number> = {};
  let failedLogins = 0;
  
  for (const log of result.logs) {
    // 按事件类型统计
    byEventType[log.event_type] = (byEventType[log.event_type] || 0) + 1;
    
    // 按日期统计
    const day = log.timestamp.substring(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
    
    // 失败登录统计
    if (log.event_type === 'LOGIN_FAILURE') {
      failedLogins++;
    }
  }
  
  return {
    total: result.total,
    byEventType: byEventType as Record<AuditEventType, number>,
    byDay,
    failedLogins,
  };
}

// ============================================================
// 便捷函数（预定义的日志记录器）
// ============================================================

/** 记录登录成功 */
export function logLoginSuccess(
  userId: string,
  username: string,
  ipAddress: string,
  userAgent: string,
  details?: Record<string, unknown>
) {
  return logAuditEvent('LOGIN_SUCCESS', {
    userId,
    username,
    ipAddress,
    userAgent,
    details,
    success: true,
  });
}

/** 记录登录失败 */
export function logLoginFailure(
  username: string,
  ipAddress: string,
  userAgent: string,
  reason: string
) {
  return logAuditEvent('LOGIN_FAILURE', {
    username,
    ipAddress,
    userAgent,
    details: { reason },
    success: false,
  });
}

/** 记录登出 */
export function logLogout(
  userId: string,
  username: string,
  ipAddress: string,
  userAgent: string
) {
  return logAuditEvent('LOGOUT', {
    userId,
    username,
    ipAddress,
    userAgent,
    success: true,
  });
}

/** 记录密码变更 */
export function logPasswordChange(
  userId: string,
  username: string,
  ipAddress: string,
  userAgent: string,
  method: 'self' | 'admin' | 'reset'
) {
  return logAuditEvent('PASSWORD_CHANGE', {
    userId,
    username,
    ipAddress,
    userAgent,
    details: { method },
    success: true,
  });
}

/** 记录状态变更 */
export function logStatusChange(
  operatorId: string,
  operatorName: string,
  targetUserId: string,
  targetUsername: string,
  oldStatus: string,
  newStatus: string,
  ipAddress: string,
  userAgent: string
) {
  return logAuditEvent('STATUS_CHANGE', {
    userId: operatorId,
    username: operatorName,
    targetUserId,
    targetUsername,
    ipAddress,
    userAgent,
    details: { oldStatus, newStatus },
    success: true,
  });
}

/** 记录角色变更 */
export function logRoleChange(
  operatorId: string,
  operatorName: string,
  targetUserId: string,
  targetUsername: string,
  oldRole: string,
  newRole: string,
  ipAddress: string,
  userAgent: string
) {
  return logAuditEvent('ROLE_CHANGE', {
    userId: operatorId,
    username: operatorName,
    targetUserId,
    targetUsername,
    ipAddress,
    userAgent,
    details: { oldRole, newRole },
    success: true,
  });
}

/** 记录账户锁定 */
export function logAccountLocked(
  userId: string,
  username: string,
  reason: string,
  ipAddress: string
) {
  return logAuditEvent('ACCOUNT_LOCKED', {
    userId,
    username,
    ipAddress,
    details: { reason },
    success: true,
  });
}

