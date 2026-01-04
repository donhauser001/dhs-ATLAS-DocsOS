/**
 * 显现模式渲染器模块
 * 
 * 提供基于 atlas.display 配置的文档内容渲染
 * 
 * 目录结构：
 * - article/  文章类渲染器（single, double, zen）
 * - list/     列表类渲染器（card, table, compact）
 * - detail/   详情类渲染器（card, form）[TODO]
 * - kanban/   看板类渲染器（column, swimlane）[TODO]
 */

// 类型
export type { DisplayRendererProps, DisplayModeDefinition, DisplayModeContext } from './types';

// 渲染器选择器
export { DisplayRenderer, hasRenderer, getRegisteredModes, registerRenderer } from './DisplayRenderer';

// 文章类渲染器
export {
    ArticleSingleRenderer,
    ArticleDoubleRenderer,
    ArticleZenRenderer
} from './article';

// 列表类渲染器
export {
    ListCardRenderer,
    ListTableRenderer,
    ListCompactRenderer
} from './list';

// 看板类渲染器
export {
    KanbanColumnRenderer,
    KanbanSwimlaneRenderer
} from './kanban';

// 时间线类渲染器
export {
    TimelineVerticalRenderer,
    TimelineHorizontalRenderer,
    TimelineGanttRenderer
} from './timeline';

// 日历类渲染器
export {
    CalendarMonthRenderer,
    CalendarWeekRenderer,
    CalendarHeatmapRenderer
} from './calendar';

// 结构类渲染器
export {
    TreeOutlineRenderer,
    TreeMindmapRenderer,
    GraphNetworkRenderer
} from './structure';

// 画廊类渲染器
export {
    GalleryGridRenderer,
    GalleryMasonryRenderer,
    GalleryShelfRenderer
} from './gallery';

// 详情类渲染器
export {
    DetailCardRenderer,
    DetailFormRenderer,
    DetailSplitRenderer
} from './detail';
