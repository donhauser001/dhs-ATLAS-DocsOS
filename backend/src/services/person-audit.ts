/**
 * Person Audit Service - Person 审计服务
 * 
 * Phase 4.2: 记录 Person 相关的所有审计动作
 * 
 * 职责：
 * 1. 记录状态变更（staging → verified）
 * 2. 记录登录状态变更
 * 3. 记录字段修改
 * 4. 提供审计追踪查询
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { config, ensureDirectories } from '../config.js';

// ============================================================
// 类型定义
// ============================================================

/** 审计动作类型 */
export type PersonAuditAction =
    | 'create'              // 创建
    | 'update'              // 更新字段
    | 'promote'             // staging → verified
    | 'demote'              // verified → staging
    | 'reject'              // 拒绝
    | 'send_invite'         // 发送邀请
    | 'cancel_invite'       // 取消邀请
    | 'claim'               // 认领账户
    | 'enable_login'        // 启用登录
    | 'suspend'             // 禁用登录
    | 'reactivate'          // 恢复登录
    | 'login'               // 登录
    | 'logout'              // 登出
    | 'password_change'     // 密码修改
    | 'contact_verify';     // 联系方式验证

/** 审计记录 */
export interface PersonAuditRecord {
    /** 审计 ID */
    id: string;
    /** Person ID */
    person_id: string;
    /** 动作类型 */
    action: PersonAuditAction;
    /** 操作人（Person ID 或系统标识） */
    operator: string;
    /** 操作人名称 */
    operator_name?: string;
    /** 时间戳 */
    timestamp: string;
    /** 原状态 */
    from_state?: {
        index_status?: 'staging' | 'verified';
        access_status?: string;
    };
    /** 新状态 */
    to_state?: {
        index_status?: 'staging' | 'verified';
        access_status?: string;
    };
    /** 字段变更摘要 */
    field_changes?: Array<{
        field: string;
        old_value?: unknown;
        new_value?: unknown;
    }>;
    /** 原因（可选） */
    reason?: string;
    /** 额外数据 */
    metadata?: Record<string, unknown>;
}

/** 审计日志索引 */
export interface PersonAuditIndex {
    records: PersonAuditRecord[];
    byPerson: Record<string, string[]>;  // person_id -> audit_id[]
    updated_at: string;
}

// ============================================================
// 文件路径
// ============================================================

const AUDIT_DIR = () => join(config.indexDir, 'person');
const AUDIT_PATH = () => join(AUDIT_DIR(), 'audit.json');

/**
 * 确保审计目录存在
 */
function ensureAuditDir(): void {
    const dir = AUDIT_DIR();
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}

// ============================================================
// 审计日志管理
// ============================================================

/**
 * 获取审计索引
 */
export function getAuditIndex(): PersonAuditIndex {
    const path = AUDIT_PATH();
    
    if (!existsSync(path)) {
        return {
            records: [],
            byPerson: {},
            updated_at: new Date().toISOString(),
        };
    }
    
    try {
        return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
        return {
            records: [],
            byPerson: {},
            updated_at: new Date().toISOString(),
        };
    }
}

/**
 * 保存审计索引
 */
function saveAuditIndex(index: PersonAuditIndex): void {
    ensureDirectories();
    ensureAuditDir();
    index.updated_at = new Date().toISOString();
    writeFileSync(AUDIT_PATH(), JSON.stringify(index, null, 2), 'utf-8');
}

/**
 * 生成审计 ID
 */
function generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ============================================================
// 记录审计动作
// ============================================================

/**
 * 记录审计动作
 */
export function recordAudit(
    personId: string,
    action: PersonAuditAction,
    operator: string,
    options: {
        operatorName?: string;
        fromState?: PersonAuditRecord['from_state'];
        toState?: PersonAuditRecord['to_state'];
        fieldChanges?: PersonAuditRecord['field_changes'];
        reason?: string;
        metadata?: Record<string, unknown>;
    } = {}
): PersonAuditRecord {
    const record: PersonAuditRecord = {
        id: generateAuditId(),
        person_id: personId,
        action,
        operator,
        operator_name: options.operatorName,
        timestamp: new Date().toISOString(),
        from_state: options.fromState,
        to_state: options.toState,
        field_changes: options.fieldChanges,
        reason: options.reason,
        metadata: options.metadata,
    };
    
    const index = getAuditIndex();
    
    // 添加记录
    index.records.push(record);
    
    // 更新 byPerson 索引
    if (!index.byPerson[personId]) {
        index.byPerson[personId] = [];
    }
    index.byPerson[personId].push(record.id);
    
    // 保存
    saveAuditIndex(index);
    
    console.log(`[PersonAudit] ${action} recorded for person ${personId} by ${operator}`);
    
    return record;
}

// ============================================================
// 便捷记录方法
// ============================================================

/**
 * 记录状态升级（staging → verified）
 */
export function recordPromotion(
    personId: string,
    operator: string,
    operatorName?: string,
    reason?: string
): PersonAuditRecord {
    return recordAudit(personId, 'promote', operator, {
        operatorName,
        fromState: { index_status: 'staging' },
        toState: { index_status: 'verified' },
        reason,
    });
}

/**
 * 记录状态降级（verified → staging）
 */
export function recordDemotion(
    personId: string,
    operator: string,
    operatorName?: string,
    reason?: string
): PersonAuditRecord {
    return recordAudit(personId, 'demote', operator, {
        operatorName,
        fromState: { index_status: 'verified' },
        toState: { index_status: 'staging' },
        reason,
    });
}

/**
 * 记录拒绝
 */
export function recordRejection(
    personId: string,
    operator: string,
    operatorName?: string,
    reason?: string
): PersonAuditRecord {
    return recordAudit(personId, 'reject', operator, {
        operatorName,
        reason,
    });
}

/**
 * 记录邀请发送
 */
export function recordInviteSent(
    personId: string,
    operator: string,
    operatorName?: string,
    inviteMethod?: 'email' | 'sms'
): PersonAuditRecord {
    return recordAudit(personId, 'send_invite', operator, {
        operatorName,
        fromState: { access_status: 'eligible' },
        toState: { access_status: 'invited' },
        metadata: { invite_method: inviteMethod },
    });
}

/**
 * 记录账户认领
 */
export function recordClaim(personId: string): PersonAuditRecord {
    return recordAudit(personId, 'claim', personId, {
        fromState: { access_status: 'invited' },
        toState: { access_status: 'active' },
    });
}

/**
 * 记录登录状态变更
 */
export function recordAccessStatusChange(
    personId: string,
    fromStatus: string,
    toStatus: string,
    operator: string,
    operatorName?: string,
    reason?: string
): PersonAuditRecord {
    let action: PersonAuditAction;
    
    if (toStatus === 'suspended') {
        action = 'suspend';
    } else if (fromStatus === 'suspended' && toStatus === 'active') {
        action = 'reactivate';
    } else if (toStatus === 'active') {
        action = 'enable_login';
    } else {
        action = 'update';
    }
    
    return recordAudit(personId, action, operator, {
        operatorName,
        fromState: { access_status: fromStatus },
        toState: { access_status: toStatus },
        reason,
    });
}

/**
 * 记录登录
 */
export function recordLogin(
    personId: string,
    metadata?: { ip?: string; userAgent?: string }
): PersonAuditRecord {
    return recordAudit(personId, 'login', personId, {
        metadata,
    });
}

/**
 * 记录字段更新
 */
export function recordFieldUpdate(
    personId: string,
    operator: string,
    fieldChanges: PersonAuditRecord['field_changes'],
    operatorName?: string
): PersonAuditRecord {
    return recordAudit(personId, 'update', operator, {
        operatorName,
        fieldChanges,
    });
}

// ============================================================
// 查询审计记录
// ============================================================

/**
 * 获取 Person 的所有审计记录
 */
export function getPersonAuditTrail(personId: string): PersonAuditRecord[] {
    const index = getAuditIndex();
    const auditIds = index.byPerson[personId] || [];
    
    return auditIds
        .map(id => index.records.find(r => r.id === id))
        .filter((r): r is PersonAuditRecord => r !== undefined)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * 获取 Person 的升级路径（从 staging 到 verified）
 */
export function getPromotionPath(personId: string): PersonAuditRecord | null {
    const trail = getPersonAuditTrail(personId);
    return trail.find(r => r.action === 'promote') || null;
}

/**
 * 获取最近的审计记录
 */
export function getRecentAuditRecords(limit: number = 50): PersonAuditRecord[] {
    const index = getAuditIndex();
    return index.records
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
}

/**
 * 按动作类型筛选审计记录
 */
export function getAuditRecordsByAction(action: PersonAuditAction): PersonAuditRecord[] {
    const index = getAuditIndex();
    return index.records.filter(r => r.action === action);
}

/**
 * 获取审计统计
 */
export function getAuditStats(): {
    totalRecords: number;
    byAction: Record<PersonAuditAction, number>;
    recentActivity: number;  // 最近24小时
} {
    const index = getAuditIndex();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    const byAction: Partial<Record<PersonAuditAction, number>> = {};
    let recentActivity = 0;
    
    for (const record of index.records) {
        byAction[record.action] = (byAction[record.action] || 0) + 1;
        
        if (new Date(record.timestamp).getTime() > oneDayAgo) {
            recentActivity++;
        }
    }
    
    return {
        totalRecords: index.records.length,
        byAction: byAction as Record<PersonAuditAction, number>,
        recentActivity,
    };
}


