/**
 * 类型包服务
 * 
 * Phase 4.1: 从 atlas-content/plugins/type-packages 目录读取类型包
 */

import { readdirSync, readFileSync, existsSync, statSync, mkdirSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { config } from '../config.js';

// ============================================================
// 类型定义
// ============================================================

export interface TypePackageManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    license?: string;
    category: string;
    subcategory?: string;
    tags: string[];
    icon: string;
    color: string;
    preview_image?: string;
    atlas_version?: string;
    dependencies?: string[];
    conflicts?: string[];
    published?: boolean;
    created_at?: string;
    updated_at?: string;
    downloads?: number;
    rating?: number;
}

export interface BlockDefinition {
    id: string;
    name: string;
    description: string;
    icon?: string;      // 图标名称（新格式：直接在顶层）
    required?: boolean;
    enabled: boolean;   // 是否启用（用户可在插件设置中控制）
    order?: number;
    fields?: Array<{
        key: string;
        label: string;
        component?: string;  // 绑定的组件 ID
        defaultValue?: any;
        required?: boolean;
    }>;
    // 兼容旧格式
    display?: {
        icon?: string;
        color?: string;
        default_expanded?: boolean;
    };
    template?: string;
}

export interface TypePackageInfo {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    category: string;
    tags: string[];
    icon: string;
    color: string;
    isOfficial: boolean;
    blocks: Array<{
        id: string;
        name: string;
        description: string;
        required: boolean;
        enabled: boolean;
        selected: boolean;
    }>;
    defaultFunction?: string;
    defaultDisplay?: string;
}

// ============================================================
// 核心函数
// ============================================================

/**
 * 获取所有已安装的类型包
 */
export function getAllTypePackages(): TypePackageInfo[] {
    const packagesDir = config.typePackagesDir;

    if (!existsSync(packagesDir)) {
        console.warn('[TypePackages] Type packages directory not found:', packagesDir);
        return [];
    }

    const packages: TypePackageInfo[] = [];
    const entries = readdirSync(packagesDir);

    for (const entry of entries) {
        const packageDir = join(packagesDir, entry);

        // 跳过非目录
        if (!statSync(packageDir).isDirectory()) {
            continue;
        }

        try {
            const packageInfo = loadTypePackage(packageDir, entry);
            if (packageInfo) {
                packages.push(packageInfo);
            }
        } catch (error) {
            console.error(`[TypePackages] Failed to load package ${entry}:`, error);
        }
    }

    return packages;
}

/**
 * 获取单个类型包详情
 */
export function getTypePackage(id: string): TypePackageInfo | null {
    const packageDir = join(config.typePackagesDir, id);

    if (!existsSync(packageDir)) {
        return null;
    }

    return loadTypePackage(packageDir, id);
}

/**
 * 按分类获取类型包
 */
export function getTypePackagesByCategory(): Record<string, { label: string; packages: TypePackageInfo[] }> {
    const allPackages = getAllTypePackages();

    const categories: Record<string, { label: string; packages: TypePackageInfo[] }> = {
        business: { label: '业务文档', packages: [] },
        content: { label: '内容文档', packages: [] },
        system: { label: '系统文档', packages: [] },
        custom: { label: '自定义', packages: [] },
    };

    for (const pkg of allPackages) {
        const category = pkg.category in categories ? pkg.category : 'custom';
        categories[category].packages.push(pkg);
    }

    return categories;
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 加载单个类型包
 */
function loadTypePackage(packageDir: string, id: string): TypePackageInfo | null {
    const manifestYamlPath = join(packageDir, 'manifest.yaml');
    const manifestJsonPath = join(packageDir, 'manifest.json');

    let manifest: TypePackageManifest;

    // 优先读取 YAML，其次 JSON
    if (existsSync(manifestYamlPath)) {
        const manifestContent = readFileSync(manifestYamlPath, 'utf-8');
        manifest = yaml.load(manifestContent) as TypePackageManifest;
    } else if (existsSync(manifestJsonPath)) {
        const manifestContent = readFileSync(manifestJsonPath, 'utf-8');
        manifest = JSON.parse(manifestContent) as TypePackageManifest;
    } else {
        console.warn(`[TypePackages] No manifest.yaml or manifest.json found for package: ${id}`);
        return null;
    }

    // 读取 blocks
    const blocks = loadBlocks(packageDir);

    // 读取 functions.yaml 获取默认功能
    let defaultFunction: string | undefined;
    let defaultDisplay: string | undefined;

    const functionsPath = join(packageDir, 'functions.yaml');
    if (existsSync(functionsPath)) {
        try {
            const functionsContent = readFileSync(functionsPath, 'utf-8');
            const functions = yaml.load(functionsContent) as Array<{ id: string }>;
            if (Array.isArray(functions) && functions.length > 0) {
                defaultFunction = functions[0].id;
            }
        } catch (e) {
            // ignore
        }
    }

    const displaysPath = join(packageDir, 'displays.yaml');
    if (existsSync(displaysPath)) {
        try {
            const displaysContent = readFileSync(displaysPath, 'utf-8');
            const displays = yaml.load(displaysContent) as Array<{ id: string }>;
            if (Array.isArray(displays) && displays.length > 0) {
                defaultDisplay = displays[0].id;
            }
        } catch (e) {
            // ignore
        }
    }

    return {
        id: manifest.id || id,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author,
        category: manifest.category || 'custom',
        tags: manifest.tags || [],
        icon: manifest.icon || 'file',
        color: manifest.color || '#6B7280',
        isOfficial: manifest.author === 'atlas_official' || manifest.author === 'ATLAS Official',
        blocks: blocks
            .filter(block => block.enabled !== false)  // 只返回启用的数据块
            .map(block => ({
                id: block.id,
                name: block.name,
                description: block.description,
                required: block.required ?? false,  // 默认为 false
                enabled: block.enabled !== false,
                selected: block.enabled !== false,  // 启用的默认选中
            })),
        defaultFunction,
        defaultDisplay,
    };
}

/**
 * 加载类型包的数据块定义
 * 
 * 优先读取 JSON 文件（包含用户设置），若不存在则从 YAML 读取
 */
function loadBlocks(packageDir: string): BlockDefinition[] {
    const blocksDir = join(packageDir, 'blocks');

    if (!existsSync(blocksDir)) {
        return [];
    }

    const blocks: BlockDefinition[] = [];
    const entries = readdirSync(blocksDir);

    // 收集所有 YAML 文件（作为基础）
    const yamlFiles = entries.filter(e => e.endsWith('.yaml'));

    for (const yamlFile of yamlFiles) {
        const baseName = yamlFile.replace('.yaml', '');
        const jsonPath = join(blocksDir, `${baseName}.json`);
        const yamlPath = join(blocksDir, yamlFile);

        try {
            let block: BlockDefinition;

            // 优先读取 JSON（包含用户自定义设置，如 enabled）
            if (existsSync(jsonPath)) {
                const jsonContent = readFileSync(jsonPath, 'utf-8');
                block = JSON.parse(jsonContent);
            } else {
                // 回退到 YAML
                const yamlContent = readFileSync(yamlPath, 'utf-8');
                const yamlData = yaml.load(yamlContent) as any;
                block = {
                    ...yamlData,
                    enabled: yamlData.enabled !== false,  // 默认启用
                };
            }

            if (block && block.id && block.name) {
                // 确保 enabled 字段存在
                block.enabled = block.enabled !== false;
                blocks.push(block);
            }
        } catch (error) {
            console.error(`[TypePackages] Failed to load block ${yamlFile}:`, error);
        }
    }

    // 按 order 排序
    blocks.sort((a, b) => (a.order || 999) - (b.order || 999));

    return blocks;
}

/**
 * 获取类型包的原始 manifest
 */
export function getTypePackageManifest(id: string): TypePackageManifest | null {
    const manifestYamlPath = join(config.typePackagesDir, id, 'manifest.yaml');
    const manifestJsonPath = join(config.typePackagesDir, id, 'manifest.json');

    if (existsSync(manifestYamlPath)) {
        const content = readFileSync(manifestYamlPath, 'utf-8');
        return yaml.load(content) as TypePackageManifest;
    } else if (existsSync(manifestJsonPath)) {
        const content = readFileSync(manifestJsonPath, 'utf-8');
        return JSON.parse(content) as TypePackageManifest;
    }

    return null;
}

/**
 * 获取类型包的所有数据块定义
 */
export function getTypePackageBlocks(id: string): BlockDefinition[] {
    const packageDir = join(config.typePackagesDir, id);
    return loadBlocks(packageDir);
}

/**
 * 获取类型包的模板内容
 */
export function getTypePackageTemplate(id: string): string | null {
    const templatePath = join(config.typePackagesDir, id, 'template.md');

    if (!existsSync(templatePath)) {
        return null;
    }

    return readFileSync(templatePath, 'utf-8');
}

/**
 * 读取数据块的完整配置（含字段信息）
 * 优先读取 JSON，否则从 YAML 读取
 * 
 * 支持：
 * 1. 直接用 blockId 作为文件名匹配
 * 2. 遍历所有 JSON/YAML 文件，查找内部 id 匹配的配置
 */
export function getBlockFullConfig(packageId: string, blockId: string): any | null {
    const blocksDir = join(config.typePackagesDir, packageId, 'blocks');

    if (!existsSync(blocksDir)) {
        return null;
    }

    // 首先尝试直接匹配文件名
    let jsonPath = join(blocksDir, `${blockId}.json`);
    let yamlPath = join(blocksDir, `${blockId}.yaml`);

    // 检查直接文件名匹配
    if (existsSync(jsonPath)) {
        try {
            const content = readFileSync(jsonPath, 'utf-8');
            return JSON.parse(content);
        } catch (e) {
            console.error(`[TypePackages] Failed to read JSON config for ${blockId}:`, e);
        }
    }

    if (existsSync(yamlPath)) {
        try {
            const content = readFileSync(yamlPath, 'utf-8');
            return yaml.load(content);
        } catch (e) {
            console.error(`[TypePackages] Failed to read YAML config for ${blockId}:`, e);
        }
    }

    // 如果直接匹配不到，遍历目录查找匹配的 id
    const entries = readdirSync(blocksDir);

    // 优先查找 JSON 文件（包含用户配置）
    for (const entry of entries) {
        if (entry.endsWith('.json')) {
            const filePath = join(blocksDir, entry);
            try {
                const content = readFileSync(filePath, 'utf-8');
                const data = JSON.parse(content);
                if (data.id === blockId) {
                    return data;
                }
            } catch (e) {
                // ignore
            }
        }
    }

    // 回退到 YAML 文件
    for (const entry of entries) {
        if (entry.endsWith('.yaml')) {
            const filePath = join(blocksDir, entry);
            try {
                const content = readFileSync(filePath, 'utf-8');
                const data = yaml.load(content) as any;
                if (data.id === blockId) {
                    return data;
                }
            } catch (e) {
                // ignore
            }
        }
    }

    return null;
}

/**
 * 根据配置生成 atlas-data 块内容（新格式：无 schema，有 _bindings）
 * 
 * @param blockConfig 数据块配置
 * @param context 上下文信息，用于自动填充特定字段
 */
function generateAtlasDataBlock(
    blockConfig: any,
    context?: { title?: string; author?: string }
): string {
    const fields = blockConfig.fields || [];

    const dataLines: string[] = [];
    const bindingsLines: string[] = [];

    for (const field of fields) {
        // Data 行 - 根据字段类型自动填充
        let defaultValue = field.defaultValue ?? field.default ?? '';

        // 特殊字段自动填充
        if (context) {
            if (field.key === 'name' && context.title) {
                defaultValue = context.title;
            }
            if (field.key === 'author' && context.author) {
                defaultValue = context.author;
            }
        }

        // 格式化值
        if (typeof defaultValue === 'string') {
            defaultValue = `"${defaultValue}"`;
        } else if (Array.isArray(defaultValue)) {
            defaultValue = JSON.stringify(defaultValue);
        } else if (typeof defaultValue === 'boolean') {
            defaultValue = defaultValue.toString();
        } else if (typeof defaultValue === 'number') {
            defaultValue = defaultValue.toString();
        }
        dataLines.push(`  ${field.key}: ${defaultValue}`);

        // Bindings 行 - 只有配置了组件的字段才需要绑定
        // 绑定目标为组件 ID（约定：comp_${field.key}），而不是组件类型
        if (field.component) {
            const componentId = field.componentId || `comp_${field.key}`;
            bindingsLines.push(`  ${field.key}: ${componentId}`);
        }
    }

    let result = `\`\`\`atlas-data
type: ${blockConfig.id}
data:
${dataLines.join('\n')}`;

    // 只有有绑定时才添加 _bindings 部分
    if (bindingsLines.length > 0) {
        result += `
_bindings:
${bindingsLines.join('\n')}`;
    }

    result += '\n```';
    return result;
}

/**
 * 从模板文件中提取 _components 定义
 */
function extractComponentsFromTemplate(packageId: string): string {
    const templatePath = join(config.typePackagesDir, packageId, 'template.md');

    if (!existsSync(templatePath)) {
        return '';
    }

    try {
        const templateContent = readFileSync(templatePath, 'utf-8');
        const frontmatterMatch = templateContent.match(/^---\n([\s\S]*?)\n---/);

        if (!frontmatterMatch) {
            return '';
        }

        const frontmatterYaml = frontmatterMatch[1];
        const parsed = yaml.load(frontmatterYaml) as any;

        if (parsed && parsed._components) {
            // 将 _components 转换回 YAML 字符串
            return yaml.dump({ _components: parsed._components }, {
                indent: 2,
                lineWidth: -1,
                quotingType: '"',
                forceQuotes: false
            }).trim();
        }
    } catch (error) {
        console.error(`[TypePackages] Failed to extract components from template:`, error);
    }

    return '';
}

/**
 * 确保类型包所需的目录存在
 * 从模板的 _components 中提取所有 directory 配置，并创建这些目录
 */
export function ensureTypePackageDirectories(packageId: string): string[] {
    const templatePath = join(config.typePackagesDir, packageId, 'template.md');
    const createdDirs: string[] = [];

    if (!existsSync(templatePath)) {
        return createdDirs;
    }

    try {
        const templateContent = readFileSync(templatePath, 'utf-8');
        const frontmatterMatch = templateContent.match(/^---\n([\s\S]*?)\n---/);

        if (!frontmatterMatch) {
            return createdDirs;
        }

        const frontmatterYaml = frontmatterMatch[1];
        const parsed = yaml.load(frontmatterYaml) as any;

        if (parsed && parsed._components) {
            // 提取所有组件的 directory 配置
            const directories = new Set<string>();

            for (const comp of Object.values(parsed._components) as any[]) {
                if (comp.directory) {
                    // 移除开头的 / 
                    const dir = comp.directory.replace(/^\//, '');
                    if (dir) {
                        directories.add(dir);
                    }
                }
            }

            // 创建不存在的目录
            for (const dir of directories) {
                const fullPath = join(config.repositoryRoot, dir);
                if (!existsSync(fullPath)) {
                    mkdirSync(fullPath, { recursive: true });
                    createdDirs.push(dir);
                    console.log(`[TypePackages] Created directory: ${dir}`);
                }
            }
        }
    } catch (error) {
        console.error(`[TypePackages] Failed to ensure directories for ${packageId}:`, error);
    }

    return createdDirs;
}

/**
 * 动态生成文档内容（新格式：frontmatter 包含 _components）
 * 根据用户选择的数据块和 JSON 配置动态生成
 */
export function generateDocument(
    packageId: string,
    data: {
        title: string;
        author: string;
        blocks?: string[];
    }
): string {
    const now = new Date().toISOString().split('T')[0];

    // 获取类型包信息
    const pkg = getTypePackage(packageId);
    if (!pkg) {
        throw new Error(`Type package ${packageId} not found`);
    }

    // 获取所有可用的数据块配置（已按 order 排序）
    const allBlocks = loadBlocks(join(config.typePackagesDir, packageId));

    // 过滤出选中的数据块，并保持 order 排序
    const selectedBlockIds = data.blocks || [];
    const selectedBlocks = allBlocks
        .filter(b => selectedBlockIds.includes(b.id) && b.enabled !== false)
        .sort((a, b) => (a.order || 999) - (b.order || 999));  // 确保按 order 写入文档

    // 从模板提取 _components 定义
    const componentsYaml = extractComponentsFromTemplate(packageId);

    // 生成 frontmatter
    let frontmatter = `---
document_type: ${packageId}
title: "${data.title}"
created: "${now}"
updated: "${now}"
author: "${data.author}"

atlas:
  function: entity_detail
  display:
    - detail.tab
    - detail.card
  capabilities:
    - editable
    - searchable
    - linkable
    - exportable
`;

    // 添加 _components（如果有）
    if (componentsYaml) {
        frontmatter += `\n${componentsYaml}\n`;
    }

    frontmatter += `---`;

    // 生成文档标题
    const title = `\n# ${data.title}\n`;

    // 生成各个数据块
    const blockSections: string[] = [];

    // 上下文信息，用于自动填充特定字段
    const context = { title: data.title, author: data.author };

    for (const block of selectedBlocks) {
        // 获取完整配置（含字段）
        const fullConfig = getBlockFullConfig(packageId, block.id);
        if (!fullConfig) {
            console.warn(`[TypePackages] Block config not found: ${block.id}`);
            continue;
        }

        // 生成数据块标题和内容
        const sectionTitle = `## ${fullConfig.name || block.name}`;
        const atlasDataBlock = generateAtlasDataBlock(fullConfig, context);

        blockSections.push(`${sectionTitle}\n\n${atlasDataBlock}`);
    }

    // 组合完整文档
    return `${frontmatter}
${title}
${blockSections.join('\n\n')}
`;
}

/**
 * 渲染类型包模板（旧方法，保留兼容性）
 * @deprecated 使用 generateDocument 替代
 */
export function renderTemplate(
    template: string,
    data: {
        title: string;
        author: string;
        blocks?: string[];
    }
): string {
    const now = new Date().toISOString().split('T')[0];

    let content = template
        .replace(/\{\{title\}\}/g, data.title)
        .replace(/\{\{author\}\}/g, data.author)
        .replace(/\{\{created_at\}\}/g, now)
        .replace(/\{\{updated_at\}\}/g, now);

    // 处理条件块
    const includeAddress = data.blocks?.includes('contact_address') || data.blocks?.includes('address_info');
    const includeSocial = data.blocks?.includes('contact_social') || data.blocks?.includes('social_accounts');
    const includeTags = data.blocks?.includes('contact_tags_notes') || data.blocks?.includes('tags_notes');
    const includeAuth = data.blocks?.includes('account_auth');
    const includePermissions = data.blocks?.includes('access_permissions');

    // 处理 {{#if include_xxx}} ... {{/if}} 块
    content = processConditionalBlock(content, 'include_address', includeAddress ?? false);
    content = processConditionalBlock(content, 'include_social', includeSocial ?? false);
    content = processConditionalBlock(content, 'include_tags', includeTags ?? false);
    content = processConditionalBlock(content, 'include_auth', includeAuth ?? false);
    content = processConditionalBlock(content, 'include_permissions', includePermissions ?? false);

    return content;
}

/**
 * 处理条件块
 */
function processConditionalBlock(content: string, condition: string, include: boolean): string {
    const regex = new RegExp(`\\{\\{#if ${condition}\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`, 'g');

    if (include) {
        // 保留内容，移除标记
        return content.replace(regex, '$1');
    } else {
        // 移除整个块
        return content.replace(regex, '');
    }
}

