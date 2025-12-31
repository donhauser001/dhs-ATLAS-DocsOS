import { getLoadedCommands, getLoadedCommand, CommandDefinition } from './command-loader.js';
import { commit } from '../git/git-service.js';
import { executeProjectCommand } from './handlers/project-handler.js';
import { executeTaskCommand } from './handlers/task-handler.js';
import { executeServiceCommand } from './handlers/service-handler.js';
import { executeConfigCommand } from './handlers/config-handler.js';

export interface Operator {
  type: 'human' | 'ai';
  id: string;
  name?: string;
  context?: string;
}

export interface CommandResult {
  success: boolean;
  result?: Record<string, unknown>;
  commit?: { hash: string; message: string };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Command 执行器映射
const commandHandlers: Record<
  string,
  (params: Record<string, unknown>, operator: Operator) => Promise<CommandResult>
> = {};

/**
 * 注册 Command 处理器
 */
export function registerHandler(
  commandPrefix: string,
  handler: (
    commandName: string,
    params: Record<string, unknown>,
    operator: Operator
  ) => Promise<CommandResult>
) {
  // 使用前缀匹配
  commandHandlers[commandPrefix] = (params, operator) =>
    handler(commandPrefix, params, operator);
}

/**
 * 获取所有 Command 定义（供 API 使用）
 */
export async function getCommands(): Promise<CommandDefinition[]> {
  const commands = getLoadedCommands();
  return Array.from(commands.values());
}

/**
 * 获取单个 Command 定义
 */
export async function getCommand(name: string): Promise<CommandDefinition | null> {
  const command = getLoadedCommand(name);
  return command || null;
}

/**
 * 执行 Command
 */
export async function executeCommand(
  commandName: string,
  params: Record<string, unknown>,
  operator: Operator
): Promise<CommandResult> {
  // 获取 Command 定义
  const command = getLoadedCommand(commandName);
  if (!command) {
    return {
      success: false,
      error: {
        code: 'COMMAND_NOT_FOUND',
        message: `Command '${commandName}' 不存在`,
      },
    };
  }

  // 验证参数
  const validationResult = validateParams(command, params);
  if (!validationResult.valid) {
    return {
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: '参数验证失败',
        details: validationResult.errors,
      },
    };
  }

  // 路由到对应的处理器
  try {
    let result: CommandResult;

    if (commandName.startsWith('project.')) {
      result = await executeProjectCommand(commandName, params, operator);
    } else if (commandName.startsWith('task.')) {
      result = await executeTaskCommand(commandName, params, operator);
    } else if (commandName.startsWith('service.')) {
      result = await executeServiceCommand(commandName, params, operator);
    } else if (commandName.startsWith('config.')) {
      result = await executeConfigCommand(commandName, params, operator);
    } else {
      return {
        success: false,
        error: {
          code: 'NO_HANDLER',
          message: `Command '${commandName}' 没有对应的处理器`,
        },
      };
    }

    // 如果执行成功且有副作用，进行 Git commit
    if (result.success && command.side_effects?.length) {
      const commitMessage = generateCommitMessage(commandName, params, result.result);
      const commitResult = await commit(commitMessage, operator);
      result.commit = commitResult;
    }

    return result;
  } catch (error) {
    console.error(`[Command] 执行 ${commandName} 失败:`, error);
    return {
      success: false,
      error: {
        code: 'EXECUTION_FAILED',
        message: error instanceof Error ? error.message : '执行失败',
      },
    };
  }
}

/**
 * 验证参数
 */
function validateParams(
  command: CommandDefinition,
  params: Record<string, unknown>
): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  for (const [key, schema] of Object.entries(command.parameters)) {
    const value = params[key];

    // 检查必填
    if (schema.required && (value === undefined || value === null || value === '')) {
      errors.push(`参数 '${key}' 是必填项`);
      continue;
    }

    // 如果有值，检查类型
    if (value !== undefined && value !== null) {
      // 检查枚举值
      if (schema.values && !schema.values.includes(value as string)) {
        errors.push(`参数 '${key}' 的值必须是 [${schema.values.join(', ')}] 之一`);
      }

      // 检查类型
      if (schema.type === 'number' && typeof value !== 'number') {
        errors.push(`参数 '${key}' 必须是数字`);
      }
      if (schema.type === 'array' && !Array.isArray(value)) {
        errors.push(`参数 '${key}' 必须是数组`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * 生成 Commit 消息
 */
function generateCommitMessage(
  commandName: string,
  params: Record<string, unknown>,
  result?: Record<string, unknown>
): string {
  const templates: Record<string, string> = {
    'project.create': '[新建项目] {name}',
    'project.update': '[更新项目] {project_id}',
    'task.create': '[新建任务] {title}',
    'task.update': '[更新任务] {task_id}',
    'task.transition': '[任务流转] {task_id}: {event}',
    'service.create': '[新建服务] {category}/{name}',
    'service.update': '[更新服务] {category}/{name}',
    'service.delete': '[删除服务] {category}/{name}',
    'service.category.create': '[新建分类] {name}',
    'service.category.update': '[更新分类] {name}',
    'service.category.delete': '[删除分类] {name}',
    'config.create': '[新建配置] {name}',
    'config.update': '[更新配置] {id}',
    'config.delete': '[删除配置] {id}',
  };

  const template = templates[commandName] || `[${commandName}]`;

  // 替换模板变量
  let message = template;
  const allData = { ...params, ...result };

  for (const [key, value] of Object.entries(allData)) {
    message = message.replace(`{${key}}`, String(value));
  }

  return message;
}

