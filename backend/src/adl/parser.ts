/**
 * ADL Parser - Atlas Document Language 解析器
 * 
 * 职责：将 ADL 文档解析为可操作的结构（AST）
 * 
 * 基于 ADL Spec v1.0
 * Phase 3.3: 支持 atlas frontmatter 解析
 */

import yaml from 'js-yaml';
import type { ADLDocument, Block, MachineBlock, AtlasFrontmatter } from './types.js';
import { isAtlasFrontmatter } from './types.js';

/**
 * 解析 ADL 文档
 * 
 * Phase 3.3: 自动提取 atlas 功能声明
 */
export function parseADL(content: string, path: string = ''): ADLDocument {
  const lines = content.split('\n');

  // 解析 frontmatter
  const { frontmatter, contentStartLine } = parseFrontmatter(lines);

  // 解析所有 blocks
  const blocks = parseBlocks(lines, contentStartLine);

  // Phase 3.3: 提取 atlas 功能声明
  const atlas = parseAtlasFrontmatter(frontmatter);

  return {
    path,
    frontmatter,
    atlas,
    blocks,
    raw: content,
  };
}

/**
 * 解析 Atlas Frontmatter
 * 
 * Phase 3.3: 从 frontmatter 中提取 atlas 功能声明
 */
export function parseAtlasFrontmatter(frontmatter: Record<string, unknown>): AtlasFrontmatter | undefined {
  const atlasRaw = frontmatter.atlas;

  if (!atlasRaw) {
    return undefined;
  }

  if (!isAtlasFrontmatter(atlasRaw)) {
    console.warn('[Parser] Invalid atlas frontmatter format');
    return undefined;
  }

  return atlasRaw;
}

/**
 * 解析 YAML frontmatter
 */
function parseFrontmatter(lines: string[]): { frontmatter: Record<string, unknown>; contentStartLine: number } {
  if (lines[0]?.trim() !== '---') {
    return { frontmatter: {}, contentStartLine: 0 };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontmatter: {}, contentStartLine: 0 };
  }

  const frontmatterContent = lines.slice(1, endIndex).join('\n');

  try {
    const frontmatter = yaml.load(frontmatterContent) as Record<string, unknown>;
    return { frontmatter: frontmatter || {}, contentStartLine: endIndex + 1 };
  } catch {
    return { frontmatter: {}, contentStartLine: endIndex + 1 };
  }
}

/**
 * 解析所有 Blocks
 */
export function parseBlocks(lines: string[], startLine: number = 0): Block[] {
  const blocks: Block[] = [];
  const headingRegex = /^(#{1,6})\s+(.+?)\s*\{#([a-zA-Z0-9_-]+)\}\s*$/;

  let currentBlock: Partial<Block> | null = null;
  let currentBlockContent: string[] = [];
  let inYamlBlock = false;
  let yamlContent: string[] = [];

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i] || '';
    const lineNumber = i + 1; // 1-based line number

    // 检测 Heading with Anchor
    const headingMatch = line.match(headingRegex);

    if (headingMatch && !inYamlBlock) {
      // 保存之前的 block
      if (currentBlock && currentBlock.anchor) {
        finalizeBlock(currentBlock, currentBlockContent, blocks, i);
      }

      // 开始新 block
      const [, hashes, headingText, anchor] = headingMatch;
      currentBlock = {
        anchor,
        heading: headingText,
        level: hashes.length,
        startLine: lineNumber,
        machine: { type: '', id: '', status: 'draft', title: '' },
        body: '',
      };
      currentBlockContent = [];
      continue;
    }

    // 检测 YAML code block 开始 (支持 ```yaml 和 ```atlas-data)
    if ((line.trim() === '```yaml' || line.trim() === '```atlas-data') && currentBlock) {
      inYamlBlock = true;
      yamlContent = [];
      continue;
    }

    // 检测 YAML code block 结束
    if (line.trim() === '```' && inYamlBlock) {
      inYamlBlock = false;

      // 解析 YAML 内容
      try {
        const machine = yaml.load(yamlContent.join('\n')) as MachineBlock;
        if (currentBlock && machine) {
          // 先展开 machine，再用默认值覆盖缺失字段
          currentBlock.machine = {
            ...machine,
            type: machine.type || '',
            id: machine.id || '',
            status: machine.status || 'draft',
            title: machine.title || '',
          };
        }
      } catch (e) {
        console.error('Failed to parse YAML block:', e);
      }
      continue;
    }

    // 收集 YAML 内容
    if (inYamlBlock) {
      yamlContent.push(line);
      continue;
    }

    // 收集 block 内容（body）
    if (currentBlock) {
      currentBlockContent.push(line);
    }
  }

  // 保存最后一个 block
  if (currentBlock && currentBlock.anchor) {
    finalizeBlock(currentBlock, currentBlockContent, blocks, lines.length);
  }

  return blocks;
}

/**
 * 完成 Block 处理
 */
function finalizeBlock(
  block: Partial<Block>,
  content: string[],
  blocks: Block[],
  endLineNumber: number
): void {
  // 清理 body 内容（移除开头和结尾的空行）
  let body = content.join('\n');
  body = body.replace(/^\n+/, '').replace(/\n+$/, '');

  // 移除分隔线（---）
  body = body.replace(/^---\s*$/gm, '').trim();

  blocks.push({
    anchor: block.anchor!,
    heading: block.heading!,
    level: block.level!,
    machine: block.machine as MachineBlock,
    body,
    startLine: block.startLine!,
    endLine: endLineNumber,
  });
}

/**
 * 根据 Anchor 查找 Block
 */
export function findBlockByAnchor(doc: ADLDocument, anchor: string): Block | undefined {
  return doc.blocks.find(b => b.anchor === anchor);
}

/**
 * 根据 Type 过滤 Blocks
 */
export function filterBlocksByType(doc: ADLDocument, type: string): Block[] {
  return doc.blocks.filter(b => b.machine.type === type);
}

/**
 * 获取 Block 中指定路径的值
 */
export function getBlockValue(block: Block, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = block.machine;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // 处理数组索引，如 refs.related[0]
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = (current as Record<string, unknown>)[key];
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)];
      } else {
        return undefined;
      }
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current;
}

/**
 * 验证 Block 的基本结构
 */
export function validateBlockStructure(block: Block): string[] {
  const errors: string[] = [];

  if (!block.anchor) {
    errors.push('Block missing anchor');
  }

  if (!block.machine.type) {
    errors.push(`Block ${block.anchor}: missing type in machine block`);
  }

  if (!block.machine.id) {
    errors.push(`Block ${block.anchor}: missing id in machine block`);
  }

  if (!block.machine.status) {
    errors.push(`Block ${block.anchor}: missing status in machine block`);
  }

  return errors;
}

