import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader, UserCheck, UserMinus } from 'lucide-react'
import type { FormProps } from '@/components/modal'

export interface CreateConfigFormData {
  id: string
  name: string
  draft_count: number
  max_count: number
  lead_ratio: number
  assistant_ratio: number
  content?: string
}

export function CreateConfigForm({ onSubmit, onCancel }: FormProps<CreateConfigFormData>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    id: '',
    name: '',
    draft_count: 3,
    max_count: 5,
    lead_ratio: 7,
    assistant_ratio: 3,
    content: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.id.trim() || !form.name.trim()) {
      setError('配置ID和配置名称为必填项')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onSubmit({
        id: form.id.trim(),
        name: form.name.trim(),
        draft_count: form.draft_count,
        max_count: form.max_count,
        lead_ratio: form.lead_ratio / 100,
        assistant_ratio: form.assistant_ratio / 100,
        content: form.content.trim() || undefined,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '创建失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">配置ID *</label>
          <Input
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            placeholder="cfg-brand-standard"
            required
          />
          <p className="text-xs text-muted-foreground">以 cfg- 开头</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">配置名称 *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="品牌设计标准配置"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">初稿方案数量</label>
          <Input
            type="number"
            value={form.draft_count}
            onChange={(e) => setForm({ ...form, draft_count: Number(e.target.value) })}
            min="1"
            max="10"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">最多方案数量</label>
          <Input
            type="number"
            value={form.max_count}
            onChange={(e) => setForm({ ...form, max_count: Number(e.target.value) })}
            min="1"
            max="20"
          />
        </div>
      </div>

      {/* 绩效提成 */}
      <div className="space-y-3">
        <label className="text-sm font-medium">绩效提成（从项目总金额中提成）</label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
              <span className="text-sm">主创提成</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={form.lead_ratio}
                onChange={(e) => setForm({ ...form, lead_ratio: Number(e.target.value) })}
                min="0"
                max="100"
                step="0.5"
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UserMinus className="h-4 w-4 text-green-600" />
              <span className="text-sm">助理提成</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={form.assistant_ratio}
                onChange={(e) => setForm({ ...form, assistant_ratio: Number(e.target.value) })}
                min="0"
                max="100"
                step="0.5"
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          合计提成：{form.lead_ratio + form.assistant_ratio}%
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">配置说明</label>
        <Input
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="适用于哪类项目..."
        />
      </div>

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
          创建
        </Button>
      </div>
    </form>
  )
}

