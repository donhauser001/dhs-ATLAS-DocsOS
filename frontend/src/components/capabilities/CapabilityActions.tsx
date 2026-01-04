/**
 * 能力操作组件
 * 
 * 根据文档的能力配置，自动渲染对应的操作按钮/内联组件
 * 从注册表获取能力组件，实现解耦
 */

import { capabilityRegistry } from './registry';
import type { CapabilityComponentProps, CapabilityDefinition } from './types';

export interface CapabilityActionsProps {
    /** 能力 ID 列表 */
    capabilities: string[];
    /** 文档路径 */
    documentPath: string;
    /** 文档 frontmatter */
    frontmatter: Record<string, unknown>;
    /** 是否只读 */
    readonly?: boolean;
    /** 只渲染指定类型（可选，默认渲染 button 类型） */
    renderMode?: 'button' | 'inline' | 'all';
}

/**
 * 能力操作按钮组（用于头部区域）
 * 默认只渲染 button 模式的组件
 */
export function CapabilityActions({
    capabilities,
    documentPath,
    frontmatter,
    readonly = false,
    renderMode = 'button',
}: CapabilityActionsProps) {
    if (capabilities.length === 0) return null;

    // 从注册表获取能力定义
    const capabilityDefs = capabilityRegistry.getByIds(capabilities);

    if (capabilityDefs.length === 0) return null;

    // 根据 renderMode 过滤
    let defsToRender: CapabilityDefinition[] = [];
    if (renderMode === 'button') {
        defsToRender = capabilityDefs.filter(d => d.renderMode === 'button');
    } else if (renderMode === 'inline') {
        defsToRender = capabilityDefs.filter(d => d.renderMode === 'inline');
    } else {
        defsToRender = capabilityDefs.filter(d => d.renderMode === 'button' || d.renderMode === 'inline');
    }

    if (defsToRender.length === 0) return null;

    const renderComponent = (def: CapabilityDefinition) => {
        const Comp = def.ButtonComponent;
        if (!Comp) return null;
        return (
            <Comp
                key={def.id}
                capabilityId={def.id}
                documentPath={documentPath}
                frontmatter={frontmatter}
                readonly={readonly}
            />
        );
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {defsToRender.map(renderComponent)}
        </div>
    );
}

/**
 * 能力面板组（用于文章下方区域）
 * 渲染 panel 模式的组件
 */
export function CapabilityPanels({
    capabilities,
    documentPath,
    frontmatter,
    readonly = false,
}: CapabilityActionsProps) {
    if (capabilities.length === 0) return null;

    // 从注册表获取能力定义，只获取有 PanelComponent 的
    const capabilityDefs = capabilityRegistry.getByIds(capabilities)
        .filter(def => def.PanelComponent);

    if (capabilityDefs.length === 0) return null;

    return (
        <>
            {capabilityDefs.map((def) => {
                const PanelComp = def.PanelComponent!;
                return (
                    <PanelComp
                        key={def.id}
                        capabilityId={def.id}
                        documentPath={documentPath}
                        frontmatter={frontmatter}
                        readonly={readonly}
                    />
                );
            })}
        </>
    );
}

export default CapabilityActions;

