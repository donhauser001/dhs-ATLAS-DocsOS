import { apiPost, apiGet, type ApiResponse } from './client'

export interface Operator {
  type: 'human' | 'ai'
  id: string
  name?: string
}

export interface CommandResult<T = Record<string, unknown>> {
  success: boolean
  result?: T
  commit?: {
    hash: string
    message: string
  }
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

// 默认操作者（后续从 auth 获取）
const defaultOperator: Operator = {
  type: 'human',
  id: 'admin',
  name: '管理员',
}

/**
 * 执行 Command
 */
export async function executeCommand<T = Record<string, unknown>>(
  command: string,
  params: Record<string, unknown>,
  operator: Operator = defaultOperator
): Promise<CommandResult<T>> {
  const response = await apiPost<T>('/command', {
    command,
    params,
    operator,
  })

  return response as CommandResult<T>
}

/**
 * 获取所有 Command 定义
 */
export async function getCommands(): Promise<ApiResponse<{ commands: CommandDefinition[] }>> {
  return apiGet('/commands')
}

export interface CommandDefinition {
  name: string
  description: string
  parameters: Record<string, ParameterDef>
  returns?: Record<string, { type: string; description?: string }>
  side_effects?: string[]
  examples?: Array<{
    description: string
    input: Record<string, unknown>
    output: Record<string, unknown>
  }>
}

export interface ParameterDef {
  type: string
  required?: boolean
  default?: unknown
  description?: string
  source?: string
  values?: string[]
}

