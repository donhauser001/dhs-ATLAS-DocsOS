import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconPicker, DynamicIcon } from '@/components/ui/icon-picker'
import { ColorPicker } from '@/components/ui/color-picker'
import { Loader } from 'lucide-react'

// ============================================================
// 创建分类表单 - 纯净的表单组件
// ============================================================

export interface CreateCategoryFormData {
  id: string
  name: string
  color: string
  icon_key: string
  description: string
}

export interface CreateCategoryFormProps {
  onSubmit: (data: CreateCategoryFormData) => void
  onCancel: () => void
  initialData?: Partial<CreateCategoryFormData>
  submitting?: boolean
  error?: string
}

export function CreateCategoryForm({
  onSubmit,
  onCancel,
  initialData,
  submitting,
  error,
}: CreateCategoryFormProps) {
  const [form, setForm] = useState<CreateCategoryFormData>({
    id: initialData?.id || '',
    name: initialData?.name || '',
    color: initialData?.color || '#8B5CF6',
    icon_key: initialData?.icon_key || 'folder',
    description: initialData?.description || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.id.trim() || !form.name.trim()) return
    onSubmit({
      ...form,
      id: form.id.trim().toLowerCase().replace(/\s+/g, '-'),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 预览 */}
      <div className="flex items-center gap-3 p-3 rounded-2xl border bg-muted/30">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: form.color + '20', color: form.color }}
        >
          <DynamicIcon iconKey={form.icon_key} className="h-5 w-5" />
        </div>
        <div>
          <div className="font-medium">{form.name || '分类名称'}</div>
          <div className="text-xs text-muted-foreground">
            /{form.id || 'category-id'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">分类ID *</label>
          <Input
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            placeholder="brand-design"
            required
          />
          <p className="text-xs text-muted-foreground">英文标识，用于URL</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">分类名称 *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="品牌设计"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">分类说明</label>
        <Input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="简短描述该分类包含的服务类型"
        />
      </div>

      {/* 颜色选择 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">颜色</label>
        <ColorPicker
          value={form.color}
          onChange={(color) => setForm({ ...form, color })}
        />
      </div>

      {/* 图标选择 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">图标</label>
        <IconPicker
          value={form.icon_key}
          onChange={(icon_key) => setForm({ ...form, icon_key })}
        />
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-full">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader className="h-4 w-4 animate-spin mr-2" />}
          创建
        </Button>
      </div>
    </form>
  )
}
