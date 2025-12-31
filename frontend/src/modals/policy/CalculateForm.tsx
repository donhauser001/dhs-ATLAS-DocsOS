/**
 * 价格计算器表单
 */

import { useState } from 'react'
import { useModal } from '@/components/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  calculatePrice,
  type Policy,
  type PolicyCalculation,
  formatDiscount,
  getPolicyTypeLabel
} from '@/api/policy'
import { Calculator, Percent, TrendingDown, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalculateFormProps {
  policy: Policy
}

export function CalculateForm({ policy }: CalculateFormProps) {
  const { closeModal } = useModal()
  const [loading, setLoading] = useState(false)
  const [unitPrice, setUnitPrice] = useState(1000)
  const [quantity, setQuantity] = useState(5)
  const [result, setResult] = useState<PolicyCalculation | null>(null)

  const handleCalculate = async () => {
    setLoading(true)
    try {
      const calc = await calculatePrice(policy.id, unitPrice, quantity)
      setResult(calc)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const isUniform = policy.type === 'uniform'

  return (
    <div className="space-y-6">
      {/* 政策信息 */}
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
        <div className="flex-1">
          <div className="font-medium">{policy.name}</div>
          <div className="text-xs text-muted-foreground">
            {getPolicyTypeLabel(policy.type)}
            {isUniform && ` · ${formatDiscount(policy.discount || 100)}`}
          </div>
        </div>
      </div>

      {/* 阶梯规则预览 */}
      {!isUniform && policy.tiers && (
        <div className="p-3 rounded-xl bg-muted/50 space-y-1.5">
          <div className="text-xs text-muted-foreground mb-2">阶梯规则</div>
          {policy.tiers.map((tier, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{tier.label}</span>
              <span className="font-medium">{formatDiscount(tier.rate)}</span>
            </div>
          ))}
        </div>
      )}

      {/* 输入参数 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">单价 (元)</label>
          <Input
            type="number"
            min={0}
            value={unitPrice}
            onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">数量</label>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          />
        </div>
      </div>

      {/* 计算按钮 */}
      <Button onClick={handleCalculate} disabled={loading} className="w-full">
        <Calculator className="h-4 w-4 mr-2" />
        {loading ? '计算中...' : '计算价格'}
      </Button>

      {/* 计算结果 */}
      {result && (
        <div className="space-y-4 p-4 rounded-2xl border bg-card">
          {/* 总价对比 */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">原价</div>
              <div className="text-2xl font-bold line-through text-muted-foreground">
                ¥{result.original_price.toLocaleString()}
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="text-center">
              <div className="text-sm text-muted-foreground">折后价</div>
              <div className="text-3xl font-bold text-primary">
                ¥{result.final_price.toLocaleString()}
              </div>
            </div>
          </div>

          {/* 优惠金额 */}
          <div className="flex items-center justify-center">
            <Badge variant="green" className="text-sm px-4 py-1">
              节省 ¥{result.discount_amount.toLocaleString()}
            </Badge>
          </div>

          {/* 明细（阶梯折扣） */}
          {!isUniform && result.breakdown.length > 0 && (
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="text-sm font-medium mb-2">计算明细</div>
              {result.breakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs rounded-full">
                      {item.label}
                    </Badge>
                    <span className="text-muted-foreground">
                      {item.quantity}项 × ¥{item.unit_price} × {item.rate}%
                    </span>
                  </div>
                  <span className="font-medium">¥{item.subtotal.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 关闭按钮 */}
      <div className="flex justify-end pt-4 border-t">
        <Button variant="outline" onClick={closeModal}>
          关闭
        </Button>
      </div>
    </div>
  )
}

