/**
 * YAML 语义化编辑器类型定义
 */

export type FieldType = 
  | 'text'       // 单行文本
  | 'textarea'   // 多行文本
  | 'select'     // 下拉选择
  | 'status'     // 状态选择（特殊的 select）
  | 'switch'     // 开关
  | 'rating'     // 星级评分
  | 'date'       // 日期
  | 'tags'       // 标签列表
  | 'ref'        // 文档引用
  | 'color'      // 颜色
  | 'number'     // 数字
  | 'readonly'   // 只读
  | 'object'     // 嵌套对象
  | 'unknown';   // 未知类型

export interface FieldConfig {
  type: FieldType;
  label: string;
  description?: string;
  options?: Array<{ value: string; label: string }>;
  readonly?: boolean;
  required?: boolean;
  max?: number;       // 用于 rating
  placeholder?: string;
}

export interface SemanticFieldProps {
  fieldKey: string;
  value: unknown;
  config: FieldConfig;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export interface SemanticYamlEditorProps {
  /** YAML 解析后的对象 */
  data: Record<string, unknown>;
  /** 实体类型（用于加载 schema） */
  entityType?: string;
  /** 数据变更回调 */
  onChange: (data: Record<string, unknown>) => void;
  /** 是否禁用编辑 */
  disabled?: boolean;
  /** 标题 */
  title?: string;
  /** 图标 */
  icon?: string;
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 默认展开 */
  defaultExpanded?: boolean;
}

/** 已知的状态值 */
export const STATUS_VALUES = ['active', 'inactive', 'draft', 'archived', 'pending', 'error'] as const;

/** 已知的布尔字段名 */
export const BOOLEAN_FIELD_NAMES = ['visible', 'enabled', 'active', 'required', 'optional', 'public', 'private'] as const;

/** 已知的日期字段名 */
export const DATE_FIELD_NAMES = ['date', 'created', 'updated', 'start_date', 'end_date', 'due_date', 'birthday'] as const;

/** 已知的只读字段名 */
export const READONLY_FIELD_NAMES = ['type', 'id', 'created', 'updated'] as const;

/** 已知的评分字段名 */
export const RATING_FIELD_NAMES = ['rating', 'score', 'priority', 'importance', 'level'] as const;

/** 已知的颜色字段名 */
export const COLOR_FIELD_NAMES = ['color', 'bg', 'background', 'text', 'accent'] as const;

/** 已知的引用字段名后缀 */
export const REF_FIELD_SUFFIXES = ['_ref', 'Ref', '_link', '_path'] as const;

