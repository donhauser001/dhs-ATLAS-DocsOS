import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from 'lucide-react'
import type { FormProps } from '@/components/modal'
import type { Department } from '@/api/organization'

export interface DepartmentFormData {
  name: string
  code: string
  description: string
  status: 'active' | 'inactive'
}

interface DepartmentFormProps extends FormProps<DepartmentFormData> {
  department?: Department
}

export function DepartmentForm({ department, onSubmit, onCancel }: DepartmentFormProps) {
  const isEdit = !!department
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: department?.name || '',
    code: department?.code || '',
    description: department?.description || '',
    status: department?.status || 'active' as const,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.code.trim()) {
      setError('部门名称和部门代码为必填项')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onSubmit({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
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
        <label className="text-sm font-medium">部门名称 *</label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="如：设计部"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">部门代码 *</label>
        <Input
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          placeholder="如：DESIGN"
          required
        />
        <p className="text-xs text-muted-foreground">唯一标识，建议使用大写英文</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">部门描述</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="flex h-20 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="部门职责描述..."
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

