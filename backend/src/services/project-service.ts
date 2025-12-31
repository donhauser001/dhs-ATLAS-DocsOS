import yaml from 'yaml';
import { readFile, listDir } from '../git/file-operations.js';

export interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
  type: string;
  created: string;
  deadline?: string;
  budget?: number;
  manager: string;
  team: string[];
  tags: string[];
  path: string;
}

export interface ProjectFilter {
  year?: number;
  status?: string;
  manager?: string;
}

/**
 * 获取项目列表
 */
export async function getProjects(filter: ProjectFilter = {}): Promise<Project[]> {
  const projects: Project[] = [];
  const yearsToScan = filter.year ? [filter.year] : await getAvailableYears();

  for (const year of yearsToScan) {
    const yearPath = `projects/${year}`;
    const items = await listDir(yearPath);

    for (const item of items) {
      if (item.type !== 'directory') continue;

      const metaPath = `${item.path}/meta.yml`;
      const metaContent = await readFile(metaPath);
      if (!metaContent) continue;

      try {
        const meta = yaml.parse(metaContent);

        // 应用筛选
        if (filter.status && meta.status !== filter.status) continue;
        if (filter.manager && meta.manager !== filter.manager) continue;

        projects.push({
          ...meta,
          path: item.path,
        });
      } catch {
        console.error(`[ProjectService] 解析 ${metaPath} 失败`);
      }
    }
  }

  // 按创建时间倒序
  projects.sort((a, b) => b.created.localeCompare(a.created));

  return projects;
}

/**
 * 获取单个项目
 */
export async function getProject(projectId: string): Promise<Project | null> {
  const projectPath = await findProjectPath(projectId);
  if (!projectPath) return null;

  const metaContent = await readFile(`${projectPath}/meta.yml`);
  if (!metaContent) return null;

  try {
    const meta = yaml.parse(metaContent);
    return {
      ...meta,
      path: projectPath,
    };
  } catch {
    return null;
  }
}

// ============ 辅助函数 ============

async function getAvailableYears(): Promise<number[]> {
  const items = await listDir('projects');
  return items
    .filter((i) => i.type === 'directory' && /^\d{4}$/.test(i.name))
    .map((i) => parseInt(i.name, 10))
    .sort((a, b) => b - a);
}

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

