/**
 * Data Templates API 客户端 - 数据模板管理
 */

const API_BASE = '/api/data-templates';

// ============================================================
// 类型定义
// ============================================================

export interface TemplateField {
  key: string;
  defaultValue?: string | number | boolean;
  required?: boolean;
}

export interface DataTemplate {
  id: string;
  name: string;
  description?: string;
  dataType: string;
  fields: TemplateField[];
  createdAt: string;
  updatedAt: string;
  isSystem?: boolean;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  templates: DataTemplate[];
}

export interface DataTemplateConfig {
  version: string;
  updatedAt: string;
  categories: TemplateCategory[];
}

// ============================================================
// 查询 API
// ============================================================

/**
 * 获取完整模板配置
 */
export async function fetchTemplateConfig(): Promise<DataTemplateConfig> {
  const res = await fetch(API_BASE, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch template config: ${res.statusText}`);
  }
  const data = await res.json();
  return data.data;
}

/**
 * 获取所有模板（扁平列表）
 */
export async function fetchAllTemplates(): Promise<DataTemplate[]> {
  const res = await fetch(`${API_BASE}/all`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch templates: ${res.statusText}`);
  }
  const data = await res.json();
  return data.data;
}

/**
 * 获取单个模板
 */
export async function fetchTemplate(id: string): Promise<DataTemplate> {
  const res = await fetch(`${API_BASE}/template/${encodeURIComponent(id)}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch template: ${res.statusText}`);
  }
  const data = await res.json();
  return data.data;
}

/**
 * 从模板生成 YAML 内容
 */
export async function generateYamlFromTemplate(templateId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/template/${encodeURIComponent(templateId)}/yaml`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to generate YAML: ${res.statusText}`);
  }
  const data = await res.json();
  return data.data;
}

// ============================================================
// 分类管理 API
// ============================================================

/**
 * 添加分类
 */
export async function addCategory(id: string, name: string, description?: string): Promise<TemplateCategory> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ id, name, description }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add category');
  }
  const data = await res.json();
  return data.data;
}

/**
 * 更新分类
 */
export async function updateCategory(id: string, name?: string, description?: string): Promise<TemplateCategory> {
  const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update category');
  }
  const data = await res.json();
  return data.data;
}

/**
 * 删除分类
 */
export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete category');
  }
}

// ============================================================
// 模板管理 API
// ============================================================

/**
 * 添加模板
 */
export async function addTemplate(
  categoryId: string,
  template: Omit<DataTemplate, 'createdAt' | 'updatedAt'>
): Promise<DataTemplate> {
  const res = await fetch(`${API_BASE}/templates/${encodeURIComponent(categoryId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(template),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add template');
  }
  const data = await res.json();
  return data.data;
}

/**
 * 从数据创建模板
 */
export async function createTemplateFromData(
  categoryId: string,
  templateId: string,
  name: string,
  description: string,
  dataType: string,
  fieldKeys: string[]
): Promise<DataTemplate> {
  const res = await fetch(`${API_BASE}/from-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ categoryId, templateId, name, description, dataType, fieldKeys }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create template from data');
  }
  const data = await res.json();
  return data.data;
}

/**
 * 更新模板
 */
export async function updateTemplate(
  id: string,
  updates: Partial<Omit<DataTemplate, 'id' | 'createdAt' | 'isSystem'>>
): Promise<DataTemplate> {
  const res = await fetch(`${API_BASE}/templates/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update template');
  }
  const data = await res.json();
  return data.data;
}

/**
 * 删除模板
 */
export async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/templates/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete template');
  }
}

