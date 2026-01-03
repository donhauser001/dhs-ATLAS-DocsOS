/**
 * Property 类型系统 - Phase 3.8 可视化编辑器
 * 
 * 遵循 Iron Rule 2: Key 与 Label 必须分离
 * - key: 系统唯一标识，永不改变
 * - label: 用户看到的显示名称，可随时修改
 */

import type { ReactNode } from 'react';

// ============================================================
// 属性组件类型
// ============================================================

/**
 * 内置属性组件类型
 */
export type BuiltinPropertyType =
  | 'text'           // 单行文本
  | 'textarea'       // 多行文本
  | 'number'         // 数字
  | 'select'         // 下拉选择（单选）
  | 'multi-select'   // 多选标签
  | 'date'           // 日期
  | 'datetime'       // 日期时间
  | 'checkbox'       // 复选框
  | 'rating'         // 星级评分
  | 'link'           // 文档链接
  | 'user'           // 用户选择
  | 'file'           // 文件附件
  | 'color'          // 颜色选择
  | 'icon'           // 图标选择
  | 'formula';       // 公式（只读）

/**
 * 属性组件类型（内置 + 插件扩展）
 */
export type PropertyComponentType = BuiltinPropertyType | `plugin-${string}`;

// ============================================================
// 选项定义（用于 select/multi-select）
// ============================================================

/**
 * 选项项 - 遵循 Key/Label 分离
 */
export interface PropertyOption {
  /** 选项唯一标识（存储用） */
  key: string;
  /** 选项显示名称 */
  label: string;
  /** 选项颜色（可选） */
  color?: string;
  /** 选项图标（可选） */
  icon?: string;
}

// ============================================================
// 属性定义
// ============================================================

/**
 * 属性定义 - 存储在 frontmatter._properties 中
 */
export interface PropertyDefinition {
  /** 属性唯一标识（系统用，永不改变） */
  key: string;
  /** 属性显示名称（用户看，可修改） */
  label: string;
  /** 属性描述（可选，给小白的说明文字） */
  description?: string;
  /** 组件类型 */
  type: PropertyComponentType;
  /** 是否必填 */
  required?: boolean;
  /** 组件特定配置 */
  config?: PropertyComponentConfig;
}

/**
 * 属性组件配置（根据类型不同而不同）
 */
export interface PropertyComponentConfig {
  // text / textarea
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  
  // number
  min?: number;
  max?: number;
  step?: number;
  
  // select / multi-select
  options?: PropertyOption[];
  maxSelect?: number;
  allowCreate?: boolean;
  
  // date / datetime
  format?: string;
  
  // rating
  maxRating?: number;
  
  // link
  allowedTypes?: string[];
  
  // file
  accept?: string;
  maxSize?: number;
  
  // color
  presets?: string[];
  
  // icon
  iconSet?: string;
  
  // formula
  expression?: string;
  
  // 扩展字段（插件用）
  [key: string]: unknown;
}

// ============================================================
// 属性值
// ============================================================

/**
 * 属性值存储 - 存储在 frontmatter._values 中
 * key → value 映射
 */
export type PropertyValues = Record<string, unknown>;

// ============================================================
// 属性组件接口（用于组件注册）
// ============================================================

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * 组件渲染上下文
 */
export interface PropertyRenderContext {
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否只读 */
  readonly?: boolean;
  /** 主题模式 */
  theme?: 'light' | 'dark';
}

/**
 * 属性组件接口 - 所有属性组件必须实现
 * 
 * 遵循 Iron Rule 3: 插件组件必须可降级
 */
export interface PropertyComponent {
  // === 身份标识 ===
  /** 组件唯一标识（如 'select', 'plugin-gantt'） */
  id: PropertyComponentType;
  /** 组件版本（用于兼容性检查） */
  version: string;
  /** 显示名称 */
  name: string;
  /** 组件图标 */
  icon: string;
  /** 组件描述 */
  description: string;
  
  // === 配置定义 ===
  /** 默认配置 */
  defaultConfig: PropertyComponentConfig;
  
  // === 渲染器（全部必须实现） ===
  
  /**
   * 渲染配置面板
   * 用于用户配置属性（如设置下拉选项）
   */
  renderConfig: (
    config: PropertyComponentConfig,
    onChange: (config: PropertyComponentConfig) => void
  ) => ReactNode;
  
  /**
   * 渲染编辑态
   * 用于属性面板和正文中的可编辑控件
   */
  renderEditor: (
    value: unknown,
    config: PropertyComponentConfig,
    onChange: (value: unknown) => void,
    context?: PropertyRenderContext
  ) => ReactNode;
  
  /**
   * 渲染只读态
   * 用于阅读模式
   */
  renderView: (
    value: unknown,
    config: PropertyComponentConfig,
    context?: PropertyRenderContext
  ) => ReactNode;
  
  /**
   * 渲染行内引用
   * 用于正文中的属性徽标
   */
  renderInline: (
    value: unknown,
    config: PropertyComponentConfig
  ) => ReactNode;
  
  /**
   * ⚠️ 失效态渲染（必须实现，不可为空）
   * 
   * 遵循 Iron Rule 3: 任何插件组件，在插件不存在时，必须仍能渲染。
   * "卸载插件 → 文档打不开"是不可接受的。
   */
  renderFallback: (
    lastValue: unknown,
    config: unknown
  ) => ReactNode;
  
  // === 验证 ===
  
  /**
   * 验证值是否有效
   */
  validate: (
    value: unknown,
    config: PropertyComponentConfig
  ) => ValidationResult;
  
  // === 序列化（用于存储和失效态显示） ===
  
  /**
   * 值序列化为字符串（用于 YAML 存储）
   */
  serialize: (value: unknown) => string;
  
  /**
   * 字符串反序列化为值
   */
  deserialize: (str: string) => unknown;
}

// ============================================================
// 文档属性结构（frontmatter 扩展）
// ============================================================

/**
 * 文档属性扩展字段
 * 存储在 frontmatter 中
 */
export interface DocumentPropertyFields {
  /** 属性定义 */
  _properties?: Record<string, Omit<PropertyDefinition, 'key'>>;
  /** 属性值 */
  _values?: PropertyValues;
}

// ============================================================
// 属性引用
// ============================================================

/**
 * 属性引用信息
 * 正文中的 {{key}} 解析结果
 */
export interface PropertyReference {
  /** 属性 key */
  key: string;
  /** 原始字符串（如 "{{client_category}}"） */
  raw: string;
  /** 在文本中的起始位置 */
  start: number;
  /** 在文本中的结束位置 */
  end: number;
}

/**
 * 解析正文中的属性引用
 */
export function parsePropertyReferences(text: string): PropertyReference[] {
  const regex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  const references: PropertyReference[] = [];
  let match: RegExpExecArray | null;
  
  while ((match = regex.exec(text)) !== null) {
    references.push({
      key: match[1],
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  
  return references;
}

// ============================================================
// 系统属性（不可删除的固定字段）
// ============================================================

/**
 * 系统保留属性 key 列表
 */
export const SYSTEM_PROPERTY_KEYS = [
  'version',
  'document_type',
  'created',
  'updated',
  'author',
  'atlas.function',
  'atlas.capabilities',
  'atlas.entity_type',
] as const;

export type SystemPropertyKey = typeof SYSTEM_PROPERTY_KEYS[number];

/**
 * 检查是否为系统属性
 */
export function isSystemProperty(key: string): boolean {
  return SYSTEM_PROPERTY_KEYS.includes(key as SystemPropertyKey);
}

