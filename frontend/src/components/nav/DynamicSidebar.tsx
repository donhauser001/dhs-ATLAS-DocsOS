/**
 * DynamicSidebar - 动态侧边栏导航
 * 
 * Phase 3.3: 功能声明系统
 * 
 * 从 FunctionRegistry 获取导航配置，动态生成侧边栏
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Building,
  FileText,
  LayoutDashboard,
  Settings,
  FolderTree,
  type LucideIcon,
} from 'lucide-react';

// ============================================================
// 类型定义
// ============================================================

interface NavItem {
  path: string;
  icon?: string;
  label: string;
  order: number;
  url: string;
  parent?: string;
}

interface DynamicSidebarProps {
  /** 额外的固定导航项 */
  extraItems?: NavItem[];
  /** 当前活动路径 */
  activePath?: string;
}

// ============================================================
// 图标映射
// ============================================================

const ICON_MAP: Record<string, LucideIcon> = {
  users: Users,
  building: Building,
  file: FileText,
  dashboard: LayoutDashboard,
  settings: Settings,
  folder: FolderTree,
};

function getIcon(iconName?: string): LucideIcon {
  if (iconName && ICON_MAP[iconName]) {
    return ICON_MAP[iconName];
  }
  return FileText;
}

// ============================================================
// 主组件
// ============================================================

export function DynamicSidebar({ extraItems = [], activePath }: DynamicSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentPath = activePath || location.pathname;
  
  // 获取导航数据
  useEffect(() => {
    async function fetchNav() {
      try {
        const response = await fetch('/api/navigation/sidebar');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setNavItems(result.data.items || []);
          }
        }
      } catch (err) {
        console.error('[DynamicSidebar] Failed to fetch navigation:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchNav();
  }, []);
  
  // 合并额外项目
  const allItems = [...navItems, ...extraItems].sort((a, b) => a.order - b.order);
  
  // 点击导航项
  const handleClick = (item: NavItem) => {
    navigate(item.url);
  };
  
  // 检查是否是当前活动项
  const isActive = (item: NavItem) => {
    return currentPath.includes(item.path) || currentPath === item.url;
  };
  
  return (
    <nav className="dynamic-sidebar py-2">
      {/* 标题 */}
      <div
        className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--ui-field-label-color)' }}
      >
        功能导航
      </div>
      
      {/* 加载状态 */}
      {loading && (
        <div
          className="px-4 py-2 text-sm"
          style={{ color: 'var(--ui-field-label-color)' }}
        >
          加载中...
        </div>
      )}
      
      {/* 导航项 */}
      {!loading && allItems.length === 0 && (
        <div
          className="px-4 py-2 text-sm"
          style={{ color: 'var(--ui-field-label-color)' }}
        >
          暂无导航项
        </div>
      )}
      
      {!loading && allItems.map((item) => {
        const Icon = getIcon(item.icon);
        const active = isActive(item);
        
        return (
          <button
            key={item.url}
            onClick={() => handleClick(item)}
            className={`
              w-full flex items-center gap-3 px-4 py-2.5 text-sm
              transition-colors text-left
              ${active ? 'bg-purple-50' : 'hover:bg-gray-50'}
            `}
            style={{
              color: active ? 'var(--color-brand-primary)' : 'var(--ui-field-value-color)',
              borderLeft: active ? '3px solid var(--color-brand-primary)' : '3px solid transparent',
            }}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default DynamicSidebar;

