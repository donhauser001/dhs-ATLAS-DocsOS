/**
 * Auth Credential Indexer - 用户认证索引服务
 * 
 * Phase 4.2: 基于 __atlas_user_auth__ 严格标识符的用户索引
 * 
 * 职责：
 * 1. 扫描仓库中的所有文档
 * 2. 识别 type: __atlas_user_auth__ 的数据块
 * 3. 构建用户认证索引 (auth-users.json)
 * 4. 维护凭证映射（用户名/邮箱/手机 -> user_id）
 * 5. 支持单文档多用户
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import yaml from 'js-yaml';
import { config, ensureDirectories } from '../config.js';
import { getWorkspaceIndex } from './workspace-service.js';
import { getDocument } from './workspace-registry.js';
import { getRoles, getDefaultRole } from './user-settings.js';

// ============================================================
// 常量定义
// ============================================================

/** 严格标识符 */
export const AUTH_BLOCK_TYPE = '__atlas_user_auth__';

/** 索引版本 */
const INDEX_VERSION = '2.0';

// ============================================================
// 类型定义
// ============================================================

/** 账户状态 */
export type AccountStatus = 'active' | 'pending' | 'disabled' | 'locked' | 'expired';

/** 凭证信息 */
export interface CredentialEntry {
  /** 凭证类型 */
  type: 'username' | 'email' | 'phone';
  /** 对应的用户 ID */
  user_id: string;
}

/** 用户记录 */
export interface UserRecord {
  /** 用户 ID */
  user_id: string;
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string | null;
  /** 手机 */
  phone: string | null;
  /** 密码哈希 */
  password_hash: string;
  /** 角色 ID */
  role: string;
  /** 角色名称 */
  role_name: string;
  /** 账户状态 */
  status: AccountStatus;
  /** 最后登录时间 */
  last_login: string | null;
  /** 过期时间 */
  expired_at: string | null;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
  /** 来源文档路径 */
  _doc_path: string;
  /** 组件 ID */
  _component_id: string | null;
  
  // Phase 4.2: 密码安全策略字段
  /** 密码历史（哈希数组） */
  password_history?: string[];
  /** 密码最后修改时间 */
  password_changed_at?: string | null;
  /** 登录失败次数 */
  failed_attempts?: number;
  /** 锁定截止时间 */
  locked_until?: string | null;
  /** 最后失败时间 */
  last_failed_at?: string | null;
}

/** 索引元数据 */
export interface IndexMeta {
  /** 索引名称 */
  index_name: string;
  /** 索引版本 */
  version: string;
  /** 严格标识符 */
  identifier: string;
  /** 上次全量扫描时间 */
  last_full_scan: string | null;
  /** 上次更新时间 */
  last_update: string;
  /** 统计信息 */
  stats: {
    total_users: number;
    total_documents: number;
    by_status: Record<AccountStatus, number>;
    by_role: Record<string, number>;
  };
}

/** 用户认证索引 */
export interface AuthUsersIndex {
  /** 元数据 */
  _meta: IndexMeta;
  /** 凭证映射 (credential -> CredentialEntry) */
  credentials: Record<string, CredentialEntry>;
  /** 用户记录 (user_id -> UserRecord) */
  users: Record<string, UserRecord>;
}

/** 索引重建结果 */
export interface AuthIndexRebuildResult {
  index: AuthUsersIndex;
  stats: {
    totalDocuments: number;
    scannedDocuments: number;
    totalUsers: number;
    rebuildTime: number;
  };
}

/** 从数据块提取的用户数据 */
interface ExtractedAuthData {
  user_id: string;
  username: string;
  email?: string;
  phone?: string;
  password_hash?: string;
  role?: string;
  status?: AccountStatus;
  last_login?: string;
  expired_at?: string;
  _component?: string;
}

// ============================================================
// 索引文件路径
// ============================================================

const AUTH_INDEX_DIR = () => join(config.indexDir, 'auth');
const AUTH_INDEX_PATH = () => join(AUTH_INDEX_DIR(), 'auth-users.json');
const USER_ID_COUNTER_PATH = () => join(AUTH_INDEX_DIR(), 'user-id-counter.json');

/**
 * 确保认证索引目录存在
 */
function ensureAuthIndexDir(): void {
  const dir = AUTH_INDEX_DIR();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// ============================================================
// 用户 ID 生成
// ============================================================

interface UserIdCounter {
  date: string;
  sequence: number;
}

/**
 * 获取用户 ID 计数器
 */
function getUserIdCounter(): UserIdCounter {
  const path = USER_ID_COUNTER_PATH();
  
  if (existsSync(path)) {
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      // 文件损坏，重新创建
    }
  }
  
  return {
    date: getTodayDateString(),
    sequence: 0,
  };
}

/**
 * 保存用户 ID 计数器
 */
function saveUserIdCounter(counter: UserIdCounter): void {
  ensureAuthIndexDir();
  writeFileSync(USER_ID_COUNTER_PATH(), JSON.stringify(counter, null, 2), 'utf-8');
}

/**
 * 获取今天的日期字符串 (YYYYMMDD)
 */
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * 生成单个用户 ID
 * 格式: U + 日期 + 序号 (如 U20260106001)
 */
export function generateUserId(): string {
  const counter = getUserIdCounter();
  const today = getTodayDateString();
  
  // 如果是新的一天，重置序号
  if (counter.date !== today) {
    counter.date = today;
    counter.sequence = 0;
  }
  
  counter.sequence++;
  saveUserIdCounter(counter);
  
  return `U${today}${counter.sequence.toString().padStart(3, '0')}`;
}

/**
 * 批量生成用户 ID
 */
export function generateUserIds(count: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(generateUserId());
  }
  return ids;
}

// ============================================================
// 文档扫描
// ============================================================

/**
 * 从文档内容中扫描所有用户认证数据块
 * 支持单文档多用户
 */
export function scanDocumentForAuthBlocks(content: string): ExtractedAuthData[] {
  const results: ExtractedAuthData[] = [];
  
  // 匹配 ```yaml 或 ```atlas-data 代码块
  const codeBlockRegex = /```(?:yaml|atlas-data)\n([\s\S]*?)```/g;
  
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const blockContent = match[1];
    
    try {
      const parsed = yaml.load(blockContent) as Record<string, unknown>;
      
      // 检查是否是用户认证数据块
      if (parsed && parsed.type === AUTH_BLOCK_TYPE) {
        const data = (parsed.data || parsed) as Record<string, unknown>;
        
        // 提取用户数据
        const authData: ExtractedAuthData = {
          user_id: (data.user_id || parsed.user_id || '') as string,
          username: (data.username || parsed.username || '') as string,
          email: (data.email || parsed.email) as string | undefined,
          phone: (data.phone || parsed.phone) as string | undefined,
          password_hash: (data.password_hash || parsed.password_hash) as string | undefined,
          role: (data.role || parsed.role) as string | undefined,
          status: (data.status || parsed.status) as AccountStatus | undefined,
          last_login: (data.last_login || parsed.last_login) as string | undefined,
          expired_at: (data.expired_at || parsed.expired_at) as string | undefined,
          _component: (parsed._component) as string | undefined,
        };
        
        // 必须有 user_id 和 username
        if (authData.user_id && authData.username) {
          results.push(authData);
        }
      }
    } catch (e) {
      // 解析失败，跳过这个代码块
      console.warn('[AuthIndexer] Failed to parse YAML block:', e);
    }
  }
  
  return results;
}

// ============================================================
// 索引构建
// ============================================================

/**
 * 重建用户认证索引
 */
export async function rebuildAuthUsersIndex(): Promise<AuthIndexRebuildResult> {
  const startTime = Date.now();
  
  ensureDirectories();
  ensureAuthIndexDir();
  
  console.log('[AuthIndexer] Starting index rebuild...');
  
  // 获取角色列表
  const roles = await getRoles();
  const defaultRole = await getDefaultRole();
  const roleMap = new Map(roles.map(r => [r.id, r.name]));
  
  // 初始化索引结构
  const credentials: Record<string, CredentialEntry> = {};
  const users: Record<string, UserRecord> = {};
  const documentSet = new Set<string>();
  
  // 获取所有文档
  const wsIndex = await getWorkspaceIndex();
  const totalDocuments = wsIndex.documents.length;
  let scannedDocuments = 0;
  
  // 扫描每个文档
  for (const doc of wsIndex.documents) {
    const docInfo = getDocument(doc.path);
    if (!docInfo) continue;
    
    scannedDocuments++;
    
    // 使用原始内容扫描
    const rawContent = docInfo.raw || '';
    const authBlocks = scanDocumentForAuthBlocks(rawContent);
    
    // 处理每个认证数据块
    for (const authData of authBlocks) {
      const now = new Date().toISOString();
      const roleName = roleMap.get(authData.role || defaultRole) || authData.role || defaultRole;
      
      // 创建用户记录
      const userRecord: UserRecord = {
        user_id: authData.user_id,
        username: authData.username,
        email: authData.email || null,
        phone: authData.phone || null,
        password_hash: authData.password_hash || '',
        role: authData.role || defaultRole,
        role_name: roleName,
        status: authData.status || 'pending',
        last_login: authData.last_login || null,
        expired_at: authData.expired_at || null,
        created_at: now,
        updated_at: now,
        _doc_path: doc.path,
        _component_id: authData._component || null,
      };
      
      // 添加到用户表
      users[authData.user_id] = userRecord;
      documentSet.add(doc.path);
      
      // 构建凭证映射
      // 用户名
      credentials[authData.username.toLowerCase()] = {
        type: 'username',
        user_id: authData.user_id,
      };
      
      // 邮箱
      if (authData.email) {
        credentials[authData.email.toLowerCase()] = {
          type: 'email',
          user_id: authData.user_id,
        };
      }
      
      // 手机
      if (authData.phone) {
        // 存储原始格式和纯数字格式
        credentials[authData.phone] = {
          type: 'phone',
          user_id: authData.user_id,
        };
        const phoneNormalized = authData.phone.replace(/\D/g, '');
        if (phoneNormalized !== authData.phone) {
          credentials[phoneNormalized] = {
            type: 'phone',
            user_id: authData.user_id,
          };
        }
      }
    }
  }
  
  // 统计信息
  const byStatus: Record<AccountStatus, number> = {
    active: 0,
    pending: 0,
    disabled: 0,
    locked: 0,
    expired: 0,
  };
  
  const byRole: Record<string, number> = {};
  
  for (const user of Object.values(users)) {
    byStatus[user.status] = (byStatus[user.status] || 0) + 1;
    byRole[user.role] = (byRole[user.role] || 0) + 1;
  }
  
  const now = new Date().toISOString();
  
  // 构建索引
  const index: AuthUsersIndex = {
    _meta: {
      index_name: 'auth-users',
      version: INDEX_VERSION,
      identifier: AUTH_BLOCK_TYPE,
      last_full_scan: now,
      last_update: now,
      stats: {
        total_users: Object.keys(users).length,
        total_documents: documentSet.size,
        by_status: byStatus,
        by_role: byRole,
      },
    },
    credentials,
    users,
  };
  
  // 写入文件
  writeFileSync(AUTH_INDEX_PATH(), JSON.stringify(index, null, 2), 'utf-8');
  
  const rebuildTime = Date.now() - startTime;
  
  console.log(`[AuthIndexer] Index rebuilt in ${rebuildTime}ms:`);
  console.log(`  - Total documents: ${totalDocuments}`);
  console.log(`  - Scanned documents: ${scannedDocuments}`);
  console.log(`  - Total users: ${Object.keys(users).length}`);
  console.log(`  - Credentials: ${Object.keys(credentials).length}`);
  
  return {
    index,
    stats: {
      totalDocuments,
      scannedDocuments,
      totalUsers: Object.keys(users).length,
      rebuildTime,
    },
  };
}

// ============================================================
// 索引读取
// ============================================================

/**
 * 获取用户认证索引
 */
export async function getAuthUsersIndex(): Promise<AuthUsersIndex> {
  const path = AUTH_INDEX_PATH();
  
  if (!existsSync(path)) {
    // 索引不存在，重建
    const result = await rebuildAuthUsersIndex();
    return result.index;
  }
  
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    // 索引损坏，重建
    const result = await rebuildAuthUsersIndex();
    return result.index;
  }
}

/**
 * 通过凭证查找用户
 * @param credential 用户名、邮箱或手机
 */
export async function findUserByCredential(credential: string): Promise<UserRecord | null> {
  const index = await getAuthUsersIndex();
  
  const credentialLower = credential.toLowerCase();
  const credentialEntry = index.credentials[credentialLower];
  
  if (!credentialEntry) {
    return null;
  }
  
  return index.users[credentialEntry.user_id] || null;
}

/**
 * 通过用户 ID 查找用户
 */
export async function findUserById(userId: string): Promise<UserRecord | null> {
  const index = await getAuthUsersIndex();
  return index.users[userId] || null;
}

/**
 * 通过邮箱查找用户
 */
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const index = await getAuthUsersIndex();
  
  const emailLower = email.toLowerCase();
  const credentialEntry = index.credentials[emailLower];
  
  if (!credentialEntry || credentialEntry.type !== 'email') {
    return null;
  }
  
  return index.users[credentialEntry.user_id] || null;
}

/**
 * 获取所有用户列表
 */
export async function getAllUsers(): Promise<UserRecord[]> {
  const index = await getAuthUsersIndex();
  return Object.values(index.users);
}

// ============================================================
// 索引更新
// ============================================================

/**
 * 更新用户最后登录时间
 */
export async function updateLastLogin(userId: string): Promise<void> {
  const index = await getAuthUsersIndex();
  
  if (index.users[userId]) {
    index.users[userId].last_login = new Date().toISOString();
    index.users[userId].updated_at = new Date().toISOString();
    index._meta.last_update = new Date().toISOString();
    
    writeFileSync(AUTH_INDEX_PATH(), JSON.stringify(index, null, 2), 'utf-8');
  }
}

/**
 * 更新用户状态
 */
export async function updateUserStatus(userId: string, status: AccountStatus): Promise<void> {
  const index = await getAuthUsersIndex();
  
  if (index.users[userId]) {
    const oldStatus = index.users[userId].status;
    index.users[userId].status = status;
    index.users[userId].updated_at = new Date().toISOString();
    index._meta.last_update = new Date().toISOString();
    
    // 更新统计
    index._meta.stats.by_status[oldStatus]--;
    index._meta.stats.by_status[status]++;
    
    writeFileSync(AUTH_INDEX_PATH(), JSON.stringify(index, null, 2), 'utf-8');
  }
}

/**
 * 更新用户密码哈希
 */
export async function updateUserPasswordHash(userId: string, passwordHash: string): Promise<void> {
  const index = await getAuthUsersIndex();
  
  if (index.users[userId]) {
    index.users[userId].password_hash = passwordHash;
    index.users[userId].updated_at = new Date().toISOString();
    index._meta.last_update = new Date().toISOString();
    
    writeFileSync(AUTH_INDEX_PATH(), JSON.stringify(index, null, 2), 'utf-8');
  }
}

/**
 * 更新用户密码并记录历史
 * Phase 4.2: 密码安全策略
 */
export async function updateUserPasswordWithHistory(
  userId: string, 
  newPasswordHash: string,
  maxHistoryCount: number = 5
): Promise<void> {
  const index = await getAuthUsersIndex();
  
  if (index.users[userId]) {
    const user = index.users[userId];
    const now = new Date().toISOString();
    
    // 将旧密码添加到历史
    const oldHash = user.password_hash;
    const currentHistory = user.password_history || [];
    const newHistory = [oldHash, ...currentHistory].slice(0, maxHistoryCount);
    
    // 更新密码和历史
    user.password_hash = newPasswordHash;
    user.password_history = newHistory;
    user.password_changed_at = now;
    user.updated_at = now;
    
    index._meta.last_update = now;
    
    writeFileSync(AUTH_INDEX_PATH(), JSON.stringify(index, null, 2), 'utf-8');
  }
}

/**
 * 记录登录失败
 * Phase 4.2: 密码安全策略
 */
export async function recordUserLoginFailure(userId: string): Promise<{
  failedAttempts: number;
  lockedUntil: string | null;
}> {
  const index = await getAuthUsersIndex();
  
  if (index.users[userId]) {
    const user = index.users[userId];
    const now = new Date().toISOString();
    
    user.failed_attempts = (user.failed_attempts || 0) + 1;
    user.last_failed_at = now;
    user.updated_at = now;
    
    index._meta.last_update = now;
    
    writeFileSync(AUTH_INDEX_PATH(), JSON.stringify(index, null, 2), 'utf-8');
    
    return {
      failedAttempts: user.failed_attempts,
      lockedUntil: user.locked_until || null,
    };
  }
  
  return { failedAttempts: 0, lockedUntil: null };
}

/**
 * 锁定用户账户
 * Phase 4.2: 密码安全策略
 */
export async function lockUserAccount(userId: string, lockedUntil: string): Promise<void> {
  const index = await getAuthUsersIndex();
  
  if (index.users[userId]) {
    const user = index.users[userId];
    const now = new Date().toISOString();
    
    user.locked_until = lockedUntil;
    user.status = 'locked';
    user.updated_at = now;
    
    // 更新统计
    const oldStatus = index.users[userId].status;
    if (oldStatus !== 'locked') {
      index._meta.stats.by_status[oldStatus]--;
      index._meta.stats.by_status['locked']++;
    }
    
    index._meta.last_update = now;
    
    writeFileSync(AUTH_INDEX_PATH(), JSON.stringify(index, null, 2), 'utf-8');
  }
}

/**
 * 重置登录失败计数（登录成功时调用）
 * Phase 4.2: 密码安全策略
 */
export async function resetUserLoginFailures(userId: string): Promise<void> {
  const index = await getAuthUsersIndex();
  
  if (index.users[userId]) {
    const user = index.users[userId];
    const now = new Date().toISOString();
    
    user.failed_attempts = 0;
    user.last_failed_at = null;
    user.locked_until = null;
    user.last_login = now;
    user.updated_at = now;
    
    // 如果之前是锁定状态，恢复为 active
    if (user.status === 'locked') {
      index._meta.stats.by_status['locked']--;
      index._meta.stats.by_status['active']++;
      user.status = 'active';
    }
    
    index._meta.last_update = now;
    
    writeFileSync(AUTH_INDEX_PATH(), JSON.stringify(index, null, 2), 'utf-8');
  }
}

/**
 * 获取用户安全状态
 * Phase 4.2: 密码安全策略
 */
export async function getUserSecurityStatus(userId: string): Promise<{
  failedAttempts: number;
  lockedUntil: string | null;
  passwordChangedAt: string | null;
  passwordHistory: string[];
} | null> {
  const index = await getAuthUsersIndex();
  const user = index.users[userId];
  
  if (!user) return null;
  
  return {
    failedAttempts: user.failed_attempts || 0,
    lockedUntil: user.locked_until || null,
    passwordChangedAt: user.password_changed_at || null,
    passwordHistory: user.password_history || [],
  };
}

// ============================================================
// 凭证验证
// ============================================================

/**
 * 验证凭证唯一性
 * @param authData 待验证的认证数据
 * @param excludeUserId 排除的用户 ID（用于更新自己的凭证）
 */
export async function validateCredentialUniqueness(
  authData: { username?: string; email?: string; phone?: string },
  excludeUserId?: string
): Promise<{ valid: boolean; errors: string[] }> {
  const index = await getAuthUsersIndex();
  const errors: string[] = [];
  
  // 检查用户名
  if (authData.username) {
    const existing = index.credentials[authData.username.toLowerCase()];
    if (existing && existing.user_id !== excludeUserId) {
      errors.push(`用户名 "${authData.username}" 已被使用`);
    }
  }
  
  // 检查邮箱
  if (authData.email) {
    const existing = index.credentials[authData.email.toLowerCase()];
    if (existing && existing.user_id !== excludeUserId) {
      errors.push(`邮箱 "${authData.email}" 已被使用`);
    }
  }
  
  // 检查手机
  if (authData.phone) {
    const phoneNormalized = authData.phone.replace(/\D/g, '');
    const existing = index.credentials[phoneNormalized] || index.credentials[authData.phone];
    if (existing && existing.user_id !== excludeUserId) {
      errors.push(`手机号 "${authData.phone}" 已被使用`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 检查用户 ID 是否已存在
 */
export async function checkUserIdExists(userId: string): Promise<boolean> {
  const index = await getAuthUsersIndex();
  return !!index.users[userId];
}

// ============================================================
// 统计函数
// ============================================================

/**
 * 获取索引统计信息
 */
export async function getAuthIndexStats(): Promise<IndexMeta['stats'] & { lastUpdate: string | null }> {
  const index = await getAuthUsersIndex();
  
  return {
    ...index._meta.stats,
    lastUpdate: index._meta.last_update,
  };
}

// ============================================================
// 增量更新函数
// Phase 4.2: 索引增量更新机制
// ============================================================

/**
 * 更新单个文档的用户索引
 * 当文档保存时调用
 */
export async function updateSingleDocument(docPath: string): Promise<{
  added: number;
  updated: number;
  removed: number;
}> {
  const index = await getAuthUsersIndex();
  const result = { added: 0, updated: 0, removed: 0 };
  
  // 获取角色信息
  const roles = await getRoles();
  const defaultRole = await getDefaultRole();
  const roleMap = new Map(roles.map(r => [r.id, r.name]));
  
  // 找到该文档之前关联的所有用户
  const previousUsers = Object.values(index.users).filter(u => u._doc_path === docPath);
  const previousUserIds = new Set(previousUsers.map(u => u.user_id));
  
  // 读取文档内容并扫描认证数据块
  const docInfo = getDocument(docPath);
  const currentAuthBlocks = docInfo ? scanDocumentForAuthBlocks(docInfo.raw || '') : [];
  const currentUserIds = new Set(currentAuthBlocks.map(b => b.user_id));
  
  // 处理当前文档中的认证数据块
  for (const authData of currentAuthBlocks) {
    const now = new Date().toISOString();
    const roleName = roleMap.get(authData.role || defaultRole) || authData.role || defaultRole;
    const existingUser = index.users[authData.user_id];
    
    // 创建/更新用户记录
    const userRecord: UserRecord = {
      user_id: authData.user_id,
      username: authData.username,
      email: authData.email || null,
      phone: authData.phone || null,
      password_hash: authData.password_hash || existingUser?.password_hash || '',
      role: authData.role || defaultRole,
      role_name: roleName,
      status: authData.status || existingUser?.status || 'pending',
      last_login: existingUser?.last_login || null,
      expired_at: authData.expired_at || null,
      created_at: existingUser?.created_at || now,
      updated_at: now,
      _doc_path: docPath,
      _component_id: authData._component || null,
      // 保留安全相关字段
      password_history: existingUser?.password_history,
      password_changed_at: existingUser?.password_changed_at,
      failed_attempts: existingUser?.failed_attempts,
      locked_until: existingUser?.locked_until,
      last_failed_at: existingUser?.last_failed_at,
    };
    
    // 如果是新用户
    if (!existingUser) {
      result.added++;
      index._meta.stats.total_users++;
      index._meta.stats.by_status[userRecord.status]++;
      index._meta.stats.by_role[userRecord.role] = (index._meta.stats.by_role[userRecord.role] || 0) + 1;
    } else {
      result.updated++;
      // 更新状态统计
      if (existingUser.status !== userRecord.status) {
        index._meta.stats.by_status[existingUser.status]--;
        index._meta.stats.by_status[userRecord.status]++;
      }
      // 更新角色统计
      if (existingUser.role !== userRecord.role) {
        index._meta.stats.by_role[existingUser.role]--;
        index._meta.stats.by_role[userRecord.role] = (index._meta.stats.by_role[userRecord.role] || 0) + 1;
      }
      // 清理旧凭证
      clearUserCredentials(index, existingUser);
    }
    
    // 添加用户记录
    index.users[authData.user_id] = userRecord;
    
    // 构建凭证映射
    addUserCredentials(index, userRecord);
  }
  
  // 移除不再存在的用户
  for (const userId of previousUserIds) {
    if (!currentUserIds.has(userId)) {
      const user = index.users[userId];
      if (user) {
        // 更新统计
        index._meta.stats.total_users--;
        index._meta.stats.by_status[user.status]--;
        index._meta.stats.by_role[user.role]--;
        
        // 清理凭证
        clearUserCredentials(index, user);
        
        // 移除用户
        delete index.users[userId];
        result.removed++;
      }
    }
  }
  
  // 更新文档计数
  const docsWithUsers = new Set(Object.values(index.users).map(u => u._doc_path));
  index._meta.stats.total_documents = docsWithUsers.size;
  
  // 保存索引
  index._meta.last_update = new Date().toISOString();
  writeFileSync(AUTH_INDEX_PATH(), JSON.stringify(index, null, 2), 'utf-8');
  
  console.log(`[AuthIndexer] Updated document ${docPath}: +${result.added}, ~${result.updated}, -${result.removed}`);
  
  return result;
}

/**
 * 从索引中移除文档
 * 当文档删除时调用
 */
export async function removeDocumentFromIndex(docPath: string): Promise<number> {
  const index = await getAuthUsersIndex();
  
  // 找到该文档关联的所有用户
  const usersToRemove = Object.values(index.users).filter(u => u._doc_path === docPath);
  
  for (const user of usersToRemove) {
    // 更新统计
    index._meta.stats.total_users--;
    index._meta.stats.by_status[user.status]--;
    index._meta.stats.by_role[user.role]--;
    
    // 清理凭证
    clearUserCredentials(index, user);
    
    // 移除用户
    delete index.users[user.user_id];
  }
  
  // 更新文档计数
  const docsWithUsers = new Set(Object.values(index.users).map(u => u._doc_path));
  index._meta.stats.total_documents = docsWithUsers.size;
  
  // 保存索引
  index._meta.last_update = new Date().toISOString();
  writeFileSync(AUTH_INDEX_PATH(), JSON.stringify(index, null, 2), 'utf-8');
  
  console.log(`[AuthIndexer] Removed document ${docPath}: ${usersToRemove.length} users removed`);
  
  return usersToRemove.length;
}

/**
 * 更新文档路径
 * 当文档移动/重命名时调用
 */
export async function updateDocumentPath(oldPath: string, newPath: string): Promise<number> {
  const index = await getAuthUsersIndex();
  
  // 找到该文档关联的所有用户
  const usersToUpdate = Object.values(index.users).filter(u => u._doc_path === oldPath);
  
  for (const user of usersToUpdate) {
    user._doc_path = newPath;
    user.updated_at = new Date().toISOString();
  }
  
  // 保存索引
  if (usersToUpdate.length > 0) {
    index._meta.last_update = new Date().toISOString();
    writeFileSync(AUTH_INDEX_PATH(), JSON.stringify(index, null, 2), 'utf-8');
  }
  
  console.log(`[AuthIndexer] Updated path ${oldPath} -> ${newPath}: ${usersToUpdate.length} users updated`);
  
  return usersToUpdate.length;
}

// ============================================================
// 辅助函数（增量更新）
// ============================================================

/**
 * 清理用户的所有凭证映射
 */
function clearUserCredentials(index: AuthUsersIndex, user: UserRecord): void {
  // 清理用户名
  const usernameKey = user.username.toLowerCase();
  if (index.credentials[usernameKey]?.user_id === user.user_id) {
    delete index.credentials[usernameKey];
  }
  
  // 清理邮箱
  if (user.email) {
    const emailKey = user.email.toLowerCase();
    if (index.credentials[emailKey]?.user_id === user.user_id) {
      delete index.credentials[emailKey];
    }
  }
  
  // 清理手机
  if (user.phone) {
    if (index.credentials[user.phone]?.user_id === user.user_id) {
      delete index.credentials[user.phone];
    }
    const phoneNormalized = user.phone.replace(/\D/g, '');
    if (index.credentials[phoneNormalized]?.user_id === user.user_id) {
      delete index.credentials[phoneNormalized];
    }
  }
}

/**
 * 添加用户的凭证映射
 */
function addUserCredentials(index: AuthUsersIndex, user: UserRecord): void {
  // 用户名
  index.credentials[user.username.toLowerCase()] = {
    type: 'username',
    user_id: user.user_id,
  };
  
  // 邮箱
  if (user.email) {
    index.credentials[user.email.toLowerCase()] = {
      type: 'email',
      user_id: user.user_id,
    };
  }
  
  // 手机
  if (user.phone) {
    index.credentials[user.phone] = {
      type: 'phone',
      user_id: user.user_id,
    };
    const phoneNormalized = user.phone.replace(/\D/g, '');
    if (phoneNormalized !== user.phone) {
      index.credentials[phoneNormalized] = {
        type: 'phone',
        user_id: user.user_id,
      };
    }
  }
}

