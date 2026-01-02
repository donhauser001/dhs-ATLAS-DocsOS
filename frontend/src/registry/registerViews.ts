/**
 * 视图注册
 * 
 * 注册所有场景化视图到 FunctionViewRegistry
 */

import { registerFunctionView } from './FunctionViewRegistry';
import { PrincipalReadView, PrincipalFormView } from '@/components/views/principal';
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
// Client (客户) 视图配置 - TODO: 实现专属视图后取消注释
// ============================================================

// const clientConfig: FunctionViewConfig = {
//   function: 'client',
//   label: '客户',
//   views: {
//     read: ClientReadView,
//     form: ClientFormView,
//   },
//   availableModes: ['read', 'form', 'md'],
//   defaultMode: 'read',
//   actions: [
//     { id: 'edit', label: '编辑', icon: 'edit', handler: 'edit' },
//     { id: 'new-project', label: '新建项目', icon: 'plus', handler: 'newProject' },
//     { id: 'send-email', label: '发邮件', icon: 'mail', handler: 'sendEmail' },
//   ],
// };

// ============================================================
// EntityList (实体列表) 视图配置 - TODO
// ============================================================

// ============================================================
// Project (项目) 视图配置 - TODO
// ============================================================

// ============================================================
// Note (笔记) 视图配置
// ============================================================

// Note 类型无需专属视图，使用默认视图但禁用表单模式
// 这在 ViewModeConfig 中配置

// ============================================================
// 注册所有视图
// ============================================================

export function registerAllViews() {
  // 注册 Principal
  registerFunctionView(principalConfig);

  // TODO: 注册其他功能视图
  // registerFunctionView(clientConfig);
}

// 自动执行注册
registerAllViews();

export default registerAllViews;

