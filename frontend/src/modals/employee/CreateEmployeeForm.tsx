import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from 'lucide-react'
import { getDepartments, getPositions } from '@/api/organization'
import type { FormProps } from '@/components/modal'
import type { User } from '@/stores/auth'

export interface CreateEmployeeFormData {
  username: string
  password: string
  name: string
  email: string
  phone: string
  id_card: string
  emergency_contact: string
  emergency_phone: string
  department: string
  position: string
  bio: string
  role: User['role']
}

export function CreateEmployeeForm({ onSubmit, onCancel }: FormProps<CreateEmployeeFormData>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    id_card: '',
    emergency_contact: '',
    emergency_phone: '',
    department: '',
    position: '',
    bio: '',
    role: 'member' as User['role'],
  })

  // 获取部门列表
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await getDepartments()
      return response.departments || []
    },
  })

  // 获取职位列表
  const { data: positionsData } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const response = await getPositions()
      return response.positions || []
    },
  })

  const departments = departmentsData || []
  const positions = positionsData || []

  // 获取部门名称
  const getDepartmentNameByCode = (code: string) => {
    const dept = departments.find((d) => d.code === code)
    return dept?.name || ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username.trim() || !form.password || !form.name.trim() || !form.email.trim()) {
      setError('请填写所有必填字段')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onSubmit(form)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '创建失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* 账号信息 */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">账号信息</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">用户名 *</label>
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="登录用户名"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">密码 *</label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="至少6位"
              required
              minLength={6}
            />
          </div>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">基本信息</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">姓名 *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="真实姓名"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">身份证号码</label>
            <Input
              value={form.id_card}
              onChange={(e) => setForm({ ...form, id_card: e.target.value })}
              placeholder="18位身份证号"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">邮箱 *</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">手机号码</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="11位手机号"
            />
          </div>
        </div>
      </div>

      {/* 工作信息 */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">工作信息</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">部门</label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full h-10 pl-5 pr-12 rounded-full border border-input bg-background text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">请选择部门</option>
              {departments.filter(d => d.status === 'active').map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">职位</label>
            <select
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              className="w-full h-10 pl-5 pr-12 rounded-full border border-input bg-background text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">请选择职位</option>
              {positions.filter(p => p.status === 'active').map((pos) => (
                <option key={pos.id} value={pos.name}>
                  {pos.name}{pos.department_code ? ` (${getDepartmentNameByCode(pos.department_code)})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">角色 *</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as User['role'] })}
            className="w-full h-10 pl-5 pr-12 rounded-full border border-input bg-background text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="member">成员</option>
            <option value="admin">管理员</option>
          </select>
        </div>
      </div>

      {/* 紧急联系人 */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">紧急联系人</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">联系人姓名</label>
            <Input
              value={form.emergency_contact}
              onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
              placeholder="紧急联系人姓名"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">联系人电话</label>
            <Input
              value={form.emergency_phone}
              onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })}
              placeholder="紧急联系人电话"
            />
          </div>
        </div>
      </div>

      {/* 个人简介 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">个人简介</label>
        <textarea
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="简单介绍一下自己..."
          className="w-full min-h-[80px] px-4 py-3 rounded-2xl border border-input bg-background resize-none text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-full">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 sticky bottom-0 bg-background pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader className="h-4 w-4 animate-spin mr-2" />}
          创建
        </Button>
      </div>
    </form>
  )
}

