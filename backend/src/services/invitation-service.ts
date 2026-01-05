/**
 * Invitation Service - 邀请机制服务
 * 
 * Phase 4.2: 实现登录邀请相关功能
 * 
 * 职责：
 * 1. 生成邀请 token
 * 2. 管理 token 生命周期
 * 3. 验证 token
 * 4. 生成 Magic Link
 * 5. 生成 OTP（可选）
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomBytes, createHash } from 'crypto';
import { config, ensureDirectories } from '../config.js';
import { getPersonById, updatePersonRecord } from './person-indexer.js';
import { sendInvite, claimAccount } from './access-state-machine.js';
import type { PersonIndexRecord } from './person-contract.js';

// ============================================================
// 类型定义
// ============================================================

/** 邀请 Token 记录 */
export interface InviteTokenRecord {
    token: string;
    person_id: string;
    type: 'magic_link' | 'otp';
    created_at: string;
    expires_at: string;
    used: boolean;
    used_at?: string;
    method: 'email' | 'sms';
    target: string;  // email 或 phone
}

/** 邀请 Token 存储 */
export interface InviteTokenStore {
    tokens: Record<string, InviteTokenRecord>;
    updated_at: string;
}

/** 发送邀请结果 */
export interface SendInviteResult {
    success: boolean;
    token?: string;
    method?: 'email' | 'sms';
    target?: string;
    expiresAt?: string;
    error?: string;
}

/** 验证 Token 结果 */
export interface ValidateTokenResult {
    valid: boolean;
    person_id?: string;
    error?: string;
    record?: InviteTokenRecord;
}

// ============================================================
// 配置
// ============================================================

const TOKEN_EXPIRY_HOURS = 24 * 7;  // 7 天
const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;

// ============================================================
// 文件路径
// ============================================================

const TOKEN_STORE_PATH = () => join(config.indexDir, 'person', 'invite-tokens.json');

/**
 * 确保目录存在
 */
function ensureTokenStoreDir(): void {
    const dir = join(config.indexDir, 'person');
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}

// ============================================================
// Token 存储管理
// ============================================================

/**
 * 获取 Token 存储
 */
function getTokenStore(): InviteTokenStore {
    const path = TOKEN_STORE_PATH();
    
    if (!existsSync(path)) {
        return {
            tokens: {},
            updated_at: new Date().toISOString(),
        };
    }
    
    try {
        return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
        return {
            tokens: {},
            updated_at: new Date().toISOString(),
        };
    }
}

/**
 * 保存 Token 存储
 */
function saveTokenStore(store: InviteTokenStore): void {
    ensureDirectories();
    ensureTokenStoreDir();
    store.updated_at = new Date().toISOString();
    writeFileSync(TOKEN_STORE_PATH(), JSON.stringify(store, null, 2), 'utf-8');
}

// ============================================================
// Token 生成
// ============================================================

/**
 * 生成安全的 Token
 */
function generateSecureToken(): string {
    return randomBytes(32).toString('hex');
}

/**
 * 生成 OTP
 */
function generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < OTP_LENGTH; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        otp += digits[randomIndex];
    }
    return otp;
}

/**
 * 计算过期时间
 */
function calculateExpiry(type: 'magic_link' | 'otp'): string {
    const now = new Date();
    if (type === 'otp') {
        now.setMinutes(now.getMinutes() + OTP_EXPIRY_MINUTES);
    } else {
        now.setHours(now.getHours() + TOKEN_EXPIRY_HOURS);
    }
    return now.toISOString();
}

// ============================================================
// 邀请发送
// ============================================================

/**
 * 为 Person 发送邀请
 */
export async function sendInvitation(
    personId: string,
    operator: string,
    operatorName?: string,
    options: {
        preferredMethod?: 'email' | 'sms';
        type?: 'magic_link' | 'otp';
    } = {}
): Promise<SendInviteResult> {
    const person = getPersonById(personId);
    
    if (!person) {
        return {
            success: false,
            error: `Person "${personId}" 不存在`,
        };
    }
    
    // 检查状态
    if (person.access.status !== 'eligible') {
        return {
            success: false,
            error: `Person 当前状态为 "${person.access.status}"，不能发送邀请`,
        };
    }
    
    // 确定发送方式
    let method: 'email' | 'sms';
    let target: string;
    
    if (options.preferredMethod === 'sms' && person.phone) {
        method = 'sms';
        target = person.phone;
    } else if (person.email) {
        method = 'email';
        target = person.email;
    } else if (person.phone) {
        method = 'sms';
        target = person.phone;
    } else {
        return {
            success: false,
            error: '缺少可发送邀请的联系方式',
        };
    }
    
    // 生成 Token
    const type = options.type || 'magic_link';
    const token = type === 'otp' ? generateOTP() : generateSecureToken();
    const expiresAt = calculateExpiry(type);
    
    // 保存 Token
    const tokenRecord: InviteTokenRecord = {
        token,
        person_id: personId,
        type,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        used: false,
        method,
        target,
    };
    
    const store = getTokenStore();
    
    // 清除该 Person 的旧 Token
    for (const [key, record] of Object.entries(store.tokens)) {
        if (record.person_id === personId && !record.used) {
            delete store.tokens[key];
        }
    }
    
    // 添加新 Token
    store.tokens[token] = tokenRecord;
    saveTokenStore(store);
    
    // 更新 Person 状态
    const transitionResult = sendInvite(personId, operator, operatorName);
    
    if (!transitionResult.success) {
        // 回滚 Token
        delete store.tokens[token];
        saveTokenStore(store);
        
        return {
            success: false,
            error: transitionResult.error,
        };
    }
    
    // TODO: 实际发送邮件或短信
    // 这里只是模拟，实际实现需要集成邮件/短信服务
    console.log(`[InvitationService] Invitation sent to ${target} via ${method}`);
    console.log(`[InvitationService] Token: ${token}`);
    console.log(`[InvitationService] Expires: ${expiresAt}`);
    
    return {
        success: true,
        token,
        method,
        target,
        expiresAt,
    };
}

/**
 * 生成 Magic Link URL
 */
export function generateMagicLink(token: string, baseUrl?: string): string {
    const base = baseUrl || 'http://localhost:5173';  // 默认前端地址
    return `${base}/claim?token=${token}`;
}

// ============================================================
// Token 验证
// ============================================================

/**
 * 验证邀请 Token
 */
export function validateInviteToken(token: string): ValidateTokenResult {
    const store = getTokenStore();
    const record = store.tokens[token];
    
    if (!record) {
        return {
            valid: false,
            error: '无效的邀请码',
        };
    }
    
    if (record.used) {
        return {
            valid: false,
            error: '邀请码已被使用',
        };
    }
    
    const now = new Date();
    const expiresAt = new Date(record.expires_at);
    
    if (now > expiresAt) {
        return {
            valid: false,
            error: '邀请码已过期',
        };
    }
    
    return {
        valid: true,
        person_id: record.person_id,
        record,
    };
}

/**
 * 使用 Token 认领账户
 */
export async function claimWithToken(
    token: string,
    passwordHash: string
): Promise<{
    success: boolean;
    person_id?: string;
    error?: string;
}> {
    // 验证 Token
    const validation = validateInviteToken(token);
    
    if (!validation.valid) {
        return {
            success: false,
            error: validation.error,
        };
    }
    
    const personId = validation.person_id!;
    const person = getPersonById(personId);
    
    if (!person) {
        return {
            success: false,
            error: 'Person 不存在',
        };
    }
    
    // 执行认领
    const claimResult = claimAccount(personId, passwordHash);
    
    if (!claimResult.success) {
        return {
            success: false,
            error: claimResult.error,
        };
    }
    
    // 标记 Token 为已使用
    const store = getTokenStore();
    store.tokens[token].used = true;
    store.tokens[token].used_at = new Date().toISOString();
    saveTokenStore(store);
    
    // TODO: 保存密码哈希到文档
    // 这里需要更新实际的 Person 文档
    
    return {
        success: true,
        person_id: personId,
    };
}

// ============================================================
// Token 管理
// ============================================================

/**
 * 取消邀请 Token
 */
export function revokeInviteToken(personId: string): boolean {
    const store = getTokenStore();
    let revoked = false;
    
    for (const [token, record] of Object.entries(store.tokens)) {
        if (record.person_id === personId && !record.used) {
            delete store.tokens[token];
            revoked = true;
        }
    }
    
    if (revoked) {
        saveTokenStore(store);
    }
    
    return revoked;
}

/**
 * 获取 Person 的待使用 Token
 */
export function getPendingToken(personId: string): InviteTokenRecord | null {
    const store = getTokenStore();
    
    for (const record of Object.values(store.tokens)) {
        if (record.person_id === personId && !record.used) {
            // 检查是否过期
            const now = new Date();
            const expiresAt = new Date(record.expires_at);
            if (now <= expiresAt) {
                return record;
            }
        }
    }
    
    return null;
}

/**
 * 清理过期 Token
 */
export function cleanupExpiredTokens(): number {
    const store = getTokenStore();
    const now = new Date();
    let cleaned = 0;
    
    for (const [token, record] of Object.entries(store.tokens)) {
        const expiresAt = new Date(record.expires_at);
        if (now > expiresAt || record.used) {
            delete store.tokens[token];
            cleaned++;
        }
    }
    
    if (cleaned > 0) {
        saveTokenStore(store);
        console.log(`[InvitationService] Cleaned up ${cleaned} expired tokens`);
    }
    
    return cleaned;
}

/**
 * 重新发送邀请
 */
export async function resendInvitation(
    personId: string,
    operator: string,
    operatorName?: string
): Promise<SendInviteResult> {
    const person = getPersonById(personId);
    
    if (!person) {
        return {
            success: false,
            error: `Person "${personId}" 不存在`,
        };
    }
    
    // 检查状态必须是 invited
    if (person.access.status !== 'invited') {
        return {
            success: false,
            error: `只能对已邀请状态的 Person 重发邀请`,
        };
    }
    
    // 撤销旧 Token
    revokeInviteToken(personId);
    
    // 确定发送方式
    let method: 'email' | 'sms';
    let target: string;
    
    if (person.email) {
        method = 'email';
        target = person.email;
    } else if (person.phone) {
        method = 'sms';
        target = person.phone;
    } else {
        return {
            success: false,
            error: '缺少可发送邀请的联系方式',
        };
    }
    
    // 生成新 Token
    const token = generateSecureToken();
    const expiresAt = calculateExpiry('magic_link');
    
    // 保存 Token
    const tokenRecord: InviteTokenRecord = {
        token,
        person_id: personId,
        type: 'magic_link',
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        used: false,
        method,
        target,
    };
    
    const store = getTokenStore();
    store.tokens[token] = tokenRecord;
    saveTokenStore(store);
    
    // TODO: 实际发送邮件或短信
    console.log(`[InvitationService] Invitation resent to ${target} via ${method}`);
    console.log(`[InvitationService] Token: ${token}`);
    
    return {
        success: true,
        token,
        method,
        target,
        expiresAt,
    };
}

