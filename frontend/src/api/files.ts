/**
 * 文件管理 API 客户端 - Phase 3.9
 */

const API_BASE = '/api/files';

// ============================================================
// 类型定义
// ============================================================

export interface FileInfo {
    name: string;
    path: string;
    type: 'file' | 'folder';
    size?: number;
    mimeType?: string;
    extension?: string;
    createdAt?: string;
    modifiedAt?: string;
}

export interface FolderNode {
    name: string;
    path: string;
    children?: FolderNode[];
}

export interface UploadResult {
    uploaded: FileInfo[];
    failed: Array<{ name: string; error: string }>;
}

// ============================================================
// 目录操作
// ============================================================

/**
 * 获取目录树
 */
export async function getFolderTree(): Promise<FolderNode> {
    const res = await fetch(`${API_BASE}/folders`, {
        credentials: 'include',
    });
    if (!res.ok) {
        throw new Error('获取目录树失败');
    }
    const data = await res.json();
    return data.data;
}

/**
 * 创建文件夹
 */
export async function createFolder(path: string): Promise<void> {
    const res = await fetch(`${API_BASE}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ path }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '创建文件夹失败');
    }
}

/**
 * 删除文件夹
 */
export async function deleteFolder(path: string, force: boolean = false): Promise<void> {
    const params = new URLSearchParams({ path });
    if (force) params.append('force', 'true');

    const res = await fetch(`${API_BASE}/folders?${params}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除文件夹失败');
    }
}

// ============================================================
// 文件列表
// ============================================================

/**
 * 列出目录内容
 */
export async function listDirectory(path: string = '/'): Promise<FileInfo[]> {
    const params = new URLSearchParams({ path });
    const res = await fetch(`${API_BASE}/list?${params}`, {
        credentials: 'include',
    });
    if (!res.ok) {
        throw new Error('列出目录内容失败');
    }
    const data = await res.json();
    return data.data;
}

// ============================================================
// 文件上传
// ============================================================

/**
 * 上传单个文件
 */
export async function uploadFile(
    file: File,
    path: string = '/',
    onProgress?: (progress: number) => void
): Promise<FileInfo> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                resolve(data.data);
            } else {
                try {
                    const data = JSON.parse(xhr.responseText);
                    reject(new Error(data.error || '上传失败'));
                } catch {
                    reject(new Error('上传失败'));
                }
            }
        });

        xhr.addEventListener('error', () => reject(new Error('网络错误')));
        xhr.addEventListener('abort', () => reject(new Error('上传已取消')));

        const params = new URLSearchParams({ path });
        xhr.open('POST', `${API_BASE}/upload?${params}`);
        xhr.withCredentials = true;
        xhr.send(formData);
    });
}

/**
 * 批量上传文件
 */
export async function uploadFiles(
    files: File[],
    path: string = '/',
    onProgress?: (fileIndex: number, progress: number) => void
): Promise<UploadResult> {
    const uploaded: FileInfo[] = [];
    const failed: Array<{ name: string; error: string }> = [];

    for (let i = 0; i < files.length; i++) {
        try {
            const result = await uploadFile(
                files[i],
                path,
                (progress) => onProgress?.(i, progress)
            );
            uploaded.push(result);
        } catch (err) {
            failed.push({
                name: files[i].name,
                error: err instanceof Error ? err.message : '上传失败',
            });
        }
    }

    return { uploaded, failed };
}

// ============================================================
// 文件操作
// ============================================================

/**
 * 获取文件下载 URL
 */
export function getDownloadUrl(path: string): string {
    const params = new URLSearchParams({ path });
    return `${API_BASE}/download?${params}`;
}

/**
 * 获取文件预览 URL
 */
export function getPreviewUrl(path: string): string {
    const params = new URLSearchParams({ path });
    return `${API_BASE}/preview?${params}`;
}

/**
 * 获取文件信息
 */
export async function getFileInfo(path: string): Promise<FileInfo> {
    const params = new URLSearchParams({ path });
    const res = await fetch(`${API_BASE}/info?${params}`, {
        credentials: 'include',
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '获取文件信息失败');
    }
    const data = await res.json();
    return data.data;
}

/**
 * 删除文件
 */
export async function deleteFile(path: string): Promise<void> {
    const params = new URLSearchParams({ path });
    const res = await fetch(`${API_BASE}/file?${params}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除文件失败');
    }
}

/**
 * 重命名文件或文件夹
 */
export async function rename(path: string, newName: string): Promise<string> {
    const res = await fetch(`${API_BASE}/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ path, newName }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '重命名失败');
    }
    const data = await res.json();
    return data.data.newPath;
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * 获取文件类型图标名称
 */
export function getFileIconName(extension?: string): string {
    if (!extension) return 'file';

    const iconMap: Record<string, string> = {
        // 文档
        'pdf': 'file-text',
        'doc': 'file-text',
        'docx': 'file-text',
        'xls': 'file-spreadsheet',
        'xlsx': 'file-spreadsheet',
        'ppt': 'file-presentation',
        'pptx': 'file-presentation',
        'txt': 'file-text',
        'md': 'file-text',
        'csv': 'file-spreadsheet',
        // 图片
        'jpg': 'image',
        'jpeg': 'image',
        'png': 'image',
        'gif': 'image',
        'webp': 'image',
        'svg': 'image',
        // 音视频
        'mp3': 'music',
        'wav': 'music',
        'mp4': 'video',
        'webm': 'video',
        'mov': 'video',
        // 压缩包
        'zip': 'archive',
        'rar': 'archive',
        '7z': 'archive',
    };

    return iconMap[extension.toLowerCase()] || 'file';
}

/**
 * 判断是否为图片
 */
export function isImage(extension?: string): boolean {
    if (!extension) return false;
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension.toLowerCase());
}

/**
 * 判断是否为视频
 */
export function isVideo(extension?: string): boolean {
    if (!extension) return false;
    return ['mp4', 'webm', 'mov'].includes(extension.toLowerCase());
}

/**
 * 判断是否为音频
 */
export function isAudio(extension?: string): boolean {
    if (!extension) return false;
    return ['mp3', 'wav', 'ogg'].includes(extension.toLowerCase());
}

