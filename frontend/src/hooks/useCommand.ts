import { useMutation, useQueryClient } from '@tanstack/react-query'
import { executeCommand, type CommandResult, type Operator } from '@/api/command'

interface UseCommandOptions {
  onSuccess?: (result: CommandResult) => void
  onError?: (error: Error) => void
  invalidateKeys?: string[][]
}

export function useCommand<TParams extends Record<string, unknown>, TResult = Record<string, unknown>>(
  commandName: string,
  options: UseCommandOptions = {}
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      params,
      operator,
    }: {
      params: TParams
      operator?: Operator
    }) => {
      const result = await executeCommand<TResult>(commandName, params, operator)
      
      if (!result.success) {
        throw new Error(result.error?.message || '执行失败')
      }
      
      return result
    },
    onSuccess: (result) => {
      // 失效相关查询
      const keysToInvalidate = options.invalidateKeys || [
        ['projects'],
        ['tasks'],
      ]
      
      keysToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })

      options.onSuccess?.(result as CommandResult)
    },
    onError: (error) => {
      options.onError?.(error as Error)
    },
  })
}

// 便捷 hooks

export function useCreateProject() {
  return useCommand<{
    name: string
    client: string
    type?: string
    deadline?: string
    budget?: number
    manager: string
    team?: string[]
  }>('project.create')
}

export function useUpdateProject() {
  return useCommand<{
    project_id: string
    updates: Record<string, unknown>
  }>('project.update')
}

export function useCreateTask() {
  return useCommand<{
    project_id: string
    title: string
    assignee: string
    priority?: string
    deadline?: string
    description?: string
  }>('task.create')
}

export function useUpdateTask() {
  return useCommand<{
    task_id: string
    updates: Record<string, unknown>
  }>('task.update')
}

export function useTransitionTask() {
  return useCommand<{
    task_id: string
    event: string
    comment?: string
  }>('task.transition')
}

