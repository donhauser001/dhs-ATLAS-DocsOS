/**
 * Audit Log Settings - 审计日志设置页面
 * 
 * Phase 4.2: 审计日志查看界面
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  RefreshCw, 
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Key,
  UserCog,
  Shield,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getAuditLogs,
  getAuditStats,
  getEventTypeName,
  type AuditLog,
  type AuditEventType,
  type AuditStats,
} from '@/api/audit';

const PAGE_SIZE = 20;

// 事件类型图标映射
const EVENT_ICONS: Record<AuditEventType, React.ComponentType<{ className?: string }>> = {
  LOGIN_SUCCESS: LogIn,
  LOGIN_FAILURE: XCircle,
  LOGOUT: LogOut,
  PASSWORD_CHANGE: Key,
  PASSWORD_RESET: Key,
  ROLE_CHANGE: UserCog,
  STATUS_CHANGE: Shield,
  USER_CREATE: UserPlus,
  USER_DELETE: UserMinus,
  ACCOUNT_LOCKED: Lock,
  ACCOUNT_UNLOCKED: Unlock,
};

// 事件类型颜色
const EVENT_COLORS: Partial<Record<AuditEventType, string>> = {
  LOGIN_SUCCESS: 'bg-green-100 text-green-800',
  LOGIN_FAILURE: 'bg-red-100 text-red-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  PASSWORD_CHANGE: 'bg-blue-100 text-blue-800',
  PASSWORD_RESET: 'bg-orange-100 text-orange-800',
  ROLE_CHANGE: 'bg-purple-100 text-purple-800',
  STATUS_CHANGE: 'bg-yellow-100 text-yellow-800',
  USER_CREATE: 'bg-green-100 text-green-800',
  USER_DELETE: 'bg-red-100 text-red-800',
  ACCOUNT_LOCKED: 'bg-red-100 text-red-800',
  ACCOUNT_UNLOCKED: 'bg-green-100 text-green-800',
};

// 简单的卡片组件
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col space-y-1.5 p-6">{children}</div>;
}

function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
}

function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}

// 简单的 Badge 组件
function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

export function AuditLogSettings() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 筛选条件
  const [eventType, setEventType] = useState<AuditEventType | 'all'>('all');
  const [dateRange, setDateRange] = useState<'7' | '14' | '30'>('7');
  const [searchUserId, setSearchUserId] = useState('');
  
  // 分页
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      const [logsRes, statsRes] = await Promise.all([
        getAuditLogs({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          eventType: eventType === 'all' ? undefined : eventType,
          userId: searchUserId || undefined,
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        }),
        getAuditStats(parseInt(dateRange)),
      ]);
      
      setLogs(logsRes.logs);
      setTotal(logsRes.total);
      setStats(statsRes.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [eventType, dateRange, searchUserId, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 总页数
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总事件数</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">登录成功</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.byEventType.LOGIN_SUCCESS || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">登录失败</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.failedLogins}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">密码变更</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(stats.byEventType.PASSWORD_CHANGE || 0) + (stats.byEventType.PASSWORD_RESET || 0)}
                  </p>
                </div>
                <Key className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>时间范围</Label>
              <Select value={dateRange} onValueChange={(v) => { setDateRange(v as '7' | '14' | '30'); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">最近 7 天</SelectItem>
                  <SelectItem value="14">最近 14 天</SelectItem>
                  <SelectItem value="30">最近 30 天</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>事件类型</Label>
              <Select value={eventType} onValueChange={(v) => { setEventType(v as AuditEventType | 'all'); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="LOGIN_SUCCESS">登录成功</SelectItem>
                  <SelectItem value="LOGIN_FAILURE">登录失败</SelectItem>
                  <SelectItem value="LOGOUT">登出</SelectItem>
                  <SelectItem value="PASSWORD_CHANGE">修改密码</SelectItem>
                  <SelectItem value="PASSWORD_RESET">重置密码</SelectItem>
                  <SelectItem value="ROLE_CHANGE">角色变更</SelectItem>
                  <SelectItem value="STATUS_CHANGE">状态变更</SelectItem>
                  <SelectItem value="ACCOUNT_LOCKED">账户锁定</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>用户 ID</Label>
              <Input
                placeholder="输入用户 ID 搜索"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={loadData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 日志列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            审计日志
          </CardTitle>
          <CardDescription>
            共 {total} 条记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[140px]">时间</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[120px]">事件</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">用户</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">目标用户</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">IP 地址</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">详情</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      暂无日志记录
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const Icon = EVENT_ICONS[log.event_type] || FileText;
                    const colorClass = EVENT_COLORS[log.event_type] || 'bg-gray-100 text-gray-800';
                    
                    return (
                      <tr key={log.id} className="border-b">
                        <td className="p-4 text-sm font-mono">
                          {formatTime(log.timestamp)}
                        </td>
                        <td className="p-4">
                          <Badge className={`${colorClass} flex items-center gap-1 w-fit`}>
                            <Icon className="h-3 w-3" />
                            {getEventTypeName(log.event_type)}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {log.username || log.user_id || '-'}
                        </td>
                        <td className="p-4">
                          {log.target_username || log.target_user_id || '-'}
                        </td>
                        <td className="p-4 text-sm font-mono">
                          {log.ip_address}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground max-w-[200px] truncate">
                          {Object.keys(log.details).length > 0 
                            ? JSON.stringify(log.details)
                            : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                第 {page} / {totalPages} 页
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
