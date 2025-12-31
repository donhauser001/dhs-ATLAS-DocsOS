import yaml from 'yaml';
import { writeFile, readFile } from '../../git/file-operations.js';
import type { Operator, CommandResult } from '../command-engine.js';

// 服务清单文件路径
const SERVICES_FILE_PATH = 'workspace/服务定价/服务清单.md';

// ============ 类型定义 ============

interface ServicePrice {
  type: 'fixed' | 'tiered';
  amount?: number;
  base_amount?: number;
  unit: string;
  note?: string;
  tiers?: Array<{
    min: number;
    max: number | null;
    discount: number;
  }>;
  extras?: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
}

interface ServiceCategory {
  id: string;
  name: string;
  color: string;
  icon_key: string;
  description?: string;
}

interface Service {
  id: string;
  name: string;
  alias: string;
  slug: string;  // 英文URL标识符
  category: string;
  config?: string;  // 引用附加配置ID
  price: ServicePrice;
  status: 'active' | 'inactive';
  created: string;
  updated: string;
  content?: string;
}

interface ServicesCatalog {
  metadata: {
    version: string;
    currency: string;
    updated: string;
    author?: string;
    pricing_rules?: string[];
  };
  categories: ServiceCategory[];
  services: Service[];
}

// ============ 文件解析 ============

/**
 * 解析服务清单文件
 */
async function parseServicesCatalog(): Promise<ServicesCatalog> {
  const content = await readFile(SERVICES_FILE_PATH);
  if (!content) {
    return {
      metadata: { version: '1.0', currency: 'CNY', updated: new Date().toISOString().split('T')[0] },
      categories: [],
      services: [],
    };
  }

  // 解析 frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const metadata = frontmatterMatch ? yaml.parse(frontmatterMatch[1]) : {};

  // 解析分类块
  const categories: ServiceCategory[] = [];
  const categoryRegex = /### ([^\n{]+)\s*\{#cat-([^}]+)\}\s*\n\n```yaml\n([\s\S]*?)```\n\n([^\n#]*)/g;
  let categoryMatch;
  while ((categoryMatch = categoryRegex.exec(content)) !== null) {
    const categoryData = yaml.parse(categoryMatch[3]);
    categories.push({
      id: categoryData.id || categoryMatch[2],
      name: categoryData.name || categoryMatch[1].trim(),
      color: categoryData.color || '#6B7280',
      icon_key: categoryData.icon_key || 'folder',
      description: categoryMatch[4].trim() || undefined,
    });
  }

  // 解析服务块
  const services: Service[] = [];
  const serviceRegex = /### ([^\n{]+)\s*\{#svc-([^}]+)\}\s*\n\n```yaml\n([\s\S]*?)```\n\n([\s\S]*?)(?=\n---\n|\n## |\n### [^\n]+\{#svc-|$)/g;
  let serviceMatch;
  while ((serviceMatch = serviceRegex.exec(content)) !== null) {
    const serviceData = yaml.parse(serviceMatch[3]);
    services.push({
      id: serviceData.id || serviceMatch[2],
      name: serviceData.name || serviceMatch[1].trim(),
      alias: serviceData.alias || serviceMatch[2].toLowerCase(),
      slug: serviceData.slug || serviceData.alias?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || serviceMatch[2].toLowerCase(),
      category: serviceData.category,
      config: serviceData.config || undefined,
      price: serviceData.price,
      status: serviceData.status || 'active',
      created: serviceData.created || new Date().toISOString().split('T')[0],
      updated: serviceData.updated || new Date().toISOString().split('T')[0],
      content: serviceMatch[4].trim() || undefined,
    });
  }

  return {
    metadata: {
      version: metadata.version || '1.0',
      currency: metadata.currency || 'CNY',
      updated: metadata.updated || new Date().toISOString().split('T')[0],
      author: metadata.author,
      pricing_rules: metadata.pricing_rules,
    },
    categories,
    services,
  };
}

/**
 * 生成服务清单文件内容
 */
function generateServicesCatalogContent(catalog: ServicesCatalog): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push('# ============================================================');
  lines.push('# 服务清单 - 全局配置');
  lines.push('# ============================================================');
  lines.push(`version: "${catalog.metadata.version}"`);
  lines.push(`currency: ${catalog.metadata.currency}`);
  lines.push(`updated: ${catalog.metadata.updated}`);
  if (catalog.metadata.author) {
    lines.push(`author: ${catalog.metadata.author}`);
  }
  if (catalog.metadata.pricing_rules?.length) {
    lines.push('');
    lines.push('# 计价规则');
    lines.push('pricing_rules:');
    for (const rule of catalog.metadata.pricing_rules) {
      lines.push(`  - ${rule}`);
    }
  }
  lines.push('---');
  lines.push('');
  lines.push('# 服务清单');
  lines.push('');
  lines.push('> 本文档定义了所有可提供的服务项目，供报价和项目管理使用。');
  lines.push('');
  lines.push('---');
  lines.push('');

  // 分类定义
  lines.push('## 分类定义');
  lines.push('');
  for (const cat of catalog.categories) {
    lines.push(`### ${cat.name} {#cat-${cat.id}}`);
    lines.push('');
    lines.push('```yaml');
    lines.push(`id: ${cat.id}`);
    lines.push(`name: ${cat.name}`);
    lines.push(`color: "${cat.color}"`);
    lines.push(`icon_key: ${cat.icon_key}`);
    lines.push('```');
    lines.push('');
    if (cat.description) {
      lines.push(cat.description);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }

  // 服务条目
  lines.push('## 服务条目');
  lines.push('');
  for (const svc of catalog.services) {
    lines.push(`### ${svc.name} {#svc-${svc.id}}`);
    lines.push('');
    lines.push('```yaml');
    lines.push(`id: ${svc.id}`);
    lines.push(`name: ${svc.name}`);
    lines.push(`alias: ${svc.alias}`);
    lines.push(`slug: ${svc.slug}`);
    lines.push(`category: ${svc.category}`);
    if (svc.config) {
      lines.push(`config: ${svc.config}`);
    }
    lines.push('price:');
    lines.push(`  type: ${svc.price.type}`);
    if (svc.price.type === 'fixed') {
      lines.push(`  amount: ${svc.price.amount}`);
    } else if (svc.price.type === 'tiered') {
      lines.push(`  base_amount: ${svc.price.base_amount}`);
    }
    lines.push(`  unit: ${svc.price.unit}`);
    if (svc.price.note) {
      lines.push(`  note: ${svc.price.note}`);
    }
    if (svc.price.tiers?.length) {
      lines.push('  tiers:');
      for (const tier of svc.price.tiers) {
        lines.push(`    - min: ${tier.min}`);
        lines.push(`      max: ${tier.max === null ? 'null' : tier.max}`);
        lines.push(`      discount: ${tier.discount}`);
      }
    }
    if (svc.price.extras?.length) {
      lines.push('  extras:');
      for (const extra of svc.price.extras) {
        lines.push(`    - name: ${extra.name}`);
        lines.push(`      amount: ${extra.amount}`);
        lines.push(`      unit: ${extra.unit}`);
      }
    }
    lines.push(`status: ${svc.status}`);
    lines.push(`created: ${svc.created}`);
    lines.push(`updated: ${svc.updated}`);
    lines.push('```');
    lines.push('');
    if (svc.content) {
      lines.push(svc.content);
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
 * 执行服务相关 Command
 */
export async function executeServiceCommand(
  commandName: string,
  params: Record<string, unknown>,
  _operator: Operator
): Promise<CommandResult> {
  switch (commandName) {
    case 'service.catalog.get':
      return await getCatalog();
    case 'service.category.list':
      return await listCategories();
    case 'service.category.create':
      return await createCategory(params);
    case 'service.category.update':
      return await updateCategory(params);
    case 'service.category.delete':
      return await deleteCategory(params);
    case 'service.list':
      return await listServices(params);
    case 'service.get':
      return await getService(params);
    case 'service.create':
      return await createService(params);
    case 'service.update':
      return await updateService(params);
    case 'service.delete':
      return await deleteService(params);
    default:
      return {
        success: false,
        error: {
          code: 'UNKNOWN_COMMAND',
          message: `未知的服务命令: ${commandName}`,
        },
      };
  }
}

/**
 * 获取完整服务清单（供 AI 使用）
 */
async function getCatalog(): Promise<CommandResult> {
  const catalog = await parseServicesCatalog();
  return {
    success: true,
    result: {
      catalog,
    },
  };
}

/**
 * 获取服务分类列表
 */
async function listCategories(): Promise<CommandResult> {
  const catalog = await parseServicesCatalog();
  
  // 计算每个分类的服务数量
  const categoriesWithCount = catalog.categories.map(cat => ({
    ...cat,
    service_count: catalog.services.filter(s => s.category === cat.id).length,
  }));

  return {
    success: true,
    result: {
      categories: categoriesWithCount,
      total: categoriesWithCount.length,
    },
  };
}

/**
 * 创建服务分类
 */
async function createCategory(params: Record<string, unknown>): Promise<CommandResult> {
  const { id, name, color, icon_key, description } = params;
  
  const catalog = await parseServicesCatalog();
  
  // 检查是否已存在
  if (catalog.categories.some(c => c.id === id)) {
    return {
      success: false,
      error: {
        code: 'CATEGORY_EXISTS',
        message: `分类 "${id}" 已存在`,
      },
    };
  }

  catalog.categories.push({
    id: id as string,
    name: name as string,
    color: (color as string) || '#6B7280',
    icon_key: (icon_key as string) || 'folder',
    description: description as string | undefined,
  });

  catalog.metadata.updated = new Date().toISOString().split('T')[0];
  await writeFile(SERVICES_FILE_PATH, generateServicesCatalogContent(catalog));

  return {
    success: true,
    result: {
      id,
    },
  };
}

/**
 * 更新服务分类
 */
async function updateCategory(params: Record<string, unknown>): Promise<CommandResult> {
  const { id, updates } = params;
  
  const catalog = await parseServicesCatalog();
  const categoryIndex = catalog.categories.findIndex(c => c.id === id);
  
  if (categoryIndex === -1) {
    return {
      success: false,
      error: {
        code: 'CATEGORY_NOT_FOUND',
        message: `分类 "${id}" 不存在`,
      },
    };
  }

  const updateData = updates as Record<string, unknown>;
  const category = catalog.categories[categoryIndex];
  
  if (updateData.name !== undefined) category.name = updateData.name as string;
  if (updateData.color !== undefined) category.color = updateData.color as string;
  if (updateData.icon_key !== undefined) category.icon_key = updateData.icon_key as string;
  if (updateData.description !== undefined) category.description = updateData.description as string;

  catalog.metadata.updated = new Date().toISOString().split('T')[0];
  await writeFile(SERVICES_FILE_PATH, generateServicesCatalogContent(catalog));

  return {
    success: true,
    result: {
      updated: true,
    },
  };
}

/**
 * 删除服务分类
 */
async function deleteCategory(params: Record<string, unknown>): Promise<CommandResult> {
  const { id } = params;
  
  const catalog = await parseServicesCatalog();
  const categoryIndex = catalog.categories.findIndex(c => c.id === id);
  
  if (categoryIndex === -1) {
    return {
      success: false,
      error: {
        code: 'CATEGORY_NOT_FOUND',
        message: `分类 "${id}" 不存在`,
      },
    };
  }

  // 检查是否有服务使用此分类
  const hasServices = catalog.services.some(s => s.category === id);
  if (hasServices) {
    return {
      success: false,
      error: {
        code: 'CATEGORY_NOT_EMPTY',
        message: `分类 "${id}" 下还有服务，无法删除`,
      },
    };
  }

  catalog.categories.splice(categoryIndex, 1);
  catalog.metadata.updated = new Date().toISOString().split('T')[0];
  await writeFile(SERVICES_FILE_PATH, generateServicesCatalogContent(catalog));

  return {
    success: true,
    result: {
      deleted: id,
    },
  };
}

/**
 * 获取服务列表
 */
async function listServices(params: Record<string, unknown>): Promise<CommandResult> {
  const { category, status } = params;
  
  const catalog = await parseServicesCatalog();
  let services = catalog.services;

  // 筛选
  if (category) {
    services = services.filter(s => s.category === category);
  }
  if (status) {
    services = services.filter(s => s.status === status);
  }

  // 添加分类名称
  const servicesWithCategoryName = services.map(s => {
    const cat = catalog.categories.find(c => c.id === s.category);
    return {
      ...s,
      category_name: cat?.name || s.category,
      category_color: cat?.color || '#6B7280',
    };
  });

  return {
    success: true,
    result: {
      services: servicesWithCategoryName,
      total: servicesWithCategoryName.length,
    },
  };
}

/**
 * 获取服务详情
 */
async function getService(params: Record<string, unknown>): Promise<CommandResult> {
  const { id } = params;
  
  const catalog = await parseServicesCatalog();
  const service = catalog.services.find(s => s.id === id || s.alias === id || s.slug === id);
  
  if (!service) {
    return {
      success: false,
      error: {
        code: 'SERVICE_NOT_FOUND',
        message: `服务 "${id}" 不存在`,
      },
    };
  }

  const category = catalog.categories.find(c => c.id === service.category);

  return {
    success: true,
    result: {
      service: {
        ...service,
        category_name: category?.name || service.category,
        category_color: category?.color || '#6B7280',
      },
    },
  };
}

/**
 * 创建服务
 */
async function createService(params: Record<string, unknown>): Promise<CommandResult> {
  const { name, alias, slug, category, config, price, content } = params;
  
  const catalog = await parseServicesCatalog();
  
  // 检查分类是否存在
  if (!catalog.categories.some(c => c.id === category)) {
    return {
      success: false,
      error: {
        code: 'CATEGORY_NOT_FOUND',
        message: `分类 "${category}" 不存在`,
      },
    };
  }

  // 生成 ID
  const maxId = catalog.services.reduce((max, s) => {
    const match = s.id.match(/^S-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, 0);
  const newId = `S-${String(maxId + 1).padStart(3, '0')}`;

  const now = new Date().toISOString().split('T')[0];
  const priceData = price as ServicePrice;

  const aliasValue = (alias as string) || (name as string);
  const slugValue = (slug as string) || aliasValue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  
  catalog.services.push({
    id: newId,
    name: name as string,
    alias: aliasValue,
    slug: slugValue,
    category: category as string,
    config: config as string | undefined,
    price: priceData,
    status: 'active',
    created: now,
    updated: now,
    content: content as string | undefined,
  });

  catalog.metadata.updated = now;
  await writeFile(SERVICES_FILE_PATH, generateServicesCatalogContent(catalog));

  return {
    success: true,
    result: {
      id: newId,
    },
  };
}

/**
 * 更新服务
 */
async function updateService(params: Record<string, unknown>): Promise<CommandResult> {
  const { id, updates } = params;
  
  const catalog = await parseServicesCatalog();
  const serviceIndex = catalog.services.findIndex(s => s.id === id || s.alias === id || s.slug === id);
  
  if (serviceIndex === -1) {
    return {
      success: false,
      error: {
        code: 'SERVICE_NOT_FOUND',
        message: `服务 "${id}" 不存在`,
      },
    };
  }

  const updateData = updates as Record<string, unknown>;
  const service = catalog.services[serviceIndex];
  
  if (updateData.name !== undefined) service.name = updateData.name as string;
  if (updateData.alias !== undefined) service.alias = updateData.alias as string;
  if (updateData.slug !== undefined) service.slug = updateData.slug as string;
  if (updateData.category !== undefined) {
    // 检查新分类是否存在
    if (!catalog.categories.some(c => c.id === updateData.category)) {
      return {
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: `分类 "${updateData.category}" 不存在`,
        },
      };
    }
    service.category = updateData.category as string;
  }
  if (updateData.config !== undefined) service.config = updateData.config as string | undefined;
  if (updateData.price !== undefined) service.price = updateData.price as ServicePrice;
  if (updateData.status !== undefined) service.status = updateData.status as 'active' | 'inactive';
  if (updateData.content !== undefined) service.content = updateData.content as string;

  service.updated = new Date().toISOString().split('T')[0];
  catalog.metadata.updated = service.updated;
  await writeFile(SERVICES_FILE_PATH, generateServicesCatalogContent(catalog));

  return {
    success: true,
    result: {
      updated: true,
    },
  };
}

/**
 * 删除服务
 */
async function deleteService(params: Record<string, unknown>): Promise<CommandResult> {
  const { id } = params;
  
  const catalog = await parseServicesCatalog();
  const serviceIndex = catalog.services.findIndex(s => s.id === id || s.alias === id || s.slug === id);
  
  if (serviceIndex === -1) {
    return {
      success: false,
      error: {
        code: 'SERVICE_NOT_FOUND',
        message: `服务 "${id}" 不存在`,
      },
    };
  }

  catalog.services.splice(serviceIndex, 1);
  catalog.metadata.updated = new Date().toISOString().split('T')[0];
  await writeFile(SERVICES_FILE_PATH, generateServicesCatalogContent(catalog));

  return {
    success: true,
    result: {
      deleted: id,
    },
  };
}
