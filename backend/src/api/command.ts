import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getCommands, getCommand, executeCommand } from '../commands/command-engine.js';

export const commandRouter = Router();

// 操作者 Schema
const OperatorSchema = z.object({
  type: z.enum(['human', 'ai']),
  id: z.string(),
  name: z.string().optional(),
  context: z.string().optional(),
});

// Command 执行请求 Schema
const CommandRequestSchema = z.object({
  command: z.string(),
  params: z.record(z.any()),
  operator: OperatorSchema,
});

/**
 * GET /api/command
 * 获取所有 Command 定义（供 AI 能力发现）
 */
commandRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const commands = await getCommands();
    res.json({
      success: true,
      commands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'LOAD_COMMANDS_FAILED',
        message: '加载 Command 定义失败',
      },
    });
  }
});

/**
 * GET /api/command/:name
 * 获取单个 Command 的完整 Schema
 */
commandRouter.get('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const command = await getCommand(name);
    
    if (!command) {
      res.status(404).json({
        success: false,
        error: {
          code: 'COMMAND_NOT_FOUND',
          message: `Command '${name}' 不存在`,
        },
      });
      return;
    }

    res.json({
      success: true,
      command,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_COMMAND_FAILED',
        message: '获取 Command 定义失败',
      },
    });
  }
});

/**
 * POST /api/command
 * 执行 Command
 */
commandRouter.post('/', async (req: Request, res: Response) => {
  try {
    // 验证请求格式
    const parseResult = CommandRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '请求格式错误',
          details: parseResult.error.errors,
        },
      });
      return;
    }

    const { command, params, operator } = parseResult.data;

    // 执行 Command
    const result = await executeCommand(command, params, operator);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Command] 执行失败:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'COMMAND_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : '执行失败',
      },
    });
  }
});

/**
 * POST /api/command/batch
 * 批量执行 Command（供 AI 批量操作）
 */
commandRouter.post('/batch', async (req: Request, res: Response) => {
  try {
    const { commands, operator } = req.body;

    if (!Array.isArray(commands)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'commands 必须是数组',
        },
      });
      return;
    }

    const results = [];
    for (const cmd of commands) {
      const result = await executeCommand(cmd.command, cmd.params, operator);
      results.push({
        command: cmd.command,
        ...result,
      });
    }

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : '批量执行失败',
      },
    });
  }
});

