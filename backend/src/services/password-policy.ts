/**
 * Password Policy Service - 密码策略服务
 * 
 * Phase 4.2: 密码安全策略实现
 * - 密码强度验证
 * - 密码历史检查
 * - 登录失败锁定
 * - 密码过期检查
 */

import bcrypt from 'bcryptjs';
import { getUserSettings, type PasswordSettings, type LoginSettings } from './user-settings.js';

// ============================================================
// 类型定义
// ============================================================

export interface PasswordStrengthResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number;
}

export interface LockoutStatus {
  locked: boolean;
  remainingAttempts: number;
  lockedUntil: string | null;
  minutesRemaining: number | null;
}

export interface PasswordExpiryStatus {
  expired: boolean;
  daysUntilExpiry: number | null;
  expiresAt: string | null;
  shouldWarn: boolean;
}

// ============================================================
// 密码强度验证
// ============================================================

/**
 * 验证密码强度
 */
export async function validatePasswordStrength(password: string): Promise<PasswordStrengthResult> {
  const settings = await getUserSettings();
  const policy = settings.password;
  
  return validatePasswordAgainstPolicy(password, policy);
}

/**
 * 根据策略验证密码
 */
export function validatePasswordAgainstPolicy(
  password: string, 
  policy: PasswordSettings
): PasswordStrengthResult {
  const errors: string[] = [];
  let score = 0;
  
  // 检查最小长度
  if (password.length < policy.min_length) {
    errors.push(`密码长度至少需要 ${policy.min_length} 个字符`);
  } else {
    score += 20;
    // 长度加分
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
  }
  
  // 检查大写字母
  const hasUppercase = /[A-Z]/.test(password);
  if (policy.require_uppercase && !hasUppercase) {
    errors.push('密码必须包含大写字母');
  } else if (hasUppercase) {
    score += 15;
  }
  
  // 检查小写字母
  const hasLowercase = /[a-z]/.test(password);
  if (policy.require_lowercase && !hasLowercase) {
    errors.push('密码必须包含小写字母');
  } else if (hasLowercase) {
    score += 15;
  }
  
  // 检查数字
  const hasNumber = /\d/.test(password);
  if (policy.require_number && !hasNumber) {
    errors.push('密码必须包含数字');
  } else if (hasNumber) {
    score += 15;
  }
  
  // 检查特殊字符
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (policy.require_special && !hasSpecial) {
    errors.push('密码必须包含特殊字符');
  } else if (hasSpecial) {
    score += 15;
  }
  
  // 检查常见弱密码
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('密码过于简单，请使用更复杂的密码');
    score = Math.min(score, 20);
  }
  
  // 计算强度等级
  let strength: 'weak' | 'medium' | 'strong';
  if (score < 40) {
    strength = 'weak';
  } else if (score < 70) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }
  
  return {
    valid: errors.length === 0,
    errors,
    strength,
    score: Math.min(score, 100),
  };
}

// ============================================================
// 密码历史检查
// ============================================================

/**
 * 检查密码是否在历史记录中
 */
export async function checkPasswordHistory(
  newPassword: string,
  passwordHistory: string[]
): Promise<{ inHistory: boolean; message: string | null }> {
  const settings = await getUserSettings();
  const historyCount = settings.password.history_count;
  
  if (historyCount === 0 || passwordHistory.length === 0) {
    return { inHistory: false, message: null };
  }
  
  // 只检查最近 N 次密码
  const recentHistory = passwordHistory.slice(0, historyCount);
  
  for (const oldHash of recentHistory) {
    const matches = await bcrypt.compare(newPassword, oldHash);
    if (matches) {
      return {
        inHistory: true,
        message: `不能使用最近 ${historyCount} 次使用过的密码`,
      };
    }
  }
  
  return { inHistory: false, message: null };
}

/**
 * 添加密码到历史记录
 * 返回更新后的历史记录
 */
export async function addToPasswordHistory(
  passwordHash: string,
  currentHistory: string[]
): Promise<string[]> {
  const settings = await getUserSettings();
  const historyCount = settings.password.history_count;
  
  if (historyCount === 0) {
    return [];
  }
  
  // 将新密码添加到开头
  const newHistory = [passwordHash, ...currentHistory];
  
  // 只保留指定数量的历史记录
  return newHistory.slice(0, historyCount);
}

// ============================================================
// 登录失败锁定
// ============================================================

/**
 * 检查账户锁定状态
 */
export async function checkLockoutStatus(
  failedAttempts: number,
  lockedUntil: string | null
): Promise<LockoutStatus> {
  const settings = await getUserSettings();
  const loginSettings = settings.login;
  
  // 检查是否在锁定期内
  if (lockedUntil) {
    const lockTime = new Date(lockedUntil);
    const now = new Date();
    
    if (lockTime > now) {
      const minutesRemaining = Math.ceil((lockTime.getTime() - now.getTime()) / (1000 * 60));
      return {
        locked: true,
        remainingAttempts: 0,
        lockedUntil,
        minutesRemaining,
      };
    }
  }
  
  // 计算剩余尝试次数
  const remainingAttempts = Math.max(0, loginSettings.lockout_attempts - failedAttempts);
  
  return {
    locked: false,
    remainingAttempts,
    lockedUntil: null,
    minutesRemaining: null,
  };
}

/**
 * 记录登录失败
 * 返回更新后的状态
 */
export async function recordLoginFailure(
  currentFailedAttempts: number
): Promise<{ failedAttempts: number; lockedUntil: string | null; shouldLock: boolean }> {
  const settings = await getUserSettings();
  const loginSettings = settings.login;
  
  const newFailedAttempts = currentFailedAttempts + 1;
  
  // 检查是否需要锁定
  if (newFailedAttempts >= loginSettings.lockout_attempts) {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + loginSettings.lockout_duration_minutes);
    
    return {
      failedAttempts: newFailedAttempts,
      lockedUntil: lockUntil.toISOString(),
      shouldLock: true,
    };
  }
  
  return {
    failedAttempts: newFailedAttempts,
    lockedUntil: null,
    shouldLock: false,
  };
}

/**
 * 重置登录失败计数（登录成功时调用）
 */
export function resetLoginFailures(): { failedAttempts: number; lockedUntil: null } {
  return {
    failedAttempts: 0,
    lockedUntil: null,
  };
}

// ============================================================
// 密码过期检查
// ============================================================

/**
 * 检查密码过期状态
 */
export async function checkPasswordExpiry(
  passwordChangedAt: string | null
): Promise<PasswordExpiryStatus> {
  const settings = await getUserSettings();
  const maxAgeDays = settings.password.max_age_days;
  
  // 如果没有设置过期时间，密码永不过期
  if (!maxAgeDays || maxAgeDays === 0) {
    return {
      expired: false,
      daysUntilExpiry: null,
      expiresAt: null,
      shouldWarn: false,
    };
  }
  
  // 如果没有密码变更时间记录，假设密码刚设置
  if (!passwordChangedAt) {
    return {
      expired: false,
      daysUntilExpiry: maxAgeDays,
      expiresAt: null,
      shouldWarn: false,
    };
  }
  
  const changedDate = new Date(passwordChangedAt);
  const expiresAt = new Date(changedDate);
  expiresAt.setDate(expiresAt.getDate() + maxAgeDays);
  
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    expired: daysUntilExpiry <= 0,
    daysUntilExpiry: Math.max(0, daysUntilExpiry),
    expiresAt: expiresAt.toISOString(),
    shouldWarn: daysUntilExpiry > 0 && daysUntilExpiry <= 7, // 7天内到期时警告
  };
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 获取密码策略摘要（用于前端显示）
 */
export async function getPasswordPolicySummary(): Promise<string[]> {
  const settings = await getUserSettings();
  const policy = settings.password;
  
  const rules: string[] = [];
  
  rules.push(`密码长度至少 ${policy.min_length} 个字符`);
  
  if (policy.require_uppercase) {
    rules.push('必须包含大写字母');
  }
  if (policy.require_lowercase) {
    rules.push('必须包含小写字母');
  }
  if (policy.require_number) {
    rules.push('必须包含数字');
  }
  if (policy.require_special) {
    rules.push('必须包含特殊字符');
  }
  
  if (policy.max_age_days) {
    rules.push(`密码 ${policy.max_age_days} 天后过期`);
  }
  
  if (policy.history_count > 0) {
    rules.push(`不能重复使用最近 ${policy.history_count} 次的密码`);
  }
  
  return rules;
}

