/**
 * DataBlockEditor - 数据块精细化编辑器
 * 
 * 将 YAML 数据以友好的表单形式展示和编辑
 * 使用标签映射系统显示中文字段名
 * 所有字段必须来自标签管理系统
 * 支持文档组件绑定
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, RefreshCw, CheckCircle2, Tag, Lock, Save, Link2, Settings, ChevronDown, Check, CircleDot, GripVertical } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLabels } from '@/providers/LabelProvider';
import { FieldSelector } from './FieldSelector';
import { SaveTemplateDialog } from './SaveTemplateDialog';
import { FieldSettingsDialog } from './FieldSettingsDialog';
import { StatusOptionsDialog, DEFAULT_STATUS_OPTIONS, type StatusOption } from './StatusOptionsDialog';
import { IdConfigDialog, DEFAULT_ID_CONFIG, type IdConfig } from './IdConfigDialog';
import { ComponentControl, FallbackControl } from './ComponentControls';
import { FIXED_FIELD_KEYS } from './types';
import { cn } from '@/lib/utils';
import type { DocumentComponentDefinition } from '../ComponentPanel/types';
import yaml from 'js-yaml';

/**
 * 动态获取 Lucide 图标组件
 */
function getLucideIcon(name: string | undefined): React.ComponentType<{ className?: string; size?: number }> | null {
    if (!name) return null;

    // 将 kebab-case 转换为 PascalCase
    const pascalCase = name
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    // @ts-expect-error - 动态访问
    const Icon = LucideIcons[pascalCase];
    return Icon || null;
}

interface DataField {
    key: string;
    value: string | number | boolean | string[];
}

// ============================================================
// StatusSelectControl - 状态选择控件
// ============================================================

interface StatusSelectControlProps {
    value: string;
    options: StatusOption[];
    onChange: (value: string) => void;
    getColorClassName: (value: string) => { bg: string; text: string };
    disabled?: boolean;
}

function StatusSelectControl({
    value,
    options,
    onChange,
    getColorClassName,
    disabled = false,
}: StatusSelectControlProps) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, width: 0 });

    const handleOpen = useCallback(() => {
        if (disabled) return;
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPopupPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: Math.max(rect.width, 140),
            });
        }
        setIsOpen(true);
    }, [disabled]);

    const handleSelect = useCallback((optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    }, [onChange]);

    const colorStyle = getColorClassName(value);
    const selectedOption = options.find(o => o.value === value);

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className={cn(
                    'flex-1 flex items-center justify-between gap-2 px-2 py-1 text-sm rounded-md border transition-colors',
                    'hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400/30',
                    isOpen ? 'border-purple-400 bg-purple-50' : 'border-slate-200 bg-white',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
            >
                {selectedOption ? (
                    <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
                        colorStyle.bg,
                        colorStyle.text
                    )}>
                        <CircleDot size={10} />
                        {selectedOption.value}
                    </span>
                ) : (
                    <span className="text-slate-400">选择状态...</span>
                )}
                <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
            </button>

            {isOpen && createPortal(
                <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                    <div
                        className="fixed z-[101] bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-[200px] overflow-auto"
                        style={{
                            top: popupPosition.top,
                            left: popupPosition.left,
                            minWidth: popupPosition.width,
                        }}
                    >
                        {options.map((option) => {
                            const optColorStyle = getColorClassName(option.value);
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-slate-50 transition-colors',
                                        option.value === value && 'bg-purple-50'
                                    )}
                                >
                                    <span className={cn(
                                        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
                                        optColorStyle.bg,
                                        optColorStyle.text
                                    )}>
                                        <CircleDot size={10} />
                                        {option.value}
                                    </span>
                                    {option.value === value && (
                                        <Check size={14} className="ml-auto text-purple-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>,
                document.body
            )}
        </>
    );
}

/** 内部绑定键名，存储在 YAML 中但不显示为普通字段 */
const INTERNAL_BINDING_KEY = '_bindings';
/** 内部状态选项键名，存储在 YAML 中但不显示为普通字段 */
const INTERNAL_STATUS_OPTIONS_KEY = '_status_options';
/** 内部编号配置键名，存储在 YAML 中但不显示为普通字段 */
const INTERNAL_ID_CONFIG_KEY = '_id_config';
/** 内部标签映射键名，存储在 YAML 中但不显示为普通字段 */
const INTERNAL_LABELS_KEY = '_labels';

interface DataBlockEditorProps {
    /** YAML 字符串内容 */
    content: string;
    /** 内容变化回调 */
    onChange: (content: string) => void;
    /** 是否只读 */
    readOnly?: boolean;
    /** 同步结构到所有同类型数据块的回调（包括字段、组件绑定、状态选项和编号配置） */
    onSyncStructure?: (dataType: string, fieldKeys: string[], bindings?: Record<string, string>, statusOptions?: StatusOption[], idConfig?: IdConfig) => number;
    /** 文档组件定义（来自文档级 _components） */
    documentComponents?: Record<string, DocumentComponentDefinition>;
}

// ============================================================
// SortableField - 可拖拽的字段项组件
// ============================================================

interface SortableFieldProps {
    field: { key: string; value: string | number | boolean | string[] | null };
    index: number;
    isFixed: boolean;
    isStatusField: boolean;
    isIdField: boolean;
    isIdFrozen: boolean;
    boundComponentId: string | undefined;
    boundComponent: DocumentComponentDefinition | null;
    statusOptions: StatusOption[];
    getLabel: (key: string) => string;
    renderFieldIcon: (key: string) => React.ReactNode;
    getStatusColorClassName: (color: string) => string;
    updateFieldValue: (index: number, value: unknown) => void;
    removeField: (index: number) => void;
    onEditField: () => void;
    onEditStatusOptions: () => void;
    onEditIdConfig: () => void;
}

function SortableField({
    field,
    index,
    isFixed,
    isStatusField,
    isIdField,
    isIdFrozen,
    boundComponentId,
    boundComponent,
    statusOptions,
    getLabel,
    renderFieldIcon,
    getStatusColorClassName,
    updateFieldValue,
    removeField,
    onEditField,
    onEditStatusOptions,
    onEditIdConfig,
}: SortableFieldProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.key });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // 获取字段标签的点击处理函数和提示文本
    const getFieldLabelAction = () => {
        if (isStatusField) {
            return { onClick: onEditStatusOptions, title: "点击配置状态选项" };
        }
        if (isIdField) {
            return { onClick: onEditIdConfig, title: "点击配置编号格式" };
        }
        return { onClick: onEditField, title: "点击设置字段" };
    };
    const fieldLabelAction = getFieldLabelAction();

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-lg hover:bg-slate-50/80 transition-colors",
                isDragging && "bg-slate-100 shadow-sm"
            )}
        >
            {/* 拖拽手柄 */}
            <button
                type="button"
                className="cursor-grab active:cursor-grabbing p-0.5 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                {...attributes}
                {...listeners}
            >
                <GripVertical size={14} />
            </button>

            {/* 字段标签 - 可点击打开设置对话框 */}
            <button
                type="button"
                onClick={fieldLabelAction.onClick}
                className="min-w-[100px] flex items-center gap-1.5 text-left hover:bg-slate-100 rounded-md px-1 py-0.5 -mx-1 transition-colors"
                title={fieldLabelAction.title}
            >
                {renderFieldIcon(field.key)}
                <span className="text-sm text-slate-500 truncate">
                    {getLabel(field.key)}
                </span>
                {/* 固定字段标记 */}
                {isFixed && (
                    <span title="固定字段">
                        <Lock size={10} className="text-slate-300 flex-shrink-0" />
                    </span>
                )}
                {/* status 字段显示设置图标 */}
                {isStatusField && (
                    <span title="点击配置状态选项">
                        <Settings size={10} className="text-purple-400 flex-shrink-0" />
                    </span>
                )}
                {/* id 字段显示设置图标 */}
                {isIdField && (
                    <span title="点击配置编号格式">
                        <Settings size={10} className="text-blue-400 flex-shrink-0" />
                    </span>
                )}
                {/* id 字段冻结标记 */}
                {isIdFrozen && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded flex-shrink-0" title="编号已冻结">
                        <Lock size={10} className="inline-block" />
                    </span>
                )}
                {/* 组件绑定标记（status/id 字段不显示） */}
                {boundComponent && !isStatusField && !isIdField && (
                    <span className="text-[10px] text-purple-500 bg-purple-50 px-1 rounded flex-shrink-0">
                        <Link2 size={10} className="inline-block" />
                    </span>
                )}
            </button>

            {/* 字段值 */}
            {/* status 字段使用专用下拉控件 */}
            {isStatusField ? (
                <StatusSelectControl
                    value={String(field.value || '')}
                    options={statusOptions}
                    onChange={(newValue) => updateFieldValue(index, newValue)}
                    getColorClassName={getStatusColorClassName}
                />
            ) : isIdField ? (
                // id 字段：显示为带样式的编号，冻结时不可编辑
                <div className="flex-1 flex items-center gap-2">
                    <input
                        type="text"
                        value={String(field.value || '')}
                        onChange={(e) => updateFieldValue(index, e.target.value)}
                        disabled={isIdFrozen}
                        className={cn(
                            "flex-1 px-2 py-1 text-sm font-mono border rounded-md transition-colors",
                            isIdFrozen
                                ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
                                : "bg-white border-slate-200 text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 hover:border-slate-300"
                        )}
                        placeholder="编号..."
                    />
                </div>
            ) : boundComponent ? (
                // 组件存在，渲染组件控件
                <div className="flex-1">
                    <ComponentControl
                        component={boundComponent}
                        value={field.value}
                        onChange={(newValue) => updateFieldValue(index, newValue)}
                    />
                </div>
            ) : boundComponentId ? (
                // 绑定存在但组件定义不存在 - 失效态降级 (Iron Rule 3)
                <div className="flex-1">
                    <FallbackControl
                        componentId={boundComponentId}
                        value={field.value}
                        onChange={(newValue) => updateFieldValue(index, newValue)}
                    />
                </div>
            ) : (
                // 无绑定，普通输入框
                <input
                    type="text"
                    value={String(field.value)}
                    onChange={(e) => updateFieldValue(index, e.target.value)}
                    className="flex-1 w-full px-2 py-1 text-sm text-slate-700 border border-slate-200 rounded-md
                        focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-400
                        hover:border-slate-300 transition-colors"
                    placeholder="输入值..."
                />
            )}

            {/* 删除按钮 - 固定字段不可删除 */}
            {isFixed ? (
                <div className="w-6 h-6 flex items-center justify-center" title="固定字段，不可删除">
                    <Lock size={12} className="text-slate-200" />
                </div>
            ) : (
                <button
                    onClick={() => removeField(index)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 
                        text-slate-300 hover:text-red-500 transition-all"
                    title="删除字段"
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
}

export function DataBlockEditor({
    content,
    onChange,
    readOnly = false,
    onSyncStructure,
    documentComponents = {},
}: DataBlockEditorProps) {
    const { getLabel: getLabelFromProvider, getIcon } = useLabels();
    const [fields, setFields] = useState<DataField[]>([]);
    // 数据块类型（从 type 字段提取，用于同步功能）
    const [dataType, setDataType] = useState<string | null>(null);
    // 保留原始的系统字段（type, schema 等，用于保存时恢复）
    const [systemFields, setSystemFields] = useState<Record<string, unknown>>({});
    // 从 schema 中提取的字段标签映射（插件级别配置）
    const [schemaLabels, setSchemaLabels] = useState<Record<string, string>>({});
    // 是否使用 data 包装结构（schema + data 格式）
    const [hasDataWrapper, setHasDataWrapper] = useState(false);
    // 数据块内部的字段-组件绑定（存储在 YAML 的 _bindings 字段中）
    const [fieldBindings, setFieldBindings] = useState<Record<string, string>>({});
    // 数据块内部的字段标签映射（存储在 YAML 的 _labels 字段中，文档级别自定义标签）
    const [fieldLabels, setFieldLabels] = useState<Record<string, string>>({});
    // 数据块级别的状态选项（存储在 YAML 的 _status_options 字段中）
    const [statusOptions, setStatusOptions] = useState<StatusOption[]>(DEFAULT_STATUS_OPTIONS);
    // 数据块级别的编号配置（存储在 YAML 的 _id_config 字段中）
    const [idConfig, setIdConfig] = useState<IdConfig>(DEFAULT_ID_CONFIG);
    const [showFieldSelector, setShowFieldSelector] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [syncResult, setSyncResult] = useState<{ count: number } | null>(null);
    const [selectorPosition, setSelectorPosition] = useState<{ top: number; left: number } | null>(null);
    // 字段设置对话框相关状态
    const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
    // 状态选项配置对话框
    const [showStatusOptionsDialog, setShowStatusOptionsDialog] = useState(false);
    // 编号配置对话框
    const [showIdConfigDialog, setShowIdConfigDialog] = useState(false);
    const addFieldButtonRef = useRef<HTMLButtonElement>(null);

    /**
     * 五级优先级标签查找
     * 1. 文档内自定义标签（_labels，最高优先级，用户在当前文档自定义）
     * 2. 组件定义的标签（通过 _bindings 映射到 _components）
     * 3. Schema 标签（类型包/数据块级别定义，如联系人的 title="职位"）
     * 4. 全局标签管理（LabelProvider，系统级配置）
     * 5. 字段键名（兜底）
     */
    const getLabel = useCallback((key: string): string => {
        // 1. 最高优先：文档内自定义标签（_labels）
        if (fieldLabels[key]) {
            return fieldLabels[key];
        }
        // 2. 其次：组件定义的标签（通过 fieldBindings 映射到 documentComponents）
        const componentId = fieldBindings[key];
        if (componentId && documentComponents[componentId]?.label) {
            return documentComponents[componentId].label;
        }
        // 3. Schema 标签（类型包/数据块级别定义）
        if (schemaLabels[key]) {
            return schemaLabels[key];
        }
        // 4. 全局标签管理（系统级配置）
        const providerLabel = getLabelFromProvider(key);
        if (providerLabel && providerLabel !== key) {
            return providerLabel;
        }
        // 5. 兜底：返回字段键名
        return key;
    }, [fieldLabels, fieldBindings, documentComponents, schemaLabels, getLabelFromProvider]);

    // 计算弹出框位置
    const openFieldSelector = useCallback(() => {
        if (addFieldButtonRef.current) {
            const rect = addFieldButtonRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const selectorHeight = 400; // 预估选择器高度

            // 判断向上还是向下弹出
            const spaceAbove = rect.top;
            const spaceBelow = viewportHeight - rect.bottom;

            let top: number;
            if (spaceAbove > selectorHeight || spaceAbove > spaceBelow) {
                // 向上弹出
                top = rect.top - selectorHeight - 8;
                if (top < 60) top = 60; // 确保不超出顶部（留出头部空间）
            } else {
                // 向下弹出
                top = rect.bottom + 8;
            }

            setSelectorPosition({
                top,
                left: rect.left,
            });
        }
        setShowFieldSelector(true);
    }, []);

    // 解析 YAML 为字段数组，同时提取 _bindings、_status_options 和 _id_config
    useEffect(() => {
        try {
            const parsed = yaml.load(content);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                const data = parsed as Record<string, unknown>;

                // 提取 _bindings（组件绑定信息）
                const bindings = (data[INTERNAL_BINDING_KEY] as Record<string, string>) || {};
                setFieldBindings(bindings);

                // 提取 _labels（文档内自定义标签映射）
                const labels = (data[INTERNAL_LABELS_KEY] as Record<string, string>) || {};
                setFieldLabels(labels);

                // 提取 _status_options（数据块级状态选项）
                const blockStatusOptions = data[INTERNAL_STATUS_OPTIONS_KEY] as StatusOption[] | undefined;
                if (blockStatusOptions && Array.isArray(blockStatusOptions) && blockStatusOptions.length > 0) {
                    setStatusOptions(blockStatusOptions);
                } else {
                    setStatusOptions(DEFAULT_STATUS_OPTIONS);
                }

                // 提取 _id_config（数据块级编号配置）
                const blockIdConfig = data[INTERNAL_ID_CONFIG_KEY] as IdConfig | undefined;
                if (blockIdConfig && typeof blockIdConfig === 'object') {
                    setIdConfig({ ...DEFAULT_ID_CONFIG, ...blockIdConfig });
                } else {
                    setIdConfig(DEFAULT_ID_CONFIG);
                }

                // 提取并保存系统字段（type, schema），用于保存时恢复
                const SYSTEM_FIELD_KEYS = ['type', 'schema', 'data'];
                const sysFields: Record<string, unknown> = {};
                for (const key of ['type', 'schema']) {
                    if (key in data) {
                        sysFields[key] = data[key];
                    }
                }
                setSystemFields(sysFields);

                // 从 schema 中提取字段标签映射（插件级别配置）
                const schemaArray = data['schema'] as Array<{ key: string; label?: string }> | undefined;
                if (schemaArray && Array.isArray(schemaArray)) {
                    const labels: Record<string, string> = {};
                    for (const item of schemaArray) {
                        if (item.key && item.label) {
                            labels[item.key] = item.label;
                        }
                    }
                    setSchemaLabels(labels);
                } else {
                    setSchemaLabels({});
                }

                // 提取 type 字段（用于同步功能）
                const typeValue = data['type'];
                setDataType(typeValue ? String(typeValue) : null);

                // 判断数据结构：schema + data 格式 vs 扁平格式
                // 如果有 data 字段且是对象，使用 data 字段内容；否则使用扁平结构
                let userData: Record<string, unknown>;
                const isDataWrapped = data['data'] && typeof data['data'] === 'object' && !Array.isArray(data['data']);
                setHasDataWrapper(isDataWrapped);

                if (isDataWrapped) {
                    // schema + data 格式：使用 data 字段的内容
                    userData = data['data'] as Record<string, unknown>;
                } else {
                    // 扁平格式：过滤掉系统字段
                    userData = Object.fromEntries(
                        Object.entries(data).filter(([key]) => !key.startsWith('_') && !SYSTEM_FIELD_KEYS.includes(key))
                    );
                }

                const fieldArray: DataField[] = Object.entries(userData)
                    .filter(([key]) => !key.startsWith('_'))
                    .map(([key, value]) => ({
                        key,
                        value: value as string | number | boolean,
                    }));
                setFields(fieldArray);
            } else {
                setFields([]);
                setFieldBindings({});
                setFieldLabels({});
                setStatusOptions(DEFAULT_STATUS_OPTIONS);
                setIdConfig(DEFAULT_ID_CONFIG);
            }
        } catch {
            setFields([]);
            setFieldBindings({});
            setFieldLabels({});
            setStatusOptions(DEFAULT_STATUS_OPTIONS);
            setIdConfig(DEFAULT_ID_CONFIG);
        }
    }, [content]);

    // dataType 现在从 state 中获取（在解析时提取）

    // 获取当前字段的 key 列表（用于同步，包含 type）
    const fieldKeys = useMemo(() => {
        const keys = fields.map((f) => f.key);
        // 如果有 type，加到开头（确保同步时 type 被包含）
        if (dataType && !keys.includes('type')) {
            return ['type', ...keys];
        }
        return keys;
    }, [fields, dataType]);

    // 同步到 YAML（包含 type、data、_bindings、_labels、_status_options 和 _id_config，不再写入 schema）
    const syncToYaml = useCallback((fieldArray: DataField[], bindings: Record<string, string>, statusOpts?: StatusOption[], idCfg?: IdConfig, labels?: Record<string, string>) => {
        const obj: Record<string, unknown> = {};

        // 只写入 type 字段，不再写入 schema（schema 是冗余数据）
        if (systemFields.type) {
            obj['type'] = systemFields.type;
        }

        // 构建用户数据对象
        const userData: Record<string, unknown> = {};
        for (const field of fieldArray) {
            userData[field.key] = field.value;
        }

        // 根据原始格式决定如何写入用户数据
        if (hasDataWrapper) {
            // schema + data 格式：将用户数据包装在 data 字段中
            obj['data'] = userData;
        } else {
            // 扁平格式：直接写入用户数据字段
            for (const field of fieldArray) {
                obj[field.key] = field.value;
            }
        }

        // 只有当有绑定时才写入 _bindings
        if (Object.keys(bindings).length > 0) {
            obj[INTERNAL_BINDING_KEY] = bindings;
        }
        // 只有当有自定义标签时才写入 _labels
        const currentLabels = labels ?? fieldLabels;
        if (Object.keys(currentLabels).length > 0) {
            obj[INTERNAL_LABELS_KEY] = currentLabels;
        }
        // 写入 _status_options（如果有自定义且不是默认值）
        const opts = statusOpts ?? statusOptions;
        const isDefaultOptions = JSON.stringify(opts) === JSON.stringify(DEFAULT_STATUS_OPTIONS);
        if (!isDefaultOptions && opts.length > 0) {
            obj[INTERNAL_STATUS_OPTIONS_KEY] = opts;
        }
        // 写入 _id_config（如果有自定义且不是默认值）
        const cfg = idCfg ?? idConfig;
        const isDefaultIdConfig = JSON.stringify(cfg) === JSON.stringify(DEFAULT_ID_CONFIG);
        if (!isDefaultIdConfig) {
            obj[INTERNAL_ID_CONFIG_KEY] = cfg;
        }
        const yamlStr = yaml.dump(obj, { lineWidth: -1, quotingType: '"', forceQuotes: false });
        onChange(yamlStr.trim());
    }, [onChange, statusOptions, idConfig, fieldLabels, systemFields, hasDataWrapper]);

    // 更新字段值（支持字符串、数字、布尔、数组、对象）
    const updateFieldValue = useCallback((index: number, value: unknown) => {
        const newFields = [...fields];

        // 处理不同类型的值
        let parsedValue: string | number | boolean | string[] | object | null;

        if (value === null || value === undefined) {
            // null/undefined 转为空字符串
            parsedValue = '';
        } else if (Array.isArray(value)) {
            // 多选组件返回数组，直接保存
            parsedValue = value;
        } else if (typeof value === 'object') {
            // 对象类型：直接保存（用于字段组组件如 user-auth）
            parsedValue = value;
        } else if (typeof value === 'string') {
            // 字符串：尝试转换为布尔
            if (value === 'true') parsedValue = true;
            else if (value === 'false') parsedValue = false;
            // 只对短字符串（小于10位）尝试转换为数字，避免手机号等长数字被转换
            else if (value.length < 10 && !isNaN(Number(value)) && value.trim() !== '') parsedValue = Number(value);
            else parsedValue = value;
        } else if (typeof value === 'number' || typeof value === 'boolean') {
            parsedValue = value;
        } else {
            parsedValue = String(value);
        }

        newFields[index] = { ...newFields[index], value: parsedValue };
        setFields(newFields);
        syncToYaml(newFields, fieldBindings);
    }, [fields, fieldBindings, syncToYaml]);

    // 更新 schema（同步字段的 schema 定义）
    const updateSchema = useCallback((fieldKey: string, action: 'add' | 'remove') => {
        const currentSchema = (systemFields.schema as Array<{ key: string; label?: string; type?: string }>) || [];

        if (action === 'add') {
            // 检查是否已存在
            if (!currentSchema.some(s => s.key === fieldKey)) {
                const newSchema = [...currentSchema, { key: fieldKey, label: fieldKey, type: 'text' }];
                setSystemFields(prev => ({ ...prev, schema: newSchema }));
                return newSchema;
            }
        } else if (action === 'remove') {
            const newSchema = currentSchema.filter(s => s.key !== fieldKey);
            setSystemFields(prev => ({ ...prev, schema: newSchema }));
            return newSchema;
        }
        return currentSchema;
    }, [systemFields.schema]);

    // 重排 schema 顺序
    const reorderSchema = useCallback((newFields: DataField[]) => {
        const currentSchema = (systemFields.schema as Array<{ key: string; label?: string; type?: string }>) || [];
        const schemaMap = new Map(currentSchema.map(s => [s.key, s]));

        // 按新字段顺序重排 schema
        const newSchema = newFields
            .map(f => schemaMap.get(f.key))
            .filter((s): s is { key: string; label?: string; type?: string } => s !== undefined);

        // 添加 schema 中存在但 fields 中没有的项（保留在末尾）
        const fieldKeys = new Set(newFields.map(f => f.key));
        for (const s of currentSchema) {
            if (!fieldKeys.has(s.key)) {
                newSchema.push(s);
            }
        }

        setSystemFields(prev => ({ ...prev, schema: newSchema }));
        return newSchema;
    }, [systemFields.schema]);

    // 删除字段
    const removeField = useCallback((index: number) => {
        const fieldKey = fields[index]?.key;
        const newFields = fields.filter((_, i) => i !== index);
        // 同时移除该字段的绑定
        const newBindings = { ...fieldBindings };
        if (fieldKey) delete newBindings[fieldKey];
        // 同步更新 schema
        if (fieldKey) updateSchema(fieldKey, 'remove');
        setFields(newFields);
        setFieldBindings(newBindings);
        syncToYaml(newFields, newBindings);
    }, [fields, fieldBindings, syncToYaml, updateSchema]);

    // 添加字段
    const addField = useCallback((key: string) => {
        if (fields.some((f) => f.key === key)) return;
        const newFields = [...fields, { key, value: '' }];
        // 同步更新 schema
        updateSchema(key, 'add');
        setFields(newFields);
        syncToYaml(newFields, fieldBindings);
    }, [fields, fieldBindings, syncToYaml, updateSchema]);

    // 拖拽排序：移动字段
    const moveField = useCallback((oldIndex: number, newIndex: number) => {
        const newFields = arrayMove(fields, oldIndex, newIndex);
        // 同步更新 schema 顺序
        reorderSchema(newFields);
        setFields(newFields);
        syncToYaml(newFields, fieldBindings);
    }, [fields, fieldBindings, syncToYaml, reorderSchema]);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 处理拖拽结束
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = fields.findIndex((f) => f.key === active.id);
            const newIndex = fields.findIndex((f) => f.key === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                moveField(oldIndex, newIndex);
            }
        }
    }, [fields, moveField]);

    // 绑定/解绑组件到字段（数据块级绑定）
    const handleBindComponent = useCallback((fieldKey: string, componentId: string | null) => {
        let newBindings: Record<string, string>;
        if (componentId === null) {
            // 解绑
            newBindings = { ...fieldBindings };
            delete newBindings[fieldKey];
        } else {
            // 绑定
            newBindings = {
                ...fieldBindings,
                [fieldKey]: componentId,
            };
        }
        setFieldBindings(newBindings);
        syncToYaml(fields, newBindings);
    }, [fields, fieldBindings, syncToYaml]);

    // 处理状态选项变化（数据块级别）
    const handleStatusOptionsChange = useCallback((newOptions: StatusOption[]) => {
        setStatusOptions(newOptions);
        syncToYaml(fields, fieldBindings, newOptions, idConfig);
    }, [fields, fieldBindings, idConfig, syncToYaml]);

    // 处理编号配置变化（数据块级别）
    const handleIdConfigChange = useCallback((newConfig: IdConfig) => {
        setIdConfig(newConfig);
        syncToYaml(fields, fieldBindings, statusOptions, newConfig);
    }, [fields, fieldBindings, statusOptions, syncToYaml]);

    // 获取可用的组件列表
    const availableComponents = useMemo(() => {
        return Object.values(documentComponents);
    }, [documentComponents]);

    // 当前正在编辑的字段
    const editingField = editingFieldIndex !== null ? fields[editingFieldIndex] : null;

    // 同步结构到所有同类型数据块（纯前端）
    // 注意：先确保当前块的最新状态已同步到父组件
    const handleSyncStructure = () => {
        if (!dataType || !onSyncStructure) return;

        // 组件绑定信息
        const bindingInfo = Object.keys(fieldBindings).length > 0
            ? `\n• 组件绑定将被同步：${Object.entries(fieldBindings).map(([k, v]) => `${getLabel(k)} → ${documentComponents[v]?.label || v}`).join('、')}`
            : '';

        // 状态选项信息（仅当有 status 字段时显示）
        const statusInfo = fieldKeys.includes('status')
            ? `\n• 状态选项将被同步：${statusOptions.map(o => o.value).join('、')}`
            : '';

        // 编号配置信息（根据冻结状态显示不同信息，仅当有 id 字段时显示）
        let idInfo = '';
        if (fieldKeys.includes('id')) {
            if (idConfig.frozen) {
                idInfo = `\n• 编号格式将被同步（已冻结，保留现有编号）`;
            } else {
                const formatPreview = idConfig.prefix
                    ? `${idConfig.prefix}${idConfig.separator}${'0'.repeat(idConfig.digits)}`
                    : `${'0'.repeat(idConfig.digits)}`;
                idInfo = `\n• 编号格式将被同步：${formatPreview}（将重新生成所有编号）`;
            }
        }

        // 确认对话框
        const confirmed = window.confirm(
            `⚠️ 同步确认\n\n` +
            `此操作将把当前数据块的字段结构、组件绑定、状态选项和编号格式同步到本文档中所有 "${dataType}" 类型的数据块。\n\n` +
            `• 缺少的字段将被添加（值为空）\n` +
            `• 多余的字段将被删除\n` +
            `• 已有字段的值保持不变${bindingInfo}${statusInfo}${idInfo}\n\n` +
            `当前字段：${fieldKeys.join(', ')}\n\n` +
            `确定要继续吗？`
        );

        if (!confirmed) return;

        // 先确保当前块的内容已同步到父组件
        syncToYaml(fields, fieldBindings, statusOptions, idConfig);

        // 使用 setTimeout 确保状态更新后再执行同步
        setTimeout(() => {
            // 传递字段列表、组件绑定、状态选项和编号配置
            const count = onSyncStructure(dataType, fieldKeys, fieldBindings, statusOptions, idConfig);
            setSyncResult({ count });

            // 2秒后清除结果提示
            setTimeout(() => setSyncResult(null), 2000);
        }, 0);
    };

    // 渲染字段图标
    const renderFieldIcon = (key: string) => {
        const iconName = getIcon(key);
        const IconComponent = getLucideIcon(iconName);

        if (IconComponent) {
            return <IconComponent size={14} className="text-slate-400 flex-shrink-0" />;
        }
        // 默认图标
        return <Tag size={14} className="text-slate-300 flex-shrink-0" />;
    };

    // 渲染只读模式下的字段值
    const renderReadOnlyValue = (value: unknown, componentId?: string) => {
        // 空值
        if (value === null || value === undefined || value === '') {
            return <span className="text-slate-400 italic">未设置</span>;
        }

        // 数组类型
        if (Array.isArray(value)) {
            return (
                <div className="flex flex-wrap gap-1">
                    {value.map((item, i) => (
                        <span key={i} className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                            {String(item)}
                        </span>
                    ))}
                </div>
            );
        }

        // 对象类型（如 user-auth 组件）
        if (typeof value === 'object') {
            const obj = value as Record<string, unknown>;

            // 特殊处理 user-auth 类型
            if (componentId === '__atlas_user_auth__' || obj.user_id !== undefined) {
                return (
                    <div className="space-y-1 text-sm">
                        {obj.username && (
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-xs w-16">用户名:</span>
                                <span className="text-slate-700">{String(obj.username)}</span>
                            </div>
                        )}
                        {obj.email && (
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-xs w-16">邮箱:</span>
                                <span className="text-slate-700">{String(obj.email)}</span>
                            </div>
                        )}
                        {obj.phone && (
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-xs w-16">手机:</span>
                                <span className="text-slate-700">{String(obj.phone)}</span>
                            </div>
                        )}
                        {obj.role && (
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-xs w-16">角色:</span>
                                <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-600 rounded">
                                    {String(obj.role)}
                                </span>
                            </div>
                        )}
                        {obj.status && (
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-xs w-16">状态:</span>
                                <span className={cn(
                                    'px-1.5 py-0.5 text-xs rounded',
                                    obj.status === 'active' && 'bg-green-100 text-green-600',
                                    obj.status === 'pending' && 'bg-yellow-100 text-yellow-600',
                                    obj.status === 'disabled' && 'bg-red-100 text-red-600',
                                    obj.status === 'locked' && 'bg-orange-100 text-orange-600',
                                )}>
                                    {obj.status === 'active' ? '正常' :
                                        obj.status === 'pending' ? '待激活' :
                                            obj.status === 'disabled' ? '已禁用' :
                                                obj.status === 'locked' ? '已锁定' : String(obj.status)}
                                </span>
                            </div>
                        )}
                    </div>
                );
            }

            // 通用对象渲染
            return (
                <div className="space-y-0.5 text-sm">
                    {Object.entries(obj).map(([k, v]) => (
                        v && (
                            <div key={k} className="flex items-center gap-2">
                                <span className="text-slate-400 text-xs">{k}:</span>
                                <span className="text-slate-700">{String(v)}</span>
                            </div>
                        )
                    ))}
                </div>
            );
        }

        // 布尔值
        if (typeof value === 'boolean') {
            return (
                <span className={cn(
                    'px-1.5 py-0.5 text-xs rounded',
                    value ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                )}>
                    {value ? '是' : '否'}
                </span>
            );
        }

        // 普通值
        return <span className="text-slate-700">{String(value)}</span>;
    };

    if (readOnly) {
        return (
            <div className="space-y-1">
                {fields.map((field) => {
                    const boundComponentId = fieldBindings[field.key];
                    return (
                        <div key={field.key} className="flex items-start gap-3 text-sm py-0.5">
                            <div className="min-w-[120px] flex items-center gap-1.5 pt-0.5">
                                {renderFieldIcon(field.key)}
                                <span className="text-slate-500">{getLabel(field.key)}</span>
                            </div>
                            <div className="flex-1">
                                {renderReadOnlyValue(field.value, boundComponentId)}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // 获取状态对应的颜色样式
    const getStatusColorClassName = (statusValue: string) => {
        const option = statusOptions.find(o => o.value === statusValue);
        const color = option?.color || 'gray';
        const colorMap: Record<string, { bg: string; text: string }> = {
            green: { bg: 'bg-green-100', text: 'text-green-700' },
            blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
            yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-700' },
            red: { bg: 'bg-red-100', text: 'text-red-700' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-700' },
            gray: { bg: 'bg-gray-100', text: 'text-gray-700' },
        };
        return colorMap[color] || colorMap.gray;
    };

    return (
        <div className="space-y-0.5">
            {/* 字段列表 - 可拖拽排序 */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={fields.map((f) => f.key)}
                    strategy={verticalListSortingStrategy}
                >
                    {fields.map((field, index) => (
                        <SortableField
                            key={field.key}
                            field={field}
                            index={index}
                            isFixed={FIXED_FIELD_KEYS.has(field.key)}
                            isStatusField={field.key === 'status'}
                            isIdField={field.key === 'id'}
                            isIdFrozen={field.key === 'id' && idConfig.frozen}
                            boundComponentId={fieldBindings[field.key]}
                            boundComponent={fieldBindings[field.key] ? documentComponents[fieldBindings[field.key]] : null}
                            statusOptions={statusOptions}
                            getLabel={getLabel}
                            renderFieldIcon={renderFieldIcon}
                            getStatusColorClassName={getStatusColorClassName}
                            updateFieldValue={updateFieldValue}
                            removeField={removeField}
                            onEditField={() => setEditingFieldIndex(index)}
                            onEditStatusOptions={() => setShowStatusOptionsDialog(true)}
                            onEditIdConfig={() => setShowIdConfigDialog(true)}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            {/* 字段设置对话框 */}
            {editingField && editingFieldIndex !== null && (
                <FieldSettingsDialog
                    fieldKey={editingField.key}
                    fieldValue={editingField.value}
                    currentLabel={getLabel(editingField.key)}
                    boundComponentId={fieldBindings[editingField.key]}
                    availableComponents={availableComponents}
                    onBindComponent={(componentId) => handleBindComponent(editingField.key, componentId)}
                    onUpdateLabel={(newLabel) => {
                        // 更新文档内的标签映射（仅影响当前文档）
                        const newLabels = { ...fieldLabels, [editingField.key]: newLabel };
                        setFieldLabels(newLabels);
                        // 同步到 YAML
                        syncToYaml(fields, fieldBindings, statusOptions, idConfig, newLabels);
                    }}
                    onClose={() => setEditingFieldIndex(null)}
                />
            )}

            {/* 状态选项配置对话框 */}
            {showStatusOptionsDialog && (
                <StatusOptionsDialog
                    options={statusOptions}
                    onOptionsChange={handleStatusOptionsChange}
                    onClose={() => setShowStatusOptionsDialog(false)}
                />
            )}

            {/* 编号配置对话框 */}
            {showIdConfigDialog && (
                <IdConfigDialog
                    config={idConfig}
                    currentId={String(fields.find(f => f.key === 'id')?.value || '')}
                    onConfigChange={handleIdConfigChange}
                    onClose={() => setShowIdConfigDialog(false)}
                />
            )}

            {/* 底部操作栏 */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                {/* 左侧按钮组 */}
                <div className="flex items-center gap-2">
                    {/* 添加字段按钮 */}
                    <button
                        ref={addFieldButtonRef}
                        onClick={openFieldSelector}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-purple-500 
              py-1.5 px-2 rounded-lg hover:bg-purple-50/50 transition-colors"
                    >
                        <Plus size={14} />
                        <span>添加字段</span>
                    </button>

                    {/* 字段选择器弹窗 - 使用 Portal 渲染到 body，跟随按钮位置 */}
                    {showFieldSelector && selectorPosition && createPortal(
                        <>
                            {/* 遮罩 */}
                            <div
                                className="fixed inset-0 z-[100]"
                                onClick={() => setShowFieldSelector(false)}
                            />
                            {/* 选择器 - 跟随按钮位置 */}
                            <div
                                className="fixed z-[101]"
                                style={{
                                    top: selectorPosition.top,
                                    left: selectorPosition.left,
                                }}
                            >
                                <FieldSelector
                                    existingKeys={fields.map((f) => f.key)}
                                    onSelect={addField}
                                    onClose={() => setShowFieldSelector(false)}
                                />
                            </div>
                        </>,
                        document.body
                    )}

                    {/* 存为模板按钮 */}
                    {dataType && (
                        <button
                            onClick={() => setShowSaveDialog(true)}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-500 
                py-1.5 px-2 rounded-lg hover:bg-amber-50/50 transition-colors"
                            title="将当前数据块保存为模板"
                        >
                            <Save size={14} />
                            <span>存为模板</span>
                        </button>
                    )}
                </div>

                {/* 同步按钮 - 只有有 type 字段且提供了回调时显示 */}
                {dataType && onSyncStructure && (
                    <div className="flex items-center gap-2">
                        {/* 同步结果提示 */}
                        {syncResult && (
                            <span className="text-xs flex items-center gap-1 text-green-600">
                                <CheckCircle2 size={12} />
                                已同步 {syncResult.count} 个数据块
                            </span>
                        )}

                        <button
                            onClick={handleSyncStructure}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-500 
                py-1.5 px-2 rounded-lg hover:bg-blue-50/50 transition-colors"
                            title={`同步字段结构到本文档所有 ${dataType} 类型数据块`}
                        >
                            <RefreshCw size={14} />
                            <span>同步到所有 {dataType}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* 保存模板对话框 */}
            {dataType && (
                <SaveTemplateDialog
                    open={showSaveDialog}
                    onClose={() => setShowSaveDialog(false)}
                    dataType={dataType}
                    fieldKeys={fieldKeys}
                    bindings={fieldBindings}
                    documentComponents={documentComponents}
                    statusOptions={statusOptions}
                    idConfig={idConfig}
                />
            )}

            {/* 空状态提示 */}
            {fields.length === 0 && (
                <div className="text-center py-4">
                    <p className="text-sm text-slate-400 mb-2">暂无数据字段</p>
                    <button
                        onClick={() => setShowFieldSelector(true)}
                        className="text-xs text-purple-500 hover:text-purple-600"
                    >
                        + 点击添加字段
                    </button>
                </div>
            )}
        </div>
    );
}

export default DataBlockEditor;
