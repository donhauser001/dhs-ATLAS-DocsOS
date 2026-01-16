/**
 * FieldSettingsDialog - 字段设置对话框
 * 
 * 点击数据块字段名时弹出，用于配置字段属性
 * - 编辑字段标签名称
 * - 绑定/解绑组件
 * - 查看字段信息
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Link2,
  Unlink,
  Settings2,
  Tag,
  ChevronDown,
  Check,
  Pencil,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLabels } from '@/providers/LabelProvider';
import type { DocumentComponentDefinition } from '../ComponentPanel/types';

// ============================================================
// 工具函数
// ============================================================

function getLucideIcon(
  iconName: string | undefined
): React.ComponentType<{ className?: string; size?: number }> | null {
  if (!iconName) return null;
  const pascalCase = iconName
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  return (LucideIcons as Record<string, unknown>)[pascalCase] as React.ComponentType<{
    className?: string;
    size?: number;
  }> | null;
}

// ============================================================
// Props
// ============================================================

export interface FieldSettingsDialogProps {
  /** 字段键 */
  fieldKey: string;
  /** 字段当前值 */
  fieldValue: unknown;
  /** 当前显示的标签名称 */
  currentLabel: string;
  /** 当前绑定的组件 ID */
  boundComponentId?: string;
  /** 可用的组件列表 */
  availableComponents: DocumentComponentDefinition[];
  /** 绑定组件回调 */
  onBindComponent: (componentId: string | null) => void;
  /** 更新标签名称回调 */
  onUpdateLabel?: (newLabel: string) => void;
  /** 关闭对话框 */
  onClose: () => void;
}

// ============================================================
// 主组件
// ============================================================

export function FieldSettingsDialog({
  fieldKey,
  fieldValue,
  currentLabel,
  boundComponentId,
  availableComponents,
  onBindComponent,
  onUpdateLabel,
  onClose,
}: FieldSettingsDialogProps) {
  const { getIcon } = useLabels();
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    boundComponentId || null
  );
  const [showComponentDropdown, setShowComponentDropdown] = useState(false);
  
  // 标签编辑状态
  const [editedLabel, setEditedLabel] = useState(currentLabel);
  const [isEditingLabel, setIsEditingLabel] = useState(false);

  // 当 currentLabel 变化时同步
  useEffect(() => {
    setEditedLabel(currentLabel);
  }, [currentLabel]);

  // 获取选中的组件
  const selectedComponent = useMemo(() => {
    if (!selectedComponentId) return null;
    return availableComponents.find((c) => c.id === selectedComponentId) || null;
  }, [selectedComponentId, availableComponents]);

  // 获取当前绑定的组件
  const boundComponent = useMemo(() => {
    if (!boundComponentId) return null;
    return availableComponents.find((c) => c.id === boundComponentId) || null;
  }, [boundComponentId, availableComponents]);

  // 字段图标
  const fieldIconName = getIcon(fieldKey);
  const FieldIcon = getLucideIcon(fieldIconName);

  // 标签是否有变化
  const labelChanged = editedLabel !== currentLabel && editedLabel.trim() !== '';

  // 确认
  const handleConfirm = useCallback(() => {
    // 如果标签有变化，先更新标签
    if (labelChanged && onUpdateLabel) {
      onUpdateLabel(editedLabel.trim());
    }
    onBindComponent(selectedComponentId);
    onClose();
  }, [selectedComponentId, onBindComponent, onClose, labelChanged, editedLabel, onUpdateLabel]);

  // 解绑
  const handleUnbind = useCallback(() => {
    setSelectedComponentId(null);
  }, []);

  return createPortal(
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 对话框 */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[400px] bg-white rounded-xl shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Settings2 size={18} className="text-purple-500" />
            <h2 className="text-base font-semibold text-slate-800">字段设置</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-5 py-4 space-y-4">
          {/* 字段信息 */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {FieldIcon ? (
                <FieldIcon size={16} className="text-slate-500" />
              ) : (
                <Tag size={16} className="text-slate-400" />
              )}
              <span className="text-sm font-medium text-slate-700">
                {currentLabel}
              </span>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <div>字段键：<code className="px-1 py-0.5 bg-slate-200 rounded text-slate-600">{fieldKey}</code></div>
              <div>当前值：<span className="text-slate-600">{String(fieldValue) || '(空)'}</span></div>
            </div>
          </div>

          {/* 标签名称编辑 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              标签名称
            </label>
            {isEditingLabel ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedLabel}
                  onChange={(e) => setEditedLabel(e.target.value)}
                  onBlur={() => {
                    if (editedLabel.trim() === '') {
                      setEditedLabel(currentLabel);
                    }
                    setIsEditingLabel(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editedLabel.trim() === '') {
                        setEditedLabel(currentLabel);
                      }
                      setIsEditingLabel(false);
                    }
                    if (e.key === 'Escape') {
                      setEditedLabel(currentLabel);
                      setIsEditingLabel(false);
                    }
                  }}
                  autoFocus
                  className={cn(
                    'flex-1 px-3 py-2 text-sm rounded-lg border transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-400',
                    'border-purple-300 bg-white'
                  )}
                  placeholder="输入标签名称..."
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingLabel(true)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors',
                  'hover:border-purple-300 hover:bg-purple-50/50',
                  'border-slate-200 bg-white text-left'
                )}
              >
                <span className={cn(
                  'text-sm',
                  editedLabel !== currentLabel ? 'text-purple-600' : 'text-slate-700'
                )}>
                  {editedLabel || fieldKey}
                </span>
                <Pencil size={14} className="text-slate-400" />
              </button>
            )}
            {labelChanged && (
              <p className="mt-1.5 text-xs text-purple-600 flex items-center gap-1">
                <span>标签将从「{currentLabel}」改为「{editedLabel}」</span>
              </p>
            )}
          </div>

          {/* 组件绑定 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              绑定组件
            </label>

            {availableComponents.length > 0 ? (
              <div className="relative">
                {/* 选择器按钮 */}
                <button
                  type="button"
                  onClick={() => setShowComponentDropdown(!showComponentDropdown)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors',
                    'hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400/30',
                    showComponentDropdown
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-slate-200 bg-white'
                  )}
                >
                  {selectedComponent ? (
                    <div className="flex items-center gap-2">
                      <Link2 size={16} className="text-purple-500" />
                      <span className="text-sm text-slate-700">{selectedComponent.label}</span>
                      <span className="text-xs text-slate-400">({selectedComponent.type})</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">选择组件...</span>
                  )}
                  <ChevronDown
                    size={16}
                    className={cn(
                      'text-slate-400 transition-transform',
                      showComponentDropdown && 'rotate-180'
                    )}
                  />
                </button>

                {/* 下拉列表 */}
                {showComponentDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 max-h-[200px] overflow-auto">
                    {/* 无绑定选项 */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedComponentId(null);
                        setShowComponentDropdown(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                        !selectedComponentId
                          ? 'bg-purple-50 text-purple-700'
                          : 'hover:bg-slate-50 text-slate-600'
                      )}
                    >
                      <Unlink size={14} className="text-slate-400" />
                      <span>不绑定组件</span>
                      {!selectedComponentId && <Check size={14} className="ml-auto text-purple-600" />}
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    {/* 组件列表 */}
                    {availableComponents.map((comp) => (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => {
                          setSelectedComponentId(comp.id);
                          setShowComponentDropdown(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                          selectedComponentId === comp.id
                            ? 'bg-purple-50 text-purple-700'
                            : 'hover:bg-slate-50 text-slate-700'
                        )}
                      >
                        <Link2 size={14} className="text-purple-400" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{comp.label}</div>
                          <div className="text-xs text-slate-400">{comp.type}</div>
                        </div>
                        {selectedComponentId === comp.id && (
                          <Check size={14} className="text-purple-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-sm text-slate-500 mb-2">暂无可用组件</p>
                <p className="text-xs text-slate-400">
                  请先在左侧"文档组件"面板中创建组件
                </p>
              </div>
            )}

            {/* 当前绑定状态提示 */}
            {boundComponent && selectedComponentId !== boundComponentId && (
              <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                <span>当前绑定：{boundComponent.label}</span>
                <span>→</span>
                <span>{selectedComponent ? selectedComponent.label : '解除绑定'}</span>
              </p>
            )}
          </div>

          {/* 组件预览 */}
          {selectedComponent && (
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-xs font-medium text-purple-700 mb-2">组件预览</div>
              <div className="text-sm text-purple-600">
                类型：{selectedComponent.type}
                {selectedComponent.type === 'select' || selectedComponent.type === 'radio' ? (
                  <div className="mt-1 text-xs text-purple-500">
                    选项：{(selectedComponent as { options?: { label: string }[] }).options?.map(o => o.label).join('、')}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

export default FieldSettingsDialog;

