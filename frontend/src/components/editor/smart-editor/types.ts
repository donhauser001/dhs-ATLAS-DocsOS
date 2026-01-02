/**
 * SmartDocEditor 共享类型定义
 */

import type { ReactNode } from 'react';

// 从统一类型定义导入
export type { ADLDocument, Block, MachineBlock, Frontmatter } from '@/types/adl';
import type { ADLDocument } from '@/types/adl';

// 输入类型枚举
export type InputType = 'text' | 'select' | 'tags' | 'version' | 'document_type' | 'function' | 'capabilities';

// 固定键分类
export type FixedKeyCategory = 'metadata' | 'function';

// 固定键项目接口
export interface FixedKeyItem {
  key: string;
  label: string;
  value: unknown;
  originalValue: unknown;
  icon: ReactNode;
  category: FixedKeyCategory;
  editable: boolean;
  inputType: InputType;
  options?: string[];
}

// 解析后的版本号
export interface ParsedVersion {
  major: number;
  minor: number;
  patch?: number;
  raw: string;
}

// 文档类型定义
export interface DocumentTypeItem {
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  examples: string;
}

// 功能类型定义
export interface FunctionTypeItem {
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  examples: string;
}

// 颜色样式映射
export interface ColorClasses {
  bg: string;
  hover: string;
  icon?: string;
  text?: string;
}

// 编辑器 Props
export interface SmartDocEditorProps {
  document: ADLDocument | null;
  rawContent: string;
  documentPath: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
}

