import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader, UserCheck, UserMinus } from 'lucide-react'
import type { FormProps } from '@/components/modal'
import type { ServiceConfig } from '@/api/config'

export interface EditConfigFormData {
  name: string
  draft_count: number
  max_count: number
  lead_ratio: number
  assistant_ratio: number
  content?: string
}

interface EditConfigFormProps extends FormProps<EditConfigFormData> {
  config: ServiceConfig
}

export function EditConfigForm({ config, onSubmit, onCancel }: EditConfigFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: config.name,
    draft_count: config.draft_count,
    max_count: config.max_count,
    lead_ratio: Math.round(config.lead_ratio * 100),
    assistant_ratio: Math.round(config.assistant_ratio * 100),
    content: config.content || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setError('')

    try {
      await onSubmit({
        name: form.name.trim(),
        draft_count: form.draft_count,
        max_count: form.max_count,
        lead_ratio: form.lead_ratio / 100,
        assistant_ratio: form.assistant_ratio / 100,
        content: form.content.trim() || undefined,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '更新失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">配置ID</label>
          <Input value={config.id} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">ID不可修改</p>
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
          保存
        </Button>
      </div>
    </form>
  )
}

