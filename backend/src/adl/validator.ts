/**
 * ADL Validator - 校验器
 * 
 * 职责：确保 Proposal 不破坏文档结构
 * 
 * Phase 0 最小校验规则：
 * 1. 目标 Anchor 必须存在
 * 2. 目标 Path 必须有效
 * 3. 新值类型必须与原值兼容
 * 4. 不允许删除必填字段（type, id, status）
 * 
 * Phase 1.5 新增规则：
 * 5. Proposal 必须包含 reason（认知语义）
 */

import { findBlockByAnchor, getBlockValue } from './parser.js';
// Phase 1.5: 使用 Registry 作为文档发现的唯一入口
import { getDocument } from '../services/workspace-registry.js';
import type { Proposal, ValidationResult, ValidationError, Operation } from './types.js';

// 必填字段列表
const REQUIRED_FIELDS = ['type', 'id', 'status'];

/**
 * 校验 Proposal
 * 
 * Phase 1.5: 使用 Registry 获取文档，并检查 reason 字段
 */
export function validateProposal(proposal: Proposal, _repositoryRoot: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Phase 1.5: 检查 reason 字段（认知语义必须存在）
  if (!proposal.reason || proposal.reason.trim() === '') {
    errors.push({
      op_index: -1,
      rule: 'reason_required',
      message: 'Proposal must include a reason explaining why this change is being made',
    });
  }
  
  // Phase 1.5: 使用 Registry 获取文档
  const content = getDocument(proposal.target_file);
  if (!content) {
    errors.push({
      op_index: -1,
      rule: 'file_exists',
      message: `Target file not found: ${proposal.target_file}`,
    });
    return { valid: false, errors };
  }
  
  const doc = content.document;
  
  // 校验每个操作
  proposal.ops.forEach((op, index) => {
    const opErrors = validateOperation(op, doc, index);
    errors.push(...opErrors);
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 校验单个操作
 */
function validateOperation(op: Operation, doc: ReturnType<typeof parseADL>, opIndex: number): ValidationError[] {
  const errors: ValidationError[] = [];
  
  switch (op.op) {
    case 'update_yaml':
      errors.push(...validateUpdateYaml(op, doc, opIndex));
      break;
    case 'insert_block':
      errors.push(...validateInsertBlock(op, doc, opIndex));
      break;
    case 'append_event':
      errors.push(...validateAppendEvent(op, doc, opIndex));
      break;
    case 'update_body':
      errors.push(...validateUpdateBody(op, doc, opIndex));
      break;
    default:
      errors.push({
        op_index: opIndex,
        rule: 'unknown_op',
        message: `Unknown operation type: ${(op as { op: string }).op}`,
      });
  }
  
  return errors;
}

/**
 * 校验 update_yaml 操作
 */
function validateUpdateYaml(
  op: Extract<Operation, { op: 'update_yaml' }>,
  doc: ReturnType<typeof parseADL>,
  opIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // 规则 1：目标 Anchor 必须存在
  const block = findBlockByAnchor(doc, op.anchor);
  if (!block) {
    errors.push({
      op_index: opIndex,
      rule: 'anchor_exists',
      message: `Target anchor not found: ${op.anchor}`,
    });
    return errors;
  }
  
  // 规则 2：目标 Path 必须有效（存在于当前 block 中）
  const currentValue = getBlockValue(block, op.path);
  
  // 规则 3：新值类型必须与原值兼容
  if (currentValue !== undefined) {
    const currentType = typeof currentValue;
    const newType = typeof op.value;
    
    // 允许 null 值
    if (op.value !== null && currentType !== newType) {
      // 特殊处理：数字可以用字符串表示
      if (!(currentType === 'number' && newType === 'string' && !isNaN(Number(op.value)))) {
        errors.push({
          op_index: opIndex,
          rule: 'type_compatible',
          message: `Type mismatch for ${op.path}: expected ${currentType}, got ${newType}`,
        });
      }
    }
  }
  
  // 规则 4：不允许删除必填字段
  if (REQUIRED_FIELDS.includes(op.path) && (op.value === null || op.value === undefined || op.value === '')) {
    errors.push({
      op_index: opIndex,
      rule: 'required_field',
      message: `Cannot delete required field: ${op.path}`,
    });
  }
  
  return errors;
}

/**
 * 校验 insert_block 操作
 */
function validateInsertBlock(
  op: Extract<Operation, { op: 'insert_block' }>,
  doc: ReturnType<typeof parseADL>,
  opIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // 检查 after anchor 是否存在
  const afterBlock = findBlockByAnchor(doc, op.after);
  if (!afterBlock) {
    errors.push({
      op_index: opIndex,
      rule: 'anchor_exists',
      message: `After anchor not found: ${op.after}`,
    });
  }
  
  // 检查新 block 的必填字段
  const { machine } = op.block;
  for (const field of REQUIRED_FIELDS) {
    if (!machine[field as keyof typeof machine]) {
      errors.push({
        op_index: opIndex,
        rule: 'required_field',
        message: `New block missing required field: ${field}`,
      });
    }
  }
  
  return errors;
}

/**
 * 校验 append_event 操作
 */
function validateAppendEvent(
  op: Extract<Operation, { op: 'append_event' }>,
  doc: ReturnType<typeof parseADL>,
  opIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // 检查 after anchor 是否存在
  const afterBlock = findBlockByAnchor(doc, op.after);
  if (!afterBlock) {
    errors.push({
      op_index: opIndex,
      rule: 'anchor_exists',
      message: `After anchor not found: ${op.after}`,
    });
  }
  
  // 检查 event 的必填字段
  if (op.event.type !== 'event') {
    errors.push({
      op_index: opIndex,
      rule: 'event_type',
      message: 'Event block must have type: event',
    });
  }
  
  return errors;
}

/**
 * 校验 update_body 操作
 */
function validateUpdateBody(
  op: Extract<Operation, { op: 'update_body' }>,
  doc: ReturnType<typeof parseADL>,
  opIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // 检查目标 anchor 是否存在
  const block = findBlockByAnchor(doc, op.anchor);
  if (!block) {
    errors.push({
      op_index: opIndex,
      rule: 'anchor_exists',
      message: `Target anchor not found: ${op.anchor}`,
    });
  }
  
  return errors;
}

