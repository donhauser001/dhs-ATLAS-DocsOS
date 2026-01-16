/**
 * ReadModePanel - 阅读模式属性面板
 * 显示文档元信息和能力操作
 */

import { MetaInfoRow } from './MetaInfoRow';
import { TechInfoPanel, type DocTypeDisplay, type FunctionDisplay, type DataBlockStructure } from './TechInfoPanel';
import { ViewSwitcher } from './ViewSwitcher';
import { CapabilityActions } from '@/components/capabilities';

interface ReadModePanelProps {
    frontmatter: Record<string, unknown>;
    content?: string;
    documentPath?: string;
    displayMode?: string;
    displayModes: string[];
    onDisplayModeChange?: (mode: string) => void;
    docTypeDisplay: DocTypeDisplay | null;
    functionDisplay: FunctionDisplay | null;
    displayModeLabels: string[];
    capabilities: string[];
    dataBlockStructure: DataBlockStructure[];
}

export function ReadModePanel({
    frontmatter,
    content,
    documentPath,
    displayMode,
    displayModes,
    onDisplayModeChange,
    docTypeDisplay,
    functionDisplay,
    displayModeLabels,
    capabilities,
    dataBlockStructure,
}: ReadModePanelProps) {
    return (
        <div className="bg-white border-b border-slate-100">
            <div className="px-6 py-3">
                {/* 操作按钮 + 视图切换器 */}
                <div className="flex items-center justify-between gap-4">
                    {/* 元信息行：作者 · 时间 · 标签 · 评论数 · 属性按钮 */}
                    <div className="flex items-center gap-4">
                        <MetaInfoRow frontmatter={frontmatter} />

                        {/* inline 类型能力（如评论数） */}
                        {capabilities.length > 0 && documentPath && (
                            <CapabilityActions
                                capabilities={capabilities}
                                documentPath={documentPath}
                                frontmatter={frontmatter}
                                renderMode="inline"
                            />
                        )}

                        {/* 配置按钮（技术信息） */}
                        <TechInfoPanel
                            frontmatter={frontmatter}
                            content={content}
                            docTypeDisplay={docTypeDisplay}
                            functionDisplay={functionDisplay}
                            displayModeLabels={displayModeLabels}
                            capabilities={capabilities}
                            dataBlockStructure={dataBlockStructure}
                        />
                    </div>

                    {/* 右侧：能力操作按钮 + 视图切换器 */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* 能力操作按钮（仅 button 类型） */}
                        {capabilities.length > 0 && documentPath && (
                            <CapabilityActions
                                capabilities={capabilities}
                                documentPath={documentPath}
                                frontmatter={frontmatter}
                                renderMode="button"
                            />
                        )}

                        {/* 视图切换器（如果有多个显现模式） */}
                        {displayModes.length > 1 && documentPath && (
                            <ViewSwitcher
                                documentPath={documentPath}
                                availableModes={displayModes}
                                activeMode={displayMode}
                                onModeChange={onDisplayModeChange}
                                compact
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReadModePanel;
