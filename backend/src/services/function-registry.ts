/**
 * FunctionRegistry - 功能注册表服务
 * 
 * Phase 3.3: 功能声明系统核心服务
 * 
 * 职责：
 * 1. 扫描所有文档的 atlas.function 声明
 * 2. 按功能类型分组注册
 * 3. 索引关键字段用于快速查找
 * 4. 生成导航树
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config, ensureDirectories } from '../config.js';
import { parseADL } from '../adl/parser.js';
import { rebuildWorkspaceIndex } from './workspace-service.js';
import { rebuildLabelRegistry } from './label-registry.js';
import type { AtlasFrontmatter, AtlasFunctionType, AtlasNavigationConfig, Block } from '../adl/types.js';

// ============================================================
// 类型定义
// ============================================================

/**
 * 功能条目 - 单个文档的功能注册信息
 */
export interface FunctionEntry {
    /** 文档路径 */
    path: string;
    /** Block ID（如果有） */
    id?: string;
    /** 标题 */
    title?: string;
    /** 能力标签列表 */
    capabilities: string[];
    /** 索引字段（用于快速查找） */
    indexed_fields: Record<string, unknown>;
    /** 导航配置 */
    navigation?: AtlasNavigationConfig;
    /** 实体类型 */
    entity_type?: string;
}

/**
 * 功能分组 - 同一功能类型的所有文档
 */
export interface FunctionGroup {
    /** 该功能的所有文档 */
    documents: FunctionEntry[];
    /** 文档数量 */
    count: number;
}

/**
 * 导航项
 */
export interface NavItem {
    /** 文档路径 */
    path: string;
    /** 图标 */
    icon?: string;
    /** 显示标签 */
    label: string;
    /** 排序权重 */
    order: number;
    /** URL */
    url: string;
    /** 父级 ID */
    parent?: string;
}

/**
 * 功能注册表
 */
export interface FunctionRegistry {
    /** 版本 */
    version: string;
    /** 生成时间 */
    generated_at: string;
    /** Git HEAD */
    repo_head?: string;
    /** 按功能类型分组的文档 */
    functions: Record<string, FunctionGroup>;
    /** 导航配置 */
    navigation: {
        sidebar: NavItem[];
    };
}

// ============================================================
// 内存缓存
// ============================================================

let cachedRegistry: FunctionRegistry | null = null;

// ============================================================
// 服务实现
// ============================================================

/**
 * 获取功能注册表路径
 */
function getRegistryPath(): string {
    return join(config.atlasDataDir, 'functions.json');
}

/**
 * 获取功能注册表
 * 
 * 优先从缓存读取，缓存不存在则从文件读取，文件不存在则重建
 */
export async function getFunctionRegistry(): Promise<FunctionRegistry> {
    // 内存缓存
    if (cachedRegistry) {
        return cachedRegistry;
    }

    ensureDirectories();
    const registryPath = getRegistryPath();

    // 文件缓存
    if (existsSync(registryPath)) {
        try {
            const cached = JSON.parse(readFileSync(registryPath, 'utf-8')) as FunctionRegistry;
            cachedRegistry = cached;
            return cached;
        } catch {
            // 文件损坏，重建
        }
    }

    // 重建
    return rebuildFunctionRegistry();
}

/**
 * 重建功能注册表
 * 
 * Phase 3.3: 扫描所有文档，提取 atlas.function 声明，构建索引
 * 
 * 「双向奔赴」原则：
 * - 重建时会先刷新 WorkspaceIndex 和 Registry
 * - 确保文件移动后无需重启服务器
 */
export async function rebuildFunctionRegistry(): Promise<FunctionRegistry> {
    ensureDirectories();

    const functions: Record<string, FunctionGroup> = {};
    const navItems: NavItem[] = [];

    // 「双向奔赴」：先重建 WorkspaceIndex（同步刷新 Registry）
    // 这确保了文件移动后 Registry 能正确识别新路径
    const workspaceIndex = await rebuildWorkspaceIndex();
    console.log(`[FunctionRegistry] WorkspaceIndex refreshed: ${workspaceIndex.documents.length} documents`);

    // 同步重建标签注册表
    await rebuildLabelRegistry();
    console.log('[FunctionRegistry] LabelRegistry refreshed');

    for (const docInfo of workspaceIndex.documents) {
        try {
            const fullPath = join(config.repositoryRoot, docInfo.path);
            if (!existsSync(fullPath)) {
                continue;
            }

            const content = readFileSync(fullPath, 'utf-8');
            const doc = parseADL(content, docInfo.path);

            // 跳过没有 atlas 声明的文档
            if (!doc.atlas?.function) {
                continue;
            }

            const atlas = doc.atlas;
            const funcType = atlas.function;

            // 初始化功能分组
            if (!functions[funcType]) {
                functions[funcType] = { documents: [], count: 0 };
            }

            // 提取索引字段
            const indexedFields = extractIndexedFields(doc.blocks, funcType);

            // 创建功能条目
            const entry: FunctionEntry = {
                path: docInfo.path,
                id: indexedFields.id as string | undefined,
                title: indexedFields.title as string || indexedFields.display_name as string || docInfo.title,
                capabilities: atlas.capabilities || [],
                indexed_fields: indexedFields,
                navigation: atlas.navigation,
                entity_type: atlas.entity_type,
            };

            functions[funcType].documents.push(entry);
            functions[funcType].count++;

            // 收集导航项
            if (atlas.navigation?.visible && atlas.capabilities?.includes('nav.sidebar')) {
                navItems.push({
                    path: docInfo.path,
                    icon: atlas.navigation.icon,
                    label: atlas.navigation.label || docInfo.title,
                    order: atlas.navigation.order ?? 100,
                    url: `/workspace/${docInfo.path}`,
                    parent: atlas.navigation.parent,
                });
            }
        } catch (error) {
            console.error(`[FunctionRegistry] Failed to process ${docInfo.path}:`, error);
        }
    }

    // 对导航项排序
    navItems.sort((a, b) => a.order - b.order);

    const registry: FunctionRegistry = {
        version: '1.0',
        generated_at: new Date().toISOString(),
        repo_head: workspaceIndex.repo_head,
        functions,
        navigation: {
            sidebar: navItems,
        },
    };

    // 写入文件
    const registryPath = getRegistryPath();
    writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');

    // 更新缓存
    cachedRegistry = registry;

    console.log(`[FunctionRegistry] Rebuilt: ${Object.keys(functions).length} function types, ${navItems.length} nav items`);

    return registry;
}

/**
 * 从 Blocks 中提取索引字段
 */
function extractIndexedFields(blocks: Block[], funcType: AtlasFunctionType): Record<string, unknown> {
    const fields: Record<string, unknown> = {};

    // 查找主 Block（通常是第一个与功能类型匹配的 Block）
    const mainBlock = blocks.find(b => {
        const type = b.machine?.type;
        // principal 类型匹配 principal
        // entity_list 类型匹配 directory_index 或 entity_index
        // client 类型匹配 client
        return type === funcType ||
            (funcType === 'entity_list' && (type === 'directory_index' || type === 'entity_index')) ||
            (funcType === 'principal' && type === 'principal') ||
            (funcType === 'client' && type === 'client');
    }) || blocks[0];

    if (!mainBlock?.machine) {
        return fields;
    }

    const machine = mainBlock.machine;

    // 基础字段
    fields.id = machine.id;
    fields.title = machine.title;
    fields.status = machine.status;

    // Principal 特有字段
    if (funcType === 'principal') {
        fields.display_name = machine.display_name;
        const identity = machine.identity as Record<string, unknown> | undefined;
        if (identity) {
            fields['identity.emails'] = identity.emails;
            fields['identity.phones'] = identity.phones;
        }
        // 提取 auth 信息（不包含 password_hash）
        const auth = machine.auth as Record<string, unknown> | undefined;
        if (auth) {
            fields['auth.last_login'] = auth.last_login;
        }
    }

    // Client 特有字段
    if (funcType === 'client') {
        fields.category = machine.category;
    }

    // entity_list 特有字段
    if (funcType === 'entity_list') {
        const source = machine.source as Record<string, unknown> | undefined;
        if (source) {
            fields['source.function'] = source.function;
            fields['source.directory'] = source.directory;
        }
    }

    return fields;
}

/**
 * 按功能类型获取文档列表
 */
export async function getByFunction(funcType: string): Promise<FunctionEntry[]> {
    const registry = await getFunctionRegistry();
    return registry.functions[funcType]?.documents || [];
}

/**
 * 通过 email 查找 Principal
 */
export async function findPrincipalByEmail(email: string): Promise<FunctionEntry | null> {
    const principals = await getByFunction('principal');

    for (const entry of principals) {
        const emails = entry.indexed_fields['identity.emails'];
        if (Array.isArray(emails) && emails.includes(email)) {
            return entry;
        }
    }

    return null;
}

/**
 * 通过 ID 查找 Principal
 */
export async function findPrincipalById(id: string): Promise<FunctionEntry | null> {
    const principals = await getByFunction('principal');
    return principals.find(p => p.id === id) || null;
}

/**
 * 获取侧边栏导航
 */
export async function getSidebarNavigation(): Promise<NavItem[]> {
    const registry = await getFunctionRegistry();
    return registry.navigation.sidebar;
}

/**
 * 清除缓存（用于测试或强制刷新）
 */
export function clearCache(): void {
    cachedRegistry = null;
}

/**
 * 更新单个文档的功能注册
 * 
 * 用于 Proposal 执行后的增量更新
 */
export async function updateDocumentFunction(docPath: string): Promise<void> {
    // 简单实现：直接重建整个注册表
    // 后续可优化为增量更新
    await rebuildFunctionRegistry();
}

