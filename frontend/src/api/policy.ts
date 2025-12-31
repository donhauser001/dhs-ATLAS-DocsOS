/**
 * 价格政策 API
 */

import { executeCommand } from './command'

// ============================================================
// 类型定义
// ============================================================

export interface PolicyTier {
  min: number
  max: number | null
  rate: number
  label: string
}

export interface Policy {
  id: string
  name: string
  type: 'uniform' | 'tiered'
  discount?: number
  tiers?: PolicyTier[]
  description?: string
  applicable?: string[]
  conditions?: string[]
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface PolicyCalculation {
  original_price: number
  final_price: number
  discount_amount: number
  breakdown: {
    label: string
    quantity: number
    unit_price: number
    rate: number
    subtotal: number
  }[]
}

// ============================================================
// API 函数
// ============================================================

/**
 * 获取价格政策列表
 */
export async function getPolicies(params?: {
  type?: 'uniform' | 'tiered'
  status?: 'active' | 'inactive'
}): Promise<{ policies: Policy[]; total: number }> {
  const result = await executeCommand('policy.list', params || {})
  return result as { policies: Policy[]; total: number }
}

/**
 * 获取单个政策详情
 */
export async function getPolicy(id: string): Promise<Policy> {
  const result = await executeCommand('policy.get', { id })
  return (result as { policy: Policy }).policy
}

/**
 * 创建价格政策
 */
export async function createPolicy(data: {
  id: string
  name: string
  type: 'uniform' | 'tiered'
  discount?: number
  tiers?: PolicyTier[]
  description?: string
  applicable?: string[]
  conditions?: string[]
}): Promise<{ id: string }> {
  const result = await executeCommand('policy.create', data)
  return result as { id: string }
}

/**
 * 更新价格政策
 */
export async function updatePolicy(
  id: string,
  updates: Partial<Omit<Policy, 'id' | 'type' | 'created_at'>>
): Promise<{ updated: boolean }> {
  const result = await executeCommand('policy.update', { id, updates })
  return result as { updated: boolean }
}

/**
 * 删除价格政策
 */
export async function deletePolicy(id: string): Promise<{ deleted: string }> {
  const result = await executeCommand('policy.delete', { id })
  return result as { deleted: string }
}

/**
 * 计算折扣价格
 */
export async function calculatePrice(
  policyId: string,
  unitPrice: number,
  quantity: number
): Promise<PolicyCalculation> {
  const result = await executeCommand('policy.calculate', {
    policy_id: policyId,
    unit_price: unitPrice,
    quantity
  })
  return result as PolicyCalculation
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 获取政策类型标签
 */
export function getPolicyTypeLabel(type: Policy['type']): string {
  const labels: Record<Policy['type'], string> = {
    uniform: '统一折扣',
    tiered: '阶梯折扣'
  }
  return labels[type]
}

/**
 * 获取政策类型颜色
 */
export function getPolicyTypeColor(type: Policy['type']): string {
  const colors: Record<Policy['type'], string> = {
    uniform: '#3b82f6',
    tiered: '#8b5cf6'
  }
  return colors[type]
}

/**
 * 格式化折扣显示
 */
export function formatDiscount(discount: number): string {
  if (discount === 100) return '原价'
  if (discount % 10 === 0) return `${discount / 10}折`
  return `${discount}%`
}

/**
 * 格式化阶梯范围
 */
export function formatTierRange(tier: PolicyTier): string {
  if (tier.min === tier.max) {
    return `第${tier.min}项`
  }
  if (tier.max === null) {
    return `第${tier.min}项及以上`
  }
  return `第${tier.min}-${tier.max}项`
}

/**
 * 获取政策折扣概述
 */
export function getPolicyDiscountSummary(policy: Policy): string {
  if (policy.type === 'uniform') {
    return formatDiscount(policy.discount || 100)
  }
  
  if (policy.tiers && policy.tiers.length > 0) {
    const minRate = Math.min(...policy.tiers.map(t => t.rate))
    const maxRate = Math.max(...policy.tiers.map(t => t.rate))
    if (minRate === maxRate) {
      return formatDiscount(minRate)
    }
    return `${formatDiscount(maxRate)} ~ ${formatDiscount(minRate)}`
  }
  
  return '-'
}

