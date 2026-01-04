/**
 * 插件服务
 * 
 * Phase 4.1: 读取和管理所有类型的插件
 * - 类型包 (type-packages)
 * - 主题包 (theme-packages)
 * - 扩展 (extensions)
 */

import { readdirSync, readFileSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import { config } from '../config.js';
import yaml from 'js-yaml';

// ============================================================
// 类型定义
// ============================================================

/** 基础插件信息 */
export interface BasePluginInfo {
    id: string;
    pluginType: 'type-package' | 'theme-package' | 'other';
    name: string;
    version: string;
    description: string;
    author: string;
    icon: string;
    color: string;
    tags: string[];
    downloads: number;
    rating: number;
    installed: boolean;
    isOfficial: boolean;
    updatedAt: string;
}

/** 类型包信息 */
export interface TypePackageInfo extends BasePluginInfo {
    pluginType: 'type-package';
    category: string;
    subcategory?: string;
    defaultFunction?: string;
    defaultDisplay?: string;
    blocksCount: number;
}

/** 主题包信息 */
export interface ThemePackageInfo extends BasePluginInfo {
    pluginType: 'theme-package';
    mode: 'light' | 'dark' | 'both';
    previewColors: string[];
}

/** 其他插件信息 */
export interface OtherPluginInfo extends BasePluginInfo {
    pluginType: 'other';
    capabilities: string[];
}

export type PluginInfo = TypePackageInfo | ThemePackageInfo | OtherPluginInfo;

// ============================================================
// 插件目录路径
// ============================================================

const PLUGINS_DIR = join(config.atlasContentDir, 'plugins');
const TYPE_PACKAGES_DIR = join(PLUGINS_DIR, 'type-packages');
const THEME_PACKAGES_DIR = join(PLUGINS_DIR, 'theme-packages');
const EXTENSIONS_DIR = join(PLUGINS_DIR, 'extensions');

// ============================================================
// 类型包
// ============================================================

/**
 * 获取所有类型包
 */
export function getAllTypePackages(): TypePackageInfo[] {
    const packages: TypePackageInfo[] = [];
    
    if (!existsSync(TYPE_PACKAGES_DIR)) {
        console.warn('[Plugins] Type packages directory not found:', TYPE_PACKAGES_DIR);
        return packages;
    }
    
    const dirs = readdirSync(TYPE_PACKAGES_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory());
    
    for (const dir of dirs) {
        const pkgDir = join(TYPE_PACKAGES_DIR, dir.name);
        const manifest = readManifest(pkgDir);
        
        if (manifest) {
            const blocksCount = countBlocks(pkgDir);
            const functionsYaml = readYamlFile(join(pkgDir, 'functions.yaml'));
            const displaysYaml = readYamlFile(join(pkgDir, 'displays.yaml'));
            
            packages.push({
                id: manifest.id || dir.name,
                pluginType: 'type-package',
                name: manifest.name || dir.name,
                version: manifest.version || '1.0.0',
                description: manifest.description || '',
                author: normalizeAuthor(manifest.author),
                icon: manifest.icon || 'file',
                color: manifest.color || '#6B7280',
                tags: manifest.tags || manifest.keywords || [],
                downloads: manifest.downloads || 0,
                rating: manifest.rating || 0,
                installed: true, // 本地存在的都视为已安装
                isOfficial: manifest.author === 'atlas_official' || manifest.author === 'ATLAS Official' || manifest.isOfficial === true,
                updatedAt: manifest.updated_at || manifest.updatedAt || new Date().toISOString().split('T')[0],
                category: manifest.category || 'other',
                subcategory: manifest.subcategory,
                defaultFunction: functionsYaml?.default,
                defaultDisplay: displaysYaml?.default,
                blocksCount,
            });
        }
    }
    
    return packages;
}

/**
 * 按分类获取类型包
 */
export function getTypePackagesByCategory(): Record<string, TypePackageInfo[]> {
    const packages = getAllTypePackages();
    const categorized: Record<string, TypePackageInfo[]> = {};
    
    for (const pkg of packages) {
        const cat = pkg.category || 'other';
        if (!categorized[cat]) {
            categorized[cat] = [];
        }
        categorized[cat].push(pkg);
    }
    
    return categorized;
}

// ============================================================
// 主题包
// ============================================================

/**
 * 获取所有主题包
 */
export function getAllThemePackages(): ThemePackageInfo[] {
    const packages: ThemePackageInfo[] = [];
    
    if (!existsSync(THEME_PACKAGES_DIR)) {
        console.warn('[Plugins] Theme packages directory not found:', THEME_PACKAGES_DIR);
        return packages;
    }
    
    const dirs = readdirSync(THEME_PACKAGES_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory());
    
    for (const dir of dirs) {
        const pkgDir = join(THEME_PACKAGES_DIR, dir.name);
        const manifest = readManifest(pkgDir);
        
        if (manifest) {
            packages.push({
                id: manifest.id || dir.name,
                pluginType: 'theme-package',
                name: manifest.name || dir.name,
                version: manifest.version || '1.0.0',
                description: manifest.description || '',
                author: normalizeAuthor(manifest.author),
                icon: manifest.icon || 'palette',
                color: manifest.color || '#6B7280',
                tags: manifest.tags || manifest.keywords || [],
                downloads: manifest.downloads || 0,
                rating: manifest.rating || 0,
                installed: true,
                isOfficial: manifest.isOfficial === true || manifest.author === 'ATLAS Official',
                updatedAt: manifest.updated_at || manifest.updatedAt || new Date().toISOString().split('T')[0],
                mode: manifest.mode || 'both',
                previewColors: manifest.previewColors || [manifest.color || '#6B7280'],
            });
        }
    }
    
    return packages;
}

// ============================================================
// 扩展插件
// ============================================================

/**
 * 获取所有扩展插件
 */
export function getAllExtensions(): OtherPluginInfo[] {
    const plugins: OtherPluginInfo[] = [];
    
    if (!existsSync(EXTENSIONS_DIR)) {
        console.warn('[Plugins] Extensions directory not found:', EXTENSIONS_DIR);
        return plugins;
    }
    
    const dirs = readdirSync(EXTENSIONS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory());
    
    for (const dir of dirs) {
        const pluginDir = join(EXTENSIONS_DIR, dir.name);
        const manifest = readManifest(pluginDir);
        
        if (manifest) {
            plugins.push({
                id: manifest.id || dir.name,
                pluginType: 'other',
                name: manifest.name || dir.name,
                version: manifest.version || '1.0.0',
                description: manifest.description || '',
                author: normalizeAuthor(manifest.author),
                icon: manifest.icon || 'puzzle',
                color: manifest.color || '#6B7280',
                tags: manifest.tags || manifest.keywords || [],
                downloads: manifest.downloads || 0,
                rating: manifest.rating || 0,
                installed: true,
                isOfficial: manifest.isOfficial === true || manifest.author === 'ATLAS Official',
                updatedAt: manifest.updated_at || manifest.updatedAt || new Date().toISOString().split('T')[0],
                capabilities: manifest.capabilities || [],
            });
        }
    }
    
    return plugins;
}

// ============================================================
// 聚合查询
// ============================================================

/**
 * 获取所有插件
 */
export function getAllPlugins(): {
    typePackages: TypePackageInfo[];
    themePackages: ThemePackageInfo[];
    extensions: OtherPluginInfo[];
} {
    return {
        typePackages: getAllTypePackages(),
        themePackages: getAllThemePackages(),
        extensions: getAllExtensions(),
    };
}

/**
 * 获取插件统计信息
 */
export function getPluginStats(): {
    totalInstalled: number;
    typePackagesCount: number;
    themePackagesCount: number;
    extensionsCount: number;
} {
    const typePackages = getAllTypePackages();
    const themePackages = getAllThemePackages();
    const extensions = getAllExtensions();
    
    return {
        totalInstalled: typePackages.length + themePackages.length + extensions.length,
        typePackagesCount: typePackages.length,
        themePackagesCount: themePackages.length,
        extensionsCount: extensions.length,
    };
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 读取插件 manifest 文件（支持 yaml/json）
 */
function readManifest(pluginDir: string): Record<string, any> | null {
    // 尝试 yaml 格式
    const yamlPath = join(pluginDir, 'manifest.yaml');
    if (existsSync(yamlPath)) {
        try {
            const content = readFileSync(yamlPath, 'utf-8');
            return yaml.load(content) as Record<string, any>;
        } catch (error) {
            console.error(`[Plugins] Failed to parse ${yamlPath}:`, error);
        }
    }
    
    // 尝试 json 格式
    const jsonPath = join(pluginDir, 'manifest.json');
    if (existsSync(jsonPath)) {
        try {
            const content = readFileSync(jsonPath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.error(`[Plugins] Failed to parse ${jsonPath}:`, error);
        }
    }
    
    return null;
}

/**
 * 读取 YAML 文件
 */
function readYamlFile(filePath: string): Record<string, any> | null {
    if (!existsSync(filePath)) {
        return null;
    }
    
    try {
        const content = readFileSync(filePath, 'utf-8');
        return yaml.load(content) as Record<string, any>;
    } catch (error) {
        console.error(`[Plugins] Failed to parse ${filePath}:`, error);
        return null;
    }
}

/**
 * 计算数据块数量
 */
function countBlocks(pkgDir: string): number {
    const blocksDir = join(pkgDir, 'blocks');
    if (!existsSync(blocksDir)) {
        return 0;
    }
    
    try {
        return readdirSync(blocksDir).filter(f => 
            f.endsWith('.yaml') || f.endsWith('.json')
        ).length;
    } catch {
        return 0;
    }
}

/**
 * 规范化作者名称
 */
function normalizeAuthor(author: any): string {
    if (!author) return 'Unknown';
    if (typeof author === 'string') return author;
    if (typeof author === 'object' && author.name) return author.name;
    return 'Unknown';
}

// ============================================================
// 类型包数据块管理
// ============================================================

/** 数据块定义（新格式：icon 直接在顶层） */
export interface DataBlockDefinition {
    id: string;
    name: string;
    description: string;
    icon?: string;       // 新格式：图标直接在顶层
    required?: boolean;
    enabled: boolean;    // 是否启用此数据块
    order?: number;
    fields: DataBlockField[];
    // 兼容旧格式
    display?: {
        icon?: string;
        color?: string;
        default_expanded?: boolean;
    };
}

/** 数据块字段定义（新格式） */
export interface DataBlockField {
    key: string;
    label: string;
    component?: string;  // 绑定的组件 ID（新格式）
    defaultValue?: any;
    required?: boolean;
    // 兼容旧格式
    type?: string;
    placeholder?: string;
    options?: { value: string; label: string }[];
    hidden?: boolean;
    readOnly?: boolean;
    description?: string;
}

/**
 * 获取类型包的数据块定义
 * 
 * 优先读取 JSON 配置（用户自定义），若不存在则从 YAML 生成
 */
export function getTypePackageBlockDefinitions(packageId: string): DataBlockDefinition[] {
    const pkgDir = join(TYPE_PACKAGES_DIR, packageId);
    const blocksDir = join(pkgDir, 'blocks');
    
    if (!existsSync(blocksDir)) {
        return [];
    }
    
    const blocks: DataBlockDefinition[] = [];
    const yamlFiles = readdirSync(blocksDir).filter(f => f.endsWith('.yaml'));
    
    for (const yamlFile of yamlFiles) {
        const blockId = yamlFile.replace('.yaml', '');
        const jsonFile = join(blocksDir, `${blockId}.json`);
        const yamlFilePath = join(blocksDir, yamlFile);
        
        let blockDef: DataBlockDefinition | null = null;
        
        // 优先读取 JSON 配置（用户自定义）
        if (existsSync(jsonFile)) {
            try {
                const jsonContent = JSON.parse(readFileSync(jsonFile, 'utf-8'));
                blockDef = jsonContent;
            } catch (error) {
                console.error(`[Plugins] Failed to read ${jsonFile}:`, error);
            }
        }
        
        // JSON 不存在，从 YAML 生成
        if (!blockDef) {
            const yamlContent = readYamlFile(yamlFilePath);
            if (yamlContent) {
                // 新格式：icon 直接在顶层
                const icon = yamlContent.icon || yamlContent.display?.icon || 'database';
                
                blockDef = {
                    id: yamlContent.id || blockId,
                    name: yamlContent.name || blockId,
                    description: yamlContent.description || '',
                    icon,  // 新格式：图标直接在顶层
                    required: yamlContent.required || false,
                    enabled: yamlContent.enabled !== false,  // 默认启用
                    order: yamlContent.order || 999,
                    // 兼容旧格式，保留 display 对象
                    display: {
                        icon,
                        color: yamlContent.color || yamlContent.display?.color || '#8B5CF6',
                        default_expanded: yamlContent.display?.default_expanded || false,
                    },
                    fields: parseFieldsFromYaml(yamlContent),
                };
                
                // 自动生成 JSON 文件
                try {
                    writeFileSync(jsonFile, JSON.stringify(blockDef, null, 2), 'utf-8');
                    console.log(`[Plugins] Generated ${jsonFile} from YAML`);
                } catch (error) {
                    console.error(`[Plugins] Failed to generate ${jsonFile}:`, error);
                }
            }
        }
        
        if (blockDef) {
            blocks.push(blockDef);
        }
    }
    
    return blocks.sort((a, b) => a.order - b.order);
}

/**
 * 从 YAML 内容中解析字段定义
 * 
 * 支持三种格式：
 * 1. 新格式：直接 fields 数组（字段包含 component 引用）
 * 2. 旧格式：直接 schema 数组
 * 3. 旧格式：template 字符串（需要再次解析）
 */
function parseFieldsFromYaml(yamlContent: any): DataBlockField[] {
    // 新格式：直接 fields 数组
    if (Array.isArray(yamlContent?.fields)) {
        return yamlContent.fields.map((field: any) => ({
            key: field.key,
            label: field.label || field.key,
            component: field.component,  // 组件引用
            defaultValue: field.defaultValue ?? field.default ?? '',
            required: field.required || false,
            // 兼容旧字段
            type: field.type,
            placeholder: field.placeholder,
            options: field.options,
            hidden: field.hidden,
            readOnly: field.readOnly || field.readonly,
            description: field.description,
        }));
    }
    
    // 旧格式 1: 直接 schema 数组
    if (Array.isArray(yamlContent?.schema)) {
        return yamlContent.schema.map((field: any) => ({
            key: field.key,
            label: field.label || field.key,
            type: field.type || 'text',
            required: field.required || false,
            placeholder: field.placeholder,
            defaultValue: field.default ?? field.defaultValue ?? yamlContent.data?.[field.key],
            options: field.options,
            hidden: field.hidden,
            readOnly: field.readOnly || field.readonly,
            description: field.description,
        }));
    }
    
    // 旧格式 2: template 字符串
    if (typeof yamlContent?.template === 'string') {
        try {
            const parsed = yaml.load(yamlContent.template) as any;
            if (!parsed?.schema) return [];
            
            return parsed.schema.map((field: any) => ({
                key: field.key,
                label: field.label || field.key,
                type: field.type || 'text',
                required: field.required || false,
                placeholder: field.placeholder,
                defaultValue: parsed.data?.[field.key],
                options: field.options,
                hidden: field.hidden,
                readOnly: field.readOnly,
                description: field.description,
            }));
        } catch (error) {
            console.error('[Plugins] Failed to parse template:', error);
            return [];
        }
    }
    
    return [];
}

/**
 * 查找数据块对应的文件路径
 * 
 * 通过内部 id 匹配，因为 YAML 文件名可能与内部 id 不同
 */
function findBlockFiles(blocksDir: string, blockId: string): { yamlFile: string; jsonFile: string } | null {
    if (!existsSync(blocksDir)) {
        return null;
    }
    
    const yamlFiles = readdirSync(blocksDir).filter(f => f.endsWith('.yaml'));
    
    for (const yamlFileName of yamlFiles) {
        const yamlFilePath = join(blocksDir, yamlFileName);
        const yamlContent = readYamlFile(yamlFilePath);
        
        const fileBaseName = yamlFileName.replace('.yaml', '');
        const yamlId = yamlContent?.id || fileBaseName;
        
        // 匹配条件：YAML 内部 id 或文件名
        if (yamlId === blockId || fileBaseName === blockId) {
            return {
                yamlFile: yamlFilePath,
                jsonFile: join(blocksDir, `${fileBaseName}.json`),
            };
        }
    }
    
    return null;
}

/**
 * 更新数据块定义
 * 
 * 保存到 JSON 文件（用户自定义配置），不修改原始 YAML
 */
export function updateDataBlockDefinition(
    packageId: string,
    blockId: string,
    updates: Partial<DataBlockDefinition>
): boolean {
    const pkgDir = join(TYPE_PACKAGES_DIR, packageId);
    const blocksDir = join(pkgDir, 'blocks');
    
    // 查找对应的文件
    const files = findBlockFiles(blocksDir, blockId);
    if (!files) {
        console.error(`[Plugins] Block ${blockId} not found in package ${packageId}`);
        return false;
    }
    
    const { yamlFile, jsonFile } = files;
    
    // 先获取当前配置
    let currentConfig: DataBlockDefinition | null = null;
    
    // 优先读取现有 JSON
    if (existsSync(jsonFile)) {
        try {
            currentConfig = JSON.parse(readFileSync(jsonFile, 'utf-8'));
        } catch (error) {
            console.error(`[Plugins] Failed to read ${jsonFile}:`, error);
        }
    }
    
    // 如果没有 JSON，从 YAML 读取
    if (!currentConfig) {
        const yamlContent = readYamlFile(yamlFile);
        if (!yamlContent) return false;
        
        currentConfig = {
            id: yamlContent.id || blockId,
            name: yamlContent.name || blockId,
            description: yamlContent.description || '',
            required: yamlContent.required || false,
            enabled: yamlContent.enabled !== false,  // 默认启用
            order: yamlContent.order || 999,
            display: {
                icon: yamlContent.icon || yamlContent.display?.icon || 'database',
                color: yamlContent.color || yamlContent.display?.color || '#6B7280',
                default_expanded: yamlContent.display?.default_expanded || false,
            },
            fields: parseFieldsFromYaml(yamlContent),
        };
    }
    
    try {
        // 合并更新
        const newConfig: DataBlockDefinition = {
            ...currentConfig,
            ...updates,
            id: currentConfig.id, // ID 不可修改
        };
        
        // 保存到 JSON 文件
        writeFileSync(jsonFile, JSON.stringify(newConfig, null, 2), 'utf-8');
        
        console.log(`[Plugins] Updated ${jsonFile}`);
        return true;
    } catch (error) {
        console.error(`[Plugins] Failed to update block:`, error);
        return false;
    }
}

/**
 * 恢复数据块到初始状态
 * 
 * 删除 JSON 文件，下次读取时会从 YAML 重新生成
 */
export function resetDataBlockDefinition(
    packageId: string,
    blockId: string
): boolean {
    const pkgDir = join(TYPE_PACKAGES_DIR, packageId);
    const blocksDir = join(pkgDir, 'blocks');
    
    // 查找对应的 YAML 文件（通过内部 id 匹配）
    const yamlFiles = readdirSync(blocksDir).filter(f => f.endsWith('.yaml'));
    let targetYamlFile: string | null = null;
    let targetJsonFile: string | null = null;
    
    for (const yamlFileName of yamlFiles) {
        const yamlFilePath = join(blocksDir, yamlFileName);
        const yamlContent = readYamlFile(yamlFilePath);
        
        // 匹配条件：YAML 内部 id 或文件名（不含扩展名）
        const fileBaseName = yamlFileName.replace('.yaml', '');
        const yamlId = yamlContent?.id || fileBaseName;
        
        if (yamlId === blockId || fileBaseName === blockId) {
            targetYamlFile = yamlFilePath;
            targetJsonFile = join(blocksDir, `${fileBaseName}.json`);
            break;
        }
    }
    
    if (!targetYamlFile) {
        console.error(`[Plugins] Block ${blockId} not found in package ${packageId}`);
        return false;
    }
    
    try {
        // 删除 JSON 文件
        if (targetJsonFile && existsSync(targetJsonFile)) {
            unlinkSync(targetJsonFile);
            console.log(`[Plugins] Deleted ${targetJsonFile}`);
        }
        
        // 从 YAML 重新生成 JSON
        const yamlContent = readYamlFile(targetYamlFile);
        if (yamlContent && targetJsonFile) {
            const blockDef: DataBlockDefinition = {
                id: yamlContent.id || blockId,
                name: yamlContent.name || blockId,
                description: yamlContent.description || '',
                required: yamlContent.required || false,
                enabled: yamlContent.enabled !== false,  // 默认启用
                order: yamlContent.order || 999,
                display: {
                    icon: yamlContent.icon || yamlContent.display?.icon || 'database',
                    color: yamlContent.color || yamlContent.display?.color || '#6B7280',
                    default_expanded: yamlContent.display?.default_expanded || false,
                },
                fields: parseFieldsFromYaml(yamlContent),
            };
            
            writeFileSync(targetJsonFile, JSON.stringify(blockDef, null, 2), 'utf-8');
            console.log(`[Plugins] Regenerated ${targetJsonFile} from YAML`);
        }
        
        return true;
    } catch (error) {
        console.error(`[Plugins] Failed to reset block:`, error);
        return false;
    }
}

