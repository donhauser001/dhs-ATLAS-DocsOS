import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { getRepoPath } from '../git/git-service.js';

export interface CommandParameter {
  type: string;
  required?: boolean;
  default?: unknown;
  description?: string;
  source?: string;
  values?: string[];
  items?: { type: string; source?: string };
  properties?: Record<string, CommandParameter>;
}

export interface CommandDefinition {
  name: string;
  description: string;
  parameters: Record<string, CommandParameter>;
  returns?: Record<string, { type: string; description?: string }>;
  side_effects?: string[];
  examples?: Array<{
    description: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
  }>;
  permissions?: {
    roles?: string[];
    allow_ai?: boolean;
  };
}

// 缓存已加载的 Commands
let commandsCache: Map<string, CommandDefinition> = new Map();

/**
 * 加载所有 Command 定义
 */
export async function loadCommands(): Promise<void> {
  const commandsDir = path.join(getRepoPath(), 'workspace/命令');

  try {
    const files = await fs.readdir(commandsDir);

    for (const file of files) {
      if (!file.endsWith('.yml') && !file.endsWith('.yaml')) continue;

      const filePath = path.join(commandsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = yaml.parse(content);

      if (parsed.commands) {
        for (const [key, value] of Object.entries(parsed.commands)) {
          commandsCache.set(key, value as CommandDefinition);
        }
      }
    }

    console.log(`[Command] 已加载 ${commandsCache.size} 个 Command`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('[Command] commands 目录不存在，跳过加载');
    } else {
      throw error;
    }
  }
}

/**
 * 获取所有 Command
 */
export function getLoadedCommands(): Map<string, CommandDefinition> {
  return commandsCache;
}

/**
 * 获取单个 Command
 */
export function getLoadedCommand(name: string): CommandDefinition | undefined {
  return commandsCache.get(name);
}

/**
 * 重新加载 Commands
 */
export async function reloadCommands(): Promise<void> {
  commandsCache.clear();
  await loadCommands();
}

