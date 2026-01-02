/**
 * SmartDocEditor - 固定键感知的智能文档编辑器
 */

import { useMemo, useCallback, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import {
  Save, X, ChevronDown, ChevronUp,
  FileText, Lock, Loader2, Info, Code, FormInput,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLabels } from '@/providers/LabelProvider';
import yaml from 'js-yaml';

import type { ADLDocument } from './types';
import { FixedKeyField } from './FixedKeyField';
import { useEditorState } from './useEditorState';
import { createFixedKeyConfig } from './fixedKeyConfig';
import { SemanticYamlEditor } from '../semantic-yaml';

export interface SmartDocEditorProps {
  document: ADLDocument | null;
  rawContent: string;
  documentPath: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
}

export function SmartDocEditor({
  document,
  rawContent,
  documentPath,
  onSave,
  onCancel,
}: SmartDocEditorProps) {
  const { getLabel } = useLabels();

  const {
    isSaving, setIsSaving,
    isDirty, setIsDirty,
    showFixedKeys, setShowFixedKeys,
    fixedKeyValues, originalFixedKeyValues,
    documentContent, editor,
    handleFixedKeyChange, buildFrontmatter,
  } = useEditorState({ document, rawContent });

  // 固定键配置
  const fixedKeys = useMemo(
    () => createFixedKeyConfig({ fixedKeyValues, originalFixedKeyValues }),
    [fixedKeyValues, originalFixedKeyValues]
  );

  // 保存处理
  const handleSave = useCallback(async () => {
    if (!document || isSaving) return;
    setIsSaving(true);
    try {
      const fullContent = buildFrontmatter() + '\n' + documentContent;
      await onSave(fullContent);
      setIsDirty(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [document, isSaving, buildFrontmatter, documentContent, onSave, setIsSaving, setIsDirty]);

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
      {/* 顶部工具栏 */}
      <EditorToolbar
        title={docTitle}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onCancel={onCancel}
      />

      {/* 固定键区 */}
      <FixedKeysSection
        fixedKeys={fixedKeys}
        showFixedKeys={showFixedKeys}
        onToggle={() => setShowFixedKeys(!showFixedKeys)}
        onChange={handleFixedKeyChange}
        getLabel={getLabel}
        documentType={String(fixedKeyValues.document_type || 'facts')}
        functionKey={String(fixedKeyValues['atlas.function'] || '')}
      />

      {/* 文档内容区 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <ContentPreview content={documentContent} />
          <RichTextEditor editor={editor} />
        </div>
      </div>

      {/* 底部状态栏 */}
      <StatusBar
        path={documentPath}
        blockCount={document.blocks?.length || 0}
        editableKeyCount={fixedKeys.filter(k => k.editable).length}
      />
    </div>
  );
}

// 工具栏子组件
interface EditorToolbarProps {
  title: string;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

function EditorToolbar({ title, isDirty, isSaving, onSave, onCancel }: EditorToolbarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        {isDirty && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            未保存
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
        >
          <X className="w-4 h-4 inline mr-1" />取消
        </button>
        <button
          onClick={onSave}
          disabled={!isDirty || isSaving}
          className={cn(
            'px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5',
            isDirty ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          )}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

// 固定键区子组件
interface FixedKeysSectionProps {
  fixedKeys: ReturnType<typeof createFixedKeyConfig>;
  showFixedKeys: boolean;
  onToggle: () => void;
  onChange: (key: string, value: unknown) => void;
  getLabel: (key: string) => string;
  documentType: string;
  functionKey: string;
}

function FixedKeysSection({ fixedKeys, showFixedKeys, onToggle, onChange, getLabel, documentType, functionKey }: FixedKeysSectionProps) {
  return (
    <div className="border-b border-slate-100 bg-slate-50/50">
      <button
        onClick={onToggle}
        className="w-full px-6 py-2 flex items-center justify-between text-xs text-slate-500 hover:text-slate-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5" />
          <span>系统元数据（固定键）</span>
          <span className="text-slate-400">· {fixedKeys.length} 项</span>
        </div>
        {showFixedKeys ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showFixedKeys && (
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {fixedKeys.map((item) => (
              <FixedKeyField
                key={item.key}
                item={item}
                onChange={onChange}
                getLabel={getLabel}
                documentType={documentType}
                functionKey={functionKey}
              />
            ))}
          </div>
          <p className="mt-3 text-[10px] text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            标有锁图标的字段由系统自动管理
          </p>
        </div>
      )}
    </div>
  );
}

// 内容预览子组件 - Phase 3.7: YAML 语义化渲染
interface ContentPreviewProps {
  content: string;
  onContentChange?: (newContent: string) => void;
}

interface ContentBlock {
  type: 'heading' | 'yaml' | 'text';
  content: string;
  anchor?: string;
  parsedYaml?: Record<string, unknown>;
}

function parseContentBlocks(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 检测标题（包含锚点）
    const headingMatch = line.match(/^(#+)\s*(.+?)(?:\s*\{#([^}]+)\})?\s*$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        content: line,
        anchor: headingMatch[3],
      });
      i++;
      continue;
    }

    // 检测 YAML 代码块
    if (line.trim() === '```yaml' || line.trim() === '```yml') {
      const yamlLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '```') {
        yamlLines.push(lines[i]);
        i++;
      }
      const yamlContent = yamlLines.join('\n');
      let parsedYaml: Record<string, unknown> | undefined;
      try {
        parsedYaml = yaml.load(yamlContent) as Record<string, unknown>;
      } catch (e) {
        // YAML 解析失败，保持原始内容
      }
      blocks.push({
        type: 'yaml',
        content: yamlContent,
        parsedYaml,
      });
      i++; // 跳过结束的 ```
      continue;
    }

    // 普通文本行
    const textLines: string[] = [line];
    i++;
    while (i < lines.length) {
      const nextLine = lines[i];
      // 如果遇到标题或 YAML 块，停止
      if (nextLine.match(/^#+\s/) || nextLine.trim() === '```yaml' || nextLine.trim() === '```yml') {
        break;
      }
      textLines.push(nextLine);
      i++;
    }
    const textContent = textLines.join('\n').trim();
    if (textContent) {
      blocks.push({
        type: 'text',
        content: textContent,
      });
    }
  }

  return blocks;
}

function ContentPreview({ content, onContentChange }: ContentPreviewProps) {
  const [viewMode, setViewMode] = useState<'semantic' | 'raw'>('semantic');
  const blocks = useMemo(() => parseContentBlocks(content), [content]);

  // 处理 YAML 数据变更
  const handleYamlChange = useCallback((blockIndex: number, newData: Record<string, unknown>) => {
    if (!onContentChange) return;

    // 重建内容
    const newBlocks = [...blocks];
    newBlocks[blockIndex] = {
      ...newBlocks[blockIndex],
      parsedYaml: newData,
      content: yaml.dump(newData, { indent: 2, lineWidth: -1 }).trim(),
    };

    // 序列化回字符串
    const newContent = newBlocks.map(block => {
      if (block.type === 'heading') return block.content;
      if (block.type === 'yaml') return '```yaml\n' + block.content + '\n```';
      return block.content;
    }).join('\n\n');

    onContentChange(newContent);
  }, [blocks, onContentChange]);

  return (
    <div className="px-6 py-4">
      {/* 视图切换 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex-1 mr-4">
          <strong>📝 文档内容编辑区</strong>
          <p className="mt-1 text-xs text-amber-600">
            以下是文档的实际内容（标题 + Machine Zone + Human Zone）
          </p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('semantic')}
            className={cn(
              'px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1.5',
              viewMode === 'semantic' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <FormInput className="w-3.5 h-3.5" />
            语义化
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={cn(
              'px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1.5',
              viewMode === 'raw' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Code className="w-3.5 h-3.5" />
            源码
          </button>
        </div>
      </div>

      {viewMode === 'raw' ? (
        // 原始源码视图
        <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed whitespace-pre-wrap">
          {content || '（空文档）'}
        </pre>
      ) : (
        // 语义化视图
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <ContentBlockRenderer
              key={index}
              block={block}
              onChange={(newData) => handleYamlChange(index, newData)}
            />
          ))}
          {blocks.length === 0 && (
            <div className="text-center py-8 text-slate-400">（空文档）</div>
          )}
        </div>
      )}
    </div>
  );
}

// 内容块渲染器
function ContentBlockRenderer({
  block,
  onChange,
}: {
  block: ContentBlock;
  onChange: (newData: Record<string, unknown>) => void;
}) {
  if (block.type === 'heading') {
    const level = (block.content.match(/^#+/)?.[0].length || 1);
    const text = block.content.replace(/^#+\s*/, '').replace(/\s*\{#[^}]+\}$/, '');
    const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
    
    return (
      <div className="flex items-center gap-2">
        <HeadingTag className={cn(
          'font-bold text-slate-800',
          level === 1 && 'text-2xl',
          level === 2 && 'text-xl',
          level === 3 && 'text-lg',
          level >= 4 && 'text-base'
        )}>
          {text}
        </HeadingTag>
        {block.anchor && (
          <code className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            #{block.anchor}
          </code>
        )}
      </div>
    );
  }

  if (block.type === 'yaml' && block.parsedYaml) {
    return (
      <SemanticYamlEditor
        data={block.parsedYaml}
        entityType={block.parsedYaml.type as string}
        onChange={onChange}
        title={block.parsedYaml.title as string || block.parsedYaml.display_name as string}
        collapsible={true}
        defaultExpanded={true}
      />
    );
  }

  if (block.type === 'yaml') {
    // YAML 解析失败，显示原始代码
    return (
      <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm font-mono">
        {block.content}
      </pre>
    );
  }

  // 普通文本
  if (block.content.trim()) {
    return (
      <div className="prose prose-slate max-w-none text-slate-600">
        {block.content.split('\n').map((line, i) => (
          <p key={i} className="my-1">{line || <br />}</p>
        ))}
      </div>
    );
  }

  return null;
}

// 富文本编辑器子组件
function RichTextEditor({ editor }: { editor: ReturnType<typeof import('@tiptap/react').useEditor> }) {
  return (
    <div className="border-t border-slate-200 mt-4">
      <div className="px-6 py-2 bg-slate-50 text-xs text-slate-500 flex items-center gap-2">
        <FileText className="w-3.5 h-3.5" />
        富文本预览（实验性）
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

// 状态栏子组件
interface StatusBarProps {
  path: string;
  blockCount: number;
  editableKeyCount: number;
}

function StatusBar({ path, blockCount, editableKeyCount }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
      <span className="font-mono">{path}</span>
      <div className="flex items-center gap-3">
        <span>{blockCount} 个 Block</span>
        <span>·</span>
        <span>{editableKeyCount} 个可编辑固定键</span>
      </div>
    </div>
  );
}

export default SmartDocEditor;

