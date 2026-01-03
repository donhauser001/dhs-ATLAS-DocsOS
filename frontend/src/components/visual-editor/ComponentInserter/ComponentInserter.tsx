/**
 * ComponentInserter - 组件插入器
 * 
 * 左侧边栏组件，用于在文档内容中插入字段组件
 * 
 * 概念区分：
 * - 文档属性（Properties）：描述文档本身的元数据，如 status, tags, priority
 * - 组件（Components）：文档内容中的结构化字段，如 select, rating, text
 */

import React, { useState, useCallback } from 'react';
import {
  Type,
  Hash,
  Calendar,
  CheckSquare,
  Star,
  ChevronDown,
  List,
  AlignLeft,
  Link2,
  User,
  Palette,
  Image,
  GripVertical,
  Search,
  Sparkles,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllComponents, getCategorizedComponents } from '@/registry/property-components';
import type { PropertyComponent } from '@/types/property';

export interface ComponentInserterProps {
  /** 插入组件回调 */
  onInsert: (componentType: string, config?: Record<string, unknown>) => void;
  /** 是否折叠 */
  collapsed?: boolean;
  /** 切换折叠状态 */
  onToggleCollapse?: () => void;
  /** 自定义类名 */
  className?: string;
}

// 获取 Lucide 图标
function getLucideIcon(iconName: string): React.ComponentType<{ className?: string; size?: number }> | null {
  const pascalCase = iconName
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  return (LucideIcons as Record<string, unknown>)[pascalCase] as React.ComponentType<{ className?: string; size?: number }> | null;
}

// 组件卡片
interface ComponentCardProps {
  component: PropertyComponent;
  onInsert: () => void;
  draggable?: boolean;
}

function ComponentCard({ component, onInsert, draggable = true }: ComponentCardProps) {
  const IconComponent = getLucideIcon(component.icon);
  
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('application/x-component-type', component.id);
    e.dataTransfer.setData('text/plain', `{{${component.id}}}`);
    e.dataTransfer.effectAllowed = 'copy';
  }, [component.id]);

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onClick={onInsert}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all",
        "bg-white border border-slate-200 hover:border-purple-300 hover:shadow-sm",
        "active:scale-[0.98]",
        draggable && "cursor-grab active:cursor-grabbing"
      )}
    >
      {/* 拖拽手柄 */}
      {draggable && (
        <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400 flex-shrink-0" />
      )}
      
      {/* 图标 */}
      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 transition-colors">
        {IconComponent ? (
          <IconComponent className="w-4 h-4 text-purple-600" />
        ) : (
          <Type className="w-4 h-4 text-purple-600" />
        )}
      </div>
      
      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
          {component.name}
        </div>
        <div className="text-xs text-slate-400 truncate">
          {component.description}
        </div>
      </div>
    </div>
  );
}

export function ComponentInserter({
  onInsert,
  collapsed = false,
  onToggleCollapse,
  className,
}: ComponentInserterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['basic', 'selection'])
  );

  const categories = getCategorizedComponents();

  // 过滤组件
  const filteredCategories = categories.map(category => ({
    ...category,
    components: category.components.filter(comp =>
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.components.length > 0);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const handleInsert = useCallback((componentType: string) => {
    onInsert(componentType);
  }, [onInsert]);

  if (collapsed) {
    return (
      <div className={cn("w-12 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-4", className)}>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          title="展开组件面板"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("w-64 bg-slate-50 border-r border-slate-200 flex flex-col", className)}>
      {/* 头部 */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            组件库
          </h3>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              title="折叠面板"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
          )}
        </div>
        
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索组件..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-200 
                       focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400
                       placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 组件列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-4">
          {/* 使用提示 */}
          <div className="px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-xs text-purple-700">
              💡 拖拽或点击组件插入到编辑器中
            </p>
          </div>

          {/* 分类列表 */}
          {filteredCategories.map(category => {
            const isExpanded = expandedCategories.has(category.id);
            const CategoryIcon = getLucideIcon(category.icon);
            
            return (
              <div key={category.id}>
                {/* 分类标题 */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-500 
                             hover:text-slate-700 transition-colors"
                >
                  <ChevronDown className={cn(
                    "w-3.5 h-3.5 transition-transform",
                    !isExpanded && "-rotate-90"
                  )} />
                  {CategoryIcon && <CategoryIcon className="w-3.5 h-3.5" />}
                  <span className="uppercase tracking-wider">{category.name}</span>
                  <span className="text-slate-400 font-normal">
                    ({category.components.length})
                  </span>
                </button>

                {/* 组件列表 */}
                {isExpanded && (
                  <div className="mt-2 space-y-2">
                    {category.components.map(component => (
                      <ComponentCard
                        key={component.id}
                        component={component}
                        onInsert={() => handleInsert(component.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* 空状态 */}
          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-400">
              未找到匹配的组件
            </div>
          )}
        </div>
      </div>

      {/* 底部说明 */}
      <div className="px-4 py-3 border-t border-slate-200 bg-white">
        <p className="text-xs text-slate-500">
          组件用于在文档内容中定义结构化字段，如客户分类、评级等。
        </p>
      </div>
    </div>
  );
}

export default ComponentInserter;

