/**
 * ADL 类型定义（前端）
 * 
 * Phase 3.0: 工程与可维护性
 */

/**
 * Machine Block 数据
 */
export interface MachineBlock {
  type: string;
  id: string;
  status: 'active' | 'draft' | 'archived';
  title: string;
  category?: unknown;
  $display?: DisplayHints;
  $constraints?: ConstraintHints;
  [key: string]: unknown;
}

/**
 * 显现提示
 */
export interface DisplayHints {
  color?: TokenRef;
  icon?: TokenRef;
  bgColor?: TokenRef;
  layout?: string;
  [key: string]: unknown;
}

/**
 * 约束提示
 */
export interface ConstraintHints {
  editable?: string[];
  readonly?: string[];
  required?: string[];
  lifecycle?: string;
}

/**
 * Token 引用
 */
export interface TokenRef {
  token: string;
}

/**
 * Anchor 引用
 */
export interface AnchorRef {
  ref: string;
}

/**
 * Block 数据
 */
export interface Block {
  /** 稳定定位标识 */
  anchor: string;
  /** 标题文本 */
  heading: string;
  /** 标题级别 */
  level: number;
  /** 人类叙述区内容 */
  body: string;
  /** 机器区数据 */
  machine: MachineBlock;
}

/**
 * Frontmatter 数据
 */
export interface Frontmatter {
  version?: string;
  document_type?: string;
  created?: string;
  updated?: string;
  author?: string;
  title?: string;
  tags?: string[];
  visibility?: string;
  atlas?: AtlasFrontmatter;
  [key: string]: unknown;
}

/**
 * Atlas 功能声明 (Phase 3.3)
 */
export type AtlasFunctionType =
  | 'principal'
  | 'entity_list'
  | 'entity_detail'
  | 'config'
  | 'registry'
  | 'client'
  | 'dashboard';

export type AtlasCapability =
  | 'auth.login'
  | 'auth.session'
  | 'auth.oauth'
  | 'nav.sidebar'
  | 'nav.header'
  | 'nav.breadcrumb'
  | 'api.public'
  | 'api.protected'
  | 'api.admin'
  | 'render.card'
  | 'render.table'
  | 'render.detail'
  | 'render.form';

export interface AtlasNavigationConfig {
  visible: boolean;
  icon?: string;
  label?: string;
  order?: number;
  parent?: string;
}

export interface AtlasFrontmatter {
  function: AtlasFunctionType;
  entity_type?: string;
  capabilities?: AtlasCapability[];
  navigation?: AtlasNavigationConfig;
  required_fields?: string[];
}

/**
 * ADL 文档
 */
export interface ADLDocument {
  /** 文档路径 */
  path: string;
  /** Frontmatter 元数据 */
  frontmatter: Frontmatter;
  /** Block 列表 */
  blocks: Block[];
  /** 原始内容 */
  raw?: string;
}

/**
 * Proposal 数据
 */
export interface Proposal {
  id: string;
  target_file: string;
  target_anchor: string;
  operation: 'update' | 'create' | 'delete';
  changes: Record<string, unknown>;
  reason?: string;
  status: 'pending' | 'executed' | 'rejected';
  created_by: string;
  created_at: string;
  executed_at?: string;
  executed_by?: string;
}

/**
 * 类型判断辅助函数
 */
export function isTokenRef(value: unknown): value is TokenRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    'token' in value &&
    typeof (value as TokenRef).token === 'string'
  );
}

export function isAnchorRef(value: unknown): value is AnchorRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ref' in value &&
    typeof (value as AnchorRef).ref === 'string'
  );
}

