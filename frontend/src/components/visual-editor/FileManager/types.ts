/**
 * FileManager 类型定义 - Phase 3.9
 */

// 重导出 API 类型
export type { FileInfo, FolderNode } from '@/api/files';

/**
 * 文件引用（存储在文档中的数据）
 */
export interface FileReference {
    /** 文件路径 */
    path: string;
    /** 显示名称 */
    name: string;
    /** 文件大小 (bytes) */
    size?: number;
    /** MIME 类型 */
    mimeType?: string;
    /** 文件扩展名 */
    extension?: string;
    /** 上传时间 */
    uploadedAt?: string;
}

/**
 * 文件管理器对话框 Props
 */
export interface FileManagerDialogProps {
    /** 是否打开 */
    open: boolean;
    /** 关闭回调 */
    onClose: () => void;
    /** 选择文件回调（多选模式返回数组） */
    onSelect: (files: FileReference | FileReference[]) => void;
    /** 初始目录路径 */
    initialPath?: string;
    /** 允许的文件类型（扩展名数组，空表示全部） */
    allowedTypes?: string[];
    /** 对话框标题 */
    title?: string;
    /** 限制在指定目录（隐藏目录树，不允许切换目录） */
    restrictToPath?: boolean;
    /** 是否多选模式 */
    multiple?: boolean;
    /** 最大选择数量（仅多选模式有效，undefined 表示不限制） */
    maxSelect?: number;
    /** 已禁用的文件路径（已选择的文件，防止重复选择） */
    disabledPaths?: string[];
}

/**
 * 目录树 Props
 */
export interface FolderTreeProps {
    /** 当前选中的路径 */
    selectedPath: string;
    /** 选中路径回调 */
    onSelect: (path: string) => void;
    /** 创建文件夹回调 */
    onCreateFolder?: (parentPath: string) => void;
    /** 删除文件夹回调 */
    onDeleteFolder?: (path: string) => void;
}

/**
 * 文件列表 Props
 */
export interface FileListProps {
    /** 当前目录路径 */
    currentPath: string;
    /** 选中的文件（多选模式为数组） */
    selectedFiles: FileReference[];
    /** 选中文件回调 */
    onSelectFile: (file: FileReference, selected: boolean) => void;
    /** 双击文件回调（确认选择） */
    onConfirmFile: (file: FileReference) => void;
    /** 进入文件夹回调（undefined 时隐藏文件夹） */
    onEnterFolder?: (path: string) => void;
    /** 删除文件回调 */
    onDeleteFile?: (path: string) => void;
    /** 重命名回调 */
    onRename?: (path: string, newName: string) => void;
    /** 允许的文件类型 */
    allowedTypes?: string[];
    /** 是否多选模式 */
    multiple?: boolean;
    /** 最大选择数量 */
    maxSelect?: number;
    /** 已禁用的文件路径（已选择的文件，防止重复选择） */
    disabledPaths?: string[];
}

/**
 * 文件上传器 Props
 */
export interface FileUploaderProps {
    /** 当前上传目录 */
    currentPath: string;
    /** 上传完成回调 */
    onUploadComplete: () => void;
    /** 允许的文件类型 */
    allowedTypes?: string[];
    /** 是否显示拖放区域 */
    showDropzone?: boolean;
}

/**
 * 上传进度
 */
export interface UploadProgress {
    fileName: string;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

/**
 * 文件预览 Props
 */
export interface FilePreviewProps {
    /** 文件信息 */
    file: FileReference;
    /** 关闭回调 */
    onClose: () => void;
}

/**
 * 文件卡片 Props（用于文档内渲染）
 */
export interface FileCardProps {
    /** 文件引用 */
    file: FileReference;
    /** 是否只读 */
    readOnly?: boolean;
    /** 替换文件回调 */
    onReplace?: () => void;
    /** 删除回调 */
    onDelete?: () => void;
}

/**
 * 视图模式
 */
export type ViewMode = 'grid' | 'list';

/**
 * 排序方式
 */
export type SortBy = 'name' | 'size' | 'date' | 'type';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
    by: SortBy;
    order: SortOrder;
}

