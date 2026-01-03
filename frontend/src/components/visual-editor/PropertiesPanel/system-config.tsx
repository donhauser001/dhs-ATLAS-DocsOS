/**
 * 系统属性静态配置
 * 
 * 注意：标签名称和图标从标签映射系统获取（useLabels）
 * 这里只存放静态配置（类型、只读、宽度等）
 */

/**
 * 系统属性静态配置
 */
export interface SystemPropertyStaticConfig {
    /** 属性类型 */
    type: 'text' | 'date' | 'tags';
    /** 是否只读 */
    readonly?: boolean;
    /** 是否宽属性（跨列） */
    wide?: boolean;
    /** 默认图标（当标签系统未配置时使用） */
    defaultIcon?: string;
}

/**
 * 系统属性静态配置映射
 */
export const systemPropertyStaticConfig: Record<string, SystemPropertyStaticConfig> = {
    'version': {
        type: 'text',
        defaultIcon: 'zap',
    },
    'document_type': {
        type: 'text',
        defaultIcon: 'file-text',
    },
    'author': {
        type: 'text',
        defaultIcon: 'user',
    },
    'created': {
        type: 'date',
        readonly: true,
        defaultIcon: 'calendar',
    },
    'updated': {
        type: 'date',
        readonly: true,
        defaultIcon: 'calendar',
    },
    'atlas.function': {
        type: 'text',
        defaultIcon: 'shield',
    },
    'atlas.capabilities': {
        type: 'tags',
        wide: true,
        defaultIcon: 'tag',
    },
};

// 导出兼容旧代码的别名
export const systemPropertiesConfig = systemPropertyStaticConfig;
