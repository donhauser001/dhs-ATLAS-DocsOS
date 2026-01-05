/**
 * AuditLog 组件 - 数据块控件
 */

import { useState, useEffect } from 'react';
import { History, User, Calendar, ArrowRight } from 'lucide-react';
import { ControlProps, AuditLogComponentDefinition } from '../../types';

interface AuditEntry {
    id: string;
    timestamp: string;
    user?: string;
    action: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
}

export function Control({ component, value }: ControlProps) {
    const auditDef = component as AuditLogComponentDefinition;
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(false);

    // 解析值或从 API 获取
    useEffect(() => {
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    setEntries(parsed.slice(0, auditDef.limit || 10));
                }
            } catch {
                // 忽略解析错误
            }
        } else if (Array.isArray(value)) {
            setEntries(value.slice(0, auditDef.limit || 10));
        }
    }, [value, auditDef.limit]);

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-2">
            {/* 标题栏 */}
            <div className="flex items-center gap-2 text-slate-500 text-sm">
                <History className="h-4 w-4" />
                <span>变更记录</span>
            </div>

            {/* 日志列表 */}
            {loading ? (
                <div className="text-center py-4 text-sm text-slate-400">
                    加载中...
                </div>
            ) : entries.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-400 bg-slate-50 rounded-lg">
                    暂无变更记录
                </div>
            ) : (
                <div className="space-y-2">
                    {entries.map((entry, index) => (
                        <div 
                            key={entry.id || index} 
                            className="p-3 bg-slate-50 rounded-lg text-sm"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    {auditDef.showUser && entry.user && (
                                        <span className="flex items-center gap-1 text-slate-600">
                                            <User className="h-3.5 w-3.5" />
                                            {entry.user}
                                        </span>
                                    )}
                                    <span className="text-slate-500">{entry.action}</span>
                                </div>
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(entry.timestamp)}
                                </span>
                            </div>

                            {/* 差异展示 */}
                            {auditDef.showDiff && entry.field && (
                                <div className="mt-2 p-2 bg-white rounded border border-slate-200 text-xs">
                                    <div className="text-slate-500 mb-1">
                                        字段: <span className="font-mono">{entry.field}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded">
                                            {entry.oldValue || '(空)'}
                                        </span>
                                        <ArrowRight className="h-3 w-3 text-slate-300" />
                                        <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded">
                                            {entry.newValue || '(空)'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Control;

