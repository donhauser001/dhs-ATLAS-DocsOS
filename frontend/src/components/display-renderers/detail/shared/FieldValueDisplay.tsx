/**
 * FieldValueDisplay - 字段值渲染组件
 * 
 * 根据字段类型渲染不同的显示方式
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Tag, Check, X, FileText } from 'lucide-react';
import { getStatusColor } from '../types';
import { cn } from '@/lib/utils';

export interface FieldValueDisplayProps {
    type: string;
    value: unknown;
    displayValue: string;
    option?: { color?: string; label?: string };
}

export const FieldValueDisplay: React.FC<FieldValueDisplayProps> = ({ type, value, displayValue, option }) => {
    if (displayValue === '—') {
        return <span className="text-slate-400">—</span>;
    }

    switch (type) {
        case 'select':
            if (option?.color) {
                const colors = getStatusColor(option.color);
                return (
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                        {displayValue}
                    </span>
                );
            }
            return <span>{displayValue}</span>;

        case 'image':
        case 'avatar': {
            const imgSrc = value as string;
            if (!imgSrc) {
                return <span className="text-slate-400">—</span>;
            }
            const finalSrc = imgSrc.startsWith('data:') || imgSrc.startsWith('http')
                ? imgSrc
                : `/api/files/preview?path=${encodeURIComponent(imgSrc)}`;
            return (
                <div className="inline-block">
                    <img
                        src={finalSrc}
                        alt="图片"
                        className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                    />
                </div>
            );
        }

        case 'url':
        case 'link':
            return (
                <a
                    href={value as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                >
                    {displayValue}
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
            );

        case 'email':
            return (
                <a
                    href={`mailto:${value}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                    {displayValue}
                </a>
            );

        case 'phone':
            return (
                <a
                    href={`tel:${value}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                    {displayValue}
                </a>
            );

        case 'currency':
            return <span className="font-semibold text-green-600">{displayValue}</span>;

        case 'textarea':
            return <p className="text-slate-600 whitespace-pre-wrap">{displayValue}</p>;

        case 'toggle':
        case 'boolean': {
            const boolValue = value === true || value === 'true' || value === 1;
            return (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm ${boolValue ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {boolValue ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    {boolValue ? '是' : '否'}
                </span>
            );
        }

        case 'tags': {
            let tags: string[] = [];
            if (Array.isArray(value)) {
                tags = value.map(String);
            } else if (typeof value === 'string' && value !== 'null' && value !== '') {
                try {
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) {
                        tags = parsed.map(String);
                    } else {
                        tags = value.split(',').map(t => t.trim()).filter(Boolean);
                    }
                } catch {
                    tags = value.split(',').map(t => t.trim()).filter(Boolean);
                }
            }
            if (tags.length === 0) {
                return <span className="text-slate-400">—</span>;
            }
            return (
                <div className="flex flex-wrap gap-1">
                    {tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">
                            <Tag className="w-3 h-3" />
                            {tag}
                        </span>
                    ))}
                </div>
            );
        }

        case 'password':
            return <span className="text-slate-400 font-mono">••••••••</span>;

        case 'file': {
            const filePath = value as string;
            if (!filePath) {
                return <span className="text-slate-400">—</span>;
            }
            const isMarkdownDoc = filePath.endsWith('.md');
            if (isMarkdownDoc) {
                const docPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
                return (
                    <Link
                        to={`/workspace/${encodeURIComponent(docPath)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        <span>{displayValue}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                    </Link>
                );
            }
            return (
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                    <FileText className="w-4 h-4 text-slate-400" />
                    {displayValue}
                </span>
            );
        }

        case 'object':
        case 'user-auth': {
            if (typeof value === 'object' && value !== null) {
                const authData = value as Record<string, unknown>;
                return (
                    <div className="space-y-1.5">
                        {authData.username && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-400 w-14">用户名:</span>
                                <span className="text-slate-700">{String(authData.username)}</span>
                            </div>
                        )}
                        {authData.email && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-400 w-14">邮箱:</span>
                                <a href={`mailto:${authData.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                                    {String(authData.email)}
                                </a>
                            </div>
                        )}
                        {authData.phone && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-400 w-14">手机:</span>
                                <a href={`tel:${authData.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                                    {String(authData.phone)}
                                </a>
                            </div>
                        )}
                        {authData.role && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-400 w-14">角色:</span>
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">
                                    {String(authData.role)}
                                </span>
                            </div>
                        )}
                        {authData.status && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-400 w-14">状态:</span>
                                <span className={cn(
                                    'px-2 py-0.5 rounded-full text-xs',
                                    authData.status === 'active' && 'bg-green-50 text-green-700',
                                    authData.status === 'pending' && 'bg-yellow-50 text-yellow-700',
                                    authData.status === 'disabled' && 'bg-red-50 text-red-700',
                                    authData.status === 'locked' && 'bg-orange-50 text-orange-700',
                                )}>
                                    {authData.status === 'active' ? '正常' :
                                        authData.status === 'pending' ? '待激活' :
                                            authData.status === 'disabled' ? '已禁用' :
                                                authData.status === 'locked' ? '已锁定' : String(authData.status)}
                                </span>
                            </div>
                        )}
                        {!authData.username && !authData.email && !authData.phone && !authData.role && !authData.status && (
                            <span className="text-slate-400">未设置</span>
                        )}
                    </div>
                );
            }
            return <span className="text-slate-400">—</span>;
        }

        default: {
            // 处理未知的对象类型
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const obj = value as Record<string, unknown>;
                const entries = Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== '');
                if (entries.length === 0) {
                    return <span className="text-slate-400">—</span>;
                }
                return (
                    <div className="space-y-1 text-sm">
                        {entries.map(([k, v]) => (
                            <div key={k} className="flex items-center gap-2">
                                <span className="text-slate-400">{k}:</span>
                                <span className="text-slate-700">{String(v)}</span>
                            </div>
                        ))}
                    </div>
                );
            }
            return <span className="text-slate-800">{displayValue}</span>;
        }
    }
};
