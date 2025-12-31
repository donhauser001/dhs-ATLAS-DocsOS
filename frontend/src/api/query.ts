// ============ 类型定义 ============

export interface Project {
  id: string
  name: string
  client: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  type: string
  created: string
  deadline?: string
  budget?: number
  manager: string
  team: string[]
  tags: string[]
  path: string
  task_count?: number
}

export interface Task {
  id: string
  title: string
  assignee: string
  status: 'pending' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high'
  deadline?: string
  created: string
  updated: string
  description?: string
  projectId: string
  path: string
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
}

export interface StateMachine {
  name: string
  initial: string
  states: Record<string, {
    display: string
    icon: string
    color: string
    transitions?: Array<{
      event: string
      target: string
      description?: string
    }>
  }>
}

interface BaseResponse {
  success: boolean
  error?: {
    code: string
    message: string
  }
}

interface ProjectsResponse extends BaseResponse {
  projects?: Project[]
  total?: number
}

interface ProjectResponse extends BaseResponse {
  project?: Project
}

interface TasksResponse extends BaseResponse {
  tasks?: Task[]
  total?: number
}

interface TaskResponse extends BaseResponse {
  task?: Task
}

interface UsersResponse extends BaseResponse {
  users?: User[]
}

interface StateMachinesResponse extends BaseResponse {
  state_machines?: StateMachine[]
}

interface StateMachineResponse extends BaseResponse {
  state_machine?: StateMachine
}

// ============ API 函数 ============

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`)
  return response.json()
}

export async function getProjects(params?: {
  year?: number
  status?: string
  manager?: string
}): Promise<ProjectsResponse> {
  const searchParams = new URLSearchParams()
  if (params?.year) searchParams.set('year', String(params.year))
  if (params?.status) searchParams.set('status', params.status)
  if (params?.manager) searchParams.set('manager', params.manager)

  const query = searchParams.toString()
  return apiGet<ProjectsResponse>(`/projects${query ? `?${query}` : ''}`)
}

export async function getProject(id: string): Promise<ProjectResponse> {
  return apiGet<ProjectResponse>(`/projects/${id}`)
}

export async function getProjectTasks(projectId: string, params?: {
  status?: string
  assignee?: string
}): Promise<TasksResponse> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.assignee) searchParams.set('assignee', params.assignee)

  const query = searchParams.toString()
  return apiGet<TasksResponse>(`/projects/${projectId}/tasks${query ? `?${query}` : ''}`)
}

export async function getTask(id: string): Promise<TaskResponse> {
  return apiGet<TaskResponse>(`/tasks/${id}`)
}

export async function getUsers(): Promise<UsersResponse> {
  return apiGet<UsersResponse>('/users')
}

export async function getStateMachines(): Promise<StateMachinesResponse> {
  return apiGet<StateMachinesResponse>('/state-machines')
}

export async function getStateMachine(name: string): Promise<StateMachineResponse> {
  return apiGet<StateMachineResponse>(`/state-machines/${name}`)
}

