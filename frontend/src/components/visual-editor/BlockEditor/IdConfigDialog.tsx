/**
 * IdConfigDialog - 编号配置对话框
 * 
 * 点击 id 字段标签时弹出，用于配置编号格式
 * - 前缀：如 CLI、PRJ、DOC
 * - 分隔符：如 -、_、.
 * - 数字位数：如 4 位表示 0001
 * - 起始编号：如从 1 开始
 * - 冻结编号：开启后编号不可修改，防止链接丢失
 */

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Hash,
    Lock,
    Unlock,
    AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// 类型定义
// ============================================================

export interface IdConfig {
    /** 编号前缀（如 CLI、PRJ） */
    prefix: string;
    /** 分隔符（如 -、_） */
    separator: string;
    /** 数字位数（如 4 表示 0001） */
    digits: number;
    /** 起始编号 */
    startFrom: number;
    /** 是否冻结编号（冻结后不可修改） */
    frozen: boolean;
}

/** 默认编号配置 */
export const DEFAULT_ID_CONFIG: IdConfig = {
    prefix: '',
    separator: '-',
    digits: 4,
    startFrom: 1,
    frozen: false,
};

/** 根据配置和序号生成编号 */
export function generateId(config: IdConfig, sequence: number): string {
    const num = String(sequence).padStart(config.digits, '0');
    if (config.prefix) {
        return `${config.prefix}${config.separator}${num}`;
    }
    return num;
}

/** 从编号中提取序号 */
export function extractSequence(id: string, config: IdConfig): number | null {
    if (!id) return null;

    // 尝试匹配带前缀的格式
    if (config.prefix) {
        const pattern = new RegExp(`^${escapeRegExp(config.prefix)}${escapeRegExp(config.separator)}(\\d+)$`);
        const match = id.match(pattern);
        if (match) {
            return parseInt(match[1], 10);
        }
    }

    // 尝试直接解析数字
    const numMatch = id.match(/(\d+)$/);
    if (numMatch) {
        return parseInt(numMatch[1], 10);
    }

    return null;
}

function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================
// 预设分隔符选项
// ============================================================

const SEPARATOR_OPTIONS = [
    { value: '-', label: '短横线 (-)' },
    { value: '_', label: '下划线 (_)' },
    { value: '.', label: '点 (.)' },
    { value: '', label: '无分隔符' },
];

// ============================================================
// 编号位数选项
// ============================================================

const DIGITS_OPTIONS = [
    { value: 2, label: '2 位 (01)' },
    { value: 3, label: '3 位 (001)' },
    { value: 4, label: '4 位 (0001)' },
    { value: 5, label: '5 位 (00001)' },
    { value: 6, label: '6 位 (000001)' },
];

// ============================================================
// IdConfigDialog 组件
// ============================================================

interface IdConfigDialogProps {
    config: IdConfig;
    currentId: string;
    onConfigChange: (config: IdConfig) => void;
    onClose: () => void;
}

export function IdConfigDialog({
    config,
    currentId,
    onConfigChange,
    onClose,
}: IdConfigDialogProps) {
    const [localConfig, setLocalConfig] = useState<IdConfig>(config);

    // 预览编号
    const previewId = generateId(localConfig, localConfig.startFrom);

    // 更新配置字段
    const updateField = useCallback(<K extends keyof IdConfig>(field: K, value: IdConfig[K]) => {
        setLocalConfig(prev => ({ ...prev, [field]: value }));
    }, []);

    // 保存配置
    const handleSave = useCallback(() => {
        onConfigChange(localConfig);
        onClose();
    }, [localConfig, onConfigChange, onClose]);

    // 切换冻结状态
    const toggleFrozen = useCallback(() => {
        if (localConfig.frozen) {
            // 解冻需要确认
            const confirmed = window.confirm(
                '⚠️ 解冻编号确认\n\n' +
                '解冻后，编号可能被意外修改，这可能导致引用此编号的链接失效。\n\n' +
                '确定要解冻吗？'
            );
            if (!confirmed) return;
        }
        updateField('frozen', !localConfig.frozen);
    }, [localConfig.frozen, updateField]);

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* 背景遮罩 */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* 对话框 */}
            <div className="relative bg-white rounded-xl shadow-2xl w-[420px] max-h-[80vh] overflow-hidden">
                {/* 头部 */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <Hash size={18} className="text-blue-500" />
                        <h3 className="text-base font-semibold text-slate-800">编号格式设置</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* 内容 */}
                <div className="p-5 space-y-5">
                    {/* 当前编号显示 */}
                    {currentId && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                            <div className="text-xs text-slate-500 mb-1">当前编号</div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-slate-700">{currentId}</span>
                                {config.frozen && (
                                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                        <Lock size={10} />
                                        已冻结
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 冻结状态警告 */}
                    {localConfig.frozen && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-700">
                                编号已冻结，无法修改格式设置。如需修改，请先解冻编号。
                            </div>
                        </div>
                    )}

                    {/* 前缀设置 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            前缀
                        </label>
                        <input
                            type="text"
                            value={localConfig.prefix}
                            onChange={(e) => updateField('prefix', e.target.value.toUpperCase())}
                            disabled={localConfig.frozen}
                            placeholder="如 CLI、PRJ、DOC"
                            className={cn(
                                "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg",
                                "focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400",
                                "placeholder:text-slate-400",
                                localConfig.frozen && "bg-slate-100 cursor-not-allowed opacity-60"
                            )}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            前缀会自动转为大写，留空则只使用数字编号
                        </p>
                    </div>

                    {/* 分隔符设置 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            分隔符
                        </label>
                        <div className="flex gap-2">
                            {SEPARATOR_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => updateField('separator', opt.value)}
                                    disabled={localConfig.frozen}
                                    className={cn(
                                        "flex-1 px-3 py-2 text-sm rounded-lg border transition-colors",
                                        localConfig.separator === opt.value
                                            ? "border-blue-400 bg-blue-50 text-blue-700"
                                            : "border-slate-200 text-slate-600 hover:border-slate-300",
                                        localConfig.frozen && "cursor-not-allowed opacity-60"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 数字位数设置 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            数字位数
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {DIGITS_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => updateField('digits', opt.value)}
                                    disabled={localConfig.frozen}
                                    className={cn(
                                        "px-3 py-2 text-sm rounded-lg border transition-colors",
                                        localConfig.digits === opt.value
                                            ? "border-blue-400 bg-blue-50 text-blue-700"
                                            : "border-slate-200 text-slate-600 hover:border-slate-300",
                                        localConfig.frozen && "cursor-not-allowed opacity-60"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 起始编号设置 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            起始编号
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={localConfig.startFrom}
                            onChange={(e) => updateField('startFrom', Math.max(1, parseInt(e.target.value) || 1))}
                            disabled={localConfig.frozen}
                            className={cn(
                                "w-32 px-3 py-2 text-sm border border-slate-200 rounded-lg",
                                "focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400",
                                localConfig.frozen && "bg-slate-100 cursor-not-allowed opacity-60"
                            )}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            新建数据块时的起始编号
                        </p>
                    </div>

                    {/* 预览 */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                        <div className="text-xs text-slate-500 mb-2">编号预览</div>
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-lg font-semibold text-blue-700">
                                {previewId}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="font-mono text-sm text-slate-500">
                                {generateId(localConfig, localConfig.startFrom + 1)}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="font-mono text-sm text-slate-500">
                                {generateId(localConfig, localConfig.startFrom + 2)}
                            </span>
                            <span className="text-slate-400">...</span>
                        </div>
                    </div>

                    {/* 冻结编号开关 */}
                    <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    {localConfig.frozen ? (
                                        <Lock size={14} className="text-amber-500" />
                                    ) : (
                                        <Unlock size={14} className="text-slate-400" />
                                    )}
                                    冻结编号
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    冻结后编号不可修改，防止引用链接失效
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={toggleFrozen}
                                className={cn(
                                    "relative w-11 h-6 rounded-full transition-colors",
                                    localConfig.frozen
                                        ? "bg-amber-500"
                                        : "bg-slate-200"
                                )}
                            >
                                <span
                                    className={cn(
                                        "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
                                        localConfig.frozen ? "left-6" : "left-1"
                                    )}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 底部按钮 */}
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                    >
                        保存设置
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default IdConfigDialog;

