/**
 * ScenarioViewSelector - 场景化视图选择器
 * 
 * 根据功能声明选择合适的视图组件
 */

import { useMemo } from 'react';
import { FunctionViewRegistry, ViewModeConfig } from '@/registry';
import type { ViewMode, ViewProps, ADLDocument } from '@/registry/types';

interface ScenarioViewSelectorProps {
  /** 文档数据 */
  document: ADLDocument;
  /** 当前视图模式 */
  viewMode: ViewMode;
  /** 默认阅读视图组件 */
  DefaultReadView: React.ComponentType<ViewProps>;
  /** 默认表单视图组件 */
  DefaultFormView: React.ComponentType<ViewProps>;
  /** 默认MD编辑视图组件 */
  DefaultMDView: React.ComponentType<ViewProps>;
  /** 视图属性 */
  viewProps: Omit<ViewProps, 'document'>;
}

/**
 * 从文档获取功能标识
 */
function getDocumentFunction(doc: ADLDocument): string | undefined {
  const atlas = doc.frontmatter?.atlas as Record<string, unknown> | undefined;
  return atlas?.function as string | undefined;
}

/**
 * 从文档获取文档类型
 */
function getDocumentType(doc: ADLDocument): string | undefined {
  return doc.frontmatter?.document_type as string | undefined;
}

/**
 * 获取视图模式配置的 key（优先使用 function，其次使用 document_type）
 */
function getViewModeKey(doc: ADLDocument): string | undefined {
  // 优先使用 function
  const fn = getDocumentFunction(doc);
  if (fn) return fn;
  
  // 其次使用 document_type
  const docType = getDocumentType(doc);
  if (docType) return docType;
  
  return undefined;
}

/**
 * 场景化视图选择器
 */
export function ScenarioViewSelector({
  document,
  viewMode,
  DefaultReadView,
  DefaultFormView,
  DefaultMDView,
  viewProps,
}: ScenarioViewSelectorProps) {
  // 获取功能标识
  const fn = getDocumentFunction(document);

  // 获取视图组件
  const ViewComponent = useMemo(() => {
    if (!fn) {
      // 无功能声明，使用默认视图
      switch (viewMode) {
        case 'read': return DefaultReadView;
        case 'form': return DefaultFormView;
        case 'md': return DefaultMDView;
      }
    }

    // 尝试从注册表获取专属视图
    const registeredView = FunctionViewRegistry.getViewComponent(fn, viewMode);
    if (registeredView) {
      return registeredView;
    }

    // 回退到默认视图
    switch (viewMode) {
      case 'read': return DefaultReadView;
      case 'form': return DefaultFormView;
      case 'md': return DefaultMDView;
    }
  }, [fn, viewMode, DefaultReadView, DefaultFormView, DefaultMDView]);

  return <ViewComponent document={document} {...viewProps} />;
}

/**
 * 获取功能的视图模式配置
 * 
 * 优先使用 atlas.function，其次使用 document_type
 */
export function useViewModeConfig(doc: ADLDocument | null) {
  return useMemo(() => {
    const key = doc ? getViewModeKey(doc) : undefined;
    
    if (!key) {
      return {
        availableModes: ['read', 'form', 'md'] as ViewMode[],
        defaultMode: 'read' as ViewMode,
        getModeLabel: (mode: ViewMode) => {
          const labels: Record<ViewMode, string> = {
            read: '阅读',
            form: '表单',
            md: 'MD编辑',
          };
          return labels[mode];
        },
      };
    }

    return {
      availableModes: ViewModeConfig.getAvailableModes(key),
      defaultMode: ViewModeConfig.getDefaultMode(key),
      getModeLabel: (mode: ViewMode) => ViewModeConfig.getModeLabel(key, mode),
    };
  }, [doc]);
}

/**
 * 获取功能的操作配置
 */
export function useActionConfig(doc: ADLDocument | null) {
  return useMemo(() => {
    if (!doc) return [];

    const fn = getDocumentFunction(doc);
    if (!fn) return [];

    // 获取能力列表
    const atlas = doc.frontmatter?.atlas as Record<string, unknown> | undefined;
    const capabilities = atlas?.capabilities;
    const capList = typeof capabilities === 'string'
      ? capabilities.split(',').map(s => s.trim())
      : Array.isArray(capabilities)
        ? capabilities
        : [];

    // 获取可用操作
    return FunctionViewRegistry.getAvailableActions(fn, capList);
  }, [doc]);
}

export default ScenarioViewSelector;

