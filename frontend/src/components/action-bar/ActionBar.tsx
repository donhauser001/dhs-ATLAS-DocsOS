/**
 * ActionBar - 操作按钮栏
 * 
 * 根据功能声明和能力显示可用操作
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MoreHorizontal, Edit, Trash2, Archive, Key, UserX, UserCheck,
  Download, Mail, Plus, RefreshCw, Settings, Share2, Copy, Loader2
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
import { executeAction, type ActionContext } from '@/services/action-handlers';

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
  copy: Copy,
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
  /** 切换视图模式 */
  onSetViewMode?: (mode: 'read' | 'form' | 'md') => void;
  /** 最大显示按钮数（超出收入更多菜单） */
  maxVisible?: number;
}

export function ActionBar({ 
  actions, 
  document, 
  onAction, 
  onEdit,
  onSetViewMode,
  maxVisible = 2 
}: ActionBarProps) {
  const navigate = useNavigate();
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  if (actions.length === 0) return null;

  // 分离主要操作和次要操作
  const visibleActions = actions.slice(0, maxVisible);
  const menuActions = actions.slice(maxVisible);

  // 创建操作上下文
  const actionContext: ActionContext = {
    navigate: (path) => navigate(path),
    reload: () => window.location.reload(),
    setViewMode: onSetViewMode,
    toast: (message, type = 'info') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
  };

  const handleAction = (action: ActionConfig) => {
    // 如果需要确认
    if (action.confirmMessage) {
      setConfirmAction(action.id);
      return;
    }

    // 执行操作
    runAction(action);
  };

  const runAction = async (action: ActionConfig) => {
    // 特殊处理：编辑操作
    if (action.id === 'edit' && onEdit) {
      onEdit();
      return;
    }

    // 如果是函数，直接执行
    if (typeof action.handler === 'function') {
      action.handler(document);
      setConfirmAction(null);
      return;
    }

    // 使用处理器 ID 执行操作
    const handlerId = typeof action.handler === 'string' ? action.handler : action.id;
    setLoading(action.id);

    try {
      const result = await executeAction(handlerId, document, actionContext);
      
      if (result.success) {
        actionContext.toast?.(result.message || '操作成功', 'success');
      } else {
        actionContext.toast?.(result.error || '操作失败', 'error');
      }
    } catch (error) {
      actionContext.toast?.('操作失败', 'error');
    } finally {
      setLoading(null);
      setConfirmAction(null);
    }

    // 调用外部回调（如果有）
    onAction?.(action.id, document);
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
    <>
      <div className="flex items-center gap-2">
        {/* 可见操作按钮 */}
        {visibleActions.map(action => (
          <Button
            key={action.id}
            variant={getButtonVariant(action.variant)}
            size="sm"
            onClick={() => handleAction(action)}
            disabled={loading === action.id}
            className="gap-1.5"
          >
            {loading === action.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              getIcon(action.icon)
            )}
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
                    disabled={loading === action.id}
                    className={action.variant === 'danger' ? 'text-destructive' : ''}
                  >
                    {loading === action.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      getIcon(action.icon)
                    )}
                    <span className="ml-2">{action.label}</span>
                  </DropdownMenuItem>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* 确认对话框 */}
      {confirmAction && (
        <ConfirmDialog
          action={actions.find(a => a.id === confirmAction)!}
          loading={loading === confirmAction}
          onConfirm={() => {
            const action = actions.find(a => a.id === confirmAction);
            if (action) runAction(action);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Toast 提示 */}
      {toast && (
        <Toast message={toast.message} type={toast.type} />
      )}
    </>
  );
}

// 确认对话框组件
function ConfirmDialog({ 
  action, 
  loading,
  onConfirm, 
  onCancel 
}: { 
  action: ActionConfig;
  loading?: boolean;
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
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            取消
          </Button>
          <Button 
            variant={action.variant === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            确认
          </Button>
        </div>
      </div>
    </div>
  );
}

// Toast 提示组件
function Toast({ 
  message, 
  type 
}: { 
  message: string; 
  type: 'success' | 'error' | 'info';
}) {
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type];

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white ${bgColor}`}>
      {message}
    </div>
  );
}

export default ActionBar;

