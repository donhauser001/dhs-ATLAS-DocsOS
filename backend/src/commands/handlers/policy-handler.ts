/**
 * 价格政策命令处理器
 */

import { writeFile, readFile } from '../../git/file-operations.js'
import type { Operator, CommandResult } from '../command-engine.js'

const POLICY_FILE_PATH = 'workspace/服务定价/价格政策.md'

// ============================================================
// 类型定义
// ============================================================

interface PolicyTier {
  min: number
  max: number | null
  rate: number
  label: string
}

interface Policy {
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

interface ParsedPolicyFile {
  metadata: Record<string, any>
  policies: Policy[]
}

// ============================================================
// 文件解析
// ============================================================

async function parsePolicyFile(): Promise<ParsedPolicyFile> {
  const content = await readFile(POLICY_FILE_PATH)
  
  if (!content) {
    return {
      metadata: { version: '1.0', updated: new Date().toISOString().split('T')[0] },
      policies: []
    }
  }
  const policies: Policy[] = []
  let metadata: Record<string, any> = {}

  // 解析 YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (frontmatterMatch) {
    const lines = frontmatterMatch[1].split('\n')
    let currentKey = ''
    
    for (const line of lines) {
      if (line.startsWith('#')) continue
      const keyMatch = line.match(/^(\w+):(.*)/)
      if (keyMatch) {
        currentKey = keyMatch[1]
        const value = keyMatch[2].trim()
        if (value && !value.startsWith('|')) {
          metadata[currentKey] = value.replace(/^["']|["']$/g, '')
        }
      }
    }
  }

  // 解析政策 YAML 块
  const yamlBlockRegex = /### ([^\n{]+)\s*\{#([^}]+)\}\s*\n\n```yaml\n([\s\S]*?)```/g
  let match

  while ((match = yamlBlockRegex.exec(content)) !== null) {
    const yamlContent = match[3]
    const policy = parseYamlBlock(yamlContent)
    if (policy && policy.id) {
      policies.push(policy as Policy)
    }
  }

  return { metadata, policies }
}

function parseYamlBlock(yaml: string): Partial<Policy> {
  const result: Record<string, any> = {}
  const lines = yaml.split('\n')
  let currentKey = ''
  let inArray = false
  let arrayItems: any[] = []
  let inTiers = false
  let currentTier: Record<string, any> = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // 处理阶梯数组
    if (inTiers) {
      if (trimmed.startsWith('- min:')) {
        if (Object.keys(currentTier).length > 0) {
          arrayItems.push(currentTier)
        }
        currentTier = { min: parseInt(trimmed.split(':')[1].trim()) }
      } else if (trimmed.startsWith('max:')) {
        const val = trimmed.split(':')[1].trim()
        currentTier.max = val === 'null' ? null : parseInt(val)
      } else if (trimmed.startsWith('rate:')) {
        currentTier.rate = parseInt(trimmed.split(':')[1].trim())
      } else if (trimmed.startsWith('label:')) {
        currentTier.label = trimmed.split(':')[1].trim()
      } else if (!trimmed.startsWith('-') && trimmed.includes(':')) {
        // 新的顶级键，结束 tiers
        if (Object.keys(currentTier).length > 0) {
          arrayItems.push(currentTier)
        }
        result.tiers = arrayItems
        arrayItems = []
        inTiers = false
        currentTier = {}
        
        const [key, ...valueParts] = trimmed.split(':')
        const value = valueParts.join(':').trim()
        if (key && value) {
          result[key] = parseValue(value)
        }
      }
      continue
    }

    // 处理普通数组
    if (inArray) {
      if (trimmed.startsWith('-')) {
        arrayItems.push(trimmed.slice(1).trim())
      } else if (trimmed.includes(':')) {
        result[currentKey] = arrayItems
        arrayItems = []
        inArray = false
        
        const [key, ...valueParts] = trimmed.split(':')
        const value = valueParts.join(':').trim()
        if (key && value) {
          result[key] = parseValue(value)
        } else if (key) {
          currentKey = key
        }
      }
      continue
    }

    // 处理键值对
    const colonIndex = trimmed.indexOf(':')
    if (colonIndex > 0) {
      const key = trimmed.slice(0, colonIndex).trim()
      const value = trimmed.slice(colonIndex + 1).trim()

      if (key === 'tiers' && !value) {
        inTiers = true
        arrayItems = []
        currentTier = {}
      } else if (key === 'applicable' || key === 'conditions') {
        if (!value) {
          inArray = true
          currentKey = key
          arrayItems = []
        } else if (value.startsWith('[') && value.endsWith(']')) {
          result[key] = value.slice(1, -1).split(',').map(s => s.trim())
        }
      } else if (value) {
        result[key] = parseValue(value)
      } else {
        currentKey = key
      }
    }
  }

  // 处理末尾的数组/阶梯
  if (inTiers && Object.keys(currentTier).length > 0) {
    arrayItems.push(currentTier)
    result.tiers = arrayItems
  } else if (inArray && arrayItems.length > 0) {
    result[currentKey] = arrayItems
  }

  return result
}

function parseValue(value: string): any {
  if (value === 'null') return null
  if (value === 'true') return true
  if (value === 'false') return false
  if (/^\d+$/.test(value)) return parseInt(value)
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value)
  return value.replace(/^["']|["']$/g, '')
}

// ============================================================
// 文件写入
// ============================================================

async function writePolicyFile(metadata: Record<string, any>, policies: Policy[]): Promise<void> {
  const uniformPolicies = policies.filter(p => p.type === 'uniform')
  const tieredPolicies = policies.filter(p => p.type === 'tiered')

  let content = `---
# ============================================================
# 价格政策 - 全局配置
# ============================================================
version: "${metadata.version || '1.0'}"
updated: ${new Date().toISOString().split('T')[0]}
author: system

# 政策类型说明
policy_types:
  - type: uniform
    name: 统一折扣
    description: 所有项目按统一比例计价
  - type: tiered
    name: 阶梯折扣
    description: 根据数量区间按不同比例计价
---

# 价格政策

> 本文档定义了所有价格政策，用于批量订单、会员优惠等场景的计价。

---

## 统一折扣政策

`

  for (const policy of uniformPolicies) {
    content += generatePolicySection(policy)
  }

  if (uniformPolicies.length === 0) {
    content += `暂无统一折扣政策。

---

`
  }

  content += `## 阶梯折扣政策

`

  for (const policy of tieredPolicies) {
    content += generatePolicySection(policy)
  }

  if (tieredPolicies.length === 0) {
    content += `暂无阶梯折扣政策。
`
  }

  await writeFile(POLICY_FILE_PATH, content)
}

function generatePolicySection(policy: Policy): string {
  let section = `### ${policy.name} {#policy-${policy.id}}

\`\`\`yaml
id: ${policy.id}
name: ${policy.name}
type: ${policy.type}
`

  if (policy.type === 'uniform') {
    section += `discount: ${policy.discount}
`
  }

  if (policy.description) {
    section += `description: ${policy.description}
`
  }

  if (policy.type === 'tiered' && policy.tiers) {
    section += `tiers:
`
    for (const tier of policy.tiers) {
      section += `  - min: ${tier.min}
    max: ${tier.max === null ? 'null' : tier.max}
    rate: ${tier.rate}
    label: ${tier.label}
`
    }
  }

  if (policy.applicable && policy.applicable.length > 0) {
    section += `applicable:
`
    for (const item of policy.applicable) {
      section += `  - ${item}
`
    }
  }

  if (policy.conditions && policy.conditions.length > 0) {
    section += `conditions:
`
    for (const item of policy.conditions) {
      section += `  - ${item}
`
    }
  }

  section += `status: ${policy.status}
created_at: ${policy.created_at}
updated_at: ${policy.updated_at}
\`\`\`

`

  if (policy.description) {
    section += `${policy.description}

`
  }

  section += `---

`

  return section
}

// ============================================================
// 命令处理器
// ============================================================

export async function executePolicyCommand(
  commandName: string,
  params: Record<string, unknown>,
  operator: Operator
): Promise<CommandResult> {
  switch (commandName) {
    case 'policy.list':
      return await handlePolicyList(params)
    case 'policy.get':
      return await handlePolicyGet(params)
    case 'policy.create':
      return await handlePolicyCreate(params)
    case 'policy.update':
      return await handlePolicyUpdate(params)
    case 'policy.delete':
      return await handlePolicyDelete(params)
    case 'policy.calculate':
      return await handlePolicyCalculate(params)
    default:
      return {
        success: false,
        error: {
          code: 'UNKNOWN_COMMAND',
          message: `未知命令: ${commandName}`
        }
      }
  }
}

async function handlePolicyList(params: Record<string, unknown>): Promise<CommandResult> {
  const { policies } = await parsePolicyFile()
  
  let filtered = policies
  
  if (params.type) {
    filtered = filtered.filter(p => p.type === params.type)
  }
  
  if (params.status) {
    filtered = filtered.filter(p => p.status === params.status)
  }

  return {
    success: true,
    result: { 
      policies: filtered,
      total: filtered.length
    }
  }
}

async function handlePolicyGet(params: Record<string, unknown>): Promise<CommandResult> {
  const { policies } = await parsePolicyFile()
  const policy = policies.find(p => p.id === params.id)

  if (!policy) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `政策不存在: ${params.id}`
      }
    }
  }

  return {
    success: true,
    result: { policy }
  }
}

async function handlePolicyCreate(params: Record<string, unknown>): Promise<CommandResult> {
  const { metadata, policies } = await parsePolicyFile()

  // 验证
  if (policies.some(p => p.id === params.id)) {
    return {
      success: false,
      error: {
        code: 'ALREADY_EXISTS',
        message: `政策ID已存在: ${params.id}`
      }
    }
  }

  if (params.type === 'uniform' && !params.discount) {
    return {
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: '统一折扣政策必须指定 discount'
      }
    }
  }

  const tiers = params.tiers as PolicyTier[] | undefined
  if (params.type === 'tiered' && (!tiers || tiers.length === 0)) {
    return {
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: '阶梯折扣政策必须指定 tiers'
      }
    }
  }

  const now = new Date().toISOString().split('T')[0]
  const newPolicy: Policy = {
    id: params.id as string,
    name: params.name as string,
    type: params.type as 'uniform' | 'tiered',
    discount: params.discount as number | undefined,
    tiers: tiers,
    description: params.description as string | undefined,
    applicable: params.applicable as string[] | undefined,
    conditions: params.conditions as string[] | undefined,
    status: 'active',
    created_at: now,
    updated_at: now
  }

  policies.push(newPolicy)
  await writePolicyFile(metadata, policies)

  return {
    success: true,
    result: { id: params.id }
  }
}

async function handlePolicyUpdate(params: Record<string, unknown>): Promise<CommandResult> {
  const { metadata, policies } = await parsePolicyFile()
  const index = policies.findIndex(p => p.id === params.id)

  if (index === -1) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `政策不存在: ${params.id}`
      }
    }
  }

  const policy = policies[index]
  const updates = params.updates as Record<string, unknown> || {}
  
  const updated: Policy = {
    ...policy,
    name: (updates.name as string) || policy.name,
    discount: (updates.discount as number) ?? policy.discount,
    tiers: (updates.tiers as PolicyTier[]) || policy.tiers,
    description: (updates.description as string) ?? policy.description,
    applicable: (updates.applicable as string[]) || policy.applicable,
    conditions: (updates.conditions as string[]) || policy.conditions,
    status: (updates.status as 'active' | 'inactive') || policy.status,
    updated_at: new Date().toISOString().split('T')[0]
  }

  policies[index] = updated
  await writePolicyFile(metadata, policies)

  return {
    success: true,
    result: { updated: true }
  }
}

async function handlePolicyDelete(params: Record<string, unknown>): Promise<CommandResult> {
  const { metadata, policies } = await parsePolicyFile()
  const index = policies.findIndex(p => p.id === params.id)

  if (index === -1) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `政策不存在: ${params.id}`
      }
    }
  }

  const deleted = policies.splice(index, 1)[0]
  await writePolicyFile(metadata, policies)

  return {
    success: true,
    result: { deleted: params.id }
  }
}

async function handlePolicyCalculate(params: Record<string, unknown>): Promise<CommandResult> {
  const { policies } = await parsePolicyFile()
  const policy = policies.find(p => p.id === params.policy_id)

  if (!policy) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `政策不存在: ${params.policy_id}`
      }
    }
  }

  const unitPrice = params.unit_price as number
  const quantity = params.quantity as number
  const originalPrice = unitPrice * quantity
  let finalPrice = 0
  let breakdown: any[] = []

  if (policy.type === 'uniform') {
    // 统一折扣
    const rate = (policy.discount || 100) / 100
    finalPrice = originalPrice * rate
    breakdown = [{
      label: `全单 ${policy.discount}%`,
      quantity: quantity,
      unit_price: unitPrice,
      rate: policy.discount,
      subtotal: finalPrice
    }]
  } else if (policy.type === 'tiered' && policy.tiers) {
    // 阶梯折扣
    let remaining = quantity
    let position = 1

    for (const tier of policy.tiers) {
      if (remaining <= 0) break

      const tierStart = tier.min
      const tierEnd = tier.max === null ? Infinity : tier.max
      const tierQuantity = Math.min(remaining, tierEnd - position + 1)

      if (tierQuantity > 0 && position <= tierEnd) {
        const subtotal = unitPrice * tierQuantity * (tier.rate / 100)
        finalPrice += subtotal
        breakdown.push({
          label: tier.label,
          quantity: tierQuantity,
          unit_price: unitPrice,
          rate: tier.rate,
          subtotal
        })
        remaining -= tierQuantity
        position += tierQuantity
      }
    }
  }

  return {
    success: true,
    result: {
      original_price: originalPrice,
      final_price: Math.round(finalPrice * 100) / 100,
      discount_amount: Math.round((originalPrice - finalPrice) * 100) / 100,
      breakdown
    }
  }
}
