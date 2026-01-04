/**
 * DisplayRenderer - 显现模式渲染器选择器
 * 
 * 根据当前的显现模式（displayMode）选择并渲染对应的渲染器
 * 
 * 架构设计：
 * - 渲染器注册表：静态映射 displayMode -> Renderer 组件
 * - 默认渲染器：当没有匹配的渲染器时，使用 article.single 作为默认
 * - 可扩展：新增显现模式只需注册对应的渲染器
 * - 能力面板：自动在文章下方渲染能力面板（如评论）
 */

import type { DisplayRendererProps } from './types';
// 文章类渲染器
import {
    ArticleSingleRenderer,
    ArticleDoubleRenderer,
    ArticleZenRenderer
} from './article';
// 列表类渲染器
import {
    ListCardRenderer,
    ListTableRenderer,
    ListCompactRenderer
} from './list';
// 看板类渲染器
import {
    KanbanColumnRenderer,
    KanbanSwimlaneRenderer
} from './kanban';
// 时间线类渲染器
import {
    TimelineVerticalRenderer,
    TimelineHorizontalRenderer,
    TimelineGanttRenderer
} from './timeline';
// 日历类渲染器
import {
    CalendarMonthRenderer,
    CalendarWeekRenderer,
    CalendarHeatmapRenderer
} from './calendar';
// 结构类渲染器
import {
    TreeOutlineRenderer,
    TreeMindmapRenderer,
    GraphNetworkRenderer
} from './structure';
// 画廊类渲染器
import {
    GalleryGridRenderer,
    GalleryMasonryRenderer,
    GalleryShelfRenderer
} from './gallery';
// 详情类渲染器
import {
    DetailCardRenderer,
    DetailFormRenderer,
    DetailSplitRenderer
} from './detail';
// 能力面板
import { CapabilityPanels } from '@/components/capabilities';

// ============================================================
// 渲染器注册表
// ============================================================

/**
 * 显现模式到渲染器的映射
 * 
 * 注意：新增显现模式时，在此注册对应的渲染器组件
 */
const DISPLAY_RENDERERS: Record<string, React.ComponentType<DisplayRendererProps>> = {
    // 文章类
    'article.single': ArticleSingleRenderer,
    'article.double': ArticleDoubleRenderer,
    'article.zen': ArticleZenRenderer,

    // 列表类
    'list.card': ListCardRenderer,
    'list.table': ListTableRenderer,
    'list.compact': ListCompactRenderer,

    // 看板类
    'kanban.column': KanbanColumnRenderer,
    'kanban.swimlane': KanbanSwimlaneRenderer,

    // 时间线类
    'timeline.vertical': TimelineVerticalRenderer,
    'timeline.horizontal': TimelineHorizontalRenderer,
    'timeline.gantt': TimelineGanttRenderer,

    // 日历类
    'calendar.month': CalendarMonthRenderer,
    'calendar.week': CalendarWeekRenderer,
    'calendar.heatmap': CalendarHeatmapRenderer,

    // 结构类
    'tree.outline': TreeOutlineRenderer,
    'tree.mindmap': TreeMindmapRenderer,
    'graph.network': GraphNetworkRenderer,

    // 画廊类
    'gallery.grid': GalleryGridRenderer,
    'gallery.masonry': GalleryMasonryRenderer,
    'gallery.shelf': GalleryShelfRenderer,

    // 详情类
    'detail.card': DetailCardRenderer,
    'detail.form': DetailFormRenderer,
    'detail.split': DetailSplitRenderer,
};

/**
 * 默认渲染器
 */
const DEFAULT_RENDERER = ArticleSingleRenderer;

// ============================================================
// 主组件
// ============================================================

export interface DisplayRendererSelectorProps extends DisplayRendererProps {
    /** 当前显现模式 ID */
    displayMode: string;
    /** 能力列表（用于渲染面板组件） */
    capabilities?: string[];
}

/**
 * 显现模式渲染器选择器
 * 
 * @param displayMode - 当前显现模式 ID（如 'article.single'）
 * @param capabilities - 能力列表
 * @param props - 传递给渲染器的 props
 */
export function DisplayRenderer({
    displayMode,
    capabilities = [],
    ...props
}: DisplayRendererSelectorProps) {
    // 获取对应的渲染器，如果没有则使用默认渲染器
    const Renderer = DISPLAY_RENDERERS[displayMode] || DEFAULT_RENDERER;

    return (
        <div className="flex flex-col">
            {/* 主内容渲染 */}
            <Renderer {...props} />

            {/* 能力面板（如评论区） */}
            {capabilities.length > 0 && props.documentPath && (
                <div className="max-w-[1200px] mx-auto px-8 w-full">
                    <CapabilityPanels
                        capabilities={capabilities}
                        documentPath={props.documentPath}
                        frontmatter={props.frontmatter}
                        readonly={props.readonly}
                    />
                </div>
            )}
        </div>
    );
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 检查显现模式是否已注册渲染器
 */
export function hasRenderer(displayMode: string): boolean {
    return displayMode in DISPLAY_RENDERERS;
}

/**
 * 获取所有已注册的显现模式
 */
export function getRegisteredModes(): string[] {
    return Object.keys(DISPLAY_RENDERERS);
}

/**
 * 注册新的渲染器（用于动态扩展）
 */
export function registerRenderer(
    displayMode: string,
    renderer: React.ComponentType<DisplayRendererProps>
): void {
    DISPLAY_RENDERERS[displayMode] = renderer;
}

export default DisplayRenderer;

