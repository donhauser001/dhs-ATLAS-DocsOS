/**
 * BodyZone - 主体区组件
 * 
 * Phase 3.5: 渲染分区系统
 * 
 * 显示内容：
 * - 业务字段（排除系统和元数据字段）
 * - Human Zone（Markdown 正文）
 */

import { useLabels } from '@/providers/LabelProvider';
import * as LucideIcons from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface BodyZoneProps {
  /** Body 区字段 */
  fields: Array<{ key: string; value: unknown }>;
  /** Human Zone 内容（Markdown） */
  body?: string;
  /** 子组件 */
  children?: React.ReactNode;
}

/**
 * 获取 Lucide 图标组件
 */
function getLucideIcon(name: string | null | undefined): React.ComponentType<{ className?: string }> | null {
  if (!name) return null;
  
  const pascalName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  const icons = LucideIcons as Record<string, unknown>;
  const Icon = icons[pascalName];
  
  if (Icon && (typeof Icon === 'function' || typeof Icon === 'object')) {
    return Icon as React.ComponentType<{ className?: string }>;
  }
  return null;
}

export function BodyZone({ fields, body, children }: BodyZoneProps) {
  const { resolveLabel, getIcon, isHidden } = useLabels();
  
  // 过滤掉隐藏字段
  const visibleFields = fields.filter(({ key }) => !isHidden(key));
  
  return (
    <div className="p-6">
      {/* 业务字段 */}
      {visibleFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {visibleFields.map(({ key, value }) => {
            const resolved = resolveLabel(key);
            const FieldIcon = getLucideIcon(getIcon(key));
            
            return (
              <div key={key} className="space-y-1.5">
                <div className="text-sm text-slate-500 flex items-center gap-1.5">
                  {FieldIcon && <FieldIcon className="w-4 h-4" />}
                  {resolved.label}
                </div>
                <div className="text-slate-900">
                  {renderFieldValue(value, resolveLabel, getIcon)}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* 子组件（可用于自定义内容） */}
      {children}
      
      {/* Human Zone (Markdown) */}
      {body && body.trim() && (
        <div className="prose prose-slate max-w-none">
          <ReactMarkdown>{body}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

/**
 * 渲染字段值
 */
function renderFieldValue(
  value: unknown,
  resolveLabel: (key: string) => { label: string },
  getIcon: (key: string) => string | undefined
): React.ReactNode {
  // null/undefined
  if (value === null || value === undefined) {
    return <span className="text-slate-400 italic">无</span>;
  }
  
  // 布尔值
  if (typeof value === 'boolean') {
    return value ? (
      <span className="text-green-600">是</span>
    ) : (
      <span className="text-slate-400">否</span>
    );
  }
  
  // 数组
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-slate-400 italic">无</span>;
    }
    
    // 简单数组 - 用顿号分隔
    const allSimple = value.every(item => typeof item !== 'object');
    if (allSimple) {
      return <span>{value.join('、')}</span>;
    }
    
    // 复杂数组 - 列表显示
    return (
      <ul className="space-y-1">
        {value.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="text-slate-400">•</span>
            <span>
              {typeof item === 'object'
                ? renderFieldValue(item, resolveLabel, getIcon)
                : String(item)}
            </span>
          </li>
        ))}
      </ul>
    );
  }
  
  // 锚点引用
  if (isAnchorRef(value)) {
    const anchorId = value.ref.replace(/^#/, '');
    return (
      <a
        href={value.ref}
        className="text-purple-600 hover:text-purple-800 hover:underline"
      >
        → {anchorId}
      </a>
    );
  }
  
  // 价格对象
  if (isPriceObject(value)) {
    return (
      <span className="font-medium text-emerald-600">
        {formatPrice(value)}
      </span>
    );
  }
  
  // Token 对象
  if (isTokenObject(value)) {
    return (
      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-sm">
        {value.token.split('.').pop()}
      </span>
    );
  }
  
  // 其他对象
  if (typeof value === 'object' && value !== null) {
    return (
      <dl className="text-sm space-y-1">
        {Object.entries(value).map(([k, v]) => {
          const resolved = resolveLabel(k);
          const FieldIcon = getLucideIcon(getIcon(k));
          
          return (
            <div key={k} className="flex gap-2 items-start">
              <dt className="text-slate-500 flex items-center gap-1 shrink-0">
                {FieldIcon && <FieldIcon className="w-3 h-3" />}
                {resolved.label}:
              </dt>
              <dd className="text-slate-900">
                {renderFieldValue(v, resolveLabel, getIcon)}
              </dd>
            </div>
          );
        })}
      </dl>
    );
  }
  
  // 简单值
  return String(value);
}

/**
 * 类型守卫函数
 */
function isAnchorRef(value: unknown): value is { ref: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ref' in value &&
    typeof (value as { ref: string }).ref === 'string'
  );
}

function isPriceObject(value: unknown): value is { base: number; unit?: string; currency?: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'base' in value &&
    typeof (value as { base: number }).base === 'number'
  );
}

function isTokenObject(value: unknown): value is { token: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'token' in value &&
    typeof (value as { token: string }).token === 'string'
  );
}

/**
 * 格式化价格
 */
function formatPrice(price: { base: number; unit?: string; currency?: string }): string {
  const currencySymbols: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  const symbol = price.currency ? currencySymbols[price.currency] || price.currency : '¥';
  const formatted = price.base.toLocaleString('zh-CN');
  const unit = price.unit ? `/${price.unit}` : '';
  return `${symbol}${formatted}${unit}`;
}

export default BodyZone;

