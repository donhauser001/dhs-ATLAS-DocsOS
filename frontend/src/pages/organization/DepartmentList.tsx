import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useModal } from '@/components/modal'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  getDepartments,
  deleteDepartment,
  type Department,
} from '@/api/organization'
import { Plus, Search, Pencil, Trash2, Loader, Building } from 'lucide-react'

export function DepartmentList() {
  const queryClient = useQueryClient()
  const { openModal } = useModal()
  const [search, setSearch] = useState('')

  // 获取部门列表
  const { data, isLoading, error } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await getDepartments()
      if (!response.success) throw new Error(response.error?.message || '获取部门列表失败')
      return response.departments || []
    },
  })

  const departments = data || []

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(search.toLowerCase()) ||
      dept.code.toLowerCase().includes(search.toLowerCase()) ||
      dept.description?.toLowerCase().includes(search.toLowerCase())
  )

  // 删除部门
  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })

  const handleDelete = (department: Department) => {
    if (confirm(`确定要删除部门 "${department.name}" 吗？`)) {
      deleteMutation.mutate(department.id)
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

  usePageTitle('部门管理', `共 ${departments.length} 个部门`)

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-end">
        <Button onClick={() => openModal('department.create')}>
          <Plus className="mr-2 h-4 w-4" />
          添加部门
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索部门..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDepartments.map((dept) => (
          <Card key={dept.id} className="group relative">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{dept.name}</h3>
                    <Badge variant={dept.status === 'active' ? 'green' : 'secondary'}>
                      {dept.status === 'active' ? '启用' : '停用'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">代码: {dept.code}</p>
                </div>
              </div>

              {dept.description && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{dept.description}</p>
              )}

              <div className="mt-4 text-xs text-muted-foreground">
                创建于 {dept.created_at}
              </div>

              {/* Actions */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openModal('department.edit', { department: dept })}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(dept)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDepartments.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {search ? '没有找到匹配的部门' : '暂无部门数据'}
        </div>
      )}
    </div>
  )
}
