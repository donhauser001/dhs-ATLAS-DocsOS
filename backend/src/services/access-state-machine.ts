/**
 * Access State Machine - 登录状态机服务
 * 
 * Phase 4.2: 实现 Person 的 5 态登录状态机
 * 
 * 状态：
 * - none: 无登录资格
 * - eligible: 满足字段合同，可发送邀请
 * - invited: 已发送邀请，等待认领
 * - active: 可正常登录
 * - suspended: 登录权限已被禁用
 * 
 * 状态转换规则：
 * - none → eligible: 自动（满足 verified 合同 + 有可验证联系方式）
 * - eligible → invited: 手动（发送邀请）
 * - invited → active: 外部触发（完成认领）
 * - eligible → active: 手动（管理员直接启用，需超级管理员权限）
 * - active → suspended: 手动（禁用）
 * - suspended → active: 手动（恢复）
 * - invited → eligible: 手动（取消邀请）
 */

import { PersonIndexRecord } from './person-contract.js';
import { updatePersonRecord, getPersonById } from './person-indexer.js';
import { recordAccessStatusChange, recordInviteSent, recordClaim } from './person-audit.js';

// ============================================================
// 类型定义
// ============================================================

/** 登录状态 */
export type AccessStatus = 'none' | 'eligible' | 'invited' | 'active' | 'suspended';

/** 状态转换动作 */
export type AccessAction =
    | 'check_eligibility'   // 检查是否满足 eligible 条件
    | 'send_invite'         // 发送邀请
    | 'cancel_invite'       // 取消邀请
    | 'claim'               // 认领账户
    | 'enable_direct'       // 直接启用（跳过邀请）
    | 'suspend'             // 禁用
    | 'reactivate';         // 恢复

/** 状态转换结果 */
export interface TransitionResult {
    success: boolean;
    fromStatus: AccessStatus;
    toStatus: AccessStatus;
    message: string;
    error?: string;
}

/** 状态转换规则 */
interface TransitionRule {
    from: AccessStatus[];
    to: AccessStatus;
    action: AccessAction;
    requiresPermission?: 'admin' | 'super_admin';
    validate?: (record: PersonIndexRecord) => { valid: boolean; error?: string };
}

// ============================================================
// 状态转换规则定义
// ============================================================

const TRANSITION_RULES: TransitionRule[] = [
    // none → eligible（自动检查）
    {
        from: ['none'],
        to: 'eligible',
        action: 'check_eligibility',
        validate: (record) => {
            if (record.status !== 'verified') {
                return { valid: false, error: 'Person 尚未通过验证' };
            }
            if (!record.email && !record.phone) {
                return { valid: false, error: '缺少可验证的联系方式' };
            }
            return { valid: true };
        },
    },
    
    // eligible → invited（发送邀请）
    {
        from: ['eligible'],
        to: 'invited',
        action: 'send_invite',
        requiresPermission: 'admin',
        validate: (record) => {
            if (!record.email && !record.phone) {
                return { valid: false, error: '缺少可发送邀请的联系方式' };
            }
            return { valid: true };
        },
    },
    
    // invited → active（完成认领）
    {
        from: ['invited'],
        to: 'active',
        action: 'claim',
        // 不需要权限，由 token 验证
    },
    
    // eligible → active（管理员直接启用）
    {
        from: ['eligible'],
        to: 'active',
        action: 'enable_direct',
        requiresPermission: 'super_admin',
    },
    
    // active → suspended（禁用）
    {
        from: ['active'],
        to: 'suspended',
        action: 'suspend',
        requiresPermission: 'admin',
    },
    
    // suspended → active（恢复）
    {
        from: ['suspended'],
        to: 'active',
        action: 'reactivate',
        requiresPermission: 'admin',
    },
    
    // invited → eligible（取消邀请）
    {
        from: ['invited'],
        to: 'eligible',
        action: 'cancel_invite',
        requiresPermission: 'admin',
    },
];

// ============================================================
// 状态转换执行
// ============================================================

/**
 * 检查状态转换是否允许
 */
export function canTransition(
    currentStatus: AccessStatus,
    action: AccessAction,
    record?: PersonIndexRecord
): { allowed: boolean; targetStatus?: AccessStatus; error?: string; requiresPermission?: string } {
    const rule = TRANSITION_RULES.find(
        r => r.from.includes(currentStatus) && r.action === action
    );
    
    if (!rule) {
        return {
            allowed: false,
            error: `不允许从状态 "${currentStatus}" 执行动作 "${action}"`,
        };
    }
    
    // 执行验证
    if (rule.validate && record) {
        const validation = rule.validate(record);
        if (!validation.valid) {
            return {
                allowed: false,
                error: validation.error,
            };
        }
    }
    
    return {
        allowed: true,
        targetStatus: rule.to,
        requiresPermission: rule.requiresPermission,
    };
}

/**
 * 执行状态转换
 */
export function executeTransition(
    personId: string,
    action: AccessAction,
    operator: string,
    operatorName?: string,
    options: {
        skipPermissionCheck?: boolean;
        inviteToken?: string;
        passwordHash?: string;
    } = {}
): TransitionResult {
    const record = getPersonById(personId);
    
    if (!record) {
        return {
            success: false,
            fromStatus: 'none',
            toStatus: 'none',
            message: '',
            error: `Person "${personId}" 不存在`,
        };
    }
    
    const currentStatus = record.access.status as AccessStatus;
    const check = canTransition(currentStatus, action, record);
    
    if (!check.allowed) {
        return {
            success: false,
            fromStatus: currentStatus,
            toStatus: currentStatus,
            message: '',
            error: check.error,
        };
    }
    
    const targetStatus = check.targetStatus!;
    
    // 执行状态转换
    record.access.status = targetStatus;
    
    // 根据动作更新其他字段
    switch (action) {
        case 'send_invite':
            record.access.invited_at = new Date().toISOString();
            // invite_token 由 invitation-service 设置
            break;
            
        case 'claim':
            record.access.claimed_at = new Date().toISOString();
            record.access.enabled = true;
            record.access.contact_verified = true;
            // password_hash 由调用方设置
            break;
            
        case 'cancel_invite':
            record.access.invited_at = undefined;
            // 清除 invite_token
            break;
            
        case 'enable_direct':
            record.access.enabled = true;
            break;
            
        case 'suspend':
            record.access.enabled = false;
            break;
            
        case 'reactivate':
            record.access.enabled = true;
            break;
            
        case 'check_eligibility':
            // 不需要额外操作
            break;
    }
    
    // 保存更新
    updatePersonRecord(record);
    
    // 记录审计
    if (action !== 'check_eligibility') {
        if (action === 'send_invite') {
            recordInviteSent(personId, operator, operatorName);
        } else if (action === 'claim') {
            recordClaim(personId);
        } else {
            recordAccessStatusChange(
                personId,
                currentStatus,
                targetStatus,
                operator,
                operatorName
            );
        }
    }
    
    return {
        success: true,
        fromStatus: currentStatus,
        toStatus: targetStatus,
        message: `状态从 "${currentStatus}" 转换到 "${targetStatus}"`,
    };
}

// ============================================================
// 便捷方法
// ============================================================

/**
 * 检查并更新 eligible 状态
 * 当 Person 满足条件时自动从 none 升级到 eligible
 */
export function checkAndUpdateEligibility(personId: string): TransitionResult | null {
    const record = getPersonById(personId);
    if (!record) return null;
    
    if (record.access.status !== 'none') {
        return null;  // 不是 none 状态，不需要检查
    }
    
    return executeTransition(personId, 'check_eligibility', 'system');
}

/**
 * 发送邀请
 */
export function sendInvite(
    personId: string,
    operator: string,
    operatorName?: string
): TransitionResult {
    return executeTransition(personId, 'send_invite', operator, operatorName);
}

/**
 * 取消邀请
 */
export function cancelInvite(
    personId: string,
    operator: string,
    operatorName?: string
): TransitionResult {
    return executeTransition(personId, 'cancel_invite', operator, operatorName);
}

/**
 * 认领账户
 */
export function claimAccount(
    personId: string,
    passwordHash: string
): TransitionResult {
    const record = getPersonById(personId);
    if (!record) {
        return {
            success: false,
            fromStatus: 'none',
            toStatus: 'none',
            message: '',
            error: `Person "${personId}" 不存在`,
        };
    }
    
    const result = executeTransition(personId, 'claim', personId);
    
    // 设置密码（需要单独处理，因为不应该直接修改索引记录中的敏感数据）
    // 这里假设密码存储在其他地方或通过文档更新
    
    return result;
}

/**
 * 直接启用登录（跳过邀请流程）
 */
export function enableDirect(
    personId: string,
    operator: string,
    operatorName?: string
): TransitionResult {
    return executeTransition(personId, 'enable_direct', operator, operatorName);
}

/**
 * 禁用登录
 */
export function suspendAccess(
    personId: string,
    operator: string,
    operatorName?: string
): TransitionResult {
    return executeTransition(personId, 'suspend', operator, operatorName);
}

/**
 * 恢复登录
 */
export function reactivateAccess(
    personId: string,
    operator: string,
    operatorName?: string
): TransitionResult {
    return executeTransition(personId, 'reactivate', operator, operatorName);
}

// ============================================================
// 状态查询
// ============================================================

/**
 * 获取可用的状态转换动作
 */
export function getAvailableActions(personId: string): {
    action: AccessAction;
    targetStatus: AccessStatus;
    requiresPermission?: string;
}[] {
    const record = getPersonById(personId);
    if (!record) return [];
    
    const currentStatus = record.access.status as AccessStatus;
    const available: {
        action: AccessAction;
        targetStatus: AccessStatus;
        requiresPermission?: string;
    }[] = [];
    
    for (const rule of TRANSITION_RULES) {
        if (rule.from.includes(currentStatus)) {
            // 检查验证条件
            if (rule.validate) {
                const validation = rule.validate(record);
                if (!validation.valid) continue;
            }
            
            available.push({
                action: rule.action,
                targetStatus: rule.to,
                requiresPermission: rule.requiresPermission,
            });
        }
    }
    
    return available;
}

/**
 * 获取状态说明
 */
export function getStatusDescription(status: AccessStatus): {
    name: string;
    description: string;
    color: string;
    icon: string;
} {
    const descriptions: Record<AccessStatus, {
        name: string;
        description: string;
        color: string;
        icon: string;
    }> = {
        none: {
            name: '无登录资格',
            description: '尚未满足登录资格条件',
            color: '#6B7280',
            icon: 'x-circle',
        },
        eligible: {
            name: '可邀请',
            description: '满足字段合同，可发送邀请',
            color: '#3B82F6',
            icon: 'user-check',
        },
        invited: {
            name: '已邀请',
            description: '已发送邀请，等待认领',
            color: '#8B5CF6',
            icon: 'mail',
        },
        active: {
            name: '已激活',
            description: '可正常登录',
            color: '#10B981',
            icon: 'check-circle',
        },
        suspended: {
            name: '已禁用',
            description: '登录权限已被禁用',
            color: '#EF4444',
            icon: 'ban',
        },
    };
    
    return descriptions[status];
}

