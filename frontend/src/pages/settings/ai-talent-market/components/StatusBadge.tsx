/**
 * StatusBadge - 状态徽章组件
 * 
 * 显示 AI 员工的工作状态
 */

import { Play, Pause, Clock } from 'lucide-react';
import type { HiredStatus } from '../types';

interface StatusBadgeProps {
    status: HiredStatus;
}

const STATUS_CONFIG = {
    active: {
        icon: Play,
        label: '工作中',
        className: 'bg-green-100 text-green-700',
    },
    paused: {
        icon: Pause,
        label: '已暂停',
        className: 'bg-yellow-100 text-yellow-700',
    },
    onboarding: {
        icon: Clock,
        label: '入职中',
        className: 'bg-blue-100 text-blue-700',
    },
} as const;

export function StatusBadge({ status }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
            <Icon className="h-3 w-3" />
            {config.label}
        </span>
    );
}

export default StatusBadge;

