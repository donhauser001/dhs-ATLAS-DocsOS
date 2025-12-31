import { executeCommand, type CommandResult } from './command'

// ============ 类型定义 ============

export interface ServicePrice {
  type: 'fixed' | 'tiered'
  amount?: number
  base_amount?: number
  unit: string
  note?: string
  tiers?: Array<{
    min: number
    max: number | null
    discount: number
  }>
  extras?: Array<{
    name: string
    amount: number
    unit: string
  }>
}

export interface ServiceCategory {
  id: string
  name: string
  color: string
  icon_key: string
  description?: string
  service_count: number
}

export interface Service {
  id: string
  name: string
  alias: string
  slug: string  // 英文URL标识符
  category: string
  category_name?: string
  category_color?: string
  price: ServicePrice
  status: 'active' | 'inactive'
  created: string
  updated: string
  content?: string
}

export interface ServicesCatalog {
  metadata: {
    version: string
    currency: string
    updated: string
    author?: string
    pricing_rules?: string[]
  }
  categories: ServiceCategory[]
  services: Service[]
}

// ============ 服务清单 ============

// 获取完整服务清单（供 AI 使用）
export async function getServicesCatalog(): Promise<CommandResult<{
  catalog: ServicesCatalog
}>> {
  return executeCommand('service.catalog.get', {})
}

// ============ 分类管理 ============

// 获取服务分类列表
export async function getServiceCategories(): Promise<CommandResult<{
  categories: ServiceCategory[]
  total: number
}>> {
  return executeCommand('service.category.list', {})
}

// 创建服务分类
export async function createServiceCategory(data: {
  id: string
  name: string
  color?: string
  icon_key?: string
  description?: string
}): Promise<CommandResult<{
  id: string
}>> {
  return executeCommand('service.category.create', data)
}

// 更新服务分类
export async function updateServiceCategory(
  id: string,
  updates: {
    name?: string
    color?: string
    icon_key?: string
    description?: string
  }
): Promise<CommandResult<{
  updated: boolean
}>> {
  return executeCommand('service.category.update', { id, updates })
}

// 删除服务分类
export async function deleteServiceCategory(id: string): Promise<CommandResult<{
  deleted: string
}>> {
  return executeCommand('service.category.delete', { id })
}

// ============ 服务管理 ============

// 获取服务列表
export async function getServices(params?: {
  category?: string
  status?: 'active' | 'inactive'
}): Promise<CommandResult<{
  services: Service[]
  total: number
}>> {
  return executeCommand('service.list', params || {})
}

// 获取服务详情
export async function getServiceDetail(id: string): Promise<CommandResult<{
  service: Service
}>> {
  return executeCommand('service.get', { id })
}

// 创建服务
export async function createService(data: {
  name: string
  alias?: string
  slug?: string
  category: string
  price: ServicePrice
  content?: string
}): Promise<CommandResult<{
  id: string
}>> {
  return executeCommand('service.create', data)
}

// 更新服务
export async function updateService(
  id: string,
  updates: {
    name?: string
    alias?: string
    slug?: string
    category?: string
    price?: ServicePrice
    status?: 'active' | 'inactive'
    content?: string
  }
): Promise<CommandResult<{
  updated: boolean
}>> {
  return executeCommand('service.update', { id, updates })
}

// 删除服务
export async function deleteService(id: string): Promise<CommandResult<{
  deleted: string
}>> {
  return executeCommand('service.delete', { id })
}

// ============ 辅助函数 ============

// 获取服务显示价格
export function getServiceDisplayPrice(price: ServicePrice): string {
  if (price.type === 'fixed') {
    return `¥${(price.amount || 0).toLocaleString()}`
  } else if (price.type === 'tiered') {
    return `¥${(price.base_amount || 0).toLocaleString()} 起`
  }
  return '-'
}

// 注意：图标处理已迁移到 @/components/ui/icon-picker
