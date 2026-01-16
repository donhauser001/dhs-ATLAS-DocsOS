/**
 * 系统属性静态配置
 * 
 * 注意：标签名称和图标从标签映射系统获取（useLabels）
 * 这里只存放静态配置（类型、只读、宽度等）
 */

/**
 * 系统属性类型
 */
export type SystemPropertyType =
    | 'text'           // 普通文本
    | 'date'           // 日期
    | 'tags'           // 标签列表
    | 'doc-type'       // 文档类型选择器
    | 'function-type'  // 功能类型选择器
    | 'display-modes'  // 显现模式多选（支持视图切换）
    | 'capabilities';  // 能力类型多选

/**
 * 系统属性静态配置
 */
export interface SystemPropertyStaticConfig {
    /** 属性类型 */
    type: SystemPropertyType;
    /** 是否只读 */
    readonly?: boolean;
    /** 是否宽属性（跨列） */
    wide?: boolean;
    /** 默认图标（当标签系统未配置时使用） */
    defaultIcon?: string;
    /** 是否必填 */
    required?: boolean;
}

/**
 * 系统属性静态配置映射
 * 
 * 必填字段：title, created, updated, author
 * 类型配置字段：document_type, atlas.function, atlas.display
 * 能力字段：atlas.capabilities
 */
export const systemPropertyStaticConfig: Record<string, SystemPropertyStaticConfig> = {
    // ========== 必填基础字段 ==========
    'title': {
        type: 'text',
        defaultIcon: 'type',
        required: true,
    },
    'author': {
        type: 'text',
        defaultIcon: 'user',
        required: true,
    },
    'created': {
        type: 'date',
        readonly: true,
        defaultIcon: 'calendar-plus',
        required: true,
    },
    'updated': {
        type: 'date',
        readonly: true,
        defaultIcon: 'calendar-check',
        required: true,
    },

    // ========== 文档分类配置 ==========
    'document_type': {
        type: 'doc-type',
        defaultIcon: 'package',
        readonly: true,  // 文档类型由类型包决定，只读显示
    },
    'atlas.function': {
        type: 'function-type',
        defaultIcon: 'workflow',
    },
    'atlas.display': {
        type: 'display-modes',
        defaultIcon: 'layout',
    },

    // ========== 能力配置 ==========
    'atlas.capabilities': {
        type: 'capabilities',
        defaultIcon: 'zap',
        wide: true,  // 能力是多选，需要更多空间
    },

    // ========== 版本信息（可选显示） ==========
    'version': {
        type: 'text',
        defaultIcon: 'git-branch',
    },

    // ========== URL Slug ==========
    'slug': {
        type: 'text',
        defaultIcon: 'link',
    },
};

// 导出兼容旧代码的别名
export const systemPropertiesConfig = systemPropertyStaticConfig;
