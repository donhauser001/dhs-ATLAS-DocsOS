/**
 * TechInfoPanel - 技术信息浮动面板
 * 显示文档配置信息：类型包、文档类型、功能类型、显现模式、能力、组件配置、数据块结构
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Tag, FileType, Workflow, Info, X, Copy, Check, Database } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import YAML from 'yaml';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = React.ComponentType<any>;

/**
 * 获取 Lucide 图标组件
 */
function getIcon(iconName?: string): IconComponent | null {
    if (!iconName) return null;
    const pascalCase = iconName
        .split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (LucideIcons as any)[pascalCase] || null;
}

export interface DocTypeDisplay {
    category: string;
    label: string;
    icon?: string;
}

export interface FunctionDisplay {
    label: string;
    icon?: string;
}

export interface DataBlockStructure {
    type: string;
    fields: string[];
}

interface TechInfoPanelProps {
    frontmatter: Record<string, unknown>;
    content?: string;
    docTypeDisplay: DocTypeDisplay | null;
    functionDisplay: FunctionDisplay | null;
    displayModeLabels: string[];
    capabilities: string[];
    dataBlockStructure: DataBlockStructure[];
}

/** 生成可复制的文档模板 */
function generateDocumentTemplate(
    frontmatter: Record<string, unknown>,
    content: string
): string {
    // 1. 构建 frontmatter（移除数据相关字段，保留结构）
    const templateFrontmatter: Record<string, unknown> = {};

    // 保留结构性字段
    if (frontmatter['doc-type']) templateFrontmatter['doc-type'] = frontmatter['doc-type'];
    if (frontmatter.document_type) templateFrontmatter.document_type = frontmatter.document_type;

    // 设置占位符
    templateFrontmatter.title = '{{标题}}';
    templateFrontmatter.created = '{{创建时间}}';
    templateFrontmatter.updated = '{{更新时间}}';
    templateFrontmatter.author = '{{作者}}';

    // 保留 atlas 配置
    if (frontmatter.atlas) {
        templateFrontmatter.atlas = frontmatter.atlas;
    }

    // 保留 _components 定义
    if (frontmatter._components) {
        templateFrontmatter._components = frontmatter._components;
    }

    // 2. 使用 yaml 库生成 frontmatter
    const yamlContent = YAML.stringify(templateFrontmatter, {
        indent: 2,
        lineWidth: 0,
    });
    const frontmatterBlock = `---\n${yamlContent}---`;

    // 3. 解析并重建数据块（清空数据值）
    const bodyLines: string[] = [];
    const blockRegex = /```atlas-data\s*([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    // 查找标题行
    const titleMatch = content.match(/^#\s+.+$/m);
    if (titleMatch) {
        bodyLines.push('\n# {{标题}}\n');
    }

    while ((match = blockRegex.exec(content)) !== null) {
        // 查找这个块之前的标题（## 开头的行）
        const beforeBlock = content.slice(lastIndex, match.index);
        const sectionTitle = beforeBlock.match(/##\s+(.+)\s*$/m);
        if (sectionTitle) {
            bodyLines.push(`\n## ${sectionTitle[1]}\n`);
        }

        // 解析数据块
        const blockContent = match[1];
        const lines = blockContent.split('\n');
        let type = '';
        const fields: Array<{ key: string; defaultValue: string }> = [];
        const bindings: Array<{ key: string; comp: string }> = [];
        let inData = false;
        let inBindings = false;

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('type:')) {
                type = trimmed.replace('type:', '').trim();
            } else if (trimmed === 'data:') {
                inData = true;
                inBindings = false;
            } else if (trimmed === '_bindings:') {
                inData = false;
                inBindings = true;
            } else if (inData && trimmed.includes(':')) {
                const colonIdx = trimmed.indexOf(':');
                const key = trimmed.slice(0, colonIdx).trim();
                if (key && !key.startsWith('-')) {
                    fields.push({ key, defaultValue: '""' });
                }
            } else if (inBindings && trimmed.includes(':')) {
                const colonIdx = trimmed.indexOf(':');
                const key = trimmed.slice(0, colonIdx).trim();
                const comp = trimmed.slice(colonIdx + 1).trim();
                if (key && comp) {
                    bindings.push({ key, comp });
                }
            }
        }

        // 重建数据块
        const blockLines = ['```atlas-data', `type: ${type}`, 'data:'];
        for (const field of fields) {
            blockLines.push(`  ${field.key}: ${field.defaultValue}`);
        }
        if (bindings.length > 0) {
            blockLines.push('_bindings:');
            for (const b of bindings) {
                blockLines.push(`  ${b.key}: ${b.comp}`);
            }
        }
        blockLines.push('```');

        bodyLines.push(blockLines.join('\n'));
        lastIndex = match.index + match[0].length;
    }

    return frontmatterBlock + bodyLines.join('\n') + '\n';
}

export function TechInfoPanel({
    frontmatter,
    content,
    docTypeDisplay,
    functionDisplay,
    displayModeLabels,
    capabilities,
    dataBlockStructure,
}: TechInfoPanelProps) {
    const [showTechInfo, setShowTechInfo] = useState(false);
    const [copied, setCopied] = useState(false);
    const techInfoRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭配置弹窗
    useEffect(() => {
        if (!showTechInfo) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (techInfoRef.current && !techInfoRef.current.contains(event.target as Node)) {
                setShowTechInfo(false);
            }
        };

        const timer = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showTechInfo]);

    // 复制文档结构到剪贴板
    const handleCopyTemplate = useCallback(async () => {
        if (!content) return;

        try {
            const template = generateDocumentTemplate(frontmatter, content);
            await navigator.clipboard.writeText(template);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('复制失败:', err);
        }
    }, [frontmatter, content]);

    // 如果没有配置信息，不显示按钮
    if (!docTypeDisplay && !functionDisplay) {
        return null;
    }

    const docType = frontmatter['doc-type'];

    return (
        <div className="relative" ref={techInfoRef}>
            <button
                type="button"
                onClick={() => setShowTechInfo(!showTechInfo)}
                className={cn(
                    "inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors",
                    showTechInfo
                        ? "text-purple-600 bg-purple-50"
                        : "text-slate-500 hover:text-purple-600 hover:bg-purple-50"
                )}
                title="查看文档配置"
            >
                <Info size={14} />
                配置
            </button>

            {/* 属性信息浮动面板 */}
            {showTechInfo && (
                <div className="absolute left-0 top-full mt-2 z-50 w-80 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-medium text-slate-600">文档配置信息</span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleCopyTemplate}
                                className={cn(
                                    "p-1 rounded transition-colors",
                                    copied
                                        ? "text-green-500 bg-green-50"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                )}
                                title="复制文档结构"
                            >
                                {copied ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowTechInfo(false)}
                                className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        <div className="p-3 space-y-3 text-sm">
                            {/* doc-type */}
                            {docType && (
                                <div className="flex items-start gap-2">
                                    <Tag size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-slate-400">类型包</div>
                                        <div className="text-slate-700 font-medium">{String(docType)}</div>
                                    </div>
                                </div>
                            )}

                            {/* 文档类型 */}
                            {docTypeDisplay && (
                                <div className="flex items-start gap-2">
                                    {docTypeDisplay.icon ? (
                                        (() => {
                                            const Icon = getIcon(docTypeDisplay.icon);
                                            return Icon ? <Icon size={14} className="text-purple-500 mt-0.5 flex-shrink-0" /> : <FileType size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />;
                                        })()
                                    ) : (
                                        <FileType size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-slate-400">文档类型</div>
                                        <div className="text-slate-700 font-medium">{docTypeDisplay.label}</div>
                                    </div>
                                </div>
                            )}

                            {/* 功能类型 */}
                            {functionDisplay && (
                                <div className="flex items-start gap-2">
                                    {functionDisplay.icon ? (
                                        (() => {
                                            const Icon = getIcon(functionDisplay.icon);
                                            return Icon ? <Icon size={14} className="text-blue-500 mt-0.5 flex-shrink-0" /> : <Workflow size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />;
                                        })()
                                    ) : (
                                        <Workflow size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-slate-400">功能类型</div>
                                        <div className="text-slate-700 font-medium">{functionDisplay.label}</div>
                                    </div>
                                </div>
                            )}

                            {/* 显现模式 */}
                            {displayModeLabels.length > 0 && (
                                <div className="flex items-start gap-2">
                                    <Workflow size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-slate-400">显现模式</div>
                                        <div className="text-slate-700">{displayModeLabels.join('、')}</div>
                                    </div>
                                </div>
                            )}

                            {/* 能力列表 */}
                            {capabilities.length > 0 && (
                                <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                                    <Workflow size={14} className="text-cyan-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-slate-400 mb-1">能力 ({capabilities.length})</div>
                                        <div className="flex flex-wrap gap-1">
                                            {capabilities.map((cap: string) => (
                                                <span key={cap} className="inline-block px-1.5 py-0.5 text-xs bg-cyan-50 text-cyan-700 rounded">
                                                    {cap}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 组件配置 */}
                            {frontmatter._components && typeof frontmatter._components === 'object' && (
                                <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                                    <Workflow size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-slate-400 mb-1">
                                            组件配置 ({Object.keys(frontmatter._components as object).length})
                                        </div>
                                        <div className="space-y-1">
                                            {Object.entries(frontmatter._components as Record<string, { type?: string; label?: string }>).map(([id, comp]) => (
                                                <div key={id} className="flex items-center gap-1.5 text-xs">
                                                    <span className="text-slate-400 font-mono truncate max-w-[80px]" title={id}>{id.slice(-8)}</span>
                                                    <span className="text-slate-300">→</span>
                                                    <span className="text-purple-600">{comp.type || 'unknown'}</span>
                                                    {comp.label && <span className="text-slate-500">({comp.label})</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 数据块结构 */}
                            {dataBlockStructure.length > 0 && (
                                <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                                    <Database size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-slate-400 mb-1">
                                            数据块结构 ({dataBlockStructure.length})
                                        </div>
                                        <div className="space-y-2">
                                            {dataBlockStructure.map((block, idx) => (
                                                <div key={idx} className="bg-slate-50 rounded p-1.5">
                                                    <div className="text-xs font-medium text-indigo-600 mb-1">{block.type}</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {block.fields.map((field) => (
                                                            <span key={field} className="inline-block px-1.5 py-0.5 text-xs bg-white text-slate-600 rounded border border-slate-200">
                                                                {field}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TechInfoPanel;
