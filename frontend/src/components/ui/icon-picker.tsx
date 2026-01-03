/**
 * IconPicker - 世界级图标选择器组件
 * 
 * 设计理念：
 * - 参考 Notion、Linear、Figma 的优雅设计
 * - 搜索优先，快速定位
 * - 分类清晰，侧边导航
 * - 大图标预览，易于识别
 * - 流畅动画，精致交互
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Search, X, Plus, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// ============================================================
// 图标分类定义 - 精选高质量图标
// ============================================================

const ICON_CATEGORIES: Record<string, { icon: string; icons: string[] }> = {
    '常用': {
        icon: 'star',
        icons: [
            'user', 'users', 'settings', 'home', 'search', 'menu', 'x', 'check',
            'plus', 'minus', 'edit', 'trash-2', 'save', 'download', 'upload',
            'refresh-cw', 'external-link', 'link', 'copy', 'clipboard',
        ],
    },
    '用户': {
        icon: 'user',
        icons: [
            'user', 'users', 'user-plus', 'user-minus', 'user-check', 'user-x',
            'user-circle', 'user-cog', 'contact', 'id-card', 'fingerprint',
            'badge', 'badge-check', 'smile', 'frown', 'meh',
        ],
    },
    '文件': {
        icon: 'file',
        icons: [
            'file', 'file-text', 'file-plus', 'file-minus', 'file-check', 'file-x',
            'file-edit', 'file-search', 'file-code', 'file-json', 'file-type',
            'files', 'folder', 'folder-open', 'folder-plus', 'folder-minus',
            'folder-tree', 'folder-input', 'folder-output', 'archive',
        ],
    },
    '编辑': {
        icon: 'edit-3',
        icons: [
            'edit', 'edit-2', 'edit-3', 'pencil', 'pen', 'pen-tool', 'eraser',
            'type', 'bold', 'italic', 'underline', 'strikethrough',
            'align-left', 'align-center', 'align-right', 'align-justify',
            'list', 'list-ordered', 'heading', 'quote', 'code', 'code-2',
        ],
    },
    '媒体': {
        icon: 'image',
        icons: [
            'image', 'images', 'camera', 'video', 'film', 'play', 'pause', 'stop',
            'play-circle', 'pause-circle', 'stop-circle', 'skip-back', 'skip-forward',
            'volume', 'volume-1', 'volume-2', 'volume-x', 'mic', 'mic-off',
            'music', 'music-2', 'music-3', 'music-4', 'headphones',
        ],
    },
    '通讯': {
        icon: 'mail',
        icons: [
            'mail', 'mail-open', 'mail-plus', 'mail-minus', 'mail-check', 'mail-x',
            'inbox', 'send', 'at-sign', 'phone', 'phone-call', 'phone-incoming',
            'phone-outgoing', 'phone-missed', 'phone-off', 'message-circle',
            'message-square', 'messages-square', 'megaphone', 'bell', 'bell-off',
        ],
    },
    '导航': {
        icon: 'compass',
        icons: [
            'home', 'menu', 'more-horizontal', 'more-vertical', 'grid', 'grid-3x3',
            'layout', 'layout-dashboard', 'layout-grid', 'layout-list',
            'sidebar', 'panel-left', 'panel-right', 'panel-top', 'panel-bottom',
            'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right',
            'chevron-up', 'chevron-down', 'chevron-left', 'chevron-right',
        ],
    },
    '状态': {
        icon: 'activity',
        icons: [
            'check', 'check-circle', 'check-square', 'x', 'x-circle', 'x-square',
            'alert-circle', 'alert-triangle', 'alert-octagon', 'info', 'help-circle',
            'ban', 'slash', 'loader', 'loader-2', 'hourglass', 'clock',
            'timer', 'timer-off', 'timer-reset', 'activity', 'zap', 'zap-off',
        ],
    },
    '组织': {
        icon: 'building-2',
        icons: [
            'building', 'building-2', 'factory', 'store', 'warehouse', 'landmark',
            'briefcase', 'hard-hat', 'graduation-cap', 'library', 'school',
            'users', 'network', 'git-branch', 'git-merge', 'git-pull-request',
            'sitemap', 'workflow', 'boxes', 'package', 'package-2',
        ],
    },
    '日期': {
        icon: 'calendar',
        icons: [
            'calendar', 'calendar-days', 'calendar-plus', 'calendar-minus',
            'calendar-check', 'calendar-x', 'calendar-range', 'calendar-clock',
            'clock', 'clock-1', 'clock-2', 'clock-3', 'clock-4', 'clock-5',
            'alarm-clock', 'alarm-clock-off', 'history', 'timer',
        ],
    },
    '标记': {
        icon: 'tag',
        icons: [
            'tag', 'tags', 'bookmark', 'bookmark-plus', 'bookmark-minus',
            'flag', 'flag-triangle-left', 'flag-triangle-right', 'flag-off',
            'star', 'star-half', 'star-off', 'heart', 'heart-off', 'thumbs-up',
            'thumbs-down', 'award', 'trophy', 'medal', 'crown', 'sparkles',
        ],
    },
    '数据': {
        icon: 'database',
        icons: [
            'database', 'server', 'hard-drive', 'cpu', 'memory-stick',
            'bar-chart', 'bar-chart-2', 'bar-chart-3', 'bar-chart-4',
            'pie-chart', 'line-chart', 'trending-up', 'trending-down',
            'percent', 'hash', 'binary', 'variable', 'sigma', 'function-square',
            'table', 'table-2', 'rows', 'columns', 'kanban', 'gantt-chart',
        ],
    },
    '财务': {
        icon: 'wallet',
        icons: [
            'dollar-sign', 'euro', 'pound-sterling', 'japanese-yen', 'indian-rupee',
            'bitcoin', 'coins', 'banknote', 'wallet', 'wallet-2', 'credit-card',
            'receipt', 'shopping-cart', 'shopping-bag', 'shopping-basket',
            'calculator', 'scale', 'scale-3d', 'piggy-bank', 'landmark',
        ],
    },
    '安全': {
        icon: 'shield',
        icons: [
            'lock', 'lock-open', 'unlock', 'key', 'key-round', 'key-square',
            'shield', 'shield-check', 'shield-x', 'shield-alert', 'shield-off',
            'eye', 'eye-off', 'scan', 'scan-face', 'fingerprint', 'lock-keyhole',
            'bug', 'bug-off', 'siren', 'alarm-smoke', 'shield-question',
        ],
    },
    '位置': {
        icon: 'map-pin',
        icons: [
            'map', 'map-pin', 'map-pinned', 'compass', 'navigation', 'navigation-2',
            'locate', 'locate-fixed', 'locate-off', 'crosshair', 'target',
            'globe', 'globe-2', 'earth', 'plane', 'car', 'bus', 'train', 'ship',
            'rocket', 'satellite', 'satellite-dish', 'radio-tower', 'signpost',
        ],
    },
    '开发': {
        icon: 'code-2',
        icons: [
            'code', 'code-2', 'terminal', 'terminal-square', 'command', 'option',
            'braces', 'brackets', 'parentheses', 'regex', 'binary',
            'git-branch', 'git-commit', 'git-merge', 'git-pull-request', 'git-fork',
            'github', 'gitlab', 'codepen', 'codesandbox', 'figma',
            'bug', 'bug-off', 'test-tube', 'test-tube-2', 'flask-conical',
        ],
    },
};

// ============================================================
// 工具函数
// ============================================================

function toPascalCase(str: string): string {
    return str
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

const EXCLUDED_EXPORTS = new Set([
    'createLucideIcon', 'default', 'icons', 'aliases',
    'IconNode', 'LucideIcon', 'LucideProps',
]);

function getLucideIcon(name: string): React.ComponentType<{ className?: string; size?: number }> | null {
    const pascalName = toPascalCase(name);
    if (EXCLUDED_EXPORTS.has(pascalName)) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Icon = (LucideIcons as any)[pascalName];
    if (Icon && (typeof Icon === 'function' || typeof Icon === 'object')) {
        return Icon;
    }
    return null;
}

function getAllIcons(): string[] {
    const allIcons = new Set<string>();
    Object.values(ICON_CATEGORIES).forEach(cat => {
        cat.icons.forEach(icon => allIcons.add(icon));
    });
    return Array.from(allIcons).sort();
}

// ============================================================
// 单个图标按钮
// ============================================================

interface IconButtonProps {
    icon: string;
    selected?: boolean;
    onSelect: () => void;
}

function IconButton({ icon, selected, onSelect }: IconButtonProps) {
    const Icon = getLucideIcon(icon);
    if (!Icon) return null;

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`
                group relative w-10 h-10 flex items-center justify-center rounded-lg
                transition-all duration-150 ease-out
                ${selected
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'hover:bg-slate-100 hover:scale-105 active:scale-95'
                }
            `}
            title={icon}
        >
            <Icon size={20} className="transition-transform group-hover:scale-110" />
            {selected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                    <Check size={10} className="text-white" />
                </div>
            )}
        </button>
    );
}

// ============================================================
// 分类侧边栏项
// ============================================================

interface CategoryItemProps {
    name: string;
    icon: string;
    count: number;
    active: boolean;
    onClick: () => void;
}

function CategoryItem({ name, icon, count, active, onClick }: CategoryItemProps) {
    const Icon = getLucideIcon(icon);

    return (
        <button
            type="button"
            onClick={onClick}
            title={`${name} (${count})`}
            className={`
                w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left text-xs
                transition-all duration-150
                ${active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }
            `}
        >
            {Icon && <Icon size={14} className={active ? 'text-white' : 'text-slate-400'} />}
            <span className="flex-1">{name}</span>
            <span className={`text-[10px] tabular-nums ${active ? 'text-slate-400' : 'text-slate-400'}`}>
                {count}
            </span>
        </button>
    );
}

// ============================================================
// 主组件
// ============================================================

export interface IconPickerProps {
    value?: string;
    onChange: (icon: string) => void;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
}

export function IconPicker({
    value,
    onChange,
    size = 'md',
    disabled = false,
    className,
}: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('常用');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const allIcons = useMemo(() => getAllIcons(), []);
    const CurrentIcon = value ? getLucideIcon(value) : null;
    const categories = Object.keys(ICON_CATEGORIES);

    // 搜索结果
    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        const term = searchTerm.toLowerCase();
        return allIcons.filter(icon => icon.toLowerCase().includes(term));
    }, [allIcons, searchTerm]);

    // 当前分类的图标
    const currentIcons = searchTerm
        ? searchResults
        : ICON_CATEGORIES[activeCategory]?.icons || [];

    // 打开时聚焦搜索框
    useEffect(() => {
        if (open) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        } else {
            setSearchTerm('');
        }
    }, [open]);

    const sizeConfig = {
        sm: { button: 'w-8 h-8', icon: 14 },
        md: { button: 'w-10 h-10', icon: 18 },
        lg: { button: 'w-12 h-12', icon: 22 },
    };

    function handleSelect(icon: string) {
        onChange(icon);
        setOpen(false);
    }

    function handleClear(e: React.MouseEvent) {
        e.stopPropagation();
        onChange('');
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={`${sizeConfig[size].button} p-0 relative ${className}`}
                >
                    {CurrentIcon ? (
                        <>
                            <CurrentIcon size={sizeConfig[size].icon} />
                            {value && (
                                <span
                                    role="button"
                                    tabIndex={0}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-slate-500 rounded-full flex items-center justify-center hover:bg-slate-600 transition-colors cursor-pointer"
                                    onClick={handleClear}
                                    onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
                                >
                                    <X size={10} className="text-white" />
                                </span>
                            )}
                        </>
                    ) : (
                        <Plus size={sizeConfig[size].icon} className="text-slate-400" />
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-[480px] p-0 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden"
                align="start"
                sideOffset={8}
                onWheel={(e) => e.stopPropagation()}
            >
                {/* 搜索栏 */}
                <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            ref={searchInputRef}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="搜索图标..."
                            className="pl-9 h-9 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100"
                                onClick={() => setSearchTerm('')}
                            >
                                <X className="h-3.5 w-3.5 text-slate-400" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex h-80">
                    {/* 分类侧边栏 */}
                    {!searchTerm && (
                        <div className="w-28 border-r border-slate-100 bg-slate-50/30 h-full">
                            <ScrollArea className="h-full">
                                <div className="p-1.5 space-y-0.5">
                                    {categories.map(cat => (
                                        <CategoryItem
                                            key={cat}
                                            name={cat}
                                            icon={ICON_CATEGORIES[cat].icon}
                                            count={ICON_CATEGORIES[cat].icons.length}
                                            active={activeCategory === cat}
                                            onClick={() => setActiveCategory(cat)}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* 图标网格 */}
                    <div className="flex-1 h-full">
                        <ScrollArea className="h-full">
                            <div className="p-3">
                                {searchTerm && (
                                    <div className="mb-2 text-xs text-slate-500">
                                        找到 {searchResults.length} 个图标
                                    </div>
                                )}

                                {currentIcons.length > 0 ? (
                                    <div className="grid grid-cols-7 gap-1">
                                        {currentIcons.map(icon => (
                                            <IconButton
                                                key={icon}
                                                icon={icon}
                                                selected={value === icon}
                                                onSelect={() => handleSelect(icon)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <Search size={32} className="mb-2 opacity-50" />
                                        <p className="text-sm">未找到匹配的图标</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* 底部状态栏 */}
                {value && (
                    <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {CurrentIcon && (
                                <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                                    <CurrentIcon size={18} />
                                </div>
                            )}
                            <div>
                                <div className="text-xs text-slate-500">当前选择</div>
                                <code className="text-xs font-mono text-slate-700">{value}</code>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onChange('')}
                            className="text-xs text-slate-500 hover:text-slate-700"
                        >
                            清除选择
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

// ============================================================
// IconDisplay - 图标显示组件
// ============================================================

export interface IconDisplayProps {
    name: string;
    size?: number;
    className?: string;
}

export function IconDisplay({ name, size = 16, className }: IconDisplayProps) {
    const Icon = getLucideIcon(name);
    if (!Icon) return null;
    return <Icon size={size} className={className} />;
}

export default IconPicker;

