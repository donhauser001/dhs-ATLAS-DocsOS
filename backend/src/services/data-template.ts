/**
 * DataTemplate - 数据模板服务
 * 
 * 管理数据块的模板，支持：
 * - 分类管理
 * - 模板的增删改查
 * - 从模板创建数据块
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { config } from '../config.js';

// ============================================================
// 类型定义
// ============================================================

/**
 * 数据模板字段
 */
export interface TemplateField {
    /** 字段 key */
    key: string;
    /** 默认值 */
    defaultValue?: string | number | boolean;
    /** 是否必填 */
    required?: boolean;
}

/**
 * 模板中的组件定义
 */
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

/**
 * 模板中的状态选项
 */
export interface TemplateStatusOption {
    value: string;
    color?: string;
}

/**
 * 模板中的编号配置
 */
export interface TemplateIdConfig {
    prefix: string;
    separator: string;
    digits: number;
    startFrom: number;
    frozen: boolean;
}

/**
 * 单个数据模板
 */
export interface DataTemplate {
    /** 模板 ID */
    id: string;
    /** 模板名称 */
    name: string;
    /** 模板描述 */
    description?: string;
    /** 数据类型（对应 type 字段的值） */
    dataType: string;
    /** 模板字段列表 */
    fields: TemplateField[];
    /** 字段-组件绑定 */
    bindings?: Record<string, string>;
    /** 关联的组件定义 */
    components?: Record<string, TemplateComponent>;
    /** 状态选项配置 */
    statusOptions?: TemplateStatusOption[];
    /** 编号配置 */
    idConfig?: TemplateIdConfig;
    /** 创建时间 */
    createdAt: string;
    /** 更新时间 */
    updatedAt: string;
    /** 是否系统模板 */
    isSystem?: boolean;
}

/**
 * 模板分类
 */
export interface TemplateCategory {
    /** 分类 ID */
    id: string;
    /** 分类名称 */
    name: string;
    /** 分类描述 */
    description?: string;
    /** 是否系统分类 */
    isSystem?: boolean;
    /** 模板列表 */
    templates: DataTemplate[];
}

/**
 * 完整的模板配置
 */
export interface DataTemplateConfig {
    /** 版本 */
    version: string;
    /** 最后更新时间 */
    updatedAt: string;
    /** 分类列表 */
    categories: TemplateCategory[];
}

// ============================================================
// 系统默认模板
// ============================================================

const SYSTEM_TEMPLATES: DataTemplateConfig = {
    version: '1.0',
    updatedAt: new Date().toISOString(),
    categories: [
        {
            id: 'business',
            name: '业务数据',
            description: '常用业务数据模板',
            isSystem: true,
            templates: [
                {
                    id: 'client',
                    name: '客户',
                    description: '客户信息数据模板',
                    dataType: 'client',
                    fields: [
                        { key: 'type', defaultValue: 'client', required: true },
                        { key: 'id', defaultValue: '', required: true },
                        { key: 'status', defaultValue: 'active', required: true },
                        { key: 'title', defaultValue: '', required: true },
                        { key: 'category', defaultValue: '' },
                        { key: 'rating', defaultValue: 0 },
                        { key: 'address', defaultValue: '' },
                        { key: 'contact', defaultValue: '' },
                        { key: 'contact_phone', defaultValue: '' },
                        { key: 'contact_email', defaultValue: '' },
                        { key: 'invoiceType', defaultValue: '' },
                        { key: 'createdAt', defaultValue: '', required: true },
                        { key: 'updatedAt', defaultValue: '', required: true },
                    ],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isSystem: true,
                },
                {
                    id: 'contact',
                    name: '联系人',
                    description: '联系人信息数据模板',
                    dataType: 'contact',
                    fields: [
                        { key: 'type', defaultValue: 'contact', required: true },
                        { key: 'id', defaultValue: '', required: true },
                        { key: 'status', defaultValue: 'active', required: true },
                        { key: 'title', defaultValue: '', required: true },
                        { key: 'company', defaultValue: '' },
                        { key: 'position', defaultValue: '' },
                        { key: 'phones', defaultValue: '' },
                        { key: 'emails', defaultValue: '' },
                        { key: 'address', defaultValue: '' },
                        { key: 'notes', defaultValue: '' },
                        { key: 'createdAt', defaultValue: '', required: true },
                        { key: 'updatedAt', defaultValue: '', required: true },
                    ],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isSystem: true,
                },
                {
                    id: 'project',
                    name: '项目',
                    description: '项目信息数据模板',
                    dataType: 'project',
                    fields: [
                        { key: 'type', defaultValue: 'project', required: true },
                        { key: 'id', defaultValue: '', required: true },
                        { key: 'status', defaultValue: 'draft', required: true },
                        { key: 'title', defaultValue: '', required: true },
                        { key: 'client', defaultValue: '' },
                        { key: 'contract_value', defaultValue: 0 },
                        { key: 'start_date', defaultValue: '' },
                        { key: 'end_date', defaultValue: '' },
                        { key: 'progress', defaultValue: 0 },
                        { key: 'notes', defaultValue: '' },
                        { key: 'createdAt', defaultValue: '', required: true },
                        { key: 'updatedAt', defaultValue: '', required: true },
                    ],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isSystem: true,
                },
            ],
        },
        {
            id: 'general',
            name: '通用模板',
            description: '通用数据模板',
            isSystem: true,
            templates: [
                {
                    id: 'basic',
                    name: '基础数据',
                    description: '最基础的数据模板，只包含必填字段',
                    dataType: 'data',
                    fields: [
                        { key: 'type', defaultValue: 'data', required: true },
                        { key: 'id', defaultValue: '', required: true },
                        { key: 'status', defaultValue: 'draft', required: true },
                        { key: 'title', defaultValue: '', required: true },
                        { key: 'createdAt', defaultValue: '', required: true },
                        { key: 'updatedAt', defaultValue: '', required: true },
                    ],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isSystem: true,
                },
            ],
        },
    ],
};

// ============================================================
// 配置文件路径
// ============================================================

const CONFIG_PATH = join(config.atlasDataDir, 'config', 'data-templates.json');

// ============================================================
// 服务实现
// ============================================================

/**
 * 确保配置目录存在
 */
function ensureConfigDir(): void {
    const dir = dirname(CONFIG_PATH);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}

/**
 * 获取模板配置
 */
export function getTemplateConfig(): DataTemplateConfig {
    ensureConfigDir();

    if (existsSync(CONFIG_PATH)) {
        try {
            const content = readFileSync(CONFIG_PATH, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.error('[DataTemplate] Failed to read config, using defaults:', error);
        }
    }

    // 首次使用，保存默认配置
    saveTemplateConfig(SYSTEM_TEMPLATES);
    return SYSTEM_TEMPLATES;
}

/**
 * 保存模板配置
 */
export function saveTemplateConfig(configData: DataTemplateConfig): void {
    ensureConfigDir();
    configData.updatedAt = new Date().toISOString();
    writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf-8');
}

/**
 * 获取所有分类
 */
export function getCategories(): TemplateCategory[] {
    return getTemplateConfig().categories;
}

/**
 * 添加分类
 */
export function addCategory(id: string, name: string, description?: string): TemplateCategory {
    const configData = getTemplateConfig();

    // 检查 ID 是否已存在
    if (configData.categories.some((c) => c.id === id)) {
        throw new Error(`Category with id "${id}" already exists`);
    }

    const newCategory: TemplateCategory = {
        id,
        name,
        description,
        templates: [],
    };

    configData.categories.push(newCategory);
    saveTemplateConfig(configData);

    return newCategory;
}

/**
 * 更新分类
 */
export function updateCategory(id: string, name?: string, description?: string): TemplateCategory {
    const configData = getTemplateConfig();
    const category = configData.categories.find((c) => c.id === id);

    if (!category) {
        throw new Error(`Category "${id}" not found`);
    }

    if (category.isSystem) {
        throw new Error('Cannot modify system category');
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;

    saveTemplateConfig(configData);
    return category;
}

/**
 * 删除分类
 */
export function deleteCategory(id: string): void {
    const configData = getTemplateConfig();
    const index = configData.categories.findIndex((c) => c.id === id);

    if (index === -1) {
        throw new Error(`Category "${id}" not found`);
    }

    const category = configData.categories[index];
    if (category.isSystem) {
        throw new Error('Cannot delete system category');
    }

    configData.categories.splice(index, 1);
    saveTemplateConfig(configData);
}

/**
 * 获取所有模板
 */
export function getAllTemplates(): DataTemplate[] {
    const configData = getTemplateConfig();
    return configData.categories.flatMap((c) => c.templates);
}

/**
 * 根据 ID 获取模板
 */
export function getTemplate(id: string): DataTemplate | null {
    const templates = getAllTemplates();
    return templates.find((t) => t.id === id) || null;
}

/**
 * 添加模板
 */
export function addTemplate(categoryId: string, template: Omit<DataTemplate, 'createdAt' | 'updatedAt'>): DataTemplate {
    const configData = getTemplateConfig();
    const category = configData.categories.find((c) => c.id === categoryId);

    if (!category) {
        throw new Error(`Category "${categoryId}" not found`);
    }

    // 检查 ID 是否已存在
    const allTemplates = getAllTemplates();
    if (allTemplates.some((t) => t.id === template.id)) {
        throw new Error(`Template with id "${template.id}" already exists`);
    }

    const now = new Date().toISOString();
    const newTemplate: DataTemplate = {
        ...template,
        createdAt: now,
        updatedAt: now,
    };

    category.templates.push(newTemplate);
    saveTemplateConfig(configData);

    return newTemplate;
}

/**
 * 更新模板
 */
export function updateTemplate(id: string, updates: Partial<Omit<DataTemplate, 'id' | 'createdAt' | 'isSystem'>>): DataTemplate {
    const configData = getTemplateConfig();

    for (const category of configData.categories) {
        const templateIndex = category.templates.findIndex((t) => t.id === id);
        if (templateIndex !== -1) {
            const template = category.templates[templateIndex];

            if (template.isSystem) {
                throw new Error('Cannot modify system template');
            }

            Object.assign(template, updates, { updatedAt: new Date().toISOString() });
            saveTemplateConfig(configData);
            return template;
        }
    }

    throw new Error(`Template "${id}" not found`);
}

/**
 * 删除模板
 */
export function deleteTemplate(id: string): void {
    const configData = getTemplateConfig();

    for (const category of configData.categories) {
        const templateIndex = category.templates.findIndex((t) => t.id === id);
        if (templateIndex !== -1) {
            const template = category.templates[templateIndex];

            if (template.isSystem) {
                throw new Error('Cannot delete system template');
            }

            category.templates.splice(templateIndex, 1);
            saveTemplateConfig(configData);
            return;
        }
    }

    throw new Error(`Template "${id}" not found`);
}

/**
 * 从现有数据创建模板的参数
 */
export interface CreateTemplateFromDataParams {
    categoryId: string;
    templateId: string;
    name: string;
    description: string;
    dataType: string;
    fieldKeys: string[];
    bindings?: Record<string, string>;
    components?: Record<string, TemplateComponent>;
    statusOptions?: TemplateStatusOption[];
    idConfig?: TemplateIdConfig;
}

/**
 * 从现有数据创建模板
 */
export function createTemplateFromData(params: CreateTemplateFromDataParams): DataTemplate {
    const {
        categoryId,
        templateId,
        name,
        description,
        dataType,
        fieldKeys,
        bindings,
        components,
        statusOptions,
        idConfig,
    } = params;

    const fields: TemplateField[] = fieldKeys.map((key) => ({
        key,
        defaultValue: '',
        required: ['type', 'id', 'status', 'title', 'createdAt', 'updatedAt'].includes(key),
    }));

    // 设置 type 的默认值
    const typeField = fields.find((f) => f.key === 'type');
    if (typeField) {
        typeField.defaultValue = dataType;
    }

    return addTemplate(categoryId, {
        id: templateId,
        name,
        description,
        dataType,
        fields,
        bindings,
        components,
        statusOptions,
        idConfig,
    });
}

/**
 * 根据编号配置生成编号
 */
function generateIdFromConfig(idConfig: TemplateIdConfig | undefined, dataType: string): string {
    if (!idConfig) {
        return `${dataType}-${Date.now().toString(36)}`;
    }
    const num = String(idConfig.startFrom).padStart(idConfig.digits, '0');
    if (idConfig.prefix) {
        return `${idConfig.prefix}${idConfig.separator}${num}`;
    }
    return num;
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
 * 生成模板的 YAML 内容
 */
export function generateYamlFromTemplate(templateId: string): string {
    const template = getTemplate(templateId);
    if (!template) {
        throw new Error(`Template "${templateId}" not found`);
    }

    const now = new Date().toISOString().split('T')[0];
    const lines: string[] = [];

    for (const field of template.fields) {
        let value = field.defaultValue ?? '';

        // 特殊处理某些字段
        if (field.key === 'id') {
            value = generateIdFromConfig(template.idConfig, template.dataType);
        } else if (field.key === 'createdAt' || field.key === 'updatedAt') {
            value = now;
        }

        // 格式化值
        if (typeof value === 'string' && value === '') {
            lines.push(`${field.key}: ""`);
        } else if (typeof value === 'string') {
            lines.push(`${field.key}: ${value}`);
        } else {
            lines.push(`${field.key}: ${value}`);
        }
    }

    // 添加 _bindings（如果有）
    if (template.bindings && Object.keys(template.bindings).length > 0) {
        lines.push('_bindings:');
        for (const [fieldKey, componentId] of Object.entries(template.bindings)) {
            lines.push(`  ${fieldKey}: ${componentId}`);
        }
    }

    // 添加 _status_options（如果有）
    if (template.statusOptions && template.statusOptions.length > 0) {
        lines.push('_status_options:');
        for (const opt of template.statusOptions) {
            if (opt.color) {
                lines.push(`  - value: ${opt.value}`);
                lines.push(`    color: ${opt.color}`);
            } else {
                lines.push(`  - value: ${opt.value}`);
            }
        }
    }

    // 添加 _id_config（如果有且非默认）
    if (template.idConfig) {
        lines.push('_id_config:');
        lines.push(`  prefix: "${template.idConfig.prefix}"`);
        lines.push(`  separator: "${template.idConfig.separator}"`);
        lines.push(`  digits: ${template.idConfig.digits}`);
        lines.push(`  startFrom: ${template.idConfig.startFrom}`);
        lines.push(`  frozen: ${template.idConfig.frozen}`);
    }

    return lines.join('\n');
}

/**
 * 从模板生成数据块（返回 YAML 和组件）
 */
export function generateFromTemplate(templateId: string): GenerateFromTemplateResult {
    const template = getTemplate(templateId);
    if (!template) {
        throw new Error(`Template "${templateId}" not found`);
    }

    const yaml = generateYamlFromTemplate(templateId);

    return {
        yaml,
        components: template.components,
    };
}

