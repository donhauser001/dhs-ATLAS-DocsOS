/**
 * PropertyItem - 单个属性项组件
 */

import React, { useState } from 'react';
import { Settings, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import type { PropertyDefinition, PropertyComponentConfig, PropertyRenderContext } from '@/types/property';
import { getComponent, safeRenderComponent } from '@/registry/property-components';

export interface PropertyItemProps {
  /** 属性定义 */
  definition: PropertyDefinition;
  /** 当前值 */
  value: unknown;
  /** 值变更回调 */
  onValueChange: (value: unknown) => void;
  /** 定义变更回调（用于编辑属性配置） */
  onDefinitionChange?: (definition: PropertyDefinition) => void;
  /** 删除回调 */
  onDelete?: () => void;
  /** 是否可删除（系统属性不可删除） */
  deletable?: boolean;
  /** 是否可配置 */
  configurable?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否支持拖拽 */
  draggable?: boolean;
  /** 拖拽相关属性 */
  dragHandleProps?: Record<string, unknown>;
}

export function PropertyItem({
  definition,
  value,
  onValueChange,
  onDefinitionChange,
  onDelete,
  deletable = true,
  configurable = true,
  disabled = false,
  draggable = false,
  dragHandleProps,
}: PropertyItemProps) {
  const [showConfig, setShowConfig] = useState(false);
  const component = getComponent(definition.type);
  
  const context: PropertyRenderContext = {
    disabled,
    readonly: !onDefinitionChange && disabled,
  };

  return (
    <div className="property-item group bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
      {/* 属性头部 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
        {/* 拖拽手柄 */}
        {draggable && (
          <div 
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500"
          >
            <GripVertical size={16} />
          </div>
        )}
        
        {/* 属性名称和描述 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 truncate">
              {definition.label}
            </span>
            {definition.required && (
              <span className="text-red-500 text-xs">*</span>
            )}
            <span className="text-xs text-slate-400 font-mono">
              {definition.type}
            </span>
          </div>
          {definition.description && (
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {definition.description}
            </p>
          )}
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {configurable && onDefinitionChange && (
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
              title="配置属性"
            >
              {showConfig ? <ChevronUp size={14} /> : <Settings size={14} />}
            </button>
          )}
          {deletable && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="删除属性"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      
      {/* 属性值编辑区 */}
      <div className="px-3 py-2">
        {safeRenderComponent(
          definition.type,
          'editor',
          value,
          definition.config || {},
          onValueChange,
          context
        )}
      </div>
      
      {/* 配置面板（折叠） */}
      {showConfig && component && onDefinitionChange && (
        <div className="px-3 py-3 bg-slate-50 border-t border-slate-200">
          <div className="text-xs text-slate-500 mb-2 font-medium">属性配置</div>
          {component.renderConfig(
            definition.config || {},
            (config: PropertyComponentConfig) => {
              onDefinitionChange({
                ...definition,
                config,
              });
            }
          )}
          
          {/* 基础配置 */}
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={definition.label}
                onChange={(e) => onDefinitionChange({
                  ...definition,
                  label: e.target.value,
                })}
                placeholder="属性名称"
                className="flex-1 px-2 py-1 text-sm rounded border border-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={definition.description || ''}
                onChange={(e) => onDefinitionChange({
                  ...definition,
                  description: e.target.value || undefined,
                })}
                placeholder="属性描述（可选）"
                className="flex-1 px-2 py-1 text-sm rounded border border-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={definition.required || false}
                  onChange={(e) => onDefinitionChange({
                    ...definition,
                    required: e.target.checked,
                  })}
                  className="rounded border-slate-300"
                />
                必填
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyItem;

