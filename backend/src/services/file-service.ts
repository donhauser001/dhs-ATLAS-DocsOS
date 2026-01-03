/**
 * 文件服务 - Phase 3.9
 * 
 * 提供文件和目录的 CRUD 操作
 */

import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

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

// ============================================================
// 常量
// ============================================================

/** 允许上传的文件类型 */
const ALLOWED_EXTENSIONS = new Set([
    // 文档
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'csv',
    // 图片
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico',
    // 音视频
    'mp3', 'wav', 'ogg', 'mp4', 'webm', 'mov',
    // 压缩包
    'zip', 'rar', '7z', 'tar', 'gz',
]);

/** 禁止上传的文件类型 */
const BLOCKED_EXTENSIONS = new Set([
    'exe', 'bat', 'sh', 'cmd', 'com', 'msi',
    'dll', 'so', 'dylib',
    'js', 'ts', 'py', 'rb', 'php',
]);

/** 最大文件大小 (50MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** MIME 类型映射 */
const MIME_TYPES: Record<string, string> = {
    // 文档
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'csv': 'text/csv',
    // 图片
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    // 音视频
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    // 压缩包
    'zip': 'application/zip',
    'rar': 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
};

// ============================================================
// 工具函数
// ============================================================

/**
 * 获取文件存储根目录的绝对路径（直接使用 repository 目录）
 */
export function getFilesRoot(): string {
    return config.repositoryRoot;
}

/**
 * 确保文件存储目录存在（repository 目录应该已存在）
 */
export function ensureFilesDir(): void {
    const filesRoot = getFilesRoot();
    if (!fs.existsSync(filesRoot)) {
        fs.mkdirSync(filesRoot, { recursive: true });
    }
}

/** 需要隐藏的目录（系统目录） */
const HIDDEN_DIRS = new Set(['.atlas', '.git', 'node_modules']);

/**
 * 验证并规范化路径，防止路径遍历攻击
 */
export function getSafePath(relativePath: string): string | null {
    // 移除前导斜杠
    const cleanPath = relativePath.replace(/^\/+/, '');

    // 检查是否包含 ..
    if (cleanPath.includes('..')) {
        return null;
    }

    // 构建完整路径
    const fullPath = path.join(getFilesRoot(), cleanPath);

    // 确保路径在文件存储目录内
    const filesRoot = getFilesRoot();
    if (!fullPath.startsWith(filesRoot)) {
        return null;
    }

    return fullPath;
}

/**
 * 消毒文件名，移除危险字符
 */
export function sanitizeFileName(fileName: string): string {
    return fileName
        .replace(/[<>:"/\\|?*]/g, '_')  // 移除 Windows 不允许的字符
        .replace(/[\x00-\x1f]/g, '')     // 移除控制字符
        .replace(/^\.+/, '')              // 移除前导点
        .trim();
}

/**
 * 获取文件扩展名
 */
export function getExtension(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase().slice(1);
    return ext;
}

/**
 * 检查文件扩展名是否允许
 */
export function isAllowedExtension(fileName: string): boolean {
    const ext = getExtension(fileName);
    if (BLOCKED_EXTENSIONS.has(ext)) {
        return false;
    }
    // 如果不在白名单且不在黑名单，默认允许
    return true;
}

/**
 * 获取 MIME 类型
 */
export function getMimeType(fileName: string): string {
    const ext = getExtension(fileName);
    return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * 处理文件名冲突，添加序号后缀
 */
export function resolveNameConflict(dirPath: string, fileName: string): string {
    const ext = path.extname(fileName);
    const base = path.basename(fileName, ext);
    let newName = fileName;
    let counter = 1;

    while (fs.existsSync(path.join(dirPath, newName))) {
        newName = `${base} (${counter})${ext}`;
        counter++;
    }

    return newName;
}

// ============================================================
// 目录操作
// ============================================================

/**
 * 获取目录树
 */
export function getFolderTree(): FolderNode {
    ensureFilesDir();
    const filesRoot = getFilesRoot();

    function buildTree(dirPath: string, relativePath: string = ''): FolderNode {
        const name = relativePath === '' ? '仓库' : path.basename(dirPath);
        const node: FolderNode = {
            name,
            path: '/' + relativePath,
        };

        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            // 过滤隐藏目录
            const folders = entries.filter(e =>
                e.isDirectory() && !HIDDEN_DIRS.has(e.name) && !e.name.startsWith('.')
            );

            if (folders.length > 0) {
                node.children = folders.map(folder => {
                    const childRelative = relativePath ? `${relativePath}/${folder.name}` : folder.name;
                    return buildTree(path.join(dirPath, folder.name), childRelative);
                });
            }
        } catch {
            // 目录不可读，返回空节点
        }

        return node;
    }

    return buildTree(filesRoot);
}

/**
 * 创建文件夹
 */
export function createFolder(folderPath: string): { success: boolean; error?: string } {
    const safePath = getSafePath(folderPath);
    if (!safePath) {
        return { success: false, error: '无效的路径' };
    }

    if (fs.existsSync(safePath)) {
        return { success: false, error: '文件夹已存在' };
    }

    try {
        fs.mkdirSync(safePath, { recursive: true });
        return { success: true };
    } catch (err) {
        return { success: false, error: '创建文件夹失败' };
    }
}

/**
 * 删除文件夹
 */
export function deleteFolder(folderPath: string, force: boolean = false): { success: boolean; error?: string } {
    const safePath = getSafePath(folderPath);
    if (!safePath) {
        return { success: false, error: '无效的路径' };
    }

    if (!fs.existsSync(safePath)) {
        return { success: false, error: '文件夹不存在' };
    }

    const stat = fs.statSync(safePath);
    if (!stat.isDirectory()) {
        return { success: false, error: '不是文件夹' };
    }

    // 检查是否为空
    const entries = fs.readdirSync(safePath);
    if (entries.length > 0 && !force) {
        return { success: false, error: '文件夹不为空' };
    }

    try {
        fs.rmSync(safePath, { recursive: true });
        return { success: true };
    } catch (err) {
        return { success: false, error: '删除文件夹失败' };
    }
}

// ============================================================
// 文件操作
// ============================================================

/**
 * 列出目录内容
 */
export function listDirectory(dirPath: string): FileInfo[] {
    const safePath = getSafePath(dirPath || '/');
    if (!safePath) {
        return [];
    }

    if (!fs.existsSync(safePath)) {
        return [];
    }

    const stat = fs.statSync(safePath);
    if (!stat.isDirectory()) {
        return [];
    }

    try {
        const entries = fs.readdirSync(safePath, { withFileTypes: true });
        const filesRoot = getFilesRoot();

        // 过滤隐藏项（只隐藏系统文件/目录）
        const visibleEntries = entries.filter(entry => {
            // 隐藏以 . 开头的文件/目录
            if (entry.name.startsWith('.')) return false;
            // 隐藏系统目录
            if (entry.isDirectory() && HIDDEN_DIRS.has(entry.name)) return false;
            return true;
        });

        return visibleEntries.map(entry => {
            const fullPath = path.join(safePath, entry.name);
            const relativePath = '/' + path.relative(filesRoot, fullPath);
            const stats = fs.statSync(fullPath);

            const info: FileInfo = {
                name: entry.name,
                path: relativePath,
                type: entry.isDirectory() ? 'folder' : 'file',
                modifiedAt: stats.mtime.toISOString(),
            };

            if (entry.isFile()) {
                info.size = stats.size;
                info.extension = getExtension(entry.name);
                info.mimeType = getMimeType(entry.name);
            }

            return info;
        }).sort((a, b) => {
            // 文件夹在前
            if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1;
            }
            // 按名称排序
            return a.name.localeCompare(b.name, 'zh-CN');
        });
    } catch {
        return [];
    }
}

/**
 * 保存上传的文件
 */
export function saveFile(
    dirPath: string,
    fileName: string,
    buffer: Buffer
): { success: boolean; file?: FileInfo; error?: string } {
    // 验证目录路径
    const safeDirPath = getSafePath(dirPath || '/');
    if (!safeDirPath) {
        return { success: false, error: '无效的目录路径' };
    }

    // 确保目录存在
    if (!fs.existsSync(safeDirPath)) {
        fs.mkdirSync(safeDirPath, { recursive: true });
    }

    // 消毒文件名
    const sanitizedName = sanitizeFileName(fileName);
    if (!sanitizedName) {
        return { success: false, error: '无效的文件名' };
    }

    // 检查扩展名
    if (!isAllowedExtension(sanitizedName)) {
        return { success: false, error: '不允许的文件类型' };
    }

    // 检查文件大小
    if (buffer.length > MAX_FILE_SIZE) {
        return { success: false, error: '文件过大（最大 50MB）' };
    }

    // 处理文件名冲突
    const finalName = resolveNameConflict(safeDirPath, sanitizedName);
    const filePath = path.join(safeDirPath, finalName);

    try {
        fs.writeFileSync(filePath, buffer);

        const stats = fs.statSync(filePath);
        const filesRoot = getFilesRoot();
        const relativePath = '/' + path.relative(filesRoot, filePath);

        const file: FileInfo = {
            name: finalName,
            path: relativePath,
            type: 'file',
            size: stats.size,
            extension: getExtension(finalName),
            mimeType: getMimeType(finalName),
            modifiedAt: stats.mtime.toISOString(),
        };

        return { success: true, file };
    } catch (err) {
        return { success: false, error: '保存文件失败' };
    }
}

/**
 * 获取文件路径（用于下载）
 */
export function getFilePath(filePath: string): string | null {
    const safePath = getSafePath(filePath);
    if (!safePath) {
        return null;
    }

    if (!fs.existsSync(safePath)) {
        return null;
    }

    const stat = fs.statSync(safePath);
    if (!stat.isFile()) {
        return null;
    }

    return safePath;
}

/**
 * 获取文件信息
 */
export function getFileInfo(filePath: string): FileInfo | null {
    const safePath = getSafePath(filePath);
    if (!safePath) {
        return null;
    }

    if (!fs.existsSync(safePath)) {
        return null;
    }

    const stat = fs.statSync(safePath);
    const filesRoot = getFilesRoot();
    const relativePath = '/' + path.relative(filesRoot, safePath);
    const name = path.basename(safePath);

    return {
        name,
        path: relativePath,
        type: stat.isDirectory() ? 'folder' : 'file',
        size: stat.size,
        extension: getExtension(name),
        mimeType: getMimeType(name),
        modifiedAt: stat.mtime.toISOString(),
    };
}

/** 受保护的文件扩展名（不允许通过文件管理器删除） */
const PROTECTED_EXTENSIONS = new Set(['md']);

/**
 * 删除文件
 */
export function deleteFile(filePath: string): { success: boolean; error?: string } {
    const safePath = getSafePath(filePath);
    if (!safePath) {
        return { success: false, error: '无效的路径' };
    }

    if (!fs.existsSync(safePath)) {
        return { success: false, error: '文件不存在' };
    }

    const stat = fs.statSync(safePath);
    if (!stat.isFile()) {
        return { success: false, error: '不是文件' };
    }

    // 保护 .md 文档文件不被删除
    const ext = getExtension(path.basename(safePath));
    if (PROTECTED_EXTENSIONS.has(ext)) {
        return { success: false, error: '文档文件不能通过文件管理器删除，请在文档管理中操作' };
    }

    try {
        fs.unlinkSync(safePath);
        return { success: true };
    } catch (err) {
        return { success: false, error: '删除文件失败' };
    }
}

/**
 * 重命名文件或文件夹
 */
export function rename(
    oldPath: string,
    newName: string
): { success: boolean; newPath?: string; error?: string } {
    const safeOldPath = getSafePath(oldPath);
    if (!safeOldPath) {
        return { success: false, error: '无效的路径' };
    }

    if (!fs.existsSync(safeOldPath)) {
        return { success: false, error: '文件或文件夹不存在' };
    }

    const sanitizedName = sanitizeFileName(newName);
    if (!sanitizedName) {
        return { success: false, error: '无效的名称' };
    }

    const parentDir = path.dirname(safeOldPath);
    const newFullPath = path.join(parentDir, sanitizedName);

    if (fs.existsSync(newFullPath)) {
        return { success: false, error: '该名称已存在' };
    }

    try {
        fs.renameSync(safeOldPath, newFullPath);
        const filesRoot = getFilesRoot();
        const relativePath = '/' + path.relative(filesRoot, newFullPath);
        return { success: true, newPath: relativePath };
    } catch (err) {
        return { success: false, error: '重命名失败' };
    }
}

