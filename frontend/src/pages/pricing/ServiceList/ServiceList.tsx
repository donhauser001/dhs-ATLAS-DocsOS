import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useModal } from '@/components/modal'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  getServiceCategories,
  getServices,
  deleteServiceCategory,
  deleteService,
  type Service,
  type ServiceCategory,
} from '@/api/service'
import { DynamicIcon } from '@/components/ui/icon-picker'
import {
  Plus,
  Search,
  Folder,
  Loader,
  Settings,
  LayoutGrid,
  List,
  X,
} from 'lucide-react'
import { ServiceCard, ServiceRow } from './ServiceCard'
import { CategorySidebar } from './CategorySidebar'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'list'

export function ServiceList() {
  const queryClient = useQueryClient()
  const { openModal } = useModal()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // 获取分类列表
  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const result = await getServiceCategories()
      if (!result.success) throw new Error(result.error?.message)
      return result.result
    },
  })

  // 获取服务列表
  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ['services', selectedCategory],
    queryFn: async () => {
      const result = await getServices(
        selectedCategory ? { category: selectedCategory } : {}
      )
      if (!result.success) throw new Error(result.error?.message)
      return result.result
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteServiceCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      if (selectedCategory) {
        setSelectedCategory(null)
      }
    },
  })

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['service-categories'] })
    },
  })

  const categories = categoriesData?.categories || []
  const services = servicesData?.services || []

  // 打开弹窗
  const handleCreateCategory = () => {
    openModal('category.create')
  }

  const handleCreateService = () => {
    openModal('service.create', { categories, defaultCategory: selectedCategory })
  }

  // 页面标题
  usePageTitle('服务清单', '管理服务项目和定价')

  // 获取当前选中分类的信息
  const currentCategory = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)
    : null

  // 筛选服务
  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.alias.toLowerCase().includes(search.toLowerCase()) ||
      (s.category_name || '').toLowerCase().includes(search.toLowerCase())
  )

  // 按分类分组服务
  const servicesByCategory = filteredServices.reduce(
    (acc, service) => {
      const catId = service.category
      if (!acc[catId]) {
        acc[catId] = []
      }
      acc[catId].push(service)
      return acc
    },
    {} as Record<string, Service[]>
  )

  const handleDeleteCategory = async (id: string) => {
    const cat = categories.find((c) => c.id === id)
    if (cat && cat.service_count > 0) {
      alert('该分类下还有服务，无法删除')
      return
    }
    if (confirm(`确定要删除分类 "${cat?.name}" 吗？`)) {
      const result = await deleteCategoryMutation.mutateAsync(id)
      if (!result.success) {
        alert(result.error?.message || '删除失败')
      }
    }
  }

  const handleDeleteService = async (service: Service) => {
    if (confirm(`确定要删除服务 "${service.name}" 吗？`)) {
      const result = await deleteServiceMutation.mutateAsync(service.id)
      if (!result.success) {
        alert(result.error?.message || '删除失败')
      }
    }
  }

  // 获取分类配置
  const getCategoryConfig = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)
  }

  const handleEditCategory = (category: ServiceCategory) => {
    openModal('category.edit', { category })
  }

  const handleEditService = (service: Service) => {
    openModal('service.edit', { service, categories })
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={handleCreateCategory}>
          <Folder className="mr-2 h-4 w-4" />
          新建分类
        </Button>
        <Button onClick={handleCreateService}>
          <Plus className="mr-2 h-4 w-4" />
          新建服务
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar - Categories */}
        <CategorySidebar
          categories={categories}
          selectedCategory={selectedCategory}
          totalServices={servicesData?.total || 0}
          loading={loadingCategories}
          onSelectCategory={setSelectedCategory}
        />

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Category Header (when selected) */}
          {currentCategory && (
            <CategoryHeader
              category={currentCategory}
              onEdit={() => handleEditCategory(currentCategory)}
              onClear={() => setSelectedCategory(null)}
            />
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索服务名称、别名..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* 右侧：统计信息和视图切换 */}
            <div className="flex items-center gap-4">
              {/* 统计 */}
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{filteredServices.length}</span>
                {' '}项服务
                {search && ` (共 ${services.length} 项)`}
              </div>

              {/* 视图切换 */}
              <div className="flex items-center rounded-full border bg-muted/30 p-1">
                <ViewModeButton
                  active={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                  icon={<LayoutGrid className="h-4 w-4" />}
                  title="网格视图"
                />
                <ViewModeButton
                  active={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                  icon={<List className="h-4 w-4" />}
                  title="列表视图"
                />
              </div>
            </div>
          </div>

          {/* Services */}
          <ServiceGrid
            services={filteredServices}
            servicesByCategory={servicesByCategory}
            selectedCategory={selectedCategory}
            loading={loadingServices}
            search={search}
            viewMode={viewMode}
            getCategoryConfig={getCategoryConfig}
            onEditService={handleEditService}
            onDeleteService={handleDeleteService}
          />
        </div>
      </div>
    </div>
  )
}

// ========== 视图模式按钮 ==========

function ViewModeButton({
  active,
  onClick,
  icon,
  title,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-full transition-colors',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
      title={title}
    >
      {icon}
    </button>
  )
}

// ========== 分类头部组件 ==========

function CategoryHeader({
  category,
  onEdit,
  onClear,
}: {
  category: ServiceCategory
  onEdit: () => void
  onClear: () => void
}) {
  return (
    <div
      className="p-4 rounded-xl border-2 transition-colors"
      style={{
        backgroundColor: category.color + '08',
        borderColor: category.color + '25',
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl shadow-sm"
          style={{ backgroundColor: category.color + '20', color: category.color }}
        >
          <DynamicIcon iconKey={category.icon_key} className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{category.name}</h2>
            <Badge variant="outline" className="font-normal">
              {category.service_count} 项服务
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {category.description || '暂无描述'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-1" />
            清除筛选
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Settings className="h-4 w-4 mr-1" />
            编辑分类
          </Button>
        </div>
      </div>
    </div>
  )
}

// ========== 服务网格组件 ==========

function ServiceGrid({
  services,
  servicesByCategory,
  selectedCategory,
  loading,
  search,
  viewMode,
  getCategoryConfig,
  onEditService,
  onDeleteService,
}: {
  services: Service[]
  servicesByCategory: Record<string, Service[]>
  selectedCategory: string | null
  loading: boolean
  search: string
  viewMode: ViewMode
  getCategoryConfig: (id: string) => ServiceCategory | undefined
  onEditService: (service: Service) => void
  onDeleteService: (service: Service) => void
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Folder className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-1">
          {search ? '没有找到匹配的服务' : '暂无服务'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {search ? '尝试使用其他关键词搜索' : '点击右上角"新建服务"开始添加'}
        </p>
      </div>
    )
  }

  // 列表视图
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {selectedCategory ? (
          <ListViewSection
            services={services}
            getCategoryConfig={getCategoryConfig}
            onEditService={onEditService}
            onDeleteService={onDeleteService}
          />
        ) : (
          Object.entries(servicesByCategory).map(([categoryId, categoryServices]) => (
            <div key={categoryId}>
              <CategorySectionHeader
                category={getCategoryConfig(categoryId)}
                count={categoryServices.length}
              />
              <ListViewSection
                services={categoryServices}
                getCategoryConfig={getCategoryConfig}
                onEditService={onEditService}
                onDeleteService={onDeleteService}
              />
            </div>
          ))
        )}
      </div>
    )
  }

  // 网格视图
  const gridCols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

  // 显示单个分类的服务
  if (selectedCategory) {
    return (
      <div className={cn('grid gap-4', gridCols)}>
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            categoryConfig={getCategoryConfig(service.category)}
            onEdit={() => onEditService(service)}
            onDelete={() => onDeleteService(service)}
          />
        ))}
      </div>
    )
  }

  // 按分类分组显示
  return (
    <div className="space-y-8">
      {Object.entries(servicesByCategory).map(([categoryId, categoryServices]) => {
        const catConfig = getCategoryConfig(categoryId)
        return (
          <div key={categoryId}>
            <CategorySectionHeader category={catConfig} count={categoryServices.length} />
            <div className={cn('grid gap-4', gridCols)}>
              {categoryServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  categoryConfig={catConfig}
                  onEdit={() => onEditService(service)}
                  onDelete={() => onDeleteService(service)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ========== 分类区块头部 ==========

function CategorySectionHeader({
  category,
  count,
}: {
  category?: ServiceCategory
  count: number
}) {
  if (!category) return null

  return (
    <div className="flex items-center gap-3 mb-4 pb-2 border-b">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-xl"
        style={{ backgroundColor: category.color + '15', color: category.color }}
      >
        <DynamicIcon iconKey={category.icon_key} className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-foreground">{category.name}</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      {category.description && (
        <span className="text-sm text-muted-foreground hidden md:inline">
          — {category.description}
        </span>
      )}
    </div>
  )
}

// ========== 列表视图区块 ==========

function ListViewSection({
  services,
  getCategoryConfig,
  onEditService,
  onDeleteService,
}: {
  services: Service[]
  getCategoryConfig: (id: string) => ServiceCategory | undefined
  onEditService: (service: Service) => void
  onDeleteService: (service: Service) => void
}) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* 表头 */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
        <div className="w-1" />
        <div className="flex-1">服务名称</div>
        <div className="hidden md:block w-28">分类</div>
        <div className="w-32 text-right">价格</div>
        <div className="w-24" />
      </div>
      {/* 内容 */}
      {services.map((service) => (
        <ServiceRow
          key={service.id}
          service={service}
          categoryConfig={getCategoryConfig(service.category)}
          onEdit={() => onEditService(service)}
          onDelete={() => onDeleteService(service)}
        />
      ))}
    </div>
  )
}
