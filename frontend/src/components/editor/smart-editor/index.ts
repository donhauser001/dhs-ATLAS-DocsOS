/**
 * SmartDocEditor 模块导出
 */

export { SmartDocEditor, type SmartDocEditorProps } from './SmartDocEditor';
export { VersionSelector } from './VersionSelector';
// 已废弃：文档类型现在由类型包决定，只读显示
// export { DocumentTypeSelector, DOCUMENT_TYPES } from './DocumentTypeSelector';
export { FunctionSelector, ATLAS_FUNCTIONS, TYPE_FUNCTION_MAP, FUNCTION_CAPABILITIES_MAP, getDefaultCapabilities } from './FunctionSelector';
export { FixedKeyField } from './FixedKeyField';
export { CapabilitiesField } from './CapabilitiesField';
export { useEditorState } from './useEditorState';
export { createFixedKeyConfig } from './fixedKeyConfig';
export * from './types';
export * from './version-utils';

