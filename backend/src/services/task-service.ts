import matter from 'gray-matter';
import { readFile, listDir } from '../git/file-operations.js';

export interface Task {
  id: string;
  title: string;
  assignee: string;
  status: string;
  priority: string;
  deadline?: string;
  created: string;
  updated: string;
  description?: string;
  projectId: string;
  path: string;
}

export interface TaskFilter {
  projectId?: string;
  status?: string;
  assignee?: string;
}

/**
 * 获取任务列表
 */
export async function getTasks(filter: TaskFilter = {}): Promise<Task[]> {
  const tasks: Task[] = [];

  if (filter.projectId) {
    // 获取指定项目的任务
    const projectPath = await findProjectPath(filter.projectId);
    if (!projectPath) return [];

    const taskDir = `${projectPath}/10_任务`;
    const files = await listDir(taskDir);

    for (const file of files) {
      if (file.type !== 'file' || !file.name.endsWith('.md')) continue;

      const content = await readFile(file.path);
      if (!content) continue;

      try {
        const { data, content: body } = matter(content);

        // 应用筛选
        if (filter.status && data.status !== filter.status) continue;
        if (filter.assignee && data.assignee !== filter.assignee) continue;

        tasks.push({
          ...data,
          description: body.trim(),
          projectId: filter.projectId,
          path: file.path,
        } as Task);
      } catch {
        console.error(`[TaskService] 解析 ${file.path} 失败`);
      }
    }
  } else {
    // 获取所有任务（遍历所有项目）
    const years = await listDir('projects');

    for (const yearItem of years) {
      if (yearItem.type !== 'directory') continue;

      const projects = await listDir(yearItem.path);
      for (const projectItem of projects) {
        if (projectItem.type !== 'directory') continue;

        // 提取项目 ID
        const projectMatch = projectItem.name.match(/^(P-\d{4}-\d{4})/);
        const projectId = projectMatch ? projectMatch[1] : '';

        const taskDir = `${projectItem.path}/10_任务`;
        const files = await listDir(taskDir);

        for (const file of files) {
          if (file.type !== 'file' || !file.name.endsWith('.md')) continue;

          const content = await readFile(file.path);
          if (!content) continue;

          try {
            const { data, content: body } = matter(content);

            // 应用筛选
            if (filter.status && data.status !== filter.status) continue;
            if (filter.assignee && data.assignee !== filter.assignee) continue;

            tasks.push({
              ...data,
              description: body.trim(),
              projectId,
              path: file.path,
            } as Task);
          } catch {
            // 跳过解析失败的文件
          }
        }
      }
    }
  }

  // 按更新时间倒序
  tasks.sort((a, b) => b.updated.localeCompare(a.updated));

  return tasks;
}

/**
 * 获取单个任务
 */
export async function getTask(taskId: string): Promise<Task | null> {
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
        try {
          const { data, content: body } = matter(content);

          // 提取项目 ID
          const projectMatch = projectItem.name.match(/^(P-\d{4}-\d{4})/);
          const projectId = projectMatch ? projectMatch[1] : '';

          return {
            ...data,
            description: body.trim(),
            projectId,
            path: taskPath,
          } as Task;
        } catch {
          return null;
        }
      }
    }
  }

  return null;
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

