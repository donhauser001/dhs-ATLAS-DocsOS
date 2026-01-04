/**
 * ArticleSingleRenderer - 单栏文章渲染器
 * 
 * 显现模式：article.single
 * 特点：居中单栏布局，专注阅读体验
 * 
 * 设计灵感：Medium、Notion、Bear
 */

import { useMemo } from 'react';
import { marked } from 'marked';
import { cn } from '@/lib/utils';
import type { DisplayRendererProps } from './types';

// ============================================================
// Marked 配置
// ============================================================

marked.setOptions({
    breaks: true,
    gfm: true,
});

// ============================================================
// 优雅的文章样式
// ============================================================

const articleStyles = `
/* ========================================
   单栏文章样式 - Article Single
   ======================================== */

.article-single {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', 'PingFang SC', sans-serif;
    font-size: 16px;
    line-height: 1.75;
    color: #374151;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* 标题 */
.article-single h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 1.5rem 0;
    line-height: 1.3;
    letter-spacing: -0.025em;
}

.article-single h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 2.5rem 0 1rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    line-height: 1.35;
}

.article-single h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin: 2rem 0 0.75rem 0;
    line-height: 1.4;
}

.article-single h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #4b5563;
    margin: 1.5rem 0 0.5rem 0;
}

/* 段落 */
.article-single p {
    margin: 1rem 0;
    color: #4b5563;
}

/* 链接 */
.article-single a {
    color: #7c3aed;
    text-decoration: none;
    transition: all 0.15s ease;
}

.article-single a:hover {
    color: #6d28d9;
    text-decoration: underline;
}

/* 强调 */
.article-single strong {
    font-weight: 600;
    color: #1f2937;
}

.article-single em {
    font-style: italic;
    color: #6b7280;
}

/* 行内代码 */
.article-single code:not(pre code) {
    font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
    font-size: 0.875em;
    padding: 0.125rem 0.375rem;
    background: #f3e8ff;
    color: #7c3aed;
    border-radius: 4px;
    font-weight: 500;
}

/* 代码块 */
.article-single pre {
    font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
    font-size: 0.875rem;
    line-height: 1.6;
    background: linear-gradient(145deg, #1e1e2e, #262638);
    color: #cdd6f4;
    padding: 1.25rem 1.5rem;
    border-radius: 12px;
    overflow-x: auto;
    margin: 1.5rem 0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.article-single pre code {
    background: transparent;
    padding: 0;
    color: inherit;
    font-size: inherit;
    font-weight: normal;
}

/* 引用块 */
.article-single blockquote {
    margin: 1.5rem 0;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
    border-left: 4px solid #a78bfa;
    border-radius: 0 12px 12px 0;
    color: #5b21b6;
}

.article-single blockquote p {
    margin: 0;
    color: #6d28d9;
}

/* 列表 */
.article-single ul,
.article-single ol {
    margin: 1rem 0;
    padding-left: 1.5rem;
}

.article-single li {
    margin: 0.375rem 0;
    color: #4b5563;
}

.article-single ul li::marker {
    color: #a78bfa;
}

.article-single ol li::marker {
    color: #6b7280;
    font-weight: 600;
}

/* 嵌套列表 */
.article-single li ul,
.article-single li ol {
    margin: 0.25rem 0;
}

/* 表格 - 现代扁平化设计（仅横线） */
.article-single table {
    width: 100%;
    margin: 1.5rem 0;
    border-collapse: collapse;
    font-size: 0.9375rem;
    table-layout: auto;
}

.article-single th,
.article-single td {
    text-align: left;
    padding: 0.75rem 1rem;
    white-space: nowrap;
}

.article-single th {
    background: #f8fafc;
    font-weight: 600;
    color: #334155;
    border-bottom: 1px solid #e2e8f0;
    font-size: 0.875rem;
}

.article-single td {
    border-bottom: 1px solid #f1f5f9;
    color: #475569;
    white-space: normal;
}

/* 允许较宽的列自动换行 */
.article-single td:last-child {
    white-space: normal;
}

.article-single tr:last-child td {
    border-bottom: none;
}

.article-single tbody tr:hover {
    background: #f8fafc;
}

/* 分隔线 */
.article-single hr {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, #d1d5db 20%, #d1d5db 80%, transparent);
    margin: 2.5rem 0;
}

/* 图片 */
.article-single img {
    max-width: 100%;
    height: auto;
    border-radius: 12px;
    margin: 1.5rem 0;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* 任务列表 */
.article-single input[type="checkbox"] {
    accent-color: #7c3aed;
    margin-right: 0.5rem;
    transform: scale(1.1);
}

/* 选中文本 */
.article-single ::selection {
    background: #ddd6fe;
    color: #4c1d95;
}
`;

// ============================================================
// 主组件
// ============================================================

export function ArticleSingleRenderer({
    bodyContent,
    className,
}: DisplayRendererProps) {
    // 将 Markdown 转换为 HTML
    const htmlContent = useMemo(() => {
        if (bodyContent.trim().startsWith('<')) {
            return bodyContent;
        }
        return marked.parse(bodyContent) as string;
    }, [bodyContent]);

    return (
        <>
            <style>{articleStyles}</style>
            <article
                className={cn(
                    "article-single",
                    "max-w-[1200px] mx-auto px-8 py-8",
                    className
                )}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        </>
    );
}

export default ArticleSingleRenderer;
