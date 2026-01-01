/**
 * Block Renderer - ADL Block 渲染器
 * 
 * Phase 2.5: 语义驱动渲染
 * 
 * 根据 ViewMode 渲染 Block 的阅读态或编辑态
 * 颜色和图标从 Token 系统获取，而非硬编码
 */

import { type Block, type UpdateYamlOp } from '@/api/adl';
import { FieldRenderer } from './FieldRenderer';
import ReactMarkdown from 'react-markdown';
import { useDisplayConfigs, getStatusDisplaySync, getTypeDisplaySync, useTokens } from '@/hooks/useTokens';
import { isTokenRef, type TokenRef } from '@/api/tokens';
import * as LucideIcons from 'lucide-react';

interface BlockRendererProps {
  block: Block;
  viewMode: 'read' | 'edit';
  onFieldChange: (anchor: string, path: string, value: unknown, oldValue: unknown) => void;
  pendingChanges: UpdateYamlOp[];
}

/**
 * 将 hex 颜色转换为 rgba 格式
 */
function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 获取 Lucide 图标组件
 */
function getLucideIcon(name: string | null): React.ComponentType<{ className?: string }> | null {
  if (!name) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const icons = LucideIcons as any;
  const Icon = icons[name];
  // React 组件可能是 function 或 object（forwardRef/memo 组件）
  if (Icon && (typeof Icon === 'function' || typeof Icon === 'object')) {
    return Icon as React.ComponentType<{ className?: string }>;
  }
  return null;
}

/**
 * 判断字段是否为系统命名空间（以 $ 开头）
 */
function isSystemField(key: string): boolean {
  return key.startsWith('$');
}

/**
 * 过滤出业务字段（排除系统字段和基础字段）
 */
function getBusinessFields(machine: Record<string, unknown>): [string, unknown][] {
  const excludedKeys = ['type', 'id', 'status', 'title'];
  return Object.entries(machine).filter(
    ([key]) => !excludedKeys.includes(key) && !isSystemField(key)
  );
}

export function BlockRenderer({ block, viewMode, onFieldChange, pendingChanges }: BlockRendererProps) {
  const { machine, body, anchor, heading } = block;
  
  // Phase 2.5: 从 Token 系统获取状态和类型的显现配置
  const { statusDisplay, typeDisplay, loading } = useDisplayConfigs(
    machine.status as string,
    machine.type
  );
  
  // Phase 3.0: 获取 Token 解析能力
  const { resolveToken, resolveTokenVariant, cache: tokenCache, loading: tokenLoading } = useTokens();
  
  // 使用同步版本作为回退（当 Token 系统未加载完成时）
  const fallbackStatusDisplay = statusDisplay || getStatusDisplaySync(machine.status as string);
  const fallbackTypeDisplay = typeDisplay || getTypeDisplaySync(machine.type);
  
  // Phase 3.0: 检查 Block 的 $display 字段并解析 Token
  const blockDisplay = machine.$display as {
    color?: string | TokenRef;
    icon?: string | TokenRef;
  } | undefined;
  
  
  // 解析 $display 中的 color token
  let customColor: string | null = null;
  let customColorBg: string | null = null;
  let customColorText: string | null = null;
  if (blockDisplay?.color) {
    if (isTokenRef(blockDisplay.color)) {
      const tokenPath = blockDisplay.color.token;
      customColor = resolveToken(tokenPath);
      
      // 检查 token 是否有专门的 bg/text 变体（通过检查 tokenCache）
      const tokenDef = tokenCache?.index[tokenPath];
      const hasBgVariant = tokenDef && 'bg' in tokenDef;
      const hasTextVariant = tokenDef && 'text' in tokenDef;
      
      if (hasBgVariant) {
        customColorBg = resolveTokenVariant(tokenPath, 'bg');
      } else if (customColor) {
        // 没有 bg 变体，使用主色生成透明背景
        customColorBg = hexToRgba(customColor, 0.15);
      }
      
      if (hasTextVariant) {
        customColorText = resolveTokenVariant(tokenPath, 'text');
      } else if (customColor) {
        // 没有 text 变体，使用主色作为文字色
        customColorText = customColor;
      }
    } else if (typeof blockDisplay.color === 'string') {
      customColor = blockDisplay.color;
      customColorBg = hexToRgba(blockDisplay.color, 0.15);
      customColorText = blockDisplay.color;
    }
  }
  
  // 解析 $display 中的 icon token
  let customIcon: string | null = null;
  if (blockDisplay?.icon) {
    if (isTokenRef(blockDisplay.icon)) {
      const tokenPath = blockDisplay.icon.token;
      customIcon = resolveTokenVariant(tokenPath, 'lucide');
    } else if (typeof blockDisplay.icon === 'string') {
      customIcon = blockDisplay.icon;
    }
  }
  
  // 最终显示配置：优先使用 $display，回退到系统默认
  const finalStatusDisplay = fallbackStatusDisplay;
  const finalTypeDisplay = {
    ...fallbackTypeDisplay,
    // 如果有 $display 自定义，则覆盖默认值
    ...(customColor && { color: customColor }),
    ...(customColorBg && { bg: customColorBg }),
    ...(customColorText && { text: customColorText }),
    ...(customIcon && { icon: customIcon }),
  };
  
  // 获取图标组件
  const StatusIcon = getLucideIcon(finalStatusDisplay.icon);
  const TypeIcon = getLucideIcon(finalTypeDisplay.icon);
  
  
  // 检查字段是否有 pending change
  function getPendingValue(path: string): unknown | undefined {
    const change = pendingChanges.find(c => c.path === path);
    return change?.value;
  }
  
  // 获取字段当前显示值（pending 优先）
  function getDisplayValue(path: string, originalValue: unknown): unknown {
    const pending = getPendingValue(path);
    return pending !== undefined ? pending : originalValue;
  }
  
  // 处理字段变更
  function handleChange(path: string, value: unknown) {
    const originalValue = getNestedValue(machine, path);
    onFieldChange(anchor, path, value, originalValue);
  }
  
  // 生成动态样式（基于 Token 系统的颜色）
  const typeStyle = {
    backgroundColor: finalTypeDisplay.bg || '#F1F5F9',
    color: finalTypeDisplay.text || '#475569',
  };
  
  
  const statusStyle = {
    backgroundColor: finalStatusDisplay.bg || '#F1F5F9',
    color: finalStatusDisplay.text || '#475569',
  };
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Type Badge - 语义驱动 */}
            <span 
              className="px-2 py-0.5 text-xs font-medium rounded inline-flex items-center gap-1"
              style={typeStyle}
            >
              {TypeIcon && <TypeIcon className="w-3 h-3" />}
              {machine.type}
            </span>
            
            {/* Title */}
            <h3 className="text-lg font-semibold text-slate-900">
              {machine.title || heading}
            </h3>
            
            {/* Status Badge - 语义驱动 */}
            <span 
              className="px-2 py-0.5 text-xs font-medium rounded inline-flex items-center gap-1"
              style={statusStyle}
            >
              {StatusIcon && <StatusIcon className="w-3 h-3" />}
              {machine.status}
            </span>
          </div>
          
          {/* Anchor */}
          <code className="text-xs text-slate-400 font-mono">
            #{anchor}
          </code>
        </div>
        
        {/* ID */}
        <div className="mt-1 text-sm text-slate-500">
          ID: {machine.id}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {viewMode === 'read' ? (
          // Read View
          <div>
            {/* Machine fields as read-only display */}
            {/* Phase 2.5: 只显示业务字段，过滤掉 $display 等系统字段 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {getBusinessFields(machine).map(([key, value]) => (
                <div key={key}>
                  <div className="text-sm text-slate-500 mb-1">{key}</div>
                  <div className="text-slate-900">
                    {typeof value === 'object' 
                      ? JSON.stringify(value, null, 2)
                      : String(value)
                    }
                  </div>
                </div>
              ))}
            </div>
            
            {/* Body as Markdown */}
            {body && (
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown>{body}</ReactMarkdown>
              </div>
            )}
          </div>
        ) : (
          // Edit View
          <div>
            {/* Editable fields */}
            <div className="space-y-4">
              {/* Status field */}
              <FieldRenderer
                label="状态"
                path="status"
                value={getDisplayValue('status', machine.status)}
                type="enum"
                options={['active', 'draft', 'archived']}
                onChange={(value) => handleChange('status', value)}
                hasChange={getPendingValue('status') !== undefined}
              />
              
              {/* Title field */}
              <FieldRenderer
                label="标题"
                path="title"
                value={getDisplayValue('title', machine.title)}
                type="string"
                onChange={(value) => handleChange('title', value)}
                hasChange={getPendingValue('title') !== undefined}
              />
              
              {/* Other business fields (exclude system fields like $display) */}
              {getBusinessFields(machine).map(([key, value]) => {
                const fieldType = inferFieldType(value);
                const displayValue = getDisplayValue(key, value);
                
                // 处理嵌套对象（如 price）
                if (fieldType === 'object' && typeof value === 'object' && value !== null) {
                  return (
                    <div key={key} className="border border-slate-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-slate-700 mb-3">{key}</div>
                      <div className="space-y-3">
                        {Object.entries(value as Record<string, unknown>).map(([subKey, subValue]) => {
                          const path = `${key}.${subKey}`;
                          const subType = inferFieldType(subValue);
                          return (
                            <FieldRenderer
                              key={path}
                              label={subKey}
                              path={path}
                              value={getDisplayValue(path, subValue)}
                              type={subType}
                              onChange={(v) => handleChange(path, v)}
                              hasChange={getPendingValue(path) !== undefined}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                
                return (
                  <FieldRenderer
                    key={key}
                    label={key}
                    path={key}
                    value={displayValue}
                    type={fieldType}
                    onChange={(v) => handleChange(key, v)}
                    hasChange={getPendingValue(key) !== undefined}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Loading indicator for Token system */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="text-sm text-slate-400">加载语义系统...</div>
        </div>
      )}
    </div>
  );
}

// 推断字段类型
function inferFieldType(value: unknown): 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array' {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object' && value !== null) return 'object';
  return 'string';
}

// 获取嵌套对象的值
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  
  return current;
}

export default BlockRenderer;
