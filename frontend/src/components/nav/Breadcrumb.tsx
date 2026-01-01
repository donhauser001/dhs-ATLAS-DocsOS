/**
 * Breadcrumb - 面包屑导航
 * 
 * Phase 3.0: UI 内功
 * 
 * 特点：
 * - 清晰的路径显示
 * - 可点击的层级
 * - 支持文档/Block 导航
 */

import { ChevronRight, Home, FileText, Hash } from 'lucide-react';

// ============================================================
// 类型定义
// ============================================================

export interface BreadcrumbItem {
  label: string;
  path?: string;
  type: 'home' | 'folder' | 'document' | 'block';
}

interface BreadcrumbProps {
  /** 面包屑项 */
  items: BreadcrumbItem[];
  /** 点击回调 */
  onNavigate?: (path: string) => void;
}

// ============================================================
// 主组件
// ============================================================

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav
      className="breadcrumb flex items-center gap-1 text-sm"
      aria-label="面包屑导航"
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight
              size={14}
              style={{ color: `var(--ui-nav-breadcrumb-separator)` }}
            />
          )}
          
          <BreadcrumbItem
            item={item}
            isLast={index === items.length - 1}
            onClick={() => item.path && onNavigate?.(item.path)}
          />
        </div>
      ))}
    </nav>
  );
}

// ============================================================
// 面包屑项
// ============================================================

function BreadcrumbItem({
  item,
  isLast,
  onClick,
}: {
  item: BreadcrumbItem;
  isLast: boolean;
  onClick: () => void;
}) {
  const Icon = getIcon(item.type);
  
  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.15s',
  };
  
  if (isLast) {
    return (
      <span
        className="breadcrumb-current"
        style={{
          ...baseStyle,
          color: `var(--ui-nav-breadcrumb-current)`,
          fontWeight: 500,
        }}
      >
        <Icon size={14} />
        {item.label}
      </span>
    );
  }
  
  return (
    <button
      className="breadcrumb-link hover:bg-slate-100"
      style={{
        ...baseStyle,
        color: `var(--ui-nav-breadcrumb-text)`,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <Icon size={14} />
      {item.label}
    </button>
  );
}

// ============================================================
// 辅助函数
// ============================================================

function getIcon(type: BreadcrumbItem['type']) {
  switch (type) {
    case 'home':
      return Home;
    case 'folder':
      return FileText;
    case 'document':
      return FileText;
    case 'block':
      return Hash;
    default:
      return FileText;
  }
}

// ============================================================
// 辅助函数：从路径生成面包屑
// ============================================================

export function pathToBreadcrumbs(
  path: string,
  documentTitle?: string,
  blockAnchor?: string
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: '首页', path: '/', type: 'home' },
  ];
  
  const parts = path.split('/').filter(Boolean);
  let currentPath = '';
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    currentPath = `${currentPath}/${part}`;
    
    if (i === parts.length - 1 && part.endsWith('.md')) {
      // 最后一个是文档
      items.push({
        label: documentTitle || part.replace('.md', ''),
        path: currentPath,
        type: 'document',
      });
    } else {
      // 文件夹
      items.push({
        label: part,
        path: currentPath,
        type: 'folder',
      });
    }
  }
  
  // 如果有 Block anchor
  if (blockAnchor) {
    items.push({
      label: `#${blockAnchor}`,
      type: 'block',
    });
  }
  
  return items;
}

export default Breadcrumb;

