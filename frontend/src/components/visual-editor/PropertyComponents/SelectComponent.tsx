/**
 * SelectComponent - 下拉选择属性组件
 * 
 * 支持 Key/Label 分离的选项
 */

import React, { useState } from 'react';
import { ChevronDown, Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { PropertyComponent, PropertyComponentConfig, PropertyRenderContext, ValidationResult, PropertyOption } from '@/types/property';
import { COMPONENT_STYLES } from './types';

// === 辅助函数 ===

function getOptionLabel(options: PropertyOption[] | undefined, key: string): string {
  if (!options) return key;
  const option = options.find(opt => opt.key === key);
  return option?.label || key;
}

function getOptionColor(options: PropertyOption[] | undefined, key: string): string | undefined {
  if (!options) return undefined;
  const option = options.find(opt => opt.key === key);
  return option?.color;
}

// === 渲染函数 ===

function renderConfig(
  config: PropertyComponentConfig,
  onChange: (config: PropertyComponentConfig) => void
): React.ReactNode {
  const options = config.options || [];
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const addOption = () => {
    if (!newKey.trim() || !newLabel.trim()) return;
    const newOptions = [...options, { key: newKey.trim(), label: newLabel.trim() }];
    onChange({ ...config, options: newOptions });
    setNewKey('');
    setNewLabel('');
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onChange({ ...config, options: newOptions });
  };

  const updateOption = (index: number, field: 'key' | 'label' | 'color', value: string) => {
    const newOptions = options.map((opt, i) => 
      i === index ? { ...opt, [field]: value } : opt
    );
    onChange({ ...config, options: newOptions });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          选项列表
        </label>
        <div className="space-y-2">
          {options.map((opt, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={opt.key}
                onChange={(e) => updateOption(index, 'key', e.target.value)}
                placeholder="key"
                className="flex-1 px-2 py-1.5 text-sm rounded border border-slate-200 font-mono"
              />
              <input
                type="text"
                value={opt.label}
                onChange={(e) => updateOption(index, 'label', e.target.value)}
                placeholder="显示名称"
                className="flex-1 px-2 py-1.5 text-sm rounded border border-slate-200"
              />
              <input
                type="color"
                value={opt.color || '#6366f1'}
                onChange={(e) => updateOption(index, 'color', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
                title="选项颜色"
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="新选项 key"
          className="flex-1 px-2 py-1.5 text-sm rounded border border-slate-200 font-mono"
        />
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="显示名称"
          className="flex-1 px-2 py-1.5 text-sm rounded border border-slate-200"
          onKeyDown={(e) => e.key === 'Enter' && addOption()}
        />
        <button
          type="button"
          onClick={addOption}
          disabled={!newKey.trim() || !newLabel.trim()}
          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors disabled:opacity-50"
        >
          <Plus size={16} />
        </button>
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
  const stringValue = value !== undefined && value !== null ? String(value) : '';
  const disabled = context?.disabled || context?.readonly;
  const options = config.options || [];

  return (
    <div className="relative">
      <select
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${COMPONENT_STYLES.input} appearance-none cursor-pointer pr-10`}
      >
        <option value="">选择...</option>
        {options.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown 
        size={16} 
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
      />
    </div>
  );
}

function renderView(
  value: unknown,
  config: PropertyComponentConfig,
  _context?: PropertyRenderContext
): React.ReactNode {
  const stringValue = value !== undefined && value !== null ? String(value) : '';
  
  if (!stringValue) {
    return <span className="text-slate-400 text-sm">-</span>;
  }

  const label = getOptionLabel(config.options, stringValue);
  const color = getOptionColor(config.options, stringValue);

  return (
    <span 
      className="inline-flex items-center px-2 py-0.5 rounded-md text-sm font-medium"
      style={{ 
        backgroundColor: color ? `${color}20` : '#f1f5f9',
        color: color || '#475569'
      }}
    >
      {label}
    </span>
  );
}

function renderInline(
  value: unknown,
  config: PropertyComponentConfig
): React.ReactNode {
  const stringValue = value !== undefined && value !== null ? String(value) : '';
  
  if (!stringValue) {
    return <span className={COMPONENT_STYLES.inline}>未选择</span>;
  }

  const label = getOptionLabel(config.options, stringValue);
  const color = getOptionColor(config.options, stringValue);

  return (
    <span 
      className="inline-flex items-center px-1.5 py-0.5 rounded text-sm font-medium"
      style={{ 
        backgroundColor: color ? `${color}20` : '#f3e8ff',
        color: color || '#7c3aed'
      }}
    >
      {label}
    </span>
  );
}

function renderFallback(
  lastValue: unknown,
  config: unknown
): React.ReactNode {
  const options = (config as PropertyComponentConfig)?.options;
  const label = lastValue ? getOptionLabel(options, String(lastValue)) : undefined;
  
  return (
    <div className={COMPONENT_STYLES.fallback}>
      <AlertTriangle size={16} />
      <span>下拉组件不可用</span>
      {lastValue !== undefined && (
        <span className="text-amber-600">最后选择: {label || String(lastValue)}</span>
      )}
    </div>
  );
}

function validate(
  value: unknown,
  config: PropertyComponentConfig
): ValidationResult {
  if (!value) return { valid: true };
  
  const stringValue = String(value);
  const options = config.options || [];
  const isValidOption = options.some(opt => opt.key === stringValue);
  
  if (!isValidOption) {
    return { valid: false, message: `无效的选项: ${stringValue}` };
  }
  
  return { valid: true };
}

function serialize(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

function deserialize(str: string): unknown {
  return str;
}

// === 组件定义 ===

export const SelectComponent: PropertyComponent = {
  id: 'select',
  version: '1.0.0',
  name: '下拉选择',
  icon: 'chevron-down',
  description: '单选下拉菜单',
  
  defaultConfig: {
    options: [],
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

export default SelectComponent;

