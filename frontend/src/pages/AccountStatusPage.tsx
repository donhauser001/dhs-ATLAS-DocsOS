/**
 * AccountStatusPage - 账户状态提示页面
 * Phase 4.2: 根据状态显示不同的提示内容
 */

import { useParams, Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth';
import { Button } from '@/components/ui/button';
import {
  Clock,
  ShieldOff,
  Lock,
  Calendar,
  Mail,
  Phone,
  AlertTriangle,
} from 'lucide-react';

type AccountStatus = 'pending' | 'disabled' | 'locked' | 'expired';

interface StatusConfig {
  icon: typeof Clock;
  iconColor: string;
  bgColor: string;
  title: string;
  description: string;
  actions: {
    label: string;
    to?: string;
    onClick?: () => void;
    variant?: 'default' | 'outline';
  }[];
  tips?: string[];
}

const statusConfigs: Record<AccountStatus, StatusConfig> = {
  pending: {
    icon: Clock,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-100',
    title: '账户待激活',
    description: '您的账户尚未完成激活。请检查您的注册邮箱，点击激活链接完成激活。',
    actions: [
      { label: '重新发送激活邮件', to: '/pending-activation' },
      { label: '返回登录', to: '/login', variant: 'outline' },
    ],
    tips: [
      '检查收件箱和垃圾邮件文件夹',
      '激活链接有效期为 24 小时',
      '如多次未收到邮件，请联系管理员',
    ],
  },
  disabled: {
    icon: ShieldOff,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    title: '账户已禁用',
    description: '您的账户已被管理员禁用。这可能是由于违反使用条款或其他安全原因。',
    actions: [
      { label: '返回登录', to: '/login', variant: 'outline' },
    ],
    tips: [
      '如有疑问，请联系系统管理员',
      '说明您的账户用户名和联系方式',
      '等待管理员审核处理',
    ],
  },
  locked: {
    icon: Lock,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    title: '账户已锁定',
    description: '您的账户因多次登录失败或安全原因被临时锁定。请等待一段时间后重试，或联系管理员解锁。',
    actions: [
      { label: '重置密码', to: '/forgot-password' },
      { label: '返回登录', to: '/login', variant: 'outline' },
    ],
    tips: [
      '账户通常会在 30 分钟后自动解锁',
      '如需立即解锁，请联系管理员',
      '建议重置密码以确保账户安全',
    ],
  },
  expired: {
    icon: Calendar,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    title: '账户已过期',
    description: '您的账户有效期已结束。如需继续使用，请联系管理员办理续期。',
    actions: [
      { label: '返回登录', to: '/login', variant: 'outline' },
    ],
    tips: [
      '联系管理员了解续期方式',
      '准备好您的用户信息',
      '续期后即可正常使用',
    ],
  },
};

export function AccountStatusPage() {
  const { status } = useParams<{ status: string }>();

  const config = statusConfigs[status as AccountStatus];

  // 无效状态
  if (!config) {
    return (
      <AuthLayout title="页面不存在" showBackToLogin>
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-600 mb-6">请求的页面不存在</p>
          <Link to="/login">
            <Button>返回登录</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const Icon = config.icon;

  return (
    <AuthLayout title={config.title}>
      <div className="text-center py-4">
        {/* 图标 */}
        <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`h-8 w-8 ${config.iconColor}`} />
        </div>

        {/* 标题和描述 */}
        <h3 className="text-lg font-medium text-slate-900 mb-2">{config.title}</h3>
        <p className="text-slate-600 mb-6">{config.description}</p>

        {/* 操作按钮 */}
        <div className="space-y-3 mb-6">
          {config.actions.map((action, idx) => (
            <Link key={idx} to={action.to || '#'} className="block">
              <Button
                variant={action.variant || 'default'}
                className="w-full"
              >
                {action.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* 提示信息 */}
        {config.tips && config.tips.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4 text-left">
            <p className="text-sm font-medium text-slate-700 mb-2">提示</p>
            <ul className="text-xs text-slate-500 space-y-1">
              {config.tips.map((tip, idx) => (
                <li key={idx}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 联系方式 */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-sm font-medium text-slate-700 mb-3">联系管理员</p>
          <div className="flex justify-center gap-6 text-sm text-slate-500">
            <a href="mailto:admin@example.com" className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
              <Mail className="h-4 w-4" />
              <span>邮件联系</span>
            </a>
            <a href="tel:+8612345678900" className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
              <Phone className="h-4 w-4" />
              <span>电话联系</span>
            </a>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}





