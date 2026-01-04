/**
 * LabelConfig - 系统级标签管理服务
 * 
 * 核心原则：
 * - 原始名（key）：写入文档的字段名，如 project_name、status
 * - 映射名（label）：界面显示的友好名称，如 项目名称、状态
 * 
 * 文档始终使用原始名，映射名只影响 UI 显示
 * 
 * 分为两类：
 * - 系统标签：预定义的核心字段，不可删除，只能改映射名和图标
 * - 自定义标签：用户可自由添加
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { config } from '../config.js';

// ============================================================
// 类型定义
// ============================================================

/**
 * 单个标签定义
 */
export interface LabelItem {
  /** 原始名（英文，写入文档） */
  key: string;
  /** 映射名（显示名称） */
  label: string;
  /** 图标名称（Lucide Icons） */
  icon?: string;
  /** 颜色（用于状态等） */
  color?: string;
  /** 描述 */
  description?: string;
  /** 是否系统标签（不可删除） */
  isSystem?: boolean;
}

/**
 * 标签分类
 */
export interface LabelCategory {
  /** 分类 ID */
  id: string;
  /** 分类名称 */
  name: string;
  /** 分类描述 */
  description?: string;
  /** 是否系统分类（不可删除） */
  isSystem?: boolean;
  /** 标签列表 */
  items: LabelItem[];
}

/**
 * 完整的标签配置
 */
export interface LabelConfig {
  /** 版本 */
  version: string;
  /** 最后更新时间 */
  updatedAt: string;
  /** 分类列表 */
  categories: LabelCategory[];
  /** 敏感字段（不显示） */
  hiddenFields: string[];
}

// ============================================================
// 常量：系统预定义标签
// ============================================================

const SYSTEM_LABELS: LabelConfig = {
  version: '1.0',
  updatedAt: new Date().toISOString(),
  categories: [
    {
      id: 'core',
      name: '核心字段',
      description: '所有文档通用的基础字段',
      isSystem: true,
      items: [
        { key: 'id', label: '编号', icon: 'hash', isSystem: true },
        { key: 'type', label: '类型', icon: 'layers', isSystem: true },
        { key: 'status', label: '状态', icon: 'activity', isSystem: true },
        { key: 'title', label: '标题', icon: 'heading', isSystem: true },
        { key: 'display_name', label: '显示名称', icon: 'user', isSystem: true },
        { key: 'description', label: '描述', icon: 'align-left', isSystem: true },
      ],
    },
    {
      id: 'metadata',
      name: '文档元数据',
      description: '文档的元信息字段',
      isSystem: true,
      items: [
        { key: 'version', label: '版本', icon: 'git-branch', isSystem: true },
        { key: 'document_type', label: '文档类型', icon: 'file-type', isSystem: true },
        { key: 'created', label: '创建时间', icon: 'calendar', isSystem: true },
        { key: 'updated', label: '更新时间', icon: 'calendar-check', isSystem: true },
        { key: 'createdAt', label: '创建时间', icon: 'calendar-plus', isSystem: true },
        { key: 'updatedAt', label: '更新时间', icon: 'calendar-check', isSystem: true },
        { key: 'author', label: '作者', icon: 'user', isSystem: true },
      ],
    },
    {
      id: 'identity',
      name: '身份与联系',
      description: '用户身份和联系信息字段',
      isSystem: true,
      items: [
        { key: 'identity', label: '身份信息', icon: 'contact', isSystem: true },
        { key: 'name', label: '姓名', icon: 'user', isSystem: true },
        { key: 'gender', label: '性别', icon: 'users', isSystem: true },
        { key: 'birthday', label: '生日', icon: 'cake', isSystem: true },
        { key: 'emails', label: '邮箱列表', icon: 'mail', isSystem: true },
        { key: 'email', label: '邮箱', icon: 'mail', isSystem: true },
        { key: 'phones', label: '电话列表', icon: 'phone', isSystem: true },
        { key: 'phone', label: '座机', icon: 'phone', isSystem: true },
        { key: 'mobile', label: '手机', icon: 'smartphone', isSystem: true },
        { key: 'wechat', label: '微信', icon: 'message-circle', isSystem: true },
        { key: 'qq', label: 'QQ', icon: 'message-square', isSystem: true },
        { key: 'preferred', label: '首选联系方式', icon: 'star', isSystem: true },
        { key: 'avatar', label: '头像', icon: 'image', isSystem: true },
        { key: 'contact', label: '联系人', icon: 'user', isSystem: true },
        { key: 'contact_email', label: '联系邮箱', icon: 'mail', isSystem: true },
        { key: 'contact_phone', label: '联系电话', icon: 'phone', isSystem: true },
        { key: 'address', label: '地址', icon: 'map-pin', isSystem: true },
        { key: 'country', label: '国家', icon: 'globe', isSystem: true },
        { key: 'province', label: '省/直辖市', icon: 'map', isSystem: true },
        { key: 'city', label: '城市', icon: 'building-2', isSystem: true },
        { key: 'district', label: '区/县', icon: 'map-pin', isSystem: true },
        { key: 'street', label: '详细地址', icon: 'home', isSystem: true },
        { key: 'postal_code', label: '邮政编码', icon: 'mail', isSystem: true },
        { key: 'address_type', label: '地址类型', icon: 'tag', isSystem: true },
        { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin', isSystem: true },
        { key: 'twitter', label: 'Twitter/X', icon: 'twitter', isSystem: true },
        { key: 'weibo', label: '微博', icon: 'at-sign', isSystem: true },
        { key: 'github', label: 'GitHub', icon: 'github', isSystem: true },
        { key: 'personal_website', label: '个人网站', icon: 'globe', isSystem: true },
        { key: 'group', label: '分组', icon: 'folder', isSystem: true },
        { key: 'relationship', label: '关系', icon: 'heart', isSystem: true },
        // 账户认证相关
        { key: 'can_login', label: '允许登录', icon: 'log-in', isSystem: true },
        { key: 'username', label: '用户名', icon: 'at-sign', isSystem: true },
        { key: 'password', label: '密码', icon: 'lock', isSystem: true },
        { key: 'role', label: '角色', icon: 'shield', isSystem: true },
        { key: 'last_login', label: '上次登录', icon: 'clock', isSystem: true },
        { key: 'login_count', label: '登录次数', icon: 'hash', isSystem: true },
        { key: 'account_status', label: '账户状态', icon: 'user-check', isSystem: true },
        { key: 'invited_at', label: '邀请时间', icon: 'send', isSystem: true },
        { key: 'invitation_status', label: '邀请状态', icon: 'mail-check', isSystem: true },
        // 权限相关
        { key: 'allowed_paths', label: '可访问路径', icon: 'folder-tree', isSystem: true },
        { key: 'allowed_projects', label: '可访问项目', icon: 'folder-open', isSystem: true },
        { key: 'allowed_actions', label: '允许的操作', icon: 'check-square', isSystem: true },
        { key: 'expires_at', label: '权限过期时间', icon: 'calendar-x', isSystem: true },
        { key: 'access_notes', label: '权限备注', icon: 'file-text', isSystem: true },
      ],
    },
    {
      id: 'organization',
      name: '组织与角色',
      description: '组织结构相关字段',
      isSystem: true,
      items: [
        { key: 'company', label: '公司', icon: 'building', isSystem: true },
        { key: 'department', label: '部门', icon: 'users', isSystem: true },
        { key: 'position', label: '职位', icon: 'briefcase', isSystem: true },
        { key: 'role', label: '角色', icon: 'shield', isSystem: true },
      ],
    },
    {
      id: 'project',
      name: '项目相关',
      description: '项目管理相关字段',
      isSystem: true,
      items: [
        { key: 'project_name', label: '项目名称', icon: 'folder', isSystem: true },
        { key: 'project_id', label: '项目编号', icon: 'hash', isSystem: true },
        { key: 'client', label: '客户', icon: 'building', isSystem: true },
        { key: 'client_name', label: '客户名称', icon: 'building', isSystem: true },
        { key: 'contract_value', label: '合同金额', icon: 'dollar-sign', isSystem: true },
        { key: 'start_date', label: '开始日期', icon: 'calendar', isSystem: true },
        { key: 'end_date', label: '结束日期', icon: 'calendar', isSystem: true },
        { key: 'deadline', label: '截止日期', icon: 'clock', isSystem: true },
      ],
    },
    {
      id: 'business',
      name: '业务字段',
      description: '通用业务字段',
      isSystem: true,
      items: [
        { key: 'price', label: '价格', icon: 'dollar-sign', isSystem: true },
        { key: 'quantity', label: '数量', icon: 'hash', isSystem: true },
        { key: 'unit', label: '单位', icon: 'ruler', isSystem: true },
        { key: 'notes', label: '备注', icon: 'message-square', isSystem: true },
        { key: 'tags', label: '标签', icon: 'tag', isSystem: true },
        { key: 'category', label: '分类', icon: 'folder-tree', isSystem: true },
        { key: 'priority', label: '优先级', icon: 'flag', isSystem: true },
        { key: 'progress', label: '进度', icon: 'percent', isSystem: true },
        { key: 'rating', label: '评级', icon: 'star', isSystem: true },
        { key: 'invoiceType', label: '发票类型', icon: 'receipt', isSystem: true },
        { key: 'invoice_type', label: '发票类型', icon: 'receipt', isSystem: true },
        { key: 'relationship_strength', label: '关系强度', icon: 'heart', isSystem: true },
        { key: 'role_title', label: '职位', icon: 'briefcase', isSystem: true },
      ],
    },
    {
      id: 'files',
      name: '文件与媒体',
      description: '文件、图片、附件相关字段',
      isSystem: true,
      items: [
        { key: 'file', label: '文件', icon: 'file', isSystem: true },
        { key: 'files', label: '文件列表', icon: 'files', isSystem: true },
        { key: 'image', label: '图片', icon: 'image', isSystem: true },
        { key: 'images', label: '图片列表', icon: 'images', isSystem: true },
        { key: 'attachment', label: '附件', icon: 'paperclip', isSystem: true },
        { key: 'attachments', label: '附件列表', icon: 'paperclip', isSystem: true },
        { key: 'document', label: '文档', icon: 'file-text', isSystem: true },
        { key: 'documents', label: '文档列表', icon: 'file-text', isSystem: true },
        { key: 'photo', label: '照片', icon: 'camera', isSystem: true },
        { key: 'photos', label: '照片列表', icon: 'camera', isSystem: true },
        { key: 'video', label: '视频', icon: 'video', isSystem: true },
        { key: 'videos', label: '视频列表', icon: 'video', isSystem: true },
        { key: 'audio', label: '音频', icon: 'music', isSystem: true },
        { key: 'logo', label: '标志', icon: 'image', isSystem: true },
        { key: 'cover', label: '封面', icon: 'image', isSystem: true },
        { key: 'thumbnail', label: '缩略图', icon: 'image', isSystem: true },
      ],
    },
    {
      id: 'relations',
      name: '关联字段',
      description: '文档间关联字段',
      isSystem: true,
      items: [
        { key: 'ref', label: '引用', icon: 'link', isSystem: true },
        { key: 'profiles', label: '关联档案', icon: 'folder-open', isSystem: true },
        { key: 'related_projects', label: '相关项目', icon: 'link-2', isSystem: true },
      ],
    },
    {
      id: 'atlas_functions',
      name: 'ATLAS 功能类型',
      description: '文档的功能声明类型',
      isSystem: true,
      items: [
        { key: 'principal', label: '登录主体', icon: 'user-circle', isSystem: true },
        { key: 'entity_list', label: '实体列表', icon: 'list', isSystem: true },
        { key: 'entity_detail', label: '实体详情', icon: 'file-text', isSystem: true },
        { key: 'config', label: '系统配置', icon: 'settings', isSystem: true },
        { key: 'registry', label: '注册表', icon: 'database', isSystem: true },
      ],
    },
    {
      id: 'statuses',
      name: '状态值',
      description: '常用状态枚举值',
      isSystem: true,
      items: [
        { key: 'active', label: '活跃', icon: 'check-circle', color: 'green', isSystem: true },
        { key: 'inactive', label: '停用', icon: 'x-circle', color: 'gray', isSystem: true },
        { key: 'draft', label: '草稿', icon: 'edit', color: 'yellow', isSystem: true },
        { key: 'archived', label: '已归档', icon: 'archive', color: 'gray', isSystem: true },
        { key: 'suspended', label: '已暂停', icon: 'pause-circle', color: 'red', isSystem: true },
        { key: 'in_progress', label: '进行中', icon: 'play-circle', color: 'blue', isSystem: true },
        { key: 'completed', label: '已完成', icon: 'check-circle', color: 'green', isSystem: true },
        { key: 'pending', label: '待处理', icon: 'clock', color: 'yellow', isSystem: true },
      ],
    },
  ],
  hiddenFields: ['password_hash', 'auth', 'oauth', 'secret', 'token'],
};

// ============================================================
// 配置文件路径
// ============================================================

const CONFIG_PATH = join(config.atlasDataDir, 'config', 'labels.json');

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
 * 获取标签配置
 */
export function getLabelConfig(): LabelConfig {
  ensureConfigDir();

  // 如果配置文件不存在，使用系统默认值
  if (!existsSync(CONFIG_PATH)) {
    saveLabelConfig(SYSTEM_LABELS);
    return SYSTEM_LABELS;
  }

  try {
    const content = readFileSync(CONFIG_PATH, 'utf-8');
    const userConfig = JSON.parse(content) as LabelConfig;

    // 合并系统标签（确保系统标签不会被删除）
    return mergeWithSystemLabels(userConfig);
  } catch (error) {
    console.error('[LabelConfig] Failed to read config:', error);
    return SYSTEM_LABELS;
  }
}

/**
 * 保存标签配置
 */
export function saveLabelConfig(config: LabelConfig): void {
  ensureConfigDir();

  config.updatedAt = new Date().toISOString();
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');

  // 清除缓存
  clearLabelCache();

  console.log(`[LabelConfig] Saved: ${countLabels(config)} labels in ${config.categories.length} categories`);
}

/**
 * 合并用户配置与系统标签
 */
function mergeWithSystemLabels(userConfig: LabelConfig): LabelConfig {
  const merged: LabelConfig = {
    version: userConfig.version || SYSTEM_LABELS.version,
    updatedAt: userConfig.updatedAt || new Date().toISOString(),
    categories: [],
    hiddenFields: [...new Set([...SYSTEM_LABELS.hiddenFields, ...(userConfig.hiddenFields || [])])],
  };

  // 先添加系统分类（保证顺序）
  for (const sysCategory of SYSTEM_LABELS.categories) {
    const userCategory = userConfig.categories.find(c => c.id === sysCategory.id);

    if (userCategory) {
      // 合并用户修改的映射名和图标
      const mergedItems = sysCategory.items.map(sysItem => {
        const userItem = userCategory.items.find(i => i.key === sysItem.key);
        return userItem ? {
          ...sysItem,
          label: userItem.label || sysItem.label,
          icon: userItem.icon || sysItem.icon,
          color: userItem.color || sysItem.color,
          description: userItem.description || sysItem.description,
        } : sysItem;
      });

      // 🔑 添加用户在系统分类中新增的项目
      for (const userItem of userCategory.items) {
        if (!sysCategory.items.find(i => i.key === userItem.key)) {
          mergedItems.push(userItem);
        }
      }

      merged.categories.push({
        ...sysCategory,
        items: mergedItems,
      });
    } else {
      merged.categories.push(sysCategory);
    }
  }

  // 🔑 添加用户自定义分类（不管 isSystem 标记，只要不在系统分类中就添加）
  for (const userCategory of userConfig.categories) {
    if (!merged.categories.find(c => c.id === userCategory.id)) {
      merged.categories.push(userCategory);
    }
  }

  return merged;
}

/**
 * 统计标签数量
 */
function countLabels(config: LabelConfig): number {
  return config.categories.reduce((sum, cat) => sum + cat.items.length, 0);
}

// ============================================================
// 标签查询 API
// ============================================================

/** 缓存 */
let labelCache: Map<string, LabelItem> | null = null;

/**
 * 构建缓存
 */
function buildCache(): Map<string, LabelItem> {
  if (labelCache) return labelCache;

  const config = getLabelConfig();
  const cache = new Map<string, LabelItem>();

  for (const category of config.categories) {
    for (const item of category.items) {
      cache.set(item.key, item);
      cache.set(item.key.toLowerCase(), item);
    }
  }

  labelCache = cache;
  return cache;
}

/**
 * 清除缓存
 */
export function clearLabelCache(): void {
  labelCache = null;
}

/**
 * 根据原始名获取标签
 */
export function getLabel(key: string): LabelItem | null {
  const cache = buildCache();
  return cache.get(key) || cache.get(key.toLowerCase()) || null;
}

/**
 * 获取映射后的显示名
 */
export function getLabelText(key: string): string {
  const item = getLabel(key);
  return item?.label || key;
}

/**
 * 获取图标
 */
export function getLabelIcon(key: string): string | undefined {
  const item = getLabel(key);
  return item?.icon;
}

/**
 * 获取颜色
 */
export function getLabelColor(key: string): string | undefined {
  const item = getLabel(key);
  return item?.color;
}

/**
 * 检查是否是敏感字段
 */
export function isHiddenField(key: string): boolean {
  const config = getLabelConfig();
  return config.hiddenFields.includes(key) || config.hiddenFields.includes(key.toLowerCase());
}

// ============================================================
// 分类管理 API
// ============================================================

/**
 * 添加自定义分类
 */
export function addCategory(category: Omit<LabelCategory, 'isSystem'>): LabelCategory {
  const config = getLabelConfig();

  // 检查 ID 冲突
  if (config.categories.find(c => c.id === category.id)) {
    throw new Error(`Category ${category.id} already exists`);
  }

  const newCategory: LabelCategory = {
    ...category,
    isSystem: false,
  };

  config.categories.push(newCategory);
  saveLabelConfig(config);

  return newCategory;
}

/**
 * 更新分类（只能改名称和描述）
 */
export function updateCategory(id: string, updates: { name?: string; description?: string }): LabelCategory {
  const config = getLabelConfig();
  const category = config.categories.find(c => c.id === id);

  if (!category) {
    throw new Error(`Category ${id} not found`);
  }

  if (updates.name) category.name = updates.name;
  if (updates.description !== undefined) category.description = updates.description;

  saveLabelConfig(config);
  return category;
}

/**
 * 删除分类（只能删除非系统分类）
 */
export function deleteCategory(id: string): void {
  const config = getLabelConfig();
  const index = config.categories.findIndex(c => c.id === id);

  if (index === -1) {
    throw new Error(`Category ${id} not found`);
  }

  if (config.categories[index].isSystem) {
    throw new Error(`Cannot delete system category ${id}`);
  }

  config.categories.splice(index, 1);
  saveLabelConfig(config);
}

// ============================================================
// 标签管理 API
// ============================================================

/**
 * 添加标签到分类
 */
export function addLabel(categoryId: string, label: Omit<LabelItem, 'isSystem'>): LabelItem {
  const config = getLabelConfig();
  const category = config.categories.find(c => c.id === categoryId);

  if (!category) {
    throw new Error(`Category ${categoryId} not found`);
  }

  // 验证 key 格式（英文、数字、下划线）
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(label.key)) {
    throw new Error(`Invalid key format: ${label.key}. Must start with letter, contain only letters, numbers, and underscores.`);
  }

  // 检查 key 冲突
  const cache = buildCache();
  if (cache.has(label.key)) {
    throw new Error(`Label key ${label.key} already exists`);
  }

  const newLabel: LabelItem = {
    ...label,
    isSystem: false,
  };

  category.items.push(newLabel);
  saveLabelConfig(config);

  return newLabel;
}

/**
 * 更新标签（系统标签只能改 label, icon, color, description）
 */
export function updateLabel(key: string, updates: Partial<Omit<LabelItem, 'key' | 'isSystem'>>): LabelItem {
  const config = getLabelConfig();

  for (const category of config.categories) {
    const item = category.items.find(i => i.key === key);
    if (item) {
      // 系统标签只能修改显示相关字段
      if (updates.label !== undefined) item.label = updates.label;
      if (updates.icon !== undefined) item.icon = updates.icon;
      if (updates.color !== undefined) item.color = updates.color;
      if (updates.description !== undefined) item.description = updates.description;

      saveLabelConfig(config);
      return item;
    }
  }

  throw new Error(`Label ${key} not found`);
}

/**
 * 删除标签（只能删除非系统标签）
 */
export function deleteLabel(key: string): void {
  const config = getLabelConfig();

  for (const category of config.categories) {
    const index = category.items.findIndex(i => i.key === key);
    if (index !== -1) {
      if (category.items[index].isSystem) {
        throw new Error(`Cannot delete system label ${key}`);
      }
      category.items.splice(index, 1);
      saveLabelConfig(config);
      return;
    }
  }

  throw new Error(`Label ${key} not found`);
}

export default {
  getLabelConfig,
  saveLabelConfig,
  getLabel,
  getLabelText,
  getLabelIcon,
  getLabelColor,
  isHiddenField,
  clearLabelCache,
  addCategory,
  updateCategory,
  deleteCategory,
  addLabel,
  updateLabel,
  deleteLabel,
};

