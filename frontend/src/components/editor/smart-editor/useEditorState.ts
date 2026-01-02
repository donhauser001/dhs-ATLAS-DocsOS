/**
 * 编辑器状态 Hook
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import type { ADLDocument } from './types';
import { getDefaultCapabilities, TYPE_FUNCTION_MAP } from './FunctionSelector';

const lowlight = createLowlight(common);

interface UseEditorStateProps {
  document: ADLDocument | null;
  rawContent: string;
}

export function useEditorState({ document, rawContent }: UseEditorStateProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showFixedKeys, setShowFixedKeys] = useState(true);
  const [fixedKeyValues, setFixedKeyValues] = useState<Record<string, unknown>>({});
  const [originalFixedKeyValues, setOriginalFixedKeyValues] = useState<Record<string, unknown>>({});

  // 初始化固定键值
  useEffect(() => {
    if (document?.frontmatter) {
      const fm = document.frontmatter;
      const atlas = fm.atlas as Record<string, unknown> | undefined;

      const initialValues = {
        version: fm.version || '1.0',
        document_type: fm.document_type || 'facts',
        author: fm.author || '',
        created: fm.created || '',
        updated: fm.updated || '',
        'atlas.function': atlas?.function || '',
        'atlas.capabilities': Array.isArray(atlas?.capabilities)
          ? atlas.capabilities.join(', ')
          : '',
      };

      setFixedKeyValues(initialValues);
      setOriginalFixedKeyValues(initialValues);
    }
  }, [document]);

  // 文档内容状态（去掉 frontmatter）
  const [documentContent, setDocumentContent] = useState('');

  // 初始化文档内容
  useEffect(() => {
    if (!rawContent) {
      setDocumentContent('');
      return;
    }
    const match = rawContent.match(/^---\n[\s\S]*?\n---\n*/);
    setDocumentContent(match ? rawContent.slice(match[0].length) : rawContent);
  }, [rawContent]);

  // 富文本编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'yaml' }),
      Placeholder.configure({ placeholder: '开始编写文档内容...' }),
    ],
    content: documentContent,
    onUpdate: () => setIsDirty(true),
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[400px] px-6 py-4',
      },
    },
  });

  // 初始化编辑器内容
  useEffect(() => {
    if (editor && documentContent) {
      editor.commands.setContent(documentContent);
      setIsDirty(false);
    }
  }, [editor, documentContent]);

  // 更新固定键值
  const handleFixedKeyChange = useCallback((key: string, value: unknown) => {
    setFixedKeyValues(prev => {
      const newValues = { ...prev, [key]: value };

      // 功能变化时自动更新能力
      if (key === 'atlas.function') {
        const functionKey = String(value || '');
        const defaultCaps = getDefaultCapabilities(functionKey);
        // 只有当能力为空或用户刚切换功能时才自动填充
        if (defaultCaps.length > 0) {
          newValues['atlas.capabilities'] = defaultCaps.join(', ');
        } else {
          newValues['atlas.capabilities'] = '';
        }
      }

      // 文档类型变化时，如果新类型不支持当前功能，则清空功能
      if (key === 'document_type') {
        const newType = String(value || 'facts');
        const allowedFunctions = TYPE_FUNCTION_MAP[newType];
        const currentFunction = String(prev['atlas.function'] || '');

        if (allowedFunctions !== undefined) {
          // 如果新类型没有可用功能或当前功能不在允许列表中
          if (allowedFunctions.length === 0 || !allowedFunctions.includes(currentFunction)) {
            newValues['atlas.function'] = allowedFunctions[0] || '';
            // 同时更新能力
            const newFunctionKey = allowedFunctions[0] || '';
            const defaultCaps = getDefaultCapabilities(newFunctionKey);
            newValues['atlas.capabilities'] = defaultCaps.join(', ');
          }
        }
      }

      return newValues;
    });
    setIsDirty(true);
  }, []);

  // 构建 frontmatter
  const buildFrontmatter = useCallback(() => {
    const lines = ['---'];
    lines.push(`version: "${fixedKeyValues.version || '1.0'}"`);
    lines.push(`document_type: ${fixedKeyValues.document_type || 'facts'}`);
    if (fixedKeyValues.created) lines.push(`created: ${fixedKeyValues.created}`);
    lines.push(`updated: ${new Date().toISOString()}`);
    if (fixedKeyValues.author) lines.push(`author: ${fixedKeyValues.author}`);

    const atlasFunction = fixedKeyValues['atlas.function'];
    const atlasCapabilities = fixedKeyValues['atlas.capabilities'];

    if (atlasFunction || atlasCapabilities) {
      lines.push('atlas:');
      if (atlasFunction) lines.push(`  function: ${atlasFunction}`);
      if (atlasCapabilities) {
        const caps = String(atlasCapabilities).split(',').map(s => s.trim()).filter(Boolean);
        if (caps.length > 0) lines.push(`  capabilities: [${caps.join(', ')}]`);
      }
      const originalAtlas = document?.frontmatter?.atlas as Record<string, unknown> | undefined;
      if (originalAtlas?.navigation) {
        lines.push('  navigation:');
        const nav = originalAtlas.navigation as Record<string, unknown>;
        for (const [k, v] of Object.entries(nav)) {
          lines.push(`    ${k}: ${v}`);
        }
      }
    }

    lines.push('---');
    return lines.join('\n');
  }, [fixedKeyValues, document]);

  // 处理内容变化
  const handleContentChange = useCallback((newContent: string) => {
    setDocumentContent(newContent);
    setIsDirty(true);
  }, []);

  return {
    // 状态
    isSaving,
    setIsSaving,
    isDirty,
    setIsDirty,
    showFixedKeys,
    setShowFixedKeys,
    fixedKeyValues,
    originalFixedKeyValues,
    documentContent,
    editor,
    // 方法
    handleFixedKeyChange,
    handleContentChange,
    buildFrontmatter,
  };
}

