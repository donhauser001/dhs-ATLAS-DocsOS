/**
 * Obsidian 风格的属性面板
 * 类似 Obsidian 的 Properties 面板设计
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { PropertyRow, type PropertyType } from './PropertyRow';
import type { FixedKeyItem } from '../types';

interface PropertyConfig {
  key: string;
  label: string;
  type: PropertyType;
  value: unknown;
  readonly?: boolean;
  options?: { key: string; label: string; color?: string }[];
  placeholder?: string;
  renderValue?: () => React.ReactNode;
}

interface PropertiesPanelProps {
  title?: string;
  properties: PropertyConfig[];
  onChange: (key: string, value: unknown) => void;
  onAddProperty?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function PropertiesPanel({
  title = '笔记属性',
  properties,
  onChange,
  onAddProperty,
  collapsed = false,
  onToggleCollapse,
  className,
}: PropertiesPanelProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={cn(
        'bg-white border-b border-slate-100',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 标题栏 */}
      <button
        onClick={onToggleCollapse}
        className={cn(
          'w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600',
          'hover:bg-slate-50 transition-colors'
        )}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
        <span>{title}</span>
      </button>

      {/* 属性列表 */}
      {!collapsed && (
        <div className="px-4 pb-3">
          {properties.map((prop) => (
            <PropertyRow
              key={prop.key}
              label={prop.label}
              type={prop.type}
              value={prop.value}
              onChange={(val) => onChange(prop.key, val)}
              options={prop.options}
              placeholder={prop.placeholder}
              readonly={prop.readonly}
              renderValue={prop.renderValue}
            />
          ))}

          {/* 添加属性按钮 */}
          {onAddProperty && (
            <button
              onClick={onAddProperty}
              className={cn(
                'flex items-center gap-2 mt-2 px-2 py-1.5 text-sm text-slate-400',
                'hover:text-slate-600 hover:bg-slate-50 rounded transition-colors',
                'w-full'
              )}
            >
              <Plus className="w-4 h-4" />
              <span>添加笔记属性</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// 从固定键配置转换为属性配置
export function fixedKeysToProperties(
  fixedKeys: FixedKeyItem[],
  getLabel: (key: string) => string,
  customRenderers?: Record<string, () => React.ReactNode>
): PropertyConfig[] {
  return fixedKeys.map(item => {
    let type: PropertyType = 'text';
    let options: { key: string; label: string }[] | undefined;

    // 根据 inputType 映射到 PropertyType
    switch (item.inputType) {
      case 'version':
        type = 'version';
        break;
      case 'document_type':
        type = 'select';
        break;
      case 'function':
        type = 'function';
        break;
      case 'capabilities':
        type = 'capabilities';
        break;
      case 'select':
        type = 'select';
        options = item.options?.map(opt => ({
          key: opt,
          label: getLabel(opt),
        }));
        break;
      case 'tags':
        type = 'tags';
        break;
      default:
        type = 'text';
    }

    return {
      key: item.key,
      label: item.label,
      type,
      value: item.value,
      readonly: !item.editable,
      options,
      renderValue: customRenderers?.[item.key],
    };
  });
}

export default PropertiesPanel;

