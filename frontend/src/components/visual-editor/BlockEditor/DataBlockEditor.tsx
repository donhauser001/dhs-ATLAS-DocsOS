/**
 * DataBlockEditor - 数据块精细化编辑器
 * 
 * 将 YAML 数据以友好的表单形式展示和编辑
 * 使用标签映射系统显示中文字段名
 * 所有字段必须来自标签管理系统
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, RefreshCw, CheckCircle2, Tag, Lock, Save } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useLabels } from '@/providers/LabelProvider';
import { FieldSelector } from './FieldSelector';
import { SaveTemplateDialog } from './SaveTemplateDialog';
import { FIXED_FIELD_KEYS } from './types';
import yaml from 'js-yaml';

/**
 * 动态获取 Lucide 图标组件
 */
function getLucideIcon(name: string | undefined): React.ComponentType<{ className?: string; size?: number }> | null {
  if (!name) return null;

  // 将 kebab-case 转换为 PascalCase
  const pascalCase = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  // @ts-expect-error - 动态访问
  const Icon = LucideIcons[pascalCase];
  return Icon || null;
}

interface DataField {
  key: string;
  value: string | number | boolean;
}

interface DataBlockEditorProps {
  /** YAML 字符串内容 */
  content: string;
  /** 内容变化回调 */
  onChange: (content: string) => void;
  /** 是否只读 */
  readOnly?: boolean;
  /** 同步结构到所有同类型数据块的回调 */
  onSyncStructure?: (dataType: string, fieldKeys: string[]) => number;
}

export function DataBlockEditor({ content, onChange, readOnly = false, onSyncStructure }: DataBlockEditorProps) {
  const { getLabel, getIcon } = useLabels();
  const [fields, setFields] = useState<DataField[]>([]);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [syncResult, setSyncResult] = useState<{ count: number } | null>(null);
  const [selectorPosition, setSelectorPosition] = useState<{ top: number; left: number } | null>(null);
  const addFieldButtonRef = useRef<HTMLButtonElement>(null);

  // 计算弹出框位置
  const openFieldSelector = useCallback(() => {
    if (addFieldButtonRef.current) {
      const rect = addFieldButtonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const selectorHeight = 400; // 预估选择器高度
      
      // 判断向上还是向下弹出
      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - rect.bottom;
      
      let top: number;
      if (spaceAbove > selectorHeight || spaceAbove > spaceBelow) {
        // 向上弹出
        top = rect.top - selectorHeight - 8;
        if (top < 60) top = 60; // 确保不超出顶部（留出头部空间）
      } else {
        // 向下弹出
        top = rect.bottom + 8;
      }
      
      setSelectorPosition({
        top,
        left: rect.left,
      });
    }
    setShowFieldSelector(true);
  }, []);

  // 解析 YAML 为字段数组
  useEffect(() => {
    try {
      const parsed = yaml.load(content);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const fieldArray: DataField[] = Object.entries(parsed as Record<string, unknown>).map(
          ([key, value]) => ({
            key,
            value: value as string | number | boolean,
          })
        );
        setFields(fieldArray);
      } else {
        setFields([]);
      }
    } catch {
      setFields([]);
    }
  }, [content]);

  // 获取数据类型（从 type 字段）
  const dataType = useMemo(() => {
    const typeField = fields.find((f) => f.key === 'type');
    return typeField ? String(typeField.value) : null;
  }, [fields]);

  // 获取当前字段的 key 列表（用于同步）
  const fieldKeys = useMemo(() => {
    return fields.map((f) => f.key);
  }, [fields]);

  // 更新字段值
  const updateFieldValue = (index: number, value: string) => {
    const newFields = [...fields];
    // 尝试转换类型
    let parsedValue: string | number | boolean = value;
    if (value === 'true') parsedValue = true;
    else if (value === 'false') parsedValue = false;
    else if (!isNaN(Number(value)) && value.trim() !== '') parsedValue = Number(value);
    
    newFields[index] = { ...newFields[index], value: parsedValue };
    setFields(newFields);
    syncToYaml(newFields);
  };

  // 删除字段
  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
    syncToYaml(newFields);
  };

  // 添加字段
  const addField = (key: string) => {
    if (fields.some((f) => f.key === key)) return;
    const newFields = [...fields, { key, value: '' }];
    setFields(newFields);
    syncToYaml(newFields);
  };

  // 同步到 YAML
  const syncToYaml = (fieldArray: DataField[]) => {
    const obj: Record<string, unknown> = {};
    for (const field of fieldArray) {
      obj[field.key] = field.value;
    }
    const yamlStr = yaml.dump(obj, { lineWidth: -1, quotingType: '"', forceQuotes: false });
    onChange(yamlStr.trim());
  };

  // 同步结构到所有同类型数据块（纯前端）
  const handleSyncStructure = () => {
    if (!dataType || !onSyncStructure) return;
    
    // 确认对话框
    const confirmed = window.confirm(
      `⚠️ 同步确认\n\n` +
      `此操作将把当前数据块的字段结构同步到本文档中所有 "${dataType}" 类型的数据块。\n\n` +
      `• 缺少的字段将被添加（值为空）\n` +
      `• 多余的字段将被删除\n` +
      `• 已有字段的值保持不变\n\n` +
      `当前字段：${fieldKeys.join(', ')}\n\n` +
      `确定要继续吗？`
    );
    
    if (!confirmed) return;
    
    const count = onSyncStructure(dataType, fieldKeys);
    setSyncResult({ count });
    
    // 2秒后清除结果提示
    setTimeout(() => setSyncResult(null), 2000);
  };

  // 渲染字段图标
  const renderFieldIcon = (key: string) => {
    const iconName = getIcon(key);
    const IconComponent = getLucideIcon(iconName);
    
    if (IconComponent) {
      return <IconComponent size={14} className="text-slate-400 flex-shrink-0" />;
    }
    // 默认图标
    return <Tag size={14} className="text-slate-300 flex-shrink-0" />;
  };

  if (readOnly) {
    return (
      <div className="space-y-1">
        {fields.map((field) => (
          <div key={field.key} className="flex items-center gap-3 text-sm py-0.5">
            <div className="min-w-[120px] flex items-center gap-1.5">
              {renderFieldIcon(field.key)}
              <span className="text-slate-500">{getLabel(field.key)}</span>
            </div>
            <span className="text-slate-700">{String(field.value)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {/* 字段列表 */}
      {fields.map((field, index) => {
        const isFixed = FIXED_FIELD_KEYS.has(field.key);
        return (
          <div
            key={field.key}
            className="group flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-lg hover:bg-slate-50/80 transition-colors"
          >
            {/* 字段标签 */}
            <div className="min-w-[120px] flex items-center gap-1.5">
              {renderFieldIcon(field.key)}
              <span className="text-sm text-slate-500 truncate" title={field.key}>
                {getLabel(field.key)}
              </span>
              {/* 固定字段标记 */}
              {isFixed && (
                <Lock size={10} className="text-slate-300 flex-shrink-0" title="固定字段，不可删除" />
              )}
            </div>
            
            {/* 字段值 */}
            <input
              type="text"
              value={String(field.value)}
              onChange={(e) => updateFieldValue(index, e.target.value)}
              className="flex-1 text-sm text-slate-700 bg-transparent border-0 border-b border-transparent 
                hover:border-slate-200 focus:border-purple-400 focus:outline-none 
                px-1 py-0.5 transition-colors rounded"
              placeholder="输入值..."
            />
            
            {/* 删除按钮 - 固定字段不可删除 */}
            {isFixed ? (
              <div className="w-6 h-6 flex items-center justify-center" title="固定字段，不可删除">
                <Lock size={12} className="text-slate-200" />
              </div>
            ) : (
              <button
                onClick={() => removeField(index)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 
                  text-slate-300 hover:text-red-500 transition-all"
                title="删除字段"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      })}

      {/* 底部操作栏 */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
        {/* 左侧按钮组 */}
        <div className="flex items-center gap-2">
          {/* 添加字段按钮 */}
          <button
            ref={addFieldButtonRef}
            onClick={openFieldSelector}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-purple-500 
              py-1.5 px-2 rounded-lg hover:bg-purple-50/50 transition-colors"
          >
            <Plus size={14} />
            <span>添加字段</span>
          </button>

          {/* 字段选择器弹窗 - 使用 Portal 渲染到 body，跟随按钮位置 */}
          {showFieldSelector && selectorPosition && createPortal(
            <>
              {/* 遮罩 */}
              <div 
                className="fixed inset-0 z-[100]" 
                onClick={() => setShowFieldSelector(false)}
              />
              {/* 选择器 - 跟随按钮位置 */}
              <div 
                className="fixed z-[101]"
                style={{
                  top: selectorPosition.top,
                  left: selectorPosition.left,
                }}
              >
                <FieldSelector
                  existingKeys={fields.map((f) => f.key)}
                  onSelect={addField}
                  onClose={() => setShowFieldSelector(false)}
                />
              </div>
            </>,
            document.body
          )}

          {/* 存为模板按钮 */}
          {dataType && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-500 
                py-1.5 px-2 rounded-lg hover:bg-amber-50/50 transition-colors"
              title="将当前数据块保存为模板"
            >
              <Save size={14} />
              <span>存为模板</span>
            </button>
          )}
        </div>

        {/* 同步按钮 - 只有有 type 字段且提供了回调时显示 */}
        {dataType && onSyncStructure && (
          <div className="flex items-center gap-2">
            {/* 同步结果提示 */}
            {syncResult && (
              <span className="text-xs flex items-center gap-1 text-green-600">
                <CheckCircle2 size={12} />
                已同步 {syncResult.count} 个数据块
              </span>
            )}
            
            <button
              onClick={handleSyncStructure}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-500 
                py-1.5 px-2 rounded-lg hover:bg-blue-50/50 transition-colors"
              title={`同步字段结构到本文档所有 ${dataType} 类型数据块`}
            >
              <RefreshCw size={14} />
              <span>同步到所有 {dataType}</span>
            </button>
          </div>
        )}
      </div>

      {/* 保存模板对话框 */}
      {dataType && (
        <SaveTemplateDialog
          open={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          dataType={dataType}
          fieldKeys={fieldKeys}
        />
      )}

      {/* 空状态提示 */}
      {fields.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-slate-400 mb-2">暂无数据字段</p>
          <button
            onClick={() => setShowFieldSelector(true)}
            className="text-xs text-purple-500 hover:text-purple-600"
          >
            + 点击添加字段
          </button>
        </div>
      )}
    </div>
  );
}

export default DataBlockEditor;
