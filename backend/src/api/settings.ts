/**
 * Settings API 路由
 * 
 * Phase 4.2: 用户管理设置 API
 * - 获取/更新用户设置
 * - 角色管理 CRUD
 * - 邮件服务配置
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/permission.js';
import {
    getUserSettings,
    updateUserSettings,
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    setDefaultRole,
    getPasswordPolicy,
    getEmailSettingsSafe,
    type UserSettings,
    type Role,
} from '../services/user-settings.js';
import {
    testEmailConfig,
    sendEmail,
    getPresetProviders,
    isEmailServiceAvailable,
} from '../services/email-service.js';

const router = Router();

// ============================================================
// 用户管理设置 API
// ============================================================

/**
 * GET /api/settings/user
 * 获取用户管理设置
 */
router.get('/user', async (_req: Request, res: Response) => {
    try {
        const settings = await getUserSettings();

        // 脱敏处理敏感信息
        const safeSettings = {
            ...settings,
            email: await getEmailSettingsSafe(),
        };

        res.json(safeSettings);
    } catch (error) {
        console.error('[Settings API] Failed to get user settings:', error);
        res.status(500).json({ error: 'Failed to get user settings' });
    }
});

/**
 * PUT /api/settings/user
 * 更新用户管理设置
 * 
 * 需要管理员权限
 */
router.put('/user', async (req: Request, res: Response) => {
    // TODO: 添加管理员权限检查
    // const userId = req.session.userId;
    // if (!await isAdmin(userId)) {
    //   return res.status(403).json({ error: 'Forbidden' });
    // }

    try {
        const updates = req.body as Partial<UserSettings>;
        const newSettings = await updateUserSettings(updates);

        // 脱敏处理
        const safeSettings = {
            ...newSettings,
            email: await getEmailSettingsSafe(),
        };

        res.json({
            success: true,
            settings: safeSettings,
        });
    } catch (error) {
        console.error('[Settings API] Failed to update user settings:', error);
        res.status(500).json({ error: 'Failed to update user settings' });
    }
});

/**
 * GET /api/settings/user/password-policy
 * 获取密码策略
 * 
 * 公开接口，用于前端密码强度验证
 */
router.get('/user/password-policy', async (_req: Request, res: Response) => {
    try {
        const policy = await getPasswordPolicy();
        res.json(policy);
    } catch (error) {
        console.error('[Settings API] Failed to get password policy:', error);
        res.status(500).json({ error: 'Failed to get password policy' });
    }
});

// ============================================================
// 角色管理 API
// ============================================================

/**
 * GET /api/settings/user/roles
 * 获取角色列表
 * 
 * 公开接口，用于角色选择器
 */
router.get('/user/roles', async (_req: Request, res: Response) => {
    try {
        const roles = await getRoles();
        const settings = await getUserSettings();

        res.json({
            roles,
            default_role: settings.roles.default_role,
        });
    } catch (error) {
        console.error('[Settings API] Failed to get roles:', error);
        res.status(500).json({ error: 'Failed to get roles' });
    }
});

/**
 * GET /api/settings/user/roles/:roleId
 * 获取单个角色
 */
router.get('/user/roles/:roleId', async (req: Request, res: Response) => {
    try {
        const { roleId } = req.params;
        const role = await getRoleById(roleId);

        if (!role) {
            res.status(404).json({ error: 'Role not found' });
            return;
        }

        res.json(role);
    } catch (error) {
        console.error('[Settings API] Failed to get role:', error);
        res.status(500).json({ error: 'Failed to get role' });
    }
});

/**
 * POST /api/settings/user/roles
 * 创建角色
 * 
 * 需要管理员权限
 */
router.post('/user/roles', async (req: Request, res: Response) => {
    // TODO: 添加管理员权限检查

    try {
        const role = req.body as Role;

        // 验证必填字段
        if (!role.id || !role.name) {
            res.status(400).json({ error: 'Missing required fields: id, name' });
            return;
        }

        await createRole(role);

        res.status(201).json({
            success: true,
            role,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create role';
        console.error('[Settings API] Failed to create role:', error);
        res.status(400).json({ error: message });
    }
});

/**
 * PUT /api/settings/user/roles/:roleId
 * 更新角色
 * 
 * 需要管理员权限
 */
router.put('/user/roles/:roleId', async (req: Request, res: Response) => {
    // TODO: 添加管理员权限检查

    try {
        const { roleId } = req.params;
        const updates = req.body as Partial<Role>;

        await updateRole(roleId, updates);

        const updatedRole = await getRoleById(roleId);

        res.json({
            success: true,
            role: updatedRole,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update role';
        console.error('[Settings API] Failed to update role:', error);
        res.status(400).json({ error: message });
    }
});

/**
 * DELETE /api/settings/user/roles/:roleId
 * 删除角色
 * 
 * 需要管理员权限
 */
router.delete('/user/roles/:roleId', async (req: Request, res: Response) => {
    // TODO: 添加管理员权限检查

    try {
        const { roleId } = req.params;

        await deleteRole(roleId);

        res.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete role';
        console.error('[Settings API] Failed to delete role:', error);
        res.status(400).json({ error: message });
    }
});

/**
 * POST /api/settings/user/roles/:roleId/set-default
 * 设置默认角色
 * 
 * 需要管理员权限
 */
router.post('/user/roles/:roleId/set-default', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { roleId } = req.params;

        await setDefaultRole(roleId);

        res.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to set default role';
        console.error('[Settings API] Failed to set default role:', error);
        res.status(400).json({ error: message });
    }
});

// ============================================================
// 邮件服务 API
// ============================================================

/**
 * GET /api/settings/email/providers
 * 获取预设邮件服务商列表
 */
router.get('/email/providers', async (_req: Request, res: Response) => {
    try {
        const providers = getPresetProviders();
        res.json(providers);
    } catch (error) {
        console.error('[Settings API] Failed to get email providers:', error);
        res.status(500).json({ error: 'Failed to get email providers' });
    }
});

/**
 * GET /api/settings/email/status
 * 获取邮件服务状态
 */
router.get('/email/status', async (_req: Request, res: Response) => {
    try {
        const available = await isEmailServiceAvailable();
        const config = await getEmailSettingsSafe();

        res.json({
            enabled: available,
            provider: config.provider,
            preset_provider: config.preset_provider,
            sender_name: config.sender_name,
            sender_email: config.sender_email,
        });
    } catch (error) {
        console.error('[Settings API] Failed to get email status:', error);
        res.status(500).json({ error: 'Failed to get email status' });
    }
});

/**
 * POST /api/settings/email/test
 * 测试邮件配置
 * 
 * 需要管理员权限
 */
router.post('/email/test', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
    try {
        const result = await testEmailConfig();

        if (result.success) {
            res.json({
                success: true,
                message: '邮件服务连接成功',
                details: result.details,
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error,
            });
        }
    } catch (error) {
        console.error('[Settings API] Failed to test email config:', error);
        res.status(500).json({ error: 'Failed to test email config' });
    }
});

/**
 * POST /api/settings/email/send-test
 * 发送测试邮件
 * 
 * 需要管理员权限
 */
router.post('/email/send-test', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const { to } = req.body;

    if (!to) {
        res.status(400).json({ error: '请提供收件人邮箱地址' });
        return;
    }

    try {
        const result = await sendEmail({
            to,
            subject: 'ATLAS - 测试邮件',
            html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h1 style="color: #333;">🔐 ATLAS 邮件服务测试</h1>
          <p>如果您收到这封邮件，说明邮件服务配置正确！</p>
          <p style="color: #666; font-size: 14px;">发送时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
      `,
        });

        if (result.success) {
            res.json({
                success: true,
                message: '测试邮件已发送',
                messageId: result.messageId,
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error,
            });
        }
    } catch (error) {
        console.error('[Settings API] Failed to send test email:', error);
        res.status(500).json({ error: 'Failed to send test email' });
    }
});

export default router;

