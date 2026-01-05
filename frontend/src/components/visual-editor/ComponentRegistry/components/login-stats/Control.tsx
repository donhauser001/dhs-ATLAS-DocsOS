/**
 * LoginStats 组件 - 数据块控件
 */

import { LogIn, Clock, Hash, Monitor } from 'lucide-react';
import { ControlProps, LoginStatsComponentDefinition } from '../../types';

interface LoginStatsData {
    lastLogin?: string;
    loginCount?: number;
    device?: string;
    ip?: string;
}

export function Control({ component, value }: ControlProps) {
    const statsDef = component as LoginStatsComponentDefinition;

    // 解析值
    const stats: LoginStatsData = typeof value === 'string' 
        ? JSON.parse(value || '{}') 
        : (value as LoginStatsData) || {};

    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return '从未登录';
        const date = new Date(dateStr);
        return date.toLocaleString('zh-CN');
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                {/* 最后登录时间 */}
                {statsDef.showLastLogin !== false && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs">最后登录</span>
                        </div>
                        <div className="text-sm font-medium text-slate-700">
                            {formatDate(stats.lastLogin)}
                        </div>
                    </div>
                )}

                {/* 登录次数 */}
                {statsDef.showLoginCount && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Hash className="h-4 w-4" />
                            <span className="text-xs">登录次数</span>
                        </div>
                        <div className="text-sm font-medium text-slate-700">
                            {stats.loginCount ?? 0} 次
                        </div>
                    </div>
                )}

                {/* 设备信息 */}
                {statsDef.showDevice && stats.device && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Monitor className="h-4 w-4" />
                            <span className="text-xs">设备</span>
                        </div>
                        <div className="text-sm font-medium text-slate-700">
                            {stats.device}
                        </div>
                    </div>
                )}

                {/* IP地址 */}
                {statsDef.showIp && stats.ip && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <LogIn className="h-4 w-4" />
                            <span className="text-xs">IP地址</span>
                        </div>
                        <div className="text-sm font-medium text-slate-700 font-mono">
                            {stats.ip}
                        </div>
                    </div>
                )}
            </div>

            {/* 无数据提示 */}
            {!stats.lastLogin && !stats.loginCount && (
                <div className="text-center py-4 text-sm text-slate-400">
                    暂无登录记录
                </div>
            )}
        </div>
    );
}

export default Control;

