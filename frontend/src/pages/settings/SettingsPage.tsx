/**
 * SettingsPage - 系统设置页面
 * 
 * 提供系统配置的入口：
 * - 标签管理 (/settings/labels)
 * - 数据模板 (/settings/data-templates)
 * 
 * 支持 URL 定位，可通过 URL 直接访问特定设置板块
 */

import { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Tag, Database } from 'lucide-react';
import { LabelSettings } from './LabelSettings';
import { DataTemplateSettings } from './DataTemplateSettings';

// ============================================================
// 设置菜单项
// ============================================================

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  component: React.ReactNode;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'labels',
    label: '标签管理',
    icon: <Tag className="h-4 w-4" />,
    description: '配置字段的显示名称和图标',
    component: <LabelSettings />,
  },
  {
    id: 'data-templates',
    label: '数据模板',
    icon: <Database className="h-4 w-4" />,
    description: '管理数据块的预设模板',
    component: <DataTemplateSettings />,
  },
];

// ============================================================
// 主组件
// ============================================================

export function SettingsPage() {
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();

  // 获取当前激活的板块（从 URL 参数或默认第一个）
  const activeItem = section && MENU_ITEMS.find(item => item.id === section)
    ? section
    : MENU_ITEMS[0].id;

  // 如果 URL 没有 section 参数，重定向到默认板块
  useEffect(() => {
    if (!section) {
      navigate(`/settings/${MENU_ITEMS[0].id}`, { replace: true });
    }
  }, [section, navigate]);

  const currentItem = MENU_ITEMS.find(item => item.id === activeItem);

  // 切换板块时更新 URL
  const handleSectionChange = (itemId: string) => {
    navigate(`/settings/${itemId}`);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/workspace">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
          </Link>
          <span className="font-semibold text-lg tracking-tight">系统设置</span>
          {currentItem && (
            <span className="text-sm text-muted-foreground">/ {currentItem.label}</span>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-slate-50/50">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-1">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeItem === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  onClick={() => handleSectionChange(item.id)}
                >
                  {item.icon}
                  <div>
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className={`text-xs ${activeItem === item.id ? 'text-primary-foreground/70' : 'text-slate-500'
                      }`}>
                      {item.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {currentItem?.component}
        </main>
      </div>
    </div>
  );
}

export default SettingsPage;


