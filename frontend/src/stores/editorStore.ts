/**
 * Editor Store - 编辑器状态管理
 * 
 * Phase 3.5: 智能编辑器
 * 
 * 职责：
 * 1. 管理文档编辑状态
 * 2. 管理视图模式（阅读/表单/编辑）
 * 3. 跟踪缺失字段和自动补齐
 * 4. 管理 dirty 状态和保存流程
 */

import { create } from 'zustand';
import type { ADLDocument } from '@/api/adl';

// ============================================================
// 类型定义
// ============================================================

/**
 * 视图模式
 */
export type ViewMode = 'read' | 'form' | 'editor';

/**
 * 缺失字段信息
 */
export interface MissingField {
  key: string;
  label: string;
  suggestedValue: unknown;
  reason: string;
  category: 'structural' | 'metadata' | 'function';
  blockAnchor?: string;
}

/**
 * Lint 错误
 */
export interface LintError {
  level: 'error' | 'warning';
  rule: string;
  message: string;
  location?: {
    block?: string;
    field?: string;
    line?: number;
  };
}

/**
 * 编辑器状态
 */
export interface EditorState {
  // === 文档状态 ===
  /** 当前文档 */
  document: ADLDocument | null;
  /** 原始 Markdown 内容 */
  rawContent: string;
  /** 文档路径 */
  documentPath: string | null;
  
  // === 编辑状态 ===
  /** 是否有未保存的修改 */
  isDirty: boolean;
  /** 当前视图模式 */
  viewMode: ViewMode;
  /** 编辑器内容（可能与原始内容不同） */
  editorContent: string;
  
  // === 自动补齐 ===
  /** 缺失字段列表 */
  missingFields: MissingField[];
  /** 是否启用自动补齐 */
  autoCompleteEnabled: boolean;
  
  // === 校验 ===
  /** Lint 错误 */
  lintErrors: LintError[];
  /** 是否正在校验 */
  isValidating: boolean;
  
  // === 保存状态 ===
  /** 是否正在保存 */
  isSaving: boolean;
  /** 最后保存时间 */
  lastSavedAt: Date | null;
  /** 保存错误 */
  saveError: string | null;
  
  // === Actions ===
  /** 设置文档 */
  setDocument: (doc: ADLDocument | null, path?: string) => void;
  /** 设置原始内容 */
  setRawContent: (content: string) => void;
  /** 设置编辑器内容 */
  setEditorContent: (content: string) => void;
  /** 设置视图模式 */
  setViewMode: (mode: ViewMode) => void;
  /** 设置缺失字段 */
  setMissingFields: (fields: MissingField[]) => void;
  /** 设置 Lint 错误 */
  setLintErrors: (errors: LintError[]) => void;
  /** 标记为 dirty */
  markDirty: () => void;
  /** 标记为已保存 */
  markSaved: () => void;
  /** 重置编辑器状态 */
  reset: () => void;
  /** 开始保存 */
  startSaving: () => void;
  /** 完成保存 */
  finishSaving: (error?: string) => void;
  /** 切换自动补齐 */
  toggleAutoComplete: () => void;
}

// ============================================================
// 初始状态
// ============================================================

const initialState = {
  document: null,
  rawContent: '',
  documentPath: null,
  isDirty: false,
  viewMode: 'read' as ViewMode,
  editorContent: '',
  missingFields: [],
  autoCompleteEnabled: true,
  lintErrors: [],
  isValidating: false,
  isSaving: false,
  lastSavedAt: null,
  saveError: null,
};

// ============================================================
// Store 实现
// ============================================================

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,
  
  setDocument: (doc, path) => {
    set({
      document: doc,
      documentPath: path || get().documentPath,
      isDirty: false,
      lintErrors: [],
      missingFields: [],
    });
  },
  
  setRawContent: (content) => {
    set({
      rawContent: content,
      editorContent: content,
      isDirty: false,
    });
  },
  
  setEditorContent: (content) => {
    const { rawContent } = get();
    set({
      editorContent: content,
      isDirty: content !== rawContent,
    });
  },
  
  setViewMode: (mode) => {
    set({ viewMode: mode });
  },
  
  setMissingFields: (fields) => {
    set({ missingFields: fields });
  },
  
  setLintErrors: (errors) => {
    set({ lintErrors: errors });
  },
  
  markDirty: () => {
    set({ isDirty: true });
  },
  
  markSaved: () => {
    const { editorContent } = get();
    set({
      isDirty: false,
      rawContent: editorContent,
      lastSavedAt: new Date(),
      saveError: null,
    });
  },
  
  reset: () => {
    set(initialState);
  },
  
  startSaving: () => {
    set({ isSaving: true, saveError: null });
  },
  
  finishSaving: (error) => {
    if (error) {
      set({ isSaving: false, saveError: error });
    } else {
      const { editorContent } = get();
      set({
        isSaving: false,
        isDirty: false,
        rawContent: editorContent,
        lastSavedAt: new Date(),
        saveError: null,
      });
    }
  },
  
  toggleAutoComplete: () => {
    set(state => ({ autoCompleteEnabled: !state.autoCompleteEnabled }));
  },
}));

// ============================================================
// Hooks
// ============================================================

/**
 * 获取编辑状态
 */
export function useEditorState() {
  return useEditorStore(state => ({
    document: state.document,
    rawContent: state.rawContent,
    editorContent: state.editorContent,
    documentPath: state.documentPath,
    isDirty: state.isDirty,
    viewMode: state.viewMode,
  }));
}

/**
 * 获取自动补齐状态
 */
export function useAutoCompleteState() {
  return useEditorStore(state => ({
    missingFields: state.missingFields,
    autoCompleteEnabled: state.autoCompleteEnabled,
    toggleAutoComplete: state.toggleAutoComplete,
    setMissingFields: state.setMissingFields,
  }));
}

/**
 * 获取校验状态
 */
export function useLintState() {
  return useEditorStore(state => ({
    lintErrors: state.lintErrors,
    isValidating: state.isValidating,
    setLintErrors: state.setLintErrors,
  }));
}

/**
 * 获取保存状态
 */
export function useSaveState() {
  return useEditorStore(state => ({
    isSaving: state.isSaving,
    lastSavedAt: state.lastSavedAt,
    saveError: state.saveError,
    startSaving: state.startSaving,
    finishSaving: state.finishSaving,
    markSaved: state.markSaved,
  }));
}

