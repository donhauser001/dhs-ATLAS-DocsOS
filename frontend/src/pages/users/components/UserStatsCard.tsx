/**
 * UserStatsCard - 用户统计概览组件
 * Phase 4.2: 显示用户总数和各状态统计
 */

import { Users, UserCheck, Clock, UserX, Lock, Calendar } from 'lucide-react';
import { type AuthIndexStats } from '@/api/indexes';

interface UserStatsCardProps {
  stats: AuthIndexStats | null;
  loading?: boolean;
}

interface StatItem {
  label: string;
  value: number;
  icon: typeof Users;
  color: string;
  bgColor: string;
}

export function UserStatsCard({ stats, loading }: UserStatsCardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-16 mb-2" />
            <div className="h-8 bg-slate-200 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statItems: StatItem[] = [
    {
      label: '总用户',
      value: stats.total_users,
      icon: Users,
      color: 'text-slate-700',
      bgColor: 'bg-slate-100',
    },
    {
      label: '已启用',
      value: stats.by_status.active || 0,
      icon: UserCheck,
      color: 'text-green-700',
      bgColor: 'bg-green-100',
    },
    {
      label: '待激活',
      value: stats.by_status.pending || 0,
      icon: Clock,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
    },
    {
      label: '已禁用',
      value: stats.by_status.disabled || 0,
      icon: UserX,
      color: 'text-red-700',
      bgColor: 'bg-red-100',
    },
    {
      label: '已锁定',
      value: stats.by_status.locked || 0,
      icon: Lock,
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
    },
    {
      label: '已过期',
      value: stats.by_status.expired || 0,
      icon: Calendar,
      color: 'text-purple-700',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((item) => (
        <div key={item.label} className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-md ${item.bgColor}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <span className="text-sm text-slate-600">{item.label}</span>
          </div>
          <div className={`text-2xl font-semibold ${item.color}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default UserStatsCard;

