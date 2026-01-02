/**
 * ActionHandlers - 操作处理器
 * 
 * 实现各种文档操作的具体逻辑
 */

import type { ADLDocument } from '@/registry/types';

// ============================================================
// 类型定义
// ============================================================

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
}

export type ActionHandler = (
  document: ADLDocument,
  context?: ActionContext
) => Promise<ActionResult>;

export interface ActionContext {
  /** 导航函数 */
  navigate?: (path: string) => void;
  /** 刷新页面 */
  reload?: () => void;
  /** 切换视图模式 */
  setViewMode?: (mode: 'read' | 'form' | 'md') => void;
  /** 显示 toast */
  toast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

// ============================================================
// 通用操作处理器
// ============================================================

/**
 * 编辑文档
 */
export const handleEdit: ActionHandler = async (_document, context) => {
  context?.setViewMode?.('form');
  return { success: true, message: '进入编辑模式' };
};

/**
 * 复制文档
 */
export const handleDuplicate: ActionHandler = async (document) => {
  const path = document.path;
  if (!path) {
    return { success: false, error: '文档路径未知' };
  }

  try {
    const response = await fetch('/api/documents/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || '复制失败' };
    }

    const result = await response.json();
    return {
      success: true,
      message: `已复制到 ${result.newPath}`,
      data: result,
    };
  } catch (error) {
    return { success: false, error: '复制失败' };
  }
};

/**
 * 删除文档
 */
export const handleDelete: ActionHandler = async (document, context) => {
  const path = document.path;
  if (!path) {
    return { success: false, error: '文档路径未知' };
  }

  try {
    const response = await fetch(`/api/documents/${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || '删除失败' };
    }

    // 导航回上级目录
    const parentPath = path.split('/').slice(0, -1).join('/') || '/';
    context?.navigate?.(`/workspace/${parentPath}`);

    return { success: true, message: '文档已删除' };
  } catch (error) {
    return { success: false, error: '删除失败' };
  }
};

/**
 * 归档文档
 */
export const handleArchive: ActionHandler = async (document) => {
  const path = document.path;
  if (!path) {
    return { success: false, error: '文档路径未知' };
  }

  try {
    const response = await fetch('/api/documents/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || '归档失败' };
    }

    return { success: true, message: '文档已归档' };
  } catch (error) {
    return { success: false, error: '归档失败' };
  }
};

// ============================================================
// Principal 专属操作
// ============================================================

/**
 * 重置密码
 */
export const handleResetPassword: ActionHandler = async (document) => {
  const userId = document.blocks[0]?.machine?.id;
  if (!userId) {
    return { success: false, error: '用户 ID 未知' };
  }

  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || '重置密码失败' };
    }

    return { success: true, message: '密码已重置，新密码已发送到用户邮箱' };
  } catch (error) {
    return { success: false, error: '重置密码失败' };
  }
};

/**
 * 禁用账户
 */
export const handleDisableAccount: ActionHandler = async (document) => {
  const userId = document.blocks[0]?.machine?.id;
  if (!userId) {
    return { success: false, error: '用户 ID 未知' };
  }

  try {
    const response = await fetch('/api/auth/disable-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || '禁用账户失败' };
    }

    return { success: true, message: '账户已禁用' };
  } catch (error) {
    return { success: false, error: '禁用账户失败' };
  }
};

/**
 * 启用账户
 */
export const handleEnableAccount: ActionHandler = async (document) => {
  const userId = document.blocks[0]?.machine?.id;
  if (!userId) {
    return { success: false, error: '用户 ID 未知' };
  }

  try {
    const response = await fetch('/api/auth/enable-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || '启用账户失败' };
    }

    return { success: true, message: '账户已启用' };
  } catch (error) {
    return { success: false, error: '启用账户失败' };
  }
};

// ============================================================
// Client 专属操作
// ============================================================

/**
 * 新建项目
 */
export const handleNewProject: ActionHandler = async (document, context) => {
  const clientId = document.blocks[0]?.machine?.id;
  if (!clientId) {
    return { success: false, error: '客户 ID 未知' };
  }

  // 导航到新建项目页面
  context?.navigate?.(`/workspace/projects/new?client=${clientId}`);
  return { success: true };
};

/**
 * 发送邮件
 */
export const handleSendEmail: ActionHandler = async (document) => {
  const email = document.blocks[0]?.machine?.contact?.email;
  if (email) {
    window.open(`mailto:${email}`);
    return { success: true };
  }
  return { success: false, error: '未找到联系邮箱' };
};

// ============================================================
// 操作处理器注册表
// ============================================================

const handlers: Record<string, ActionHandler> = {
  // 通用操作
  edit: handleEdit,
  duplicate: handleDuplicate,
  delete: handleDelete,
  archive: handleArchive,
  
  // Principal 操作
  resetPassword: handleResetPassword,
  disableAccount: handleDisableAccount,
  enableAccount: handleEnableAccount,
  
  // Client 操作
  newProject: handleNewProject,
  sendEmail: handleSendEmail,
};

/**
 * 获取操作处理器
 */
export function getActionHandler(handlerId: string): ActionHandler | undefined {
  return handlers[handlerId];
}

/**
 * 注册自定义操作处理器
 */
export function registerActionHandler(id: string, handler: ActionHandler): void {
  handlers[id] = handler;
}

/**
 * 执行操作
 */
export async function executeAction(
  handlerId: string,
  document: ADLDocument,
  context?: ActionContext
): Promise<ActionResult> {
  const handler = getActionHandler(handlerId);
  if (!handler) {
    return { success: false, error: `未找到操作处理器: ${handlerId}` };
  }

  try {
    return await handler(document, context);
  } catch (error) {
    console.error(`Action ${handlerId} failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '操作失败',
    };
  }
}

export default {
  getHandler: getActionHandler,
  register: registerActionHandler,
  execute: executeAction,
};

