/**
 * NoteReadView - 笔记阅读视图
 * 
 * 专注于阅读体验的文章式布局
 */

import { useMemo, useState } from 'react';
import { 
  Calendar, Clock, User, FileText, 
  ChevronDown, ChevronUp, Edit, Hash 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ViewProps } from '@/registry/types';
import { cn } from '@/lib/utils';

export function NoteReadView({ document, onViewModeChange }: ViewProps) {
  const [showMetadata, setShowMetadata] = useState(false);

  // 解析笔记数据
  const noteData = useMemo(() => {
    const block = document.blocks[0];
    const machine = block?.machine || {};
    const frontmatter = document.frontmatter || {};

    // 从标题中提取文章标题
    const rawHeading = block?.heading || '';
    const title = rawHeading.replace(/^#+\s*/, '').replace(/\s*\{#.*\}$/, '').trim() || '无标题笔记';

    // 提取正文内容
    const bodyContent = block?.body || '';

    // 计算阅读时间（按中文 400 字/分钟估算）
    const wordCount = bodyContent.length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 400));

    return {
      title,
      id: machine.id as string || block?.anchor || '',
      content: bodyContent,
      wordCount,
      readingTime,

      // 元数据
      version: frontmatter.version as string || '1.0',
      created: frontmatter.created as string || '',
      updated: frontmatter.updated as string || '',
      author: frontmatter.author as string || '',
      documentType: frontmatter.document_type as string || 'note',

      // 笔记特有字段
      tags: machine.tags as string[] || [],
      category: machine.category as string || '',
    };
  }, [document]);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="note-read-view min-h-screen bg-slate-50">
      {/* 文章区域 */}
      <article className="max-w-3xl mx-auto bg-white shadow-sm">
        {/* 文章头部 */}
        <header className="px-8 pt-12 pb-8 border-b border-slate-100">
          {/* 分类标签 */}
          {noteData.category && (
            <div className="mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                {noteData.category}
              </span>
            </div>
          )}

          {/* 标题 */}
          <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-4">
            {noteData.title}
          </h1>

          {/* 元信息行 */}
          <div className="flex items-center gap-4 text-sm text-slate-500">
            {noteData.created && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(noteData.created)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              阅读约 {noteData.readingTime} 分钟
            </span>
            {noteData.author && (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {noteData.author}
              </span>
            )}
          </div>

          {/* 标签 */}
          {noteData.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <Hash className="w-4 h-4 text-slate-400" />
              <div className="flex flex-wrap gap-2">
                {noteData.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-slate-100 text-slate-600 text-sm rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 编辑按钮 */}
          {onViewModeChange && (
            <button
              onClick={() => onViewModeChange('md')}
              className="mt-6 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              编辑笔记
            </button>
          )}
        </header>

        {/* 文章正文 */}
        <div className="px-8 py-8">
          <div className="prose prose-slate prose-lg max-w-none
            prose-headings:font-semibold prose-headings:text-slate-900
            prose-p:text-slate-700 prose-p:leading-relaxed
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
            prose-pre:bg-slate-900 prose-pre:text-slate-100
            prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-1
            prose-img:rounded-lg prose-img:shadow-md
          ">
            <ReactMarkdown>{noteData.content}</ReactMarkdown>
          </div>

          {/* 无内容提示 */}
          {!noteData.content && (
            <div className="text-center py-16 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>这篇笔记还没有内容</p>
              {onViewModeChange && (
                <button
                  onClick={() => onViewModeChange('md')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  开始写作
                </button>
              )}
            </div>
          )}
        </div>

        {/* 文章底部 */}
        <footer className="px-8 py-6 border-t border-slate-100 bg-slate-50/50">
          {/* 字数统计 */}
          <div className="text-sm text-slate-500 mb-4">
            全文共 {noteData.wordCount} 字
          </div>

          {/* 元数据折叠区 */}
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="w-full flex items-center justify-between text-sm text-slate-500 hover:text-slate-700 transition-colors py-2"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              文档信息
            </span>
            {showMetadata ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showMetadata && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-slate-400 text-xs mb-1">版本</div>
                <div className="font-medium text-slate-600">{noteData.version}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-1">文档类型</div>
                <div className="font-medium text-slate-600">笔记</div>
              </div>
              {noteData.created && (
                <div>
                  <div className="text-slate-400 text-xs mb-1">创建时间</div>
                  <div className="font-medium text-slate-600">{formatDate(noteData.created)}</div>
                </div>
              )}
              {noteData.updated && (
                <div>
                  <div className="text-slate-400 text-xs mb-1">更新时间</div>
                  <div className="font-medium text-slate-600">{formatDate(noteData.updated)}</div>
                </div>
              )}
              {noteData.id && (
                <div className="col-span-2">
                  <div className="text-slate-400 text-xs mb-1">文档 ID</div>
                  <div className="font-mono text-slate-600 text-xs">{noteData.id}</div>
                </div>
              )}
            </div>
          )}
        </footer>
      </article>
    </div>
  );
}

export default NoteReadView;

