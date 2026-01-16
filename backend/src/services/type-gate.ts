/**
 * Type Gate - 类型准入服务
 * 
 * Phase 4.2: 实现类型准入检查与垃圾隔离
 * 
 * 职责：
 * 1. 检查文档是否声明了 doc-type
 * 2. 检查声明的类型是否已安装对应插件包
 * 3. 将不符合条件的文档分类到隔离区
 * 
 * 隔离区分类：
 * - quarantine/no-type: 未声明 doc-type 的文档
 * - quarantine/unknown-type: doc-type 对应的插件包未安装
 * - {type}/staging: 类型正确但字段不足
 */

import { existsSync, readdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { config, ensureDirectories } from '../config.js';

// ============================================================
// 类型定义
// ============================================================

/** 文档类型检查结果 */
export interface TypeGateResult {
    /** 文档路径 */
    docPath: string;
    /** 声明的 doc-type */
    declaredType: string | null;
    /** 检查状态 */
    status: 'valid' | 'no-type' | 'unknown-type' | 'plugin-disabled';
    /** 状态消息 */
    message: string;
    /** 目标索引位置 */
    targetIndex: string | null;
}

/** 隔离区文档记录 */
export interface QuarantineRecord {
    docPath: string;
    reason: 'no-type' | 'unknown-type';
    declaredType?: string;
    detectedAt: string;
    lastChecked: string;
}

/** 隔离区索引 */
export interface QuarantineIndex {
    'no-type': QuarantineRecord[];
    'unknown-type': QuarantineRecord[];
    updated_at: string;
}

// ============================================================
// 索引文件路径
// ============================================================

const QUARANTINE_PATH = () => join(config.indexDir, 'quarantine.json');

// ============================================================
// 已安装类型包缓存
// ============================================================

let installedTypePackagesCache: Set<string> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1分钟缓存

/**
 * 获取已安装的类型包列表
 */
export function getInstalledTypePackages(): Set<string> {
    const now = Date.now();
    
    // 使用缓存
    if (installedTypePackagesCache && (now - cacheTimestamp) < CACHE_TTL) {
        return installedTypePackagesCache;
    }
    
    const packages = new Set<string>();
    const packagesDir = config.typePackagesDir;
    
    if (!existsSync(packagesDir)) {
        console.warn('[TypeGate] Type packages directory not found:', packagesDir);
        return packages;
    }
    
    try {
        const entries = readdirSync(packagesDir, { withFileTypes: true });
        
        for (const entry of entries) {
            if (entry.isDirectory()) {
                // 检查是否有 manifest.yaml
                const manifestPath = join(packagesDir, entry.name, 'manifest.yaml');
                if (existsSync(manifestPath)) {
                    packages.add(entry.name);
                }
            }
        }
    } catch (error) {
        console.error('[TypeGate] Error reading type packages:', error);
    }
    
    installedTypePackagesCache = packages;
    cacheTimestamp = now;
    
    return packages;
}

/**
 * 清除类型包缓存
 */
export function clearTypePackagesCache(): void {
    installedTypePackagesCache = null;
    cacheTimestamp = 0;
}

/**
 * 检查类型包是否已安装
 */
export function isTypePackageInstalled(typeName: string): boolean {
    const packages = getInstalledTypePackages();
    return packages.has(typeName);
}

// ============================================================
// 类型准入检查
// ============================================================

/**
 * 检查文档的类型准入状态
 * 
 * @param docPath 文档路径
 * @param frontmatter 文档 frontmatter
 * @returns 类型检查结果
 */
export function checkTypeGate(
    docPath: string,
    frontmatter: Record<string, unknown> | null
): TypeGateResult {
    // 1. 检查是否有 frontmatter
    if (!frontmatter) {
        return {
            docPath,
            declaredType: null,
            status: 'no-type',
            message: '文档缺少 frontmatter',
            targetIndex: 'quarantine/no-type',
        };
    }
    
    // 2. 检查是否声明了 document_type（兼容旧的 doc-type）
    const docType = (frontmatter['document_type'] || frontmatter['doc-type']) as string | undefined;
    
    if (!docType) {
        return {
            docPath,
            declaredType: null,
            status: 'no-type',
            message: '未声明 document_type',
            targetIndex: 'quarantine/no-type',
        };
    }
    
    // 3. 检查类型包是否已安装
    if (!isTypePackageInstalled(docType)) {
        return {
            docPath,
            declaredType: docType,
            status: 'unknown-type',
            message: `类型包 "${docType}" 未安装`,
            targetIndex: 'quarantine/unknown-type',
        };
    }
    
    // 4. 类型检查通过
    return {
        docPath,
        declaredType: docType,
        status: 'valid',
        message: '类型检查通过',
        targetIndex: `${docType}/staging`,  // 默认进入 staging
    };
}

/**
 * 批量检查文档类型准入
 */
export function batchCheckTypeGate(
    documents: Array<{ path: string; frontmatter: Record<string, unknown> | null }>
): {
    valid: TypeGateResult[];
    quarantine: {
        'no-type': TypeGateResult[];
        'unknown-type': TypeGateResult[];
    };
} {
    const result = {
        valid: [] as TypeGateResult[],
        quarantine: {
            'no-type': [] as TypeGateResult[],
            'unknown-type': [] as TypeGateResult[],
        },
    };
    
    for (const doc of documents) {
        const checkResult = checkTypeGate(doc.path, doc.frontmatter);
        
        if (checkResult.status === 'valid') {
            result.valid.push(checkResult);
        } else if (checkResult.status === 'no-type') {
            result.quarantine['no-type'].push(checkResult);
        } else if (checkResult.status === 'unknown-type') {
            result.quarantine['unknown-type'].push(checkResult);
        }
    }
    
    return result;
}

// ============================================================
// 隔离区管理
// ============================================================

/**
 * 获取隔离区索引
 */
export function getQuarantineIndex(): QuarantineIndex {
    const path = QUARANTINE_PATH();
    
    if (!existsSync(path)) {
        return {
            'no-type': [],
            'unknown-type': [],
            updated_at: new Date().toISOString(),
        };
    }
    
    try {
        return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
        return {
            'no-type': [],
            'unknown-type': [],
            updated_at: new Date().toISOString(),
        };
    }
}

/**
 * 保存隔离区索引
 */
export function saveQuarantineIndex(index: QuarantineIndex): void {
    ensureDirectories();
    const path = QUARANTINE_PATH();
    index.updated_at = new Date().toISOString();
    writeFileSync(path, JSON.stringify(index, null, 2), 'utf-8');
}

/**
 * 更新隔离区（根据批量检查结果）
 */
export function updateQuarantine(
    checkResults: ReturnType<typeof batchCheckTypeGate>
): QuarantineIndex {
    const now = new Date().toISOString();
    
    const index: QuarantineIndex = {
        'no-type': checkResults.quarantine['no-type'].map(r => ({
            docPath: r.docPath,
            reason: 'no-type',
            detectedAt: now,
            lastChecked: now,
        })),
        'unknown-type': checkResults.quarantine['unknown-type'].map(r => ({
            docPath: r.docPath,
            reason: 'unknown-type',
            declaredType: r.declaredType || undefined,
            detectedAt: now,
            lastChecked: now,
        })),
        updated_at: now,
    };
    
    saveQuarantineIndex(index);
    
    console.log(`[TypeGate] Quarantine updated: ${index['no-type'].length} no-type, ${index['unknown-type'].length} unknown-type`);
    
    return index;
}

/**
 * 从隔离区移除文档（当文档被修复后）
 */
export function removeFromQuarantine(docPath: string): boolean {
    const index = getQuarantineIndex();
    let removed = false;
    
    const originalNoTypeLength = index['no-type'].length;
    const originalUnknownTypeLength = index['unknown-type'].length;
    
    index['no-type'] = index['no-type'].filter(r => r.docPath !== docPath);
    index['unknown-type'] = index['unknown-type'].filter(r => r.docPath !== docPath);
    
    if (index['no-type'].length < originalNoTypeLength || 
        index['unknown-type'].length < originalUnknownTypeLength) {
        removed = true;
        saveQuarantineIndex(index);
    }
    
    return removed;
}

/**
 * 获取隔离区统计
 */
export function getQuarantineStats(): {
    total: number;
    'no-type': number;
    'unknown-type': number;
    byDeclaredType: Record<string, number>;
} {
    const index = getQuarantineIndex();
    
    const byDeclaredType: Record<string, number> = {};
    for (const record of index['unknown-type']) {
        if (record.declaredType) {
            byDeclaredType[record.declaredType] = (byDeclaredType[record.declaredType] || 0) + 1;
        }
    }
    
    return {
        total: index['no-type'].length + index['unknown-type'].length,
        'no-type': index['no-type'].length,
        'unknown-type': index['unknown-type'].length,
        byDeclaredType,
    };
}

// ============================================================
// 导出类型包信息
// ============================================================

/**
 * 获取所有已安装类型包的列表
 */
export function listInstalledTypePackages(): string[] {
    return Array.from(getInstalledTypePackages());
}

/**
 * 检查特定类型的文档是否可以进入索引管道
 */
export function canEnterIndexPipeline(docType: string): boolean {
    return isTypePackageInstalled(docType);
}


