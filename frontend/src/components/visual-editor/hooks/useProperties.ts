/**
 * useProperties - 属性管理 Hook
 * 
 * 管理文档属性的定义和值
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { PropertyDefinition, PropertyValues, DocumentPropertyFields } from '@/types/property';

export interface UsePropertiesOptions {
    /** 初始 frontmatter */
    initialFrontmatter?: Record<string, unknown>;
    /** frontmatter 变更回调 */
    onFrontmatterChange?: (frontmatter: Record<string, unknown>) => void;
}

export interface UsePropertiesReturn {
    /** 属性定义列表 */
    definitions: PropertyDefinition[];
    /** 属性值映射 */
    values: PropertyValues;
    /** 属性定义映射（key → definition） */
    definitionMap: Record<string, PropertyDefinition>;

    /** 添加属性定义 */
    addDefinition: (definition: PropertyDefinition) => void;
    /** 更新属性定义 */
    updateDefinition: (key: string, definition: Partial<PropertyDefinition>) => void;
    /** 删除属性定义 */
    removeDefinition: (key: string) => void;

    /** 设置属性值 */
    setValue: (key: string, value: unknown) => void;
    /** 批量设置属性值 */
    setValues: (values: PropertyValues) => void;
    /** 获取属性值 */
    getValue: (key: string) => unknown;

    /** 检查属性是否存在 */
    hasProperty: (key: string) => boolean;
    /** 获取完整的 _properties 和 _values */
    getPropertyFields: () => DocumentPropertyFields;
}

export function useProperties({
    initialFrontmatter = {},
    onFrontmatterChange,
}: UsePropertiesOptions = {}): UsePropertiesReturn {
    // 解析初始属性
    const initialProps = (initialFrontmatter as DocumentPropertyFields)._properties || {};
    const initialValues = (initialFrontmatter as DocumentPropertyFields)._values || {};

    // 属性定义状态
    const [definitions, setDefinitions] = useState<PropertyDefinition[]>(() => {
        return Object.entries(initialProps).map(([key, def]) => ({
            key,
            ...def,
        } as PropertyDefinition));
    });

    // 属性值状态
    const [values, setValues] = useState<PropertyValues>(initialValues);

    // 属性定义映射
    const definitionMap = useMemo(() => {
        const map: Record<string, PropertyDefinition> = {};
        definitions.forEach(def => {
            map[def.key] = def;
        });
        return map;
    }, [definitions]);

    // 使用 ref 存储回调以避免依赖变化
    const onFrontmatterChangeRef = useRef(onFrontmatterChange);
    onFrontmatterChangeRef.current = onFrontmatterChange;

    const initialFrontmatterRef = useRef(initialFrontmatter);
    // 只在首次渲染时设置，之后不更新
    // initialFrontmatterRef.current = initialFrontmatter;

    // 存储初始的序列化状态，用于检测是否有真正的变更
    const initialStateRef = useRef<string | null>(null);
    
    // 标记是否已初始化
    const isInitializedRef = useRef(false);

    // 同步到 frontmatter
    const syncToFrontmatter = useCallback(() => {
        if (!onFrontmatterChangeRef.current) return;

        const propsObj: Record<string, Omit<PropertyDefinition, 'key'>> = {};
        definitions.forEach(def => {
            const { key, ...rest } = def;
            propsObj[key] = rest;
        });

        // 序列化当前状态
        const currentState = JSON.stringify({ props: propsObj, values });
        
        // 首次调用时，记录初始状态并跳过
        if (!isInitializedRef.current) {
            initialStateRef.current = currentState;
            isInitializedRef.current = true;
            return;
        }
        
        // 如果状态与初始状态相同，跳过（避免无意义的更新）
        if (currentState === initialStateRef.current) {
            return;
        }

        const newFrontmatter = {
            ...initialFrontmatterRef.current,
            _properties: propsObj,
            _values: values,
        };

        onFrontmatterChangeRef.current(newFrontmatter);
    }, [definitions, values]);

    // 添加属性定义
    const addDefinition = useCallback((definition: PropertyDefinition) => {
        setDefinitions(prev => {
            // 检查是否已存在
            if (prev.some(d => d.key === definition.key)) {
                console.warn(`Property "${definition.key}" already exists`);
                return prev;
            }
            return [...prev, definition];
        });
    }, []);

    // 更新属性定义
    const updateDefinition = useCallback((key: string, partial: Partial<PropertyDefinition>) => {
        setDefinitions(prev => {
            const index = prev.findIndex(d => d.key === key);
            if (index === -1) {
                console.warn(`Property "${key}" not found`);
                return prev;
            }
            const newDefs = [...prev];
            newDefs[index] = { ...newDefs[index], ...partial };
            return newDefs;
        });
    }, []);

    // 删除属性定义
    const removeDefinition = useCallback((key: string) => {
        setDefinitions(prev => prev.filter(d => d.key !== key));
        // 同时删除对应的值
        setValues(prev => {
            const newValues = { ...prev };
            delete newValues[key];
            return newValues;
        });
    }, []);

    // 设置单个属性值
    const setValue = useCallback((key: string, value: unknown) => {
        setValues(prev => ({
            ...prev,
            [key]: value,
        }));
    }, []);

    // 批量设置属性值
    const setValuesCallback = useCallback((newValues: PropertyValues) => {
        setValues(prev => ({
            ...prev,
            ...newValues,
        }));
    }, []);

    // 获取属性值
    const getValue = useCallback((key: string) => {
        return values[key];
    }, [values]);

    // 检查属性是否存在
    const hasProperty = useCallback((key: string) => {
        return definitions.some(d => d.key === key);
    }, [definitions]);

    // 获取完整的属性字段
    const getPropertyFields = useCallback((): DocumentPropertyFields => {
        const propsObj: Record<string, Omit<PropertyDefinition, 'key'>> = {};
        definitions.forEach(def => {
            const { key, ...rest } = def;
            propsObj[key] = rest;
        });

        return {
            _properties: propsObj,
            _values: values,
        };
    }, [definitions, values]);

    // 当定义或值变化时同步
    useEffect(() => {
        syncToFrontmatter();
    }, [syncToFrontmatter]);

    return {
        definitions,
        values,
        definitionMap,
        addDefinition,
        updateDefinition,
        removeDefinition,
        setValue,
        setValues: setValuesCallback,
        getValue,
        hasProperty,
        getPropertyFields,
    };
}

export default useProperties;

