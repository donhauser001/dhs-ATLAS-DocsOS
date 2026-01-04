/**
 * ATLAS 内容系统类型定义
 * 
 * 类似 WordPress wp-content 的系统级内容管理
 */

// ============================================================
// 基础类型
// ============================================================

/** 插件类型 */
export type PluginType = 'type-package' | 'theme-package' | 'extension';

/** 插件状态 */
export type PluginStatus = 'active' | 'inactive' | 'error' | 'updating';

/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'system';

/** 资产类型 */
export type AssetType = 'icon' | 'font' | 'image' | 'template' | 'style';

// ============================================================
// 作者信息
// ============================================================

export interface Author {
    name: string;
    email?: string;
    url?: string;
    avatar?: string;
}

// ============================================================
// 版本要求
// ============================================================

export interface VersionRequirement {
    minVersion?: string;
    maxVersion?: string;
}

// ============================================================
// 基础清单接口
// ============================================================

export interface BaseManifest {
    /** 唯一标识符 */
    id: string;
    /** 显示名称 */
    name: string;
    /** 版本号 (semver) */
    version: string;
    /** 插件类型 */
    type: PluginType;
    /** 描述 */
    description: string;
    /** 作者信息 */
    author: Author;
    /** 许可证 */
    license?: string;
    /** 主页 */
    homepage?: string;
    /** 仓库地址 */
    repository?: string;
    /** 关键词 */
    keywords?: string[];
    /** 入口文件 */
    main?: string;
    /** ATLAS 版本要求 */
    atlas?: VersionRequirement;
    /** 依赖 */
    dependencies?: Record<string, string>;
    /** 是否官方 */
    isOfficial?: boolean;
    /** 图标 */
    icon?: string;
    /** 主题色 */
    color?: string;
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
}

// ============================================================
// 类型包清单
// ============================================================

/** 数据块字段定义 */
export interface BlockFieldDefinition {
    key: string;
    type: string;
    label: string;
    description?: string;
    required?: boolean;
    default?: unknown;
    options?: Array<{ value: string; label: string }>;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        message?: string;
    };
}

/** 数据块定义 */
export interface BlockDefinition {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    fields: BlockFieldDefinition[];
    /** 默认展开 */
    defaultExpanded?: boolean;
    /** 最大实例数 */
    maxInstances?: number;
}

/** 视图定义 */
export interface ViewDefinition {
    id: string;
    name: string;
    description?: string;
    component: string;
    icon?: string;
    /** 支持的显示模式 */
    supportedModes?: string[];
}

/** 类型包清单 */
export interface TypePackageManifest extends BaseManifest {
    type: 'type-package';
    /** 类型分类 */
    category: 'system' | 'business' | 'content' | 'custom';
    /** 数据块定义 */
    blocks: BlockDefinition[];
    /** 视图定义 */
    views?: ViewDefinition[];
    /** 默认功能类型 */
    defaultFunction?: string;
    /** 默认显示模式 */
    defaultDisplay?: string;
    /** 默认能力 */
    defaultCapabilities?: string[];
    /** Frontmatter 模板 */
    frontmatterTemplate?: Record<string, unknown>;
    /** 示例文档 */
    examples?: Array<{
        title: string;
        content: string;
    }>;
}

// ============================================================
// 主题包清单
// ============================================================

/** 颜色变量定义 */
export interface ColorVariable {
    name: string;
    light: string;
    dark: string;
}

/** 主题包清单 */
export interface ThemePackageManifest extends BaseManifest {
    type: 'theme-package';
    /** 支持的模式 */
    mode: 'light' | 'dark' | 'both';
    /** 预览颜色 */
    previewColors: string[];
    /** 颜色变量 */
    colors?: ColorVariable[];
    /** 字体配置 */
    fonts?: {
        primary?: string;
        secondary?: string;
        mono?: string;
    };
    /** 样式文件 */
    styles?: string[];
    /** 资产文件 */
    assets?: string[];
}

// ============================================================
// 扩展插件清单
// ============================================================

/** 能力定义 */
export interface CapabilityDefinition {
    id: string;
    name: string;
    description?: string;
    permissions?: string[];
}

/** 钩子定义 */
export interface HookDefinition {
    name: string;
    handler: string;
    priority?: number;
}

/** 扩展插件清单 */
export interface ExtensionManifest extends BaseManifest {
    type: 'extension';
    /** 提供的能力 */
    capabilities?: CapabilityDefinition[];
    /** 钩子 */
    hooks?: HookDefinition[];
    /** API 端点 */
    endpoints?: Array<{
        method: string;
        path: string;
        handler: string;
    }>;
    /** 菜单项 */
    menuItems?: Array<{
        id: string;
        label: string;
        icon?: string;
        position?: 'sidebar' | 'toolbar' | 'settings';
        handler: string;
    }>;
}

// ============================================================
// 联合类型
// ============================================================

export type PluginManifest = TypePackageManifest | ThemePackageManifest | ExtensionManifest;

// ============================================================
// 已安装插件
// ============================================================

export interface InstalledPlugin {
    manifest: PluginManifest;
    status: PluginStatus;
    installedAt: string;
    updatedAt: string;
    path: string;
    enabled: boolean;
    error?: string;
}

// ============================================================
// 全局主题
// ============================================================

export interface GlobalTheme {
    id: string;
    name: string;
    description?: string;
    mode: ThemeMode;
    basedOn?: string;
    customizations?: {
        colors?: Record<string, string>;
        fonts?: Record<string, string>;
        spacing?: Record<string, string>;
        borderRadius?: Record<string, string>;
    };
    createdAt: string;
    updatedAt: string;
}

// ============================================================
// 资产
// ============================================================

export interface Asset {
    id: string;
    name: string;
    type: AssetType;
    path: string;
    url?: string;
    size?: number;
    mimeType?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

// ============================================================
// 内容目录配置
// ============================================================

export interface ContentDirectoryConfig {
    /** 插件目录 */
    pluginsDir: string;
    /** 主题目录 */
    themesDir: string;
    /** 资产目录 */
    assetsDir: string;
    /** 缓存目录 */
    cacheDir: string;
}

// ============================================================
// 内容系统状态
// ============================================================

export interface ContentSystemState {
    /** 已安装的插件 */
    plugins: InstalledPlugin[];
    /** 全局主题 */
    themes: GlobalTheme[];
    /** 当前激活的主题 */
    activeTheme: string;
    /** 资产索引 */
    assets: Asset[];
    /** 目录配置 */
    config: ContentDirectoryConfig;
    /** 最后扫描时间 */
    lastScanAt?: string;
}

