import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DynamicIcon } from '@/components/ui/icon-picker'
import { type Service, type ServiceCategory } from '@/api/service'
import { Loader } from 'lucide-react'

// ============================================================
// 编辑服务表单 - 纯净的表单组件
// ============================================================

export interface EditServiceFormData {
  name: string
  alias: string
  category: string
  price_type: 'fixed' | 'tiered'
  price_amount: number
  price_unit: string
  price_note: string
  status: 'active' | 'inactive'
}

export interface EditServiceFormProps {
  /** 提交表单 */
  onSubmit: (data: EditServiceFormData) => void
  /** 取消 */
  onCancel: () => void
  /** 初始数据 */
  initialData?: Partial<EditServiceFormData>
  /** 是否提交中 */
  submitting?: boolean
  /** 错误信息 */
  error?: string
  /** 服务数据（额外 props） */
  service: Service
  /** 分类列表（额外 props） */
  categories: ServiceCategory[]
}

export function EditServiceForm({
  onSubmit,
  onCancel,
  submitting,
  error,
  service,
  categories,
}: EditServiceFormProps) {
  const [form, setForm] = useState<EditServiceFormData>({
    name: service.name,
    alias: service.alias,
    category: service.category,
    price_type: service.price.type,
    price_amount: service.price.amount || service.price.base_amount || 0,
    price_unit: service.price.unit,
    price_note: service.price.note || '',
    status: service.status,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || form.price_amount <= 0) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 服务ID（只读） */}
      <div className="p-3 rounded-2xl bg-muted/50 text-sm">
        <span className="text-muted-foreground">服务ID：</span>
        <code>{service.id}</code>
      </div>

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

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">价格类型</label>
          <select
            value={form.price_type}
            onChange={(e) =>
              setForm({ ...form, price_type: e.target.value as 'fixed' | 'tiered' })
            }
            className="w-full h-10 pl-5 pr-12 rounded-full border border-input bg-background text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="fixed">固定价</option>
            <option value="tiered">阶梯价</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {form.price_type === 'fixed' ? '价格' : '起步价'} *
          </label>
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

      <div className="space-y-2">
        <label className="text-sm font-medium">服务状态</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="active"
              checked={form.status === 'active'}
              onChange={() => setForm({ ...form, status: 'active' })}
              className="accent-primary"
            />
            <span className="text-sm">启用</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="inactive"
              checked={form.status === 'inactive'}
              onChange={() => setForm({ ...form, status: 'inactive' })}
              className="accent-primary"
            />
            <span className="text-sm">停用</span>
          </label>
        </div>
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
          保存
        </Button>
      </div>
    </form>
  )
}

