import path from 'path';
import yaml from 'yaml';
import { nanoid } from 'nanoid';
import { writeFile, readFile, createDir, listDir } from '../../git/file-operations.js';
import type { Operator, CommandResult } from '../command-engine.js';

/**
 * 执行项目相关 Command
 */
export async function executeProjectCommand(
  commandName: string,
  params: Record<string, unknown>,
  _operator: Operator
): Promise<CommandResult> {
  switch (commandName) {
    case 'project.create':
      return await createProject(params);
    case 'project.update':
      return await updateProject(params);
    case 'project.list':
      return await listProjects(params);
    case 'project.get':
      return await getProject(params);
    default:
      return {
        success: false,
        error: {
          code: 'UNKNOWN_COMMAND',
          message: `未知的项目命令: ${commandName}`,
        },
      };
  }
}

/**
 * 创建项目
 */
async function createProject(params: Record<string, unknown>): Promise<CommandResult> {
  const { name, client, type, deadline, budget, manager, team } = params;

  // 生成项目 ID
  const year = new Date().getFullYear();
  const seq = await getNextProjectSeq(year);
  const projectId = `P-${year}-${String(seq).padStart(4, '0')}`;

  // 生成目录名
  const dirName = `${projectId}-${client}-${name}`;
  const projectPath = `projects/${year}/${dirName}`;

  // 创建项目目录结构
  await createDir(projectPath);
  await createDir(`${projectPath}/00_基础信息`);
  await createDir(`${projectPath}/10_任务`);
  await createDir(`${projectPath}/20_提案`);
  await createDir(`${projectPath}/30_合同`);
  await createDir(`${projectPath}/40_财务`);
  await createDir(`${projectPath}/50_成本`);
  await createDir(`${projectPath}/附件/图片`);
  await createDir(`${projectPath}/附件/文档`);

  // 创建 meta.yml
  const meta = {
    id: projectId,
    name,
    client,
    status: 'pending',
    type: type || 'other',
    created: new Date().toISOString().split('T')[0],
    deadline: deadline || null,
    budget: budget || null,
    manager,
    team: team || [manager],
    tags: [],
  };

  await writeFile(`${projectPath}/meta.yml`, yaml.stringify(meta));

  // 创建 README.md
  const readme = `# ${name}

## 项目信息

- **项目编号**: ${projectId}
- **客户**: ${client}
- **状态**: 待启动
- **负责人**: ${manager}

## 目录说明

- \`00_基础信息/\` - 客户信息、项目背景
- \`10_任务/\` - 项目任务
- \`20_提案/\` - 设计提案
- \`30_合同/\` - 合同文档
- \`40_财务/\` - 财务记录
- \`50_成本/\` - 成本记录
- \`附件/\` - 相关附件
`;

  await writeFile(`${projectPath}/README.md`, readme);

  return {
    success: true,
    result: {
      project_id: projectId,
      path: projectPath,
    },
  };
}

/**
 * 更新项目
 */
async function updateProject(params: Record<string, unknown>): Promise<CommandResult> {
  const { project_id, updates } = params;

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

  // 读取现有 meta
  const metaContent = await readFile(`${projectPath}/meta.yml`);
  if (!metaContent) {
    return {
      success: false,
      error: {
        code: 'META_NOT_FOUND',
        message: '项目元数据不存在',
      },
    };
  }

  const meta = yaml.parse(metaContent);
  const updatedFields: string[] = [];

  // 应用更新
  const updateData = updates as Record<string, unknown>;
  for (const [key, value] of Object.entries(updateData)) {
    if (value !== undefined && meta[key] !== value) {
      meta[key] = value;
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

  // 写回 meta.yml
  await writeFile(`${projectPath}/meta.yml`, yaml.stringify(meta));

  return {
    success: true,
    result: {
      updated_fields: updatedFields,
    },
  };
}

/**
 * 获取项目列表
 */
async function listProjects(params: Record<string, unknown>): Promise<CommandResult> {
  const { year, status, manager } = params;

  const projects: Array<Record<string, unknown>> = [];
  const yearsToScan = year ? [year] : await getAvailableYears();

  for (const y of yearsToScan) {
    const yearPath = `projects/${y}`;
    const items = await listDir(yearPath);

    for (const item of items) {
      if (item.type !== 'directory') continue;

      const metaPath = `${item.path}/meta.yml`;
      const metaContent = await readFile(metaPath);
      if (!metaContent) continue;

      const meta = yaml.parse(metaContent);

      // 应用筛选
      if (status && meta.status !== status) continue;
      if (manager && meta.manager !== manager) continue;

      projects.push({
        id: meta.id,
        name: meta.name,
        client: meta.client,
        status: meta.status,
        type: meta.type,
        deadline: meta.deadline,
        manager: meta.manager,
        path: item.path,
      });
    }
  }

  return {
    success: true,
    result: {
      projects,
      total: projects.length,
    },
  };
}

/**
 * 获取项目详情
 */
async function getProject(params: Record<string, unknown>): Promise<CommandResult> {
  const { project_id } = params;

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

  const metaContent = await readFile(`${projectPath}/meta.yml`);
  if (!metaContent) {
    return {
      success: false,
      error: {
        code: 'META_NOT_FOUND',
        message: '项目元数据不存在',
      },
    };
  }

  const meta = yaml.parse(metaContent);

  // 统计任务数量
  const taskItems = await listDir(`${projectPath}/10_任务`);
  const taskCount = taskItems.filter((i) => i.type === 'file' && i.name.endsWith('.md')).length;

  return {
    success: true,
    result: {
      project: {
        ...meta,
        path: projectPath,
        task_count: taskCount,
      },
    },
  };
}

// ============ 辅助函数 ============

async function getNextProjectSeq(year: number): Promise<number> {
  const yearPath = `projects/${year}`;
  const items = await listDir(yearPath);

  let maxSeq = 0;
  for (const item of items) {
    if (item.type !== 'directory') continue;
    const match = item.name.match(/^P-\d{4}-(\d{4})/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  return maxSeq + 1;
}

async function findProjectPath(projectId: string): Promise<string | null> {
  // 从 projectId 提取年份
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

async function getAvailableYears(): Promise<number[]> {
  const items = await listDir('projects');
  return items
    .filter((i) => i.type === 'directory' && /^\d{4}$/.test(i.name))
    .map((i) => parseInt(i.name, 10))
    .sort((a, b) => b - a);
}

