import yaml from 'yaml';
import matter from 'gray-matter';
import { writeFile, readFile, listDir } from '../../git/file-operations.js';
import { getStateMachine, canTransition, getNextState } from '../../state-machine/state-machine-loader.js';
import type { Operator, CommandResult } from '../command-engine.js';

/**
 * 执行任务相关 Command
 */
export async function executeTaskCommand(
  commandName: string,
  params: Record<string, unknown>,
  _operator: Operator
): Promise<CommandResult> {
  switch (commandName) {
    case 'task.create':
      return await createTask(params);
    case 'task.update':
      return await updateTask(params);
    case 'task.transition':
      return await transitionTask(params);
    case 'task.list':
      return await listTasks(params);
    case 'task.get':
      return await getTask(params);
    default:
      return {
        success: false,
        error: {
          code: 'UNKNOWN_COMMAND',
          message: `未知的任务命令: ${commandName}`,
        },
      };
  }
}

/**
 * 创建任务
 */
async function createTask(params: Record<string, unknown>): Promise<CommandResult> {
  const { project_id, title, assignee, priority, deadline, description } = params;

  // 查找项目路径
  const projectPath = await findProjectPath(project_id as string);
  if (!projectPath) {
    return {
      success: false,
      error: {
        code: 'PROJECT_NOT_FOUND',
        message: `项目 ${project_id} 不存在`,
      },
    };
  }

  // 生成任务 ID
  const seq = await getNextTaskSeq(projectPath);
  const taskId = `T-${String(seq).padStart(3, '0')}`;
  const taskPath = `${projectPath}/10_任务/${taskId}.md`;

  // 创建任务内容
  const frontmatter = {
    id: taskId,
    title,
    assignee,
    status: 'pending',
    priority: priority || 'medium',
    deadline: deadline || null,
    created: new Date().toISOString().split('T')[0],
    updated: new Date().toISOString().split('T')[0],
  };

  const content = `---
${yaml.stringify(frontmatter).trim()}
---

## 任务描述

${description || '（待补充）'}

## 备注

`;

  await writeFile(taskPath, content);

  return {
    success: true,
    result: {
      task_id: taskId,
      project_id,
      path: taskPath,
    },
  };
}

/**
 * 更新任务
 */
async function updateTask(params: Record<string, unknown>): Promise<CommandResult> {
  const { task_id, updates } = params;

  // 查找任务
  const taskInfo = await findTask(task_id as string);
  if (!taskInfo) {
    return {
      success: false,
      error: {
        code: 'TASK_NOT_FOUND',
        message: `任务 ${task_id} 不存在`,
      },
    };
  }

  // 解析现有内容
  const { data: frontmatter, content } = matter(taskInfo.content);
  const updatedFields: string[] = [];

  // 应用更新（不允许通过 update 修改 status）
  const updateData = updates as Record<string, unknown>;
  for (const [key, value] of Object.entries(updateData)) {
    if (key === 'status') continue; // 状态通过 transition 修改
    if (value !== undefined && frontmatter[key] !== value) {
      frontmatter[key] = value;
      updatedFields.push(key);
    }
  }

  if (updatedFields.length === 0) {
    return {
      success: true,
      result: {
        updated_fields: [],
        message: '没有字段需要更新',
      },
    };
  }

  // 更新 updated 时间
  frontmatter.updated = new Date().toISOString().split('T')[0];

  // 重新生成文件内容
  const newContent = `---
${yaml.stringify(frontmatter).trim()}
---
${content}`;

  await writeFile(taskInfo.path, newContent);

  return {
    success: true,
    result: {
      updated_fields: updatedFields,
    },
  };
}

/**
 * 任务状态流转
 */
async function transitionTask(params: Record<string, unknown>): Promise<CommandResult> {
  const { task_id, event, comment } = params;

  // 查找任务
  const taskInfo = await findTask(task_id as string);
  if (!taskInfo) {
    return {
      success: false,
      error: {
        code: 'TASK_NOT_FOUND',
        message: `任务 ${task_id} 不存在`,
      },
    };
  }

  // 解析现有内容
  const { data: frontmatter, content } = matter(taskInfo.content);
  const currentStatus = frontmatter.status as string;

  // 获取状态机
  const stateMachine = await getStateMachine('任务');
  if (!stateMachine) {
    return {
      success: false,
      error: {
        code: 'STATE_MACHINE_NOT_FOUND',
        message: '任务状态机未定义',
      },
    };
  }

  // 检查是否可以流转
  if (!canTransition(stateMachine, currentStatus, event as string)) {
    const state = stateMachine.states[currentStatus];
    const availableEvents = state?.transitions?.map((t) => t.event) || [];

    return {
      success: false,
      error: {
        code: 'INVALID_TRANSITION',
        message: `任务状态不允许从 '${currentStatus}' 通过事件 '${event}' 流转`,
        details: {
          current_status: currentStatus,
          requested_event: event,
          allowed_events: availableEvents,
        },
      },
    };
  }

  // 执行流转
  const nextStatus = getNextState(stateMachine, currentStatus, event as string);
  frontmatter.status = nextStatus;
  frontmatter.updated = new Date().toISOString().split('T')[0];

  // 添加流转记录到内容中
  let newContent = content;
  if (comment) {
    const timestamp = new Date().toISOString();
    newContent += `\n### ${timestamp.split('T')[0]} 状态变更: ${currentStatus} → ${nextStatus}\n\n${comment}\n`;
  }

  // 重新生成文件
  const fileContent = `---
${yaml.stringify(frontmatter).trim()}
---
${newContent}`;

  await writeFile(taskInfo.path, fileContent);

  return {
    success: true,
    result: {
      from_status: currentStatus,
      to_status: nextStatus,
      event,
    },
  };
}

/**
 * 获取任务列表
 */
async function listTasks(params: Record<string, unknown>): Promise<CommandResult> {
  const { project_id, status, assignee } = params;

  const tasks: Array<Record<string, unknown>> = [];

  if (project_id) {
    // 获取指定项目的任务
    const projectPath = await findProjectPath(project_id as string);
    if (!projectPath) {
      return {
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `项目 ${project_id} 不存在`,
        },
      };
    }

    const taskFiles = await listDir(`${projectPath}/10_任务`);
    for (const file of taskFiles) {
      if (file.type !== 'file' || !file.name.endsWith('.md')) continue;

      const content = await readFile(file.path);
      if (!content) continue;

      const { data } = matter(content);

      // 应用筛选
      if (status && data.status !== status) continue;
      if (assignee && data.assignee !== assignee) continue;

      tasks.push({
        ...data,
        project_id,
        path: file.path,
      });
    }
  } else {
    // 获取所有项目的任务（需要遍历）
    // TODO: 实现全局任务查询
  }

  return {
    success: true,
    result: {
      tasks,
      total: tasks.length,
    },
  };
}

/**
 * 获取任务详情
 */
async function getTask(params: Record<string, unknown>): Promise<CommandResult> {
  const { task_id } = params;

  const taskInfo = await findTask(task_id as string);
  if (!taskInfo) {
    return {
      success: false,
      error: {
        code: 'TASK_NOT_FOUND',
        message: `任务 ${task_id} 不存在`,
      },
    };
  }

  const { data, content } = matter(taskInfo.content);

  return {
    success: true,
    result: {
      task: {
        ...data,
        content: content.trim(),
        path: taskInfo.path,
      },
    },
  };
}

// ============ 辅助函数 ============

async function findProjectPath(projectId: string): Promise<string | null> {
  const match = projectId.match(/^P-(\d{4})-/);
  if (!match) return null;

  const year = match[1];
  const yearPath = `projects/${year}`;
  const items = await listDir(yearPath);

  for (const item of items) {
    if (item.type === 'directory' && item.name.startsWith(projectId)) {
      return item.path;
    }
  }

  return null;
}

async function getNextTaskSeq(projectPath: string): Promise<number> {
  const taskDir = `${projectPath}/10_任务`;
  const items = await listDir(taskDir);

  let maxSeq = 0;
  for (const item of items) {
    if (item.type !== 'file') continue;
    const match = item.name.match(/^T-(\d{3})\.md$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  return maxSeq + 1;
}

async function findTask(
  taskId: string
): Promise<{ path: string; content: string; projectId: string } | null> {
  // 遍历所有项目查找任务
  const years = await listDir('projects');

  for (const yearItem of years) {
    if (yearItem.type !== 'directory') continue;

    const projects = await listDir(yearItem.path);
    for (const projectItem of projects) {
      if (projectItem.type !== 'directory') continue;

      const taskPath = `${projectItem.path}/10_任务/${taskId}.md`;
      const content = await readFile(taskPath);

      if (content) {
        // 提取项目 ID
        const projectMatch = projectItem.name.match(/^(P-\d{4}-\d{4})/);
        const projectId = projectMatch ? projectMatch[1] : '';

        return { path: taskPath, content, projectId };
      }
    }
  }

  return null;
}

