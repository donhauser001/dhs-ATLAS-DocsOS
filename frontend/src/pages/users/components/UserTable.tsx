/**
 * UserTable - 用户列表表格组件
 * Phase 4.2: 展示用户列表，支持筛选、搜索、状态操作
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Unlock, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { type UserRecord, type AccountStatus, updateUserStatus } from '@/api/indexes';
import { type Role } from '@/api/user-settings';

interface UserTableProps {
  users: UserRecord[];
  roles: Role[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: { role?: string; status?: string; search?: string }) => void;
  onRefresh: () => void;
}

const STATUS_LABELS: Record<AccountStatus, { label: string; color: string }> = {
  active: { label: '已启用', color: 'bg-green-100 text-green-800' },
  pending: { label: '待激活', color: 'bg-amber-100 text-amber-800' },
  disabled: { label: '已禁用', color: 'bg-red-100 text-red-800' },
  locked: { label: '已锁定', color: 'bg-orange-100 text-orange-800' },
  expired: { label: '已过期', color: 'bg-purple-100 text-purple-800' },
};

export function UserTable({
  users,
  roles,
  total,
  page,
  limit,
  loading,
  onPageChange,
  onFilterChange,
  onRefresh,
}: UserTableProps) {
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const totalPages = Math.ceil(total / limit);

  // 处理搜索
  function handleSearch() {
    onFilterChange({
      role: roleFilter === 'all' ? undefined : roleFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchInput || undefined,
    });
  }

  // 处理筛选变更
  function handleRoleChange(value: string) {
    setRoleFilter(value);
    onFilterChange({
      role: value === 'all' ? undefined : value,
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchInput || undefined,
    });
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    onFilterChange({
      role: roleFilter === 'all' ? undefined : roleFilter,
      status: value === 'all' ? undefined : value,
      search: searchInput || undefined,
    });
  }

  // 更新用户状态
  async function handleStatusUpdate(userId: string, status: AccountStatus) {
    setUpdating(userId);
    try {
      await updateUserStatus(userId, status);
      onRefresh();
    } catch (e) {
      console.error('Failed to update status:', e);
    } finally {
      setUpdating(null);
    }
  }

  // 获取角色显示颜色
  function getRoleColor(roleId: string): string {
    const role = roles.find(r => r.id === roleId);
    return role?.color || '#64748b';
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* 筛选栏 */}
      <div className="p-4 border-b flex flex-wrap gap-3 items-center">
        <Select value={roleFilter} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="全部角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部角色</SelectItem>
            {roles.map(role => (
              <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">已启用</SelectItem>
            <SelectItem value="pending">待激活</SelectItem>
            <SelectItem value="disabled">已禁用</SelectItem>
            <SelectItem value="locked">已锁定</SelectItem>
            <SelectItem value="expired">已过期</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1 min-w-[200px] max-w-[300px] flex gap-2">
          <Input
            placeholder="搜索用户名、邮箱..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-sm text-muted-foreground ml-auto">
          共 {total} 个用户
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">用户</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">角色</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">最后登录</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">文档路径</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  暂无用户数据
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.user_id} className="border-b hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-slate-900">{user.username}</div>
                      <div className="text-sm text-slate-500">{user.email || user.user_id}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="outline" 
                      style={{ borderColor: getRoleColor(user.role), color: getRoleColor(user.role) }}
                    >
                      {user.role_name || user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_LABELS[user.status]?.color || 'bg-slate-100'}>
                      {STATUS_LABELS[user.status]?.label || user.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {user.last_login ? new Date(user.last_login).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                    {user._doc_path}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={updating === user.user_id}>
                          {updating === user.user_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => window.open(`/workspace/${user._doc_path}`, '_blank')}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          查看文档
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status !== 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(user.user_id, 'active')}>
                            <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                            启用账户
                          </DropdownMenuItem>
                        )}
                        {user.status === 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(user.user_id, 'disabled')}>
                            <UserX className="h-4 w-4 mr-2 text-red-600" />
                            禁用账户
                          </DropdownMenuItem>
                        )}
                        {user.status === 'locked' && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(user.user_id, 'active')}>
                            <Unlock className="h-4 w-4 mr-2 text-orange-600" />
                            解锁账户
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            第 {page} / {totalPages} 页
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserTable;

