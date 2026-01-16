/**
 * UserManagementPage - 用户管理页面
 * Phase 4.2: 用户列表、统计、筛选和状态管理
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Users, Loader2 } from 'lucide-react';
import { UserStatsCard } from './components/UserStatsCard';
import { UserTable } from './components/UserTable';
import {
  getAuthIndexStats,
  getAuthUsers,
  rebuildAuthIndex,
  type AuthIndexStats,
  type UserRecord,
} from '@/api/indexes';
import { getRoles, type Role } from '@/api/user-settings';

interface Filters {
  role?: string;
  status?: string;
  search?: string;
}

export function UserManagementPage() {
  // 状态
  const [stats, setStats] = useState<AuthIndexStats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({});

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rebuildSuccess, setRebuildSuccess] = useState(false);

  const limit = 20;

  // 加载统计
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await getAuthIndexStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // 加载用户列表
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError(null);
    try {
      const data = await getAuthUsers({
        role: filters.role,
        status: filters.status as never,
        search: filters.search,
        page,
        limit,
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoadingUsers(false);
    }
  }, [filters, page]);

  // 加载角色列表
  const loadRoles = useCallback(async () => {
    try {
      const data = await getRoles();
      setRoles(data.roles);
    } catch (e) {
      console.error('Failed to load roles:', e);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadStats();
    loadRoles();
  }, [loadStats, loadRoles]);

  // 加载用户列表
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 重建索引
  async function handleRebuild() {
    setRebuilding(true);
    setError(null);
    setRebuildSuccess(false);

    try {
      await rebuildAuthIndex();
      setRebuildSuccess(true);
      setTimeout(() => setRebuildSuccess(false), 3000);

      // 刷新数据
      await Promise.all([loadStats(), loadUsers()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '重建失败');
    } finally {
      setRebuilding(false);
    }
  }

  // 处理筛选变更
  function handleFilterChange(newFilters: Filters) {
    setFilters(newFilters);
    setPage(1);
  }

  // 处理刷新
  function handleRefresh() {
    loadStats();
    loadUsers();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="h-14 border-b bg-white flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link to="/workspace">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-600" />
            <span className="font-semibold text-lg tracking-tight">用户管理</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRebuild}
          disabled={rebuilding}
        >
          {rebuilding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              重建中...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              重建索引
            </>
          )}
        </Button>
      </header>

      {/* Content */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* 错误提示 */}
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 成功提示 */}
        {rebuildSuccess && (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm">
            索引重建成功
          </div>
        )}

        {/* 统计概览 */}
        <section>
          <h2 className="text-lg font-medium text-slate-800 mb-4">统计概览</h2>
          <UserStatsCard stats={stats} loading={loadingStats} />
        </section>

        {/* 用户列表 */}
        <section>
          <h2 className="text-lg font-medium text-slate-800 mb-4">用户列表</h2>
          <UserTable
            users={users}
            roles={roles}
            total={total}
            page={page}
            limit={limit}
            loading={loadingUsers}
            onPageChange={setPage}
            onFilterChange={handleFilterChange}
            onRefresh={handleRefresh}
          />
        </section>

        {/* 最后更新时间 */}
        {stats?.lastUpdate && (
          <div className="text-center text-sm text-muted-foreground">
            索引更新时间: {new Date(stats.lastUpdate).toLocaleString('zh-CN')}
          </div>
        )}
      </main>
    </div>
  );
}

export default UserManagementPage;





