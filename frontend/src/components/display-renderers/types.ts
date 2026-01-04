/**
 * 显现模式渲染器类型定义
 * 
 * 显现模式（Display Mode）决定了文档内容如何呈现给用户
 * 每种显现模式对应一个渲染器组件
 */

import type { ReactNode } from 'react';

/**
 * 显现模式渲染器 Props
 */
export interface DisplayRendererProps {
    /** 文档路径 */
    documentPath: string;
    /** 文档标题 */
    title: string;
    /** 文档正文内容（Markdown 或 HTML） */
    bodyContent: string;
    /** 文档 frontmatter */
    frontmatter: Record<string, unknown>;
    /** 是否只读模式 */
    readonly?: boolean;
    /** 内容变更回调（非只读时使用） */
    onContentChange?: (content: string) => void;
    /** 额外的子元素（如侧边栏、TOC 等） */
    children?: ReactNode;
    /** 额外的 CSS 类名 */
    className?: string;
}

/**
 * 显现模式配置
 */
export interface DisplayModeDefinition {
    /** 显现模式 ID（如 article.single） */
    id: string;
    /** 显示标签 */
    label: string;
    /** 图标名称 */
    icon?: string;
    /** 描述 */
    description?: string;
    /** 渲染器组件 */
    renderer: React.ComponentType<DisplayRendererProps>;
}

/**
 * 显现模式上下文
 */
export interface DisplayModeContext {
    /** 当前显现模式 ID */
    currentMode: string;
    /** 可用的显现模式列表 */
    availableModes: string[];
    /** 切换显现模式 */
    setMode: (mode: string) => void;
}

