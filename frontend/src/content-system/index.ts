/**
 * ATLAS 内容系统
 * 
 * 类似 WordPress wp-content 的系统级内容管理
 * 
 * @example
 * ```ts
 * import { useContentSystem, getContentLoader } from '@/content-system';
 * 
 * // 在组件中使用 Hook
 * const { plugins, typePackages, themePackages, activeTheme } = useContentSystem();
 * 
 * // 直接使用加载器
 * const loader = getContentLoader();
 * await loader.scanPlugins();
 * const plugins = loader.getPlugins();
 * ```
 */

// 类型导出
export * from './types';

// 常量导出
export * from './constants';

// 加载器导出
export { ContentLoader, getContentLoader, resetContentLoader } from './ContentLoader';

// Hooks 导出
export { useContentSystem } from './hooks';

