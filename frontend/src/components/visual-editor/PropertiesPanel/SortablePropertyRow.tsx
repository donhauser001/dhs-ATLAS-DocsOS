/**
 * SortablePropertyRow - 可拖拽排序的系统属性行
 * 使用系统标签映射获取颜色
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Lock, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLabels } from '@/providers/LabelProvider';
import type { SortablePropertyRowProps } from './types';
import { formatDateDisplay, getColorClasses, getDefaultTagColor } from './utils';

export function SortablePropertyRow({
  id,
  icon,
  label,
  type,
  value,
  onChange,
  readonly = false,
  disabled = false,
  wide = false,
}: SortablePropertyRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 渲染值编辑器
  const renderValueEditor = () => {
    // 日期类型
    if (type === 'date') {
      const dateStr = value ? String(value) : '';
      const formatted = formatDateDisplay(dateStr);

      if (readonly) {
        return <span className="text-xs text-slate-600">{formatted}</span>;
      }

      return (
        <input
          type="date"
          value={dateStr.split('T')[0] || ''}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs bg-transparent border-none outline-none text-slate-800 w-full"
        />
      );
    }

    // 标签类型 - 使用系统标签映射获取颜色
    if (type === 'tags') {
      const tags = Array.isArray(value)
        ? value
        : typeof value === 'string'
          ? value.split(',').map(s => s.trim()).filter(Boolean)
          : [];

      return (
        <TagsRenderer
          tags={tags}
          readonly={readonly}
          onChange={onChange}
        />
      );
    }

    // 默认文本类型
    if (readonly) {
      return <span className="text-xs text-slate-600">{String(value || '—')}</span>;
    }

    return (
      <input
        type="text"
        value={String(value || '')}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs bg-transparent border-none outline-none placeholder:text-slate-300 text-slate-800"
      />
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-100",
        "hover:border-slate-200 hover:bg-slate-50/50 transition-colors group",
        wide && "col-span-full",
        isDragging && "opacity-50 shadow-lg z-10"
      )}
    >
      {/* 拖拽手柄 */}
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      )}

      {/* 图标 */}
      <div className="flex-shrink-0">{icon}</div>

      {/* 标签 */}
      <div className="flex-shrink-0 flex items-center gap-1">
        <span className="text-xs text-slate-500">{label}</span>
        {readonly && <Lock className="w-2.5 h-2.5 text-slate-300" />}
      </div>

      {/* 分隔符 */}
      <span className="text-slate-300">:</span>

      {/* 值 */}
      <div className="flex-1 min-w-0">{renderValueEditor()}</div>
    </div>
  );
}

/**
 * 标签渲染器 - 使用系统标签映射获取颜色
 */
interface TagsRendererProps {
  tags: unknown[];
  readonly: boolean;
  onChange: (value: unknown) => void;
}

function TagsRenderer({ tags, readonly, onChange }: TagsRendererProps) {
  const { getColor } = useLabels();

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((tag, idx) => {
        const tagStr = String(tag);
        // 优先使用系统标签颜色，否则使用默认轮换颜色
        const systemColor = getColor(tagStr);
        const colorClasses = systemColor 
          ? getColorClasses(systemColor)
          : getDefaultTagColor(idx);
        
        return (
          <span
            key={tagStr}
            className={cn(
              'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium',
              colorClasses.bg,
              colorClasses.text,
              'border',
              colorClasses.border
            )}
          >
            {tagStr}
            {!readonly && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const newTags = tags.filter((_, i) => i !== idx);
                  onChange(newTags);
                }}
                className="hover:opacity-70 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </span>
        );
      })}
      {!readonly && (
        <input
          type="text"
          placeholder="添加..."
          className="text-xs bg-transparent border-none outline-none w-12 placeholder:text-slate-300"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              const input = e.currentTarget;
              const newTag = input.value.trim();
              if (newTag && !tags.map(t => String(t)).includes(newTag)) {
                onChange([...tags, newTag]);
                input.value = '';
              }
            }
          }}
        />
      )}
      {tags.length === 0 && readonly && (
        <span className="text-xs text-slate-400">—</span>
      )}
    </div>
  );
}

export default SortablePropertyRow;

