/**
 * Workspace Service - 工作空间索引服务
 * 
 * Phase 1: 实现多文档工作空间索引
 * 
 * 职责：
 * 1. 扫描 repository 下所有 .md 文件
 * 2. 解析并提取文档元数据
 * 3. 生成目录树结构
 * 4. 维护 workspace.json 索引文件
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative, basename, dirname } from 'path';
import { config, ensureDirectories } from '../config.js';
import { parseADL } from '../adl/parser.js';
import type { ADLDocument, Block } from '../adl/types.js';

// ============================================================
// 类型定义
// ============================================================

export interface DocumentInfo {
  /** 相对路径 */
  path: string;
  /** 文档标题 */
  title: string;
  /** 文档类型 */
  document_type: string;
  /** Block 数量 */
  block_count: number;
  /** Anchor 列表 */
  anchors: string[];
  /** Block 类型列表 */
  types: string[];
  /** 引用关系 */
  refs?: Record<string, string | string[]>;
  /** 修改时间 */
  modified_at: string;
}

export interface DirectoryInfo {
  /** 目录路径 */
  path: string;
  /** 目录名称 */
  name: string;
  /** 目录描述 */
  description?: string;
  /** 文档数量 */
  document_count: number;
}

export interface WorkspaceIndex {
  /** 版本 */
  version: string;
  /** 生成时间 */
  generated_at: string;
  /** 文档列表 */
  documents: DocumentInfo[];
  /** 目录列表 */
  directories: DirectoryInfo[];
  /** 统计信息 */
  stats: {
    total_documents: number;
    total_blocks: number;
    total_anchors: number;
  };
}

export interface TreeNode {
  /** 节点名称 */
  name: string;
  /** 节点类型 */
  type: 'directory' | 'document';
  /** 文件路径（仅文档有） */
  path?: string;
  /** 子节点 */
  children?: TreeNode[];
}

// ============================================================
// 服务实现
// ============================================================

/**
 * 获取 Workspace 索引
 */
export async function getWorkspaceIndex(): Promise<WorkspaceIndex> {
  ensureDirectories();
  
  // 检查缓存
  if (existsSync(config.workspaceIndexPath)) {
    try {
      const cached = JSON.parse(readFileSync(config.workspaceIndexPath, 'utf-8'));
      return cached as WorkspaceIndex;
    } catch {
      // 缓存损坏，重建
    }
  }
  
  // 重建索引
  return rebuildWorkspaceIndex();
}

/**
 * 重建 Workspace 索引
 */
export async function rebuildWorkspaceIndex(): Promise<WorkspaceIndex> {
  ensureDirectories();
  
  const documents: DocumentInfo[] = [];
  const directoriesMap = new Map<string, DirectoryInfo>();
  
  // 扫描所有 .md 文件
  const mdFiles = scanMarkdownFiles(config.repositoryRoot);
  
  for (const filePath of mdFiles) {
    const relativePath = relative(config.repositoryRoot, filePath);
    
    // 跳过 .atlas 目录
    if (relativePath.startsWith('.atlas')) {
      continue;
    }
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      const doc = parseADL(content, relativePath);
      const stat = statSync(filePath);
      
      // 提取文档信息
      const docInfo = extractDocumentInfo(doc, relativePath, stat.mtime);
      documents.push(docInfo);
      
      // 记录目录信息
      const dirPath = dirname(relativePath);
      if (dirPath !== '.') {
        if (!directoriesMap.has(dirPath)) {
          directoriesMap.set(dirPath, {
            path: dirPath,
            name: basename(dirPath),
            document_count: 0,
          });
        }
        const dirInfo = directoriesMap.get(dirPath)!;
        dirInfo.document_count++;
      }
    } catch (error) {
      console.error(`Failed to parse ${relativePath}:`, error);
    }
  }
  
  // 计算统计信息
  const stats = {
    total_documents: documents.length,
    total_blocks: documents.reduce((sum, d) => sum + d.block_count, 0),
    total_anchors: documents.reduce((sum, d) => sum + d.anchors.length, 0),
  };
  
  const index: WorkspaceIndex = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    documents,
    directories: Array.from(directoriesMap.values()),
    stats,
  };
  
  // 写入缓存
  writeFileSync(config.workspaceIndexPath, JSON.stringify(index, null, 2), 'utf-8');
  
  return index;
}

/**
 * 获取目录树
 */
export async function getWorkspaceTree(): Promise<TreeNode[]> {
  const index = await getWorkspaceIndex();
  return buildTree(index.documents);
}

/**
 * 更新单个文档的索引
 */
export async function updateDocumentIndex(relativePath: string): Promise<void> {
  const index = await getWorkspaceIndex();
  const fullPath = join(config.repositoryRoot, relativePath);
  
  // 移除旧的文档信息
  index.documents = index.documents.filter(d => d.path !== relativePath);
  
  // 如果文件存在，添加新的文档信息
  if (existsSync(fullPath)) {
    try {
      const content = readFileSync(fullPath, 'utf-8');
      const doc = parseADL(content, relativePath);
      const stat = statSync(fullPath);
      
      const docInfo = extractDocumentInfo(doc, relativePath, stat.mtime);
      index.documents.push(docInfo);
    } catch (error) {
      console.error(`Failed to update index for ${relativePath}:`, error);
    }
  }
  
  // 重新计算统计
  index.stats = {
    total_documents: index.documents.length,
    total_blocks: index.documents.reduce((sum, d) => sum + d.block_count, 0),
    total_anchors: index.documents.reduce((sum, d) => sum + d.anchors.length, 0),
  };
  
  index.generated_at = new Date().toISOString();
  
  // 写入缓存
  writeFileSync(config.workspaceIndexPath, JSON.stringify(index, null, 2), 'utf-8');
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 递归扫描所有 .md 文件
 */
function scanMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  
  if (!existsSync(dir)) {
    return files;
  }
  
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // 跳过隐藏目录和 node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }
      files.push(...scanMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * 从 ADL 文档提取信息
 */
function extractDocumentInfo(doc: ADLDocument, relativePath: string, mtime: Date): DocumentInfo {
  const anchors = doc.blocks.map(b => b.anchor).filter(Boolean);
  const types = [...new Set(doc.blocks.map(b => b.machine?.type).filter(Boolean))];
  
  // 从 frontmatter 或第一个 block 获取标题
  let title = String(doc.frontmatter?.title || '');
  if (!title && doc.blocks.length > 0) {
    title = doc.blocks[0].heading || basename(relativePath, '.md');
  }
  if (!title) {
    title = basename(relativePath, '.md');
  }
  
  // 获取文档类型
  const documentType = String(doc.frontmatter?.document_type || 'unknown');
  
  // 提取引用关系
  const refs: Record<string, string | string[]> = {};
  for (const block of doc.blocks) {
    if (block.machine?.refs) {
      Object.assign(refs, block.machine.refs);
    }
  }
  
  return {
    path: relativePath,
    title,
    document_type: documentType,
    block_count: doc.blocks.length,
    anchors,
    types,
    refs: Object.keys(refs).length > 0 ? refs : undefined,
    modified_at: mtime.toISOString(),
  };
}

/**
 * 从文档列表构建目录树
 */
function buildTree(documents: DocumentInfo[]): TreeNode[] {
  const root: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();
  
  // 收集所有路径
  const allPaths = new Set<string>();
  for (const doc of documents) {
    allPaths.add(doc.path);
    
    // 添加所有父目录
    let dir = dirname(doc.path);
    while (dir !== '.' && dir !== '') {
      allPaths.add(dir + '/');
      dir = dirname(dir);
    }
  }
  
  // 按路径排序
  const sortedPaths = Array.from(allPaths).sort();
  
  for (const path of sortedPaths) {
    const isDirectory = path.endsWith('/');
    const cleanPath = isDirectory ? path.slice(0, -1) : path;
    const name = basename(cleanPath);
    const parentPath = dirname(cleanPath);
    
    const node: TreeNode = {
      name,
      type: isDirectory ? 'directory' : 'document',
      path: isDirectory ? undefined : cleanPath,
      children: isDirectory ? [] : undefined,
    };
    
    nodeMap.set(cleanPath, node);
    
    if (parentPath === '.' || parentPath === '') {
      root.push(node);
    } else {
      const parent = nodeMap.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(node);
      }
    }
  }
  
  // 对每个目录的子节点排序（目录在前，文件在后）
  function sortChildren(nodes: TreeNode[]): void {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name, 'zh-CN');
    });
    
    for (const node of nodes) {
      if (node.children) {
        sortChildren(node.children);
      }
    }
  }
  
  sortChildren(root);
  
  return root;
}

