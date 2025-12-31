import { Router, Request, Response } from 'express';
import { getProjects, getProject } from '../services/project-service.js';
import { getTasks, getTask } from '../services/task-service.js';
import { getStateMachines, getStateMachine } from '../state-machine/state-machine-loader.js';
import { getCommands } from '../commands/command-engine.js';
import { getUsers } from '../services/user-service.js';

export const queryRouter = Router();

/**
 * GET /api/commands
 * 获取所有 Command 定义（AI 能力发现）
 */
queryRouter.get('/commands', async (_req: Request, res: Response) => {
  try {
    const commands = await getCommands();
    const stateMachines = await getStateMachines();

    res.json({
      success: true,
      commands,
      state_machines: stateMachines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'LOAD_FAILED', message: '加载失败' },
    });
  }
});

/**
 * GET /api/projects
 * 获取项目列表
 */
queryRouter.get('/projects', async (req: Request, res: Response) => {
  try {
    const { year, status, manager } = req.query;
    const projects = await getProjects({
      year: year ? parseInt(year as string) : undefined,
      status: status as string,
      manager: manager as string,
    });

    res.json({
      success: true,
      projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_FAILED', message: '查询项目失败' },
    });
  }
});

/**
 * GET /api/projects/:id
 * 获取项目详情
 */
queryRouter.get('/projects/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await getProject(id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `项目 ${id} 不存在` },
      });
      return;
    }

    res.json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_FAILED', message: '查询项目失败' },
    });
  }
});

/**
 * GET /api/projects/:id/tasks
 * 获取项目的任务列表
 */
queryRouter.get('/projects/:id/tasks', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assignee } = req.query;

    const tasks = await getTasks({
      projectId: id,
      status: status as string,
      assignee: assignee as string,
    });

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_FAILED', message: '查询任务失败' },
    });
  }
});

/**
 * GET /api/tasks/:id
 * 获取任务详情
 */
queryRouter.get('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await getTask(id);

    if (!task) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `任务 ${id} 不存在` },
      });
      return;
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_FAILED', message: '查询任务失败' },
    });
  }
});

/**
 * GET /api/state-machines
 * 获取所有状态机定义
 */
queryRouter.get('/state-machines', async (_req: Request, res: Response) => {
  try {
    const stateMachines = await getStateMachines();
    res.json({
      success: true,
      state_machines: stateMachines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'LOAD_FAILED', message: '加载状态机失败' },
    });
  }
});

/**
 * GET /api/state-machines/:name
 * 获取单个状态机定义
 */
queryRouter.get('/state-machines/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const stateMachine = await getStateMachine(name);

    if (!stateMachine) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `状态机 ${name} 不存在` },
      });
      return;
    }

    res.json({
      success: true,
      state_machine: stateMachine,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'LOAD_FAILED', message: '加载状态机失败' },
    });
  }
});

/**
 * GET /api/users
 * 获取用户列表
 */
queryRouter.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await getUsers();
    res.json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'LOAD_FAILED', message: '加载用户列表失败' },
    });
  }
});

