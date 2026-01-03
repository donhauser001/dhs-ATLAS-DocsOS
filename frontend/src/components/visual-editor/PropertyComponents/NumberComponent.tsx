/**
 * NumberComponent - 数字输入属性组件
 */

import React from 'react';
import { Hash, AlertTriangle } from 'lucide-react';
import type { PropertyComponent, PropertyComponentConfig, PropertyRenderContext, ValidationResult } from '@/types/property';
import { COMPONENT_STYLES } from './types';

// === 渲染函数 ===

function renderConfig(
  config: PropertyComponentConfig,
  onChange: (config: PropertyComponentConfig) => void
): React.ReactNode {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            最小值
          </label>
          <input
            type="number"
            value={config.min ?? ''}
            onChange={(e) => onChange({ 
              ...config, 
              min: e.target.value ? Number(e.target.value) : undefined 
            })}
            placeholder="不限"
            className={COMPONENT_STYLES.input}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            最大值
          </label>
          <input
            type="number"
            value={config.max ?? ''}
            onChange={(e) => onChange({ 
              ...config, 
              max: e.target.value ? Number(e.target.value) : undefined 
            })}
            placeholder="不限"
            className={COMPONENT_STYLES.input}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            步进
          </label>
          <input
            type="number"
            value={config.step ?? ''}
            onChange={(e) => onChange({ 
              ...config, 
              step: e.target.value ? Number(e.target.value) : undefined 
            })}
            placeholder="1"
            min={0}
            className={COMPONENT_STYLES.input}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          占位文本
        </label>
        <input
          type="text"
          value={config.placeholder || ''}
          onChange={(e) => onChange({ ...config, placeholder: e.target.value })}
          placeholder="请输入数字..."
          className={COMPONENT_STYLES.input}
        />
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
  const numValue = typeof value === 'number' ? value : (value ? Number(value) : '');
  const disabled = context?.disabled || context?.readonly;

  return (
    <div className="relative">
      <input
        type="number"
        value={numValue}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === '' ? null : Number(val));
        }}
        disabled={disabled}
        placeholder={config.placeholder}
        min={config.min}
        max={config.max}
        step={config.step}
        className={`${COMPONENT_STYLES.input} pl-10`}
      />
      <Hash 
        size={16} 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
      />
    </div>
  );
}

function renderView(
  value: unknown,
  _config: PropertyComponentConfig,
  _context?: PropertyRenderContext
): React.ReactNode {
  if (value === undefined || value === null || value === '') {
    return <span className="text-slate-400 text-sm">-</span>;
  }

  const numValue = typeof value === 'number' ? value : Number(value);
  
  return (
    <span className="text-sm text-slate-700 font-mono">
      {isNaN(numValue) ? String(value) : numValue.toLocaleString()}
    </span>
  );
}

function renderInline(
  value: unknown,
  _config: PropertyComponentConfig
): React.ReactNode {
  if (value === undefined || value === null || value === '') {
    return <span className={COMPONENT_STYLES.inline}>未设置</span>;
  }

  const numValue = typeof value === 'number' ? value : Number(value);
  
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-sm font-mono">
      <Hash size={12} />
      {isNaN(numValue) ? String(value) : numValue.toLocaleString()}
    </span>
  );
}

function renderFallback(
  lastValue: unknown,
  _config: unknown
): React.ReactNode {
  return (
    <div className={COMPONENT_STYLES.fallback}>
      <AlertTriangle size={16} />
      <span>数字组件不可用</span>
      {lastValue !== undefined && lastValue !== null && (
        <span className="text-amber-600">最后值: {String(lastValue)}</span>
      )}
    </div>
  );
}

function validate(
  value: unknown,
  config: PropertyComponentConfig
): ValidationResult {
  if (value === undefined || value === null || value === '') {
    return { valid: true };
  }
  
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    return { valid: false, message: '请输入有效的数字' };
  }
  
  if (config.min !== undefined && numValue < config.min) {
    return { valid: false, message: `数字不能小于 ${config.min}` };
  }
  
  if (config.max !== undefined && numValue > config.max) {
    return { valid: false, message: `数字不能大于 ${config.max}` };
  }
  
  return { valid: true };
}

function serialize(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

function deserialize(str: string): unknown {
  if (!str) return null;
  const num = Number(str);
  return isNaN(num) ? null : num;
}

// === 组件定义 ===

export const NumberComponent: PropertyComponent = {
  id: 'number',
  version: '1.0.0',
  name: '数字',
  icon: 'hash',
  description: '数字输入',
  
  defaultConfig: {
    placeholder: '请输入数字...',
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

export default NumberComponent;

