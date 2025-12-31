import yaml from 'yaml';
import { writeFile, readFile } from '../../git/file-operations.js';
import type { Operator, CommandResult } from '../command-engine.js';

// 附加配置文件路径
const CONFIGS_FILE_PATH = 'workspace/服务定价/附加配置.md';

// ============ 类型定义 ============

interface ServiceConfig {
  id: string;
  name: string;
  draft_count: number;
  max_count: number;
  lead_ratio: number;
  assistant_ratio: number;
  content?: string;
}

interface ConfigsCatalog {
  metadata: {
    version: string;
    updated: string;
    author?: string;
    description?: string;
  };
  configs: ServiceConfig[];
}

// ============ 文件解析 ============

/**
 * 解析附加配置文件
 */
async function parseConfigsCatalog(): Promise<ConfigsCatalog> {
  const content = await readFile(CONFIGS_FILE_PATH);
  if (!content) {
    return {
      metadata: { version: '1.0', updated: new Date().toISOString().split('T')[0] },
      configs: [],
    };
  }

  // 解析 frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const metadata = frontmatterMatch ? yaml.parse(frontmatterMatch[1]) : {};

  // 解析配置块
  const configs: ServiceConfig[] = [];
  const configRegex = /### ([^\n{]+)\s*\{#(cfg-[^}]+)\}\s*\n\n```yaml\n([\s\S]*?)```\n\n([\s\S]*?)(?=\n---\n|\n## |\n### [^\n]+\{#cfg-|$)/g;
  let configMatch;
  while ((configMatch = configRegex.exec(content)) !== null) {
    const configData = yaml.parse(configMatch[3]);
    configs.push({
      id: configData.id || configMatch[2],
      name: configData.name || configMatch[1].trim(),
      draft_count: configData.draft_count || 1,
      max_count: configData.max_count || 1,
      lead_ratio: configData.lead_ratio || 0.7,
      assistant_ratio: configData.assistant_ratio || 0.3,
      content: configMatch[4].trim() || undefined,
    });
  }

  return {
    metadata: {
      version: metadata.version || '1.0',
      updated: metadata.updated || new Date().toISOString().split('T')[0],
      author: metadata.author,
      description: metadata.description,
    },
    configs,
  };
}

/**
 * 生成附加配置文件内容
 */
function generateConfigsCatalogContent(catalog: ConfigsCatalog): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push('# ============================================================');
  lines.push('# 附加配置 - 服务交付与绩效配置');
  lines.push('# ============================================================');
  lines.push(`version: "${catalog.metadata.version}"`);
  lines.push(`updated: ${catalog.metadata.updated}`);
  if (catalog.metadata.author) {
    lines.push(`author: ${catalog.metadata.author}`);
  }
  lines.push('');
  lines.push('# 说明');
  lines.push('description: |');
  lines.push('  本文档定义服务的交付配置模板，包括方案数量和绩效分配规则。');
  lines.push('  服务条目通过 config 字段引用配置ID。');
  lines.push('---');
  lines.push('');
  lines.push('# 附加配置');
  lines.push('');
  lines.push('> 本文档为内部管理文档，定义服务交付标准和绩效分配规则。');
  lines.push('');
  lines.push('---');
  lines.push('');

  // 配置列表
  lines.push('## 配置列表');
  lines.push('');
  for (const cfg of catalog.configs) {
    lines.push(`### ${cfg.name} {#${cfg.id}}`);
    lines.push('');
    lines.push('```yaml');
    lines.push(`id: ${cfg.id}`);
    lines.push(`name: ${cfg.name}`);
    lines.push(`draft_count: ${cfg.draft_count}`);
    lines.push(`max_count: ${cfg.max_count}`);
    lines.push(`lead_ratio: ${cfg.lead_ratio}`);
    lines.push(`assistant_ratio: ${cfg.assistant_ratio}`);
    lines.push('```');
    lines.push('');
    if (cfg.content) {
      lines.push(cfg.content);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }

  // 更新记录
  lines.push('## 更新记录');
  lines.push('');
  lines.push('| 日期 | 版本 | 说明 |');
  lines.push('|------|------|------|');
  lines.push(`| ${catalog.metadata.updated} | ${catalog.metadata.version} | 自动更新 |`);

  return lines.join('\n');
}

// ============ 命令处理 ============

/**
 * 执行配置相关 Command
 */
export async function executeConfigCommand(
  commandName: string,
  params: Record<string, unknown>,
  _operator: Operator
): Promise<CommandResult> {
  switch (commandName) {
    case 'config.list':
      return await listConfigs();
    case 'config.get':
      return await getConfig(params);
    case 'config.create':
      return await createConfig(params);
    case 'config.update':
      return await updateConfig(params);
    case 'config.delete':
      return await deleteConfig(params);
    default:
      return {
        success: false,
        error: {
          code: 'UNKNOWN_COMMAND',
          message: `未知的配置命令: ${commandName}`,
        },
      };
  }
}

/**
 * 获取配置列表
 */
async function listConfigs(): Promise<CommandResult> {
  const catalog = await parseConfigsCatalog();

  return {
    success: true,
    result: {
      configs: catalog.configs,
      total: catalog.configs.length,
    },
  };
}

/**
 * 获取配置详情
 */
async function getConfig(params: Record<string, unknown>): Promise<CommandResult> {
  const { id } = params;
  
  const catalog = await parseConfigsCatalog();
  const config = catalog.configs.find(c => c.id === id);
  
  if (!config) {
    return {
      success: false,
      error: {
        code: 'CONFIG_NOT_FOUND',
        message: `配置 "${id}" 不存在`,
      },
    };
  }

  return {
    success: true,
    result: {
      config,
    },
  };
}

/**
 * 创建配置
 */
async function createConfig(params: Record<string, unknown>): Promise<CommandResult> {
  const { id, name, draft_count, max_count, lead_ratio, assistant_ratio, content } = params;
  
  const catalog = await parseConfigsCatalog();
  
  // 检查是否已存在
  if (catalog.configs.some(c => c.id === id)) {
    return {
      success: false,
      error: {
        code: 'CONFIG_EXISTS',
        message: `配置 "${id}" 已存在`,
      },
    };
  }

  // 验证绩效比例
  const leadRatio = lead_ratio as number;
  const assistantRatio = assistant_ratio as number;
  if (leadRatio < 0 || leadRatio > 1 || assistantRatio < 0 || assistantRatio > 1) {
    return {
      success: false,
      error: {
        code: 'INVALID_RATIO',
        message: '绩效比例必须在 0-1 之间',
      },
    };
  }

  catalog.configs.push({
    id: id as string,
    name: name as string,
    draft_count: draft_count as number,
    max_count: max_count as number,
    lead_ratio: leadRatio,
    assistant_ratio: assistantRatio,
    content: content as string | undefined,
  });

  catalog.metadata.updated = new Date().toISOString().split('T')[0];
  await writeFile(CONFIGS_FILE_PATH, generateConfigsCatalogContent(catalog));

  return {
    success: true,
    result: {
      id,
    },
  };
}

/**
 * 更新配置
 */
async function updateConfig(params: Record<string, unknown>): Promise<CommandResult> {
  const { id, updates } = params;
  
  const catalog = await parseConfigsCatalog();
  const configIndex = catalog.configs.findIndex(c => c.id === id);
  
  if (configIndex === -1) {
    return {
      success: false,
      error: {
        code: 'CONFIG_NOT_FOUND',
        message: `配置 "${id}" 不存在`,
      },
    };
  }

  const updateData = updates as Record<string, unknown>;
  const config = catalog.configs[configIndex];
  
  if (updateData.name !== undefined) config.name = updateData.name as string;
  if (updateData.draft_count !== undefined) config.draft_count = updateData.draft_count as number;
  if (updateData.max_count !== undefined) config.max_count = updateData.max_count as number;
  if (updateData.lead_ratio !== undefined) {
    const ratio = updateData.lead_ratio as number;
    if (ratio < 0 || ratio > 1) {
      return {
        success: false,
        error: {
          code: 'INVALID_RATIO',
          message: '绩效比例必须在 0-1 之间',
        },
      };
    }
    config.lead_ratio = ratio;
  }
  if (updateData.assistant_ratio !== undefined) {
    const ratio = updateData.assistant_ratio as number;
    if (ratio < 0 || ratio > 1) {
      return {
        success: false,
        error: {
          code: 'INVALID_RATIO',
          message: '绩效比例必须在 0-1 之间',
        },
      };
    }
    config.assistant_ratio = ratio;
  }
  if (updateData.content !== undefined) config.content = updateData.content as string;

  catalog.metadata.updated = new Date().toISOString().split('T')[0];
  await writeFile(CONFIGS_FILE_PATH, generateConfigsCatalogContent(catalog));

  return {
    success: true,
    result: {
      updated: true,
    },
  };
}

/**
 * 删除配置
 */
async function deleteConfig(params: Record<string, unknown>): Promise<CommandResult> {
  const { id } = params;
  
  const catalog = await parseConfigsCatalog();
  const configIndex = catalog.configs.findIndex(c => c.id === id);
  
  if (configIndex === -1) {
    return {
      success: false,
      error: {
        code: 'CONFIG_NOT_FOUND',
        message: `配置 "${id}" 不存在`,
      },
    };
  }

  // TODO: 检查是否有服务引用此配置
  // 这需要读取 services.md 并检查每个服务的 config 字段

  catalog.configs.splice(configIndex, 1);
  catalog.metadata.updated = new Date().toISOString().split('T')[0];
  await writeFile(CONFIGS_FILE_PATH, generateConfigsCatalogContent(catalog));

  return {
    success: true,
    result: {
      deleted: id,
    },
  };
}

