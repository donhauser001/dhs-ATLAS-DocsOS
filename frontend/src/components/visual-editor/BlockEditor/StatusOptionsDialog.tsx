/**
 * StatusOptionsDialog - 状态选项配置对话框
 * 
 * 点击 status 字段标签时弹出，用于配置允许使用的状态值
 * 状态是固定键，不需要绑定组件，直接在这里配置选项
 */

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Plus,
    Trash2,
    GripVertical,
    Settings2,
    CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// 类型定义
// ============================================================

export interface StatusOption {
    /** 状态值（同时作为显示名称） */
    value: string;
    /** 状态颜色（用于徽章显示） */
    color?: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple' | 'orange';
}

/** 默认状态选项 */
export const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
    { value: '活跃', color: 'green' },
    { value: '非活跃', color: 'gray' },
    { value: '已归档', color: 'yellow' },
];

/** 颜色选项 */
const COLOR_OPTIONS: { value: StatusOption['color']; label: string; className: string }[] = [
    { value: 'green', label: '绿色', className: 'bg-green-500' },
    { value: 'blue', label: '蓝色', className: 'bg-blue-500' },
    { value: 'yellow', label: '黄色', className: 'bg-yellow-500' },
    { value: 'orange', label: '橙色', className: 'bg-orange-500' },
    { value: 'red', label: '红色', className: 'bg-red-500' },
    { value: 'purple', label: '紫色', className: 'bg-purple-500' },
    { value: 'gray', label: '灰色', className: 'bg-gray-500' },
];

// ============================================================
// Props
// ============================================================

export interface StatusOptionsDialogProps {
    /** 当前状态选项列表 */
    options: StatusOption[];
    /** 选项变化回调 */
    onOptionsChange: (options: StatusOption[]) => void;
    /** 关闭对话框 */
    onClose: () => void;
}

// ============================================================
// 主组件
// ============================================================

export function StatusOptionsDialog({
    options: initialOptions,
    onOptionsChange,
    onClose,
}: StatusOptionsDialogProps) {
    const [options, setOptions] = useState<StatusOption[]>(
        initialOptions.length > 0 ? initialOptions : DEFAULT_STATUS_OPTIONS
    );
    const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);

    // 添加选项
    const addOption = useCallback(() => {
        setOptions(prev => [...prev, { value: `状态 ${prev.length + 1}`, color: 'gray' }]);
    }, []);

    // 更新选项值
    const updateOptionValue = useCallback((index: number, value: string) => {
        setOptions(prev => {
            const newOptions = [...prev];
            newOptions[index] = { ...newOptions[index], value };
            return newOptions;
        });
    }, []);

    // 更新选项颜色
    const updateOptionColor = useCallback((index: number, color: StatusOption['color']) => {
        setOptions(prev => {
            const newOptions = [...prev];
            newOptions[index] = { ...newOptions[index], color };
            return newOptions;
        });
        setEditingColorIndex(null);
    }, []);

    // 删除选项
    const removeOption = useCallback((index: number) => {
        if (options.length <= 1) return;
        setOptions(prev => prev.filter((_, i) => i !== index));
    }, [options.length]);

    // 确认
    const handleConfirm = useCallback(() => {
        // 过滤掉空值
        const validOptions = options.filter(o => o.value.trim() !== '');
        onOptionsChange(validOptions.length > 0 ? validOptions : DEFAULT_STATUS_OPTIONS);
        onClose();
    }, [options, onOptionsChange, onClose]);

    // 重置为默认
    const handleReset = useCallback(() => {
        setOptions(DEFAULT_STATUS_OPTIONS);
    }, []);

    // 获取颜色对应的样式
    const getColorClassName = (color?: StatusOption['color']) => {
        const colorMap: Record<string, string> = {
            green: 'bg-green-500',
            blue: 'bg-blue-500',
            yellow: 'bg-yellow-500',
            orange: 'bg-orange-500',
            red: 'bg-red-500',
            purple: 'bg-purple-500',
            gray: 'bg-gray-500',
        };
        return colorMap[color || 'gray'] || 'bg-gray-500';
    };

    return createPortal(
        <>
            {/* 遮罩 */}
            <div
                className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* 对话框 */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[420px] bg-white rounded-xl shadow-2xl">
                {/* 头部 */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <Settings2 size={18} className="text-purple-500" />
                        <h2 className="text-base font-semibold text-slate-800">状态选项配置</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* 内容 */}
                <div className="px-5 py-4 space-y-4">
                    {/* 说明 */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm text-blue-700">
                            <strong>状态</strong>是固定字段，此处配置的选项将应用于本文档所有数据块的状态字段。
                        </p>
                    </div>

                    {/* 选项列表 */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                            可选状态值
                        </label>

                        {options.map((option, index) => (
                            <div key={index} className="flex items-center gap-2 group">
                                {/* 拖拽手柄 */}
                                <GripVertical className="w-4 h-4 text-slate-300 cursor-grab flex-shrink-0" />

                                {/* 颜色选择 */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setEditingColorIndex(editingColorIndex === index ? null : index)}
                                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                                    >
                                        <div className={cn('w-full h-full rounded-full', getColorClassName(option.color))} />
                                    </button>

                                    {/* 颜色选择弹窗 */}
                                    {editingColorIndex === index && (
                                        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                                            <div className="flex gap-1.5">
                                                {COLOR_OPTIONS.map(({ value, className }) => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => updateOptionColor(index, value)}
                                                        className={cn(
                                                            'w-6 h-6 rounded-full transition-transform hover:scale-110',
                                                            className,
                                                            option.color === value && 'ring-2 ring-offset-2 ring-purple-500'
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 值输入 */}
                                <input
                                    type="text"
                                    value={option.value}
                                    onChange={(e) => updateOptionValue(index, e.target.value)}
                                    placeholder="状态名称"
                                    className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-md
                                        focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                                />

                                {/* 删除按钮 */}
                                <button
                                    type="button"
                                    onClick={() => removeOption(index)}
                                    disabled={options.length <= 1}
                                    className={cn(
                                        'p-1 rounded hover:bg-red-50 transition-colors',
                                        options.length <= 1
                                            ? 'text-slate-200 cursor-not-allowed'
                                            : 'text-slate-400 hover:text-red-500'
                                    )}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}

                        {/* 添加按钮 */}
                        <button
                            type="button"
                            onClick={addOption}
                            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mt-2"
                        >
                            <Plus size={14} />
                            添加状态
                        </button>
                    </div>

                    {/* 预览 */}
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-xs font-medium text-slate-500 mb-2">预览效果</div>
                        <div className="flex flex-wrap gap-2">
                            {options.filter(o => o.value.trim()).map((option, index) => (
                                <span
                                    key={index}
                                    className={cn(
                                        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
                                        option.color === 'green' && 'bg-green-100 text-green-700',
                                        option.color === 'blue' && 'bg-blue-100 text-blue-700',
                                        option.color === 'yellow' && 'bg-yellow-100 text-yellow-700',
                                        option.color === 'orange' && 'bg-orange-100 text-orange-700',
                                        option.color === 'red' && 'bg-red-100 text-red-700',
                                        option.color === 'purple' && 'bg-purple-100 text-purple-700',
                                        (!option.color || option.color === 'gray') && 'bg-gray-100 text-gray-700'
                                    )}
                                >
                                    <CircleDot size={10} />
                                    {option.value}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 底部 */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        重置为默认
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                        >
                            确认
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}

export default StatusOptionsDialog;

