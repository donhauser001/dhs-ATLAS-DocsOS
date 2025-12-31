import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DynamicIcon } from '@/components/ui/icon-picker'
import { type ServiceCategory } from '@/api/service'
import { Loader } from 'lucide-react'

// ============================================================
// 创建服务表单 - 纯净的表单组件
// ============================================================

export interface CreateServiceFormData {
  category: string
  name: string
  alias: string
  price_amount: number
  price_unit: string
  price_note: string
}

export interface CreateServiceFormProps {
  /** 提交表单 */
  onSubmit: (data: CreateServiceFormData) => void
  /** 取消 */
  onCancel: () => void
  /** 初始数据 */
  initialData?: Partial<CreateServiceFormData>
  /** 是否提交中 */
  submitting?: boolean
  /** 错误信息 */
  error?: string
  /** 分类列表（额外 props） */
  categories: ServiceCategory[]
  /** 默认分类 */
  defaultCategory?: string | null
}

export function CreateServiceForm({
  onSubmit,
  onCancel,
  initialData,
  submitting,
  error,
  categories,
  defaultCategory,
}: CreateServiceFormProps) {
  const [form, setForm] = useState<CreateServiceFormData>({
    category: initialData?.category || defaultCategory || '',
    name: initialData?.name || '',
    alias: initialData?.alias || '',
    price_amount: initialData?.price_amount || 0,
    price_unit: initialData?.price_unit || '项目',
    price_note: initialData?.price_note || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.category || !form.name || form.price_amount <= 0) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">所属分类 *</label>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setForm({ ...form, category: cat.id })}
              className={`flex items-center gap-2 p-2 rounded-full border transition-colors text-sm ${
                form.category === cat.id
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:bg-accent'
              }`}
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded"
                style={{ backgroundColor: cat.color + '20', color: cat.color }}
              >
                <DynamicIcon iconKey={cat.icon_key} className="h-3.5 w-3.5" />
              </div>
              <span className="truncate">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">服务名称 *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="如：品牌VI设计"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">别名（URL）</label>
          <Input
            value={form.alias}
            onChange={(e) => setForm({ ...form, alias: e.target.value })}
            placeholder="brand-vi"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">基础价格 *</label>
          <Input
            type="number"
            value={form.price_amount}
            onChange={(e) => setForm({ ...form, price_amount: Number(e.target.value) })}
            placeholder="0"
            min="0"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">计价单位</label>
          <Input
            value={form.price_unit}
            onChange={(e) => setForm({ ...form, price_unit: e.target.value })}
            placeholder="项目"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">价格说明</label>
        <Input
          value={form.price_note}
          onChange={(e) => setForm({ ...form, price_note: e.target.value })}
          placeholder="如：含3套方案、2轮修改"
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

