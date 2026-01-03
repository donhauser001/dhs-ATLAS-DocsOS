/**
 * Obsidian 风格的属性行组件
 * 支持多种属性类型：文本、日期、选择器、标签、复选框等
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
  AlignLeft,
  Hash,
  Calendar,
  Tag,
  CheckSquare,
  Link2,
  BookOpen,
  Image,
  Star,
  Type,
  X,
} from 'lucide-react';

export type PropertyType = 
  | 'text' 
  | 'alias' 
  | 'date' 
  | 'status' 
  | 'tags' 
  | 'textarea' 
  | 'checkbox' 
  | 'select' 
  | 'icon'
  | 'version'
  | 'function'
  | 'capabilities';

interface PropertyRowProps {
  icon?: React.ReactNode;
  label: string;
  type: PropertyType;
  value: unknown;
  onChange: (value: unknown) => void;
  options?: { key: string; label: string; color?: string }[];
  placeholder?: string;
  readonly?: boolean;
  renderValue?: () => React.ReactNode;
}

// 获取属性类型对应的图标
function getPropertyIcon(type: PropertyType) {
  const iconProps = { className: 'w-4 h-4 text-slate-400' };
  switch (type) {
    case 'text':
    case 'alias':
      return <AlignLeft {...iconProps} />;
    case 'date':
      return <Calendar {...iconProps} />;
    case 'status':
    case 'select':
      return <Hash {...iconProps} />;
    case 'tags':
    case 'capabilities':
      return <Tag {...iconProps} />;
    case 'checkbox':
      return <CheckSquare {...iconProps} />;
    case 'textarea':
      return <Type {...iconProps} />;
    case 'icon':
      return <BookOpen {...iconProps} />;
    case 'version':
      return <Star {...iconProps} />;
    case 'function':
      return <Link2 {...iconProps} />;
    default:
      return <AlignLeft {...iconProps} />;
  }
}

// 标签颜色列表
const TAG_COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
];

function getTagColor(index: number) {
  return TAG_COLORS[index % TAG_COLORS.length];
}

export function PropertyRow({
  icon,
  label,
  type,
  value,
  onChange,
  options,
  placeholder,
  readonly = false,
  renderValue,
}: PropertyRowProps) {
  const displayIcon = icon || getPropertyIcon(type);

  // 渲染标签列表
  const renderTags = () => {
    const tags = Array.isArray(value) 
      ? value 
      : typeof value === 'string' 
        ? value.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag, idx) => {
          const color = getTagColor(idx);
          return (
            <span
              key={tag}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium',
                color.bg,
                color.text,
                'border',
                color.border
              )}
            >
              {tag}
              {!readonly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newTags = tags.filter((_, i) => i !== idx);
                    onChange(newTags.join(', '));
                  }}
                  className="hover:opacity-70 transition-opacity ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          );
        })}
        {!readonly && (
          <input
            type="text"
            placeholder="添加标签..."
            className="text-sm bg-transparent border-none outline-none w-20 placeholder:text-slate-300"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const input = e.currentTarget;
                const newTag = input.value.trim();
                if (newTag && !tags.includes(newTag)) {
                  onChange([...tags, newTag].join(', '));
                  input.value = '';
                }
              }
            }}
          />
        )}
      </div>
    );
  };

  // 渲染值编辑器
  const renderValueEditor = () => {
    // 自定义渲染
    if (renderValue) {
      return renderValue();
    }

    // 只读模式
    if (readonly) {
      if (type === 'tags' || type === 'capabilities') {
        return renderTags();
      }
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            disabled
            className="w-4 h-4 rounded border-slate-300 text-violet-600 cursor-not-allowed"
          />
        );
      }
      return (
        <span className="text-sm text-slate-600">
          {String(value || '-')}
        </span>
      );
    }

    // 根据类型渲染不同的编辑器
    switch (type) {
      case 'text':
      case 'alias':
        return (
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full text-sm bg-transparent border-none outline-none placeholder:text-slate-300 text-slate-800"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="w-full text-sm bg-transparent border-none outline-none placeholder:text-slate-300 text-slate-800 resize-none"
          />
        );

      case 'date':
        const dateValue = value ? String(value) : '';
        const formattedDate = dateValue ? new Date(dateValue).toLocaleDateString('zh-CN') : '';
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateValue.split('T')[0] || ''}
              onChange={(e) => onChange(e.target.value)}
              className="text-sm bg-transparent border-none outline-none text-slate-800"
            />
            {formattedDate && (
              <Link2 className="w-3.5 h-3.5 text-slate-300" />
            )}
          </div>
        );

      case 'status':
      case 'select':
        return (
          <select
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            className="text-sm bg-transparent border-none outline-none text-slate-800 cursor-pointer"
          >
            <option value="">选择...</option>
            {options?.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        );

      case 'tags':
      case 'capabilities':
        return renderTags();

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
          />
        );

      case 'icon':
        return (
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder="图标名称"
            className="w-full text-sm bg-transparent border-none outline-none placeholder:text-slate-300 text-slate-800"
          />
        );

      default:
        return (
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-sm bg-transparent border-none outline-none text-slate-800"
          />
        );
    }
  };

  return (
    <div className="flex items-start py-2 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
      {/* 图标 */}
      <div className="flex items-center justify-center w-8 pt-0.5">
        {displayIcon}
      </div>
      
      {/* 标签 */}
      <div className="w-28 shrink-0 pt-0.5">
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      
      {/* 值 */}
      <div className="flex-1 min-w-0">
        {renderValueEditor()}
      </div>
    </div>
  );
}

export default PropertyRow;

