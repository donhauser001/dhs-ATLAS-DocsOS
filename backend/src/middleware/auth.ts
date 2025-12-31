import { Request, Response, NextFunction } from 'express';
import { getAuthService } from '../services/auth-service.js';
import { JwtPayload } from '../types/user.js';

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const REPOSITORY_PATH = process.env.REPOSITORY_PATH || './repository';

/**
 * 认证中间件 - 验证 JWT token
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '未登录或登录已过期' },
    });
  }

  const token = authHeader.substring(7);
  const authService = getAuthService(REPOSITORY_PATH);
  const payload = authService.verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: '无效的登录凭证' },
    });
  }

  req.user = payload;
  next();
}

/**
 * 角色检查中间件
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '未登录' },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '权限不足' },
      });
    }

    next();
  };
}

/**
 * 可选认证中间件 - 如果有 token 则验证，否则继续
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const authService = getAuthService(REPOSITORY_PATH);
    const payload = authService.verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}

