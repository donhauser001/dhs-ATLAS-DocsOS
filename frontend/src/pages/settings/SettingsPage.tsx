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
import { ArrowLeft, Tag, Database, FileType, Workflow, Layout, Zap, Package, Users, Shield, Mail, FileText } from 'lucide-react';
import { LabelSettings } from './LabelSettings';
import { DataTemplateSettings } from './DataTemplateSettings';
import { DocTypeSettings } from './DocTypeSettings';
import { FunctionTypeSettings } from './FunctionTypeSettings';
import { DisplayModeSettings } from './DisplayModeSettings';
import { CapabilitySettings } from './CapabilitySettings';
import { PluginMarketSettings } from './PluginMarketSettings';
import { AITalentMarketSettings } from './AITalentMarketSettings';
import { AuthManagementSettings } from './AuthManagementSettings';
import { EmailSettings } from './EmailSettings';
import { AuditLogSettings } from './AuditLogSettings';

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
    id: 'plugin-market',
    label: '插件市场',
    icon: <Package className="h-4 w-4" />,
    description: '浏览和安装类型包',
    component: <PluginMarketSettings />,
  },
  {
    id: 'ai-talent-market',
    label: 'AI 人才市场',
    icon: <Users className="h-4 w-4" />,
    description: '雇佣和管理 AI 员工',
    component: <AITalentMarketSettings />,
  },
  {
    id: 'auth-management',
    label: '用户认证管理',
    icon: <Shield className="h-4 w-4" />,
    description: '注册、登录、密码策略、角色管理',
    component: <AuthManagementSettings />,
  },
  {
    id: 'email',
    label: '邮件服务',
    icon: <Mail className="h-4 w-4" />,
    description: 'SMTP 邮件配置',
    component: <EmailSettings />,
  },
  {
    id: 'audit-logs',
    label: '审计日志',
    icon: <FileText className="h-4 w-4" />,
    description: '查看操作日志',
    component: <AuditLogSettings />,
  },
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
  {
    id: 'doc-types',
    label: '文档类型',
    icon: <FileType className="h-4 w-4" />,
    description: '定义文档的本质分类',
    component: <DocTypeSettings />,
  },
  {
    id: 'function-types',
    label: '功能类型',
    icon: <Workflow className="h-4 w-4" />,
    description: '定义文档的交互行为',
    component: <FunctionTypeSettings />,
  },
  {
    id: 'display-modes',
    label: '显现模式',
    icon: <Layout className="h-4 w-4" />,
    description: '定义文档的呈现方式',
    component: <DisplayModeSettings />,
  },
  {
    id: 'capabilities',
    label: '能力类型',
    icon: <Zap className="h-4 w-4" />,
    description: '定义文档的行为能力',
    component: <CapabilitySettings />,
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


