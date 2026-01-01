/**
 * RendererSelector - 渲染器选择器
 * 
 * Phase 3.3: 功能声明系统
 * 
 * 根据文档的 atlas.function 声明自动选择合适的渲染器
 */

import { type ADLDocument, type Block, type AtlasFunctionType } from '@/types/adl';
import { DocumentViewer } from '@/components/document/DocumentViewer';
import { EntityListRenderer } from '@/components/renderers/EntityListRenderer';

// ============================================================
// 类型定义
// ============================================================

export interface RendererSelectorProps {
    /** ADL 文档 */
    document: ADLDocument;
    /** 选中的 Block anchor */
    selectedAnchor?: string;
    /** Block 点击回调 */
    onBlockClick?: (block: Block) => void;
    /** 是否为编辑模式 */
    isEditing?: boolean;
    /** 编辑器内容（编辑模式用） */
    editorContent?: string;
    /** 编辑器内容变更回调 */
    onEditorChange?: (content: string) => void;
}

// ============================================================
// 功能渲染器映射
// ============================================================

type RendererComponent = React.ComponentType<RendererSelectorProps>;

/**
 * 功能类型到渲染器的映射
 * 
 * Phase 3.3: 根据功能声明选择渲染器
 */
const FUNCTION_RENDERERS: Partial<Record<AtlasFunctionType, RendererComponent>> = {
    entity_list: EntityListRenderer,
    // principal: PrincipalRenderer,
    // dashboard: DashboardRenderer,
};

// ============================================================
// 主组件
// ============================================================

export function RendererSelector({
    document,
    selectedAnchor,
    onBlockClick,
    isEditing,
    editorContent,
    onEditorChange,
}: RendererSelectorProps) {
    const atlasFunction = document.frontmatter?.atlas?.function;

    // 编辑模式直接返回编辑器（不使用特殊渲染器）
    if (isEditing) {
        return (
            <DefaultDocumentRenderer
                document={document}
                selectedAnchor={selectedAnchor}
                onBlockClick={onBlockClick}
                isEditing={isEditing}
                editorContent={editorContent}
                onEditorChange={onEditorChange}
            />
        );
    }

    // 根据功能类型选择渲染器
    if (atlasFunction && FUNCTION_RENDERERS[atlasFunction]) {
        const Renderer = FUNCTION_RENDERERS[atlasFunction]!;
        return (
            <Renderer
                document={document}
                selectedAnchor={selectedAnchor}
                onBlockClick={onBlockClick}
            />
        );
    }

    // 默认渲染器
    return (
        <DefaultDocumentRenderer
            document={document}
            selectedAnchor={selectedAnchor}
            onBlockClick={onBlockClick}
        />
    );
}

// ============================================================
// 默认文档渲染器
// ============================================================

function DefaultDocumentRenderer({
    document,
    selectedAnchor,
    onBlockClick,
    isEditing,
    editorContent,
    onEditorChange,
}: RendererSelectorProps) {
    if (isEditing) {
        // 编辑模式：使用简单的文本编辑器
        return (
            <div className="editor-container h-full">
                <textarea
                    className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none"
                    style={{
                        backgroundColor: 'var(--ui-block-body-bg)',
                        color: 'var(--ui-field-value-color)',
                        border: '1px solid var(--ui-block-body-border)',
                        borderRadius: '0.5rem',
                    }}
                    value={editorContent}
                    onChange={(e) => onEditorChange?.(e.target.value)}
                    placeholder="在此编辑文档内容..."
                />
            </div>
        );
    }

    // 阅读模式：使用 DocumentViewer
    return (
        <DocumentViewer
            document={document}
            selectedAnchor={selectedAnchor}
            onBlockClick={onBlockClick}
        />
    );
}

// ============================================================
// 注册渲染器（用于动态扩展）
// ============================================================

/**
 * 注册自定义渲染器
 * 
 * @param functionType 功能类型
 * @param renderer 渲染器组件
 */
export function registerRenderer(
    functionType: AtlasFunctionType,
    renderer: RendererComponent
): void {
    FUNCTION_RENDERERS[functionType] = renderer;
}

/**
 * 获取已注册的渲染器
 */
export function getRenderer(functionType: AtlasFunctionType): RendererComponent | undefined {
    return FUNCTION_RENDERERS[functionType];
}

export default RendererSelector;

