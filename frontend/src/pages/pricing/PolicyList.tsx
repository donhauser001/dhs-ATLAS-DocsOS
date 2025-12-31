/**
 * 价格政策列表页面
 */

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useModal } from '@/components/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  getPolicies,
  deletePolicy,
  type Policy,
  getPolicyTypeLabel,
  getPolicyTypeColor,
  getPolicyDiscountSummary,
  formatDiscount
} from '@/api/policy'
import {
  Plus,
  Search,
  Percent,
  TrendingDown,
  Edit,
  Trash2,
  Calculator,
  X,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

type FilterType = 'all' | 'uniform' | 'tiered'

export function PolicyList() {
  usePageTitle('价格政策', '管理折扣和优惠规则')

  const [filterType, setFilterType] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { openModal } = useModal()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: () => getPolicies()
  })

  const policies = data?.policies || []

  // 过滤
  const filteredPolicies = policies.filter(policy => {
    // 类型过滤
    if (filterType !== 'all' && policy.type !== filterType) return false
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        policy.name.toLowerCase().includes(query) ||
        policy.description?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const uniformPolicies = filteredPolicies.filter(p => p.type === 'uniform')
  const tieredPolicies = filteredPolicies.filter(p => p.type === 'tiered')

  const handleCreate = (type: 'uniform' | 'tiered') => {
    openModal('policy.create', { defaultType: type })
  }

  const handleEdit = (policy: Policy) => {
    openModal('policy.edit', { policy })
  }

  const handleDelete = async (policy: Policy) => {
    if (!confirm(`确定要删除「${policy.name}」吗？`)) return
    await deletePolicy(policy.id)
    queryClient.invalidateQueries({ queryKey: ['policies'] })
  }

  const handleCalculate = (policy: Policy) => {
    openModal('policy.calculate', { policy })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* 搜索 */}
          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索政策..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* 类型筛选 */}
          <div className="flex items-center rounded-full border bg-muted/30 p-1">
            {[
              { key: 'all', label: '全部' },
              { key: 'uniform', label: '统一折扣' },
              { key: 'tiered', label: '阶梯折扣' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setFilterType(item.key as FilterType)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm transition-colors',
                  filterType === item.key
                    ? 'bg-background shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <span className="text-sm text-muted-foreground">
            共 {filteredPolicies.length} 条政策
          </span>
        </div>

        {/* 新建按钮 */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleCreate('uniform')}>
            <Percent className="h-4 w-4 mr-2" />
            新建统一折扣
          </Button>
          <Button onClick={() => handleCreate('tiered')}>
            <TrendingDown className="h-4 w-4 mr-2" />
            新建阶梯折扣
          </Button>
        </div>
      </div>

      {/* 统一折扣 */}
      {(filterType === 'all' || filterType === 'uniform') && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Percent className="h-5 w-5 text-blue-500" />
            统一折扣
            <Badge variant="secondary">{uniformPolicies.length}</Badge>
          </h2>

          {uniformPolicies.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-12 text-center text-muted-foreground">
                暂无统一折扣政策
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniformPolicies.map(policy => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCalculate={handleCalculate}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 阶梯折扣 */}
      {(filterType === 'all' || filterType === 'tiered') && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-purple-500" />
            阶梯折扣
            <Badge variant="secondary">{tieredPolicies.length}</Badge>
          </h2>

          {tieredPolicies.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-12 text-center text-muted-foreground">
                暂无阶梯折扣政策
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {tieredPolicies.map(policy => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCalculate={handleCalculate}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

// ============================================================
// 政策卡片组件
// ============================================================

interface PolicyCardProps {
  policy: Policy
  onEdit: (policy: Policy) => void
  onDelete: (policy: Policy) => void
  onCalculate: (policy: Policy) => void
}

function PolicyCard({ policy, onEdit, onDelete, onCalculate }: PolicyCardProps) {
  const isUniform = policy.type === 'uniform'

  return (
    <Card className="rounded-2xl group hover:shadow-md hover:border-primary/20 transition-all">
      <CardContent className="p-5">
        {/* 头部 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${getPolicyTypeColor(policy.type)}20` }}
            >
              {isUniform ? (
                <Percent className="h-5 w-5" style={{ color: getPolicyTypeColor(policy.type) }} />
              ) : (
                <TrendingDown className="h-5 w-5" style={{ color: getPolicyTypeColor(policy.type) }} />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{policy.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: `${getPolicyTypeColor(policy.type)}15`,
                    color: getPolicyTypeColor(policy.type)
                  }}
                >
                  {getPolicyTypeLabel(policy.type)}
                </Badge>
                {policy.status === 'inactive' && (
                  <Badge variant="gray" className="text-xs">已停用</Badge>
                )}
              </div>
            </div>
          </div>

          {/* 折扣显示 */}
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {isUniform ? formatDiscount(policy.discount || 100) : getPolicyDiscountSummary(policy)}
            </div>
          </div>
        </div>

        {/* 阶梯详情 */}
        {!isUniform && policy.tiers && (
          <div className="mb-4 p-3 rounded-xl bg-muted/50 space-y-1.5">
            {policy.tiers.map((tier, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{tier.label}</span>
                <span className="font-medium">{formatDiscount(tier.rate)}</span>
              </div>
            ))}
          </div>
        )}

        {/* 描述 */}
        {policy.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {policy.description}
          </p>
        )}

        {/* 适用范围 */}
        {policy.applicable && policy.applicable.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {policy.applicable.map((item, index) => (
              <Badge key={index} variant="outline" className="text-xs rounded-full">
                {item}
              </Badge>
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary"
            onClick={() => onCalculate(policy)}
          >
            <Calculator className="h-4 w-4 mr-1" />
            计算器
          </Button>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onEdit(policy)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-destructive hover:text-destructive"
              onClick={() => onDelete(policy)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PolicyList

