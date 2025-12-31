// 组织管理 API

const API_BASE = '/api/organization'

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

export interface CompanyInfo {
  // 基本信息
  full_name: string
  short_name: string
  logo: string
  description: string
  // 工商信息
  credit_code: string
  business_license_file: string
  bank_name: string
  bank_account: string
  bank_permit_number: string
  bank_permit_file: string
  legal_person_name: string
  legal_person_phone: string
  legal_person_id: string
  legal_person_id_file: string
  // 联系人
  contact_employee_id: string
  contact_name: string
  contact_phone: string
  contact_email: string
  // 地址
  registered_address: string
  delivery_address: string
  // 开票资料
  invoice_title: string
  invoice_tax_number: string
  invoice_bank_name: string
  invoice_bank_account: string
  invoice_address: string
  invoice_phone: string
}

interface CompanyResponse {
  success: boolean
  data?: CompanyInfo
  error?: {
    code: string
    message: string
  }
}

interface UpdateResponse {
  success: boolean
  message?: string
  error?: {
    code: string
    message: string
  }
}

/**
 * 获取企业资料
 */
export async function getCompanyInfo(): Promise<CompanyResponse> {
  const response = await fetch(`${API_BASE}/company`, {
    headers: getAuthHeaders(),
  })
  return response.json()
}

/**
 * 更新企业资料
 */
export async function updateCompanyInfo(data: Partial<CompanyInfo>): Promise<UpdateResponse> {
  const response = await fetch(`${API_BASE}/company`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  return response.json()
}

// ==================== 部门管理 ====================

export interface Department {
  id: string
  name: string
  code: string
  description?: string
  status: 'active' | 'inactive'
  created_at: string
}

interface DepartmentsResponse {
  success: boolean
  departments?: Department[]
  error?: {
    code: string
    message: string
  }
}

interface DepartmentResponse {
  success: boolean
  department?: Department
  message?: string
  error?: {
    code: string
    message: string
  }
}

/**
 * 获取部门列表
 */
export async function getDepartments(): Promise<DepartmentsResponse> {
  const response = await fetch(`${API_BASE}/departments`, {
    headers: getAuthHeaders(),
  })
  return response.json()
}

/**
 * 创建部门
 */
export async function createDepartment(data: {
  name: string
  code: string
  description?: string
}): Promise<DepartmentResponse> {
  const response = await fetch(`${API_BASE}/departments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  return response.json()
}

/**
 * 更新部门
 */
export async function updateDepartment(
  id: string,
  data: Partial<Department>
): Promise<DepartmentResponse> {
  const response = await fetch(`${API_BASE}/departments/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  return response.json()
}

/**
 * 删除部门
 */
export async function deleteDepartment(id: string): Promise<DepartmentResponse> {
  const response = await fetch(`${API_BASE}/departments/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  return response.json()
}

// ==================== 职位管理 ====================

export interface Position {
  id: string
  name: string
  code: string
  level: number
  department_code?: string
  description?: string
  status: 'active' | 'inactive'
  created_at: string
}

interface PositionsResponse {
  success: boolean
  positions?: Position[]
  error?: {
    code: string
    message: string
  }
}

interface PositionResponse {
  success: boolean
  position?: Position
  message?: string
  error?: {
    code: string
    message: string
  }
}

/**
 * 获取职位列表
 */
export async function getPositions(): Promise<PositionsResponse> {
  const response = await fetch(`${API_BASE}/positions`, {
    headers: getAuthHeaders(),
  })
  return response.json()
}

/**
 * 创建职位
 */
export async function createPosition(data: {
  name: string
  code: string
  level?: number
  department_code?: string
  description?: string
}): Promise<PositionResponse> {
  const response = await fetch(`${API_BASE}/positions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  return response.json()
}

/**
 * 更新职位
 */
export async function updatePosition(
  id: string,
  data: Partial<Position>
): Promise<PositionResponse> {
  const response = await fetch(`${API_BASE}/positions/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  return response.json()
}

/**
 * 删除职位
 */
export async function deletePosition(id: string): Promise<PositionResponse> {
  const response = await fetch(`${API_BASE}/positions/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  return response.json()
}

