/**
 * CustomPropertiesSection - 自定义属性区块
 */

import { Tag } from 'lucide-react';
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
import type { PropertyDefinition, PropertyValues, PropertyComponentConfig } from '@/types/property';
import { getComponent } from '@/registry/property-components';
import { SortableCustomProperty } from './SortableCustomProperty';

export interface CustomPropertiesSectionProps {
  customDefinitions: PropertyDefinition[];
  customValues: PropertyValues;
  editingConfig: string | null;
  disabled: boolean;
  onValueChange: (key: string, value: unknown) => void;
  onToggleConfig: (key: string) => void;
  onDeleteProperty: (key: string) => void;
  onConfigChange: (key: string, config: PropertyComponentConfig) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function CustomPropertiesSection({
  customDefinitions,
  customValues,
  editingConfig,
  disabled,
  onValueChange,
  onToggleConfig,
  onDeleteProperty,
  onConfigChange,
  onDragEnd,
}: CustomPropertiesSectionProps) {
  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (customDefinitions.length === 0) return null;

  return (
    <div>
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
        <Tag className="w-3 h-3" />
        自定义属性
        {!disabled && <span className="text-slate-300 font-normal ml-1">(可拖拽排序)</span>}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={customDefinitions.map(d => d.key)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {customDefinitions.map((def) => (
              <SortableCustomProperty
                key={def.key}
                definition={def}
                component={getComponent(def.type)}
                value={customValues[def.key]}
                isEditing={editingConfig === def.key}
                disabled={disabled}
                onValueChange={(val) => onValueChange(def.key, val)}
                onToggleConfig={() => onToggleConfig(def.key)}
                onDelete={() => onDeleteProperty(def.key)}
                onConfigChange={(config) => onConfigChange(def.key, config)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default CustomPropertiesSection;

