/**
 * ComponentControl - 基于注册系统的组件控件入口
 * 
 * 自动从注册中心获取对应类型的控件组件
 */

import { getControl, isRegistered, FallbackControl, DocumentComponentDefinition, ControlProps } from './index';

export interface ComponentControlProps {
    /** 组件定义 */
    component: DocumentComponentDefinition;
    /** 当前值 */
    value: unknown;
    /** 值变化回调 */
    onChange: (value: unknown) => void;
    /** 是否禁用 */
    disabled?: boolean;
}

export function ComponentControl({
    component,
    value,
    onChange,
    disabled = false,
}: ComponentControlProps) {
    // 检查组件是否已注册
    if (!isRegistered(component.type)) {
        return (
            <FallbackControl
                componentId={component.id}
                value={value as string | string[] | number | null | undefined}
                onChange={(v) => onChange(v)}
            />
        );
    }

    // 获取注册的控件组件
    const Control = getControl(component.type);

    if (!Control) {
        return (
            <FallbackControl
                componentId={component.id}
                value={value as string | string[] | number | null | undefined}
                onChange={(v) => onChange(v)}
            />
        );
    }

    // 渲染控件
    const controlProps: ControlProps = {
        component,
        value: value as string | string[] | number | null | undefined,
        onChange: (v) => onChange(v),
        disabled,
    };

    return <Control {...controlProps} />;
}

export default ComponentControl;

