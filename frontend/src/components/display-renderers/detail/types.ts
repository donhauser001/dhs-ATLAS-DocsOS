import YAML from 'yaml';
import type { FieldSchema, SelectOption } from '../list/types';

// 详情区块类型
export interface DetailSection {
    id: string;
    type: 'detail_section' | 'detail_list';
    title: string;
    icon?: string;
    schema: FieldSchema[];
    data: Record<string, unknown> | Record<string, unknown>[];
}

// 字段值显示
export interface FieldValue {
    key: string;
    label: string;
    type: string;
    value: unknown;
    displayValue: string;
    option?: SelectOption;
    options?: SelectOption[];
}

// 组件定义（来自 frontmatter._components）
export interface ComponentDefinition {
    type: string;
    id: string;
    label: string;
    options?: Array<{ value: string; label?: string }>;
    placeholder?: string;
    [key: string]: unknown;
}

// 类型标签映射（用于将内部类型显示为友好名称）
const TYPE_LABEL_MAP: Record<string, string> = {
    contact_personal_info: '个人信息',
    contact_methods: '联系方式',
    contact_address: '地址信息',
    contact_tags_notes: '标签与备注',
    account_auth: '账户认证',
    access_permissions: '访问权限',
    personal_info: '个人信息',
    social_accounts: '社交账号',
    tags_notes: '标签备注',
    address_info: '地址信息',
};

// 类型图标映射
const TYPE_ICON_MAP: Record<string, string> = {
    contact_personal_info: 'user',
    contact_methods: 'phone',
    contact_address: 'building',
    contact_tags_notes: 'clipboard-list',
    account_auth: 'briefcase',
    access_permissions: 'file-text',
    personal_info: 'user',
    social_accounts: 'globe',
    tags_notes: 'clipboard-list',
    address_info: 'building',
};

// 组件类型到字段类型的映射
const COMPONENT_TYPE_MAP: Record<string, string> = {
    'select': 'select',
    'multi-select': 'select',
    'radio': 'select',
    'checkbox': 'select',
    'date': 'date',
    'text': 'text',
    'textarea': 'textarea',
    'number': 'number',
    'phone': 'phone',
    'email': 'email',
    'toggle': 'toggle',
    'avatar': 'avatar',
    'image': 'image',
    'tags': 'tags',
    'id-generator': 'text',
    'folder-picker': 'text',
    'file': 'file',
    'files': 'files',
    'rating': 'rating',
    'id-card': 'text',
    'user-auth': 'user-auth',
};

// 从组件定义构建 FieldSchema
function buildSchemaFromComponent(
    key: string,
    component: ComponentDefinition
): FieldSchema {
    const fieldType = COMPONENT_TYPE_MAP[component.type] || 'text';

    const schema: FieldSchema = {
        key,
        label: component.label || key,
        type: fieldType,
    };

    // 处理选项类组件
    if (component.options && Array.isArray(component.options)) {
        schema.options = component.options.map(opt => ({
            value: opt.value,
            label: opt.label || opt.value,
        }));
    }

    return schema;
}

// 从 data 对象推断字段 schema（当没有 _bindings 时的兜底）
function inferSchemaFromData(data: Record<string, unknown>): FieldSchema[] {
    const schema: FieldSchema[] = [];

    for (const [key, value] of Object.entries(data)) {
        // 跳过内部字段
        if (key.startsWith('_')) continue;

        let type = 'text';
        if (typeof value === 'boolean') {
            type = 'toggle';
        } else if (typeof value === 'number') {
            type = 'number';
        } else if (typeof value === 'string') {
            if (value.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
                type = 'avatar';
            } else if (value.startsWith('[')) {
                type = 'tags';
            } else if (value.includes('@') && value.includes('.')) {
                type = 'email';
            } else if (/^1\d{10}$/.test(value)) {
                type = 'phone';
            }
        } else if (Array.isArray(value)) {
            type = 'tags';
        }

        schema.push({
            key,
            label: key,
            type,
        });
    }

    return schema;
}

// 解析详情数据块
export function parseDetailBlocks(
    bodyContent: string,
    frontmatter?: Record<string, unknown>
): DetailSection[] {
    const blocks: DetailSection[] = [];
    const regex = /```atlas-data\n([\s\S]*?)```/g;
    let match;

    // 获取组件定义
    const components = (frontmatter?._components || {}) as Record<string, ComponentDefinition>;

    while ((match = regex.exec(bodyContent)) !== null) {
        try {
            const content = match[1];
            // 使用 yaml 库解析
            const parsed = YAML.parse(content);

            if (!parsed || !parsed.type) continue;

            // 标准的 detail_section 或 detail_list 类型
            if (parsed.type === 'detail_section' || parsed.type === 'detail_list') {
                blocks.push(parsed as DetailSection);
                continue;
            }

            // 处理自定义类型（如 contact_personal_info 等）
            const customType = parsed.type as string;
            const bindings = parsed._bindings as Record<string, string> | undefined;
            const data = parsed.data as Record<string, unknown> | undefined;

            // 优先使用 schema（如果存在）
            let schema = parsed.schema as FieldSchema[] | undefined;

            // 如果没有 schema，从 _bindings + _components 构建
            if (!schema && bindings && data) {
                schema = [];

                // 按 data 中字段的顺序构建 schema
                for (const key of Object.keys(data)) {
                    if (key.startsWith('_')) continue;

                    const componentId = bindings[key];
                    if (componentId && components[componentId]) {
                        // 从组件定义构建 schema
                        schema.push(buildSchemaFromComponent(key, components[componentId]));
                    } else {
                        // 没有绑定组件，从值推断类型
                        const value = data[key];
                        let type = 'text';

                        if (typeof value === 'boolean') {
                            type = 'toggle';
                        } else if (typeof value === 'string') {
                            if (value.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
                                type = 'avatar';
                            } else if (value.startsWith('[')) {
                                type = 'tags';
                            } else if (value.includes('@') && value.includes('.')) {
                                type = 'email';
                            } else if (/^1\d{10}$/.test(value)) {
                                type = 'phone';
                            }
                        }

                        schema.push({
                            key,
                            label: key, // 标签后面可以从标签管理系统获取
                            type,
                        });
                    }
                }
            }

            // 如果还是没有 schema，从 data 推断
            if (!schema && data) {
                schema = inferSchemaFromData(data);
            }

            if (schema && data) {
                const section: DetailSection = {
                    id: customType,
                    type: 'detail_section',
                    title: TYPE_LABEL_MAP[customType] || customType,
                    icon: TYPE_ICON_MAP[customType] || 'file-text',
                    schema: schema,
                    data: data,
                };
                blocks.push(section);
            }
        } catch (e) {
            console.error('Failed to parse detail block:', e);
        }
    }

    return blocks;
}

// 获取字段显示值
export function getFieldDisplayValue(
    schema: FieldSchema,
    value: unknown
): FieldValue {
    const result: FieldValue = {
        key: schema.key,
        label: schema.label,
        type: schema.type,
        value,
        displayValue: '',
        options: schema.options,
    };

    if (value === null || value === undefined || value === '') {
        result.displayValue = '—';
        return result;
    }

    switch (schema.type) {
        case 'select':
            const options = Array.isArray(schema.options) ? schema.options : [];
            const option = options.find(o => o.value === value);
            result.option = option;
            result.displayValue = option?.label || String(value);
            break;

        case 'date':
            const date = new Date(value as string);
            result.displayValue = date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            break;

        case 'currency':
            const num = Number(value);
            result.displayValue = new Intl.NumberFormat('zh-CN', {
                style: 'currency',
                currency: 'CNY',
            }).format(num);
            break;

        case 'url':
        case 'link':
            result.displayValue = String(value);
            break;

        case 'email':
            result.displayValue = String(value);
            break;

        case 'phone':
            result.displayValue = String(value);
            break;

        case 'textarea':
            result.displayValue = String(value);
            break;

        case 'user-auth':
            // 用户认证组件是一个对象，保持原值，由渲染组件处理
            if (typeof value === 'object' && value !== null) {
                result.displayValue = '__user_auth_object__'; // 标记为特殊处理
            } else {
                result.displayValue = String(value);
            }
            break;

        default:
            // 处理对象类型的值
            if (typeof value === 'object' && value !== null) {
                result.displayValue = '__object__'; // 标记为对象
            } else {
                result.displayValue = String(value);
            }
    }

    return result;
}

// 图标映射
export const ICON_MAP: Record<string, string> = {
    building: '🏢',
    phone: '📞',
    briefcase: '💼',
    'clipboard-list': '📋',
    'file-text': '📄',
    user: '👤',
    calendar: '📅',
    mail: '✉️',
    globe: '🌐',
    dollar: '💰',
};

// 获取状态颜色
export function getStatusColor(color?: string): { bg: string; text: string; border: string } {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
        gold: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
        red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
        gray: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    };
    return colors[color || 'gray'] || colors.gray;
}
