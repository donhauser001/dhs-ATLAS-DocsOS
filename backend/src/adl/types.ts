/**
 * ADL Types - Atlas Document Language 类型定义
 * 
 * 基于 ADL Spec v1.0
 */

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

