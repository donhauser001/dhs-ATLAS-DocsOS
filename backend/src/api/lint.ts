/**
 * Lint API - 文档校验接口
 * 
 * Phase 3.3: 文档校验系统 API
 * 
 * 端点：
 * GET  /api/lint              - 获取校验报告
 * POST /api/lint/run          - 执行校验
 * GET  /api/lint/document/*   - 校验单个文档
 * GET  /api/lint/config       - 获取校验配置
 * PUT  /api/lint/config       - 更新校验配置
 */

import { Router, Request, Response } from 'express';
import {
    getLintReport,
    lintAllDocuments,
    lintDocumentByPath,
    getLintConfig,
    saveLintConfig,
    clearLintCache,
} from '../services/document-linter.js';
import type { LintConfig } from '../services/document-linter.js';

export const router = Router();

/**
 * GET /api/lint
 * 获取校验报告
 */
router.get('/', async (_req: Request, res: Response) => {
    try {
        const report = await getLintReport();

        if (!report) {
            res.json({
                success: true,
                data: null,
                message: 'No lint report available. Run lint first.',
            });
            return;
        }

        res.json({
            success: true,
            data: report,
        });
    } catch (error) {
        console.error('[Lint API] Failed to get report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get lint report',
        });
    }
});

/**
 * POST /api/lint/run
 * 执行校验
 */
router.post('/run', async (_req: Request, res: Response) => {
    try {
        clearLintCache();
        const report = await lintAllDocuments();

        res.json({
            success: true,
            data: report,
            message: `Linted ${report.summary.total_documents} documents: ${report.summary.passed_count} passed, ${report.summary.failed_count} failed`,
        });
    } catch (error) {
        console.error('[Lint API] Failed to run lint:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to run lint',
        });
    }
});

/**
 * GET /api/lint/document/*
 * 校验单个文档
 */
router.get('/document/*', async (req: Request, res: Response) => {
    try {
        // 获取文档路径（去掉 /document/ 前缀）
        const docPath = req.params[0];

        if (!docPath) {
            res.status(400).json({
                success: false,
                error: 'Document path is required',
            });
            return;
        }

        const issues = await lintDocumentByPath(docPath);
        const hasError = issues.some(i => i.level === 'error');

        res.json({
            success: true,
            data: {
                path: docPath,
                issues,
                passed: !hasError,
                summary: {
                    error_count: issues.filter(i => i.level === 'error').length,
                    warning_count: issues.filter(i => i.level === 'warning').length,
                    info_count: issues.filter(i => i.level === 'info').length,
                    hint_count: issues.filter(i => i.level === 'hint').length,
                },
            },
        });
    } catch (error) {
        console.error('[Lint API] Failed to lint document:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to lint document',
        });
    }
});

/**
 * GET /api/lint/config
 * 获取校验配置
 */
router.get('/config', (_req: Request, res: Response) => {
    try {
        const config = getLintConfig();
        res.json({
            success: true,
            data: config,
        });
    } catch (error) {
        console.error('[Lint API] Failed to get config:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get lint config',
        });
    }
});

/**
 * PUT /api/lint/config
 * 更新校验配置
 */
router.put('/config', (req: Request, res: Response) => {
    try {
        const newConfig = req.body as Partial<LintConfig>;
        const currentConfig = getLintConfig();

        // 合并配置
        const mergedConfig: LintConfig = {
            ...currentConfig,
            ...newConfig,
            rules: {
                ...currentConfig.rules,
                ...(newConfig.rules || {}),
            },
        };

        saveLintConfig(mergedConfig);
        clearLintCache();

        res.json({
            success: true,
            data: mergedConfig,
            message: 'Lint config updated',
        });
    } catch (error) {
        console.error('[Lint API] Failed to update config:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update lint config',
        });
    }
});

/**
 * GET /api/lint/summary
 * 获取校验摘要（轻量级）
 */
router.get('/summary', async (_req: Request, res: Response) => {
    try {
        const report = await getLintReport();

        if (!report) {
            res.json({
                success: true,
                data: {
                    available: false,
                    message: 'No lint report available',
                },
            });
            return;
        }

        res.json({
            success: true,
            data: {
                available: true,
                generated_at: report.generated_at,
                summary: report.summary,
            },
        });
    } catch (error) {
        console.error('[Lint API] Failed to get summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get lint summary',
        });
    }
});

export default router;

