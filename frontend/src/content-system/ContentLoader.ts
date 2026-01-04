/**
 * ContentLoader - 内容加载器
 * 
 * 负责扫描、加载和管理 atlas-content 目录中的插件和资产
 */

import type {
    PluginManifest,
    TypePackageManifest,
    ThemePackageManifest,
    ExtensionManifest,
    InstalledPlugin,
    GlobalTheme,
    Asset,
    ContentSystemState,
    PluginType,
    PluginStatus,
} from './types';
import { DEFAULT_CONTENT_CONFIG, PLUGIN_SUBDIRS, MANIFEST_FILENAME } from './constants';

/**
 * 内容加载器类
 */
export class ContentLoader {
    private state: ContentSystemState;
    private baseUrl: string;

    constructor(baseUrl: string = '') {
        this.baseUrl = baseUrl;
        this.state = {
            plugins: [],
            themes: [],
            activeTheme: 'atlas-default',
            assets: [],
            config: DEFAULT_CONTENT_CONFIG,
        };
    }

    /**
     * 获取当前状态
     */
    getState(): ContentSystemState {
        return this.state;
    }

    /**
     * 获取所有插件
     */
    getPlugins(): InstalledPlugin[] {
        return this.state.plugins;
    }

    /**
     * 按类型获取插件
     */
    getPluginsByType(type: PluginType): InstalledPlugin[] {
        return this.state.plugins.filter(p => p.manifest.type === type);
    }

    /**
     * 获取类型包
     */
    getTypePackages(): InstalledPlugin[] {
        return this.getPluginsByType('type-package');
    }

    /**
     * 获取主题包
     */
    getThemePackages(): InstalledPlugin[] {
        return this.getPluginsByType('theme-package');
    }

    /**
     * 获取扩展插件
     */
    getExtensions(): InstalledPlugin[] {
        return this.getPluginsByType('extension');
    }

    /**
     * 根据 ID 获取插件
     */
    getPluginById(id: string): InstalledPlugin | undefined {
        return this.state.plugins.find(p => p.manifest.id === id);
    }

    /**
     * 获取激活的插件
     */
    getActivePlugins(): InstalledPlugin[] {
        return this.state.plugins.filter(p => p.enabled && p.status === 'active');
    }

    /**
     * 加载插件清单
     */
    async loadManifest(path: string): Promise<PluginManifest | null> {
        try {
            const response = await fetch(`${this.baseUrl}/${path}/${MANIFEST_FILENAME}`);
            if (!response.ok) {
                console.warn(`Failed to load manifest from ${path}: ${response.status}`);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading manifest from ${path}:`, error);
            return null;
        }
    }

    /**
     * 扫描并加载所有插件
     */
    async scanPlugins(): Promise<void> {
        const plugins: InstalledPlugin[] = [];
        const { pluginsDir } = this.state.config;

        // 扫描各类型插件目录
        for (const [type, subdir] of Object.entries(PLUGIN_SUBDIRS)) {
            const pluginType = this.getPluginTypeFromSubdir(subdir);
            const dirPath = `${pluginsDir}/${subdir}`;
            
            try {
                // 在实际实现中，这里需要后端 API 来列出目录
                // 目前使用硬编码的已知插件列表
                const knownPlugins = this.getKnownPlugins(pluginType);
                
                for (const pluginId of knownPlugins) {
                    const manifest = await this.loadManifest(`${dirPath}/${pluginId}`);
                    if (manifest) {
                        plugins.push({
                            manifest,
                            status: 'active',
                            installedAt: manifest.createdAt || new Date().toISOString(),
                            updatedAt: manifest.updatedAt || new Date().toISOString(),
                            path: `${dirPath}/${pluginId}`,
                            enabled: true,
                        });
                    }
                }
            } catch (error) {
                console.error(`Error scanning ${type} plugins:`, error);
            }
        }

        this.state.plugins = plugins;
        this.state.lastScanAt = new Date().toISOString();
    }

    /**
     * 获取已知插件列表（临时方案，后续应从后端获取）
     */
    private getKnownPlugins(type: PluginType): string[] {
        switch (type) {
            case 'type-package':
                return ['client', 'contact', 'project', 'task', 'article', 'note'];
            case 'theme-package':
                return ['atlas-default', 'dark-pro'];
            case 'extension':
                return [];
            default:
                return [];
        }
    }

    /**
     * 从子目录名获取插件类型
     */
    private getPluginTypeFromSubdir(subdir: string): PluginType {
        switch (subdir) {
            case PLUGIN_SUBDIRS.typePackages:
                return 'type-package';
            case PLUGIN_SUBDIRS.themePackages:
                return 'theme-package';
            case PLUGIN_SUBDIRS.extensions:
                return 'extension';
            default:
                return 'extension';
        }
    }

    /**
     * 启用插件
     */
    enablePlugin(id: string): boolean {
        const plugin = this.getPluginById(id);
        if (plugin) {
            plugin.enabled = true;
            plugin.status = 'active';
            return true;
        }
        return false;
    }

    /**
     * 禁用插件
     */
    disablePlugin(id: string): boolean {
        const plugin = this.getPluginById(id);
        if (plugin) {
            plugin.enabled = false;
            plugin.status = 'inactive';
            return true;
        }
        return false;
    }

    /**
     * 设置当前主题
     */
    setActiveTheme(themeId: string): boolean {
        const themePlugin = this.state.plugins.find(
            p => p.manifest.type === 'theme-package' && p.manifest.id === themeId
        );
        if (themePlugin) {
            this.state.activeTheme = themeId;
            return true;
        }
        return false;
    }

    /**
     * 获取当前主题
     */
    getActiveTheme(): InstalledPlugin | undefined {
        return this.state.plugins.find(
            p => p.manifest.type === 'theme-package' && p.manifest.id === this.state.activeTheme
        );
    }

    /**
     * 获取类型包的数据块定义
     */
    getBlockDefinitions(typePackageId: string) {
        const plugin = this.getPluginById(typePackageId);
        if (plugin && plugin.manifest.type === 'type-package') {
            return (plugin.manifest as TypePackageManifest).blocks;
        }
        return [];
    }

    /**
     * 获取主题包的颜色变量
     */
    getThemeColors(themeId: string) {
        const plugin = this.getPluginById(themeId);
        if (plugin && plugin.manifest.type === 'theme-package') {
            return (plugin.manifest as ThemePackageManifest).colors;
        }
        return [];
    }
}

// 单例实例
let contentLoader: ContentLoader | null = null;

/**
 * 获取内容加载器实例
 */
export function getContentLoader(baseUrl?: string): ContentLoader {
    if (!contentLoader) {
        contentLoader = new ContentLoader(baseUrl);
    }
    return contentLoader;
}

/**
 * 重置内容加载器（用于测试）
 */
export function resetContentLoader(): void {
    contentLoader = null;
}

export default ContentLoader;

