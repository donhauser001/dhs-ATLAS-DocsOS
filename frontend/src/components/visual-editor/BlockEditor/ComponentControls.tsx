/**
 * ComponentControls - 组件控件渲染器
 * 
 * 此文件保留用于向后兼容
 * 实际实现已迁移至 ComponentRegistry 插件化架构
 * 
 * @deprecated 推荐直接从 '../ComponentRegistry' 导入
 */

// 从新的 ComponentRegistry 导入并重新导出
export { 
    ComponentControl, 
    type ComponentControlProps,
    FallbackControl,
} from '../ComponentRegistry';

// 默认导出
export { ComponentControl as default } from '../ComponentRegistry';
