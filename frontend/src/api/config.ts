import { executeCommand, type CommandResult } from './command'

// ============ 类型定义 ============

export interface ServiceConfig {
  id: string
  name: string
  draft_count: number
  max_count: number
  lead_ratio: number
  assistant_ratio: number
  content?: string
}

// ============ 配置管理 ============

// 获取配置列表
export async function getConfigs(): Promise<CommandResult<{
  configs: ServiceConfig[]
  total: number
}>> {
  return executeCommand('config.list', {})
}

// 获取配置详情
export async function getConfigDetail(id: string): Promise<CommandResult<{
  config: ServiceConfig
}>> {
  return executeCommand('config.get', { id })
}

// 创建配置
export async function createConfig(data: {
  id: string
  name: string
  draft_count: number
  max_count: number
  lead_ratio: number
  assistant_ratio: number
  content?: string
}): Promise<CommandResult<{
  id: string
}>> {
  return executeCommand('config.create', data)
}

// 更新配置
export async function updateConfig(
  id: string,
  updates: {
    name?: string
    draft_count?: number
    max_count?: number
    lead_ratio?: number
    assistant_ratio?: number
    content?: string
  }
): Promise<CommandResult<{
  updated: boolean
}>> {
  return executeCommand('config.update', { id, updates })
}

// 删除配置
export async function deleteConfig(id: string): Promise<CommandResult<{
  deleted: string
}>> {
  return executeCommand('config.delete', { id })
}

// ============ 辅助函数 ============

// 格式化百分比显示
export function formatRatio(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

