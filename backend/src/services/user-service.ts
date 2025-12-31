/**
 * 用户服务 - 简化版（兼容查询接口）
 * 
 * 注意：完整的用户管理功能由 auth-service.ts 提供
 * 此文件仅用于提供简单的用户查询接口
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { getRepoPath } from '../git/git-service.js';

const USERS_DIR = 'workspace/用户';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatar?: string;
  created: string;
}

/**
 * 获取用户列表
 */
export async function getUsers(): Promise<User[]> {
  try {
    const usersDir = path.join(getRepoPath(), USERS_DIR);
    const entries = await fs.readdir(usersDir, { withFileTypes: true });
    const userDirs = entries.filter(entry => entry.isDirectory());

    const users: User[] = [];
    
    for (const dir of userDirs) {
      try {
        const profilePath = path.join(usersDir, dir.name, '资料.md');
        const content = await fs.readFile(profilePath, 'utf-8');
        
        // 解析 frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
          const frontmatter = yaml.parse(frontmatterMatch[1]);
          users.push({
            id: frontmatter.id || dir.name,
            name: frontmatter.name || dir.name,
            email: frontmatter.email || '',
            role: frontmatter.role || 'member',
            avatar: frontmatter.avatar,
            created: frontmatter.created_at || '',
          });
        }
      } catch {
        // 跳过无法读取的用户目录
      }
    }

    return users;
  } catch (error) {
    console.error('[UserService] 获取用户列表失败:', error);
    return [];
  }
}

/**
 * 获取单个用户
 */
export async function getUser(userId: string): Promise<User | null> {
  const users = await getUsers();
  return users.find((u) => u.id === userId) || null;
}

/**
 * 验证用户是否有权限执行操作
 */
export async function hasPermission(
  userId: string,
  requiredRoles: string[]
): Promise<boolean> {
  const user = await getUser(userId);
  if (!user) return false;

  return requiredRoles.includes(user.role);
}
