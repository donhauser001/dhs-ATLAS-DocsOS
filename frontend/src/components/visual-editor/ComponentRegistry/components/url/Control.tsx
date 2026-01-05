/**
 * URL 组件 - 数据块控件
 */

import { useState, useMemo } from 'react';
import { Link, ExternalLink, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, UrlComponentDefinition } from '../../types';

/** 验证URL格式 */
export function validateUrl(url: string, allowedProtocols: string[] = ['http', 'https']): {
    valid: boolean;
    error?: string;
} {
    if (!url) return { valid: true };

    try {
        const parsed = new URL(url);
        const protocol = parsed.protocol.replace(':', '');
        
        if (!allowedProtocols.includes(protocol)) {
            return { valid: false, error: `不支持的协议: ${protocol}` };
        }
        
        return { valid: true };
    } catch {
        // 尝试添加 https:// 前缀后验证
        try {
            new URL(`https://${url}`);
            return { valid: true }; // 可以自动补全
        } catch {
            return { valid: false, error: '无效的URL格式' };
        }
    }
}

/** 规范化URL（自动补全协议） */
export function normalizeUrl(url: string): string {
    if (!url) return '';
    
    // 如果已经有协议，直接返回
    if (/^https?:\/\//i.test(url)) {
        return url;
    }
    
    // 自动添加 https://
    return `https://${url}`;
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const urlDef = component as UrlComponentDefinition;
    const [isFocused, setIsFocused] = useState(false);
    
    const stringValue = typeof value === 'string' ? value : '';

    // 验证结果
    const validation = useMemo(() => {
        return validateUrl(stringValue, urlDef.allowedProtocols);
    }, [stringValue, urlDef.allowedProtocols]);

    // 处理输入变化
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue || null);
    };

    // 处理失焦时自动补全协议
    const handleBlur = () => {
        setIsFocused(false);
        if (stringValue && !stringValue.startsWith('http')) {
            onChange(normalizeUrl(stringValue));
        }
    };

    // 打开链接
    const handleOpen = () => {
        if (!stringValue || !validation.valid) return;
        const url = normalizeUrl(stringValue);
        window.open(url, urlDef.openInNewTab ? '_blank' : '_self');
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Link className="h-4 w-4" />
                    </div>
                    <input
                        type="url"
                        value={stringValue}
                        onChange={handleChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={handleBlur}
                        disabled={disabled}
                        placeholder={urlDef.placeholder || '请输入URL...'}
                        className={cn(
                            'w-full pl-10 pr-10 py-2 text-sm border rounded-lg',
                            'focus:outline-none focus:ring-2 focus:ring-purple-400/50',
                            !validation.valid && stringValue
                                ? 'border-red-300 focus:border-red-400'
                                : 'border-slate-200 focus:border-purple-400',
                            disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed'
                        )}
                    />
                    {/* 验证状态图标 */}
                    {stringValue && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {validation.valid ? (
                                <Check className="h-4 w-4 text-green-500" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                        </div>
                    )}
                </div>

                {/* 打开链接按钮 */}
                {stringValue && validation.valid && (
                    <button
                        type="button"
                        onClick={handleOpen}
                        disabled={disabled}
                        className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 
                            hover:bg-purple-50 hover:border-purple-200 transition-colors
                            disabled:opacity-50 disabled:cursor-not-allowed"
                        title={urlDef.openInNewTab ? '在新标签页打开' : '打开链接'}
                    >
                        <ExternalLink className="h-4 w-4 text-purple-500" />
                    </button>
                )}
            </div>

            {/* 错误提示 */}
            {!validation.valid && stringValue && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validation.error}
                </p>
            )}

            {/* URL预览 */}
            {urlDef.showPreview && stringValue && validation.valid && !isFocused && (
                <div className="p-2 bg-slate-50 rounded-lg">
                    <a
                        href={normalizeUrl(stringValue)}
                        target={urlDef.openInNewTab ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1"
                    >
                        {normalizeUrl(stringValue)}
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
            )}
        </div>
    );
}

export default Control;

