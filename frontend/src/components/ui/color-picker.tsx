import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Input } from './input'
import { Button } from './button'
import { Check, Pipette } from 'lucide-react'

// ============================================================
// 颜色选择器组件
// ============================================================

// 预设颜色调色板
const PRESET_COLORS = [
    // 第一行：主要色彩
    { value: '#EF4444', label: '红色' },
    { value: '#F97316', label: '橙色' },
    { value: '#F59E0B', label: '琥珀' },
    { value: '#EAB308', label: '黄色' },
    { value: '#84CC16', label: '青柠' },
    { value: '#22C55E', label: '绿色' },
    { value: '#10B981', label: '翠绿' },
    { value: '#14B8A6', label: '青色' },
    // 第二行：冷色系
    { value: '#06B6D4', label: '天青' },
    { value: '#0EA5E9', label: '天蓝' },
    { value: '#3B82F6', label: '蓝色' },
    { value: '#6366F1', label: '靛蓝' },
    { value: '#8B5CF6', label: '紫罗兰' },
    { value: '#A855F7', label: '紫色' },
    { value: '#D946EF', label: '洋红' },
    { value: '#EC4899', label: '粉色' },
    // 第三行：中性色
    { value: '#F43F5E', label: '玫瑰' },
    { value: '#78716C', label: '石灰' },
    { value: '#71717A', label: '锌灰' },
    { value: '#737373', label: '中性' },
    { value: '#6B7280', label: '灰色' },
    { value: '#64748B', label: '石板' },
    { value: '#475569', label: '深灰' },
    { value: '#1E293B', label: '深蓝灰' },
]

// 扩展颜色（更多选择）
const EXTENDED_COLORS = [
    // 红色系
    { value: '#FEE2E2', label: '浅红' },
    { value: '#FECACA', label: '淡红' },
    { value: '#FCA5A5', label: '粉红' },
    { value: '#F87171', label: '亮红' },
    { value: '#DC2626', label: '深红' },
    { value: '#B91C1C', label: '暗红' },
    { value: '#991B1B', label: '酒红' },
    { value: '#7F1D1D', label: '栗红' },
    // 橙色系
    { value: '#FFEDD5', label: '浅橙' },
    { value: '#FED7AA', label: '淡橙' },
    { value: '#FDBA74', label: '杏橙' },
    { value: '#FB923C', label: '亮橙' },
    { value: '#EA580C', label: '深橙' },
    { value: '#C2410C', label: '暗橙' },
    { value: '#9A3412', label: '赤橙' },
    { value: '#7C2D12', label: '棕橙' },
    // 绿色系
    { value: '#DCFCE7', label: '浅绿' },
    { value: '#BBF7D0', label: '淡绿' },
    { value: '#86EFAC', label: '嫩绿' },
    { value: '#4ADE80', label: '亮绿' },
    { value: '#16A34A', label: '深绿' },
    { value: '#15803D', label: '暗绿' },
    { value: '#166534', label: '墨绿' },
    { value: '#14532D', label: '森绿' },
    // 蓝色系
    { value: '#DBEAFE', label: '浅蓝' },
    { value: '#BFDBFE', label: '淡蓝' },
    { value: '#93C5FD', label: '天空蓝' },
    { value: '#60A5FA', label: '亮蓝' },
    { value: '#2563EB', label: '深蓝' },
    { value: '#1D4ED8', label: '暗蓝' },
    { value: '#1E40AF', label: '宝蓝' },
    { value: '#1E3A8A', label: '海军蓝' },
    // 紫色系
    { value: '#EDE9FE', label: '浅紫' },
    { value: '#DDD6FE', label: '淡紫' },
    { value: '#C4B5FD', label: '薰衣草' },
    { value: '#A78BFA', label: '亮紫' },
    { value: '#7C3AED', label: '深紫' },
    { value: '#6D28D9', label: '暗紫' },
    { value: '#5B21B6', label: '葡萄紫' },
    { value: '#4C1D95', label: '茄紫' },
]

export interface ColorPickerProps {
    /** 当前选中的颜色（HEX 格式） */
    value?: string
    /** 选择颜色时的回调 */
    onChange: (color: string) => void
    /** 是否禁用 */
    disabled?: boolean
    /** 是否显示扩展颜色 */
    showExtended?: boolean
    /** 是否允许自定义颜色 */
    allowCustom?: boolean
    /** 触发器的占位文本 */
    placeholder?: string
}

export function ColorPicker({
    value,
    onChange,
    disabled = false,
    showExtended = false,
    allowCustom = true,
    placeholder = '选择颜色',
}: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [customColor, setCustomColor] = useState(value || '#000000')
    const [showAllColors, setShowAllColors] = useState(showExtended)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const [position, setPosition] = useState({ top: 0, left: 0 })

    // 计算弹出面板位置
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            const panelWidth = 288 // w-72 = 18rem = 288px
            const panelHeight = 400

            // 计算左侧位置，确保不超出视口
            let left = rect.left
            if (left + panelWidth > window.innerWidth - 16) {
                left = window.innerWidth - panelWidth - 16
            }
            if (left < 16) left = 16

            // 计算顶部位置，优先显示在下方，空间不够则显示在上方
            let top = rect.bottom + 4
            if (top + panelHeight > window.innerHeight - 16) {
                top = rect.top - panelHeight - 4
            }
            if (top < 16) top = 16

            setPosition({ top, left })
        }
    }, [isOpen])

    const handleSelect = useCallback((color: string) => {
        onChange(color)
        setIsOpen(false)
    }, [onChange])

    const handleCustomColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value
        setCustomColor(color)
    }, [])

    const handleCustomColorApply = useCallback(() => {
        if (/^#[0-9A-Fa-f]{6}$/.test(customColor)) {
            onChange(customColor)
            setIsOpen(false)
        }
    }, [customColor, onChange])

    const displayColors = showAllColors
        ? [...PRESET_COLORS, ...EXTENDED_COLORS]
        : PRESET_COLORS

    return (
        <>
            {/* 触发器按钮 */}
            <Button
                ref={triggerRef}
                type="button"
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                {value ? (
                    <>
                        <span
                            className="h-4 w-4 rounded border"
                            style={{ backgroundColor: value }}
                        />
                        <span className="text-sm font-mono">{value}</span>
                    </>
                ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                )}
            </Button>

            {/* 下拉面板 - 使用 Portal 渲染到 body */}
            {isOpen && createPortal(
                <>
                    {/* 遮罩层 */}
                    <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* 颜色选择面板 */}
                    <div
                        className="fixed z-[101] w-72 rounded-2xl border bg-popover p-3 shadow-lg"
                        style={{ top: position.top, left: position.left }}
                    >
                        {/* 当前选中预览 */}
                        {value && (
                            <div className="mb-3 flex items-center gap-2 rounded-2xl border p-2">
                                <span
                                    className="h-8 w-8 rounded border"
                                    style={{ backgroundColor: value }}
                                />
                                <div>
                                    <p className="text-sm font-medium">当前颜色</p>
                                    <p className="text-xs font-mono text-muted-foreground">{value}</p>
                                </div>
                            </div>
                        )}

                        {/* 预设颜色网格 */}
                        <div className="mb-3">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                                预设颜色 {showAllColors ? `(${displayColors.length})` : ''}
                            </p>
                            <div className="grid grid-cols-8 gap-1.5">
                                {displayColors.map(({ value: colorValue, label }) => {
                                    const isSelected = value === colorValue
                                    return (
                                        <button
                                            key={colorValue}
                                            type="button"
                                            onClick={() => handleSelect(colorValue)}
                                            className={`
                        relative h-7 w-7 rounded-lg border-2 transition-all
                        hover:scale-110 hover:shadow-md
                        ${isSelected ? 'border-foreground ring-2 ring-foreground ring-offset-2' : 'border-transparent'}
                      `}
                                            style={{ backgroundColor: colorValue }}
                                            title={label}
                                        >
                                            {isSelected && (
                                                <Check
                                                    className="absolute inset-0 m-auto h-4 w-4"
                                                    style={{
                                                        color: isLightColor(colorValue) ? '#000' : '#fff'
                                                    }}
                                                />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* 展开/收起更多颜色 */}
                            {!showExtended && (
                                <button
                                    type="button"
                                    onClick={() => setShowAllColors(!showAllColors)}
                                    className="mt-2 text-xs text-primary hover:underline"
                                >
                                    {showAllColors ? '收起' : '显示更多颜色...'}
                                </button>
                            )}
                        </div>

                        {/* 自定义颜色 */}
                        {allowCustom && (
                            <div className="border-t pt-3">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                    自定义颜色
                                </p>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Pipette className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={customColor}
                                            onChange={handleCustomColorChange}
                                            placeholder="#000000"
                                            className="pl-8 font-mono text-sm"
                                            maxLength={7}
                                        />
                                    </div>
                                    <input
                                        type="color"
                                        value={customColor}
                                        onChange={handleCustomColorChange}
                                        className="h-10 w-10 cursor-pointer rounded border p-1"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleCustomColorApply}
                                        disabled={!/^#[0-9A-Fa-f]{6}$/.test(customColor)}
                                    >
                                        应用
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </>,
                document.body
            )}
        </>
    )
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 判断颜色是否为浅色
 */
function isLightColor(hex: string): boolean {
    const color = hex.replace('#', '')
    const r = parseInt(color.substr(0, 2), 16)
    const g = parseInt(color.substr(2, 2), 16)
    const b = parseInt(color.substr(4, 2), 16)
    // 使用相对亮度公式
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5
}

/**
 * 根据背景色获取合适的文字颜色
 */
export function getContrastColor(hex: string): string {
    return isLightColor(hex) ? '#000000' : '#ffffff'
}

// ============================================================
// 简化版颜色选择（内联样式）
// ============================================================

export interface ColorSwatchProps {
    /** 可选颜色列表 */
    colors?: string[]
    /** 当前选中的颜色 */
    value?: string
    /** 选择颜色时的回调 */
    onChange: (color: string) => void
    /** 是否禁用 */
    disabled?: boolean
    /** 色块大小 */
    size?: 'sm' | 'md' | 'lg'
}

/**
 * 简化版颜色色块选择器（适合内联使用）
 */
export function ColorSwatch({
    colors = PRESET_COLORS.slice(0, 8).map(c => c.value),
    value,
    onChange,
    disabled = false,
    size = 'md',
}: ColorSwatchProps) {
    const sizeClasses = {
        sm: 'h-5 w-5',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {colors.map((color) => {
                const isSelected = value === color
                return (
                    <button
                        key={color}
                        type="button"
                        onClick={() => !disabled && onChange(color)}
                        disabled={disabled}
                        className={`
              ${sizeClasses[size]} rounded-full border-2 transition-all
              ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'}
              ${isSelected ? 'border-foreground ring-2 ring-foreground ring-offset-1' : 'border-transparent'}
            `}
                        style={{ backgroundColor: color }}
                        title={color}
                    >
                        {isSelected && (
                            <Check
                                className="h-full w-full p-0.5"
                                style={{ color: isLightColor(color) ? '#000' : '#fff' }}
                            />
                        )}
                    </button>
                )
            })}
        </div>
    )
}

// 导出预设颜色供其他组件使用
export { PRESET_COLORS, EXTENDED_COLORS }

