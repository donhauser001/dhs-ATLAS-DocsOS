import { Link } from 'react-router-dom'
import {
  getServiceDisplayPrice,
  type Service,
  type ServiceCategory,
} from '@/api/service'
import { Trash2, ChevronRight, Pencil, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
  service: Service
  categoryConfig?: ServiceCategory
  onEdit: () => void
  onDelete: () => void
}

export function ServiceCard({
  service,
  categoryConfig,
  onEdit,
  onDelete,
}: ServiceCardProps) {
  const accentColor = categoryConfig?.color || service.category_color || '#6B7280'

  return (
    <div
      className={cn(
        'group relative bg-card rounded-2xl border transition-all duration-200 p-4',
        'hover:shadow-lg hover:border-border/80 hover:-translate-y-0.5'
      )}
    >
      {/* 左侧色条 - 默认只对齐标题区域，悬停时延展 */}
      <div
        className="absolute left-0 top-4 h-10 w-1 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:top-3 group-hover:h-[calc(100%-24px)]"
        style={{ backgroundColor: accentColor }}
      />

      {/* 内容区域 */}
      <div className="pl-3 space-y-3">
        {/* 头部：名称和状态 */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3
              className="font-semibold text-foreground truncate text-base"
              title={service.name}
            >
              {service.name}
            </h3>
            {service.alias && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {service.alias}
              </p>
            )}
          </div>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0',
              service.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {service.status === 'active' ? '启用' : '停用'}
          </span>
        </div>

        {/* 价格信息 - 突出显示 */}
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-bold tracking-tight text-xl"
            style={{ color: accentColor }}
          >
            {getServiceDisplayPrice(service.price)}
          </span>
          <span className="text-xs text-muted-foreground">
            / {service.price.unit}
          </span>
        </div>

        {/* 价格说明 */}
        {service.price.note && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {service.price.note}
          </p>
        )}

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between pt-2 border-t border-dashed">
          {/* 分类标签 */}
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
              {categoryConfig?.name || service.category}
            </span>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.preventDefault()
                onEdit()
              }}
              className="p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="编辑服务"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                onDelete()
              }}
              className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="删除服务"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <Link
              to={`/pricing/services/${service.category}/${service.slug}`}
              className="p-1.5 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
              title="查看详情"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 整卡片点击区域 */}
      <Link
        to={`/pricing/services/${service.category}/${service.slug}`}
        className="absolute inset-0 z-0"
        aria-label={`查看 ${service.name} 详情`}
      />
    </div>
  )
}

// 列表视图的服务行组件
export function ServiceRow({
  service,
  categoryConfig,
  onEdit,
  onDelete,
}: ServiceCardProps) {
  const accentColor = categoryConfig?.color || service.category_color || '#6B7280'

  return (
    <div className="group flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors border-b last:border-b-0">
      {/* 色块指示器 */}
      <div
        className="w-1 h-10 rounded-full flex-shrink-0"
        style={{ backgroundColor: accentColor }}
      />

      {/* 服务名称 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            to={`/pricing/services/${service.category}/${service.slug}`}
            className="font-medium text-foreground hover:text-primary transition-colors truncate"
          >
            {service.name}
          </Link>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium flex-shrink-0',
              service.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {service.status === 'active' ? '启用' : '停用'}
          </span>
        </div>
        {service.alias && (
          <p className="text-xs text-muted-foreground truncate">{service.alias}</p>
        )}
      </div>

      {/* 分类 */}
      <div className="hidden md:flex items-center gap-1.5 w-28 flex-shrink-0">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        <span className="text-sm text-muted-foreground truncate">
          {categoryConfig?.name || service.category}
        </span>
      </div>

      {/* 价格 */}
      <div className="w-32 flex-shrink-0 text-right">
        <span className="font-semibold" style={{ color: accentColor }}>
          {getServiceDisplayPrice(service.price)}
        </span>
        <span className="text-xs text-muted-foreground ml-1">
          /{service.price.unit}
        </span>
      </div>

      {/* 操作 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="编辑"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="删除"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <Link
          to={`/pricing/services/${service.category}/${service.slug}`}
          className="p-1.5 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
          title="详情"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
