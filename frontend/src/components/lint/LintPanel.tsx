/**
 * LintPanel - 校验面板
 * 
 * Phase 3.3: 文档校验系统
 * 
 * 功能：
 * - 显示校验报告概览
 * - 按错误级别分类显示
 * - 点击跳转到问题文档/Block
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    AlertTriangle,
    Info,
    Lightbulb,
    CheckCircle,
    RefreshCw,
    ChevronDown,
    ChevronRight,
    FileText,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================
// 类型定义
// ============================================================

type LintLevel = 'error' | 'warning' | 'info' | 'hint';

interface LintIssue {
    level: LintLevel;
    rule: string;
    message: string;
    location: {
        block?: string;
        line?: number;
        field?: string;
    };
    suggestion?: string;
}

interface DocumentLintResult {
    path: string;
    issues: LintIssue[];
    passed: boolean;
}

interface LintReport {
    version: string;
    generated_at: string;
    summary: {
        total_documents: number;
        passed_count: number;
        failed_count: number;
        error_count: number;
        warning_count: number;
        info_count: number;
        hint_count: number;
    };
    documents: DocumentLintResult[];
}

interface LintPanelProps {
    /** 是否显示 */
    visible?: boolean;
    /** 关闭回调 */
    onClose?: () => void;
    /** 位置 */
    position?: 'bottom' | 'right';
}

// ============================================================
// 图标和颜色映射
// ============================================================

const LEVEL_CONFIG: Record<LintLevel, { icon: typeof AlertCircle; color: string; bg: string; label: string }> = {
    error: {
        icon: AlertCircle,
        color: '#ef4444',
        bg: '#fef2f2',
        label: '错误',
    },
    warning: {
        icon: AlertTriangle,
        color: '#f59e0b',
        bg: '#fffbeb',
        label: '警告',
    },
    info: {
        icon: Info,
        color: '#3b82f6',
        bg: '#eff6ff',
        label: '信息',
    },
    hint: {
        icon: Lightbulb,
        color: '#8b5cf6',
        bg: '#f5f3ff',
        label: '提示',
    },
};

// ============================================================
// 主组件
// ============================================================

export function LintPanel({ visible = true, onClose, position = 'bottom' }: LintPanelProps) {
    const navigate = useNavigate();
    const [report, setReport] = useState<LintReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [running, setRunning] = useState(false);
    const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
    const [filterLevel, setFilterLevel] = useState<LintLevel | 'all'>('all');

    // 获取报告
    useEffect(() => {
        fetchReport();
    }, []);

    async function fetchReport() {
        setLoading(true);
        try {
            const response = await fetch('/api/lint');
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    setReport(result.data);
                }
            }
        } catch (err) {
            console.error('[LintPanel] Failed to fetch report:', err);
        } finally {
            setLoading(false);
        }
    }

    // 运行校验
    async function runLint() {
        setRunning(true);
        try {
            const response = await fetch('/api/lint/run', { method: 'POST' });
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setReport(result.data);
                }
            }
        } catch (err) {
            console.error('[LintPanel] Failed to run lint:', err);
        } finally {
            setRunning(false);
        }
    }

    // 切换文档展开
    function toggleDoc(path: string) {
        const newExpanded = new Set(expandedDocs);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedDocs(newExpanded);
    }

    // 跳转到文档
    function goToDocument(path: string, anchor?: string) {
        let url = `/workspace/${path}`;
        if (anchor) {
            url += `#${anchor}`;
        }
        navigate(url);
    }

    // 过滤文档
    const filteredDocs = report?.documents.filter(doc => {
        if (filterLevel === 'all') {
            return doc.issues.length > 0;
        }
        return doc.issues.some(i => i.level === filterLevel);
    }) || [];

    if (!visible) return null;

    const panelStyle = position === 'bottom'
        ? 'fixed bottom-0 left-0 right-0 h-64 border-t'
        : 'fixed right-0 top-0 bottom-0 w-96 border-l';

    return (
        <div
            className={`lint-panel ${panelStyle} z-50`}
            style={{
                backgroundColor: 'var(--ui-block-body-bg)',
                borderColor: 'var(--ui-block-body-border)',
            }}
        >
            {/* 头部 */}
            <div
                className="flex items-center justify-between px-4 py-2 border-b"
                style={{ borderColor: 'var(--ui-block-body-border)' }}
            >
                <div className="flex items-center gap-4">
                    <h3
                        className="font-semibold"
                        style={{ color: 'var(--ui-field-value-color)' }}
                    >
                        文档校验
                    </h3>

                    {/* 统计摘要 */}
                    {report && (
                        <div className="flex items-center gap-3 text-sm">
                            <SummaryBadge level="error" count={report.summary.error_count} />
                            <SummaryBadge level="warning" count={report.summary.warning_count} />
                            <SummaryBadge level="info" count={report.summary.info_count} />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* 过滤器 */}
                    <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value as LintLevel | 'all')}
                        className="text-sm px-2 py-1 rounded border"
                        style={{
                            backgroundColor: 'var(--ui-block-body-bg)',
                            borderColor: 'var(--ui-block-body-border)',
                            color: 'var(--ui-field-value-color)',
                        }}
                    >
                        <option value="all">全部</option>
                        <option value="error">错误</option>
                        <option value="warning">警告</option>
                        <option value="info">信息</option>
                        <option value="hint">提示</option>
                    </select>

                    {/* 刷新按钮 */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={runLint}
                        disabled={running}
                    >
                        <RefreshCw size={16} className={running ? 'animate-spin' : ''} />
                    </Button>

                    {/* 关闭按钮 */}
                    {onClose && (
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X size={16} />
                        </Button>
                    )}
                </div>
            </div>

            {/* 内容 */}
            <div className="overflow-auto h-[calc(100%-48px)]">
                {loading && (
                    <div
                        className="flex items-center justify-center h-full"
                        style={{ color: 'var(--ui-field-label-color)' }}
                    >
                        加载中...
                    </div>
                )}

                {!loading && !report && (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <p style={{ color: 'var(--ui-field-label-color)' }}>
                            暂无校验报告
                        </p>
                        <Button onClick={runLint} disabled={running}>
                            运行校验
                        </Button>
                    </div>
                )}

                {!loading && report && filteredDocs.length === 0 && (
                    <div className="flex items-center justify-center h-full gap-2">
                        <CheckCircle size={20} className="text-green-500" />
                        <span style={{ color: 'var(--ui-field-value-color)' }}>
                            所有文档校验通过！
                        </span>
                    </div>
                )}

                {!loading && report && filteredDocs.length > 0 && (
                    <div className="py-2">
                        {filteredDocs.map((doc) => (
                            <DocumentIssues
                                key={doc.path}
                                doc={doc}
                                expanded={expandedDocs.has(doc.path)}
                                onToggle={() => toggleDoc(doc.path)}
                                onGoToDocument={goToDocument}
                                filterLevel={filterLevel}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================
// 子组件
// ============================================================

function SummaryBadge({ level, count }: { level: LintLevel; count: number }) {
    if (count === 0) return null;

    const config = LEVEL_CONFIG[level];
    const Icon = config.icon;

    return (
        <span
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
            style={{ backgroundColor: config.bg, color: config.color }}
        >
            <Icon size={12} />
            {count}
        </span>
    );
}

interface DocumentIssuesProps {
    doc: DocumentLintResult;
    expanded: boolean;
    onToggle: () => void;
    onGoToDocument: (path: string, anchor?: string) => void;
    filterLevel: LintLevel | 'all';
}

function DocumentIssues({
    doc,
    expanded,
    onToggle,
    onGoToDocument,
    filterLevel,
}: DocumentIssuesProps) {
    const filteredIssues = filterLevel === 'all'
        ? doc.issues
        : doc.issues.filter(i => i.level === filterLevel);

    if (filteredIssues.length === 0) return null;

    return (
        <div className="border-b" style={{ borderColor: 'var(--ui-block-body-border)' }}>
            {/* 文档头 */}
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-left"
            >
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <FileText size={16} style={{ color: 'var(--ui-field-label-color)' }} />
                <span
                    className="flex-1 text-sm truncate"
                    style={{ color: 'var(--ui-field-value-color)' }}
                >
                    {doc.path}
                </span>
                <span
                    className="text-xs"
                    style={{ color: 'var(--ui-field-label-color)' }}
                >
                    {filteredIssues.length} 个问题
                </span>
            </button>

            {/* 问题列表 */}
            {expanded && (
                <div className="pl-8 pr-4 pb-2 space-y-1">
                    {filteredIssues.map((issue, idx) => (
                        <IssueItem
                            key={idx}
                            issue={issue}
                            onClick={() => onGoToDocument(doc.path, issue.location.block)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function IssueItem({ issue, onClick }: { issue: LintIssue; onClick: () => void }) {
    const config = LEVEL_CONFIG[issue.level];
    const Icon = config.icon;

    return (
        <button
            onClick={onClick}
            className="w-full flex items-start gap-2 p-2 rounded hover:bg-gray-50 text-left"
        >
            <Icon size={14} style={{ color: config.color, marginTop: 2 }} />
            <div className="flex-1 min-w-0">
                <p
                    className="text-sm"
                    style={{ color: 'var(--ui-field-value-color)' }}
                >
                    {issue.message}
                </p>
                <div
                    className="flex items-center gap-2 text-xs mt-1"
                    style={{ color: 'var(--ui-field-label-color)' }}
                >
                    <span className="font-mono">{issue.rule}</span>
                    {issue.location.block && (
                        <span>#{issue.location.block}</span>
                    )}
                    {issue.location.field && (
                        <span>.{issue.location.field}</span>
                    )}
                </div>
                {issue.suggestion && (
                    <p
                        className="text-xs mt-1 italic"
                        style={{ color: config.color }}
                    >
                        💡 {issue.suggestion}
                    </p>
                )}
            </div>
        </button>
    );
}

export default LintPanel;

