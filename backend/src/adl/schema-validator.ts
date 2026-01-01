/**
 * ADL Schema Validator - ADL v0.3 语法校验器
 * 
 * Phase 3.0: 语言收敛
 * 
 * 职责：
 * 1. 验证 Block 结构符合规范
 * 2. 拒绝未定义的字段
 * 3. 提供清晰的错误信息
 * 
 * 基于 ADL-Spec-v0.3.md 规范实现
 */

import type { Block, MachineBlock, ADLDocument } from './types.js';
import { isTokenRef, isAnchorRef } from './types.js';

// ============================================================
// 错误类型定义
// ============================================================

export interface SchemaError {
  /** 错误码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 相关 Block 的 anchor（如有） */
  anchor?: string;
  /** 相关字段路径（如有） */
  field?: string;
  /** 修复建议 */
  suggestion?: string;
}

export interface SchemaValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误列表 */
  errors: SchemaError[];
  /** 警告列表 */
  warnings: SchemaError[];
}

// ============================================================
// 类型注册表
// ============================================================

/**
 * 内置类型定义
 */
const BUILTIN_TYPES: Record<string, TypeSchema> = {
  service: {
    name: 'service',
    fields: {
      category: { type: 'ref', required: false },
      description: { type: 'string', required: false },
      price: { type: 'object', required: false },
    },
  },
  category: {
    name: 'category',
    fields: {
      $display: { type: 'object', required: false },
    },
  },
  contact: {
    name: 'contact',
    fields: {
      name: { type: 'string', required: false },
      email: { type: 'string', required: false },
      phone: { type: 'string', required: false },
      role: { type: 'string', required: false },
    },
  },
  project: {
    name: 'project',
    fields: {
      client: { type: 'ref', required: false },
      services: { type: 'array', required: false },
      timeline: { type: 'object', required: false },
    },
  },
  event: {
    name: 'event',
    fields: {
      timestamp: { type: 'string', required: false },
      actor: { type: 'string', required: false },
    },
  },
  token_group: {
    name: 'token_group',
    fields: {
      tokens: { type: 'object', required: true },
    },
  },
  note: {
    name: 'note',
    fields: {},
  },
  type_definition: {
    name: 'type_definition',
    fields: {
      extends: { type: 'string', required: false },
      fields: { type: 'array', required: true },
    },
  },
};

interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'ref' | 'token';
  required: boolean;
  enum?: string[];
}

interface TypeSchema {
  name: string;
  fields: Record<string, FieldSchema>;
}

// ============================================================
// 必填字段
// ============================================================

const REQUIRED_FIELDS = ['type', 'id', 'status', 'title'];

const VALID_STATUS_VALUES = ['active', 'draft', 'archived'];

// ============================================================
// 系统保留前缀
// ============================================================

const SYSTEM_PREFIXES = ['$display', '$constraints', '$meta', '$computed'];

// ============================================================
// 保留字
// ============================================================

const RESERVED_WORDS = [
  'block', 'document', 'anchor', 'heading', 'body', 'frontmatter',
  'type', 'id', 'status', 'title', 'null', 'true', 'false',
  '$display', '$constraints', '$meta', '$computed',
];

// ============================================================
// 校验函数
// ============================================================

/**
 * 校验单个 Block
 */
export function validateBlock(block: Block): SchemaValidationResult {
  const errors: SchemaError[] = [];
  const warnings: SchemaError[] = [];
  
  const { machine, anchor } = block;
  
  // 1. 检查必填字段
  for (const field of REQUIRED_FIELDS) {
    if (!(field in machine) || machine[field] === undefined || machine[field] === '') {
      errors.push({
        code: 'E001',
        message: `Missing required field: ${field}`,
        anchor,
        field,
        suggestion: `Add "${field}" field to the machine block`,
      });
    }
  }
  
  // 2. 检查 type 是否有效
  if (machine.type && !BUILTIN_TYPES[machine.type]) {
    warnings.push({
      code: 'W001',
      message: `Unknown type: "${machine.type}"`,
      anchor,
      field: 'type',
      suggestion: `Valid types: ${Object.keys(BUILTIN_TYPES).join(', ')}`,
    });
  }
  
  // 3. 检查 status 值
  if (machine.status && !VALID_STATUS_VALUES.includes(machine.status as string)) {
    const similar = findSimilar(machine.status as string, VALID_STATUS_VALUES);
    errors.push({
      code: 'E003',
      message: `Invalid status value: "${machine.status}"`,
      anchor,
      field: 'status',
      suggestion: similar 
        ? `Did you mean "${similar}"?` 
        : `Valid values: ${VALID_STATUS_VALUES.join(', ')}`,
    });
  }
  
  // 4. 检查字段类型一致性
  validateFieldTypes(machine, anchor, errors, warnings);
  
  // 5. 检查嵌套深度
  validateNestingDepth(machine, anchor, errors);
  
  // 6. 检查显现层字段
  if (machine.$display) {
    validateDisplayFields(machine.$display as Record<string, unknown>, anchor, errors, warnings);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 校验整个文档
 */
export function validateDocument(doc: ADLDocument): SchemaValidationResult {
  const errors: SchemaError[] = [];
  const warnings: SchemaError[] = [];
  
  // 检查 frontmatter
  if (!doc.frontmatter.version) {
    warnings.push({
      code: 'W002',
      message: 'Missing frontmatter version',
      suggestion: 'Add "version: 1.0" to frontmatter',
    });
  }
  
  if (!doc.frontmatter.document_type) {
    warnings.push({
      code: 'W003',
      message: 'Missing frontmatter document_type',
      suggestion: 'Add "document_type: facts" to frontmatter',
    });
  }
  
  // 检查每个 Block
  const anchors = new Set<string>();
  const idsByType = new Map<string, Set<string>>();
  
  for (const block of doc.blocks) {
    // 校验 Block 结构
    const result = validateBlock(block);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    
    // 检查 anchor 唯一性
    if (anchors.has(block.anchor)) {
      errors.push({
        code: 'E004',
        message: `Duplicate anchor: #${block.anchor}`,
        anchor: block.anchor,
        suggestion: 'Each block must have a unique anchor',
      });
    }
    anchors.add(block.anchor);
    
    // 检查同类型 ID 唯一性
    const type = block.machine.type;
    const id = block.machine.id as string;
    
    if (type && id) {
      if (!idsByType.has(type)) {
        idsByType.set(type, new Set());
      }
      
      const ids = idsByType.get(type)!;
      if (ids.has(id)) {
        errors.push({
          code: 'E005',
          message: `Duplicate id "${id}" for type "${type}"`,
          anchor: block.anchor,
          field: 'id',
          suggestion: `Each ${type} must have a unique id`,
        });
      }
      ids.add(id);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 校验字段类型
 */
function validateFieldTypes(
  machine: MachineBlock,
  anchor: string,
  errors: SchemaError[],
  warnings: SchemaError[]
): void {
  // 检查 id 是否为字符串
  if (machine.id !== undefined && typeof machine.id !== 'string') {
    errors.push({
      code: 'E203',
      message: `Field "id" must be string, got ${typeof machine.id}`,
      anchor,
      field: 'id',
    });
  }
  
  // 检查 title 是否为字符串
  if (machine.title !== undefined && typeof machine.title !== 'string') {
    errors.push({
      code: 'E203',
      message: `Field "title" must be string, got ${typeof machine.title}`,
      anchor,
      field: 'title',
    });
  }
  
  // 检查 category 字段（应该是引用）
  if (machine.category !== undefined) {
    if (typeof machine.category === 'string' && !machine.category.startsWith('#')) {
      warnings.push({
        code: 'W004',
        message: `Field "category" should use reference syntax`,
        anchor,
        field: 'category',
        suggestion: `Change to: category: { ref: "#${machine.category}" }`,
      });
    }
  }
}

/**
 * 校验嵌套深度
 */
function validateNestingDepth(
  obj: Record<string, unknown>,
  anchor: string,
  errors: SchemaError[],
  currentDepth: number = 0,
  path: string = ''
): void {
  const MAX_DEPTH = 3; // 最多 3 层嵌套
  
  if (currentDepth > MAX_DEPTH) {
    errors.push({
      code: 'E006',
      message: `Nesting too deep at "${path}" (max ${MAX_DEPTH} levels)`,
      anchor,
      field: path,
      suggestion: 'Flatten the structure or use references',
    });
    return;
  }
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // 跳过系统命名空间
      if (key.startsWith('$')) continue;
      // 跳过 Token/Anchor 引用
      if (isTokenRef(value) || isAnchorRef(value)) continue;
      
      validateNestingDepth(
        value as Record<string, unknown>,
        anchor,
        errors,
        currentDepth + 1,
        path ? `${path}.${key}` : key
      );
    }
  }
}

/**
 * 校验显现层字段
 */
function validateDisplayFields(
  display: Record<string, unknown>,
  anchor: string,
  errors: SchemaError[],
  warnings: SchemaError[]
): void {
  for (const [key, value] of Object.entries(display)) {
    // 检查颜色字段是否使用 Token 引用
    if (key === 'color' || key === 'bgColor' || key.endsWith('Color')) {
      if (typeof value === 'string') {
        errors.push({
          code: 'E101',
          message: `Display field "${key}" must use token reference, got literal value`,
          anchor,
          field: `$display.${key}`,
          suggestion: `Change to: ${key}: { token: "color.xxx" }`,
        });
      } else if (!isTokenRef(value)) {
        errors.push({
          code: 'E101',
          message: `Display field "${key}" must use token reference`,
          anchor,
          field: `$display.${key}`,
          suggestion: `Use format: { token: "color.xxx" }`,
        });
      }
    }
    
    // 检查图标字段是否使用 Token 引用
    if (key === 'icon') {
      if (typeof value === 'string') {
        errors.push({
          code: 'E101',
          message: `Display field "icon" must use token reference, got literal value`,
          anchor,
          field: '$display.icon',
          suggestion: `Change to: icon: { token: "icon.xxx" }`,
        });
      } else if (!isTokenRef(value)) {
        errors.push({
          code: 'E101',
          message: `Display field "icon" must use token reference`,
          anchor,
          field: '$display.icon',
          suggestion: `Use format: { token: "icon.xxx" }`,
        });
      }
    }
  }
}

/**
 * 查找相似字符串（用于错误建议）
 */
function findSimilar(input: string, candidates: string[]): string | null {
  const inputLower = input.toLowerCase();
  
  for (const candidate of candidates) {
    if (candidate.toLowerCase().startsWith(inputLower.slice(0, 3))) {
      return candidate;
    }
  }
  
  // Levenshtein 距离检查
  for (const candidate of candidates) {
    if (levenshteinDistance(inputLower, candidate.toLowerCase()) <= 2) {
      return candidate;
    }
  }
  
  return null;
}

/**
 * 计算 Levenshtein 距离
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  return matrix[a.length][b.length];
}

// ============================================================
// 导出
// ============================================================

export {
  BUILTIN_TYPES,
  REQUIRED_FIELDS,
  VALID_STATUS_VALUES,
  SYSTEM_PREFIXES,
  RESERVED_WORDS,
};

