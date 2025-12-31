const API_BASE = '/api'

export interface ApiResponse<T> {
  success: boolean
  result?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  commit?: {
    hash: string
    message: string
  }
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${path}`)
  return response.json()
}

export async function apiPost<T>(
  path: string,
  body: unknown
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return response.json()
}

