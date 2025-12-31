import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from 'lucide-react'
import type { FormProps } from '@/components/modal'
import type { Position, Department } from '@/api/organization'

const LEVEL_LABELS: Record<number, string> = {
  1: 'L1 高管',
  2: 'L2 总监',
  3: 'L3 经理',
  4: 'L4 主管',
  5: 'L5 专员',
  6: 'L6 实习',
}

export interface PositionFormData {
  name: string
  code: string
  level: number
  department_code: string
  description: string
  status: 'active' | 'inactive'
}

interface PositionFormProps extends FormProps<PositionFormData> {
  position?: Position
  departments: Department[]
}

export function PositionForm({ position, departments, onSubmit, onCancel }: PositionFormProps) {
  const isEdit = !!position
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: position?.name || '',
    code: position?.code || '',
    level: position?.level || 5,
    department_code: position?.department_code || '',
    description: position?.description || '',
    status: position?.status || 'active' as const,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.code.trim()) {
      setError('职位名称和职位代码为必填项')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onSubmit({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        level: form.level,
        department_code: form.department_code,
        description: form.description.trim(),
        status: form.status,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : isEdit ? '更新失败' : '创建失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">职位名称 *</label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="如：高级设计师"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">职位代码 *</label>
        <Input
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          placeholder="如：SR_DESIGNER"
          required
        />
        <p className="text-xs text-muted-foreground">唯一标识，建议使用大写英文</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">职级</label>
          <select
            value={form.level}
            onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}
            className="w-full h-10 pl-5 pr-12 rounded-full border border-input bg-background text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {Object.entries(LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">所属部门</label>
          <select
            value={form.department_code}
            onChange={(e) => setForm({ ...form, department_code: e.target.value })}
            className="w-full h-10 pl-5 pr-12 rounded-full border border-input bg-background text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">无</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.code}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">职位描述</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="flex h-20 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="职位职责描述..."
        />
      </div>
      {isEdit && (
        <div className="space-y-2">
          <label className="text-sm font-medium">状态</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
            className="w-full h-10 pl-5 pr-12 rounded-full border border-input bg-background text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="active">启用</option>
            <option value="inactive">停用</option>
          </select>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-full">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader className="h-4 w-4 animate-spin mr-2" />}
          {isEdit ? '保存' : '创建'}
        </Button>
      </div>
    </form>
  )
}

