import type { ComponentType } from 'react'

// ============================================================
// 弹窗系统类型定义
// ============================================================

/** 表单组件 Props - 所有表单必须接收这些 */
export interface FormComponentProps<TData = Record<string, unknown>> {
  /** 提交表单数据 */
  onSubmit: (data: TData) => void
  /** 取消操作 */
  onCancel: () => void
  /** 初始数据 */
  initialData?: Partial<TData>
  /** 是否正在提交 */
  submitting?: boolean
  /** 错误信息 */
  error?: string
  /** 额外的 props（由调用方传入） */
  [key: string]: unknown
}

/** 表单组件元数据 */
export interface FormMeta {
  /** 弹窗标题 */
  title: string
  /** 弹窗宽度 */
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

/** 注册表条目 - 使用 any 来允许类型灵活性 */
export interface ModalRegistryEntry {
  /** 表单组件 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>
  /** 元数据 */
  meta: FormMeta
  /** 提交处理函数 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit?: (data: any, context: SubmitContext) => Promise<void>
  /** 成功后刷新的 query keys */
  invalidateKeys?: string[][]
}

/** 提交上下文 */
export interface SubmitContext {
  /** 额外 props（调用时传入的） */
  props: Record<string, unknown>
}

/** 弹窗注册表类型 */
export type ModalRegistry = Record<string, ModalRegistryEntry>

/** 打开弹窗的选项 */
export interface OpenModalOptions {
  /** 成功后回调 */
  onSuccess?: () => void
  /** 初始表单数据 */
  initialData?: Record<string, unknown>
}

/** 简化的表单 Props 类型（用于表单组件定义） */
export interface FormProps<TData = Record<string, unknown>> {
  onSubmit: (data: TData) => void | Promise<void>
  onCancel: () => void
}
