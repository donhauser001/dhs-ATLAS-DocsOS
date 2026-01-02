/**
 * FooterZone - 底部区组件
 * 
 * Phase 3.5: 渲染分区系统
 * 
 * 显示内容：
 * - 文档元数据（created, updated, author, version 等）
 * - 默认折叠，可展开
 */

import { useState } from 'react';
import { ChevronDown, FileText, Calendar, User, GitBranch, Clock } from 'lucide-react';
import { useLabels } from '@/providers/LabelProvider';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FooterZoneProps {
  /** Footer 区字段 */
  fields: Array<{ key: string; value: unknown }>;
  /** 默认是否折叠 */
  defaultCollapsed?: boolean;
  /** 是否显示折叠按钮 */
  showToggle?: boolean;
}

/**
 * 字段图标映射
 */
const FIELD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  created: Calendar,
  updated: Clock,
  author: User,
  version: GitBranch,
  document_type: FileText,
};

export function FooterZone({
  fields,
  defaultCollapsed = true,
  showToggle = true,
}: FooterZoneProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const { resolveLabel } = useLabels();
  
  if (fields.length === 0) {
    return null;
  }
  
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50/50">
      <Collapsible open={!collapsed} onOpenChange={(open) => setCollapsed(!open)}>
        {/* 标题栏 */}
        {showToggle ? (
          <CollapsibleTrigger className="w-full px-6 py-3 flex items-center justify-between hover:bg-slate-100/50 transition-colors">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FileText className="w-4 h-4" />
              <span>文档信息</span>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-slate-400 transition-transform',
                !collapsed && 'rotate-180'
              )}
            />
          </CollapsibleTrigger>
        ) : (
          <div className="px-6 py-3 flex items-center gap-2 text-sm text-slate-500">
            <FileText className="w-4 h-4" />
            <span>文档信息</span>
          </div>
        )}
        
        {/* 内容区 */}
        <CollapsibleContent>
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {fields.map(({ key, value }) => {
                const resolved = resolveLabel(key);
                const Icon = FIELD_ICONS[key];
                
                return (
                  <div key={key} className="flex flex-col">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      {Icon && <Icon className="w-3 h-3" />}
                      {resolved.label}
                    </span>
                    <span className="text-sm text-slate-600 mt-0.5">
                      {formatMetadataValue(key, value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleContent>
        
        {/* 折叠时显示摘要 */}
        {collapsed && (
          <div className="px-6 pb-3 text-xs text-slate-400">
            {getSummary(fields)}
          </div>
        )}
      </Collapsible>
    </footer>
  );
}

/**
 * 格式化元数据值
 */
function formatMetadataValue(key: string, value: unknown): string {
  if (value === null || value === undefined) {
    return '—';
  }
  
  switch (key) {
    case 'created':
    case 'updated':
      return formatDateTime(value as string);
    case 'author':
      return resolveAuthorName(value as string);
    case 'version':
      return `v${value}`;
    case 'document_type':
      return formatDocType(value as string);
    default:
      return String(value);
  }
}

/**
 * 格式化日期时间
 */
function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // 今天
    if (diffDays === 0) {
      return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // 昨天
    if (diffDays === 1) {
      return '昨天';
    }
    
    // 一周内
    if (diffDays < 7) {
      return `${diffDays} 天前`;
    }
    
    // 一个月内
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} 周前`;
    }
    
    // 更久
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * 解析作者名称
 */
function resolveAuthorName(authorId: string): string {
  // 简单处理：移除前缀
  if (authorId.startsWith('u-')) {
    return authorId.slice(2).replace(/-/g, ' ');
  }
  return authorId;
}

/**
 * 格式化文档类型
 */
function formatDocType(docType: string): string {
  const docTypeLabels: Record<string, string> = {
    facts: '事实文档',
    project: '项目文档',
    system: '系统文档',
    navigation: '导航文档',
  };
  return docTypeLabels[docType] || docType;
}

/**
 * 生成摘要文本
 */
function getSummary(fields: Array<{ key: string; value: unknown }>): string {
  const parts: string[] = [];
  
  // 查找关键字段
  const created = fields.find(f => f.key === 'created');
  const author = fields.find(f => f.key === 'author');
  
  if (created) {
    parts.push(`创建: ${formatDateTime(created.value as string)}`);
  }
  
  if (author) {
    parts.push(`作者: ${resolveAuthorName(author.value as string)}`);
  }
  
  return parts.join(' · ') || '点击展开查看详情';
}

export default FooterZone;

