/**
 * 密码重置服务
 * Phase 4.2: Token 管理和验证
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { config } from '../config.js';

// ============================================================
// 类型定义
// ============================================================

interface ResetToken {
  token: string;
  user_id: string;
  email: string;
  created_at: string;
  expires_at: string;
  used: boolean;
}

interface ResetTokenStore {
  tokens: ResetToken[];
}

// ============================================================
// 配置
// ============================================================

const TOKEN_EXPIRY_HOURS = 1; // Token 有效期 1 小时
const TOKENS_FILE = 'password-reset-tokens.json';

// ============================================================
// 辅助函数
// ============================================================

function getTokensFilePath(): string {
  return path.join(config.indexDir, 'auth', TOKENS_FILE);
}

function loadTokens(): ResetTokenStore {
  const filePath = getTokensFilePath();
  
  if (!fs.existsSync(filePath)) {
    return { tokens: [] };
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { tokens: [] };
  }
}

function saveTokens(store: ResetTokenStore): void {
  const filePath = getTokensFilePath();
  const dir = path.dirname(filePath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function cleanExpiredTokens(store: ResetTokenStore): void {
  const now = new Date();
  store.tokens = store.tokens.filter(t => {
    const expiresAt = new Date(t.expires_at);
    return expiresAt > now && !t.used;
  });
}

// ============================================================
// 公开 API
// ============================================================

/**
 * 创建密码重置 Token
 */
export function createResetToken(userId: string, email: string): string {
  const store = loadTokens();
  
  // 清理过期 Token
  cleanExpiredTokens(store);
  
  // 移除该用户之前的未使用 Token
  store.tokens = store.tokens.filter(t => t.user_id !== userId || t.used);
  
  // 创建新 Token
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  
  store.tokens.push({
    token,
    user_id: userId,
    email,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    used: false,
  });
  
  saveTokens(store);
  
  return token;
}

/**
 * 验证重置 Token
 */
export function verifyResetToken(token: string): { valid: boolean; userId?: string; email?: string } {
  const store = loadTokens();
  
  const tokenData = store.tokens.find(t => t.token === token);
  
  if (!tokenData) {
    return { valid: false };
  }
  
  // 检查是否过期
  const now = new Date();
  const expiresAt = new Date(tokenData.expires_at);
  
  if (expiresAt <= now) {
    return { valid: false };
  }
  
  // 检查是否已使用
  if (tokenData.used) {
    return { valid: false };
  }
  
  return { 
    valid: true, 
    userId: tokenData.user_id,
    email: tokenData.email,
  };
}

/**
 * 使用 Token（标记为已使用）
 */
export function consumeResetToken(token: string): { success: boolean; userId?: string } {
  const store = loadTokens();
  
  const tokenData = store.tokens.find(t => t.token === token);
  
  if (!tokenData) {
    return { success: false };
  }
  
  // 检查是否过期
  const now = new Date();
  const expiresAt = new Date(tokenData.expires_at);
  
  if (expiresAt <= now || tokenData.used) {
    return { success: false };
  }
  
  // 标记为已使用
  tokenData.used = true;
  saveTokens(store);
  
  return { success: true, userId: tokenData.user_id };
}

/**
 * 获取用户的待处理 Token 数量（用于限制频率）
 */
export function getPendingTokenCount(email: string): number {
  const store = loadTokens();
  const now = new Date();
  
  return store.tokens.filter(t => {
    const expiresAt = new Date(t.expires_at);
    return t.email === email && !t.used && expiresAt > now;
  }).length;
}

