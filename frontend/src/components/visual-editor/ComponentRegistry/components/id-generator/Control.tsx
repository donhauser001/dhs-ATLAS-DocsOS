/**
 * IdGenerator 组件 - 数据块控件
 * 自动生成唯一ID
 */

import { useCallback, useEffect } from 'react';
import { Hash, RefreshCw, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, IdGeneratorComponentDefinition } from '../../types';
import { useState } from 'react';

// 生成随机字符串
function generateId(config: IdGeneratorComponentDefinition): string {
    const { prefix = '', suffix = '', length = 8, format = 'alphanumeric', uppercase = false } = config;
    
    let id = '';
    
    switch (format) {
        case 'numeric': {
            // 纯数字
            for (let i = 0; i < length; i++) {
                id += Math.floor(Math.random() * 10).toString();
            }
            break;
        }
        case 'alpha': {
            // 纯字母
            const letters = 'abcdefghijklmnopqrstuvwxyz';
            for (let i = 0; i < length; i++) {
                id += letters[Math.floor(Math.random() * letters.length)];
            }
            break;
        }
        case 'alphanumeric': {
            // 字母数字混合
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            for (let i = 0; i < length; i++) {
                id += chars[Math.floor(Math.random() * chars.length)];
            }
            break;
        }
        case 'uuid': {
            // UUID v4 格式
            id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            break;
        }
        case 'timestamp': {
            // 时间戳格式
            const now = new Date();
            const ts = now.getFullYear().toString() +
                (now.getMonth() + 1).toString().padStart(2, '0') +
                now.getDate().toString().padStart(2, '0') +
                now.getHours().toString().padStart(2, '0') +
                now.getMinutes().toString().padStart(2, '0') +
                now.getSeconds().toString().padStart(2, '0');
            // 补充随机数
            const randomPart = Math.random().toString(36).substring(2, 2 + Math.max(0, length - 14));
            id = ts + randomPart;
            break;
        }
    }
    
    // 应用大写
    if (uppercase && format !== 'uuid') {
        id = id.toUpperCase();
    }
    
    return `${prefix}${id}${suffix}`;
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const idDef = component as IdGeneratorComponentDefinition;
    const [copied, setCopied] = useState(false);
    
    const stringValue = typeof value === 'string' ? value : '';

    // 自动生成（如果值为空且启用了自动生成）
    useEffect(() => {
        if (!stringValue && idDef.autoGenerate) {
            const newId = generateId(idDef);
            onChange(newId);
        }
    }, []); // 只在首次渲染时执行

    const handleRegenerate = useCallback(() => {
        const newId = generateId(idDef);
        onChange(newId);
    }, [idDef, onChange]);

    const handleCopy = useCallback(async () => {
        if (!stringValue) return;
        try {
            await navigator.clipboard.writeText(stringValue);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('复制失败:', err);
        }
    }, [stringValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (idDef.editable) {
            onChange(e.target.value || null);
        }
    };

    // 格式化显示
    const formatLabel = {
        numeric: '纯数字',
        alpha: '纯字母',
        alphanumeric: '字母数字',
        uuid: 'UUID',
        timestamp: '时间戳',
    }[idDef.format || 'alphanumeric'];

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Hash className="h-4 w-4" />
                    </div>
                    <input
                        type="text"
                        value={stringValue}
                        onChange={handleChange}
                        readOnly={!idDef.editable}
                        disabled={disabled}
                        className={cn(
                            'w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg font-mono',
                            'focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400',
                            !idDef.editable && 'bg-slate-50 cursor-default',
                            disabled && 'text-slate-400 cursor-not-allowed'
                        )}
                    />
                </div>

                {/* 复制按钮 */}
                <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!stringValue}
                    className={cn(
                        'p-2 rounded-lg border border-slate-200 hover:bg-slate-50',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        copied && 'bg-green-50 border-green-200'
                    )}
                    title="复制"
                >
                    {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                    ) : (
                        <Copy className="h-4 w-4 text-slate-500" />
                    )}
                </button>

                {/* 重新生成按钮 */}
                {!disabled && (
                    <button
                        type="button"
                        onClick={handleRegenerate}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-purple-50 hover:border-purple-200"
                        title="重新生成"
                    >
                        <RefreshCw className="h-4 w-4 text-purple-500" />
                    </button>
                )}
            </div>

            {/* 格式信息 */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="px-1.5 py-0.5 bg-slate-100 rounded">{formatLabel}</span>
                {idDef.prefix && <span>前缀: {idDef.prefix}</span>}
                {idDef.suffix && <span>后缀: {idDef.suffix}</span>}
                {idDef.format !== 'uuid' && <span>{idDef.length}位</span>}
            </div>
        </div>
    );
}

export default Control;

