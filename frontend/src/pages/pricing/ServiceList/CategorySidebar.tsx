import { Badge } from '@/components/ui/badge'
import { DynamicIcon } from '@/components/ui/icon-picker'
import { type ServiceCategory } from '@/api/service'
import { Folder, Loader, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategorySidebarProps {
  categories: ServiceCategory[]
  selectedCategory: string | null
  totalServices: number
  loading: boolean
  onSelectCategory: (id: string | null) => void
}

export function CategorySidebar({
  categories,
  selectedCategory,
  totalServices,
  loading,
  onSelectCategory,
}: CategorySidebarProps) {
  return (
    <div className="w-72 shrink-0">
      <div className="sticky top-6">
        <div className="rounded-xl border bg-card overflow-hidden">
          {/* 头部 */}
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">服务分类</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {categories.length} 个分类
            </p>
          </div>

          {/* 内容 */}
          <div className="p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <nav className="space-y-1">
                {/* 全部服务 */}
                <button
                  onClick={() => onSelectCategory(null)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2.5 rounded-full text-sm transition-all',
                    selectedCategory === null
                      ? 'bg-accent shadow-sm'
                      : 'hover:bg-accent/50'
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted">
                      <Folder className="h-4 w-4" />
                    </div>
                    <span className="font-medium">全部服务</span>
                  </span>
                  <Badge variant="outline" className="font-normal">
                    {totalServices}
                  </Badge>
                </button>

                {/* 分类列表 */}
                {categories.length > 0 && (
                  <div className="pt-2 mt-2 border-t">
                    {categories.map((cat) => (
                      <CategoryItem
                        key={cat.id}
                        category={cat}
                        isSelected={selectedCategory === cat.id}
                        onSelect={() => onSelectCategory(cat.id)}
                      />
                    ))}
                  </div>
                )}
              </nav>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

// ========== 分类项组件 ==========

function CategoryItem({
  category,
  isSelected,
  onSelect,
}: {
  category: ServiceCategory
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-all',
        isSelected
          ? 'bg-accent shadow-sm'
          : 'hover:bg-accent/50'
      )}
    >
      {/* 分类图标与颜色 */}
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
        style={{
          backgroundColor: category.color + '15',
          color: category.color,
        }}
      >
        <DynamicIcon iconKey={category.icon_key} className="h-4 w-4" />
      </div>

      {/* 分类信息 */}
      <div className="flex-1 text-left min-w-0">
        <div className="font-medium truncate">{category.name}</div>
        {category.description && (
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {category.description}
          </div>
        )}
      </div>

      {/* 数量和箭头 */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            isSelected
              ? 'bg-foreground/10 text-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {category.service_count}
        </span>
        <ChevronRight
          className={cn(
            'h-4 w-4 text-muted-foreground',
            isSelected && 'text-foreground'
          )}
        />
      </div>
    </button>
  )
}
