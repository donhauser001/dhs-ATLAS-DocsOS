/**
 * PropertyView - 属性视图扩展
 * 
 * 在 Tiptap 编辑器中渲染 {{属性名}} 为可交互控件
 */

import React, { useCallback } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import { Variable, AlertTriangle } from 'lucide-react';
import { safeRenderComponent, getComponent } from '@/registry/property-components';
import type { PropertyDefinition, PropertyComponentConfig } from '@/types/property';

// 属性上下文（由父组件提供）
export interface PropertyViewContext {
  /** 属性定义映射 */
  definitions: Record<string, PropertyDefinition>;
  /** 属性值映射 */
  values: Record<string, unknown>;
  /** 值变更回调 */
  onValueChange: (key: string, value: unknown) => void;
  /** 是否只读 */
  readonly?: boolean;
}

// 全局上下文（用于组件间通信）
let globalPropertyContext: PropertyViewContext | null = null;

export function setPropertyViewContext(context: PropertyViewContext | null) {
  globalPropertyContext = context;
}

export function getPropertyViewContext(): PropertyViewContext | null {
  return globalPropertyContext;
}

// 节点视图组件
function PropertyViewComponent({ node, updateAttributes }: NodeViewProps) {
  const propertyKey = node.attrs.propertyKey as string;
  const context = getPropertyViewContext();
  
  // 获取属性定义和值
  const definition = context?.definitions[propertyKey];
  const value = context?.values[propertyKey];
  const readonly = context?.readonly ?? true;

  // 值变更处理
  const handleChange = useCallback((newValue: unknown) => {
    if (context && !readonly) {
      context.onValueChange(propertyKey, newValue);
    }
  }, [context, propertyKey, readonly]);

  // 属性不存在的情况
  if (!definition) {
    return (
      <NodeViewWrapper as="span" className="property-view-wrapper inline">
        <span 
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded 
                     bg-red-50 text-red-600 text-sm border border-red-200"
          title={`属性 "${propertyKey}" 未定义`}
        >
          <AlertTriangle size={12} />
          <span className="font-mono">{`{{${propertyKey}}}`}</span>
        </span>
      </NodeViewWrapper>
    );
  }

  const component = getComponent(definition.type);
  const config: PropertyComponentConfig = definition.config || {};

  // 只读模式 - 渲染为行内徽标
  if (readonly || !component) {
    return (
      <NodeViewWrapper as="span" className="property-view-wrapper inline">
        {safeRenderComponent(
          definition.type,
          'inline',
          value,
          config
        )}
      </NodeViewWrapper>
    );
  }

  // 编辑模式 - 渲染为可交互控件
  return (
    <NodeViewWrapper as="span" className="property-view-wrapper inline-block align-middle">
      <span 
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md 
                   bg-purple-50 border border-purple-200 hover:border-purple-300 
                   transition-colors cursor-pointer"
        contentEditable={false}
      >
        <Variable size={14} className="text-purple-500" />
        <span className="text-sm font-medium text-purple-700">
          {definition.label}
        </span>
        <span className="text-purple-500">:</span>
        <span className="inline-block min-w-[80px]">
          {component.renderEditor(
            value,
            config,
            handleChange,
            { disabled: false, readonly: false }
          )}
        </span>
      </span>
    </NodeViewWrapper>
  );
}

// 创建 PropertyView 节点扩展
export const PropertyViewNode = Node.create({
  name: 'propertyView',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      propertyKey: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-property-key'),
        renderHTML: (attributes) => ({
          'data-property-key': attributes.propertyKey,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-property-view]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-property-view': '' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PropertyViewComponent);
  },

  addCommands() {
    return {
      insertPropertyView:
        (propertyKey: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { propertyKey },
          });
        },
    };
  },

  // 从 Markdown 解析 {{propertyKey}}
  addInputRules() {
    return [
      {
        find: /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/,
        handler: ({ state, range, match }) => {
          const propertyKey = match[1];
          const { tr } = state;
          const start = range.from;
          const end = range.to;

          tr.replaceWith(start, end, this.type.create({ propertyKey }));
        },
      },
    ];
  },
});

// 属性选择器组件（用于插入属性）
interface PropertySelectorProps {
  definitions: PropertyDefinition[];
  onSelect: (key: string) => void;
  onClose: () => void;
}

export function PropertySelector({ definitions, onSelect, onClose }: PropertySelectorProps) {
  if (definitions.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-500 text-center">
        <Variable size={24} className="mx-auto mb-2 text-slate-300" />
        <p>还没有定义属性</p>
        <p className="text-xs">请先在属性面板中添加属性</p>
      </div>
    );
  }

  return (
    <div className="property-selector bg-white rounded-lg shadow-lg border border-slate-200 
                    overflow-y-auto max-h-60 w-64">
      <div className="px-3 py-2 border-b border-slate-100 text-xs text-slate-500 font-medium">
        选择要插入的属性
      </div>
      {definitions.map((def) => (
        <button
          key={def.key}
          type="button"
          onClick={() => {
            onSelect(def.key);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-left 
                     hover:bg-purple-50 transition-colors"
        >
          <Variable size={14} className="text-purple-500" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-700">{def.label}</div>
            <div className="text-xs text-slate-400 font-mono">{def.key}</div>
          </div>
          <span className="text-xs text-slate-400">{def.type}</span>
        </button>
      ))}
    </div>
  );
}

export default PropertyViewNode;

