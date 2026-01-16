/**
 * Workspace Service - 工作空间索引服务
 * 
 * Phase 1: 实现多文档工作空间索引
 * Phase 1.5: 集成 Registry，成为唯一的索引重建入口
 * Phase 2: 添加缓存一致性校验（repo_head）
 * 
 * 职责：
 * 1. 扫描 repository 下所有 .md 文件（唯一允许扫描的地方）
 * 2. 解析并提取文档元数据
 * 3. 生成目录树结构
 * 4. 维护 workspace.json 索引文件
 * 5. 向 Registry 注册文档路径
 * 6. 检测索引是否过期（与 Git HEAD 比较）
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative, basename, dirname } from 'path';
import simpleGit from 'simple-git';
import { config, ensureDirectories } from '../config.js';
import { parseADL } from '../adl/parser.js';
import { registerDocument, resetRegistry } from './workspace-registry.js';
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
  // Phase 2: 缓存一致性
  /** Git HEAD commit hash（用于检测索引是否过期） */
  repo_head?: string;
  /** 索引是否可能过期（由 getWorkspaceIndex 设置） */
  stale?: boolean;
}

export interface TreeNode {
  /** 节点名称 */
  name: string;
  /** 节点类型 */
  type: 'directory' | 'document';
  /** 文件路径（仅文档有） */
  path?: string;
  /** URL Slug（仅文档有） */
  slug?: string;
  /** 子节点 */
  children?: TreeNode[];
}

// ============================================================
// 服务实现
// ============================================================

/**
 * 获取 Workspace 索引
 * 
 * Phase 2: 添加缓存一致性检查
 * 如果 repo_head 与当前 Git HEAD 不一致，标记 stale
 */
export async function getWorkspaceIndex(): Promise<WorkspaceIndex> {
  ensureDirectories();
  
  // 检查缓存
  if (existsSync(config.workspaceIndexPath)) {
    try {
      const cached = JSON.parse(readFileSync(config.workspaceIndexPath, 'utf-8')) as WorkspaceIndex;
      
      // Phase 2: 检查 repo head 一致性
      try {
        const git = simpleGit(config.repositoryRoot);
        const currentHead = await git.revparse(['HEAD']);
        
        if (cached.repo_head && cached.repo_head !== currentHead.trim()) {
          console.warn(`[Workspace] Index may be stale. Cached HEAD: ${cached.repo_head?.slice(0, 8)}, Current HEAD: ${currentHead.trim().slice(0, 8)}`);
          cached.stale = true;
        } else {
          cached.stale = false;
        }
      } catch (gitError) {
        // Git 操作失败，无法检查一致性，假设有效
        console.warn('[Workspace] Cannot check Git HEAD, assuming cache is valid');
        cached.stale = false;
      }
      
      return cached;
    } catch {
      // 缓存损坏，重建
    }
  }
  
  // 重建索引
  return rebuildWorkspaceIndex();
}

/**
 * 重建 Workspace 索引
 * 
 * Phase 1.5: 这是唯一允许扫描文件系统的地方
 * 重建时会向 Registry 注册所有文档路径
 * Phase 2: 保存 repo_head 用于缓存一致性检查
 */
export async function rebuildWorkspaceIndex(): Promise<WorkspaceIndex> {
  ensureDirectories();
  
  // Phase 1.5: 重置 Registry，准备重新注册
  resetRegistry();
  
  const documents: DocumentInfo[] = [];
  const directoriesMap = new Map<string, DirectoryInfo>();
  
  // 扫描所有 .md 文件（唯一允许的扫描点）
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
      
      // Phase 1.5: 向 Registry 注册文档
      registerDocument(relativePath);
      
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
  
  // Phase 2: 获取当前 Git HEAD
  let repoHead: string | undefined;
  try {
    const git = simpleGit(config.repositoryRoot);
    const head = await git.revparse(['HEAD']);
    repoHead = head.trim();
  } catch (gitError) {
    console.warn('[Workspace] Cannot get Git HEAD:', gitError);
  }
  
  const index: WorkspaceIndex = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    documents,
    directories: Array.from(directoriesMap.values()),
    stats,
    // Phase 2: 保存 repo head
    repo_head: repoHead,
    stale: false,
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
 * 
 * Phase 1.5: 同步更新 Registry
 */
export async function updateDocumentIndex(relativePath: string): Promise<void> {
  const index = await getWorkspaceIndex();
  const fullPath = join(config.repositoryRoot, relativePath);
  
  // 移除旧的文档信息
  index.documents = index.documents.filter(d => d.path !== relativePath);
  
  // 如果文件存在，添加新的文档信息并注册到 Registry
  if (existsSync(fullPath)) {
    try {
      const content = readFileSync(fullPath, 'utf-8');
      const doc = parseADL(content, relativePath);
      const stat = statSync(fullPath);
      
      const docInfo = extractDocumentInfo(doc, relativePath, stat.mtime);
      index.documents.push(docInfo);
      
      // Phase 1.5: 向 Registry 注册文档
      registerDocument(relativePath);
    } catch (error) {
      console.error(`Failed to update index for ${relativePath}:`, error);
    }
  } else {
    // Phase 1.5: 文件不存在，从 Registry 注销
    const { unregisterDocument } = await import('./workspace-registry.js');
    unregisterDocument(relativePath);
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
// Slug 功能
// ============================================================

/**
 * 生成随机 slug
 * 格式：doc-{6位随机字符}
 */
function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'doc-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 从文件内容中提取 frontmatter
 */
function extractFrontmatter(content: string): { frontmatter: Record<string, unknown> | null; body: string; raw: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: null, body: content, raw: '' };
  }
  
  try {
    const yaml = require('js-yaml');
    const frontmatter = yaml.load(match[1]) as Record<string, unknown>;
    return { frontmatter, body: match[2], raw: match[1] };
  } catch {
    return { frontmatter: null, body: content, raw: '' };
  }
}

/**
 * 将 frontmatter 和 body 重新组合为完整内容
 */
function composeFrontmatter(frontmatter: Record<string, unknown>, body: string): string {
  const yaml = require('js-yaml');
  const frontmatterStr = yaml.dump(frontmatter, { 
    indent: 2, 
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
  });
  return `---\n${frontmatterStr}---\n${body}`;
}

/**
 * 收集所有现有的 slug，用于避免重复
 */
function collectExistingSlugs(): Set<string> {
  const slugs = new Set<string>();
  const mdFiles = scanMarkdownFiles(config.repositoryRoot);
  
  for (const filePath of mdFiles) {
    const relativePath = relative(config.repositoryRoot, filePath);
    if (relativePath.startsWith('.atlas')) continue;
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      const { frontmatter } = extractFrontmatter(content);
      if (frontmatter?.slug && typeof frontmatter.slug === 'string') {
        slugs.add(frontmatter.slug);
      }
    } catch {
      // 忽略读取错误
    }
  }
  
  return slugs;
}

/**
 * 生成唯一 slug（避免与现有 slug 冲突）
 */
function generateUniqueSlug(existingSlugs: Set<string>): string {
  let slug = generateSlug();
  let attempts = 0;
  while (existingSlugs.has(slug) && attempts < 100) {
    slug = generateSlug();
    attempts++;
  }
  return slug;
}

/**
 * 确保所有文档都有 slug
 * 遍历所有 .md 文件，如果没有 slug 则自动生成并写入
 * 
 * @returns 新增 slug 的文档数量
 */
export function ensureAllDocumentSlugs(): { added: number; total: number; slugs: Record<string, string> } {
  console.log('[Workspace] Ensuring all documents have slugs...');
  
  // 收集现有 slug
  const existingSlugs = collectExistingSlugs();
  const mdFiles = scanMarkdownFiles(config.repositoryRoot);
  
  let added = 0;
  const slugMap: Record<string, string> = {};
  
  for (const filePath of mdFiles) {
    const relativePath = relative(config.repositoryRoot, filePath);
    if (relativePath.startsWith('.atlas')) continue;
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      let { frontmatter, body } = extractFrontmatter(content);
      
      // 如果没有 frontmatter，为文档创建一个
      if (!frontmatter) {
        frontmatter = {};
        body = content; // 整个内容作为 body
      }
      
      // 如果已有 slug，记录并跳过
      if (frontmatter.slug && typeof frontmatter.slug === 'string' && frontmatter.slug.trim()) {
        slugMap[relativePath] = frontmatter.slug;
        continue;
      }
      
      // 生成新 slug
      const newSlug = generateUniqueSlug(existingSlugs);
      existingSlugs.add(newSlug);
      
      // 更新 frontmatter
      frontmatter.slug = newSlug;
      
      // 写回文件
      const newContent = composeFrontmatter(frontmatter, body);
      writeFileSync(filePath, newContent, 'utf-8');
      
      slugMap[relativePath] = newSlug;
      added++;
      console.log(`[Workspace] Added slug "${newSlug}" to ${relativePath}`);
    } catch (error) {
      console.error(`[Workspace] Failed to process ${relativePath}:`, error);
    }
  }
  
  console.log(`[Workspace] Slug check complete: ${added} added, ${Object.keys(slugMap).length} total`);
  
  return { added, total: Object.keys(slugMap).length, slugs: slugMap };
}

/**
 * 根据 slug 查找文档路径
 */
export function findDocumentBySlug(slug: string): string | null {
  const mdFiles = scanMarkdownFiles(config.repositoryRoot);
  
  for (const filePath of mdFiles) {
    const relativePath = relative(config.repositoryRoot, filePath);
    if (relativePath.startsWith('.atlas')) continue;
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      const { frontmatter } = extractFrontmatter(content);
      
      if (frontmatter?.slug === slug) {
        return relativePath;
      }
    } catch {
      // 忽略读取错误
    }
  }
  
  return null;
}

/**
 * 列出所有 markdown 文件（导出供其他模块使用）
 */
export function listAllMarkdownFiles(): string[] {
  return scanMarkdownFiles(config.repositoryRoot)
    .map(f => relative(config.repositoryRoot, f))
    .filter(p => !p.startsWith('.atlas'));
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
 * 同时读取每个文档的 slug
 */
function buildTree(documents: DocumentInfo[]): TreeNode[] {
  const root: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();
  
  // 收集所有文档的 slug
  const slugMap = new Map<string, string>();
  for (const doc of documents) {
    try {
      const fullPath = join(config.repositoryRoot, doc.path);
      const content = readFileSync(fullPath, 'utf-8');
      const { frontmatter } = extractFrontmatter(content);
      if (frontmatter?.slug && typeof frontmatter.slug === 'string') {
        slugMap.set(doc.path, frontmatter.slug);
      }
    } catch {
      // 忽略读取错误
    }
  }
  
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
      slug: isDirectory ? undefined : slugMap.get(cleanPath),
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

