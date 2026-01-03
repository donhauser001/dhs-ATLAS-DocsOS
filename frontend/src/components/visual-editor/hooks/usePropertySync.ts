/**
 * usePropertySync - 属性值同步 Hook
 * 
 * 在 PropertyView 扩展和属性面板之间同步属性值
 */

import { useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { setPropertyViewContext, type PropertyViewContext } from '../RichTextEditor/extensions/PropertyView';
import type { PropertyDefinition, PropertyValues } from '@/types/property';

export interface UsePropertySyncOptions {
    /** Tiptap 编辑器实例 */
    editor: Editor | null;
    /** 属性定义列表 */
    definitions: PropertyDefinition[];
    /** 属性值 */
    values: PropertyValues;
    /** 值变更回调 */
    onValueChange: (key: string, value: unknown) => void;
    /** 是否只读 */
    readonly?: boolean;
}

export interface UsePropertySyncReturn {
    /** 刷新 PropertyView 上下文 */
    refreshContext: () => void;
    /** 在编辑器中插入属性引用 */
    insertPropertyReference: (key: string) => void;
}

export function usePropertySync({
    editor,
    definitions,
    values,
    onValueChange,
    readonly = false,
}: UsePropertySyncOptions): UsePropertySyncReturn {
    // 缓存定义映射
    const definitionMapRef = useRef<Record<string, PropertyDefinition>>({});

    // 更新定义映射
    useEffect(() => {
        const map: Record<string, PropertyDefinition> = {};
        definitions.forEach(def => {
            map[def.key] = def;
        });
        definitionMapRef.current = map;
    }, [definitions]);

    // 创建并设置 PropertyView 上下文
    const refreshContext = useCallback(() => {
        const context: PropertyViewContext = {
            definitions: definitionMapRef.current,
            values,
            onValueChange,
            readonly,
        };
        setPropertyViewContext(context);

        // 强制编辑器重新渲染 PropertyView 节点
        if (editor) {
            editor.view.dispatch(editor.state.tr);
        }
    }, [editor, values, onValueChange, readonly]);

    // 当依赖变化时刷新上下文
    useEffect(() => {
        refreshContext();
    }, [refreshContext]);

    // 组件卸载时清理上下文
    useEffect(() => {
        return () => {
            setPropertyViewContext(null);
        };
    }, []);

    // 在编辑器中插入属性引用
    const insertPropertyReference = useCallback((key: string) => {
        if (!editor) return;

        // 检查属性是否存在
        if (!definitionMapRef.current[key]) {
            console.warn(`Property "${key}" not found`);
            return;
        }

        // 插入 PropertyView 节点
        editor.chain().focus().insertContent({
            type: 'propertyView',
            attrs: { propertyKey: key },
        }).run();
    }, [editor]);

    return {
        refreshContext,
        insertPropertyReference,
    };
}

export default usePropertySync;

