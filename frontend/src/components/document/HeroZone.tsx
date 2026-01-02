/**
 * HeroZone - 标题区组件
 * 
 * Phase 3.5: 渲染分区系统
 * 
 * 显示内容：
 * - 标题（title 或 display_name）
 * - 状态徽章
 * - 核心身份字段
 */

import { useLabels } from '@/providers/LabelProvider';
import { useDisplayConfigs, getStatusDisplaySync } from '@/hooks/useTokens';
import * as LucideIcons from 'lucide-react';

interface HeroZoneProps {
  /** 标题 */
  title: string;
  /** 状态 */
  status?: string;
  /** 类型 */
  type?: string;
  /** Hero 区字段 */
  fields?: Array<{ key: string; value: unknown }>;
  /** 是否显示状态徽章 */
  showStatusBadge?: boolean;
  /** ID（用于显示） */
  id?: string;
  /** Anchor（用于链接） */
  anchor?: string;
}

/**
 * 获取 Lucide 图标组件
 */
function getLucideIcon(name: string | null | undefined): React.ComponentType<{ className?: string }> | null {
  if (!name) return null;
  
  // 转换为 PascalCase
  const pascalName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  const icons = LucideIcons as Record<string, unknown>;
  const Icon = icons[pascalName];
  
  if (Icon && (typeof Icon === 'function' || typeof Icon === 'object')) {
    return Icon as React.ComponentType<{ className?: string }>;
  }
  return null;
}

export function HeroZone({
  title,
  status,
  type,
  fields = [],
  showStatusBadge = true,
  id,
  anchor,
}: HeroZoneProps) {
  const { resolveLabel, getIcon } = useLabels();
  const { statusDisplay } = useDisplayConfigs(status || 'active', type || 'unknown');
  
  // 使用同步版本作为回退
  const finalStatusDisplay = statusDisplay || getStatusDisplaySync(status || 'active');
  const StatusIcon = getLucideIcon(finalStatusDisplay.icon);
  
  // 获取类型显示配置
  const typeResolved = resolveLabel(type || 'unknown');
  const TypeIcon = getLucideIcon(getIcon(type || 'unknown'));
  
  return (
    <header className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 类型徽章 */}
          {type && (
            <span
              className="px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5"
              style={{
                backgroundColor: '#F1F5F9',
                color: '#475569',
              }}
            >
              {TypeIcon && <TypeIcon className="w-3.5 h-3.5" />}
              {typeResolved.label}
            </span>
          )}
          
          {/* 标题 */}
          <h2 className="text-xl font-semibold text-slate-900">
            {title}
          </h2>
          
          {/* 状态徽章 */}
          {showStatusBadge && status && (
            <span
              className="px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5"
              style={{
                backgroundColor: finalStatusDisplay.bg || '#F1F5F9',
                color: finalStatusDisplay.text || '#475569',
              }}
            >
              {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
              {resolveLabel(status).label}
            </span>
          )}
        </div>
        
        {/* Anchor 显示 */}
        {anchor && (
          <code className="text-xs text-slate-400 font-mono">
            #{anchor}
          </code>
        )}
      </div>
      
      {/* ID 显示 */}
      {id && (
        <div className="mt-1.5 text-sm text-slate-500">
          ID: <span className="font-mono">{id}</span>
        </div>
      )}
      
      {/* 额外的 Hero 字段 */}
      {fields.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {fields.map(({ key, value }) => {
            const resolved = resolveLabel(key);
            const FieldIcon = getLucideIcon(getIcon(key));
            
            return (
              <div key={key} className="flex items-center gap-1.5 text-sm">
                {FieldIcon && <FieldIcon className="w-4 h-4 text-slate-400" />}
                <span className="text-slate-500">{resolved.label}:</span>
                <span className="text-slate-700 font-medium">
                  {formatValue(value)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}

/**
 * 格式化值显示
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  if (Array.isArray(value)) {
    return value.join('、');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export default HeroZone;

