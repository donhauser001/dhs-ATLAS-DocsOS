/**
 * DocumentViewer - 文档阅读态
 * 
 * Phase 3.0: UI 内功
 * 
 * 目标体验：像在看一份结构化说明书
 * 
 * 特点：
 * - 清晰的结构层次
 * - 语义化的颜色和图标
 * - 支持展开/折叠
 * - 不可编辑
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Hash,
  Calendar,
  User,
  Briefcase,
  FolderTree,
  CalendarDays,
  Users,
  LayoutGrid,
  Palette,
} from 'lucide-react';
import type { ADLDocument, Block, MachineBlock } from '@/types/adl';
import { useTokenContext } from '@/components/tokens/TokenProvider';

// ============================================================
// 类型定义
// ============================================================

interface DocumentViewerProps {
  /** ADL 文档 */
  document: ADLDocument;
  /** 选中 Block 的 anchor */
  selectedAnchor?: string;
  /** Block 点击回调 */
  onBlockClick?: (block: Block) => void;
}

// ============================================================
// 主组件
// ============================================================

export function DocumentViewer({
  document,
  selectedAnchor,
  onBlockClick,
}: DocumentViewerProps) {
  return (
    <div className="document-viewer">
      {/* 文档头部 */}
      <DocumentHeader document={document} />
      
      {/* Block 列表 */}
      <div className="blocks-container space-y-4 mt-6">
        {document.blocks.map((block) => (
          <BlockCard
            key={block.anchor}
            block={block}
            isSelected={block.anchor === selectedAnchor}
            onClick={() => onBlockClick?.(block)}
          />
        ))}
      </div>
      
      {/* 空状态 */}
      {document.blocks.length === 0 && (
        <div
          className="text-center py-12"
          style={{ color: `var(--ui-field-label-color)` }}
        >
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>此文档暂无内容</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 文档头部
// ============================================================

function DocumentHeader({ document }: { document: ADLDocument }) {
  const { frontmatter, path } = document;
  
  return (
    <div
      className="document-header p-6 rounded-lg"
      style={{
        backgroundColor: `var(--ui-block-header-bg)`,
        borderBottom: `1px solid var(--ui-block-header-border)`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <FileText size={20} style={{ color: `var(--color-brand-primary)` }} />
        <span
          className="text-sm font-mono"
          style={{ color: `var(--ui-field-label-color)` }}
        >
          {path}
        </span>
      </div>
      
      <h1
        className="text-2xl font-bold"
        style={{ color: `var(--ui-field-value-color)` }}
      >
        {frontmatter.title || path?.split('/').pop()?.replace('.md', '')}
      </h1>
      
      <div
        className="flex items-center gap-4 mt-3 text-sm"
        style={{ color: `var(--ui-field-label-color)` }}
      >
        {frontmatter.author && (
          <span className="flex items-center gap-1">
            <User size={14} />
            {frontmatter.author}
          </span>
        )}
        {frontmatter.created && (
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {frontmatter.created}
          </span>
        )}
        {frontmatter.version && (
          <span className="flex items-center gap-1">
            <Hash size={14} />
            v{frontmatter.version}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Block 卡片
// ============================================================

interface BlockCardProps {
  block: Block;
  isSelected: boolean;
  onClick: () => void;
}

function BlockCard({ block, isSelected, onClick }: BlockCardProps) {
  const [expanded, setExpanded] = useState(true);
  const { resolveToken } = useTokenContext();
  const { machine, heading, anchor, body } = block;
  
  // 获取类型颜色
  const typeColor = resolveToken(`color.type.${machine.type}`) || `var(--color-brand-primary)`;
  const typeBg = resolveToken(`color.type.${machine.type}.bg`) || `var(--color-brand-primary)20`;
  
  // 获取状态颜色
  const statusColor = resolveToken(`color.status.${machine.status}`) || `var(--color-status-draft)`;
  const statusBg = resolveToken(`color.status.${machine.status}.bg`) || `var(--color-status-draft-bg)`;
  
  return (
    <div
      className="block-card rounded-lg overflow-hidden transition-shadow cursor-pointer"
      style={{
        backgroundColor: `var(--ui-block-body-bg)`,
        border: isSelected
          ? `2px solid var(--ui-block-selected-border)`
          : `1px solid var(--ui-block-body-border)`,
        boxShadow: isSelected ? '0 4px 12px rgba(139, 92, 246, 0.15)' : 'none',
      }}
      onClick={onClick}
    >
      {/* Block 头部 */}
      <div
        className="block-header p-4 flex items-center justify-between"
        style={{
          backgroundColor: `var(--ui-block-header-bg)`,
          borderBottom: `1px solid var(--ui-block-header-border)`,
        }}
      >
        <div className="flex items-center gap-3">
          {/* 展开/折叠按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-1 rounded hover:bg-slate-200 transition-colors"
          >
            {expanded ? (
              <ChevronDown size={16} style={{ color: `var(--ui-field-label-color)` }} />
            ) : (
              <ChevronRight size={16} style={{ color: `var(--ui-field-label-color)` }} />
            )}
          </button>
          
          {/* 类型图标 */}
          <TypeIcon type={machine.type} color={typeColor} />
          
          {/* 标题 */}
          <div>
            <h3
              className="font-semibold"
              style={{ color: `var(--ui-field-value-color)` }}
            >
              {heading || machine.title}
            </h3>
            <span
              className="text-xs font-mono"
              style={{ color: `var(--ui-field-label-color)` }}
            >
              #{anchor}
            </span>
          </div>
        </div>
        
        {/* 状态和类型标签 */}
        <div className="flex items-center gap-2">
          <TypeBadge type={machine.type} color={typeColor} bg={typeBg} />
          <StatusBadge status={machine.status} color={statusColor} bg={statusBg} />
        </div>
      </div>
      
      {/* Block 内容 */}
      {expanded && (
        <div className="block-content p-4">
          {/* 字段列表 */}
          <FieldList machine={machine} />
          
          {/* Body 内容 */}
          {body && (
            <div
              className="block-body mt-4 pt-4"
              style={{
                borderTop: `1px solid var(--ui-block-header-border)`,
                color: `var(--ui-field-value-color)`,
              }}
            >
              <p className="whitespace-pre-wrap text-sm">{body}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 字段列表
// ============================================================

function FieldList({ machine }: { machine: MachineBlock }) {
  // 过滤掉基本字段和系统字段
  const basicFields = ['type', 'id', 'status', 'title'];
  const systemFields = ['$display', '$constraints', '$meta'];
  
  const fields = Object.entries(machine).filter(
    ([key]) => !basicFields.includes(key) && !systemFields.includes(key)
  );
  
  if (fields.length === 0) {
    return null;
  }
  
  return (
    <div className="field-list grid grid-cols-2 gap-3">
      {fields.map(([key, value]) => (
        <FieldItem key={key} name={key} value={value} />
      ))}
    </div>
  );
}

function FieldItem({ name, value }: { name: string; value: unknown }) {
  const displayValue = formatFieldValue(value);
  
  return (
    <div className="field-item">
      <dt
        className="text-xs font-medium mb-1"
        style={{ color: `var(--ui-field-label-color)` }}
      >
        {name}
      </dt>
      <dd
        className="text-sm"
        style={{ color: `var(--ui-field-value-color)` }}
      >
        {displayValue}
      </dd>
    </div>
  );
}

// ============================================================
// 徽章组件
// ============================================================

function TypeBadge({
  type,
  color,
  bg,
}: {
  type: string;
  color: string;
  bg: string;
}) {
  return (
    <span
      className="px-2 py-1 rounded text-xs font-medium"
      style={{
        backgroundColor: bg,
        color: color,
      }}
    >
      {type}
    </span>
  );
}

function StatusBadge({
  status,
  color,
  bg,
}: {
  status: string;
  color: string;
  bg: string;
}) {
  const statusLabels: Record<string, string> = {
    active: '激活',
    draft: '草稿',
    archived: '归档',
  };
  
  return (
    <span
      className="px-2 py-1 rounded text-xs font-medium"
      style={{
        backgroundColor: bg,
        color: color,
      }}
    >
      {statusLabels[status] || status}
    </span>
  );
}

// ============================================================
// 类型图标
// ============================================================

function TypeIcon({ type, color }: { type: string; color: string }) {
  const icons: Record<string, typeof Briefcase> = {
    service: Briefcase,
    category: FolderTree,
    event: CalendarDays,
    contact: Users,
    project: LayoutGrid,
    token_group: Palette,
  };
  
  const Icon = icons[type] || FileText;
  
  return <Icon size={20} style={{ color }} />;
}

// ============================================================
// 辅助函数
// ============================================================

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }
  
  // 处理引用
  if (typeof value === 'object' && value !== null) {
    if ('ref' in value) {
      return (value as { ref: string }).ref;
    }
    if ('token' in value) {
      return (value as { token: string }).token;
    }
    return JSON.stringify(value);
  }
  
  return String(value);
}

export default DocumentViewer;

