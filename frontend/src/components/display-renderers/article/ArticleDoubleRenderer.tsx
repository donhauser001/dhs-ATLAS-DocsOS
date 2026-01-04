/**
 * ArticleDoubleRenderer - 双栏文章渲染器
 * 
 * 显现模式：article.double
 * 特点：主内容区 + 右侧边栏（目录导航）
 * 
 * 布局设计：
 * - 左侧：文章主内容（约 70%）
 * - 右侧：目录导航 + 文档信息（约 30%）
 * - 侧边栏粘性定位，随页面滚动
 */

import { useMemo, useEffect, useState } from 'react';
import { marked } from 'marked';
import { cn } from '@/lib/utils';
import { List } from 'lucide-react';
import type { DisplayRendererProps } from './types';

// ============================================================
// 类型定义
// ============================================================

interface TocItem {
    id: string;
    text: string;
    level: number;
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 从 Markdown 内容中提取目录
 */
function extractToc(markdown: string): TocItem[] {
    const headingRegex = /^(#{1,4})\s+(.+)$/gm;
    const toc: TocItem[] = [];
    let match;
    
    while ((match = headingRegex.exec(markdown)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        // 生成 ID（简单版本，移除特殊字符）
        const id = text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
            .replace(/^-|-$/g, '');
        
        toc.push({ id, text, level });
    }
    
    return toc;
}

/**
 * 为 HTML 中的标题添加 ID
 */
function addHeadingIds(html: string): string {
    return html.replace(
        /<h([1-4])>(.+?)<\/h[1-4]>/g,
        (_, level, text) => {
            const id = text
                .replace(/<[^>]+>/g, '') // 移除 HTML 标签
                .toLowerCase()
                .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
                .replace(/^-|-$/g, '');
            return `<h${level} id="${id}">${text}</h${level}>`;
        }
    );
}

// ============================================================
// 目录组件
// ============================================================

interface TocSidebarProps {
    toc: TocItem[];
    activeId?: string;
}

function TocSidebar({ toc, activeId }: TocSidebarProps) {
    if (toc.length === 0) return null;
    
    return (
        <nav className="toc-sidebar">
            <div className="toc-header">
                <List size={16} />
                <span>目录</span>
            </div>
            <ul className="toc-list">
                {toc.map((item, index) => (
                    <li
                        key={index}
                        className={cn(
                            "toc-item",
                            `toc-level-${item.level}`,
                            activeId === item.id && "toc-active"
                        )}
                    >
                        <a href={`#${item.id}`}>{item.text}</a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

// ============================================================
// 样式定义
// ============================================================

const doubleColumnStyles = `
/* ========================================
   双栏文章样式 - Article Double
   ======================================== */

.article-double-container {
    display: flex;
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    gap: 3rem;
}

/* 主内容区 */
.article-double-main {
    flex: 1;
    min-width: 0;
    max-width: 900px;
}

/* 侧边栏 */
.article-double-sidebar {
    width: 280px;
    flex-shrink: 0;
}

.article-double-sidebar-sticky {
    position: sticky;
    top: 2rem;
}

/* ========================================
   目录样式
   ======================================== */

.toc-sidebar {
    background: #f8fafc;
    border-radius: 12px;
    padding: 1.25rem;
    border: 1px solid #e2e8f0;
}

.toc-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: #334155;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
}

.toc-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.toc-item {
    margin: 0.25rem 0;
}

.toc-item a {
    display: block;
    padding: 0.375rem 0.75rem;
    color: #64748b;
    text-decoration: none;
    font-size: 0.875rem;
    border-radius: 6px;
    transition: all 0.15s ease;
    line-height: 1.4;
}

.toc-item a:hover {
    color: #7c3aed;
    background: #f1f5f9;
}

.toc-item.toc-active a {
    color: #7c3aed;
    background: #ede9fe;
    font-weight: 500;
}

/* 目录层级缩进 */
.toc-level-1 a { padding-left: 0.75rem; font-weight: 500; color: #334155; }
.toc-level-2 a { padding-left: 1.25rem; }
.toc-level-3 a { padding-left: 1.75rem; font-size: 0.8125rem; }
.toc-level-4 a { padding-left: 2.25rem; font-size: 0.8125rem; }

/* ========================================
   文章内容样式（复用单栏样式）
   ======================================== */

.article-double-content {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', 'PingFang SC', sans-serif;
    font-size: 16px;
    line-height: 1.75;
    color: #374151;
    -webkit-font-smoothing: antialiased;
}

.article-double-content h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 1.5rem 0;
    line-height: 1.3;
    letter-spacing: -0.025em;
}

.article-double-content h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 2.5rem 0 1rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    line-height: 1.35;
}

.article-double-content h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin: 2rem 0 0.75rem 0;
    line-height: 1.4;
}

.article-double-content h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #4b5563;
    margin: 1.5rem 0 0.5rem 0;
}

.article-double-content p {
    margin: 1rem 0;
    color: #4b5563;
}

.article-double-content a {
    color: #7c3aed;
    text-decoration: none;
    transition: all 0.15s ease;
}

.article-double-content a:hover {
    color: #6d28d9;
    text-decoration: underline;
}

.article-double-content strong {
    font-weight: 600;
    color: #1f2937;
}

.article-double-content em {
    font-style: italic;
    color: #6b7280;
}

.article-double-content code:not(pre code) {
    font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
    font-size: 0.875em;
    padding: 0.125rem 0.375rem;
    background: #f3e8ff;
    color: #7c3aed;
    border-radius: 4px;
    font-weight: 500;
}

.article-double-content pre {
    font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
    font-size: 0.875rem;
    line-height: 1.6;
    background: linear-gradient(145deg, #1e1e2e, #262638);
    color: #cdd6f4;
    padding: 1.25rem 1.5rem;
    border-radius: 12px;
    overflow-x: auto;
    margin: 1.5rem 0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.article-double-content pre code {
    background: transparent;
    padding: 0;
    color: inherit;
    font-size: inherit;
    font-weight: normal;
}

.article-double-content blockquote {
    margin: 1.5rem 0;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
    border-left: 4px solid #a78bfa;
    border-radius: 0 12px 12px 0;
    color: #5b21b6;
}

.article-double-content blockquote p {
    margin: 0;
    color: #6d28d9;
}

.article-double-content ul,
.article-double-content ol {
    margin: 1rem 0;
    padding-left: 1.5rem;
}

.article-double-content li {
    margin: 0.375rem 0;
    color: #4b5563;
}

.article-double-content ul li::marker {
    color: #a78bfa;
}

.article-double-content ol li::marker {
    color: #6b7280;
    font-weight: 600;
}

.article-double-content table {
    width: 100%;
    margin: 1.5rem 0;
    border-collapse: collapse;
    font-size: 0.9375rem;
}

.article-double-content th,
.article-double-content td {
    text-align: left;
    padding: 0.75rem 1rem;
    white-space: nowrap;
}

.article-double-content th {
    background: #f8fafc;
    font-weight: 600;
    color: #334155;
    border-bottom: 1px solid #e2e8f0;
    font-size: 0.875rem;
}

.article-double-content td {
    border-bottom: 1px solid #f1f5f9;
    color: #475569;
    white-space: normal;
}

.article-double-content tr:last-child td {
    border-bottom: none;
}

.article-double-content tbody tr:hover {
    background: #f8fafc;
}

.article-double-content hr {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, #d1d5db 20%, #d1d5db 80%, transparent);
    margin: 2.5rem 0;
}

.article-double-content img {
    max-width: 100%;
    height: auto;
    border-radius: 12px;
    margin: 1.5rem 0;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* 响应式：小屏隐藏侧边栏 */
@media (max-width: 1024px) {
    .article-double-container {
        flex-direction: column;
    }
    
    .article-double-sidebar {
        width: 100%;
        order: -1;
    }
    
    .article-double-sidebar-sticky {
        position: static;
    }
    
    .toc-sidebar {
        margin-bottom: 1.5rem;
    }
}
`;

// ============================================================
// 主组件
// ============================================================

export function ArticleDoubleRenderer({
    bodyContent,
    className,
}: DisplayRendererProps) {
    const [activeId, setActiveId] = useState<string>('');
    
    // 提取目录
    const toc = useMemo(() => extractToc(bodyContent), [bodyContent]);
    
    // 将 Markdown 转换为 HTML 并添加标题 ID
    const htmlContent = useMemo(() => {
        if (bodyContent.trim().startsWith('<')) {
            return addHeadingIds(bodyContent);
        }
        const html = marked.parse(bodyContent) as string;
        return addHeadingIds(html);
    }, [bodyContent]);
    
    // 监听滚动，高亮当前可见的标题
    useEffect(() => {
        const handleScroll = () => {
            const headings = document.querySelectorAll('.article-double-content h1, .article-double-content h2, .article-double-content h3, .article-double-content h4');
            
            for (let i = headings.length - 1; i >= 0; i--) {
                const heading = headings[i] as HTMLElement;
                const rect = heading.getBoundingClientRect();
                
                if (rect.top <= 100) {
                    setActiveId(heading.id);
                    break;
                }
            }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // 初始化
        
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    return (
        <>
            <style>{doubleColumnStyles}</style>
            <div className={cn("article-double-container", className)}>
                {/* 主内容区 */}
                <main className="article-double-main">
                    <article
                        className="article-double-content"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                </main>
                
                {/* 侧边栏 */}
                <aside className="article-double-sidebar">
                    <div className="article-double-sidebar-sticky">
                        <TocSidebar toc={toc} activeId={activeId} />
                    </div>
                </aside>
            </div>
        </>
    );
}

export default ArticleDoubleRenderer;

