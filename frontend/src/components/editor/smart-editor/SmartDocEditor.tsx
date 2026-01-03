/**
 * SmartDocEditor - Obsidian 风格的智能文档编辑器
 * 灵感来源于 Obsidian 的属性面板和编辑体验
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  Save, X, Loader2, Info, Sparkles, Search, BookOpen,
  Calendar, AlignLeft, Tag, Hash, Zap, User, FileText, Shield,
  Link2, CheckSquare, ChevronDown, ChevronRight, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLabels } from '@/providers/LabelProvider';
import { applyAutoComplete, getMissingFields, type MissingField } from '@/api/auto-complete';
import { CodeMirrorEditor, type CodeMirrorEditorRef } from './CodeMirrorEditor';

import type { ADLDocument } from './types';
import { useEditorState } from './useEditorState';
import { createFixedKeyConfig } from './fixedKeyConfig';
import { VersionSelector } from './VersionSelector';
import { DocumentTypeSelector } from './DocumentTypeSelector';
import { FunctionSelector } from './FunctionSelector';
import { CapabilitiesField } from './CapabilitiesField';

export interface SmartDocEditorProps {
  document: ADLDocument | null;
  rawContent: string;
  documentPath: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
}

// 标签颜色配置
const TAG_COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
];

function getTagColor(index: number) {
  return TAG_COLORS[index % TAG_COLORS.length];
}

export function SmartDocEditor({
  document,
  rawContent,
  documentPath,
  onSave,
  onCancel,
}: SmartDocEditorProps) {
  const { getLabel } = useLabels();
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [autoCompleteMessage, setAutoCompleteMessage] = useState<string | null>(null);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<number | null>(null);
  const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);

  const {
    isSaving, setIsSaving,
    isDirty, setIsDirty,
    showFixedKeys, setShowFixedKeys,
    fixedKeyValues, originalFixedKeyValues,
    documentContent,
    handleFixedKeyChange, handleContentChange, buildFrontmatter,
  } = useEditorState({ document, rawContent });

  // 固定键配置
  const fixedKeys = useMemo(
    () => createFixedKeyConfig({ fixedKeyValues, originalFixedKeyValues }),
    [fixedKeyValues, originalFixedKeyValues]
  );

  // 检测缺失字段
  useEffect(() => {
    if (!documentPath) return;
    
    getMissingFields(documentPath)
      .then(result => {
        setMissingFields(result.missingFields || []);
      })
      .catch(err => {
        console.warn('Failed to get missing fields:', err);
        setMissingFields([]);
      });
  }, [documentPath]);

  // 清除草稿
  const clearDraft = useCallback(() => {
    if (!documentPath) return;
    const draftKey = `atlas-draft-${documentPath}`;
    try {
      localStorage.removeItem(draftKey);
      setShowDraftRecovery(false);
    } catch (e) {
      console.warn('Failed to clear draft:', e);
    }
  }, [documentPath]);

  // 保存处理
  const handleSave = useCallback(async () => {
    if (!document || isSaving) return;
    setIsSaving(true);
    setAutoCompleteMessage(null);
    
    try {
      const fullContent = buildFrontmatter() + '\n' + documentContent;
      await onSave(fullContent);
      
      try {
        const result = await applyAutoComplete(documentPath);
        if (result.changes && result.changes.length > 0) {
          setAutoCompleteMessage(`已自动补齐 ${result.changes.length} 个字段`);
          setTimeout(() => setAutoCompleteMessage(null), 3000);
        }
      } catch (autoCompleteError) {
        console.warn('Auto-complete failed:', autoCompleteError);
      }
      
      setIsDirty(false);
      setMissingFields([]);
      clearDraft();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [document, isSaving, buildFrontmatter, documentContent, documentPath, onSave, setIsSaving, setIsDirty, clearDraft]);

  // 一键补齐处理
  const handleAutoComplete = useCallback(async () => {
    if (!documentPath) return;
    
    try {
      const result = await applyAutoComplete(documentPath);
      if (result.changes && result.changes.length > 0) {
        setAutoCompleteMessage(`已自动补齐 ${result.changes.length} 个字段`);
        setMissingFields([]);
        setTimeout(() => setAutoCompleteMessage(null), 3000);
        window.location.reload();
      }
    } catch (error) {
      console.error('Auto-complete failed:', error);
    }
  }, [documentPath]);

  // 文档标题
  const docTitle = useMemo(() => {
    const block = document?.blocks?.[0];
    return (
      block?.machine?.title as string ||
      block?.machine?.display_name as string ||
      block?.heading?.replace(/^#+\s*/, '').replace(/\s*\{#.*\}$/, '') ||
      documentPath.split('/').pop()?.replace('.md', '') ||
      '未命名文档'
    );
  }, [document, documentPath]);

  // 更新页面标题
  useEffect(() => {
    const originalTitle = window.document.title;
    if (isDirty) {
      window.document.title = `* ${docTitle} - ATLAS DocsOS`;
    } else {
      window.document.title = `${docTitle} - ATLAS DocsOS`;
    }
    return () => {
      window.document.title = originalTitle;
    };
  }, [isDirty, docTitle]);

  // 离开页面确认
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '您有未保存的修改，确定要离开吗？';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // 自动保存草稿
  useEffect(() => {
    if (!documentPath || !isDirty) return;

    const draftKey = `atlas-draft-${documentPath}`;
    const draftContent = buildFrontmatter() + '\n' + documentContent;
    
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({
          content: draftContent,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.warn('Failed to save draft:', e);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [documentPath, isDirty, buildFrontmatter, documentContent]);

  // 检测草稿
  useEffect(() => {
    if (!documentPath) return;
    const draftKey = `atlas-draft-${documentPath}`;
    try {
      const draftData = localStorage.getItem(draftKey);
      if (draftData) {
        const { timestamp } = JSON.parse(draftData);
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setShowDraftRecovery(true);
          setDraftTimestamp(timestamp);
        } else {
          localStorage.removeItem(draftKey);
        }
      }
    } catch (e) {
      console.warn('Failed to check draft:', e);
    }
  }, [documentPath]);

  // 恢复草稿
  const handleRecoverDraft = useCallback(() => {
    if (!documentPath) return;
    window.location.reload();
    setShowDraftRecovery(false);
  }, [documentPath]);

  // 忽略草稿
  const handleIgnoreDraft = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        加载中...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部操作栏 - 简洁风格 */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-slate-400" />
          <h1 className="text-lg font-medium text-slate-800">{docTitle}</h1>
          {isDirty && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              未保存
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5',
              isDirty 
                ? 'bg-violet-600 text-white hover:bg-violet-700' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            )}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 提示条区域 */}
      {showDraftRecovery && (
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <Info className="w-4 h-4" />
            <span>
              检测到未保存的草稿
              {draftTimestamp && ` (${new Date(draftTimestamp).toLocaleString()})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleIgnoreDraft}
              className="px-3 py-1 text-blue-600 text-sm hover:bg-blue-100 rounded-md transition-colors"
            >
              忽略
            </button>
            <button
              onClick={handleRecoverDraft}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              恢复草稿
            </button>
          </div>
        </div>
      )}

      {autoCompleteMessage && (
        <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-100 text-emerald-700 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {autoCompleteMessage}
        </div>
      )}

      {missingFields.length > 0 && (
        <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <Info className="w-4 h-4" />
            <span>
              检测到缺少字段: {missingFields.slice(0, 3).map(f => getLabel(f.key)).join('、')}
              {missingFields.length > 3 && ` 等 ${missingFields.length} 项`}
            </span>
          </div>
          <button
            onClick={handleAutoComplete}
            className="px-3 py-1 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            一键补齐
          </button>
        </div>
      )}

      {/* 主编辑区域 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Obsidian 风格的属性面板 */}
          <ObsidianPropertiesPanel
            fixedKeyValues={fixedKeyValues}
            originalFixedKeyValues={originalFixedKeyValues}
            onFixedKeyChange={handleFixedKeyChange}
            getLabel={getLabel}
            collapsed={propertiesCollapsed}
            onToggleCollapse={() => setPropertiesCollapsed(!propertiesCollapsed)}
          />

          {/* 正文编辑区 */}
          <div className="mt-6">
            <ContentEditor 
              content={documentContent} 
              onChange={handleContentChange} 
              onSave={handleSave} 
            />
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-6 py-2 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-400">
        <span className="font-mono">{documentPath}</span>
        <div className="flex items-center gap-3">
          <span>{document.blocks?.length || 0} 个 Block</span>
          <span className="text-slate-300">·</span>
          <span>⌘S 保存 · ⌘F 搜索</span>
        </div>
      </div>
    </div>
  );
}

// Obsidian 风格的属性面板
interface ObsidianPropertiesPanelProps {
  fixedKeyValues: Record<string, unknown>;
  originalFixedKeyValues: Record<string, unknown>;
  onFixedKeyChange: (key: string, value: unknown) => void;
  getLabel: (key: string) => string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function ObsidianPropertiesPanel({
  fixedKeyValues,
  originalFixedKeyValues,
  onFixedKeyChange,
  getLabel,
  collapsed,
  onToggleCollapse,
}: ObsidianPropertiesPanelProps) {
  const documentType = String(fixedKeyValues.document_type || 'facts');
  const functionKey = String(fixedKeyValues['atlas.function'] || '');

  // 属性配置
  const properties = [
    {
      key: 'version',
      label: '版本',
      icon: <Zap className="w-4 h-4 text-slate-400" />,
      type: 'version' as const,
    },
    {
      key: 'document_type',
      label: '类型',
      icon: <FileText className="w-4 h-4 text-slate-400" />,
      type: 'document_type' as const,
    },
    {
      key: 'created',
      label: '创建时间',
      icon: <Calendar className="w-4 h-4 text-slate-400" />,
      type: 'date' as const,
      readonly: true,
    },
    {
      key: 'updated',
      label: '更新时间',
      icon: <Calendar className="w-4 h-4 text-slate-400" />,
      type: 'date' as const,
      readonly: true,
    },
    {
      key: 'author',
      label: '作者',
      icon: <User className="w-4 h-4 text-slate-400" />,
      type: 'text' as const,
    },
    {
      key: 'atlas.function',
      label: '功能',
      icon: <Shield className="w-4 h-4 text-slate-400" />,
      type: 'function' as const,
    },
    {
      key: 'atlas.capabilities',
      label: '能力',
      icon: <Tag className="w-4 h-4 text-slate-400" />,
      type: 'capabilities' as const,
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      {/* 标题栏 */}
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors rounded-t-lg"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
        <span>笔记属性</span>
      </button>

      {/* 属性列表 */}
      {!collapsed && (
        <div className="px-4 pb-4">
          {properties.map((prop) => (
            <ObsidianPropertyRow
              key={prop.key}
              icon={prop.icon}
              label={prop.label}
              type={prop.type}
              value={fixedKeyValues[prop.key]}
              originalValue={originalFixedKeyValues[prop.key]}
              onChange={(val) => onFixedKeyChange(prop.key, val)}
              readonly={prop.readonly}
              documentType={documentType}
              functionKey={functionKey}
              getLabel={getLabel}
            />
          ))}

          {/* 添加属性按钮 */}
          <button
            className="flex items-center gap-2 mt-3 px-2 py-1.5 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors w-full"
          >
            <Plus className="w-4 h-4" />
            <span>添加笔记属性</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Obsidian 风格的属性行
interface ObsidianPropertyRowProps {
  icon: React.ReactNode;
  label: string;
  type: 'text' | 'date' | 'version' | 'document_type' | 'function' | 'capabilities' | 'tags' | 'checkbox';
  value: unknown;
  originalValue?: unknown;
  onChange: (value: unknown) => void;
  readonly?: boolean;
  documentType?: string;
  functionKey?: string;
  getLabel?: (key: string) => string;
}

function ObsidianPropertyRow({
  icon,
  label,
  type,
  value,
  originalValue,
  onChange,
  readonly = false,
  documentType = 'facts',
  functionKey = '',
  getLabel,
}: ObsidianPropertyRowProps) {
  // 渲染值编辑器
  const renderValueEditor = () => {
    // 只读模式
    if (readonly) {
      if (type === 'date') {
        const dateStr = value ? String(value) : '';
        const formatted = dateStr ? formatDateDisplay(dateStr) : '—';
        return (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatted}</span>
            {dateStr && <Link2 className="w-3 h-3 text-slate-300" />}
          </div>
        );
      }
      return (
        <span className="text-sm text-slate-500">{String(value || '—')}</span>
      );
    }

    // 根据类型渲染不同的编辑器
    switch (type) {
      case 'version':
        return (
          <VersionSelector
            value={String(value || '1.0')}
            originalValue={String(originalValue || '1.0')}
            onChange={onChange}
          />
        );

      case 'document_type':
        return (
          <DocumentTypeSelector
            value={String(value || 'facts')}
            onChange={onChange}
          />
        );

      case 'function':
        return (
          <FunctionSelector
            value={String(value || '')}
            documentType={documentType}
            onChange={onChange}
          />
        );

      case 'capabilities':
        return (
          <CapabilitiesField
            value={String(value || '')}
            functionKey={functionKey}
            documentType={documentType}
            onChange={onChange}
          />
        );

      case 'tags':
        return <TagsEditor value={value} onChange={onChange} />;

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
          />
        );

      case 'date':
        const dateValue = value ? String(value) : '';
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateValue.split('T')[0] || ''}
              onChange={(e) => onChange(e.target.value)}
              className="text-sm bg-transparent border-none outline-none text-slate-800"
            />
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-sm bg-transparent border-none outline-none placeholder:text-slate-300 text-slate-800"
          />
        );
    }
  };

  return (
    <div className="flex items-start py-2.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 -mx-2 px-2 rounded transition-colors">
      {/* 图标 */}
      <div className="flex items-center justify-center w-8 pt-0.5">
        {icon}
      </div>
      
      {/* 标签 */}
      <div className="w-24 shrink-0 pt-0.5">
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      
      {/* 值 */}
      <div className="flex-1 min-w-0">
        {renderValueEditor()}
      </div>
    </div>
  );
}

// 标签编辑器
interface TagsEditorProps {
  value: unknown;
  onChange: (value: string) => void;
}

function TagsEditor({ value, onChange }: TagsEditorProps) {
  const tags = Array.isArray(value) 
    ? value 
    : typeof value === 'string' 
      ? value.split(',').map(s => s.trim()).filter(Boolean)
      : [];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag, idx) => {
        const color = getTagColor(idx);
        return (
          <span
            key={tag}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium',
              color.bg,
              color.text,
              'border',
              color.border
            )}
          >
            {tag}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newTags = tags.filter((_, i) => i !== idx);
                onChange(newTags.join(', '));
              }}
              className="hover:opacity-70 transition-opacity ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        );
      })}
      <input
        type="text"
        placeholder="添加..."
        className="text-sm bg-transparent border-none outline-none w-16 placeholder:text-slate-300"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const input = e.currentTarget;
            const newTag = input.value.trim();
            if (newTag && !tags.includes(newTag)) {
              onChange([...tags, newTag].join(', '));
              input.value = '';
            }
          }
        }}
      />
    </div>
  );
}

// 日期格式化显示
function formatDateDisplay(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

// 内容编辑器
interface ContentEditorProps {
  content: string;
  onChange: (value: string) => void;
  onSave?: () => void;
}

function ContentEditor({ content, onChange, onSave }: ContentEditorProps) {
  const editorRef = React.useRef<CodeMirrorEditorRef>(null);

  const handleOpenSearch = () => {
    editorRef.current?.openSearch();
  };

  return (
    <div>
      {/* 简洁的工具栏 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <AlignLeft className="w-3.5 h-3.5" />
          <span>正文内容</span>
        </div>
        <button
          onClick={handleOpenSearch}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          title="搜索 (⌘F)"
        >
          <Search className="w-3.5 h-3.5" />
          <span>搜索</span>
        </button>
      </div>

      {/* 编辑器 */}
      <div className="rounded-lg overflow-hidden border border-slate-200">
        <CodeMirrorEditor
          ref={editorRef}
          value={content}
          onChange={onChange}
          onSave={onSave}
          className="min-h-[400px]"
        />
      </div>
    </div>
  );
}

export default SmartDocEditor;
