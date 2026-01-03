/**
 * BlockDetailView - Block 详情视图
 * 
 * 使用注册制标签系统（LabelProvider）来渲染字段
 * 不使用任何硬编码的标签映射
 */

import { Star, Building } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { Block } from '@/types/adl';
import { useLabels } from '@/providers/LabelProvider';
import { useDisplayConfigs } from '@/hooks/useTokens';

// ============================================================
// 类型定义
// ============================================================

interface BlockDetailViewProps {
    block: Block;
    entityType?: string;
}

// 系统字段：不显示给用户（status 在头部显示，不在基本信息中）
const SYSTEM_FIELDS = new Set([
    'type',
    'id',
    'status',  // 状态在头部显示
    '$display',
    '$icon',
    '$color',
    'auth',
    'profiles',
    'identity',
]);

// ============================================================
// 工具函数
// ============================================================

/**
 * 将 kebab-case 转换为 PascalCase
 */
function toPascalCase(str: string): string {
    return str
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

/**
 * 获取 Lucide 图标组件
 */
function getLucideIcon(name: string | undefined): React.ComponentType<{ className?: string; size?: number }> | null {
    if (!name) return null;
    const pascalName = toPascalCase(name);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const icons = LucideIcons as any;
    const Icon = icons[pascalName];
    if (Icon && (typeof Icon === 'function' || typeof Icon === 'object')) {
        return Icon as React.ComponentType<{ className?: string; size?: number }>;
    }
    return null;
}

// ============================================================
// 主组件
// ============================================================

export function BlockDetailView({ block }: BlockDetailViewProps) {
    const { resolveLabel, isHidden } = useLabels();
    const displayConfigs = useDisplayConfigs();
    
    const machine = block?.machine || {};
    const machineType = machine.type as string || '';
    const machineStatus = machine.status as string || '';

    // 安全获取类型和状态配置
    const typeConfigs = displayConfigs?.types || {};
    const statusConfigs = displayConfigs?.statuses || {};
    const typeConfig = typeConfigs[machineType];
    const statusConfig = statusConfigs[machineStatus];

    // 渲染单个字段
    const renderField = (key: string, value: unknown) => {
        // 跳过系统字段
        if (SYSTEM_FIELDS.has(key)) return null;
        
        // 跳过以 $ 开头的显示配置字段
        if (key.startsWith('$')) return null;
        
        // 跳过空值
        if (value === null || value === undefined || value === '') return null;
        
        // 检查是否隐藏
        if (isHidden(key)) return null;
        
        // 解析标签
        const resolved = resolveLabel(key);
        const Icon = getLucideIcon(resolved.icon);
        
        return (
            <div 
                key={key} 
                className="py-3 border-b last:border-0"
                style={{ borderColor: 'var(--ui-block-body-border, #e2e8f0)' }}
            >
                <div className="flex items-start gap-3">
                    {Icon && (
                        <div 
                            className="mt-0.5 p-1.5 rounded"
                            style={{ 
                                backgroundColor: resolved.color 
                                    ? `${resolved.color}15` 
                                    : 'var(--ui-block-header-bg, #f1f5f9)' 
                            }}
                        >
                            <Icon 
                                className="w-4 h-4" 
                                style={{ color: resolved.color || 'var(--ui-field-label-color, #64748b)' }}
                            />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div 
                            className="text-xs mb-1"
                            style={{ color: 'var(--ui-field-label-color, #64748b)' }}
                        >
                            {resolved.label}
                        </div>
                        <div style={{ color: 'var(--ui-field-value-color, #1e293b)' }}>
                            {renderValue(key, value)}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // 渲染值
    const renderValue = (key: string, value: unknown): React.ReactNode => {
        // 评级字段 - 星星显示
        if (key === 'rating' && typeof value === 'number') {
            return (
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Star 
                            key={i} 
                            className="w-5 h-5" 
                            fill={i <= value ? '#fbbf24' : 'none'}
                            stroke={i <= value ? '#fbbf24' : '#d1d5db'}
                        />
                    ))}
                    <span className="ml-2 text-sm" style={{ color: 'var(--ui-field-label-color)' }}>
                        {value}/5
                    </span>
                </div>
            );
        }

        // 关系强度 - 进度条显示
        if (key === 'relationship_strength' && typeof value === 'number') {
            return (
                <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div 
                                key={i}
                                className="w-6 h-2 rounded-sm"
                                style={{ 
                                    backgroundColor: i <= value 
                                        ? 'var(--color-brand-primary, #3b82f6)' 
                                        : 'var(--ui-block-body-border, #e5e7eb)' 
                                }}
                            />
                        ))}
                    </div>
                </div>
            );
        }

        // 状态字段 - 使用注册的状态标签
        if (key === 'status' && typeof value === 'string') {
            const statusResolved = resolveLabel(value);
            return (
                <span 
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium"
                    style={{ 
                        backgroundColor: statusConfig?.color 
                            ? `${statusConfig.color}15` 
                            : 'var(--ui-block-header-bg, #f1f5f9)',
                        color: statusConfig?.color || 'var(--ui-field-value-color, #1e293b)',
                    }}
                >
                    <span 
                        className="w-1.5 h-1.5 rounded-full" 
                        style={{ backgroundColor: statusConfig?.color || 'var(--color-brand-primary)' }}
                    />
                    {statusResolved.label}
                </span>
            );
        }

        // 布尔值
        if (typeof value === 'boolean') {
            return value ? '是' : '否';
        }

        // 数组
        if (Array.isArray(value)) {
            if (value.length === 0) return null;
            // 如果是邮箱或电话数组
            if (key === 'emails' || key === 'phones') {
                return (
                    <div className="space-y-1">
                        {value.map((item, i) => (
                            <div key={i}>
                                {key === 'emails' ? (
                                    <a 
                                        href={`mailto:${item}`}
                                        className="hover:underline"
                                        style={{ color: 'var(--color-brand-primary, #3b82f6)' }}
                                    >
                                        {String(item)}
                                    </a>
                                ) : (
                                    <a 
                                        href={`tel:${item}`}
                                        className="hover:underline"
                                        style={{ color: 'var(--color-brand-primary, #3b82f6)' }}
                                    >
                                        {String(item)}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                );
            }
            // 其他数组显示为标签
            return (
                <div className="flex flex-wrap gap-1.5">
                    {value.map((item, i) => (
                        <span 
                            key={i}
                            className="px-2 py-0.5 rounded text-xs"
                            style={{ 
                                backgroundColor: 'var(--color-brand-primary-light, #e0e7ff)', 
                                color: 'var(--color-brand-primary, #4f46e5)' 
                            }}
                        >
                            {String(item)}
                        </span>
                    ))}
                </div>
            );
        }

        // 对象（但不是数组）
        if (typeof value === 'object' && value !== null) {
            const obj = value as Record<string, unknown>;
            // 引用对象
            if (obj.ref) return String(obj.ref);
            if (obj.token) return String(obj.token);
            // 其他对象展开渲染
            return (
                <div className="space-y-2 mt-1">
                    {Object.entries(obj).map(([k, v]) => {
                        if (v === null || v === undefined || v === '') return null;
                        const subResolved = resolveLabel(k);
                        return (
                            <div key={k} className="flex items-center gap-2 text-sm">
                                <span style={{ color: 'var(--ui-field-label-color)' }}>
                                    {subResolved.label}:
                                </span>
                                <span>{String(v)}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // 默认：转为字符串
        return String(value);
    };

    // 收集要显示的字段（跳过系统字段）
    const displayFields = Object.entries(machine).filter(([key]) => {
        if (SYSTEM_FIELDS.has(key)) return false;
        if (key.startsWith('$')) return false;
        if (isHidden(key)) return false;
        return true;
    });

    // 分离身份信息和其他字段
    const identity = machine.identity as Record<string, unknown> | undefined;

    // 获取类型图标
    const TypeIcon = getLucideIcon(typeConfig?.icon) || Building;
    const typeColor = typeConfig?.color || 'var(--color-brand-primary, #667eea)';

    return (
        <div className="block-detail-view">
            {/* 头部卡片 */}
            <div 
                className="rounded-xl p-6 mb-6"
                style={{ 
                    background: `linear-gradient(135deg, ${typeColor} 0%, ${typeColor}99 100%)`,
                }}
            >
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur">
                        <TypeIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 text-white">
                        {/* 类型标签 */}
                        <div className="text-xs uppercase tracking-wider opacity-80 mb-1">
                            {typeConfig?.label || machineType}
                        </div>
                        {/* 标题 + 状态 */}
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold">
                                {machine.title as string || 
                                 machine.display_name as string || 
                                 block.heading?.replace(/\s*\{#.*\}$/, '') || 
                                 '未命名'}
                            </h2>
                            {/* 状态徽章 */}
                            {machineStatus && (
                                <div 
                                    className="px-3 py-1 rounded-full text-sm font-medium"
                                    style={{ 
                                        backgroundColor: statusConfig?.color 
                                            ? `${statusConfig.color}30` 
                                            : 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                    }}
                                >
                                    {statusConfig?.label || machineStatus}
                                </div>
                            )}
                        </div>
                        {/* 分类标签 */}
                        {machine.category && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-sm">
                                {machine.category as string}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 基本信息 */}
            {displayFields.length > 0 && (
                <div className="mb-6">
                    <h3 
                        className="text-sm font-semibold mb-3 px-1"
                        style={{ color: 'var(--ui-field-label-color, #475569)' }}
                    >
                        基本信息
                    </h3>
                    <div 
                        className="rounded-xl p-4"
                        style={{ 
                            backgroundColor: 'var(--ui-block-body-bg, #f8fafc)',
                            border: '1px solid var(--ui-block-body-border, #e2e8f0)',
                        }}
                    >
                        {displayFields.map(([key, value]) => renderField(key, value))}
                    </div>
                </div>
            )}

            {/* 联系方式（从 identity 提取） */}
            {identity && (identity.emails || identity.phones) && (
                <div className="mb-6">
                    <h3 
                        className="text-sm font-semibold mb-3 px-1"
                        style={{ color: 'var(--ui-field-label-color, #475569)' }}
                    >
                        联系方式
                    </h3>
                    <div 
                        className="rounded-xl p-4"
                        style={{ 
                            backgroundColor: 'var(--ui-block-body-bg, #f8fafc)',
                            border: '1px solid var(--ui-block-body-border, #e2e8f0)',
                        }}
                    >
                        {identity.emails && renderField('emails', identity.emails)}
                        {identity.phones && renderField('phones', identity.phones)}
                    </div>
                </div>
            )}

            {/* 如果没有任何字段，显示提示 */}
            {displayFields.length === 0 && !identity && (
                <div 
                    className="text-center py-10"
                    style={{ color: 'var(--ui-field-label-color, #64748b)' }}
                >
                    暂无详细信息
                </div>
            )}
        </div>
    );
}

export default BlockDetailView;
