/**
 * LabeledField - 注册制标签渲染组件
 * 
 * Phase 3.3+: 用户友好型标签映射
 * 
 * 用法：
 * <LabeledField field="项目名称" />
 * // 显示: 📁 项目名称
 * 
 * <LabeledField field="project_name" />
 * // 显示: 📁 项目名称 (通过别名查找)
 * 
 * <LabeledField field="联系邮箱!" />
 * // 显示: 联系邮箱 (无图标)
 */

import React from 'react';
import { useLabels } from '@/providers/LabelProvider';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 动态获取 Lucide 图标
 */
function getLucideIcon(name: string | undefined): React.ComponentType<{ className?: string; size?: number }> | null {
  if (!name) return null;
  
  // 将 kebab-case 转换为 PascalCase
  const pascalCase = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  // @ts-expect-error - 动态访问
  const Icon = LucideIcons[pascalCase];
  return Icon || null;
}

// ============================================================
// LabeledField - 带图标的字段名显示
// ============================================================

interface LabeledFieldProps {
  /** 字段名（支持标签名、别名、带!后缀） */
  field: string;
  /** 自定义样式 */
  className?: string;
  /** 图标大小 */
  iconSize?: number;
  /** 是否只显示图标 */
  iconOnly?: boolean;
}

export function LabeledField({
  field,
  className,
  iconSize = 14,
  iconOnly = false,
}: LabeledFieldProps) {
  const { resolveLabel } = useLabels();
  const resolved = resolveLabel(field);
  
  // 敏感字段不显示
  if (resolved.hidden) {
    return null;
  }
  
  const Icon = getLucideIcon(resolved.icon);
  
  if (iconOnly && Icon) {
    return <Icon size={iconSize} className={cn('text-muted-foreground', className)} />;
  }
  
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {Icon && <Icon size={iconSize} className="text-muted-foreground flex-shrink-0" />}
      <span>{resolved.label}</span>
    </span>
  );
}

// ============================================================
// FieldValue - 完整的字段名+值显示
// ============================================================

interface FieldValueProps {
  /** 字段名 */
  field: string;
  /** 字段值 */
  value: React.ReactNode;
  /** 自定义样式 */
  className?: string;
  /** 值的样式 */
  valueClassName?: string;
}

export function FieldValue({
  field,
  value,
  className,
  valueClassName,
}: FieldValueProps) {
  const { resolveLabel, isHidden } = useLabels();
  
  // 敏感字段不显示
  if (isHidden(field)) {
    return null;
  }
  
  const resolved = resolveLabel(field);
  const Icon = getLucideIcon(resolved.icon);
  
  return (
    <div className={cn('flex items-start gap-2', className)}>
      <span className="text-muted-foreground flex items-center gap-1 flex-shrink-0">
        {Icon && <Icon size={14} className="flex-shrink-0" />}
        <span>{resolved.label}:</span>
      </span>
      <span className={cn('text-foreground', valueClassName)}>{value}</span>
    </div>
  );
}

// ============================================================
// StatusBadge - 状态徽章
// ============================================================

interface StatusBadgeProps {
  /** 状态值 */
  status: string;
  /** 自定义样式 */
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { resolveLabel } = useLabels();
  const resolved = resolveLabel(status);
  
  const Icon = getLucideIcon(resolved.icon);
  
  // 颜色映射
  const colorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  
  const colorClass = colorMap[resolved.color || 'gray'] || colorMap.gray;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
      colorClass,
      className
    )}>
      {Icon && <Icon size={12} />}
      {resolved.label}
    </span>
  );
}

// ============================================================
// TypeBadge - 类型徽章
// ============================================================

interface TypeBadgeProps {
  /** 类型值 */
  type: string;
  /** 自定义样式 */
  className?: string;
  /** 自定义背景色 */
  bgColor?: string;
  /** 自定义文字色 */
  textColor?: string;
}

export function TypeBadge({ type, className, bgColor, textColor }: TypeBadgeProps) {
  const { resolveLabel } = useLabels();
  const resolved = resolveLabel(type);
  
  const Icon = getLucideIcon(resolved.icon);
  
  const style = {
    backgroundColor: bgColor || '#F1F5F9',
    color: textColor || '#475569',
  };
  
  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
        className
      )}
      style={style}
    >
      {Icon && <Icon size={12} />}
      {resolved.label}
    </span>
  );
}

export default LabeledField;
