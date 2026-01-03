/**
 * DateComponent - 日期选择属性组件
 */

import React from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import type { PropertyComponent, PropertyComponentConfig, PropertyRenderContext, ValidationResult } from '@/types/property';
import { COMPONENT_STYLES } from './types';

// === 辅助函数 ===

function parseDate(value: unknown): string {
  if (!value) return '';
  const str = String(value);
  // 提取日期部分 (YYYY-MM-DD)
  const match = str.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : '';
}

function formatDate(dateStr: string, format?: string): string {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    // 简单格式化
    if (format === 'short') {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
    
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return dateStr;
  }
}

// === 渲染函数 ===

function renderConfig(
  config: PropertyComponentConfig,
  onChange: (config: PropertyComponentConfig) => void
): React.ReactNode {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          显示格式
        </label>
        <select
          value={config.format || 'full'}
          onChange={(e) => onChange({ ...config, format: e.target.value })}
          className={COMPONENT_STYLES.input}
        >
          <option value="full">完整格式（2025年1月3日）</option>
          <option value="short">简短格式（1月3日）</option>
          <option value="iso">ISO 格式（2025-01-03）</option>
        </select>
      </div>
    </div>
  );
}

function renderEditor(
  value: unknown,
  config: PropertyComponentConfig,
  onChange: (value: unknown) => void,
  context?: PropertyRenderContext
): React.ReactNode {
  const dateValue = parseDate(value);
  const disabled = context?.disabled || context?.readonly;

  return (
    <div className="relative">
      <input
        type="date"
        value={dateValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${COMPONENT_STYLES.input} pl-10`}
      />
      <Calendar 
        size={16} 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
      />
    </div>
  );
}

function renderView(
  value: unknown,
  config: PropertyComponentConfig,
  _context?: PropertyRenderContext
): React.ReactNode {
  const dateValue = parseDate(value);
  
  if (!dateValue) {
    return <span className="text-slate-400 text-sm">-</span>;
  }

  const formattedDate = config.format === 'iso' ? dateValue : formatDate(dateValue, config.format);

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
      <Calendar size={14} className="text-slate-400" />
      {formattedDate}
    </span>
  );
}

function renderInline(
  value: unknown,
  config: PropertyComponentConfig
): React.ReactNode {
  const dateValue = parseDate(value);
  
  if (!dateValue) {
    return <span className={COMPONENT_STYLES.inline}>未设置</span>;
  }

  const formattedDate = formatDate(dateValue, 'short');

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-sm">
      <Calendar size={12} />
      {formattedDate}
    </span>
  );
}

function renderFallback(
  lastValue: unknown,
  _config: unknown
): React.ReactNode {
  const dateStr = parseDate(lastValue);
  
  return (
    <div className={COMPONENT_STYLES.fallback}>
      <AlertTriangle size={16} />
      <span>日期组件不可用</span>
      {dateStr && (
        <span className="text-amber-600">最后日期: {dateStr}</span>
      )}
    </div>
  );
}

function validate(
  value: unknown,
  _config: PropertyComponentConfig
): ValidationResult {
  if (!value) return { valid: true };
  
  const dateStr = parseDate(value);
  if (!dateStr) {
    return { valid: false, message: '日期格式无效' };
  }
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { valid: false, message: '日期格式无效' };
  }
  
  return { valid: true };
}

function serialize(value: unknown): string {
  return parseDate(value);
}

function deserialize(str: string): unknown {
  return str;
}

// === 组件定义 ===

export const DateComponent: PropertyComponent = {
  id: 'date',
  version: '1.0.0',
  name: '日期',
  icon: 'calendar',
  description: '日期选择器',
  
  defaultConfig: {
    format: 'full',
  },
  
  renderConfig,
  renderEditor,
  renderView,
  renderInline,
  renderFallback,
  validate,
  serialize,
  deserialize,
};

export default DateComponent;

