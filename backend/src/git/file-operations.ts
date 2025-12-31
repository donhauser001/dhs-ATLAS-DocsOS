import fs from 'fs/promises';
import path from 'path';
import { getRepoPath } from './git-service.js';

/**
 * 读取文件内容
 */
export async function readFile(filePath: string): Promise<string | null> {
  try {
    const fullPath = path.join(getRepoPath(), filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * 写入文件
 */
export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  const fullPath = path.join(getRepoPath(), filePath);
  const dir = path.dirname(fullPath);

  // 确保目录存在
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(fullPath, content, 'utf-8');
}

/**
 * 删除文件
 */
export async function deleteFile(filePath: string): Promise<void> {
  const fullPath = path.join(getRepoPath(), filePath);
  await fs.unlink(fullPath);
}

/**
 * 检查文件是否存在
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const fullPath = path.join(getRepoPath(), filePath);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 列出目录内容
 */
export async function listDir(
  dirPath: string,
  recursive: boolean = false
): Promise<Array<{ name: string; type: 'file' | 'directory'; path: string }>> {
  const fullPath = path.join(getRepoPath(), dirPath);
  const items: Array<{ name: string; type: 'file' | 'directory'; path: string }> = [];

  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      // 跳过 .git 目录
      if (entry.name === '.git') continue;

      const itemPath = path.join(dirPath, entry.name);
      const type = entry.isDirectory() ? 'directory' : 'file';

      items.push({
        name: entry.name,
        type,
        path: itemPath,
      });

      if (recursive && entry.isDirectory()) {
        const subItems = await listDir(itemPath, true);
        items.push(...subItems);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  return items;
}

/**
 * 获取目录树
 */
export async function getTree(
  dirPath: string
): Promise<{
  name: string;
  type: 'file' | 'directory';
  children?: Array<any>;
}> {
  const fullPath = path.join(getRepoPath(), dirPath);
  const name = path.basename(fullPath) || 'root';

  try {
    const stat = await fs.stat(fullPath);

    if (!stat.isDirectory()) {
      return { name, type: 'file' };
    }

    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const children = [];

    for (const entry of entries) {
      if (entry.name === '.git') continue;

      const childPath = path.join(dirPath, entry.name);
      const child = await getTree(childPath);
      children.push(child);
    }

    return { name, type: 'directory', children };
  } catch (error) {
    return { name, type: 'directory', children: [] };
  }
}

/**
 * 创建目录
 */
export async function createDir(dirPath: string): Promise<void> {
  const fullPath = path.join(getRepoPath(), dirPath);
  await fs.mkdir(fullPath, { recursive: true });
}

