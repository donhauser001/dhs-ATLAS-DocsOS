/**
 * 字段类型推断器
 * 
 * 根据字段名和值自动推断应该使用的编辑控件类型
 */

import type { FieldType, FieldConfig } from './types';
import {
  STATUS_VALUES,
  BOOLEAN_FIELD_NAMES,
  DATE_FIELD_NAMES,
  READONLY_FIELD_NAMES,
  RATING_FIELD_NAMES,
  COLOR_FIELD_NAMES,
  REF_FIELD_SUFFIXES,
} from './types';

/**
 * 推断字段类型
 */
export function inferFieldType(key: string, value: unknown): FieldType {
  const lowerKey = key.toLowerCase();

  // 1. 只读字段
  if (READONLY_FIELD_NAMES.some(name => lowerKey === name)) {
    return 'readonly';
  }

  // 2. 状态字段
  if (lowerKey === 'status' && typeof value === 'string') {
    return 'status';
  }

  // 3. 布尔字段
  if (typeof value === 'boolean') {
    return 'switch';
  }
  if (BOOLEAN_FIELD_NAMES.some(name => lowerKey === name || lowerKey.endsWith(`_${name}`))) {
    return 'switch';
  }

  // 4. 日期字段
  if (DATE_FIELD_NAMES.some(name => lowerKey === name || lowerKey.includes(name))) {
    return 'date';
  }
  // 检测日期格式字符串
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return 'date';
  }

  // 5. 评分字段
  if (RATING_FIELD_NAMES.some(name => lowerKey === name)) {
    if (typeof value === 'number' && value >= 0 && value <= 10) {
      return 'rating';
    }
  }

  // 6. 颜色字段
  if (COLOR_FIELD_NAMES.some(name => lowerKey === name || lowerKey.endsWith(name))) {
    if (typeof value === 'string' && value.startsWith('#')) {
      return 'color';
    }
  }

  // 7. 引用字段
  if (REF_FIELD_SUFFIXES.some(suffix => key.endsWith(suffix))) {
    return 'ref';
  }
  if (typeof value === 'object' && value !== null && 'ref' in value) {
    return 'ref';
  }

  // 8. 数组字段（标签）
  if (Array.isArray(value)) {
    // 字符串数组 -> 标签
    if (value.every(item => typeof item === 'string')) {
      return 'tags';
    }
    // 其他数组 -> 按对象处理
    return 'object';
  }

  // 9. 嵌套对象
  if (typeof value === 'object' && value !== null) {
    return 'object';
  }

  // 10. 数字
  if (typeof value === 'number') {
    return 'number';
  }

  // 11. 长文本（超过 100 字符或包含换行）
  if (typeof value === 'string') {
    if (value.length > 100 || value.includes('\n')) {
      return 'textarea';
    }
    return 'text';
  }

  return 'text';
}

/**
 * 生成字段配置
 */
export function generateFieldConfig(key: string, value: unknown): FieldConfig {
  const type = inferFieldType(key, value);
  const label = formatLabel(key);

  const config: FieldConfig = {
    type,
    label,
  };

  // 特殊配置
  switch (type) {
    case 'status':
      config.options = STATUS_VALUES.map(v => ({
        value: v,
        label: getStatusLabel(v),
      }));
      break;

    case 'readonly':
      config.readonly = true;
      break;

    case 'rating':
      config.max = 5;
      break;

    case 'switch':
      // 确保值是布尔类型
      break;
  }

  return config;
}

/**
 * 格式化字段标签
 */
export function formatLabel(key: string): string {
  // 常见字段的中文映射
  const labelMap: Record<string, string> = {
    type: '类型',
    id: '标识符',
    status: '状态',
    title: '标题',
    name: '名称',
    display_name: '显示名称',
    description: '描述',
    category: '分类',
    rating: '评级',
    address: '地址',
    email: '邮箱',
    emails: '邮箱列表',
    phone: '电话',
    phones: '电话列表',
    visible: '可见',
    enabled: '启用',
    required: '必填',
    order: '排序',
    icon: '图标',
    label: '标签',
    color: '颜色',
    bg: '背景色',
    text: '文字色',
    value: '值',
    invoiceType: '发票类型',
    invoice_type: '发票类型',
    role_title: '职位',
    department: '部门',
    relationship_strength: '关系强度',
    tags: '标签',
    notes: '备注',
    principal_ref: '关联用户',
    client_ref: '关联客户',
    profile_type: '档案类型',
    created: '创建时间',
    updated: '更新时间',
  };

  if (labelMap[key]) {
    return labelMap[key];
  }

  // 转换 snake_case 或 camelCase 为人类可读格式
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

/**
 * 获取状态标签
 */
export function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    active: '激活',
    inactive: '未激活',
    draft: '草稿',
    archived: '已归档',
    pending: '待处理',
    error: '错误',
  };
  return statusLabels[status] || status;
}

/**
 * 获取状态颜色
 */
export function getStatusColor(status: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    active: { bg: '#DCFCE7', text: '#166534' },
    inactive: { bg: '#F3F4F6', text: '#6B7280' },
    draft: { bg: '#FEF3C7', text: '#92400E' },
    archived: { bg: '#F1F5F9', text: '#475569' },
    pending: { bg: '#DBEAFE', text: '#1E40AF' },
    error: { bg: '#FEE2E2', text: '#991B1B' },
  };
  return colors[status] || { bg: '#F3F4F6', text: '#6B7280' };
}

