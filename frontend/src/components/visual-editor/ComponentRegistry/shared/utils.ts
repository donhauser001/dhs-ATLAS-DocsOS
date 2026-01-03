/**
 * ComponentRegistry - 共享工具函数
 */

import * as LucideIcons from 'lucide-react';

/**
 * 生成组件 ID
 */
export function generateComponentId(): string {
    return `comp_${Date.now().toString(36)}`;
}

/**
 * 根据图标名称获取 Lucide 图标组件
 */
export function getLucideIcon(
    iconName: string
): React.ComponentType<{ className?: string; size?: number }> | null {
    const pascalCase = iconName
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
    return (LucideIcons as Record<string, unknown>)[pascalCase] as React.ComponentType<{
        className?: string;
        size?: number;
    }> | null;
}

/** 常用文件扩展名预设 */
export const FILE_TYPE_PRESETS = {
    all: { label: '所有文件', extensions: [] as string[] },
    documents: { label: '文档', extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'] },
    images: { label: '图片', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'] },
    videos: { label: '视频', extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'] },
    audio: { label: '音频', extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg'] },
    archives: { label: '压缩包', extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'] },
};

/** 图片扩展名 */
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];

