import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DynamicIcon } from '@/components/ui/icon-picker'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  getServiceDetail,
  getServiceCategories,
  updateService,
  deleteService,
  getServiceDisplayPrice,
  type Service,
  type ServicePrice,
} from '@/api/service'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader,
  Save,
  X,
  Clock,
  Hash,
  Layers,
  FileText,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function ServiceDetail() {
  const { category: categoryParam, name } = useParams<{ category: string; name: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  const serviceId = name ? decodeURIComponent(name) : ''

  // 获取服务详情
  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      if (!serviceId) throw new Error('参数缺失')
      const result = await getServiceDetail(serviceId)
      if (!result.success) throw new Error(result.error?.message)
      return result.result?.service
    },
    enabled: !!serviceId,
  })

  // 获取分类信息（用于图标和颜色）
  const { data: categoriesData } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const result = await getServiceCategories()
      if (!result.success) throw new Error(result.error?.message)
      return result.result
    },
  })

  const categoryConfig = categoriesData?.categories?.find(c => c.id === service?.category)
  const accentColor = categoryConfig?.color || service?.category_color || '#6366F1'

  usePageTitle(
    service?.name || '服务详情',
    service?.alias || categoryConfig?.name
  )

  const deleteMutation = useMutation({
    mutationFn: () => deleteService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['service-categories'] })
      navigate('/pricing/services')
    },
  })

  const handleDelete = async () => {
    if (confirm(`确定要删除服务「${service?.name}」吗？此操作不可撤销。`)) {
      const result = await deleteMutation.mutateAsync()
      if (!result.success) {
        alert(result.error?.message || '删除失败')
      }
    }
  }

  const handleCopyId = () => {
    if (service?.id) {
      navigator.clipboard.writeText(service.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error || !service) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">服务未找到</h2>
            <p className="text-muted-foreground">
              {error ? (error as Error).message : '请求的服务不存在或已被删除'}
            </p>
          </div>
          <Button onClick={() => navigate('/pricing/services')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回服务列表
          </Button>
        </div>
      </div>
    )
  }

  // 编辑模式
  if (isEditing) {
    return (
      <EditServiceForm
        service={service}
        accentColor={accentColor}
        onCancel={() => setIsEditing(false)}
        onSaved={() => {
          setIsEditing(false)
          queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
        }}
      />
    )
  }

  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-2 text-sm">
            <Link 
              to="/pricing/services" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              服务清单
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link 
              to={`/pricing/services?category=${categoryParam}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {categoryConfig?.name || service.category}
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium truncate max-w-[200px]">{service.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              编辑
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              删除
            </Button>
          </div>
        </div>
      </div>

      {/* Hero 区域 */}
      <div className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            background: `radial-gradient(circle at 30% 20%, ${accentColor} 0%, transparent 50%),
                        radial-gradient(circle at 70% 80%, ${accentColor} 0%, transparent 50%)`
          }}
        />
        <div 
          className="absolute top-0 left-0 w-1 h-full"
          style={{ backgroundColor: accentColor }}
        />

        <div className="relative px-6 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
              {/* 左侧：图标和基本信息 */}
              <div className="flex items-start gap-6">
                {/* 大图标 */}
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{ 
                    backgroundColor: accentColor + '15',
                    color: accentColor,
                  }}
                >
                  <DynamicIcon 
                    iconKey={categoryConfig?.icon_key || 'file-text'} 
                    className="h-10 w-10" 
                  />
                </div>

                {/* 服务名称和别名 */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
                      <Badge 
                        variant="outline"
                        className={cn(
                          'font-medium',
                          service.status === 'active' 
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'border-muted'
                        )}
                      >
                        {service.status === 'active' ? '启用中' : '已停用'}
                      </Badge>
                    </div>
                    <p className="text-lg text-muted-foreground">{service.alias}</p>
                  </div>

                  {/* ID 和分类标签 */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={handleCopyId}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 hover:bg-muted text-xs text-muted-foreground transition-colors"
                    >
                      <Hash className="h-3 w-3" />
                      {service.id}
                      {copied ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    <span 
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                      style={{ 
                        backgroundColor: accentColor + '15',
                        color: accentColor,
                      }}
                    >
                      <Layers className="h-3 w-3" />
                      {categoryConfig?.name || service.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* 右侧：价格卡片 */}
              <div className="lg:ml-auto">
                <div 
                  className="relative rounded-2xl p-6 min-w-[240px]"
                  style={{ 
                    backgroundColor: accentColor + '08',
                    borderColor: accentColor + '20',
                  }}
                >
                  <div 
                    className="absolute top-0 left-0 w-full h-1 rounded-t-2xl"
                    style={{ backgroundColor: accentColor }}
                  />
                  <p className="text-sm text-muted-foreground mb-2">基础价格</p>
                  <div className="flex items-baseline gap-1">
                    <span 
                      className="text-4xl font-bold tracking-tight"
                      style={{ color: accentColor }}
                    >
                      {getServiceDisplayPrice(service.price)}
                    </span>
                    <span className="text-lg text-muted-foreground">
                      / {service.price.unit}
                    </span>
                  </div>
                  {service.price.note && (
                    <p className="mt-3 pt-3 border-t text-sm text-muted-foreground leading-relaxed">
                      {service.price.note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* 主内容 */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="px-6 py-4 border-b bg-muted/30">
                  <h2 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    服务说明
                  </h2>
                </div>
                <div className="p-6">
                  {service.content ? (
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-h2:text-lg prose-h3:text-base prose-p:text-muted-foreground prose-li:text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(service.content) }}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">暂无服务说明</p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setIsEditing(true)}
                      >
                        点击添加
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 侧边信息 */}
            <div className="space-y-6">
              {/* 时间信息 */}
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  时间记录
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">创建时间</p>
                    <p className="font-medium">{formatDate(service.created)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">最后更新</p>
                    <p className="font-medium">{formatDate(service.updated)}</p>
                  </div>
                </div>
              </div>

              {/* 阶梯定价（如果有） */}
              {service.price.type === 'tiered' && service.price.tiers && service.price.tiers.length > 0 && (
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="font-semibold text-sm mb-4">阶梯定价</h3>
                  <div className="space-y-2">
                    {service.price.tiers.map((tier, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between py-2 px-4 rounded-full bg-muted/50"
                      >
                        <span className="text-sm">
                          {tier.min} - {tier.max || '∞'} {service.price.unit}
                        </span>
                        <span 
                          className="font-medium text-sm"
                          style={{ color: accentColor }}
                        >
                          {tier.discount}% 折扣
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 附加收费（如果有） */}
              {service.price.extras && service.price.extras.length > 0 && (
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="font-semibold text-sm mb-4">附加收费</h3>
                  <div className="space-y-2">
                    {service.price.extras.map((extra, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between py-2 px-4 rounded-full bg-muted/50"
                      >
                        <span className="text-sm">{extra.name}</span>
                        <span 
                          className="font-medium text-sm"
                          style={{ color: accentColor }}
                        >
                          ¥{extra.amount.toLocaleString()}/{extra.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 快捷操作 */}
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-4">快捷操作</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    编辑服务信息
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除此服务
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Markdown 渲染
function renderMarkdown(content: string): string {
  return content
    .split('\n')
    .map((line) => {
      if (line.startsWith('### ')) {
        return `<h3 class="text-base font-semibold mt-6 mb-3">${line.slice(4)}</h3>`
      }
      if (line.startsWith('## ')) {
        return `<h2 class="text-lg font-semibold mt-8 mb-4">${line.slice(3)}</h2>`
      }
      if (line.startsWith('# ')) {
        return `<h1 class="text-xl font-bold mt-8 mb-4">${line.slice(2)}</h1>`
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return `<p class="font-semibold mt-4 mb-2">${line.slice(2, -2)}</p>`
      }
      if (line.startsWith('- ')) {
        return `<li class="ml-4 my-1">${line.slice(2)}</li>`
      }
      if (/^\d+\.\s/.test(line)) {
        return `<li class="ml-4 list-decimal my-1">${line.replace(/^\d+\.\s/, '')}</li>`
      }
      if (line.trim() === '') {
        return '<br/>'
      }
      return `<p class="my-2 leading-relaxed">${line}</p>`
    })
    .join('')
}

// ========== 编辑表单 ==========

function EditServiceForm({
  service,
  accentColor,
  onCancel,
  onSaved,
}: {
  service: Service
  accentColor: string
  onCancel: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: service.name,
    alias: service.alias,
    slug: service.slug || '',
    price_amount: service.price.type === 'fixed' ? service.price.amount || 0 : service.price.base_amount || 0,
    price_unit: service.price.unit,
    price_note: service.price.note || '',
    status: service.status,
    content: service.content || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const price: ServicePrice = {
        type: service.price.type,
        amount: service.price.type === 'fixed' ? form.price_amount : undefined,
        base_amount: service.price.type === 'tiered' ? form.price_amount : undefined,
        unit: form.price_unit,
        note: form.price_note || undefined,
        tiers: service.price.tiers,
        extras: service.price.extras,
      }

      const result = await updateService(service.id, {
        name: form.name,
        alias: form.alias,
        slug: form.slug,
        price,
        status: form.status,
        content: form.content,
      })
      if (result.success) {
        onSaved()
      } else {
        setError(result.error?.message || '更新失败')
      }
    } catch {
      setError('更新失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* 顶部栏 */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold">编辑服务</h1>
              <p className="text-xs text-muted-foreground">{service.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <Loader className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              保存更改
            </Button>
          </div>
        </div>
      </div>

      {/* 编辑内容 */}
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 基本信息 */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: accentColor + '15', color: accentColor }}
                >
                  <FileText className="h-4 w-4" />
                </div>
                <h2 className="font-semibold">基本信息</h2>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    服务名称 <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="如：精装单封"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    服务别名
                  </label>
                  <Input
                    value={form.alias}
                    onChange={(e) => setForm({ ...form, alias: e.target.value })}
                    placeholder="如：精装单封（中信）"
                  />
                  <p className="text-xs text-muted-foreground">
                    用于区分同名服务的不同版本
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    URL 标识
                  </label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="hardcover-single-citic"
                  />
                  <p className="text-xs text-muted-foreground">
                    英文标识，用于生成链接地址
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">状态</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full h-10 pl-5 pr-12 rounded-full border border-input bg-background text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="active">启用中</option>
                    <option value="inactive">已停用</option>
                  </select>
                </div>
              </div>
            </section>

            {/* 价格信息 */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: accentColor + '15', color: accentColor }}
                >
                  <span className="font-bold text-sm">¥</span>
                </div>
                <h2 className="font-semibold">价格信息</h2>
              </div>
              
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    基础价格 <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                    <Input
                      type="number"
                      value={form.price_amount}
                      onChange={(e) => setForm({ ...form, price_amount: Number(e.target.value) })}
                      min="0"
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    计价单位 <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={form.price_unit}
                    onChange={(e) => setForm({ ...form, price_unit: e.target.value })}
                    placeholder="如：本、页、套"
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <label className="text-sm font-medium">价格说明</label>
                  <Input
                    value={form.price_note}
                    onChange={(e) => setForm({ ...form, price_note: e.target.value })}
                    placeholder="如：含2个方案、10个工作日"
                  />
                </div>
              </div>
            </section>

            {/* 服务内容 */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: accentColor + '15', color: accentColor }}
                >
                  <FileText className="h-4 w-4" />
                </div>
                <h2 className="font-semibold">服务说明</h2>
              </div>
              
              <div className="space-y-2">
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full min-h-[400px] px-4 py-3 rounded-2xl border border-input bg-background resize-y text-sm font-mono leading-relaxed"
                  placeholder="使用 Markdown 格式编写服务详情...

## 服务内容

- 封面设计包含封面、封底、书脊
- 提供 2 个设计方案
- 包含 3 轮修改

## 交付标准

1. 印刷级 PDF 文件
2. 可编辑源文件（AI/PSD）
3. 字体打包"
                />
                <p className="text-xs text-muted-foreground">
                  支持 Markdown 格式：# 标题、## 二级标题、- 列表项、**粗体**
                </p>
              </div>
            </section>

            {/* 错误提示 */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-destructive/10 text-destructive text-sm">
                <X className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* 底部操作 */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                保存更改
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
