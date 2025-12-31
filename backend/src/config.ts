/**
 * ATLAS Runtime 配置
 * 
 * Phase 0.5: 统一路径配置，避免环境差异问题
 */

import { join, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

// 确定项目根目录（backend 的父目录）
function findProjectRoot(): string {
  // 优先使用环境变量
  if (process.env.ATLAS_PROJECT_ROOT) {
    return resolve(process.env.ATLAS_PROJECT_ROOT);
  }
  
  // 从当前工作目录推断
  // 如果 cwd 是 backend，则上一级是项目根目录
  const cwd = process.cwd();
  
  if (cwd.endsWith('/backend') || cwd.endsWith('\\backend')) {
    return resolve(cwd, '..');
  }
  
  // 如果 cwd 已经是项目根目录（包含 repository 目录）
  if (existsSync(join(cwd, 'repository'))) {
    return cwd;
  }
  
  // 默认假设从 backend 运行
  return resolve(cwd, '..');
}

const PROJECT_ROOT = findProjectRoot();

export const config = {
  // 项目根目录
  projectRoot: PROJECT_ROOT,
  
  // 文档仓库目录
  repositoryRoot: join(PROJECT_ROOT, 'repository'),
  
  // ATLAS 内部数据目录
  atlasDataDir: join(PROJECT_ROOT, 'repository', '.atlas'),
  
  // Proposal 存储目录
  proposalsDir: join(PROJECT_ROOT, 'repository', '.atlas', 'proposals'),
  
  // 服务端口
  port: parseInt(process.env.PORT || '3000', 10),
  
  // YAML dump 配置（统一格式，避免漂移）
  yamlDumpOptions: {
    indent: 2,
    lineWidth: -1,         // 不自动换行
    quotingType: '"' as const,
    forceQuotes: false,
    sortKeys: false,       // 保持原有顺序
    noRefs: true,          // 不使用引用
  },
};

/**
 * 确保必要的目录存在
 */
export function ensureDirectories(): void {
  const dirs = [
    config.atlasDataDir,
    config.proposalsDir,
  ];
  
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * 验证配置
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!existsSync(config.repositoryRoot)) {
    errors.push(`Repository root not found: ${config.repositoryRoot}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export default config;

