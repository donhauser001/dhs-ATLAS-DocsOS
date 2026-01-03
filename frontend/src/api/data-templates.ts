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

/** 模板中的组件定义（简化版，只包含必要信息） */
export interface TemplateComponent {
    id: string;
    type: string;
    label: string;
    options?: Array<{ value: string; color?: string; icon?: string }>;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    includeTime?: boolean;
    rows?: number;
}

/** 模板中的状态选项 */
export interface TemplateStatusOption {
    value: string;
    color?: string;
}

/** 模板中的编号配置 */
export interface TemplateIdConfig {
    prefix: string;
    separator: string;
    digits: number;
    startFrom: number;
    frozen: boolean;
}

export interface DataTemplate {
    id: string;
    name: string;
    description?: string;
    dataType: string;
    fields: TemplateField[];
    /** 字段-组件绑定 */
    bindings?: Record<string, string>;
    /** 关联的组件定义 */
    components?: Record<string, TemplateComponent>;
    /** 状态选项配置 */
    statusOptions?: TemplateStatusOption[];
    /** 编号配置 */
    idConfig?: TemplateIdConfig;
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
 * 从模板生成数据块的结果
 */
export interface GenerateFromTemplateResult {
    /** 生成的 YAML 内容 */
    yaml: string;
    /** 需要注入到文档的组件定义 */
    components?: Record<string, TemplateComponent>;
}

/**
 * 从模板生成 YAML 内容（旧版，仅返回 YAML）
 * @deprecated 使用 generateFromTemplate 代替
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

/**
 * 从模板生成数据块（新版，返回 YAML 和组件）
 */
export async function generateFromTemplate(templateId: string): Promise<GenerateFromTemplateResult> {
    const res = await fetch(`${API_BASE}/template/${encodeURIComponent(templateId)}/generate`, {
        credentials: 'include',
    });
    if (!res.ok) {
        throw new Error(`Failed to generate from template: ${res.statusText}`);
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
 * 从数据创建模板的参数
 */
export interface CreateTemplateFromDataParams {
    categoryId: string;
    templateId: string;
    name: string;
    description: string;
    dataType: string;
    fieldKeys: string[];
    /** 字段-组件绑定 */
    bindings?: Record<string, string>;
    /** 关联的组件定义 */
    components?: Record<string, TemplateComponent>;
    /** 状态选项配置 */
    statusOptions?: TemplateStatusOption[];
    /** 编号配置 */
    idConfig?: TemplateIdConfig;
}

/**
 * 从数据创建模板
 */
export async function createTemplateFromData(params: CreateTemplateFromDataParams): Promise<DataTemplate> {
    const res = await fetch(`${API_BASE}/from-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params),
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

