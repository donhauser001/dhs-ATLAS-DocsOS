/**
 * SystemPropertiesSection - 系统属性区块
 * 
 * 使用标签映射系统获取标签名称和图标
 */

import React from 'react';
import { Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useLabels } from '@/providers/LabelProvider';
import { SortablePropertyRow } from './SortablePropertyRow';
import { systemPropertyStaticConfig } from './system-config';

export interface SystemPropertyValues {
  version: string;
  document_type: string;
  created: string;
  updated: string;
  author: string;
  'atlas.function': string;
  'atlas.capabilities': string[];
}

export interface SystemPropertiesSectionProps {
  systemValues: SystemPropertyValues;
  systemOrder: string[];
  disabled: boolean;
  onSystemChange: (key: string, value: unknown) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

/**
 * 渲染图标组件
 */
function renderIcon(iconName?: string): React.ReactNode {
  if (!iconName) return null;
  
  const pascalCase = iconName
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  
  const IconComponent = (LucideIcons as Record<string, unknown>)[pascalCase] as React.ComponentType<{ className?: string }>;
  
  if (IconComponent) {
    return <IconComponent className="w-3.5 h-3.5 text-slate-400" />;
  }
  
  return null;
}

export function SystemPropertiesSection({
  systemValues,
  systemOrder,
  disabled,
  onSystemChange,
  onDragEnd,
}: SystemPropertiesSectionProps) {
  const { getLabel, getIcon } = useLabels();
  
  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 分离普通属性和宽属性
  const normalSystemKeys = systemOrder.filter(key => !systemPropertyStaticConfig[key]?.wide);
  const wideSystemKeys = systemOrder.filter(key => systemPropertyStaticConfig[key]?.wide);

  /**
   * 获取属性的显示配置
   * 优先使用标签映射系统，fallback 到静态配置
   */
  const getPropertyConfig = (key: string) => {
    const staticConfig = systemPropertyStaticConfig[key];
    if (!staticConfig) return null;
    
    // 处理 atlas.xxx 格式的 key，去掉前缀查找标签
    const labelKey = key.startsWith('atlas.') ? key.replace('atlas.', '') : key;
    
    // 从标签映射系统获取
    const label = getLabel(labelKey);
    const icon = getIcon(labelKey);
    
    // 判断是否使用了标签系统的值
    const hasLabelMapping = label !== labelKey;
    
    return {
      label: hasLabelMapping ? label : getDefaultLabel(key),
      icon: renderIcon(icon || staticConfig.defaultIcon),
      type: staticConfig.type,
      readonly: staticConfig.readonly,
      wide: staticConfig.wide,
    };
  };

  /**
   * 获取默认标签名（当标签系统未配置时）
   */
  function getDefaultLabel(key: string): string {
    const defaultLabels: Record<string, string> = {
      'version': '版本',
      'document_type': '文档类型',
      'author': '作者',
      'created': '创建时间',
      'updated': '更新时间',
      'atlas.function': '功能',
      'atlas.capabilities': '能力',
    };
    return defaultLabels[key] || key;
  }

  return (
    <div className="mb-3">
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
        <Lock className="w-3 h-3" />
        系统属性
        {!disabled && <span className="text-slate-300 font-normal ml-1">(可拖拽排序)</span>}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={normalSystemKeys} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {normalSystemKeys.map((key) => {
              const config = getPropertyConfig(key);
              if (!config) return null;
              return (
                <SortablePropertyRow
                  key={key}
                  id={key}
                  icon={config.icon}
                  label={config.label}
                  type={config.type}
                  value={systemValues[key as keyof SystemPropertyValues]}
                  onChange={(val) => onSystemChange(key, val)}
                  readonly={config.readonly || disabled}
                  disabled={disabled}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* 宽属性 */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={wideSystemKeys} strategy={rectSortingStrategy}>
          {wideSystemKeys.map((key) => {
            const config = getPropertyConfig(key);
            if (!config) return null;
            return (
              <div key={key} className="mt-2">
                <SortablePropertyRow
                  id={key}
                  icon={config.icon}
                  label={config.label}
                  type={config.type}
                  value={systemValues[key as keyof SystemPropertyValues]}
                  onChange={(val) => onSystemChange(key, val)}
                  readonly={disabled}
                  disabled={disabled}
                  wide
                />
              </div>
            );
          })}
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default SystemPropertiesSection;
