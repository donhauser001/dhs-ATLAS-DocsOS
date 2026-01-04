/**
 * ArticleZenRenderer - 禅模式渲染器
 * 
 * 显现模式：article.zen
 * 特点：极简专注阅读，去除所有干扰
 * 
 * 设计理念：
 * - 全屏沉浸式阅读体验
 * - 柔和的米色背景，护眼舒适
 * - 更大的字体，更宽松的行间距
 * - 居中内容，适中宽度（约 50-60 字符）
 * - 优雅的衬线字体
 */

import { useMemo, useState, useEffect } from 'react';
import { marked } from 'marked';
import { cn } from '@/lib/utils';
import type { DisplayRendererProps } from './types';

// ============================================================
// 样式定义
// ============================================================

const zenStyles = `
/* ========================================
   禅模式样式 - Article Zen
   专注阅读，去除干扰
   ======================================== */

.article-zen-wrapper {
    position: relative;
    min-height: 100%;
    background: linear-gradient(180deg, #fefdfb 0%, #faf8f5 100%);
}

/* 阅读进度条 */
.zen-progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #a78bfa, #7c3aed);
    transition: width 0.1s ease-out;
    z-index: 100;
}

/* 主容器 */
.article-zen-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 4rem 2rem 6rem;
}

/* ========================================
   排版样式 - 专注阅读优化
   ======================================== */

.article-zen-content {
    font-family: 'Georgia', 'Noto Serif SC', 'Source Han Serif SC', serif;
    font-size: 1.1875rem;
    line-height: 2;
    color: #3d3d3d;
    -webkit-font-smoothing: antialiased;
    letter-spacing: 0.01em;
}

/* 标题 - 简洁有力 */
.article-zen-content h1 {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
    font-size: 2.25rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 2rem 0;
    line-height: 1.4;
    letter-spacing: -0.02em;
    text-align: center;
}

.article-zen-content h2 {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
    font-size: 1.625rem;
    font-weight: 600;
    color: #2d2d2d;
    margin: 3.5rem 0 1.5rem 0;
    line-height: 1.4;
    text-align: center;
}

.article-zen-content h3 {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
    font-size: 1.375rem;
    font-weight: 600;
    color: #3d3d3d;
    margin: 2.5rem 0 1rem 0;
    line-height: 1.4;
}

.article-zen-content h4 {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
    font-size: 1.125rem;
    font-weight: 600;
    color: #4d4d4d;
    margin: 2rem 0 0.75rem 0;
}

/* 段落 - 舒适阅读 */
.article-zen-content p {
    margin: 1.5rem 0;
    text-align: justify;
    text-justify: inter-ideograph;
}

/* 首段特殊样式 */
.article-zen-content > p:first-of-type {
    font-size: 1.25rem;
    color: #4d4d4d;
}

/* 链接 - 低调不干扰 */
.article-zen-content a {
    color: #6d28d9;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease;
}

.article-zen-content a:hover {
    border-bottom-color: #6d28d9;
}

/* 强调文本 */
.article-zen-content strong {
    font-weight: 700;
    color: #2d2d2d;
}

.article-zen-content em {
    font-style: italic;
}

/* 行内代码 - 低调风格 */
.article-zen-content code:not(pre code) {
    font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
    font-size: 0.875em;
    padding: 0.15rem 0.4rem;
    background: rgba(124, 58, 237, 0.08);
    color: #6d28d9;
    border-radius: 4px;
}

/* 代码块 - 简洁风格 */
.article-zen-content pre {
    font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
    font-size: 0.9375rem;
    line-height: 1.7;
    background: #2d2d2d;
    color: #e5e5e5;
    padding: 1.5rem 2rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 2rem 0;
}

.article-zen-content pre code {
    background: transparent;
    padding: 0;
    color: inherit;
    font-size: inherit;
}

/* 引用块 - 优雅居中 */
.article-zen-content blockquote {
    margin: 2.5rem 0;
    padding: 0;
    border: none;
    background: none;
    text-align: center;
    font-style: italic;
    color: #5d5d5d;
    position: relative;
}

.article-zen-content blockquote::before {
    content: '"';
    font-size: 4rem;
    color: #d4d4d4;
    position: absolute;
    top: -1.5rem;
    left: 50%;
    transform: translateX(-50%);
    font-family: Georgia, serif;
    line-height: 1;
}

.article-zen-content blockquote p {
    margin: 0;
    padding: 1rem 2rem;
    font-size: 1.25rem;
    line-height: 1.8;
    text-align: center;
}

/* 列表 - 简洁风格 */
.article-zen-content ul,
.article-zen-content ol {
    margin: 1.5rem 0;
    padding-left: 1.5rem;
}

.article-zen-content li {
    margin: 0.75rem 0;
}

.article-zen-content ul li::marker {
    color: #a78bfa;
}

.article-zen-content ol li::marker {
    color: #6d6d6d;
}

/* 表格 - 极简风格 */
.article-zen-content table {
    width: 100%;
    margin: 2rem 0;
    border-collapse: collapse;
    font-size: 1rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.article-zen-content th,
.article-zen-content td {
    text-align: left;
    padding: 1rem;
}

.article-zen-content th {
    font-weight: 600;
    color: #3d3d3d;
    border-bottom: 2px solid #e5e5e5;
}

.article-zen-content td {
    border-bottom: 1px solid #f0f0f0;
    color: #5d5d5d;
}

.article-zen-content tr:last-child td {
    border-bottom: none;
}

/* 分隔线 - 优雅装饰 */
.article-zen-content hr {
    border: none;
    text-align: center;
    margin: 3rem 0;
}

.article-zen-content hr::before {
    content: '◆ ◆ ◆';
    color: #d4d4d4;
    font-size: 0.75rem;
    letter-spacing: 1rem;
}

/* 图片 - 全宽展示 */
.article-zen-content img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 2rem 0;
}

/* 选中文本 */
.article-zen-content ::selection {
    background: #ede9fe;
    color: #4c1d95;
}

/* ========================================
   阅读体验增强
   ======================================== */

/* 聚焦当前段落（可选功能）*/
.article-zen-content.focus-mode p:not(:hover) {
    opacity: 0.4;
    transition: opacity 0.3s ease;
}

.article-zen-content.focus-mode p:hover {
    opacity: 1;
}

/* 底部留白 */
.article-zen-footer {
    height: 30vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.article-zen-footer-text {
    color: #c4c4c4;
    font-size: 0.875rem;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}
`;

// ============================================================
// 主组件
// ============================================================

export function ArticleZenRenderer({
    bodyContent,
    className,
}: DisplayRendererProps) {
    const [scrollProgress, setScrollProgress] = useState(0);
    
    // 将 Markdown 转换为 HTML
    const htmlContent = useMemo(() => {
        if (bodyContent.trim().startsWith('<')) {
            return bodyContent;
        }
        return marked.parse(bodyContent) as string;
    }, [bodyContent]);
    
    // 监听滚动进度
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            setScrollProgress(Math.min(100, progress));
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    return (
        <>
            <style>{zenStyles}</style>
            <div className={cn("article-zen-wrapper", className)}>
                {/* 阅读进度条 */}
                <div 
                    className="zen-progress-bar"
                    style={{ width: `${scrollProgress}%` }}
                />
                
                {/* 主内容区 */}
                <div className="article-zen-container">
                    <article
                        className="article-zen-content"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                    
                    {/* 底部留白 */}
                    <footer className="article-zen-footer">
                        <span className="article-zen-footer-text">— 阅读完毕 —</span>
                    </footer>
                </div>
            </div>
        </>
    );
}

export default ArticleZenRenderer;

