/**
 * 视图注册
 * 
 * 注册所有场景化视图到 FunctionViewRegistry
 */

import { registerFunctionView } from './FunctionViewRegistry';
import { PrincipalReadView, PrincipalFormView } from '@/components/views/principal';
import { NoteReadView } from '@/components/views/note';
import { ClientReadView } from '@/components/views/client';
import { ProjectReadView } from '@/components/views/project';
import type { FunctionViewConfig, ActionConfig } from './types';

// ============================================================
// Principal (登录主体) 视图配置
// ============================================================

const principalActions: ActionConfig[] = [
  {
    id: 'edit',
    label: '编辑',
    icon: 'edit',
    variant: 'default',
    handler: 'edit',
  },
  {
    id: 'reset-password',
    label: '重置密码',
    icon: 'key',
    capability: 'auth.login',
    variant: 'default',
    handler: 'resetPassword',
    confirmMessage: '确定要重置该用户的密码吗？重置后会发送新密码到用户邮箱。',
  },
  {
    id: 'disable-account',
    label: '禁用账户',
    icon: 'user-x',
    capability: 'auth.session',
    variant: 'danger',
    handler: 'disableAccount',
    confirmMessage: '确定要禁用该账户吗？禁用后用户将无法登录。',
  },
  {
    id: 'enable-account',
    label: '启用账户',
    icon: 'user-check',
    capability: 'auth.session',
    variant: 'default',
    handler: 'enableAccount',
  },
];

const principalConfig: FunctionViewConfig = {
  function: 'principal',
  label: '登录主体',
  views: {
    read: PrincipalReadView,
    form: PrincipalFormView,
    // md: 使用默认
  },
  availableModes: ['read', 'form', 'md'],
  defaultMode: 'read',
  actions: principalActions,
};

// ============================================================
// Client (客户) 视图配置
// ============================================================

const clientActions: ActionConfig[] = [
  {
    id: 'edit',
    label: '编辑',
    icon: 'edit',
    variant: 'default',
    handler: 'edit',
  },
  {
    id: 'new-project',
    label: '新建项目',
    icon: 'plus',
    variant: 'primary',
    handler: 'newProject',
  },
  {
    id: 'send-email',
    label: '发邮件',
    icon: 'mail',
    variant: 'default',
    handler: 'sendEmail',
  },
  {
    id: 'delete',
    label: '删除',
    icon: 'trash',
    variant: 'danger',
    handler: 'delete',
    confirmMessage: '确定要删除这个客户吗？此操作不可撤销。',
  },
];

const clientConfig: FunctionViewConfig = {
  function: 'client',
  label: '客户',
  views: {
    read: ClientReadView,
  },
  availableModes: ['read', 'form', 'md'],
  defaultMode: 'read',
  actions: clientActions,
};

// ============================================================
// Project (项目) 视图配置
// ============================================================

const projectActions: ActionConfig[] = [
  {
    id: 'edit',
    label: '编辑',
    icon: 'edit',
    variant: 'default',
    handler: 'edit',
  },
  {
    id: 'archive',
    label: '归档',
    icon: 'archive',
    variant: 'default',
    handler: 'archive',
    confirmMessage: '确定要归档这个项目吗？',
  },
  {
    id: 'delete',
    label: '删除',
    icon: 'trash',
    variant: 'danger',
    handler: 'delete',
    confirmMessage: '确定要删除这个项目吗？此操作不可撤销。',
  },
];

const projectConfig: FunctionViewConfig = {
  function: 'project',
  label: '项目',
  views: {
    read: ProjectReadView,
  },
  availableModes: ['read', 'form', 'md'],
  defaultMode: 'read',
  actions: projectActions,
};

// ============================================================
// EntityList (实体列表) 视图配置 - TODO
// ============================================================

// ============================================================
// Note (笔记) 视图配置
// ============================================================

const noteActions: ActionConfig[] = [
  {
    id: 'edit',
    label: '编辑',
    icon: 'edit',
    variant: 'default',
    handler: 'edit',
  },
  {
    id: 'duplicate',
    label: '复制',
    icon: 'copy',
    variant: 'default',
    handler: 'duplicate',
  },
  {
    id: 'delete',
    label: '删除',
    icon: 'trash',
    variant: 'danger',
    handler: 'delete',
    confirmMessage: '确定要删除这篇笔记吗？此操作不可撤销。',
  },
];

const noteConfig: FunctionViewConfig = {
  function: 'note',
  label: '笔记',
  views: {
    read: NoteReadView,
    // 笔记类型没有表单视图
  },
  availableModes: ['read', 'md'],
  defaultMode: 'read',
  actions: noteActions,
};

// ============================================================
// 注册所有视图
// ============================================================

export function registerAllViews() {
  // 注册 Principal
  registerFunctionView(principalConfig);

  // 注册 Note
  registerFunctionView(noteConfig);

  // 注册 Client
  registerFunctionView(clientConfig);

  // 注册 Project
  registerFunctionView(projectConfig);
}

// 自动执行注册
registerAllViews();

export default registerAllViews;

