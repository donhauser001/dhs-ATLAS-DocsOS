/**
 * ActionBar - 操作按钮栏
 * 
 * 根据功能声明和能力显示可用操作
 */

import { useState } from 'react';
import { 
  MoreHorizontal, Edit, Trash2, Archive, Key, UserX, UserCheck,
  Download, Mail, Plus, RefreshCw, Settings, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ActionConfig, ADLDocument } from '@/registry/types';

// 图标映射
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  edit: Edit,
  trash: Trash2,
  archive: Archive,
  key: Key,
  'user-x': UserX,
  'user-check': UserCheck,
  download: Download,
  mail: Mail,
  plus: Plus,
  refresh: RefreshCw,
  settings: Settings,
  share: Share2,
};

interface ActionBarProps {
  /** 操作配置列表 */
  actions: ActionConfig[];
  /** 当前文档 */
  document: ADLDocument;
  /** 操作处理器 */
  onAction?: (actionId: string, doc: ADLDocument) => void;
  /** 进入编辑模式 */
  onEdit?: () => void;
  /** 最大显示按钮数（超出收入更多菜单） */
  maxVisible?: number;
}

export function ActionBar({ 
  actions, 
  document, 
  onAction, 
  onEdit,
  maxVisible = 2 
}: ActionBarProps) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  if (actions.length === 0) return null;

  // 分离主要操作和次要操作
  const visibleActions = actions.slice(0, maxVisible);
  const menuActions = actions.slice(maxVisible);

  const handleAction = (action: ActionConfig) => {
    // 如果需要确认
    if (action.confirmMessage) {
      setConfirmAction(action.id);
      return;
    }

    // 执行操作
    executeAction(action);
  };

  const executeAction = (action: ActionConfig) => {
    // 特殊处理：编辑操作
    if (action.id === 'edit' && onEdit) {
      onEdit();
      return;
    }

    // 如果是函数，直接执行
    if (typeof action.handler === 'function') {
      action.handler(document);
      return;
    }

    // 否则调用 onAction 回调
    onAction?.(action.id, document);
    setConfirmAction(null);
  };

  const getIcon = (iconName: string) => {
    const Icon = ICON_MAP[iconName] || Edit;
    return <Icon className="w-4 h-4" />;
  };

  const getButtonVariant = (variant?: ActionConfig['variant']) => {
    switch (variant) {
      case 'primary': return 'default';
      case 'danger': return 'destructive';
      case 'ghost': return 'ghost';
      default: return 'outline';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* 可见操作按钮 */}
      {visibleActions.map(action => (
        <Button
          key={action.id}
          variant={getButtonVariant(action.variant)}
          size="sm"
          onClick={() => handleAction(action)}
          className="gap-1.5"
        >
          {getIcon(action.icon)}
          {action.label}
        </Button>
      ))}

      {/* 更多操作菜单 */}
      {menuActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {menuActions.map((action, index) => (
              <div key={action.id}>
                {index > 0 && action.variant === 'danger' && (
                  <DropdownMenuSeparator />
                )}
                <DropdownMenuItem
                  onClick={() => handleAction(action)}
                  className={action.variant === 'danger' ? 'text-destructive' : ''}
                >
                  {getIcon(action.icon)}
                  <span className="ml-2">{action.label}</span>
                </DropdownMenuItem>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* 确认对话框 */}
      {confirmAction && (
        <ConfirmDialog
          action={actions.find(a => a.id === confirmAction)!}
          onConfirm={() => {
            const action = actions.find(a => a.id === confirmAction);
            if (action) executeAction(action);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

// 确认对话框组件
function ConfirmDialog({ 
  action, 
  onConfirm, 
  onCancel 
}: { 
  action: ActionConfig;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">确认操作</h3>
        <p className="text-muted-foreground mb-4">
          {action.confirmMessage || `确定要执行"${action.label}"操作吗？`}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button 
            variant={action.variant === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            确认
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ActionBar;

