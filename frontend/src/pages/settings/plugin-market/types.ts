/**
 * 插件市场类型定义
 */

/** 插件类型 */
export type PluginType = 'type-package' | 'theme-package' | 'other';

/** Tab 类型 */
export type TabType = 'installed' | 'market';

/** 视图模式 */
export type ViewMode = 'grid' | 'list';

/** 排序选项 */
export type SortOption = 'downloads' | 'rating' | 'updated';

/** 基础插件接口 */
export interface BasePlugin {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    icon: string;
    color: string;
    downloads: number;
    rating: number;
    installed: boolean;
    isOfficial: boolean;
    tags: string[];
    updatedAt: string;
    pluginType: PluginType;
}

/** 类型包 */
export interface TypePackage extends BasePlugin {
    pluginType: 'type-package';
    category: string;
    subcategory?: string;
    defaultFunction?: string;
    defaultDisplay?: string;
    blocksCount: number;
}

/** 主题包 */
export interface ThemePackage extends BasePlugin {
    pluginType: 'theme-package';
    mode: 'light' | 'dark' | 'both';
    previewColors: string[];
}

/** 其他插件 */
export interface OtherPlugin extends BasePlugin {
    pluginType: 'other';
    capabilities: string[];
}

/** 联合类型 */
export type Plugin = TypePackage | ThemePackage | OtherPlugin;

/** 插件类型配置 */
export interface PluginTypeConfig {
    id: PluginType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    color: string;
}

/** 类型包分类配置 */
export interface TypeCategoryConfig {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

