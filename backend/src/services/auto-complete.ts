/**
 * AutoCompleteService - 自动补齐服务
 * 
 * Phase 3.5: 固定键系统
 * 
 * 职责：
 * 1. 自动补齐文档的固定键（元数据、结构键、功能键）
 * 2. 检测缺失字段并生成补齐建议
 * 3. 生成补齐变更记录
 */

import type { ADLDocument, Block, AtlasFrontmatter } from '../adl/types.js';
import {
  STRUCTURAL_KEYS,
  METADATA_KEYS,
  FUNCTION_KEYS,
  inferFunctionFromType,
  inferDocTypeFromFunction,
  detectMissingAutoFields,
} from './fixed-keys.js';
import { generateIdFromBlock, extractTitle } from './id-generator.js';

// ============================================================
// 类型定义
// ============================================================

/**
 * 自动补齐上下文
 */
export interface AutoCompleteContext {
  /** 当前用户（用于填充 author） */
  currentUser?: {
    id: string;
    display_name?: string;
  };
  /** 是否为更新操作（影响 updated 字段） */
  isUpdate?: boolean;
  /** 已存在的 ID 集合（用于确保唯一性） */
  existingIds?: Set<string>;
  /** 是否为首次索引 */
  isFirstIndex?: boolean;
}

/**
 * 自动补齐变更
 */
export interface AutoCompleteChange {
  /** 变更类型 */
  type: 'frontmatter' | 'block';
  /** 键名 */
  key: string;
  /** 旧值 */
  oldValue: unknown;
  /** 新值 */
  newValue: unknown;
  /** 变更原因 */
  reason: string;
  /** Block anchor（如果是 block 变更） */
  blockAnchor?: string;
}

/**
 * 自动补齐结果
 */
export interface AutoCompleteResult {
  /** 补齐后的文档 */
  document: ADLDocument;
  /** 变更列表 */
  changes: AutoCompleteChange[];
  /** 是否需要写回文件 */
  needsWrite: boolean;
}

/**
 * 缺失字段信息
 */
export interface MissingFieldInfo {
  /** 键名 */
  key: string;
  /** 字段标签（用于显示） */
  label: string;
  /** 建议值 */
  suggestedValue: unknown;
  /** 补齐原因 */
  reason: string;
  /** 所属类别 */
  category: 'structural' | 'metadata' | 'function';
  /** Block anchor（如果是结构键） */
  blockAnchor?: string;
}

// ============================================================
// 核心函数
// ============================================================

/**
 * 自动补齐文档
 * 
 * @param document - 原始文档
 * @param context - 补齐上下文
 * @returns 补齐结果
 */
export async function autoCompleteDocument(
  document: ADLDocument,
  context: AutoCompleteContext = {}
): Promise<AutoCompleteResult> {
  const changes: AutoCompleteChange[] = [];
  
  // 深拷贝文档，避免修改原始对象
  const updatedDoc: ADLDocument = {
    ...document,
    frontmatter: { ...document.frontmatter },
    blocks: document.blocks.map(block => ({
      ...block,
      machine: { ...block.machine },
    })),
  };
  
  // 1. 补齐 Frontmatter 元数据键
  const frontmatterChanges = autoCompleteFrontmatter(updatedDoc, context);
  changes.push(...frontmatterChanges);
  
  // 2. 补齐每个 Block 的结构键
  const blockChanges = autoCompleteBlocks(updatedDoc, context);
  changes.push(...blockChanges);
  
  // 3. 推断并补齐 atlas.function
  const functionChanges = autoCompleteFunction(updatedDoc);
  changes.push(...functionChanges);
  
  // 4. 基于 function 推断 document_type
  const docTypeChanges = autoCompleteDocType(updatedDoc);
  changes.push(...docTypeChanges);
  
  return {
    document: updatedDoc,
    changes,
    needsWrite: changes.length > 0,
  };
}

/**
 * 补齐 Frontmatter 元数据
 */
function autoCompleteFrontmatter(
  doc: ADLDocument,
  context: AutoCompleteContext
): AutoCompleteChange[] {
  const changes: AutoCompleteChange[] = [];
  const frontmatter = doc.frontmatter;
  const now = new Date().toISOString();
  
  // version - 默认 "1.0"
  if (frontmatter.version === undefined) {
    frontmatter.version = METADATA_KEYS.version.default;
    changes.push({
      type: 'frontmatter',
      key: 'version',
      oldValue: undefined,
      newValue: frontmatter.version,
      reason: '默认版本',
    });
  }
  
  // created - 首次索引时自动生成
  if (frontmatter.created === undefined) {
    frontmatter.created = now;
    changes.push({
      type: 'frontmatter',
      key: 'created',
      oldValue: undefined,
      newValue: now,
      reason: '首次索引时间',
    });
  }
  
  // updated - 每次更新时自动更新
  if (context.isUpdate || frontmatter.updated === undefined) {
    const oldUpdated = frontmatter.updated;
    frontmatter.updated = now;
    
    if (oldUpdated !== now) {
      changes.push({
        type: 'frontmatter',
        key: 'updated',
        oldValue: oldUpdated,
        newValue: now,
        reason: context.isUpdate ? '更新时间' : '首次索引时间',
      });
    }
  }
  
  // author - 首次索引时自动填充当前用户
  if (frontmatter.author === undefined && context.currentUser) {
    frontmatter.author = context.currentUser.id;
    changes.push({
      type: 'frontmatter',
      key: 'author',
      oldValue: undefined,
      newValue: context.currentUser.id,
      reason: '当前用户',
    });
  }
  
  return changes;
}

/**
 * 补齐 Block 的结构键
 */
function autoCompleteBlocks(
  doc: ADLDocument,
  context: AutoCompleteContext
): AutoCompleteChange[] {
  const changes: AutoCompleteChange[] = [];
  
  // 收集已存在的 ID
  const existingIds = new Set(context.existingIds || []);
  for (const block of doc.blocks) {
    if (block.machine?.id) {
      existingIds.add(block.machine.id);
    }
  }
  
  for (const block of doc.blocks) {
    // id - 自动生成
    if (block.machine?.id === undefined && block.machine?.type) {
      const idResult = generateIdFromBlock(block, { existingIds });
      block.machine.id = idResult.id;
      existingIds.add(idResult.id);
      
      changes.push({
        type: 'block',
        key: 'id',
        oldValue: undefined,
        newValue: idResult.id,
        reason: `基于标题 "${idResult.originalTitle}" 自动生成`,
        blockAnchor: block.anchor,
      });
    }
    
    // status - 默认 "active"
    if (block.machine?.status === undefined) {
      block.machine.status = STRUCTURAL_KEYS.status.default as 'active';
      
      changes.push({
        type: 'block',
        key: 'status',
        oldValue: undefined,
        newValue: 'active',
        reason: '默认状态',
        blockAnchor: block.anchor,
      });
    }
  }
  
  return changes;
}

/**
 * 推断并补齐 atlas.function
 */
function autoCompleteFunction(doc: ADLDocument): AutoCompleteChange[] {
  const changes: AutoCompleteChange[] = [];
  
  // 如果已有 atlas.function，跳过
  const atlas = doc.frontmatter?.atlas as AtlasFrontmatter | undefined;
  if (atlas?.function) {
    return changes;
  }
  
  // 从第一个 Block 的 type 推断
  const firstBlock = doc.blocks[0];
  if (firstBlock?.machine?.type) {
    const inferredFunction = inferFunctionFromType(firstBlock.machine.type);
    
    if (inferredFunction) {
      // 确保 atlas 对象存在
      if (!doc.frontmatter.atlas) {
        doc.frontmatter.atlas = {} as AtlasFrontmatter;
      }
      
      (doc.frontmatter.atlas as AtlasFrontmatter).function = inferredFunction as AtlasFrontmatter['function'];
      
      // 同步更新 doc.atlas
      doc.atlas = doc.frontmatter.atlas as AtlasFrontmatter;
      
      changes.push({
        type: 'frontmatter',
        key: 'atlas.function',
        oldValue: undefined,
        newValue: inferredFunction,
        reason: `基于 Block 类型 "${firstBlock.machine.type}" 推断`,
      });
    }
  }
  
  return changes;
}

/**
 * 基于 function 推断 document_type
 */
function autoCompleteDocType(doc: ADLDocument): AutoCompleteChange[] {
  const changes: AutoCompleteChange[] = [];
  
  // 如果已有 document_type，跳过
  if (doc.frontmatter?.document_type) {
    return changes;
  }
  
  // 从 atlas.function 推断
  const atlasFunction = doc.atlas?.function || (doc.frontmatter?.atlas as AtlasFrontmatter)?.function;
  
  if (atlasFunction) {
    const inferredDocType = inferDocTypeFromFunction(atlasFunction);
    doc.frontmatter.document_type = inferredDocType;
    
    changes.push({
      type: 'frontmatter',
      key: 'document_type',
      oldValue: undefined,
      newValue: inferredDocType,
      reason: `基于功能类型 "${atlasFunction}" 推断`,
    });
  }
  
  return changes;
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 检测文档中缺失的字段
 * 
 * @param doc - 文档
 * @param context - 上下文
 * @returns 缺失字段列表
 */
export function detectMissingFields(
  doc: ADLDocument,
  context: AutoCompleteContext = {}
): MissingFieldInfo[] {
  const missing: MissingFieldInfo[] = [];
  const now = new Date().toISOString();
  
  // 检查 Frontmatter 元数据键
  if (doc.frontmatter?.version === undefined) {
    missing.push({
      key: 'version',
      label: '版本',
      suggestedValue: METADATA_KEYS.version.default,
      reason: '默认版本',
      category: 'metadata',
    });
  }
  
  if (doc.frontmatter?.created === undefined) {
    missing.push({
      key: 'created',
      label: '创建时间',
      suggestedValue: now,
      reason: '当前时间',
      category: 'metadata',
    });
  }
  
  // 注意：updated 字段不作为缺失字段提示，因为会在保存时自动更新
  // 用户无需手动补齐
  
  if (doc.frontmatter?.author === undefined && context.currentUser) {
    missing.push({
      key: 'author',
      label: '作者',
      suggestedValue: context.currentUser.id,
      reason: '当前用户',
      category: 'metadata',
    });
  }
  
  // 检查 atlas.function
  const atlasForCheck = doc.frontmatter?.atlas as AtlasFrontmatter | undefined;
  if (!atlasForCheck?.function) {
    const firstBlock = doc.blocks[0];
    if (firstBlock?.machine?.type) {
      const inferredFunction = inferFunctionFromType(firstBlock.machine.type);
      if (inferredFunction) {
        missing.push({
          key: 'atlas.function',
          label: '功能类型',
          suggestedValue: inferredFunction,
          reason: `基于 Block 类型 "${firstBlock.machine.type}" 推断`,
          category: 'function',
        });
      }
    }
  }
  
  // 收集已存在的 ID
  const existingIds = new Set(context.existingIds || []);
  for (const block of doc.blocks) {
    if (block.machine?.id) {
      existingIds.add(block.machine.id);
    }
  }
  
  // 检查每个 Block 的结构键
  for (const block of doc.blocks) {
    if (block.machine?.id === undefined && block.machine?.type) {
      const idResult = generateIdFromBlock(block, { existingIds });
      missing.push({
        key: 'id',
        label: '标识符',
        suggestedValue: idResult.id,
        reason: `基于标题 "${idResult.originalTitle}" 自动生成`,
        category: 'structural',
        blockAnchor: block.anchor,
      });
      existingIds.add(idResult.id);
    }
    
    if (block.machine?.status === undefined) {
      missing.push({
        key: 'status',
        label: '状态',
        suggestedValue: 'active',
        reason: '默认状态',
        category: 'structural',
        blockAnchor: block.anchor,
      });
    }
  }
  
  return missing;
}

/**
 * 生成补齐预览（不实际修改文档）
 * 
 * @param doc - 文档
 * @param context - 上下文
 * @returns 预览信息
 */
export function previewAutoComplete(
  doc: ADLDocument,
  context: AutoCompleteContext = {}
): {
  missingFields: MissingFieldInfo[];
  totalChanges: number;
  categories: {
    metadata: number;
    structural: number;
    function: number;
  };
} {
  const missingFields = detectMissingFields(doc, context);
  
  const categories = {
    metadata: 0,
    structural: 0,
    function: 0,
  };
  
  for (const field of missingFields) {
    categories[field.category]++;
  }
  
  return {
    missingFields,
    totalChanges: missingFields.length,
    categories,
  };
}

/**
 * 只更新 updated 字段（用于 Proposal 执行时）
 * 
 * @param doc - 文档
 * @returns 是否有变更
 */
export function touchUpdatedField(doc: ADLDocument): boolean {
  const now = new Date().toISOString();
  const oldValue = doc.frontmatter.updated;
  doc.frontmatter.updated = now;
  return oldValue !== now;
}

/**
 * 批量自动补齐多个文档
 * 
 * @param documents - 文档数组
 * @param context - 上下文
 * @returns 补齐结果数组
 */
export async function autoCompleteDocuments(
  documents: ADLDocument[],
  context: AutoCompleteContext = {}
): Promise<AutoCompleteResult[]> {
  const results: AutoCompleteResult[] = [];
  
  // 收集所有已存在的 ID
  const allExistingIds = new Set(context.existingIds || []);
  for (const doc of documents) {
    for (const block of doc.blocks) {
      if (block.machine?.id) {
        allExistingIds.add(block.machine.id);
      }
    }
  }
  
  // 逐个补齐
  for (const doc of documents) {
    const result = await autoCompleteDocument(doc, {
      ...context,
      existingIds: allExistingIds,
    });
    
    results.push(result);
    
    // 将新生成的 ID 添加到集合
    for (const change of result.changes) {
      if (change.key === 'id' && change.newValue) {
        allExistingIds.add(change.newValue as string);
      }
    }
  }
  
  return results;
}

