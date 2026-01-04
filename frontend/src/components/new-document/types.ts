/**
 * 新建文档相关类型定义
 */

/** 类型包分类 */
export type PackageCategory = 'business' | 'content' | 'system' | 'custom';

/** 预置数据块 */
export interface PresetBlock {
    id: string;
    name: string;
    description: string;
    required: boolean;
    selected: boolean;
}

/** 类型包信息 */
export interface TypePackageInfo {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    category: PackageCategory;
    isOfficial: boolean;
    blocks: PresetBlock[];
    defaultFunction: string;
    defaultDisplay: string;
    defaultCapabilities: string[];
}

/** 新建文档表单数据 */
export interface NewDocumentFormData {
    title: string;
    typePackage: string;
    savePath: string;
    selectedBlocks: string[];
    defaultDisplay?: string;
}

