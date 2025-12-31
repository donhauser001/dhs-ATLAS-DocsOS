import type { ModalRegistry } from '@/components/modal'
import {
  createService,
  updateService,
  createServiceCategory,
  updateServiceCategory,
} from '@/api/service'
import {
  createConfig,
  updateConfig,
} from '@/api/config'
import {
  createDepartment,
  updateDepartment,
  createPosition,
  updatePosition,
} from '@/api/organization'
import {
  createUser,
  updateUser,
  resetUserPassword,
} from '@/api/auth'

// 表单组件 - 服务
import { CreateServiceForm, type CreateServiceFormData } from './service'
import { EditServiceForm, type EditServiceFormData } from './service'
import { CreateCategoryForm, type CreateCategoryFormData } from './category'
import { EditCategoryForm, type EditCategoryFormData } from './category'

// 表单组件 - 配置
import { CreateConfigForm, type CreateConfigFormData } from './config'
import { EditConfigForm, type EditConfigFormData } from './config'

// 表单组件 - 部门
import { DepartmentForm, type DepartmentFormData } from './department'

// 表单组件 - 职位
import { PositionForm, type PositionFormData } from './position'

// 表单组件 - 员工
import { ViewEmployeePanel } from './employee'
import { CreateEmployeeForm, type CreateEmployeeFormData } from './employee'
import { EditEmployeeForm, type EditEmployeeFormData } from './employee'
import { ResetPasswordForm, type ResetPasswordFormData } from './employee'

// ============================================================
// 弹窗注册表 - 所有弹窗在此注册
// ============================================================

export const modalRegistry: ModalRegistry = {
  // ========== 服务 ==========
  'service.create': {
    component: CreateServiceForm,
    meta: {
      title: '新建服务',
      width: 'lg',
    },
    onSubmit: async (data: CreateServiceFormData) => {
      const result = await createService({
        name: data.name,
        alias: data.alias || data.name.toLowerCase().replace(/\s+/g, '-'),
        category: data.category,
        price: {
          type: 'fixed',
          amount: data.price_amount,
          unit: data.price_unit,
          note: data.price_note || undefined,
        },
      })
      if (!result.success) {
        throw new Error(result.error?.message || '创建失败')
      }
    },
    invalidateKeys: [['services'], ['service-categories']],
  },

  'service.edit': {
    component: EditServiceForm,
    meta: {
      title: '编辑服务',
      width: 'lg',
    },
    onSubmit: async (data: EditServiceFormData, context) => {
      const service = context.props.service as { id: string }
      const result = await updateService(service.id, {
        name: data.name,
        alias: data.alias || data.name.toLowerCase().replace(/\s+/g, '-'),
        category: data.category,
        price: {
          type: data.price_type,
          amount: data.price_type === 'fixed' ? data.price_amount : undefined,
          base_amount: data.price_type === 'tiered' ? data.price_amount : undefined,
          unit: data.price_unit,
          note: data.price_note || undefined,
        },
        status: data.status,
      })
      if (!result.success) {
        throw new Error(result.error?.message || '更新失败')
      }
    },
    invalidateKeys: [['services'], ['service-categories']],
  },

  // ========== 分类 ==========
  'category.create': {
    component: CreateCategoryForm,
    meta: {
      title: '新建服务分类',
      width: 'lg',
    },
    onSubmit: async (data: CreateCategoryFormData) => {
      const result = await createServiceCategory({
        id: data.id,
        name: data.name.trim(),
        color: data.color,
        icon_key: data.icon_key,
        description: data.description.trim() || undefined,
      })
      if (!result.success) {
        throw new Error(result.error?.message || '创建失败')
      }
    },
    invalidateKeys: [['service-categories']],
  },

  'category.edit': {
    component: EditCategoryForm,
    meta: {
      title: '编辑分类',
      width: 'lg',
    },
    onSubmit: async (data: EditCategoryFormData, context) => {
      const category = context.props.category as { id: string }
      const result = await updateServiceCategory(category.id, {
        name: data.name.trim(),
        color: data.color,
        icon_key: data.icon_key,
        description: data.description.trim() || undefined,
      })
      if (!result.success) {
        throw new Error(result.error?.message || '更新失败')
      }
    },
    invalidateKeys: [['service-categories'], ['services']],
  },

  // ========== 配置 ==========
  'config.create': {
    component: CreateConfigForm,
    meta: {
      title: '新建配置',
      width: 'lg',
    },
    onSubmit: async (data: CreateConfigFormData) => {
      const result = await createConfig(data)
      if (!result.success) {
        throw new Error(result.error?.message || '创建失败')
      }
    },
    invalidateKeys: [['configs']],
  },

  'config.edit': {
    component: EditConfigForm,
    meta: {
      title: '编辑配置',
      width: 'lg',
    },
    onSubmit: async (data: EditConfigFormData, context) => {
      const config = context.props.config as { id: string }
      const result = await updateConfig(config.id, data)
      if (!result.success) {
        throw new Error(result.error?.message || '更新失败')
      }
    },
    invalidateKeys: [['configs']],
  },

  // ========== 部门 ==========
  'department.create': {
    component: DepartmentForm,
    meta: {
      title: '添加部门',
      width: 'md',
    },
    onSubmit: async (data: DepartmentFormData) => {
      const result = await createDepartment(data)
      if (!result.success) {
        throw new Error(result.error?.message || '创建失败')
      }
    },
    invalidateKeys: [['departments']],
  },

  'department.edit': {
    component: DepartmentForm,
    meta: {
      title: '编辑部门',
      width: 'md',
    },
    onSubmit: async (data: DepartmentFormData, context) => {
      const department = context.props.department as { id: string }
      const result = await updateDepartment(department.id, data)
      if (!result.success) {
        throw new Error(result.error?.message || '更新失败')
      }
    },
    invalidateKeys: [['departments']],
  },

  // ========== 职位 ==========
  'position.create': {
    component: PositionForm,
    meta: {
      title: '添加职位',
      width: 'md',
    },
    onSubmit: async (data: PositionFormData) => {
      const result = await createPosition(data)
      if (!result.success) {
        throw new Error(result.error?.message || '创建失败')
      }
    },
    invalidateKeys: [['positions']],
  },

  'position.edit': {
    component: PositionForm,
    meta: {
      title: '编辑职位',
      width: 'md',
    },
    onSubmit: async (data: PositionFormData, context) => {
      const position = context.props.position as { id: string }
      const result = await updatePosition(position.id, data)
      if (!result.success) {
        throw new Error(result.error?.message || '更新失败')
      }
    },
    invalidateKeys: [['positions']],
  },

  // ========== 员工 ==========
  'employee.view': {
    component: ViewEmployeePanel,
    meta: {
      title: '用户详情',
      width: 'lg',
    },
    // 查看面板不需要 onSubmit
  },

  'employee.create': {
    component: CreateEmployeeForm,
    meta: {
      title: '添加员工',
      width: '2xl',
    },
    onSubmit: async (data: CreateEmployeeFormData) => {
      const result = await createUser(data)
      if (!result.success) {
        throw new Error(result.error?.message || '创建失败')
      }
    },
    invalidateKeys: [['users']],
  },

  'employee.edit': {
    component: EditEmployeeForm,
    meta: {
      title: '编辑员工',
      width: '2xl',
    },
    onSubmit: async (data: EditEmployeeFormData, context) => {
      const user = context.props.user as { id: string }
      const result = await updateUser(user.id, data)
      if (!result.success) {
        throw new Error(result.error?.message || '更新失败')
      }
    },
    invalidateKeys: [['users']],
  },

  'employee.reset-password': {
    component: ResetPasswordForm,
    meta: {
      title: '重置密码',
      width: 'sm',
    },
    onSubmit: async (data: ResetPasswordFormData, context) => {
      const user = context.props.user as { id: string }
      const result = await resetUserPassword(user.id, data.newPassword)
      if (!result.success) {
        throw new Error(result.error?.message || '重置失败')
      }
    },
  },
}
