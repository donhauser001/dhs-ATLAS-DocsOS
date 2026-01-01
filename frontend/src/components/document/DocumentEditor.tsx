/**
 * DocumentEditor - 文档编辑态
 * 
 * Phase 3.0: UI 内功
 * 
 * 目标体验：像在填写文档本身
 * 
 * 特点：
 * - 清晰区分可编辑和只读字段
 * - 实时显示已修改字段
 * - 支持撤销/重做
 * - 变更预览
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Save,
  X,
  Undo2,
  Redo2,
  Eye,
  Edit3,
  AlertCircle,
  FileText,
} from 'lucide-react';
import type { ADLDocument, Block, MachineBlock } from '@/types/adl';
import { SemanticFieldRenderer, type FieldSchema } from '@/components/fields/SemanticFieldRenderer';
import { Button } from '@/components/ui/button';
import { useTokenContext } from '@/components/tokens/TokenProvider';

// ============================================================
// 类型定义
// ============================================================

interface DocumentEditorProps {
  /** ADL 文档 */
  document: ADLDocument;
  /** 当前编辑的 Block anchor */
  editingAnchor: string;
  /** 保存回调 */
  onSave: (changes: BlockChanges) => Promise<void>;
  /** 取消回调 */
  onCancel: () => void;
}

interface BlockChanges {
  anchor: string;
  original: MachineBlock;
  modified: MachineBlock;
  changedFields: string[];
}

interface EditHistory {
  past: MachineBlock[];
  present: MachineBlock;
  future: MachineBlock[];
}

// ============================================================
// 主组件
// ============================================================

export function DocumentEditor({
  document,
  editingAnchor,
  onSave,
  onCancel,
}: DocumentEditorProps) {
  // 查找要编辑的 Block
  const block = useMemo(
    () => document.blocks.find((b) => b.anchor === editingAnchor),
    [document, editingAnchor]
  );
  
  if (!block) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12"
        style={{ color: `var(--ui-field-label-color)` }}
      >
        <AlertCircle size={48} className="mb-4" />
        <p>未找到 Block: #{editingAnchor}</p>
      </div>
    );
  }
  
  return (
    <BlockEditor
      block={block}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}

// ============================================================
// Block 编辑器
// ============================================================

interface BlockEditorProps {
  block: Block;
  onSave: (changes: BlockChanges) => Promise<void>;
  onCancel: () => void;
}

function BlockEditor({ block, onSave, onCancel }: BlockEditorProps) {
  const { resolveToken } = useTokenContext();
  
  // 编辑历史（支持撤销/重做）
  const [history, setHistory] = useState<EditHistory>({
    past: [],
    present: { ...block.machine },
    future: [],
  });
  
  // 当前编辑值
  const current = history.present;
  
  // 保存中状态
  const [saving, setSaving] = useState(false);
  
  // 预览模式
  const [previewMode, setPreviewMode] = useState(false);
  
  // 计算已修改的字段
  const changedFields = useMemo(() => {
    const changed: string[] = [];
    const original = block.machine;
    
    for (const key of Object.keys(current)) {
      if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) {
        changed.push(key);
      }
    }
    
    return changed;
  }, [block.machine, current]);
  
  // 是否有未保存的变更
  const hasChanges = changedFields.length > 0;
  
  // 更新字段值
  const handleFieldChange = useCallback((field: string, value: unknown) => {
    setHistory((prev) => ({
      past: [...prev.past, prev.present],
      present: { ...prev.present, [field]: value },
      future: [],
    }));
  }, []);
  
  // 撤销
  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);
  
  // 重做
  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);
  
  // 保存
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave({
        anchor: block.anchor,
        original: block.machine,
        modified: current,
        changedFields,
      });
    } finally {
      setSaving(false);
    }
  }, [block, current, changedFields, onSave]);
  
  // 获取字段 Schema（从类型推断）
  const fieldSchemas = useMemo(() => {
    return inferFieldSchemas(current);
  }, [current]);
  
  // 类型颜色
  const typeColor = resolveToken(`color.type.${current.type}`) || `var(--color-brand-primary)`;
  
  return (
    <div className="block-editor">
      {/* 工具栏 */}
      <div
        className="editor-toolbar flex items-center justify-between p-4 mb-4 rounded-lg"
        style={{
          backgroundColor: `var(--ui-block-header-bg)`,
          border: `1px solid var(--ui-block-header-border)`,
        }}
      >
        <div className="flex items-center gap-3">
          <Edit3 size={20} style={{ color: typeColor }} />
          <div>
            <h3
              className="font-semibold"
              style={{ color: `var(--ui-field-value-color)` }}
            >
              编辑: {block.heading || current.title}
            </h3>
            <span
              className="text-xs font-mono"
              style={{ color: `var(--ui-field-label-color)` }}
            >
              #{block.anchor}
            </span>
          </div>
          
          {hasChanges && (
            <span
              className="px-2 py-1 rounded text-xs"
              style={{
                backgroundColor: `var(--ui-field-changed-bg)`,
                color: `var(--color-status-draft-text)`,
              }}
            >
              {changedFields.length} 处变更
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* 撤销/重做 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={history.past.length === 0}
          >
            <Undo2 size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={history.future.length === 0}
          >
            <Redo2 size={16} />
          </Button>
          
          <div className="w-px h-6 bg-slate-200 mx-2" />
          
          {/* 预览切换 */}
          <Button
            variant={previewMode ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye size={16} className="mr-1" />
            预览
          </Button>
          
          <div className="w-px h-6 bg-slate-200 mx-2" />
          
          {/* 取消 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            <X size={16} className="mr-1" />
            取消
          </Button>
          
          {/* 保存 */}
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            style={{
              backgroundColor: hasChanges ? `var(--color-brand-primary)` : undefined,
            }}
          >
            <Save size={16} className="mr-1" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
      
      {/* 编辑区域 */}
      {previewMode ? (
        <ChangesPreview
          original={block.machine}
          modified={current}
          changedFields={changedFields}
        />
      ) : (
        <div
          className="editor-content p-6 rounded-lg space-y-4"
          style={{
            backgroundColor: `var(--ui-block-body-bg)`,
            border: `1px solid var(--ui-block-body-border)`,
          }}
        >
          {/* 只读字段组 */}
          <FieldGroup title="基本信息（只读）">
            {['type', 'id'].map((field) => (
              <SemanticFieldRenderer
                key={field}
                schema={{
                  name: field,
                  type: 'string',
                  readonly: true,
                  label: fieldLabels[field] || field,
                }}
                value={current[field]}
                editMode={false}
              />
            ))}
          </FieldGroup>
          
          {/* 可编辑字段组 */}
          <FieldGroup title="可编辑字段">
            {fieldSchemas
              .filter((s) => !['type', 'id', '$display', '$constraints', '$meta'].includes(s.name))
              .map((schema) => (
                <SemanticFieldRenderer
                  key={schema.name}
                  schema={schema}
                  value={current[schema.name]}
                  onChange={(v) => handleFieldChange(schema.name, v)}
                  hasChange={changedFields.includes(schema.name)}
                  editMode={true}
                />
              ))}
          </FieldGroup>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 字段组
// ============================================================

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field-group">
      <h4
        className="text-sm font-medium mb-3"
        style={{ color: `var(--ui-field-label-color)` }}
      >
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ============================================================
// 变更预览
// ============================================================

function ChangesPreview({
  original,
  modified,
  changedFields,
}: {
  original: MachineBlock;
  modified: MachineBlock;
  changedFields: string[];
}) {
  if (changedFields.length === 0) {
    return (
      <div
        className="text-center py-12 rounded-lg"
        style={{
          backgroundColor: `var(--ui-block-body-bg)`,
          border: `1px solid var(--ui-block-body-border)`,
          color: `var(--ui-field-label-color)`,
        }}
      >
        <FileText size={48} className="mx-auto mb-4 opacity-50" />
        <p>暂无变更</p>
      </div>
    );
  }
  
  return (
    <div
      className="changes-preview p-6 rounded-lg"
      style={{
        backgroundColor: `var(--ui-block-body-bg)`,
        border: `1px solid var(--ui-block-body-border)`,
      }}
    >
      <h4
        className="text-sm font-medium mb-4"
        style={{ color: `var(--ui-field-label-color)` }}
      >
        变更预览（共 {changedFields.length} 处）
      </h4>
      
      <div className="space-y-3">
        {changedFields.map((field) => (
          <div
            key={field}
            className="change-item p-3 rounded"
            style={{
              backgroundColor: `var(--ui-field-changed-bg)`,
              border: `1px solid var(--ui-field-changed-border)`,
            }}
          >
            <div
              className="text-xs font-medium mb-2"
              style={{ color: `var(--color-status-draft-text)` }}
            >
              {fieldLabels[field] || field}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span
                  className="text-xs"
                  style={{ color: `var(--ui-field-label-color)` }}
                >
                  修改前
                </span>
                <div
                  className="mt-1 p-2 rounded"
                  style={{
                    backgroundColor: `var(--ui-proposal-diff-removed-bg)`,
                    color: `var(--ui-field-value-color)`,
                  }}
                >
                  {formatValue(original[field])}
                </div>
              </div>
              
              <div>
                <span
                  className="text-xs"
                  style={{ color: `var(--ui-field-label-color)` }}
                >
                  修改后
                </span>
                <div
                  className="mt-1 p-2 rounded"
                  style={{
                    backgroundColor: `var(--ui-proposal-diff-added-bg)`,
                    color: `var(--ui-field-value-color)`,
                  }}
                >
                  {formatValue(modified[field])}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 辅助函数
// ============================================================

const fieldLabels: Record<string, string> = {
  type: '类型',
  id: '标识',
  status: '状态',
  title: '标题',
  category: '分类',
  description: '描述',
  price: '价格',
  tags: '标签',
};

function inferFieldSchemas(machine: MachineBlock): FieldSchema[] {
  const schemas: FieldSchema[] = [];
  
  for (const [key, value] of Object.entries(machine)) {
    // 跳过系统字段
    if (key.startsWith('$')) continue;
    
    let type: FieldSchema['type'] = 'string';
    let options: string[] | undefined;
    
    // 推断类型
    if (key === 'status') {
      type = 'enum';
      options = ['active', 'draft', 'archived'];
    } else if (typeof value === 'number') {
      type = 'number';
    } else if (typeof value === 'boolean') {
      type = 'boolean';
    } else if (Array.isArray(value)) {
      type = 'array';
    } else if (typeof value === 'object' && value !== null) {
      if ('ref' in value) {
        type = 'ref';
      } else if ('token' in value) {
        type = 'token';
      } else {
        type = 'object';
      }
    }
    
    schemas.push({
      name: key,
      type,
      options,
      label: fieldLabels[key] || key,
      readonly: key === 'type' || key === 'id',
    });
  }
  
  return schemas;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  
  return String(value);
}

export default DocumentEditor;

