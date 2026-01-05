/**
 * Person Invite API - Person 邀请 API
 * 
 * Phase 4.2: 实现登录邀请相关接口
 * 
 * 端点：
 * - POST /api/person/:id/invite - 发送邀请
 * - POST /api/person/:id/resend-invite - 重发邀请
 * - POST /api/person/:id/cancel-invite - 取消邀请
 * - POST /api/person/claim/:token - 认领账户
 * - POST /api/person/:id/enable - 启用登录（直接启用）
 * - POST /api/person/:id/suspend - 禁用登录
 * - POST /api/person/:id/reactivate - 恢复登录
 * - GET /api/person/:id/access-status - 获取登录状态
 * - GET /api/person/:id/available-actions - 获取可用动作
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { optionalAuth } from '../middleware/permission.js';
import { getPersonById } from '../services/person-indexer.js';
import {
    sendInvitation,
    resendInvitation,
    validateInviteToken,
    claimWithToken,
    revokeInviteToken,
    getPendingToken,
    generateMagicLink,
} from '../services/invitation-service.js';
import {
    getAvailableActions,
    getStatusDescription,
    cancelInvite,
    enableDirect,
    suspendAccess,
    reactivateAccess,
} from '../services/access-state-machine.js';
import { getPersonAuditTrail } from '../services/person-audit.js';

const router = Router();

// ============================================================
// 邀请相关端点
// ============================================================

/**
 * POST /api/person/:id/invite
 * 发送邀请
 */
router.post('/:id/invite', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { method, type } = req.body;
        const operator = (req as any).session?.userId || 'system';
        const operatorName = (req as any).session?.userName;
        
        const result = await sendInvitation(id, operator, operatorName, {
            preferredMethod: method,
            type,
        });
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
            });
        }
        
        // 生成 Magic Link
        const magicLink = result.token ? generateMagicLink(result.token) : undefined;
        
        res.json({
            success: true,
            data: {
                message: '邀请已发送',
                method: result.method,
                target: result.target,
                expiresAt: result.expiresAt,
                magicLink,  // 仅在开发环境返回，生产环境应移除
            },
        });
    } catch (error) {
        console.error('[API] POST /person/:id/invite error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send invitation',
        });
    }
});

/**
 * POST /api/person/:id/resend-invite
 * 重发邀请
 */
router.post('/:id/resend-invite', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const operator = (req as any).session?.userId || 'system';
        const operatorName = (req as any).session?.userName;
        
        const result = await resendInvitation(id, operator, operatorName);
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
            });
        }
        
        const magicLink = result.token ? generateMagicLink(result.token) : undefined;
        
        res.json({
            success: true,
            data: {
                message: '邀请已重新发送',
                method: result.method,
                target: result.target,
                expiresAt: result.expiresAt,
                magicLink,
            },
        });
    } catch (error) {
        console.error('[API] POST /person/:id/resend-invite error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resend invitation',
        });
    }
});

/**
 * POST /api/person/:id/cancel-invite
 * 取消邀请
 */
router.post('/:id/cancel-invite', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const operator = (req as any).session?.userId || 'system';
        const operatorName = (req as any).session?.userName;
        
        // 撤销 Token
        revokeInviteToken(id);
        
        // 执行状态转换
        const result = cancelInvite(id, operator, operatorName);
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
            });
        }
        
        res.json({
            success: true,
            data: {
                message: '邀请已取消',
                fromStatus: result.fromStatus,
                toStatus: result.toStatus,
            },
        });
    } catch (error) {
        console.error('[API] POST /person/:id/cancel-invite error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel invitation',
        });
    }
});

/**
 * GET /api/person/:id/pending-invite
 * 获取待使用的邀请 Token 信息
 */
router.get('/:id/pending-invite', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const pendingToken = getPendingToken(id);
        
        if (!pendingToken) {
            return res.json({
                success: true,
                data: {
                    hasPending: false,
                },
            });
        }
        
        res.json({
            success: true,
            data: {
                hasPending: true,
                method: pendingToken.method,
                target: pendingToken.target,
                createdAt: pendingToken.created_at,
                expiresAt: pendingToken.expires_at,
            },
        });
    } catch (error) {
        console.error('[API] GET /person/:id/pending-invite error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get pending invite',
        });
    }
});

// ============================================================
// 认领相关端点
// ============================================================

/**
 * POST /api/person/claim/:token
 * 认领账户
 */
router.post('/claim/:token', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({
                success: false,
                error: '请设置密码',
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: '密码长度至少6位',
            });
        }
        
        // 哈希密码
        const passwordHash = await bcrypt.hash(password, 10);
        
        // 执行认领
        const result = await claimWithToken(token, passwordHash);
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
            });
        }
        
        // 获取更新后的 Person 信息
        const person = getPersonById(result.person_id!);
        
        res.json({
            success: true,
            data: {
                message: '账户认领成功，现在可以登录了',
                person_id: result.person_id,
                display_name: person?.display_name,
            },
        });
    } catch (error) {
        console.error('[API] POST /person/claim/:token error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to claim account',
        });
    }
});

/**
 * GET /api/person/validate-token/:token
 * 验证邀请 Token
 */
router.get('/validate-token/:token', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        
        const validation = validateInviteToken(token);
        
        if (!validation.valid) {
            return res.json({
                success: true,
                data: {
                    valid: false,
                    error: validation.error,
                },
            });
        }
        
        // 获取 Person 信息
        const person = getPersonById(validation.person_id!);
        
        res.json({
            success: true,
            data: {
                valid: true,
                person_id: validation.person_id,
                display_name: person?.display_name,
                email: person?.email,
            },
        });
    } catch (error) {
        console.error('[API] GET /person/validate-token/:token error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate token',
        });
    }
});

// ============================================================
// 登录状态管理端点
// ============================================================

/**
 * POST /api/person/:id/enable
 * 直接启用登录（跳过邀请流程）
 */
router.post('/:id/enable', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const operator = (req as any).session?.userId || 'system';
        const operatorName = (req as any).session?.userName;
        
        const result = enableDirect(id, operator, operatorName);
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
            });
        }
        
        res.json({
            success: true,
            data: {
                message: '登录已启用',
                fromStatus: result.fromStatus,
                toStatus: result.toStatus,
            },
        });
    } catch (error) {
        console.error('[API] POST /person/:id/enable error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to enable login',
        });
    }
});

/**
 * POST /api/person/:id/suspend
 * 禁用登录
 */
router.post('/:id/suspend', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const operator = (req as any).session?.userId || 'system';
        const operatorName = (req as any).session?.userName;
        
        const result = suspendAccess(id, operator, operatorName);
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
            });
        }
        
        res.json({
            success: true,
            data: {
                message: '登录已禁用',
                fromStatus: result.fromStatus,
                toStatus: result.toStatus,
            },
        });
    } catch (error) {
        console.error('[API] POST /person/:id/suspend error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to suspend login',
        });
    }
});

/**
 * POST /api/person/:id/reactivate
 * 恢复登录
 */
router.post('/:id/reactivate', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const operator = (req as any).session?.userId || 'system';
        const operatorName = (req as any).session?.userName;
        
        const result = reactivateAccess(id, operator, operatorName);
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
            });
        }
        
        res.json({
            success: true,
            data: {
                message: '登录已恢复',
                fromStatus: result.fromStatus,
                toStatus: result.toStatus,
            },
        });
    } catch (error) {
        console.error('[API] POST /person/:id/reactivate error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reactivate login',
        });
    }
});

/**
 * GET /api/person/:id/access-status
 * 获取登录状态
 */
router.get('/:id/access-status', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const person = getPersonById(id);
        
        if (!person) {
            return res.status(404).json({
                success: false,
                error: `Person '${id}' not found`,
            });
        }
        
        const status = person.access.status;
        const statusInfo = getStatusDescription(status as any);
        
        res.json({
            success: true,
            data: {
                status,
                ...statusInfo,
                enabled: person.access.enabled,
                contactVerified: person.access.contact_verified,
                invitedAt: person.access.invited_at,
                claimedAt: person.access.claimed_at,
                lastLogin: person.access.last_login,
            },
        });
    } catch (error) {
        console.error('[API] GET /person/:id/access-status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get access status',
        });
    }
});

/**
 * GET /api/person/:id/available-actions
 * 获取可用的登录状态操作
 */
router.get('/:id/available-actions', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const person = getPersonById(id);
        
        if (!person) {
            return res.status(404).json({
                success: false,
                error: `Person '${id}' not found`,
            });
        }
        
        const actions = getAvailableActions(id);
        
        // 映射到 API 动作
        const apiActions = actions.map(a => {
            let endpoint: string;
            let method = 'POST';
            let label: string;
            
            switch (a.action) {
                case 'send_invite':
                    endpoint = `/api/person/${id}/invite`;
                    label = '发送邀请';
                    break;
                case 'cancel_invite':
                    endpoint = `/api/person/${id}/cancel-invite`;
                    label = '取消邀请';
                    break;
                case 'enable_direct':
                    endpoint = `/api/person/${id}/enable`;
                    label = '直接启用';
                    break;
                case 'suspend':
                    endpoint = `/api/person/${id}/suspend`;
                    label = '禁用登录';
                    break;
                case 'reactivate':
                    endpoint = `/api/person/${id}/reactivate`;
                    label = '恢复登录';
                    break;
                default:
                    endpoint = '';
                    label = a.action;
            }
            
            return {
                action: a.action,
                label,
                endpoint,
                method,
                targetStatus: a.targetStatus,
                requiresPermission: a.requiresPermission,
            };
        }).filter(a => a.endpoint);  // 过滤掉没有 endpoint 的动作
        
        res.json({
            success: true,
            data: {
                currentStatus: person.access.status,
                actions: apiActions,
            },
        });
    } catch (error) {
        console.error('[API] GET /person/:id/available-actions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get available actions',
        });
    }
});

export default router;


