/**
 * 评论能力组件
 * 
 * 包含两个部分：
 * 1. 头部显示评论数量（inline 模式）
 * 2. 文章下方的评论区组件（panel 模式）
 */

import { useState, useEffect } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';
import { registerCapability } from '../registry';
import type { CapabilityComponentProps } from '../types';

/**
 * 模拟获取评论数据
 * TODO: 替换为真实 API
 */
interface Comment {
    id: string;
    author: string;
    content: string;
    createdAt: string;
}

async function fetchComments(documentPath: string): Promise<Comment[]> {
    // 模拟数据
    console.log('[Comment] 获取评论:', documentPath);
    return [
        { id: '1', author: 'Alice', content: '这篇文档写得很好！', createdAt: '2024-01-03T10:00:00Z' },
        { id: '2', author: 'Bob', content: '有个问题想请教一下...', createdAt: '2024-01-03T11:30:00Z' },
    ];
}

/**
 * 评论数量显示组件（头部 inline 显示）
 * 点击后滚动到评论区
 */
export function CommentInline({ documentPath }: CapabilityComponentProps) {
    const [count, setCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComments(documentPath)
            .then(comments => setCount(comments.length))
            .finally(() => setLoading(false));
    }, [documentPath]);

    const handleClick = () => {
        const commentSection = document.getElementById('comment-section');
        if (commentSection) {
            commentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
        >
            <MessageSquare size={14} className="text-slate-400" />
            {loading ? '...' : `${count} 条评论`}
        </button>
    );
}

/**
 * 评论面板组件（文章下方显示）
 */
export function CommentPanel({ documentPath }: CapabilityComponentProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        fetchComments(documentPath)
            .then(setComments)
            .finally(() => setLoading(false));
    }, [documentPath]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        // TODO: 实现提交评论 API
        const comment: Comment = {
            id: String(Date.now()),
            author: '当前用户',
            content: newComment,
            createdAt: new Date().toISOString(),
        };
        setComments([...comments, comment]);
        setNewComment('');
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div id="comment-section" className="border-t border-slate-200 mt-12 pt-8 scroll-mt-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-6">
                <MessageSquare size={20} className="text-slate-500" />
                评论 ({comments.length})
            </h3>

            {/* 评论列表 */}
            {loading ? (
                <div className="text-slate-400 text-sm">加载评论中...</div>
            ) : comments.length === 0 ? (
                <div className="text-slate-400 text-sm py-8 text-center">
                    暂无评论，来发表第一条评论吧
                </div>
            ) : (
                <div className="space-y-4 mb-8">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 p-4 bg-slate-50 rounded-lg">
                            <div className="flex-shrink-0 w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                                <User size={16} className="text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-slate-700">{comment.author}</span>
                                    <span className="text-xs text-slate-400">{formatTime(comment.createdAt)}</span>
                                </div>
                                <p className="text-slate-600 text-sm">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 发表评论 */}
            <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <User size={16} className="text-purple-500" />
                </div>
                <div className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="写下你的评论..."
                        className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg
                                 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg
                                 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-colors flex items-center gap-1.5"
                    >
                        <Send size={14} />
                        发送
                    </button>
                </div>
            </form>
        </div>
    );
}

// 注册能力
registerCapability({
    id: 'comment',
    label: '评论',
    icon: 'message-square',
    description: '为文档添加评论和讨论',
    renderMode: 'inline',  // 头部使用 inline 模式显示评论数量
    ButtonComponent: CommentInline,  // 复用 ButtonComponent 字段，但渲染为 inline
    PanelComponent: CommentPanel,    // 文章下方的评论面板
    order: 40,
});
