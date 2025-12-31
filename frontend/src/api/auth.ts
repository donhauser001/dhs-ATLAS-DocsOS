import type { User } from '@/stores/auth'

const API_BASE = '/api/auth'

interface LoginResponse {
  success: boolean
  token?: string
  user?: User
  error?: {
    code: string
    message: string
  }
}

interface UsersResponse {
  success: boolean
  users?: User[]
  total?: number
  error?: {
    code: string
    message: string
  }
}

interface UserResponse {
  success: boolean
  user?: User
  error?: {
    code: string
    message: string
  }
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('atlas-auth')
  if (token) {
    try {
      const parsed = JSON.parse(token)
      if (parsed.state?.token) {
        return {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parsed.state.token}`,
        }
      }
    } catch {
      // ignore
    }
  }
  return {
    'Content-Type': 'application/json',
  }
}

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return response.json()
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
}

export async function getMe(): Promise<UserResponse> {
  const response = await fetch(`${API_BASE}/me`, {
    headers: getAuthHeaders(),
  })
  return response.json()
}

export async function getUsers(): Promise<UsersResponse> {
  const response = await fetch(`${API_BASE}/users`, {
    headers: getAuthHeaders(),
  })
  return response.json()
}

export async function createUser(data: {
  username: string
  password: string
  name: string
  email: string
  role: User['role']
  phone?: string
  id_card?: string
  emergency_contact?: string
  emergency_phone?: string
  department?: string
  position?: string
  bio?: string
}): Promise<UserResponse> {
  const response = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function updateUser(
  id: string,
  data: Partial<{
    username: string
    name: string
    email: string
    phone: string
    id_card: string
    emergency_contact: string
    emergency_phone: string
    department: string
    position: string
    bio: string
    avatar: string
    role: User['role']
    status: User['status']
  }>
): Promise<UserResponse> {
  const response = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function resetUserPassword(
  id: string,
  newPassword: string
): Promise<{ success: boolean; error?: { message: string } }> {
  const response = await fetch(`${API_BASE}/users/${id}/password`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ newPassword }),
  })
  return response.json()
}

export async function deleteUser(
  id: string
): Promise<{ success: boolean; error?: { message: string } }> {
  const response = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  return response.json()
}

export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: { message: string } }> {
  const response = await fetch(`${API_BASE}/password`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ oldPassword, newPassword }),
  })
  return response.json()
}

