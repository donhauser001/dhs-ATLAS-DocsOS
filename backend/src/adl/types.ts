/**
 * ADL Types - Atlas Document Language 类型定义
 * 
 * 基于 ADL Spec v1.0
 * Phase 2.5: 语义引用类型
 */

// ============================================================
// 语义引用类型（Phase 2.5）
// ============================================================

/**
 * TokenRef - Token 语义引用
 * 
 * 用于引用 Design Tokens 中定义的语义值
 * 例如：{ token: "color.brand.primary" }
 */
export interface TokenRef {
  token: string;
}

/**
 * AnchorRef - Anchor 引用
 * 
 * 用于引用其他 Block
 * 例如：{ ref: "#cat-brand-design" }
 */
export interface AnchorRef {
  ref: string;
}

/**
 * SemanticValue - 语义化值
 * 
 * 可以是字面量，也可以是语义引用
 */
export type SemanticValue = 
  | string 
  | number 
  | boolean 
  | TokenRef 
  | AnchorRef;

/**
 * DisplayHints - 显现提示
 * 
 * 给渲染器的指令，告诉 UI 如何显现这个对象
 * 在 Machine Block 中使用 $display 命名空间
 */
export interface DisplayHints {
  /** 主色引用 */
  color?: TokenRef;
  /** 图标引用 */
  icon?: TokenRef;
  /** 背景色引用 */
  bgColor?: TokenRef;
  /** 其他显现提示 */
  [key: string]: TokenRef | undefined;
}

/**
 * 判断值是否为 TokenRef
 */
export function isTokenRef(value: unknown): value is TokenRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    'token' in value &&
    typeof (value as TokenRef).token === 'string'
  );
}

/**
 * 判断值是否为 AnchorRef
 */
export function isAnchorRef(value: unknown): value is AnchorRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ref' in value &&
    typeof (value as AnchorRef).ref === 'string'
  );
}

/**
 * 判断值是否为语义引用（TokenRef 或 AnchorRef）
 */
export function isSemanticRef(value: unknown): value is TokenRef | AnchorRef {
  return isTokenRef(value) || isAnchorRef(value);
}

// ============================================================
// Block 相关类型
// ============================================================

/**
 * ADL Block - 文档的基本单位
 */
export interface Block {
  /** 稳定定位标识，全局唯一 */
  anchor: string;
  /** 标题文本 */
  heading: string;
  /** 标题级别 (1-6) */
  level: number;
  /** Machine Zone 数据 */
  machine: MachineBlock;
  /** Human Zone 正文内容 */
  body: string;
  /** Block 起始行号 */
  startLine: number;
  /** Block 结束行号 */
  endLine: number;
}

/**
 * Machine Block - 机器可解析的结构化数据
 * 
 * Phase 2.5: 支持 $display 命名空间
 */
export interface MachineBlock {
  /** 对象类型 */
  type: string;
  /** 业务标识 */
  id: string;
  /** 状态 */
  status: 'active' | 'archived' | 'draft';
  /** 显示标题 */
  title: string;
  
  /**
   * 显现提示（Phase 2.5）
   * 
   * 给渲染器的指令，告诉 UI 如何显现这个对象
   * 普通字段是业务数据，$display 是显现指令
   */
  $display?: DisplayHints;
  
  /** 其他字段 */
  [key: string]: unknown;
}

// ============================================================
// Document 相关类型
// ============================================================

/**
 * ADL Document - 解析后的文档结构
 */
export interface ADLDocument {
  /** 文件路径 */
  path: string;
  /** Frontmatter 元数据 */
  frontmatter: Record<string, unknown>;
  /** 所有 Block */
  blocks: Block[];
  /** 原始文本 */
  raw: string;
}

// ============================================================
// Proposal 相关类型
// ============================================================

/**
 * Proposal Status - 提案状态
 */
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'executed';

/**
 * Proposal - 变更提案
 * 
 * Phase 1.5: 升级为「可审计的认知行为」
 * 
 * Proposal 不是「绕过系统的写 API」，
 * 而是「有来源、有理由、可追溯」的认知行为记录。
 */
export interface Proposal {
  /** 提案 ID */
  id: string;
  /** 提案者 */
  proposed_by: string;
  /** 提案时间 */
  proposed_at: string;
  /** 目标文件 */
  target_file: string;
  
  // === 认知语义（Phase 1.5 新增） ===
  
  /** 
   * 变更原因 - 必填
   * 
   * 回答：为什么要做这个变更？
   * 示例："客户确认价格调整为 68000"
   */
  reason: string;
  
  /**
   * 来源上下文 - 可选
   * 
   * 回答：基于什么信息做出这个判断？
   * 示例："2025-01-01 电话沟通记录"
   */
  source_context?: string;
  
  // === 操作定义 ===
  
  /** 操作列表 */
  ops: Operation[];
  /** 提案状态 */
  status: ProposalStatus;
}

/**
 * Operation - 单个操作
 */
export type Operation = UpdateYamlOp | InsertBlockOp | AppendEventOp | UpdateBodyOp;

/**
 * update_yaml 操作
 */
export interface UpdateYamlOp {
  op: 'update_yaml';
  anchor: string;
  path: string;
  value: unknown;
  old_value?: unknown;
}

/**
 * insert_block 操作
 */
export interface InsertBlockOp {
  op: 'insert_block';
  after: string;
  block: {
    heading: string;
    machine: MachineBlock;
    body: string;
  };
}

/**
 * append_event 操作
 */
export interface AppendEventOp {
  op: 'append_event';
  after: string;
  event: MachineBlock;
}

/**
 * update_body 操作
 */
export interface UpdateBodyOp {
  op: 'update_body';
  anchor: string;
  body: string;
}

// ============================================================
// Validation 相关类型
// ============================================================

/**
 * ValidationResult - 校验结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * ValidationError - 校验错误
 */
export interface ValidationError {
  op_index: number;
  rule: string;
  message: string;
}

