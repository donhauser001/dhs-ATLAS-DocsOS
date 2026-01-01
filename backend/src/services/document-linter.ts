/**
 * DocumentLinter - 文档校验服务
 * 
 * Phase 3.3: 功能声明系统校验引擎
 * 
 * 职责：
 * 1. 基础格式校验（frontmatter、version）
 * 2. 功能声明校验（atlas.function 有效性）
 * 3. 功能特定校验（principal 必须有 id、emails）
 * 4. 一致性校验（跨文档结构比对）
 * 5. 生成校验报告
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config, ensureDirectories } from '../config.js';
import { parseADL } from '../adl/parser.js';
import { getWorkspaceIndex } from './workspace-service.js';
import { ATLAS_FUNCTION_TYPES, ATLAS_CAPABILITIES } from '../adl/types.js';
import type { ADLDocument, AtlasFrontmatter, Block } from '../adl/types.js';

// ============================================================
// 类型定义
// ============================================================

/**
 * 校验问题级别
 */
export type LintLevel = 'error' | 'warning' | 'info' | 'hint';

/**
 * 校验问题
 */
export interface LintIssue {
    /** 问题级别 */
    level: LintLevel;
    /** 规则名称 */
    rule: string;
    /** 问题描述 */
    message: string;
    /** 位置信息 */
    location: {
        /** Block anchor（如果是 Block 级别的问题） */
        block?: string;
        /** 行号 */
        line?: number;
        /** 字段路径 */
        field?: string;
    };
    /** 修复建议 */
    suggestion?: string;
}

/**
 * 单个文档的校验结果
 */
export interface DocumentLintResult {
    /** 文档路径 */
    path: string;
    /** 问题列表 */
    issues: LintIssue[];
    /** 是否通过（无 error） */
    passed: boolean;
}

/**
 * 完整校验报告
 */
export interface LintReport {
    /** 版本 */
    version: string;
    /** 生成时间 */
    generated_at: string;
    /** 统计摘要 */
    summary: {
        /** 总文档数 */
        total_documents: number;
        /** 通过数 */
        passed_count: number;
        /** 失败数 */
        failed_count: number;
        /** 错误数 */
        error_count: number;
        /** 警告数 */
        warning_count: number;
        /** 信息数 */
        info_count: number;
        /** 提示数 */
        hint_count: number;
    };
    /** 各文档结果 */
    documents: DocumentLintResult[];
}

/**
 * 校验配置
 */
export interface LintConfig {
    /** 启用的规则 */
    rules: {
        /** 基础格式检查 */
        basic_format: boolean;
        /** frontmatter version 检查 */
        version_required: boolean;
        /** atlas 声明检查 */
        atlas_validation: boolean;
        /** 功能特定检查 */
        function_specific: boolean;
        /** Block 结构检查 */
        block_structure: boolean;
        /** anchor 唯一性检查 */
        anchor_unique: boolean;
    };
    /** 严格模式（warning 也算失败） */
    strict: boolean;
}

// ============================================================
// 默认配置
// ============================================================

const DEFAULT_LINT_CONFIG: LintConfig = {
    rules: {
        basic_format: true,
        version_required: true,
        atlas_validation: true,
        function_specific: true,
        block_structure: true,
        anchor_unique: true,
    },
    strict: false,
};

// ============================================================
// 缓存
// ============================================================

let cachedReport: LintReport | null = null;

// ============================================================
// 服务实现
// ============================================================

/**
 * 获取校验报告路径
 */
function getReportPath(): string {
    return join(config.atlasDataDir, 'lint-report.json');
}

/**
 * 获取配置路径
 */
function getConfigPath(): string {
    return join(config.atlasDataDir, 'lint-config.json');
}

/**
 * 获取校验配置
 */
export function getLintConfig(): LintConfig {
    const configPath = getConfigPath();

    if (existsSync(configPath)) {
        try {
            const content = readFileSync(configPath, 'utf-8');
            return { ...DEFAULT_LINT_CONFIG, ...JSON.parse(content) };
        } catch {
            // 配置文件损坏，使用默认配置
        }
    }

    return DEFAULT_LINT_CONFIG;
}

/**
 * 保存校验配置
 */
export function saveLintConfig(config: LintConfig): void {
    ensureDirectories();
    const configPath = getConfigPath();
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * 获取校验报告（从缓存或文件）
 */
export async function getLintReport(): Promise<LintReport | null> {
    if (cachedReport) {
        return cachedReport;
    }

    const reportPath = getReportPath();
    if (existsSync(reportPath)) {
        try {
            const cached = JSON.parse(readFileSync(reportPath, 'utf-8')) as LintReport;
            cachedReport = cached;
            return cached;
        } catch {
            // 报告文件损坏
        }
    }

    return null;
}

/**
 * 校验所有文档
 */
export async function lintAllDocuments(): Promise<LintReport> {
    ensureDirectories();

    const lintConfig = getLintConfig();
    const workspaceIndex = await getWorkspaceIndex();
    const documentResults: DocumentLintResult[] = [];

    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    let hintCount = 0;

    // 收集所有 anchor 用于唯一性检查
    const allAnchors = new Map<string, string[]>(); // anchor -> [paths]

    for (const docInfo of workspaceIndex.documents) {
        try {
            const fullPath = join(config.repositoryRoot, docInfo.path);
            if (!existsSync(fullPath)) {
                continue;
            }

            const content = readFileSync(fullPath, 'utf-8');
            const doc = parseADL(content, docInfo.path);

            // 校验单个文档
            const issues = lintDocument(doc, lintConfig);

            // 统计
            for (const issue of issues) {
                switch (issue.level) {
                    case 'error': errorCount++; break;
                    case 'warning': warningCount++; break;
                    case 'info': infoCount++; break;
                    case 'hint': hintCount++; break;
                }
            }

            // 收集 anchor
            for (const block of doc.blocks) {
                if (block.anchor) {
                    const paths = allAnchors.get(block.anchor) || [];
                    paths.push(docInfo.path);
                    allAnchors.set(block.anchor, paths);
                }
            }

            const passed = lintConfig.strict
                ? issues.every(i => i.level !== 'error' && i.level !== 'warning')
                : issues.every(i => i.level !== 'error');

            documentResults.push({
                path: docInfo.path,
                issues,
                passed,
            });
        } catch (error) {
            // 解析失败本身就是一个错误
            errorCount++;
            documentResults.push({
                path: docInfo.path,
                issues: [{
                    level: 'error',
                    rule: 'parse_error',
                    message: `Failed to parse document: ${error instanceof Error ? error.message : String(error)}`,
                    location: {},
                }],
                passed: false,
            });
        }
    }

    // 检查全局 anchor 唯一性
    if (lintConfig.rules.anchor_unique) {
        for (const [anchor, paths] of allAnchors) {
            if (paths.length > 1) {
                // 在所有涉及的文档中添加警告
                for (const path of paths) {
                    const result = documentResults.find(r => r.path === path);
                    if (result) {
                        result.issues.push({
                            level: 'warning',
                            rule: 'anchor_global_unique',
                            message: `Anchor "${anchor}" is duplicated across documents: ${paths.join(', ')}`,
                            location: { block: anchor },
                            suggestion: 'Consider using more specific anchor names to avoid conflicts',
                        });
                        warningCount++;
                    }
                }
            }
        }
    }

    const passedCount = documentResults.filter(r => r.passed).length;

    const report: LintReport = {
        version: '1.0',
        generated_at: new Date().toISOString(),
        summary: {
            total_documents: documentResults.length,
            passed_count: passedCount,
            failed_count: documentResults.length - passedCount,
            error_count: errorCount,
            warning_count: warningCount,
            info_count: infoCount,
            hint_count: hintCount,
        },
        documents: documentResults,
    };

    // 保存报告
    const reportPath = getReportPath();
    writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    // 更新缓存
    cachedReport = report;

    console.log(`[DocumentLinter] Linted ${documentResults.length} documents: ${passedCount} passed, ${documentResults.length - passedCount} failed`);

    return report;
}

/**
 * 校验单个文档
 */
export function lintDocument(doc: ADLDocument, lintConfig?: LintConfig): LintIssue[] {
    const cfg = lintConfig || getLintConfig();
    const issues: LintIssue[] = [];

    // 基础格式检查
    if (cfg.rules.basic_format) {
        issues.push(...lintBasicFormat(doc));
    }

    // version 检查
    if (cfg.rules.version_required) {
        issues.push(...lintVersionRequired(doc));
    }

    // atlas 声明检查
    if (cfg.rules.atlas_validation) {
        issues.push(...lintAtlasDeclaration(doc));
    }

    // 功能特定检查
    if (cfg.rules.function_specific && doc.atlas?.function) {
        issues.push(...lintFunctionSpecific(doc));
    }

    // Block 结构检查
    if (cfg.rules.block_structure) {
        issues.push(...lintBlockStructure(doc));
    }

    // 本文档内 anchor 唯一性检查
    if (cfg.rules.anchor_unique) {
        issues.push(...lintAnchorUnique(doc));
    }

    return issues;
}

/**
 * 校验单个文档（按路径）
 */
export async function lintDocumentByPath(docPath: string): Promise<LintIssue[]> {
    const fullPath = join(config.repositoryRoot, docPath);

    if (!existsSync(fullPath)) {
        return [{
            level: 'error',
            rule: 'file_not_found',
            message: `Document not found: ${docPath}`,
            location: {},
        }];
    }

    try {
        const content = readFileSync(fullPath, 'utf-8');
        const doc = parseADL(content, docPath);
        return lintDocument(doc);
    } catch (error) {
        return [{
            level: 'error',
            rule: 'parse_error',
            message: `Failed to parse document: ${error instanceof Error ? error.message : String(error)}`,
            location: {},
        }];
    }
}

/**
 * 清除缓存
 */
export function clearLintCache(): void {
    cachedReport = null;
}

// ============================================================
// 校验规则实现
// ============================================================

/**
 * 基础格式检查
 */
function lintBasicFormat(doc: ADLDocument): LintIssue[] {
    const issues: LintIssue[] = [];

    // 检查 frontmatter 是否存在
    if (!doc.frontmatter || Object.keys(doc.frontmatter).length === 0) {
        issues.push({
            level: 'warning',
            rule: 'frontmatter_missing',
            message: 'Document has no frontmatter',
            location: { line: 1 },
            suggestion: 'Add frontmatter with at least version and document_type',
        });
    }

    // 检查 document_type
    if (!doc.frontmatter?.document_type) {
        issues.push({
            level: 'info',
            rule: 'document_type_missing',
            message: 'Document type not specified in frontmatter',
            location: { field: 'document_type' },
            suggestion: 'Add document_type: facts (or other appropriate type) to frontmatter',
        });
    }

    return issues;
}

/**
 * version 检查
 */
function lintVersionRequired(doc: ADLDocument): LintIssue[] {
    const issues: LintIssue[] = [];

    if (!doc.frontmatter?.version) {
        issues.push({
            level: 'warning',
            rule: 'version_missing',
            message: 'Document version not specified',
            location: { field: 'version' },
            suggestion: 'Add version: "1.0" to frontmatter',
        });
    }

    return issues;
}

/**
 * atlas 声明检查
 */
function lintAtlasDeclaration(doc: ADLDocument): LintIssue[] {
    const issues: LintIssue[] = [];

    const atlasRaw = doc.frontmatter?.atlas;
    if (!atlasRaw) {
        // 没有 atlas 声明不是错误，只是 hint
        issues.push({
            level: 'hint',
            rule: 'atlas_not_declared',
            message: 'Document has no atlas function declaration',
            location: { field: 'atlas' },
            suggestion: 'Consider adding atlas.function declaration if this document serves a specific system function',
        });
        return issues;
    }

    const atlas = doc.atlas;
    if (!atlas) {
        issues.push({
            level: 'error',
            rule: 'atlas_invalid_format',
            message: 'atlas frontmatter is malformed',
            location: { field: 'atlas' },
            suggestion: 'atlas should have at least a "function" field',
        });
        return issues;
    }

    // 检查 function 类型是否有效
    if (!ATLAS_FUNCTION_TYPES.includes(atlas.function as any)) {
        issues.push({
            level: 'error',
            rule: 'atlas_invalid_function',
            message: `Unknown atlas function type: "${atlas.function}"`,
            location: { field: 'atlas.function' },
            suggestion: `Valid types: ${ATLAS_FUNCTION_TYPES.join(', ')}`,
        });
    }

    // 检查 capabilities 是否有效
    if (atlas.capabilities) {
        for (const cap of atlas.capabilities) {
            if (!ATLAS_CAPABILITIES.includes(cap as any)) {
                issues.push({
                    level: 'warning',
                    rule: 'atlas_unknown_capability',
                    message: `Unknown capability: "${cap}"`,
                    location: { field: 'atlas.capabilities' },
                    suggestion: `Known capabilities: ${ATLAS_CAPABILITIES.join(', ')}`,
                });
            }
        }
    }

    // entity_list 应该有 entity_type
    if (atlas.function === 'entity_list' && !atlas.entity_type) {
        issues.push({
            level: 'warning',
            rule: 'atlas_entity_type_missing',
            message: 'entity_list function should specify entity_type',
            location: { field: 'atlas.entity_type' },
            suggestion: 'Add atlas.entity_type to specify what kind of entities this list contains',
        });
    }

    return issues;
}

/**
 * 功能特定检查
 */
function lintFunctionSpecific(doc: ADLDocument): LintIssue[] {
    const issues: LintIssue[] = [];
    const funcType = doc.atlas?.function;

    if (!funcType) return issues;

    switch (funcType) {
        case 'principal':
            issues.push(...lintPrincipalDocument(doc));
            break;
        case 'entity_list':
            issues.push(...lintEntityListDocument(doc));
            break;
        case 'client':
            issues.push(...lintClientDocument(doc));
            break;
    }

    return issues;
}

/**
 * Principal 文档检查
 */
function lintPrincipalDocument(doc: ADLDocument): LintIssue[] {
    const issues: LintIssue[] = [];

    // 查找 principal 类型的 Block
    const principalBlock = doc.blocks.find(b => b.machine?.type === 'principal');

    if (!principalBlock) {
        issues.push({
            level: 'error',
            rule: 'principal_block_missing',
            message: 'Principal document must have a block with type: principal',
            location: {},
            suggestion: 'Add a block with type: principal in its machine zone',
        });
        return issues;
    }

    const machine = principalBlock.machine;

    // 必须有 id
    if (!machine.id) {
        issues.push({
            level: 'error',
            rule: 'principal_id_missing',
            message: 'Principal block must have an id',
            location: { block: principalBlock.anchor, field: 'id' },
        });
    }

    // 必须有 identity.emails
    const identity = machine.identity as Record<string, unknown> | undefined;
    if (!identity?.emails || !Array.isArray(identity.emails) || identity.emails.length === 0) {
        issues.push({
            level: 'error',
            rule: 'principal_emails_missing',
            message: 'Principal must have at least one email in identity.emails',
            location: { block: principalBlock.anchor, field: 'identity.emails' },
            suggestion: 'Add identity.emails array with at least one email address',
        });
    }

    // 应该有 auth.password_hash（用于登录）
    const auth = machine.auth as Record<string, unknown> | undefined;
    if (!auth?.password_hash) {
        issues.push({
            level: 'warning',
            rule: 'principal_auth_missing',
            message: 'Principal has no auth.password_hash, cannot be used for login',
            location: { block: principalBlock.anchor, field: 'auth.password_hash' },
            suggestion: 'Add auth.password_hash if this principal needs to login',
        });
    }

    return issues;
}

/**
 * EntityList 文档检查
 */
function lintEntityListDocument(doc: ADLDocument): LintIssue[] {
    const issues: LintIssue[] = [];

    // 查找 directory_index 或 entity_index 类型的 Block
    const listBlock = doc.blocks.find(b =>
        b.machine?.type === 'directory_index' || b.machine?.type === 'entity_index'
    );

    if (!listBlock) {
        issues.push({
            level: 'warning',
            rule: 'entity_list_block_missing',
            message: 'entity_list document should have a directory_index or entity_index block',
            location: {},
            suggestion: 'Add a block with type: directory_index or type: entity_index',
        });
        return issues;
    }

    // directory_index 应该有 source.function
    if (listBlock.machine.type === 'directory_index') {
        const source = listBlock.machine.source as Record<string, unknown> | undefined;
        if (!source?.function) {
            issues.push({
                level: 'info',
                rule: 'directory_index_source_function',
                message: 'directory_index should have source.function for automatic discovery',
                location: { block: listBlock.anchor, field: 'source.function' },
                suggestion: 'Add source.function to enable automatic entity discovery',
            });
        }
    }

    return issues;
}

/**
 * Client 文档检查
 */
function lintClientDocument(doc: ADLDocument): LintIssue[] {
    const issues: LintIssue[] = [];

    // 查找 client 类型的 Block
    const clientBlock = doc.blocks.find(b => b.machine?.type === 'client');

    if (!clientBlock) {
        issues.push({
            level: 'error',
            rule: 'client_block_missing',
            message: 'Client document must have a block with type: client',
            location: {},
            suggestion: 'Add a block with type: client in its machine zone',
        });
        return issues;
    }

    const machine = clientBlock.machine;

    // 必须有 id
    if (!machine.id) {
        issues.push({
            level: 'error',
            rule: 'client_id_missing',
            message: 'Client block must have an id',
            location: { block: clientBlock.anchor, field: 'id' },
        });
    }

    // 必须有 title
    if (!machine.title) {
        issues.push({
            level: 'error',
            rule: 'client_title_missing',
            message: 'Client block must have a title',
            location: { block: clientBlock.anchor, field: 'title' },
        });
    }

    return issues;
}

/**
 * Block 结构检查
 */
function lintBlockStructure(doc: ADLDocument): LintIssue[] {
    const issues: LintIssue[] = [];

    for (const block of doc.blocks) {
        // 检查 anchor 格式
        if (!/^[a-zA-Z0-9_-]+$/.test(block.anchor)) {
            issues.push({
                level: 'error',
                rule: 'anchor_invalid_format',
                message: `Invalid anchor format: "${block.anchor}"`,
                location: { block: block.anchor, line: block.startLine },
                suggestion: 'Anchor should only contain letters, numbers, hyphens, and underscores',
            });
        }

        // 检查 machine block 基本字段
        if (!block.machine?.type) {
            issues.push({
                level: 'warning',
                rule: 'block_type_missing',
                message: `Block "${block.anchor}" has no type in machine zone`,
                location: { block: block.anchor, field: 'type' },
            });
        }

        if (!block.machine?.id) {
            issues.push({
                level: 'info',
                rule: 'block_id_missing',
                message: `Block "${block.anchor}" has no id in machine zone`,
                location: { block: block.anchor, field: 'id' },
            });
        }
    }

    return issues;
}

/**
 * 文档内 Anchor 唯一性检查
 */
function lintAnchorUnique(doc: ADLDocument): LintIssue[] {
    const issues: LintIssue[] = [];
    const anchors = new Map<string, number[]>(); // anchor -> line numbers

    for (const block of doc.blocks) {
        const lines = anchors.get(block.anchor) || [];
        lines.push(block.startLine);
        anchors.set(block.anchor, lines);
    }

    for (const [anchor, lines] of anchors) {
        if (lines.length > 1) {
            issues.push({
                level: 'error',
                rule: 'anchor_duplicate',
                message: `Duplicate anchor "${anchor}" found at lines: ${lines.join(', ')}`,
                location: { block: anchor },
                suggestion: 'Each anchor within a document must be unique',
            });
        }
    }

    return issues;
}

