import { Router, Request, Response } from 'express';
import { getAuthService } from '../services/auth-service.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const REPOSITORY_PATH = process.env.REPOSITORY_PATH || './repository';

export const authRouter = Router();

/**
 * POST /api/auth/login
 * 用户登录
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '请输入用户名和密码' },
      });
    }

    const authService = getAuthService(REPOSITORY_PATH);
    const result = await authService.login(username, password);

    if (!result) {
      return res.status(401).json({
        success: false,
        error: { code: 'LOGIN_FAILED', message: '用户名或密码错误' },
      });
    }

    res.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '登录失败' },
    });
  }
});

/**
 * POST /api/auth/logout
 * 用户登出（客户端清除 token 即可）
 */
authRouter.post('/logout', authenticate, (req: Request, res: Response) => {
  // JWT 是无状态的，登出只需要客户端清除 token
  // 如果需要黑名单机制，可以在这里实现
  res.json({
    success: true,
    message: '已登出',
  });
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
authRouter.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const authService = getAuthService(REPOSITORY_PATH);
    const user = await authService.getUserById(req.user!.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '用户不存在' },
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '获取用户信息失败' },
    });
  }
});

/**
 * PUT /api/auth/password
 * 修改密码
 */
authRouter.put('/password', authenticate, async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '请输入旧密码和新密码' },
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '新密码至少6位' },
      });
    }

    const authService = getAuthService(REPOSITORY_PATH);
    const success = await authService.changePassword(
      req.user!.userId,
      oldPassword,
      newPassword
    );

    if (!success) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PASSWORD', message: '旧密码错误' },
      });
    }

    res.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '修改密码失败' },
    });
  }
});

/**
 * GET /api/auth/users
 * 获取所有用户（仅管理员）
 */
authRouter.get(
  '/users',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const authService = getAuthService(REPOSITORY_PATH);
      const users = await authService.getAllUsers();

      res.json({
        success: true,
        users,
        total: users.length,
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: '获取用户列表失败' },
      });
    }
  }
);

/**
 * POST /api/auth/users
 * 创建用户（仅管理员）
 */
authRouter.post(
  '/users',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { 
        username, 
        password, 
        name, 
        email, 
        role, 
        phone,
        id_card,
        emergency_contact,
        emergency_phone,
        department, 
        position,
        bio,
      } = req.body;

      if (!username || !password || !name || !email || !role) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: '缺少必填字段' },
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: '密码至少6位' },
        });
      }

      const authService = getAuthService(REPOSITORY_PATH);
      const user = await authService.createUser({
        username,
        password,
        name,
        email,
        role,
        phone,
        id_card,
        emergency_contact,
        emergency_phone,
        department,
        position,
        bio,
      });

      res.json({
        success: true,
        user,
      });
    } catch (error: any) {
      console.error('Create user error:', error);
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_FAILED', message: error.message || '创建用户失败' },
      });
    }
  }
);

/**
 * PUT /api/auth/users/:id
 * 更新用户（仅管理员）
 */
authRouter.put(
  '/users/:id',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { 
        username,
        name, 
        email, 
        phone,
        id_card,
        emergency_contact,
        emergency_phone,
        department, 
        position,
        bio,
        avatar,
        role, 
        status, 
      } = req.body;

      const authService = getAuthService(REPOSITORY_PATH);
      const user = await authService.updateUser(id, {
        username,
        name,
        email,
        phone,
        id_card,
        emergency_contact,
        emergency_phone,
        department,
        position,
        bio,
        avatar,
        role,
        status,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: '用户不存在' },
        });
      }

      res.json({
        success: true,
        user,
      });
    } catch (error: any) {
      console.error('Update user error:', error);
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: error.message || '更新用户失败' },
      });
    }
  }
);

/**
 * PUT /api/auth/users/:id/password
 * 重置用户密码（仅管理员）
 */
authRouter.put(
  '/users/:id/password',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: '新密码至少6位' },
        });
      }

      const authService = getAuthService(REPOSITORY_PATH);
      const success = await authService.resetPassword(id, newPassword);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: '用户不存在' },
        });
      }

      res.json({
        success: true,
        message: '密码重置成功',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: '重置密码失败' },
      });
    }
  }
);

/**
 * DELETE /api/auth/users/:id
 * 删除用户（仅管理员）
 */
authRouter.delete(
  '/users/:id',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // 不能删除自己
      if (id === req.user!.userId) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_OPERATION', message: '不能删除自己' },
        });
      }

      const authService = getAuthService(REPOSITORY_PATH);
      const success = await authService.deleteUser(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: '用户不存在' },
        });
      }

      res.json({
        success: true,
        message: '用户已删除',
      });
    } catch (error: any) {
      console.error('Delete user error:', error);
      res.status(400).json({
        success: false,
        error: { code: 'DELETE_FAILED', message: error.message || '删除用户失败' },
      });
    }
  }
);

