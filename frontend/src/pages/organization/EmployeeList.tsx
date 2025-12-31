import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useModal } from '@/components/modal'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  getUsers,
  deleteUser,
} from '@/api/auth'
import type { User } from '@/stores/auth'
import { useAuthStore } from '@/stores/auth'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Key,
  Loader,
  Mail,
  Phone,
  Building,
  Eye,
} from 'lucide-react'

export function EmployeeList() {
  const queryClient = useQueryClient()
  const { openModal } = useModal()
  const currentUser = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await getUsers()
      if (!response.success) {
        throw new Error(response.error?.message || '获取用户失败')
      }
      return response
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const filteredUsers = data?.users?.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()))
  )

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('不能删除自己')
      return
    }
    if (confirm(`确定要删除用户 "${user.name}" 吗？`)) {
      const result = await deleteMutation.mutateAsync(user.id)
      if (!result.success) {
        alert(result.error?.message || '删除失败')
      }
    }
  }

  const handleView = (user: User) => {
    openModal('employee.view', {
      user,
      onEdit: () => {
        openModal('employee.edit', { user })
      },
    })
  }

  usePageTitle('员工列表', `共 ${data?.total || 0} 名员工`)

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索员工..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => openModal('employee.create')}>
          <Plus className="mr-2 h-4 w-4" />
          添加员工
        </Button>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="py-12 text-center text-destructive">
          加载失败: {(error as Error).message}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers?.map((user) => (
            <Card key={user.id} className="relative group">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-medium shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      user.name[0]
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{user.name}</h3>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {(user.department || user.position) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {user.department}{user.department && user.position ? ' · ' : ''}{user.position}
                      </span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="mt-4 flex items-center justify-between">
                  <Badge variant={getStatusVariant(user.status)}>
                    {getStatusLabel(user.status)}
                  </Badge>
                  {user.last_login && (
                    <span className="text-xs text-muted-foreground">
                      最后登录: {new Date(user.last_login).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleView(user)}
                    title="查看详情"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openModal('employee.edit', { user })}
                    title="编辑"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openModal('employee.reset-password', { user })}
                    title="重置密码"
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(user)}
                    disabled={user.id === currentUser?.id}
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function getRoleBadgeVariant(role: string) {
  const map: Record<string, 'default' | 'secondary' | 'outline'> = {
    admin: 'default',
    member: 'secondary',
  }
  return map[role] || 'secondary'
}

function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    admin: '管理员',
    member: '成员',
  }
  return map[role] || role
}

function getStatusVariant(status: string) {
  const map: Record<string, 'green' | 'gray' | 'orange'> = {
    active: 'green',
    inactive: 'gray',
    pending: 'orange',
  }
  return map[status] || 'gray'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    active: '正常',
    inactive: '禁用',
    pending: '待激活',
  }
  return map[status] || status
}
