/**
 * DocumentLink 组件 - 数据块控件
 */

import { useState, useEffect, useCallback } from 'react';
import { FileText, Search, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, DocumentLinkComponentDefinition } from '../../types';

interface DocumentInfo {
    path: string;
    title: string;
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const docLinkDef = component as DocumentLinkComponentDefinition;
    const [showPicker, setShowPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [documents, setDocuments] = useState<DocumentInfo[]>([]);
    const [loading, setLoading] = useState(false);

    const stringValue = typeof value === 'string' ? value : '';
    const arrayValue = Array.isArray(value) ? value : stringValue ? [stringValue] : [];

    // 获取文档列表
    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/workspace');
            if (response.ok) {
                const data = await response.json();
                const docs = data.documents?.map((d: { path: string; title: string }) => ({
                    path: d.path,
                    title: d.title,
                })) || [];
                setDocuments(docs);
            }
        } catch (error) {
            console.error('获取文档列表失败:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (showPicker) {
            fetchDocuments();
        }
    }, [showPicker, fetchDocuments]);

    // 过滤文档
    const filteredDocs = documents.filter(doc => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return doc.title.toLowerCase().includes(query) || doc.path.toLowerCase().includes(query);
    });

    const handleSelect = (doc: DocumentInfo) => {
        if (docLinkDef.allowMultiple) {
            const newValue = arrayValue.includes(doc.path)
                ? arrayValue.filter(p => p !== doc.path)
                : [...arrayValue, doc.path];
            onChange(newValue.length > 0 ? newValue : null);
        } else {
            onChange(doc.path);
            setShowPicker(false);
        }
    };

    const handleRemove = (path: string) => {
        if (docLinkDef.allowMultiple) {
            const newValue = arrayValue.filter(p => p !== path);
            onChange(newValue.length > 0 ? newValue : null);
        } else {
            onChange(null);
        }
    };

    const handleOpen = (path: string) => {
        // 打开文档（可以跳转到文档页面）
        window.open(`/#/document/${encodeURIComponent(path)}`, '_blank');
    };

    const getDocTitle = (path: string): string => {
        const doc = documents.find(d => d.path === path);
        return doc?.title || path.split('/').pop()?.replace('.md', '') || path;
    };

    return (
        <div className="space-y-2">
            {/* 已选文档 */}
            {arrayValue.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {arrayValue.map((path) => (
                        <div
                            key={path}
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg"
                        >
                            <FileText className="h-4 w-4 text-purple-500" />
                            <span className="text-sm text-slate-700">
                                {getDocTitle(path)}
                            </span>
                            {docLinkDef.showPath && (
                                <span className="text-xs text-slate-400">({path})</span>
                            )}
                            <button
                                type="button"
                                onClick={() => handleOpen(path)}
                                className="p-0.5 text-slate-400 hover:text-purple-500"
                                title="打开文档"
                            >
                                <ExternalLink className="h-3 w-3" />
                            </button>
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => handleRemove(path)}
                                    className="p-0.5 text-slate-400 hover:text-red-500"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 选择按钮 */}
            {!disabled && (docLinkDef.allowMultiple || arrayValue.length === 0) && (
                <button
                    type="button"
                    onClick={() => setShowPicker(true)}
                    className={cn(
                        'flex items-center gap-2 px-3 py-2 text-sm',
                        'border border-dashed border-slate-300 rounded-lg',
                        'hover:border-purple-300 hover:bg-purple-50/50 transition-colors',
                        'text-slate-500'
                    )}
                >
                    <Search className="h-4 w-4" />
                    {docLinkDef.placeholder || '选择文档...'}
                </button>
            )}

            {/* 文档选择面板 */}
            {showPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                    <div className="w-96 max-h-[80vh] bg-white rounded-lg shadow-xl border border-slate-200">
                        <div className="p-4 border-b border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-medium text-slate-800">选择文档</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowPicker(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="搜索文档..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg
                                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {loading ? (
                                <p className="p-4 text-center text-sm text-slate-400">加载中...</p>
                            ) : filteredDocs.length === 0 ? (
                                <p className="p-4 text-center text-sm text-slate-400">未找到文档</p>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {filteredDocs.map((doc) => (
                                        <button
                                            key={doc.path}
                                            type="button"
                                            onClick={() => handleSelect(doc)}
                                            className={cn(
                                                'w-full p-3 text-left hover:bg-slate-50 transition-colors',
                                                arrayValue.includes(doc.path) && 'bg-purple-50'
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-slate-400" />
                                                <span className="text-sm font-medium text-slate-700">
                                                    {doc.title}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-400 ml-6">
                                                {doc.path}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Control;


