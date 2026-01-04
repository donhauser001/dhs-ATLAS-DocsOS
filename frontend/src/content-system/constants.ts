/**
 * 内容系统常量
 */

import type { ContentDirectoryConfig } from './types';

/** 默认目录配置 */
export const DEFAULT_CONTENT_CONFIG: ContentDirectoryConfig = {
    pluginsDir: 'atlas-content/plugins',
    themesDir: 'atlas-content/themes',
    assetsDir: 'atlas-content/assets',
    cacheDir: 'atlas-content/cache',
};

/** 插件子目录 */
export const PLUGIN_SUBDIRS = {
    typePackages: 'type-packages',
    themePackages: 'theme-packages',
    extensions: 'extensions',
} as const;

/** 资产子目录 */
export const ASSET_SUBDIRS = {
    icons: 'icons',
    fonts: 'fonts',
    images: 'images',
    templates: 'templates',
} as const;

/** 清单文件名 */
export const MANIFEST_FILENAME = 'manifest.json';

/** 支持的图标 */
export const SUPPORTED_ICONS = [
    'building',
    'user',
    'folder',
    'check-square',
    'file-text',
    'calendar',
    'sticky-note',
    'images',
    'folder-open',
    'settings',
    'file-plus',
    'palette',
    'sun',
    'moon',
    'sparkles',
    'zap',
    'layout',
    'puzzle',
    'phone',
    'mail',
    'link',
    'share-2',
    'users',
    'briefcase',
    'dollar-sign',
    'flag',
    'info',
    'history',
    'globe',
    'search',
] as const;

/** 插件状态颜色 */
export const PLUGIN_STATUS_COLORS = {
    active: '#10B981',    // green
    inactive: '#64748B',  // gray
    error: '#EF4444',     // red
    updating: '#F59E0B',  // amber
} as const;

