/**
 * Person Staging API - Person 审核 API
 * 
 * Phase 4.2: 实现 staging 审核相关接口
 * 
 * 端点：
 * - GET /api/person/staging - 获取待审核列表
 * - GET /api/person/staging/:id - 获取待审核详情
 * - POST /api/person/staging/:id/verify - 确认为 Person 并升级
 * - POST /api/person/staging/:id/complete - 补全字段并升级
 * - POST /api/person/staging/:id/reject - 拒绝并移出
 * - GET /api/person/verified - 获取已验证列表
 * - GET /api/person/verified/:id - 获取已验证详情
 * - POST /api/person/rebuild-index - 重建索引
 * - GET /api/person/stats - 获取统计信息
 */

import { Router, Request, Response } from 'express';
import { optionalAuth } from '../middleware/permission.js';
import {
    rebuildPersonIndex,
    getAllStagingPersons,
    getAllVerifiedPersons,
    getPersonById,
    promoteToVerified,
    demoteToStaging,
    updatePersonRecord,
    searchPersons,
    getPersonIndexStats,
    type PersonIndexRecord,
} from '../services/person-indexer.js';
import {
    recordPromotion,
    recordDemotion,
    recordRejection,
    recordFieldUpdate,
    getPersonAuditTrail,
} from '../services/person-audit.js';
import { getQuarantineStats } from '../services/type-gate.js';

const router = Router();

// ============================================================
// Staging 相关端点
// ============================================================

/**
 * GET /api/person/staging
 * 获取待审核列表
 */
router.get('/staging', optionalAuth, async (_req: Request, res: Response) => {
    try {
        const stagingPersons = getAllStagingPersons();
        
        res.json({
            success: true,
            data: {
                persons: stagingPersons,
                count: stagingPersons.length,
            },
        });
    } catch (error) {
        console.error('[API] GET /person/staging error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch staging persons',
        });
    }
});

/**
 * GET /api/person/staging/:id
 * 获取待审核详情
 */
router.get('/staging/:id', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const person = getPersonById(id);
        
        if (!person) {
            return res.status(404).json({
                success: false,
                error: `Person '${id}' not found`,
            });
        }
        
        if (person.status !== 'staging') {
            return res.status(400).json({
                success: false,
                error: `Person '${id}' is not in staging`,
            });
        }
        
        // 获取审计记录
        const auditTrail = getPersonAuditTrail(id);
        
        res.json({
            success: true,
            data: {
                person,
                audit_trail: auditTrail,
            },
        });
    } catch (error) {
        console.error('[API] GET /person/staging/:id error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch staging person',
        });
    }
});

/**
 * POST /api/person/staging/:id/verify
 * 确认为 Person 并升级到 verified
 */
router.post('/staging/:id/verify', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const operator = (req as any).session?.userId || 'system';
        const operatorName = (req as any).session?.userName;
        
        const person = getPersonById(id);
        
        if (!person) {
            return res.status(404).json({
                success: false,
                error: `Person '${id}' not found`,
            });
        }
        
        if (person.status !== 'staging') {
            return res.status(400).json({
                success: false,
                error: `Person '${id}' is already verified`,
            });
        }
        
        // 检查是否满足升级条件
        if (person.missing_fields.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot verify: missing required fields',
                missing_fields: person.missing_fields,
            });
        }
        
        // 执行升级
        const promoted = promoteToVerified(id, operator);
        
        if (!promoted) {
            return res.status(500).json({
                success: false,
                error: 'Failed to promote person',
            });
        }
        
        // 记录审计
        recordPromotion(id, operator, operatorName, reason);
        
        res.json({
            success: true,
            data: {
                person: promoted,
                message: 'Person verified successfully',
            },
        });
    } catch (error) {
        console.error('[API] POST /person/staging/:id/verify error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify person',
        });
    }
});

/**
 * POST /api/person/staging/:id/complete
 * 补全字段并升级
 */
router.post('/staging/:id/complete', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { fields, reason } = req.body;
        const operator = (req as any).session?.userId || 'system';
        const operatorName = (req as any).session?.userName;
        
        const person = getPersonById(id);
        
        if (!person) {
            return res.status(404).json({
                success: false,
                error: `Person '${id}' not found`,
            });
        }
        
        if (person.status !== 'staging') {
            return res.status(400).json({
                success: false,
                error: `Person '${id}' is already verified`,
            });
        }
        
        // 记录字段变更
        const fieldChanges: Array<{ field: string; old_value?: unknown; new_value?: unknown }> = [];
        
        // 更新字段
        if (fields) {
            if (fields.display_name && fields.display_name !== person.display_name) {
                fieldChanges.push({
                    field: 'display_name',
                    old_value: person.display_name,
                    new_value: fields.display_name,
                });
                person.display_name = fields.display_name;
            }
            
            if (fields.email && fields.email !== person.email) {
                fieldChanges.push({
                    field: 'email',
                    old_value: person.email,
                    new_value: fields.email,
                });
                person.email = fields.email;
            }
            
            if (fields.phone && fields.phone !== person.phone) {
                fieldChanges.push({
                    field: 'phone',
                    old_value: person.phone,
                    new_value: fields.phone,
                });
                person.phone = fields.phone;
            }
            
            if (fields.title !== undefined) {
                fieldChanges.push({
                    field: 'title',
                    old_value: person.title,
                    new_value: fields.title,
                });
                person.title = fields.title;
            }
            
            if (fields.company !== undefined) {
                fieldChanges.push({
                    field: 'company',
                    old_value: person.company,
                    new_value: fields.company,
                });
                person.company = fields.company;
            }
            
            if (fields.department !== undefined) {
                fieldChanges.push({
                    field: 'department',
                    old_value: person.department,
                    new_value: fields.department,
                });
                person.department = fields.department;
            }
        }
        
        // 检查是否满足升级条件
        const hasDisplayName = Boolean(person.display_name?.trim());
        const hasContact = Boolean(person.email?.trim() || person.phone?.trim());
        
        if (!hasDisplayName || !hasContact) {
            // 更新索引记录但不升级
            person.missing_fields = [];
            if (!hasDisplayName) person.missing_fields.push('display_name');
            if (!hasContact) person.missing_fields.push('email 或 phone');
            
            updatePersonRecord(person);
            
            if (fieldChanges.length > 0) {
                recordFieldUpdate(id, operator, fieldChanges, operatorName);
            }
            
            return res.json({
                success: true,
                data: {
                    person,
                    promoted: false,
                    message: 'Fields updated but still missing required fields',
                    missing_fields: person.missing_fields,
                },
            });
        }
        
        // 清除缺失字段
        person.missing_fields = [];
        person.issues = [];
        
        // 执行升级
        person.status = 'verified';
        person.audit_trail.promoted_at = new Date().toISOString();
        person.audit_trail.promoted_by = operator;
        
        // 更新登录状态
        if (person.access.status === 'none') {
            person.access.status = 'eligible';
        }
        
        updatePersonRecord(person);
        
        // 记录审计
        if (fieldChanges.length > 0) {
            recordFieldUpdate(id, operator, fieldChanges, operatorName);
        }
        recordPromotion(id, operator, operatorName, reason);
        
        res.json({
            success: true,
            data: {
                person,
                promoted: true,
                message: 'Person completed and verified successfully',
            },
        });
    } catch (error) {
        console.error('[API] POST /person/staging/:id/complete error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete person',
        });
    }
});

/**
 * POST /api/person/staging/:id/reject
 * 拒绝并移出 Person 体系
 */
router.post('/staging/:id/reject', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const operator = (req as any).session?.userId || 'system';
        const operatorName = (req as any).session?.userName;
        
        const person = getPersonById(id);
        
        if (!person) {
            return res.status(404).json({
                success: false,
                error: `Person '${id}' not found`,
            });
        }
        
        // 记录拒绝
        recordRejection(id, operator, operatorName, reason);
        
        // TODO: 实际从索引中移除（或标记为 rejected）
        // 目前只记录审计，不实际删除
        
        res.json({
            success: true,
            data: {
                message: 'Person rejected',
                reason,
            },
        });
    } catch (error) {
        console.error('[API] POST /person/staging/:id/reject error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reject person',
        });
    }
});

// ============================================================
// Verified 相关端点
// ============================================================

/**
 * GET /api/person/verified
 * 获取已验证列表
 */
router.get('/verified', optionalAuth, async (_req: Request, res: Response) => {
    try {
        const verifiedPersons = getAllVerifiedPersons();
        
        res.json({
            success: true,
            data: {
                persons: verifiedPersons,
                count: verifiedPersons.length,
            },
        });
    } catch (error) {
        console.error('[API] GET /person/verified error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch verified persons',
        });
    }
});

/**
 * GET /api/person/verified/:id
 * 获取已验证详情
 */
router.get('/verified/:id', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const person = getPersonById(id);
        
        if (!person) {
            return res.status(404).json({
                success: false,
                error: `Person '${id}' not found`,
            });
        }
        
        // 获取审计记录
        const auditTrail = getPersonAuditTrail(id);
        
        res.json({
            success: true,
            data: {
                person,
                audit_trail: auditTrail,
            },
        });
    } catch (error) {
        console.error('[API] GET /person/verified/:id error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch verified person',
        });
    }
});

/**
 * POST /api/person/verified/:id/demote
 * 降级到 staging
 */
router.post('/verified/:id/demote', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const operator = (req as any).session?.userId || 'system';
        const operatorName = (req as any).session?.userName;
        
        const person = getPersonById(id);
        
        if (!person) {
            return res.status(404).json({
                success: false,
                error: `Person '${id}' not found`,
            });
        }
        
        if (person.status !== 'verified') {
            return res.status(400).json({
                success: false,
                error: `Person '${id}' is not verified`,
            });
        }
        
        // 执行降级
        const demoted = demoteToStaging(id);
        
        if (!demoted) {
            return res.status(500).json({
                success: false,
                error: 'Failed to demote person',
            });
        }
        
        // 记录审计
        recordDemotion(id, operator, operatorName, reason);
        
        res.json({
            success: true,
            data: {
                person: demoted,
                message: 'Person demoted to staging',
            },
        });
    } catch (error) {
        console.error('[API] POST /person/verified/:id/demote error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to demote person',
        });
    }
});

// ============================================================
// 通用端点
// ============================================================

/**
 * GET /api/person/:id
 * 获取 Person 详情（自动搜索两个索引）
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const person = getPersonById(id);
        
        if (!person) {
            return res.status(404).json({
                success: false,
                error: `Person '${id}' not found`,
            });
        }
        
        // 获取审计记录
        const auditTrail = getPersonAuditTrail(id);
        
        res.json({
            success: true,
            data: {
                person,
                audit_trail: auditTrail,
            },
        });
    } catch (error) {
        console.error('[API] GET /person/:id error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch person',
        });
    }
});

/**
 * GET /api/person/search
 * 搜索 Person
 */
router.get('/search', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { q } = req.query;
        
        if (!q || typeof q !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "q" is required',
            });
        }
        
        const results = searchPersons(q);
        
        res.json({
            success: true,
            data: {
                results,
                count: results.length,
                query: q,
            },
        });
    } catch (error) {
        console.error('[API] GET /person/search error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search persons',
        });
    }
});

/**
 * POST /api/person/rebuild-index
 * 重建索引
 */
router.post('/rebuild-index', optionalAuth, async (_req: Request, res: Response) => {
    try {
        const result = await rebuildPersonIndex();
        
        res.json({
            success: true,
            data: {
                stats: result.stats,
                quarantine: result.quarantine,
            },
        });
    } catch (error) {
        console.error('[API] POST /person/rebuild-index error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to rebuild index',
        });
    }
});

/**
 * GET /api/person/stats
 * 获取统计信息
 */
router.get('/stats', optionalAuth, async (_req: Request, res: Response) => {
    try {
        const indexStats = getPersonIndexStats();
        const quarantineStats = getQuarantineStats();
        
        res.json({
            success: true,
            data: {
                index: indexStats,
                quarantine: quarantineStats,
            },
        });
    } catch (error) {
        console.error('[API] GET /person/stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get stats',
        });
    }
});

export default router;

