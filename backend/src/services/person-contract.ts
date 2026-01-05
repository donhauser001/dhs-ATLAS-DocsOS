/**
 * Person Contract - 核心字段合同检查器
 * 
 * Phase 4.2: 实现 Person 类型的字段合同验证
 * 
 * 职责：
 * 1. 检查 Verified Person 最低合同（display_name + email/phone）
 * 2. 检查 Login Eligible 合同（在 Verified 基础上 + 联系方式已验证 + 启用登录）
 * 3. 检测字段冲突（如重复 email/phone）
 * 4. 生成缺失字段报告
 */

import { Block } from '../adl/types.js';

// ============================================================
// 类型定义
// ============================================================

/** 字段来源 */
export type FieldSource = 'frontmatter' | 'block' | 'content' | 'manual';

/** 提取的 Person 字段 */
export interface ExtractedPersonFields {
    // 核心字段
    display_name?: string;
    email?: string;
    phone?: string;
    
    // 扩展字段
    avatar?: string;
    title?: string;
    company?: string;
    department?: string;
    tags?: string[];
    
    // 访问控制字段
    access_status?: 'none' | 'eligible' | 'invited' | 'active' | 'suspended';
    access_enabled?: boolean;
    contact_verified?: boolean;
    password_hash?: string;
    invite_token?: string;
    invited_at?: string;
    claimed_at?: string;
    last_login?: string;
    
    // 元数据
    _sources: Record<string, FieldSource>;
}

/** 合同检查结果 */
export interface ContractCheckResult {
    /** 是否满足合同 */
    satisfied: boolean;
    /** 置信度 (0-100) */
    confidence: number;
    /** 缺失字段 */
    missingFields: string[];
    /** 问题列表 */
    issues: string[];
    /** 详细检查项 */
    checks: {
        hasDisplayName: boolean;
        hasEmail: boolean;
        hasPhone: boolean;
        hasContact: boolean;  // email OR phone
        contactVerified?: boolean;
        accessEnabled?: boolean;
    };
}

/** Person 索引记录 */
export interface PersonIndexRecord {
    person_id: string;
    source_doc: string;
    status: 'staging' | 'verified';
    confidence: number;
    missing_fields: string[];
    issues: string[];
    
    // 核心字段快照
    display_name: string;
    email?: string;
    phone?: string;
    avatar?: string;
    title?: string;
    company?: string;
    department?: string;
    tags?: string[];
    
    // 访问控制
    access: {
        status: 'none' | 'eligible' | 'invited' | 'active' | 'suspended';
        enabled: boolean;
        contact_verified: boolean;
        invited_at?: string;
        claimed_at?: string;
        last_login?: string;
    };
    
    // 审计追踪
    audit_trail: {
        created_at: string;
        created_by?: string;
        promoted_at?: string;
        promoted_by?: string;
    };
}

// ============================================================
// 字段提取
// ============================================================

/**
 * 从 frontmatter 提取 Person 字段
 */
export function extractFromFrontmatter(
    frontmatter: Record<string, unknown>
): Partial<ExtractedPersonFields> {
    const fields: Partial<ExtractedPersonFields> = {
        _sources: {},
    };
    
    // 直接字段映射
    const directMappings: Array<[string, keyof ExtractedPersonFields]> = [
        ['display_name', 'display_name'],
        ['title', 'display_name'],  // fallback
        ['name', 'display_name'],   // fallback
        ['email', 'email'],
        ['phone', 'phone'],
        ['mobile', 'phone'],        // fallback
        ['avatar', 'avatar'],
        ['job_title', 'title'],
        ['position', 'title'],
        ['company', 'company'],
        ['organization', 'company'],
        ['department', 'department'],
        ['tags', 'tags'],
    ];
    
    for (const [sourceKey, targetKey] of directMappings) {
        if (frontmatter[sourceKey] !== undefined && fields[targetKey] === undefined) {
            (fields as any)[targetKey] = frontmatter[sourceKey];
            fields._sources![targetKey] = 'frontmatter';
        }
    }
    
    // 访问控制字段
    if (frontmatter.access && typeof frontmatter.access === 'object') {
        const access = frontmatter.access as Record<string, unknown>;
        if (access.status) {
            fields.access_status = access.status as any;
            fields._sources!['access_status'] = 'frontmatter';
        }
        if (access.enabled !== undefined) {
            fields.access_enabled = Boolean(access.enabled);
            fields._sources!['access_enabled'] = 'frontmatter';
        }
    }
    
    return fields;
}

/**
 * 从 atlas-data 块提取 Person 字段
 */
export function extractFromBlocks(
    blocks: Block[]
): Partial<ExtractedPersonFields> {
    const fields: Partial<ExtractedPersonFields> = {
        _sources: {},
    };
    
    for (const block of blocks) {
        const machine = block.machine;
        const blockType = machine.type as string;
        
        // 跳过非 person 相关的块
        if (!blockType?.startsWith('person_') && blockType !== 'principal') {
            continue;
        }
        
        // 从 data 字段提取
        const data = machine.data as Record<string, unknown> | undefined;
        if (!data) continue;
        
        // 身份信息块
        if (blockType === 'person_identity' || blockType === 'principal') {
            if (data.display_name && !fields.display_name) {
                fields.display_name = data.display_name as string;
                fields._sources!['display_name'] = 'block';
            }
            if (data.email && !fields.email) {
                fields.email = data.email as string;
                fields._sources!['email'] = 'block';
            }
            if (data.phone && !fields.phone) {
                fields.phone = data.phone as string;
                fields._sources!['phone'] = 'block';
            }
            if (data.avatar && !fields.avatar) {
                fields.avatar = data.avatar as string;
                fields._sources!['avatar'] = 'block';
            }
            if (data.title && !fields.title) {
                fields.title = data.title as string;
                fields._sources!['title'] = 'block';
            }
            if (data.company && !fields.company) {
                fields.company = data.company as string;
                fields._sources!['company'] = 'block';
            }
            if (data.department && !fields.department) {
                fields.department = data.department as string;
                fields._sources!['department'] = 'block';
            }
            if (data.tags && !fields.tags) {
                fields.tags = data.tags as string[];
                fields._sources!['tags'] = 'block';
            }
        }
        
        // 访问控制块
        if (blockType === 'person_access') {
            if (data.access_status) {
                fields.access_status = data.access_status as any;
                fields._sources!['access_status'] = 'block';
            }
            if (data.access_enabled !== undefined) {
                fields.access_enabled = Boolean(data.access_enabled);
                fields._sources!['access_enabled'] = 'block';
            }
            if (data.contact_verified !== undefined) {
                fields.contact_verified = Boolean(data.contact_verified);
                fields._sources!['contact_verified'] = 'block';
            }
            if (data.invited_at) {
                fields.invited_at = data.invited_at as string;
            }
            if (data.claimed_at) {
                fields.claimed_at = data.claimed_at as string;
            }
            if (data.last_login) {
                fields.last_login = data.last_login as string;
            }
        }
        
        // 兼容旧格式：从 machine 顶层提取
        if (blockType === 'principal') {
            if (machine.display_name && !fields.display_name) {
                fields.display_name = machine.display_name as string;
                fields._sources!['display_name'] = 'block';
            }
            
            const identity = machine.identity as Record<string, unknown> | undefined;
            if (identity) {
                if (identity.emails && Array.isArray(identity.emails) && identity.emails.length > 0) {
                    fields.email = identity.emails[0];
                    fields._sources!['email'] = 'block';
                }
                if (identity.phones && Array.isArray(identity.phones) && identity.phones.length > 0) {
                    fields.phone = identity.phones[0];
                    fields._sources!['phone'] = 'block';
                }
            }
        }
    }
    
    return fields;
}

/**
 * 合并多个来源的字段（优先级：block > frontmatter > content）
 */
export function mergeExtractedFields(
    ...fieldSets: Partial<ExtractedPersonFields>[]
): ExtractedPersonFields {
    const merged: ExtractedPersonFields = {
        _sources: {},
    };
    
    // 按优先级从低到高合并
    for (const fields of fieldSets) {
        for (const [key, value] of Object.entries(fields)) {
            if (key === '_sources') continue;
            if (value !== undefined && value !== '' && value !== null) {
                (merged as any)[key] = value;
                if (fields._sources?.[key]) {
                    merged._sources[key] = fields._sources[key];
                }
            }
        }
    }
    
    return merged;
}

// ============================================================
// 合同检查
// ============================================================

/**
 * 检查 Verified Person 合同
 * 
 * 最低要求：
 * 1. display_name 存在
 * 2. email 或 phone 至少一个存在
 */
export function checkVerifiedContract(
    fields: ExtractedPersonFields
): ContractCheckResult {
    const missingFields: string[] = [];
    const issues: string[] = [];
    
    // 检查 display_name
    const hasDisplayName = Boolean(fields.display_name?.trim());
    if (!hasDisplayName) {
        missingFields.push('display_name');
    }
    
    // 检查联系方式
    const hasEmail = Boolean(fields.email?.trim());
    const hasPhone = Boolean(fields.phone?.trim());
    const hasContact = hasEmail || hasPhone;
    
    if (!hasContact) {
        missingFields.push('email 或 phone');
        issues.push('需要至少一种联系方式（邮箱或手机号）');
    }
    
    // 计算置信度
    let confidence = 0;
    if (hasDisplayName) confidence += 50;
    if (hasEmail) confidence += 30;
    if (hasPhone) confidence += 20;
    
    // 额外加分
    if (fields.avatar) confidence += 5;
    if (fields.company) confidence += 5;
    if (fields.title) confidence += 5;
    
    // 上限 100
    confidence = Math.min(confidence, 100);
    
    const satisfied = hasDisplayName && hasContact;
    
    return {
        satisfied,
        confidence,
        missingFields,
        issues,
        checks: {
            hasDisplayName,
            hasEmail,
            hasPhone,
            hasContact,
        },
    };
}

/**
 * 检查 Login Eligible 合同
 * 
 * 在 Verified 基础上，额外要求：
 * 1. 联系方式已验证 (contact_verified = true)
 * 2. 登录已启用 (access_enabled = true)
 */
export function checkLoginEligibleContract(
    fields: ExtractedPersonFields
): ContractCheckResult {
    // 首先检查 Verified 合同
    const verifiedResult = checkVerifiedContract(fields);
    
    if (!verifiedResult.satisfied) {
        return {
            ...verifiedResult,
            checks: {
                ...verifiedResult.checks,
                contactVerified: false,
                accessEnabled: false,
            },
        };
    }
    
    const missingFields = [...verifiedResult.missingFields];
    const issues = [...verifiedResult.issues];
    
    // 检查联系方式是否已验证
    const contactVerified = Boolean(fields.contact_verified);
    if (!contactVerified) {
        issues.push('联系方式尚未验证');
    }
    
    // 检查是否已启用登录
    const accessEnabled = Boolean(fields.access_enabled);
    if (!accessEnabled) {
        issues.push('登录权限未启用');
    }
    
    const satisfied = verifiedResult.satisfied && contactVerified && accessEnabled;
    
    // 调整置信度
    let confidence = verifiedResult.confidence;
    if (contactVerified) confidence = Math.min(confidence + 10, 100);
    if (accessEnabled) confidence = Math.min(confidence + 10, 100);
    
    return {
        satisfied,
        confidence,
        missingFields,
        issues,
        checks: {
            ...verifiedResult.checks,
            contactVerified,
            accessEnabled,
        },
    };
}

// ============================================================
// 索引记录生成
// ============================================================

/**
 * 生成 Person 索引记录
 */
export function createPersonIndexRecord(
    personId: string,
    sourceDoc: string,
    fields: ExtractedPersonFields,
    contractResult: ContractCheckResult
): PersonIndexRecord {
    const now = new Date().toISOString();
    
    return {
        person_id: personId,
        source_doc: sourceDoc,
        status: contractResult.satisfied ? 'verified' : 'staging',
        confidence: contractResult.confidence,
        missing_fields: contractResult.missingFields,
        issues: contractResult.issues,
        
        // 核心字段快照
        display_name: fields.display_name || '',
        email: fields.email,
        phone: fields.phone,
        avatar: fields.avatar,
        title: fields.title,
        company: fields.company,
        department: fields.department,
        tags: fields.tags,
        
        // 访问控制
        access: {
            status: fields.access_status || 'none',
            enabled: fields.access_enabled || false,
            contact_verified: fields.contact_verified || false,
            invited_at: fields.invited_at,
            claimed_at: fields.claimed_at,
            last_login: fields.last_login,
        },
        
        // 审计追踪
        audit_trail: {
            created_at: now,
        },
    };
}

/**
 * 判断 Person 是否可以升级到 Verified
 */
export function canPromoteToVerified(record: PersonIndexRecord): boolean {
    if (record.status === 'verified') return true;
    
    const hasDisplayName = Boolean(record.display_name?.trim());
    const hasContact = Boolean(record.email?.trim() || record.phone?.trim());
    
    return hasDisplayName && hasContact;
}

/**
 * 判断 Person 是否满足登录邀请条件
 */
export function canSendInvite(record: PersonIndexRecord): boolean {
    if (record.status !== 'verified') return false;
    if (record.access.status !== 'eligible') return false;
    
    // 必须有可验证的联系方式
    return Boolean(record.email || record.phone);
}

/**
 * 计算 Person 的登录状态
 * 根据字段自动推断应该处于哪个状态
 */
export function computeAccessStatus(
    record: PersonIndexRecord
): 'none' | 'eligible' | 'invited' | 'active' | 'suspended' {
    // 如果已经是 active 或 suspended，保持不变（除非有其他逻辑）
    if (record.access.status === 'active' && record.access.enabled) {
        return 'active';
    }
    
    if (record.access.status === 'suspended' || !record.access.enabled) {
        if (record.access.claimed_at) {
            return 'suspended';
        }
    }
    
    // 检查是否已完成认领
    if (record.access.claimed_at) {
        return record.access.enabled ? 'active' : 'suspended';
    }
    
    // 检查是否已发送邀请
    if (record.access.invited_at) {
        return 'invited';
    }
    
    // 检查是否满足 eligible 条件（verified + 有联系方式）
    if (record.status === 'verified' && (record.email || record.phone)) {
        return 'eligible';
    }
    
    return 'none';
}

