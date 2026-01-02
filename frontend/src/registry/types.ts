/**
 * 场景化视图系统类型定义
 */

import type { ComponentType } from 'react';

// 从统一类型定义导入
export type { ADLDocument, Block, MachineBlock, Frontmatter } from '@/types/adl';
import type { ADLDocument } from '@/types/adl';

// ============================================================
// 视图模式
// ============================================================

export type ViewMode = 'read' | 'form' | 'md';

// ============================================================
// 视图组件属性
// ============================================================

export interface ViewProps {
  /** 文档数据 */
  document: ADLDocument;
  /** 保存回调 */
  onSave?: (data: unknown) => Promise<void>;
  /** 取消回调 */
  onCancel?: () => void;
  /** 是否只读 */
  readOnly?: boolean;
  /** 切换视图模式 */
  onViewModeChange?: (mode: ViewMode) => void;
}

// ============================================================
// 操作配置
// ============================================================

export interface ActionConfig {
  /** 操作唯一标识 */
  id: string;
  /** 显示标签 */
  label: string;
  /** 图标名称 (Lucide) */
  icon: string;
  /** 所需能力（用于权限控制） */
  capability?: string;
  /** 按钮样式 */
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  /** 处理函数名或回调 */
  handler: string | ((doc: ADLDocument) => void | Promise<void>);
  /** 确认提示（危险操作） */
  confirmMessage?: string;
}

// ============================================================
// 功能视图配置
// ============================================================

export interface FunctionViewConfig {
  /** 功能标识 */
  function: string;
  /** 功能显示名称 */
  label: string;
  /** 视图组件 */
  views: {
    read?: ComponentType<ViewProps>;
    form?: ComponentType<ViewProps>;
    md?: ComponentType<ViewProps>;
  };
  /** 可用视图模式 */
  availableModes: ViewMode[];
  /** 默认视图模式 */
  defaultMode: ViewMode;
  /** 操作按钮配置 */
  actions: ActionConfig[];
}

// ============================================================
// 注册表类型
// ============================================================

export type FunctionViewRegistry = Map<string, FunctionViewConfig>;

