import { useQuery } from '@tanstack/react-query'
import {
  getProjects,
  getProject,
  getProjectTasks,
  getTask,
  getUsers,
  getStateMachines,
  getStateMachine,
} from '@/api/query'

export function useProjects(params?: {
  year?: number
  status?: string
  manager?: string
}) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const response = await getProjects(params)
      if (!response.success) {
        throw new Error(response.error?.message || '加载项目失败')
      }
      return response
    },
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await getProject(id)
      if (!response.success) {
        throw new Error(response.error?.message || '加载项目失败')
      }
      return response.project!
    },
    enabled: !!id,
  })
}

export function useProjectTasks(
  projectId: string,
  params?: { status?: string; assignee?: string }
) {
  return useQuery({
    queryKey: ['tasks', projectId, params],
    queryFn: async () => {
      const response = await getProjectTasks(projectId, params)
      if (!response.success) {
        throw new Error(response.error?.message || '加载任务失败')
      }
      return response
    },
    enabled: !!projectId,
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const response = await getTask(id)
      if (!response.success) {
        throw new Error(response.error?.message || '加载任务失败')
      }
      return response.task!
    },
    enabled: !!id,
  })
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await getUsers()
      if (!response.success) {
        throw new Error(response.error?.message || '加载用户失败')
      }
      return response.users!
    },
  })
}

export function useStateMachines() {
  return useQuery({
    queryKey: ['state-machines'],
    queryFn: async () => {
      const response = await getStateMachines()
      if (!response.success) {
        throw new Error(response.error?.message || '加载状态机失败')
      }
      return response.state_machines!
    },
  })
}

export function useStateMachine(name: string) {
  return useQuery({
    queryKey: ['state-machine', name],
    queryFn: async () => {
      const response = await getStateMachine(name)
      if (!response.success) {
        throw new Error(response.error?.message || '加载状态机失败')
      }
      return response.state_machine!
    },
    enabled: !!name,
  })
}

