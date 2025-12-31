/**
 * 编辑价格政策表单
 */

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useModal } from '@/components/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { updatePolicy, type Policy, type PolicyTier } from '@/api/policy'
import { Plus, Trash2, Percent, TrendingDown, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditPolicyFormProps {
  policy: Policy
}

export function EditPolicyForm({ policy }: EditPolicyFormProps) {
  const { closeModal } = useModal()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: policy.name,
    discount: policy.discount || 100,
    description: policy.description || '',
    applicable: policy.applicable || [],
    conditions: policy.conditions || [],
    status: policy.status
  })

  const [tiers, setTiers] = useState<PolicyTier[]>(
    policy.tiers || [
      { min: 1, max: 1, rate: 100, label: '第1项' },
      { min: 2, max: null, rate: 80, label: '第2项及以上' }
    ]
  )

  const [newApplicable, setNewApplicable] = useState('')
  const [newCondition, setNewCondition] = useState('')

  // 阶梯操作
  const addTier = () => {
    const lastTier = tiers[tiers.length - 1]
    const newMin = lastTier.max !== null ? lastTier.max + 1 : lastTier.min + 5
    
    const updatedTiers = [...tiers]
    if (lastTier.max === null) {
      updatedTiers[updatedTiers.length - 1] = {
        ...lastTier,
        max: newMin - 1,
        label: `第${lastTier.min}-${newMin - 1}项`
      }
    }
    
    setTiers([
      ...updatedTiers,
      {
        min: newMin,
        max: null,
        rate: Math.max(50, (lastTier.rate || 100) - 10),
        label: `第${newMin}项及以上`
      }
    ])
  }

  const removeTier = (index: number) => {
    if (tiers.length <= 2) return
    const newTiers = tiers.filter((_, i) => i !== index)
    newTiers[newTiers.length - 1].max = null
    newTiers[newTiers.length - 1].label = `第${newTiers[newTiers.length - 1].min}项及以上`
    setTiers(newTiers)
  }

  const updateTier = (index: number, field: keyof PolicyTier, value: any) => {
    const newTiers = [...tiers]
    newTiers[index] = { ...newTiers[index], [field]: value }
    
    const tier = newTiers[index]
    if (tier.min === tier.max) {
      tier.label = `第${tier.min}项`
    } else if (tier.max === null) {
      tier.label = `第${tier.min}项及以上`
    } else {
      tier.label = `第${tier.min}-${tier.max}项`
    }
    
    setTiers(newTiers)
  }

  // 适用范围/条件
  const addApplicable = () => {
    if (!newApplicable.trim()) return
    setForm({ ...form, applicable: [...form.applicable, newApplicable.trim()] })
    setNewApplicable('')
  }

  const addCondition = () => {
    if (!newCondition.trim()) return
    setForm({ ...form, conditions: [...form.conditions, newCondition.trim()] })
    setNewCondition('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await updatePolicy(policy.id, {
        name: form.name,
        discount: policy.type === 'uniform' ? form.discount : undefined,
        tiers: policy.type === 'tiered' ? tiers : undefined,
        description: form.description || undefined,
        applicable: form.applicable.length > 0 ? form.applicable : undefined,
        conditions: form.conditions.length > 0 ? form.conditions : undefined,
        status: form.status
      })
      
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      closeModal()
    } catch (err: any) {
      setError(err.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  const isUniform = policy.type === 'uniform'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 类型显示 */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          isUniform ? 'bg-blue-500/20' : 'bg-purple-500/20'
        )}>
          {isUniform ? (
            <Percent className="h-5 w-5 text-blue-500" />
          ) : (
            <TrendingDown className="h-5 w-5 text-purple-500" />
          )}
        </div>
        <div>
          <div className="font-medium">{isUniform ? '统一折扣' : '阶梯折扣'}</div>
          <div className="text-xs text-muted-foreground">ID: {policy.id}</div>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">政策名称 *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">状态</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
            className="w-full h-10 pl-5 pr-12 rounded-full border border-input bg-background text-sm"
          >
            <option value="active">启用中</option>
            <option value="inactive">已停用</option>
          </select>
        </div>
      </div>

      {/* 统一折扣设置 */}
      {isUniform && (
        <div className="space-y-2">
          <label className="text-sm font-medium">折扣比例 *</label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min={1}
              max={100}
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: parseInt(e.target.value) || 100 })}
              className="w-32"
            />
            <span className="text-muted-foreground">%</span>
          </div>
        </div>
      )}

      {/* 阶梯折扣设置 */}
      {!isUniform && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">阶梯规则 *</label>
            <Button type="button" variant="ghost" size="sm" onClick={addTier}>
              <Plus className="h-4 w-4 mr-1" />
              添加阶梯
            </Button>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-muted/30">
            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-2">
              <div className="col-span-1"></div>
              <div className="col-span-2">起始</div>
              <div className="col-span-2">结束</div>
              <div className="col-span-2">比例</div>
              <div className="col-span-4">标签</div>
              <div className="col-span-1"></div>
            </div>

            {tiers.map((tier, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-1 flex justify-center">
                  <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min={1}
                    value={tier.min}
                    onChange={(e) => updateTier(index, 'min', parseInt(e.target.value) || 1)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min={tier.min}
                    value={tier.max === null ? '' : tier.max}
                    onChange={(e) => updateTier(index, 'max', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="无上限"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={tier.rate}
                      onChange={(e) => updateTier(index, 'rate', parseInt(e.target.value) || 100)}
                      className="h-9 text-sm pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="col-span-4">
                  <Input
                    value={tier.label}
                    onChange={(e) => updateTier(index, 'label', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="col-span-1">
                  {tiers.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-destructive"
                      onClick={() => removeTier(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 描述 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">政策说明</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full min-h-[80px] px-4 py-3 rounded-2xl border border-input bg-background resize-none text-sm"
        />
      </div>

      {/* 适用范围 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">适用范围</label>
        <div className="flex gap-2">
          <Input
            value={newApplicable}
            onChange={(e) => setNewApplicable(e.target.value)}
            placeholder="添加适用范围"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addApplicable())}
          />
          <Button type="button" variant="outline" onClick={addApplicable}>
            添加
          </Button>
        </div>
        {form.applicable.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.applicable.map((item, index) => (
              <Badge key={index} variant="secondary" className="rounded-full gap-1">
                {item}
                <button
                  type="button"
                  onClick={() => setForm({
                    ...form,
                    applicable: form.applicable.filter((_, i) => i !== index)
                  })}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* 适用条件 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">适用条件</label>
        <div className="flex gap-2">
          <Input
            value={newCondition}
            onChange={(e) => setNewCondition(e.target.value)}
            placeholder="添加适用条件"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
          />
          <Button type="button" variant="outline" onClick={addCondition}>
            添加
          </Button>
        </div>
        {form.conditions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.conditions.map((item, index) => (
              <Badge key={index} variant="outline" className="rounded-full gap-1">
                {item}
                <button
                  type="button"
                  onClick={() => setForm({
                    ...form,
                    conditions: form.conditions.filter((_, i) => i !== index)
                  })}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* 错误 */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-full">
          {error}
        </div>
      )}

      {/* 按钮 */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={closeModal}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '保存中...' : '保存更改'}
        </Button>
      </div>
    </form>
  )
}

