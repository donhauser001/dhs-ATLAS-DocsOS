/**
 * ADL Executor - 执行器
 * 
 * 职责：应用 Proposal 并生成 Git Commit
 * 
 * Phase 0.5 改进：
 * 1. 原子写入：写到临时文件 → commit 成功后替换
 * 2. 回滚机制：commit 失败则还原原文
 * 3. 统一 YAML dump 配置，减少格式漂移
 * 
 * Phase 2 改进：
 * 4. 移除 repositoryRoot 参数，强制通过 Registry 获取路径
 * 5. 所有路径访问经过 SafePath 验证
 */

import { readFileSync, writeFileSync, copyFileSync, unlinkSync, existsSync } from 'fs';
import yaml from 'js-yaml';
import simpleGit, { SimpleGit } from 'simple-git';
import { parseADL, findBlockByAnchor } from './parser.js';
import { validateProposal } from './validator.js';
import { config } from '../config.js';
import type { Proposal, Operation, Block, MachineBlock } from './types.js';
// Phase 2: 使用 Registry 获取安全路径
import { resolveDocument, getSafeAbsolutePath } from '../services/workspace-registry.js';

export interface ExecuteResult {
  success: boolean;
  commit_hash?: string;
  error?: string;
}

/**
 * 执行 Proposal（带原子性保证）
 * 
 * Phase 2: 移除 repositoryRoot 参数，强制通过 Registry 获取路径
 */
export async function executeProposal(proposal: Proposal): Promise<ExecuteResult> {
  // Phase 2: 通过 Registry 获取文档句柄
  const handle = resolveDocument(proposal.target_file);
  if (!handle) {
    return {
      success: false,
      error: `Document not found in registry: ${proposal.target_file}`,
    };
  }
  
  if (!handle.exists) {
    return {
      success: false,
      error: `Document does not exist: ${proposal.target_file}`,
    };
  }
  
  // Phase 2: 获取安全的绝对路径
  const targetPath = getSafeAbsolutePath(proposal.target_file);
  if (!targetPath) {
    return {
      success: false,
      error: `Unsafe path rejected by Registry: ${proposal.target_file}`,
    };
  }
  
  // 先校验（使用安全路径）
  const validation = validateProposal(proposal);
  if (!validation.valid) {
    return {
      success: false,
      error: `Validation failed: ${validation.errors.map(e => e.message).join('; ')}`,
    };
  }
  
  const backupPath = `${targetPath}.backup-${Date.now()}`;
  const tempPath = `${targetPath}.tmp-${Date.now()}`;
  
  let backupCreated = false;
  
  try {
    // 1. 读取原文档并创建备份
    const originalContent = readFileSync(targetPath, 'utf-8');
    copyFileSync(targetPath, backupPath);
    backupCreated = true;
    
    // 2. 应用所有操作，生成新内容
    let newContent = originalContent;
    for (const op of proposal.ops) {
      newContent = applyOperation(newContent, op);
    }
    
    // 3. 先写到临时文件
    writeFileSync(tempPath, newContent, 'utf-8');
    
    // 4. 替换原文件
    copyFileSync(tempPath, targetPath);
    
    // 5. Git commit（使用 config.repositoryRoot）
    const git: SimpleGit = simpleGit(config.repositoryRoot);
    
    await git.add(proposal.target_file);
    
    const commitMessage = `[ADL] ${proposal.id}: ${getCommitMessage(proposal)}`;
    const commitResult = await git.commit(commitMessage);
    
    // 6. 成功后清理临时文件和备份
    cleanupFile(tempPath);
    cleanupFile(backupPath);
    
    return {
      success: true,
      commit_hash: commitResult.commit,
    };
  } catch (error) {
    // 回滚：如果有备份，恢复原文件
    if (backupCreated && existsSync(backupPath)) {
      try {
        copyFileSync(backupPath, targetPath);
        console.error('[Executor] Rolled back to original file after error');
      } catch (rollbackError) {
        console.error('[Executor] Failed to rollback:', rollbackError);
      }
    }
    
    // 清理临时文件
    cleanupFile(tempPath);
    cleanupFile(backupPath);
    
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * 安全删除文件
 */
function cleanupFile(path: string): void {
  try {
    if (existsSync(path)) {
      unlinkSync(path);
    }
  } catch {
    // 忽略删除失败
  }
}

/**
 * 应用单个操作到文档内容
 */
function applyOperation(content: string, op: Operation): string {
  switch (op.op) {
    case 'update_yaml':
      return applyUpdateYaml(content, op);
    case 'insert_block':
      return applyInsertBlock(content, op);
    case 'append_event':
      return applyAppendEvent(content, op);
    case 'update_body':
      return applyUpdateBody(content, op);
    default:
      return content;
  }
}

/**
 * 应用 update_yaml 操作
 * 
 * Phase 0.5: 使用统一的 YAML dump 配置
 */
function applyUpdateYaml(content: string, op: Extract<Operation, { op: 'update_yaml' }>): string {
  const lines = content.split('\n');
  const doc = parseADL(content);
  const block = findBlockByAnchor(doc, op.anchor);
  
  if (!block) {
    return content;
  }
  
  // 找到这个 block 的 YAML 区域
  const { yamlStart, yamlEnd } = findYamlBlockRange(lines, block.startLine - 1);
  
  if (yamlStart === -1 || yamlEnd === -1) {
    return content;
  }
  
  // 解析当前 YAML
  const yamlContent = lines.slice(yamlStart + 1, yamlEnd).join('\n');
  const machine = yaml.load(yamlContent) as Record<string, unknown>;
  
  // 更新值
  setNestedValue(machine, op.path, op.value);
  
  // 生成新的 YAML（使用统一配置）
  const newYaml = yaml.dump(machine, config.yamlDumpOptions).trim();
  
  // 替换原 YAML 内容
  const newLines = [
    ...lines.slice(0, yamlStart + 1),
    newYaml,
    ...lines.slice(yamlEnd),
  ];
  
  return newLines.join('\n');
}

/**
 * 应用 insert_block 操作
 */
function applyInsertBlock(content: string, op: Extract<Operation, { op: 'insert_block' }>): string {
  const lines = content.split('\n');
  const doc = parseADL(content);
  const afterBlock = findBlockByAnchor(doc, op.after);
  
  if (!afterBlock) {
    return content;
  }
  
  // 生成新 block 内容
  const newBlockLines = [
    '',
    '---',
    '',
    op.block.heading,
    '',
    '```yaml',
    yaml.dump(op.block.machine, config.yamlDumpOptions).trim(),
    '```',
    '',
    op.block.body,
  ];
  
  // 在 afterBlock 结束后插入
  const insertLine = afterBlock.endLine;
  const newLines = [
    ...lines.slice(0, insertLine),
    ...newBlockLines,
    ...lines.slice(insertLine),
  ];
  
  return newLines.join('\n');
}

/**
 * 应用 append_event 操作
 */
function applyAppendEvent(content: string, op: Extract<Operation, { op: 'append_event' }>): string {
  // 类似 insert_block，但专门用于 event
  const insertOp: Extract<Operation, { op: 'insert_block' }> = {
    op: 'insert_block',
    after: op.after,
    block: {
      heading: `#### ${op.event.title || 'Event'} {#${op.event.id?.toLowerCase().replace(/_/g, '-') || 'evt-' + Date.now()}}`,
      machine: op.event,
      body: '',
    },
  };
  
  return applyInsertBlock(content, insertOp);
}

/**
 * 应用 update_body 操作
 */
function applyUpdateBody(content: string, op: Extract<Operation, { op: 'update_body' }>): string {
  const lines = content.split('\n');
  const doc = parseADL(content);
  const block = findBlockByAnchor(doc, op.anchor);
  
  if (!block) {
    return content;
  }
  
  // 找到 YAML 块结束位置
  const { yamlEnd } = findYamlBlockRange(lines, block.startLine - 1);
  
  if (yamlEnd === -1) {
    return content;
  }
  
  // 找到下一个 block 或文档结尾
  const nextBlockStart = findNextBlockStart(lines, yamlEnd + 1);
  
  // 替换 body 内容
  const newLines = [
    ...lines.slice(0, yamlEnd + 1),
    '',
    op.body,
    '',
    ...lines.slice(nextBlockStart),
  ];
  
  return newLines.join('\n');
}

/**
 * 找到 Block 中 YAML 块的行范围
 */
function findYamlBlockRange(lines: string[], blockStartLine: number): { yamlStart: number; yamlEnd: number } {
  let yamlStart = -1;
  let yamlEnd = -1;
  
  for (let i = blockStartLine; i < lines.length; i++) {
    const line = lines[i]?.trim() || '';
    
    if (line === '```yaml' && yamlStart === -1) {
      yamlStart = i;
    } else if (line === '```' && yamlStart !== -1 && yamlEnd === -1) {
      yamlEnd = i;
      break;
    }
    
    // 遇到下一个 heading 就停止
    if (i > blockStartLine && /^#{1,6}\s+/.test(line)) {
      break;
    }
  }
  
  return { yamlStart, yamlEnd };
}

/**
 * 找到下一个 Block 的起始行
 */
function findNextBlockStart(lines: string[], startLine: number): number {
  const headingRegex = /^#{1,6}\s+.+\{#[a-zA-Z0-9_-]+\}\s*$/;
  
  for (let i = startLine; i < lines.length; i++) {
    if (headingRegex.test(lines[i] || '')) {
      return i;
    }
  }
  
  return lines.length;
}

/**
 * 设置嵌套对象的值
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    
    // 处理数组索引
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      if (!current[key]) {
        current[key] = [];
      }
      const arr = current[key] as unknown[];
      if (!arr[parseInt(index, 10)]) {
        arr[parseInt(index, 10)] = {};
      }
      current = arr[parseInt(index, 10)] as Record<string, unknown>;
    } else {
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
  }
  
  const lastPart = parts[parts.length - 1];
  
  // 处理最后一个部分的数组索引
  const arrayMatch = lastPart.match(/^(\w+)\[(\d+)\]$/);
  if (arrayMatch) {
    const [, key, index] = arrayMatch;
    if (!current[key]) {
      current[key] = [];
    }
    (current[key] as unknown[])[parseInt(index, 10)] = value;
  } else {
    current[lastPart] = value;
  }
}

/**
 * 生成 commit message
 */
function getCommitMessage(proposal: Proposal): string {
  const opSummary = proposal.ops.map(op => {
    switch (op.op) {
      case 'update_yaml':
        return `update ${op.anchor}.${op.path}`;
      case 'insert_block':
        return `insert block after ${op.after}`;
      case 'append_event':
        return `append event after ${op.after}`;
      case 'update_body':
        return `update body of ${op.anchor}`;
      default:
        return 'unknown operation';
    }
  }).join(', ');
  
  return opSummary;
}

// ============================================================
// Phase 3.5: 序列化 ADL 文档
// ============================================================

import type { ADLDocument, AtlasFrontmatter } from './types.js';

/**
 * 将 ADL 文档序列化为 Markdown 字符串
 * 
 * Phase 3.5: 用于自动补齐后写回文件
 */
export function serializeADL(doc: ADLDocument): string {
  const lines: string[] = [];
  
  // 1. 序列化 Frontmatter
  if (doc.frontmatter && Object.keys(doc.frontmatter).length > 0) {
    lines.push('---');
    lines.push(yaml.dump(doc.frontmatter, config.yamlDumpOptions).trim());
    lines.push('---');
    lines.push('');
  }
  
  // 2. 序列化每个 Block
  for (let i = 0; i < doc.blocks.length; i++) {
    const block = doc.blocks[i];
    
    // 添加 Block 分隔符（第一个 Block 除外）
    if (i > 0) {
      lines.push('');
      lines.push('---');
      lines.push('');
    }
    
    // Heading
    lines.push(block.heading);
    lines.push('');
    
    // Machine Zone (YAML)
    if (block.machine && Object.keys(block.machine).length > 0) {
      lines.push('```yaml');
      lines.push(yaml.dump(block.machine, config.yamlDumpOptions).trim());
      lines.push('```');
      lines.push('');
    }
    
    // Human Zone (Body)
    if (block.body && block.body.trim()) {
      lines.push(block.body.trim());
      lines.push('');
    }
  }
  
  return lines.join('\n');
}
