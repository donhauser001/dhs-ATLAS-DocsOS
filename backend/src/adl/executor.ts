/**
 * ADL Executor - 执行器
 * 
 * 职责：应用 Proposal 并生成 Git Commit
 * 
 * Phase 0 实现：
 * 1. 读取原文档
 * 2. 定位目标 Block
 * 3. 修改 Machine Zone YAML
 * 4. 保持 Human Zone 不变
 * 5. 原子写入 + Git Commit
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import simpleGit, { SimpleGit } from 'simple-git';
import { parseADL, findBlockByAnchor } from './parser.js';
import { validateProposal } from './validator.js';
import type { Proposal, Operation, Block, MachineBlock } from './types.js';

interface ExecuteResult {
  success: boolean;
  commit_hash?: string;
  error?: string;
}

/**
 * 执行 Proposal
 */
export async function executeProposal(proposal: Proposal, repositoryRoot: string): Promise<ExecuteResult> {
  // 先校验
  const validation = validateProposal(proposal, repositoryRoot);
  if (!validation.valid) {
    return {
      success: false,
      error: `Validation failed: ${validation.errors.map(e => e.message).join('; ')}`,
    };
  }
  
  const targetPath = join(repositoryRoot, proposal.target_file);
  
  try {
    // 读取原文档
    const originalContent = readFileSync(targetPath, 'utf-8');
    
    // 应用所有操作
    let newContent = originalContent;
    for (const op of proposal.ops) {
      newContent = applyOperation(newContent, op);
    }
    
    // 写入文件
    writeFileSync(targetPath, newContent, 'utf-8');
    
    // Git commit
    const git: SimpleGit = simpleGit(repositoryRoot);
    
    await git.add(proposal.target_file);
    
    const commitMessage = `[ADL] ${proposal.id}: ${getCommitMessage(proposal)}`;
    const commitResult = await git.commit(commitMessage);
    
    return {
      success: true,
      commit_hash: commitResult.commit,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
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
  
  // 生成新的 YAML
  const newYaml = yaml.dump(machine, {
    indent: 2,
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
  }).trim();
  
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
    yaml.dump(op.block.machine, { indent: 2 }).trim(),
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

