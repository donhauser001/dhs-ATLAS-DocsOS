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
import { EntityIndexRenderer } from '@/components/EntityIndexRenderer';
import { useLabels } from '@/providers/LabelProvider';

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
 * 将 kebab-case 转换为 PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * 获取 Lucide 图标组件
 * 支持 kebab-case (如 'user-plus') 和 PascalCase (如 'UserPlus') 格式
 */
function getLucideIcon(name: string | null): React.ComponentType<{ className?: string }> | null {
  if (!name) return null;

  // 转换为 PascalCase
  const pascalName = toPascalCase(name);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const icons = LucideIcons as any;
  const Icon = icons[pascalName];

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
 * 判断值是否为锚点引用
 */
function isAnchorRef(value: unknown): value is { ref: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ref' in value &&
    typeof (value as { ref: string }).ref === 'string'
  );
}

/**
 * 判断值是否为价格对象
 */
function isPriceObject(value: unknown): value is { base: number; unit?: string; currency?: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'base' in value &&
    typeof (value as { base: number }).base === 'number'
  );
}

/**
 * 格式化价格显示
 */
function formatPrice(price: { base: number; unit?: string; currency?: string }): string {
  const currencySymbols: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  const symbol = price.currency ? currencySymbols[price.currency] || price.currency : '¥';
  const formatted = price.base.toLocaleString('zh-CN');
  const unit = price.unit ? `/${price.unit}` : '';
  return `${symbol}${formatted}${unit}`;
}

/**
 * 标签解析函数类型
 */
type ResolveLabelFn = (field: string) => { label: string; icon?: string; hidden: boolean };

/**
 * 渲染语义字段值
 * Phase 3.3+: 支持注册制标签系统
 */
/**
 * 检测是否为 Token 引用对象
 */
function isTokenObject(value: unknown): value is { token: string } {
  return typeof value === 'object' && value !== null && 'token' in value && typeof (value as { token: unknown }).token === 'string';
}

/**
 * 格式化 Token 显示
 */
function formatToken(token: string): string {
  // token 格式如 "avatar.default" -> "默认头像"
  const tokenLabels: Record<string, string> = {
    'avatar.default': '默认头像',
    'color.brand.primary': '品牌主色',
    'icon.general.user': '用户图标',
  };
  return tokenLabels[token] || token.split('.').pop() || token;
}

function renderFieldValue(value: unknown, resolveLabel?: ResolveLabelFn): React.ReactNode {
  // 锚点引用 - 显示为链接
  if (isAnchorRef(value)) {
    const anchorId = value.ref.replace(/^#/, '');
    return (
      <a
        href={value.ref}
        className="text-purple-600 hover:text-purple-800 hover:underline"
      >
        → {anchorId}
      </a>
    );
  }

  // 价格对象 - 格式化显示
  if (isPriceObject(value)) {
    return (
      <span className="font-medium text-emerald-600">
        {formatPrice(value)}
      </span>
    );
  }

  // Token 对象 - 友好显示
  if (isTokenObject(value)) {
    return (
      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-sm">
        {formatToken(value.token)}
      </span>
    );
  }

  // 数组 - 智能显示
  if (Array.isArray(value)) {
    // 空数组
    if (value.length === 0) {
      return <span className="text-slate-400 italic">无</span>;
    }

    // 单元素数组 - 直接显示值
    if (value.length === 1) {
      const item = value[0];
      if (typeof item === 'object') {
        return renderFieldValue(item, resolveLabel);
      }
      return <span>{String(item)}</span>;
    }

    // 多元素数组 - 用逗号分隔显示
    const allSimple = value.every(item => typeof item !== 'object');
    if (allSimple) {
      return <span>{value.join('、')}</span>;
    }

    // 复杂数组 - 紧凑列表
    return (
      <ul className="space-y-1">
        {value.map((item, i) => (
          <li key={i} className="flex items-start gap-1">
            <span className="text-slate-400">•</span>
            <span>{typeof item === 'object' ? renderFieldValue(item, resolveLabel) : String(item)}</span>
          </li>
        ))}
      </ul>
    );
  }

  // 其他对象 - 显示为键值对（使用注册制标签 + 图标）
  if (typeof value === 'object' && value !== null) {
    return (
      <dl className="text-sm space-y-1">
        {Object.entries(value).map(([k, v]) => {
          const resolved = resolveLabel ? resolveLabel(k) : { label: k, hidden: false };
          if (resolved.hidden) return null;
          const Icon = getLucideIcon(resolved.icon || null);
          return (
            <div key={k} className="flex gap-2 items-start">
              <dt className="text-slate-500 flex items-center gap-1 shrink-0">
                {Icon && <Icon className="w-3 h-3" />}
                {resolved.label}:
              </dt>
              <dd className="text-slate-900">{renderFieldValue(v, resolveLabel)}</dd>
            </div>
          );
        })}
      </dl>
    );
  }

  // 布尔值 - 友好显示
  if (typeof value === 'boolean') {
    return value ? (
      <span className="text-green-600">是</span>
    ) : (
      <span className="text-slate-400">否</span>
    );
  }

  // null/undefined - 友好显示
  if (value === null || value === undefined) {
    return <span className="text-slate-400 italic">无</span>;
  }

  // 简单值
  return String(value);
}

/**
 * 敏感字段列表（不应显示）
 */
const SENSITIVE_FIELDS = ['password_hash', 'auth'];

/**
 * 过滤出业务字段（排除系统字段、基础字段和敏感字段）
 */
function getBusinessFields(machine: Record<string, unknown>): [string, unknown][] {
  const excludedKeys = ['type', 'id', 'status', 'title'];
  return Object.entries(machine).filter(
    ([key]) => !excludedKeys.includes(key) && !isSystemField(key) && !SENSITIVE_FIELDS.includes(key)
  );
}

export function BlockRenderer({ block, viewMode, onFieldChange, pendingChanges }: BlockRendererProps) {
  const { machine, body, anchor, heading } = block;

  // Phase 3.3+: 注册制标签系统
  const { resolveLabel, isHidden } = useLabels();

  // Phase 3.2: 特殊处理 entity_index 类型
  if (machine.type === 'entity_index') {
    const entries = machine.entries as Array<{ ref: string }> | undefined;
    const entityType = machine.entity_type as string | undefined;

    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-indigo-100 text-indigo-700">
                📋 {entityType || 'entity'} 列表
              </span>
              <h3 className="text-lg font-semibold text-slate-900">
                {machine.title || heading}
              </h3>
            </div>
            <code className="text-xs text-slate-400 font-mono">
              #{anchor}
            </code>
          </div>
          {typeof machine.description === 'string' && machine.description && (
            <p className="mt-2 text-sm text-slate-600">{machine.description}</p>
          )}
        </div>

        {/* Entity List */}
        <div className="p-6">
          {entries && entries.length > 0 ? (
            <EntityIndexRenderer
              entries={entries}
              entityType={entityType || 'entity'}
              title={machine.title as string}
            />
          ) : (
            <div className="text-center py-8 text-slate-500">
              暂无条目，请在文档中添加 entries
            </div>
          )}
        </div>

        {/* Body as Markdown */}
        {body && (
          <div className="px-6 pb-6 prose prose-slate max-w-none">
            <ReactMarkdown>{body}</ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  // Phase 2.5: 从 Token 系统获取状态和类型的显现配置
  const { statusDisplay, typeDisplay, loading } = useDisplayConfigs(
    machine.status as string,
    machine.type
  );

  // Phase 3.0: 获取 Token 解析能力
  const { resolveToken, resolveTokenVariant, cache: tokenCache } = useTokens();

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
            {/* Type Badge - 语义驱动 + 注册制标签 */}
            <span
              className="px-2 py-0.5 text-xs font-medium rounded inline-flex items-center gap-1"
              style={typeStyle}
            >
              {TypeIcon && <TypeIcon className="w-3 h-3" />}
              {resolveLabel(machine.type as string).label}
            </span>

            {/* Title */}
            <h3 className="text-lg font-semibold text-slate-900">
              {machine.title || machine.display_name || heading}
            </h3>

            {/* Status Badge - 语义驱动 + 注册制标签 */}
            <span
              className="px-2 py-0.5 text-xs font-medium rounded inline-flex items-center gap-1"
              style={statusStyle}
            >
              {StatusIcon && <StatusIcon className="w-3 h-3" />}
              {resolveLabel(machine.status as string).label}
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
            {/* Phase 3.3+: 语义字段渲染 + 注册制标签 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {getBusinessFields(machine).map(([key, value]) => {
                // 检查是否是敏感字段
                if (isHidden(key)) return null;

                const resolved = resolveLabel(key);
                const Icon = getLucideIcon(resolved.icon || null);

                return (
                  <div key={key}>
                    <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      {resolved.label}
                    </div>
                    <div className="text-slate-900">
                      {renderFieldValue(value, resolveLabel)}
                    </div>
                  </div>
                );
              })}
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
