import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useModal } from '@/components/modal'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  getPositions,
  deletePosition,
  getDepartments,
  type Position,
} from '@/api/organization'
import { Plus, Search, Pencil, Trash2, Loader, Briefcase } from 'lucide-react'

const LEVEL_LABELS: Record<number, string> = {
  1: 'L1 高管',
  2: 'L2 总监',
  3: 'L3 经理',
  4: 'L4 主管',
  5: 'L5 专员',
  6: 'L6 实习',
}

export function PositionList() {
  const queryClient = useQueryClient()
  const { openModal } = useModal()
  const [search, setSearch] = useState('')

  // 获取职位列表
  const { data, isLoading, error } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const response = await getPositions()
      if (!response.success) throw new Error(response.error?.message || '获取职位列表失败')
      return response.positions || []
    },
  })

  // 获取部门列表用于显示关联
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await getDepartments()
      return response.departments || []
    },
  })

  const positions = data || []
  const departments = departmentsData || []

  const getDepartmentName = (code?: string) => {
    if (!code) return '-'
    const dept = departments.find((d) => d.code === code)
    return dept?.name || code
  }

  const filteredPositions = positions.filter(
    (pos) =>
      pos.name.toLowerCase().includes(search.toLowerCase()) ||
      pos.code.toLowerCase().includes(search.toLowerCase()) ||
      pos.description?.toLowerCase().includes(search.toLowerCase())
  )

  // 删除职位
  const deleteMutation = useMutation({
    mutationFn: deletePosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] })
    },
  })

  const handleDelete = (position: Position) => {
    if (confirm(`确定要删除职位 "${position.name}" 吗？`)) {
      deleteMutation.mutate(position.id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">加载失败: {(error as Error).message}</p>
      </div>
    )
  }

  usePageTitle('职位设置', `共 ${positions.length} 个职位`)

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索职位..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => openModal('position.create', { departments })}>
          <Plus className="mr-2 h-4 w-4" />
          添加职位
        </Button>
      </div>

      {/* Positions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPositions.map((position) => (
          <Card key={position.id} className="group relative">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{position.name}</h3>
                    <Badge variant={position.status === 'active' ? 'green' : 'secondary'}>
                      {position.status === 'active' ? '启用' : '停用'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">代码: {position.code}</p>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">职级:</span>
                  <Badge variant="outline">{LEVEL_LABELS[position.level] || `L${position.level}`}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">所属部门:</span>
                  <span>{getDepartmentName(position.department_code)}</span>
                </div>
              </div>

              {position.description && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{position.description}</p>
              )}

              <div className="mt-4 text-xs text-muted-foreground">
                创建于 {position.created_at}
              </div>

              {/* Actions */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openModal('position.edit', { position, departments })}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(position)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPositions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {search ? '没有找到匹配的职位' : '暂无职位数据'}
        </div>
      )}
    </div>
  )
}
