/**
 * Auth API 路由
 * 
 * Phase 4.2: 完全基于 auth-users.json 索引的认证系统
 * 
 * 功能：
 * - 登录（用户名/邮箱/手机）
 * - 登出
 * - 获取当前用户
 * - 修改密码
 * - 用户ID生成
 * - 凭证唯一性校验
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  findUserByCredential,
  findUserByEmail,
  findUserById,
  updateLastLogin,
  updateUserStatus,
  updateUserPasswordHash,
  updateUserPasswordWithHistory,
  recordUserLoginFailure,
  lockUserAccount,
  resetUserLoginFailures,
  getUserSecurityStatus,
  generateUserId,
  generateUserIds,
  validateCredentialUniqueness,
  checkUserIdExists,
  type AccountStatus,
  type UserRecord,
} from '../services/auth-credential-indexer.js';
import { getRoleById, getUserSettings } from '../services/user-settings.js';
import { requireAuth } from '../middleware/permission.js';
import { 
  createResetToken, 
  verifyResetToken, 
  consumeResetToken,
  getPendingTokenCount,
} from '../services/password-reset.js';
import {
  createActivationToken,
  verifyActivationToken,
  consumeActivationToken,
} from '../services/activation.js';
import { sendPasswordResetEmail, sendActivationEmail } from '../services/email-service.js';
import {
  checkLockoutStatus,
  recordLoginFailure,
  checkPasswordHistory,
  validatePasswordStrength,
  checkPasswordExpiry,
} from '../services/password-policy.js';
import {
  logLoginSuccess,
  logLoginFailure,
  logLogout,
  logPasswordChange,
  logAccountLocked,
} from '../services/audit-log.js';

const router = Router();

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'atlas-secret-key-dev';

// ============================================================
// 类型定义
// ============================================================

interface LoginRequest {
  credential: string;  // 用户名、邮箱或手机
  password: string;
  remember_me?: boolean;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    user_id: string;
    username: string;
    email: string | null;
    role: string;
    role_name: string;
    permissions: Record<string, unknown>;
  };
  error?: string;
  error_code?: string;
}

interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Session 类型已在 middleware/permission.ts 中定义

// ============================================================
// 辅助函数
// ============================================================

/**
 * 获取账户状态对应的错误信息
 */
function getStatusErrorMessage(status: AccountStatus): { message: string; code: string } {
  const messages: Record<AccountStatus, { message: string; code: string }> = {
    active: { message: '', code: '' },
    pending: {
      message: '账户尚未激活，请先完成激活',
      code: 'ACCOUNT_PENDING',
    },
    disabled: {
      message: '账户已被禁用，请联系管理员',
      code: 'ACCOUNT_DISABLED',
    },
    locked: {
      message: '账户已被锁定，请稍后再试或联系管理员',
      code: 'ACCOUNT_LOCKED',
    },
    expired: {
      message: '账户已过期，请联系管理员续期',
      code: 'ACCOUNT_EXPIRED',
    },
  };
  
  return messages[status] || { message: '账户状态异常', code: 'ACCOUNT_ERROR' };
}

/**
 * 检查账户是否过期
 */
function isAccountExpired(user: UserRecord): boolean {
  if (!user.expired_at) return false;
  
  const expiredDate = new Date(user.expired_at);
  return new Date() > expiredDate;
}

/**
 * 生成 JWT Token
 */
function generateToken(user: UserRecord, expiresIn: string = '7d'): string {
  return jwt.sign(
    {
      userId: user.user_id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn } as jwt.SignOptions
  );
}

// ============================================================
// API 端点
// ============================================================

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req: Request, res: Response) => {
  const { credential, password, remember_me }: LoginRequest = req.body;
  
  // 验证参数
  if (!credential || !password) {
    res.status(400).json({
      success: false,
      error: '请输入用户名/邮箱/手机和密码',
      error_code: 'MISSING_CREDENTIALS',
    } as LoginResponse);
    return;
  }
  
  try {
    // 1. 查找用户
    const user = await findUserByCredential(credential);
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: '用户不存在或凭证错误',
        error_code: 'INVALID_CREDENTIALS',
      } as LoginResponse);
      return;
    }
    
    // 2. 获取用户安全状态并检查锁定
    const securityStatus = await getUserSecurityStatus(user.user_id);
    if (securityStatus) {
      const lockoutStatus = await checkLockoutStatus(
        securityStatus.failedAttempts,
        securityStatus.lockedUntil
      );
      
      if (lockoutStatus.locked) {
        res.status(403).json({
          success: false,
          error: `账户已被锁定，请 ${lockoutStatus.minutesRemaining} 分钟后重试`,
          error_code: 'ACCOUNT_LOCKED',
        } as LoginResponse);
        return;
      }
    }
    
    // 3. 检查账户状态
    if (user.status !== 'active') {
      // 如果是 active 以外的状态，检查是否因为过期
      if (user.status !== 'expired' && isAccountExpired(user)) {
        // 自动更新为过期状态
        await updateUserStatus(user.user_id, 'expired');
        user.status = 'expired';
      }
      
      const statusError = getStatusErrorMessage(user.status);
      res.status(403).json({
        success: false,
        error: statusError.message,
        error_code: statusError.code,
      } as LoginResponse);
      return;
    }
    
    // 3. 检查是否过期
    if (isAccountExpired(user)) {
      await updateUserStatus(user.user_id, 'expired');
      const statusError = getStatusErrorMessage('expired');
      res.status(403).json({
        success: false,
        error: statusError.message,
        error_code: statusError.code,
      } as LoginResponse);
      return;
    }
    
    // 4. 验证密码
    if (!user.password_hash) {
      res.status(401).json({
        success: false,
        error: '账户未设置密码',
        error_code: 'NO_PASSWORD',
      } as LoginResponse);
      return;
    }
    
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      // 记录登录失败
      const { failedAttempts } = await recordUserLoginFailure(user.user_id);
      const settings = await getUserSettings();
      const loginSettings = settings.login;
      
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      
      // 检查是否需要锁定
      if (failedAttempts >= loginSettings.lockout_attempts) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + loginSettings.lockout_duration_minutes);
        await lockUserAccount(user.user_id, lockUntil.toISOString());
        
        // 审计日志：账户锁定
        await logAccountLocked(user.user_id, user.username, '登录失败次数过多', ipAddress);
        
        res.status(403).json({
          success: false,
          error: `登录失败次数过多，账户已被锁定 ${loginSettings.lockout_duration_minutes} 分钟`,
          error_code: 'ACCOUNT_LOCKED',
        } as LoginResponse);
        return;
      }
      
      // 审计日志：登录失败
      await logLoginFailure(user.username, ipAddress, userAgent, '密码错误');
      
      const remainingAttempts = loginSettings.lockout_attempts - failedAttempts;
      res.status(401).json({
        success: false,
        error: `密码错误，还剩 ${remainingAttempts} 次尝试机会`,
        error_code: 'INVALID_PASSWORD',
      } as LoginResponse);
      return;
    }
    
    // 5. 登录成功，重置失败计数
    await resetUserLoginFailures(user.user_id);
    
    // 审计日志：登录成功
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    await logLoginSuccess(user.user_id, user.username, ipAddress, userAgent);
    
    // 6. 检查密码过期
    const passwordExpiry = await checkPasswordExpiry(
      securityStatus?.passwordChangedAt || null
    );
    
    // 7. 获取角色权限
    const roleInfo = await getRoleById(user.role);
    const permissions = roleInfo?.permissions || {};
    
    // 8. 生成 Token
    const settings = await getUserSettings();
    const expiresIn = remember_me 
      ? `${settings.login.session_duration_days * 2}d` 
      : `${settings.login.session_duration_days}d`;
    const token = generateToken(user, expiresIn);
    
    // 9. 设置 session
    req.session.userId = user.user_id;
    req.session.authSource = 'index';
    
    // 10. 更新最后登录时间
    await updateLastLogin(user.user_id);
    
    // 11. 返回成功（包含密码过期警告）
    res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        role_name: user.role_name,
        permissions,
      },
      password_warning: passwordExpiry.shouldWarn ? {
        days_remaining: passwordExpiry.daysUntilExpiry,
        expires_at: passwordExpiry.expiresAt,
      } : undefined,
    } as LoginResponse);
    
  } catch (error) {
    console.error('[AuthAPI] Login error:', error);
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后再试',
      error_code: 'SERVER_ERROR',
    } as LoginResponse);
  }
});

/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post('/logout', async (req: Request, res: Response) => {
  const userId = req.session?.userId;
  const user = userId ? await findUserById(userId) : null;
  
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  
  req.session.destroy(async (err) => {
    if (err) {
      res.status(500).json({ success: false, error: '登出失败' });
      return;
    }
    
    // 审计日志：登出
    if (user) {
      await logLogout(user.user_id, user.username, ipAddress, userAgent);
    }
    
    res.json({ success: true, message: '已成功登出' });
  });
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const userId = req.session?.userId;
  
  if (!userId) {
    res.status(401).json({ error: '未登录' });
    return;
  }
  
  try {
    const user = await findUserById(userId);
    
    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({ error: '用户不存在' });
      return;
    }
    
    const roleInfo = await getRoleById(user.role);
    const permissions = roleInfo?.permissions || {};
    
    res.json({
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        role_name: user.role_name,
        status: user.status,
        last_login: user.last_login,
        permissions,
      },
    });
  } catch (error) {
    console.error('[AuthAPI] Get me error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

/**
 * POST /api/auth/change-password
 * 修改密码
 */
router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  const userId = req.session?.userId;
  const { current_password, new_password }: ChangePasswordRequest = req.body;
  
  if (!userId) {
    res.status(401).json({ error: '未登录' });
    return;
  }
  
  if (!current_password || !new_password) {
    res.status(400).json({ error: '请提供当前密码和新密码' });
    return;
  }
  
  try {
    const user = await findUserById(userId);
    
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    
    // 验证当前密码
    const passwordValid = await bcrypt.compare(current_password, user.password_hash);
    if (!passwordValid) {
      res.status(401).json({ error: '当前密码错误' });
      return;
    }
    
    // 验证新密码强度
    const strengthResult = await validatePasswordStrength(new_password);
    if (!strengthResult.valid) {
      res.status(400).json({ 
        error: '新密码不符合要求',
        details: strengthResult.errors,
      });
      return;
    }
    
    // 检查密码历史
    const securityStatus = await getUserSecurityStatus(userId);
    if (securityStatus) {
      const historyCheck = await checkPasswordHistory(
        new_password,
        securityStatus.passwordHistory
      );
      if (historyCheck.inHistory) {
        res.status(400).json({
          error: historyCheck.message,
          error_code: 'PASSWORD_IN_HISTORY',
        });
        return;
      }
    }
    
    // 生成新密码哈希
    const newHash = await bcrypt.hash(new_password, 10);
    
    // 获取密码策略中的历史记录数量
    const settings = await getUserSettings();
    const historyCount = settings.password.history_count;
    
    // 更新密码并记录历史
    await updateUserPasswordWithHistory(userId, newHash, historyCount);
    
    // 审计日志：密码变更
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    await logPasswordChange(user.user_id, user.username, ipAddress, userAgent, 'self');
    
    res.json({ success: true, message: '密码修改成功' });
    
  } catch (error) {
    console.error('[AuthAPI] Change password error:', error);
    res.status(500).json({ error: '密码修改失败' });
  }
});

/**
 * GET /api/auth/generate-user-id
 * 生成单个用户 ID
 */
router.get('/generate-user-id', async (_req: Request, res: Response) => {
  try {
    const userId = generateUserId();
    res.json({ user_id: userId });
  } catch (error) {
    console.error('[AuthAPI] Generate user ID error:', error);
    res.status(500).json({ error: '生成用户ID失败' });
  }
});

/**
 * POST /api/auth/generate-user-ids
 * 批量生成用户 ID
 */
router.post('/generate-user-ids', async (req: Request, res: Response) => {
  const { count = 1 } = req.body;
  
  if (typeof count !== 'number' || count < 1 || count > 100) {
    res.status(400).json({ error: '数量必须在 1-100 之间' });
    return;
  }
  
  try {
    const userIds = generateUserIds(count);
    res.json({ user_ids: userIds });
  } catch (error) {
    console.error('[AuthAPI] Generate user IDs error:', error);
    res.status(500).json({ error: '生成用户ID失败' });
  }
});

/**
 * POST /api/auth/validate-credential
 * 验证凭证唯一性
 */
router.post('/validate-credential', async (req: Request, res: Response) => {
  const { username, email, phone, exclude_user_id } = req.body;
  
  try {
    const result = await validateCredentialUniqueness(
      { username, email, phone },
      exclude_user_id
    );
    
    res.json(result);
  } catch (error) {
    console.error('[AuthAPI] Validate credential error:', error);
    res.status(500).json({ 
      valid: false, 
      errors: ['验证失败，请稍后再试'],
    });
  }
});

/**
 * GET /api/auth/check-user-id/:userId
 * 检查用户 ID 是否已存在
 */
router.get('/check-user-id/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  try {
    const exists = await checkUserIdExists(userId);
    res.json({ exists });
  } catch (error) {
    console.error('[AuthAPI] Check user ID error:', error);
    res.status(500).json({ error: '检查失败' });
  }
});

/**
 * GET /api/auth/password-policy
 * 获取密码策略
 */
router.get('/password-policy', async (_req: Request, res: Response) => {
  try {
    const settings = await getUserSettings();
    res.json(settings.password);
  } catch (error) {
    console.error('[AuthAPI] Get password policy error:', error);
    res.status(500).json({ error: '获取密码策略失败' });
  }
});

// ============================================================
// 密码重置
// ============================================================

/**
 * POST /api/auth/forgot-password
 * 发送密码重置邮件
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  
  if (!email) {
    res.status(400).json({ success: false, error: '请提供邮箱地址' });
    return;
  }
  
  try {
    // 检查发送频率
    const pendingCount = getPendingTokenCount(email);
    if (pendingCount >= 3) {
      res.status(429).json({
        success: false,
        error: '发送次数过多，请稍后再试',
      });
      return;
    }
    
    // 查找用户
    const user = await findUserByEmail(email);
    
    // 即使用户不存在也返回成功，防止邮箱枚举攻击
    if (!user) {
      res.json({
        success: true,
        message: '如果该邮箱已注册，重置链接将发送到您的邮箱',
      });
      return;
    }
    
    // 创建重置 Token
    const token = createResetToken(user.user_id, email);
    
    // 发送邮件
    const settings = await getUserSettings();
    const resetLink = `${settings.email.site_url}/reset-password/${token}`;
    
    await sendPasswordResetEmail(email, {
      username: user.username,
      resetLink,
      expiresIn: '1小时',
    });
    
    res.json({
      success: true,
      message: '如果该邮箱已注册，重置链接将发送到您的邮箱',
    });
    
  } catch (error) {
    console.error('[AuthAPI] Forgot password error:', error);
    res.status(500).json({ success: false, error: '发送失败，请稍后再试' });
  }
});

/**
 * GET /api/auth/verify-reset-token/:token
 * 验证重置 Token
 */
router.get('/verify-reset-token/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  
  try {
    const result = verifyResetToken(token);
    
    if (!result.valid) {
      res.status(400).json({ valid: false, error: '链接无效或已过期' });
      return;
    }
    
    res.json({
      valid: true,
      email: result.email,
    });
    
  } catch (error) {
    console.error('[AuthAPI] Verify reset token error:', error);
    res.status(500).json({ valid: false, error: '验证失败' });
  }
});

/**
 * POST /api/auth/reset-password
 * 重置密码
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, new_password } = req.body;
  
  if (!token || !new_password) {
    res.status(400).json({ success: false, error: '参数不完整' });
    return;
  }
  
  try {
    // 验证密码强度
    const strengthResult = await validatePasswordStrength(new_password);
    if (!strengthResult.valid) {
      res.status(400).json({
        success: false,
        error: '密码不符合要求',
        details: strengthResult.errors,
      });
      return;
    }
    
    // 验证 Token（不消费，先检查）
    const tokenData = verifyResetToken(token);
    if (!tokenData.valid || !tokenData.userId) {
      res.status(400).json({ success: false, error: '链接无效或已过期' });
      return;
    }
    
    // 检查密码历史
    const securityStatus = await getUserSecurityStatus(tokenData.userId);
    if (securityStatus) {
      const historyCheck = await checkPasswordHistory(
        new_password,
        securityStatus.passwordHistory
      );
      if (historyCheck.inHistory) {
        res.status(400).json({
          success: false,
          error: historyCheck.message,
          error_code: 'PASSWORD_IN_HISTORY',
        });
        return;
      }
    }
    
    // 消费 Token
    const consumeResult = consumeResetToken(token);
    
    if (!consumeResult.success || !consumeResult.userId) {
      res.status(400).json({ success: false, error: '链接无效或已过期' });
      return;
    }
    
    // 获取密码策略中的历史记录数量
    const settings = await getUserSettings();
    const historyCount = settings.password.history_count;
    
    // 获取用户信息用于日志记录
    const user = await findUserById(consumeResult.userId);
    
    // 更新密码并记录历史
    const newHash = await bcrypt.hash(new_password, 10);
    await updateUserPasswordWithHistory(consumeResult.userId, newHash, historyCount);
    
    // 审计日志：密码重置
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    if (user) {
      await logPasswordChange(user.user_id, user.username, ipAddress, userAgent, 'reset');
    }
    
    res.json({ success: true, message: '密码重置成功，请使用新密码登录' });
    
  } catch (error) {
    console.error('[AuthAPI] Reset password error:', error);
    res.status(500).json({ success: false, error: '重置失败，请稍后再试' });
  }
});

// ============================================================
// 账户激活
// ============================================================

/**
 * POST /api/auth/send-activation
 * 发送激活邮件
 */
router.post('/send-activation', async (req: Request, res: Response) => {
  const { email } = req.body;
  
  if (!email) {
    res.status(400).json({ success: false, error: '请提供邮箱地址' });
    return;
  }
  
  try {
    // 查找用户
    const user = await findUserByEmail(email);
    
    if (!user) {
      res.status(404).json({ success: false, error: '未找到该邮箱对应的账户' });
      return;
    }
    
    if (user.status === 'active') {
      res.status(400).json({ success: false, error: '账户已激活，无需重复激活' });
      return;
    }
    
    if (user.status !== 'pending') {
      res.status(400).json({ success: false, error: '账户状态异常，无法激活' });
      return;
    }
    
    // 创建激活 Token
    const token = createActivationToken(user.user_id, email);
    
    // 发送邮件
    const settings = await getUserSettings();
    const activationLink = `${settings.email.site_url}/activate/${token}`;
    
    await sendActivationEmail(email, {
      username: user.username,
      activationLink,
      expiresIn: '24小时',
    });
    
    res.json({
      success: true,
      message: '激活邮件已发送，请查收',
    });
    
  } catch (error) {
    console.error('[AuthAPI] Send activation error:', error);
    res.status(500).json({ success: false, error: '发送失败，请稍后再试' });
  }
});

/**
 * GET /api/auth/verify-activation-token/:token
 * 验证激活 Token
 */
router.get('/verify-activation-token/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  
  try {
    const result = verifyActivationToken(token);
    
    if (!result.valid) {
      res.status(400).json({ valid: false, error: '链接无效或已过期' });
      return;
    }
    
    res.json({
      valid: true,
      email: result.email,
    });
    
  } catch (error) {
    console.error('[AuthAPI] Verify activation token error:', error);
    res.status(500).json({ valid: false, error: '验证失败' });
  }
});

/**
 * POST /api/auth/activate
 * 激活账户
 */
router.post('/activate', async (req: Request, res: Response) => {
  const { token } = req.body;
  
  if (!token) {
    res.status(400).json({ success: false, error: '缺少激活令牌' });
    return;
  }
  
  try {
    // 消费 Token
    const consumeResult = consumeActivationToken(token);
    
    if (!consumeResult.success || !consumeResult.userId) {
      res.status(400).json({ success: false, error: '链接无效或已过期' });
      return;
    }
    
    // 更新用户状态
    await updateUserStatus(consumeResult.userId, 'active');
    
    res.json({ success: true, message: '账户激活成功，请登录' });
    
  } catch (error) {
    console.error('[AuthAPI] Activate error:', error);
    res.status(500).json({ success: false, error: '激活失败，请稍后再试' });
  }
});

export default router;
