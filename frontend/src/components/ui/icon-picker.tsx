import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ComponentType } from 'react'
import { Input } from './input'
import { Button } from './button'
import { ScrollArea } from './scroll-area'
import { Search, X, Check, ChevronRight, icons } from 'lucide-react'

// ============================================================
// 图标选择器组件
// ============================================================

// Lucide 图标类型
type LucideIconComponent = ComponentType<{ className?: string }>

// 将 PascalCase 转换为 kebab-case（用于存储）
function toKebabCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
        .toLowerCase()
}

// 将 kebab-case 转换为 PascalCase（用于查找组件）
function toPascalCase(str: string): string {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
}

// ============================================================
// 图标分类定义
// ============================================================

const ICON_CATEGORIES: Record<string, { label: string; icons: string[] }> = {
    common: {
        label: '常用',
        icons: [
            'Home', 'Search', 'Settings', 'User', 'Users', 'Star', 'Heart', 'Check', 'X', 'Plus', 'Minus',
            'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown',
            'Menu', 'MoreHorizontal', 'MoreVertical', 'Filter', 'SlidersHorizontal', 'Loader', 'RefreshCw',
        ],
    },
    design: {
        label: '设计',
        icons: [
            'Palette', 'Paintbrush', 'PenTool', 'Pencil', 'Brush', 'Eraser', 'Pipette', 'Droplet', 'Droplets',
            'Scissors', 'Ruler', 'Move', 'Move3d', 'RotateCw', 'RotateCcw', 'FlipHorizontal', 'FlipVertical',
            'Layers', 'Layers2', 'Layers3', 'Square', 'Circle', 'Triangle', 'Pentagon', 'Hexagon', 'Octagon',
            'Diamond', 'Sparkles', 'Sparkle', 'Wand', 'Wand2', 'Component', 'Blocks', 'Box', 'Boxes',
            'Layout', 'LayoutGrid', 'LayoutList', 'LayoutDashboard', 'LayoutTemplate', 'LayoutPanelLeft',
            'Grid2x2', 'Grid3x3', 'AlignLeft', 'AlignCenter', 'AlignRight', 'AlignJustify',
        ],
    },
    files: {
        label: '文件',
        icons: [
            'File', 'FileText', 'FileCode', 'FileCode2', 'FileJson', 'FileJson2', 'FileCog', 'FileCheck', 'FileCheck2',
            'FilePlus', 'FilePlus2', 'FileMinus', 'FileMinus2', 'FileX', 'FileX2', 'FileSearch', 'FileSearch2',
            'FileInput', 'FileOutput', 'FileImage', 'FileVideo', 'FileAudio', 'FileArchive', 'FileSpreadsheet',
            'FileType', 'FileType2', 'FileWarning', 'FileQuestion', 'FileLock', 'FileLock2', 'FileKey', 'FileKey2',
            'Files', 'Folder', 'FolderOpen', 'FolderPlus', 'FolderMinus', 'FolderX', 'FolderCheck', 'FolderSearch',
            'FolderInput', 'FolderOutput', 'FolderArchive', 'FolderCog', 'FolderDot', 'FolderGit', 'FolderGit2',
            'FolderHeart', 'FolderKanban', 'FolderKey', 'FolderLock', 'FolderRoot', 'FolderTree',
            'Archive', 'ArchiveRestore', 'ArchiveX', 'Clipboard', 'ClipboardCheck', 'ClipboardCopy', 'ClipboardList',
            'ClipboardPaste', 'ClipboardPen', 'ClipboardType', 'ClipboardX',
        ],
    },
    media: {
        label: '媒体',
        icons: [
            'Image', 'ImagePlus', 'ImageMinus', 'ImageOff', 'Images', 'Camera', 'CameraOff', 'Video', 'VideoOff',
            'Film', 'Clapperboard', 'Play', 'Pause', 'Square', 'StopCircle', 'SkipBack', 'SkipForward',
            'Rewind', 'FastForward', 'Volume', 'Volume1', 'Volume2', 'VolumeX', 'Music', 'Music2', 'Music3', 'Music4',
            'Mic', 'MicOff', 'Mic2', 'Headphones', 'Speaker', 'Radio', 'Disc', 'Disc2', 'Disc3',
            'Youtube', 'Twitch', 'Instagram', 'Twitter', 'Facebook', 'Linkedin', 'Github', 'Gitlab',
            'Aperture', 'Focus', 'ScanLine', 'Scan', 'ScanFace', 'ScanEye', 'ScanSearch', 'ScanText',
        ],
    },
    communication: {
        label: '通讯',
        icons: [
            'Mail', 'MailOpen', 'MailPlus', 'MailMinus', 'MailCheck', 'MailX', 'MailWarning', 'MailQuestion', 'MailSearch',
            'Inbox', 'Send', 'SendHorizontal', 'Forward', 'Reply', 'ReplyAll', 'AtSign', 'Hash',
            'MessageCircle', 'MessageSquare', 'MessagesSquare', 'MessageCirclePlus', 'MessageSquarePlus',
            'MessageCircleWarning', 'MessageSquareWarning', 'MessageCircleX', 'MessageSquareX',
            'Phone', 'PhoneCall', 'PhoneForwarded', 'PhoneIncoming', 'PhoneMissed', 'PhoneOff', 'PhoneOutgoing',
            'Bell', 'BellDot', 'BellMinus', 'BellOff', 'BellPlus', 'BellRing', 'Megaphone',
            'Share', 'Share2', 'ExternalLink', 'Link', 'Link2', 'LinkOff', 'Unlink', 'Unlink2',
            'QrCode', 'Rss', 'Podcast', 'Radio', 'Cast', 'Airplay', 'ScreenShare', 'ScreenShareOff',
        ],
    },
    business: {
        label: '商业',
        icons: [
            'Briefcase', 'BriefcaseBusiness', 'BriefcaseMedical', 'Building', 'Building2', 'Factory', 'Warehouse', 'Store',
            'ShoppingCart', 'ShoppingBag', 'ShoppingBasket', 'Package', 'Package2', 'PackageCheck', 'PackageMinus',
            'PackageOpen', 'PackagePlus', 'PackageSearch', 'PackageX', 'Boxes', 'Container', 'Truck', 'Ship',
            'CreditCard', 'Wallet', 'Wallet2', 'Banknote', 'Receipt', 'ReceiptText',
            'DollarSign', 'Euro', 'PoundSterling', 'JapaneseYen', 'IndianRupee', 'RussianRuble', 'SwissFranc',
            'Bitcoin', 'Coins', 'PiggyBank', 'Landmark', 'BadgeDollarSign', 'BadgePercent', 'BadgeCent',
            'Percent', 'TrendingUp', 'TrendingDown', 'BarChart', 'BarChart2', 'BarChart3', 'BarChart4',
            'PieChart', 'LineChart', 'AreaChart', 'Activity', 'Gauge', 'Target', 'Goal', 'CircleDollarSign',
            'HandCoins', 'Handshake', 'Scale', 'Scale3d', 'Gavel', 'Award', 'Trophy', 'Medal', 'Crown',
        ],
    },
    user: {
        label: '用户',
        icons: [
            'User', 'UserCheck', 'UserCog', 'UserMinus', 'UserPlus', 'UserX', 'UserCircle', 'UserCircle2', 'UserSquare', 'UserSquare2',
            'Users', 'UsersRound', 'UserRound', 'UserRoundCheck', 'UserRoundCog', 'UserRoundMinus', 'UserRoundPlus', 'UserRoundX',
            'Contact', 'Contact2', 'CircleUser', 'CircleUserRound', 'IdCard', 'BadgeCheck', 'Badge', 'BadgeAlert', 'BadgeHelp', 'BadgeInfo', 'BadgeMinus', 'BadgePlus', 'BadgeX',
            'Smile', 'Frown', 'Meh', 'Angry', 'Laugh', 'SmilePlus', 'Annoyed',
            'PersonStanding', 'Accessibility', 'Baby', 'Footprints', 'Hand', 'HandMetal', 'Grab', 'GripHorizontal', 'GripVertical',
        ],
    },
    device: {
        label: '设备',
        icons: [
            'Monitor', 'MonitorCheck', 'MonitorDot', 'MonitorOff', 'MonitorPause', 'MonitorPlay', 'MonitorSmartphone', 'MonitorSpeaker', 'MonitorStop', 'MonitorUp', 'MonitorX',
            'Laptop', 'Laptop2', 'Tablet', 'TabletSmartphone', 'Smartphone', 'Watch',
            'Tv', 'Tv2', 'Cast', 'Airplay', 'Projector', 'Presentation',
            'Keyboard', 'Mouse', 'MousePointer', 'MousePointer2', 'MousePointerClick', 'TouchpadOff', 'Touchpad',
            'Printer', 'PrinterCheck', 'Webcam', 'Usb', 'Cable', 'Plug', 'PlugZap', 'PlugZap2', 'Unplug',
            'Battery', 'BatteryCharging', 'BatteryFull', 'BatteryLow', 'BatteryMedium', 'BatteryWarning',
            'Power', 'PowerOff', 'PowerCircle', 'Zap', 'ZapOff', 'Lightbulb', 'LightbulbOff',
            'Cpu', 'CircuitBoard', 'HardDrive', 'HardDriveDownload', 'HardDriveUpload', 'MemoryStick', 'SdCard', 'Sim',
            'Server', 'ServerCog', 'ServerCrash', 'ServerOff', 'Database', 'DatabaseBackup', 'DatabaseZap',
        ],
    },
    navigation: {
        label: '导航',
        icons: [
            'Map', 'MapPin', 'MapPinned', 'MapPinOff', 'Navigation', 'Navigation2', 'NavigationOff', 'Compass', 'Locate', 'LocateFixed', 'LocateOff',
            'Move', 'MoveHorizontal', 'MoveVertical', 'MoveDiagonal', 'MoveDiagonal2', 'Maximize', 'Maximize2', 'Minimize', 'Minimize2',
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUpLeft', 'ArrowUpRight', 'ArrowDownLeft', 'ArrowDownRight',
            'ArrowBigUp', 'ArrowBigDown', 'ArrowBigLeft', 'ArrowBigRight', 'ArrowUpCircle', 'ArrowDownCircle', 'ArrowLeftCircle', 'ArrowRightCircle',
            'ChevronUp', 'ChevronDown', 'ChevronLeft', 'ChevronRight', 'ChevronsUp', 'ChevronsDown', 'ChevronsLeft', 'ChevronsRight',
            'ChevronFirst', 'ChevronLast', 'ChevronsUpDown', 'ChevronsLeftRight', 'CornerDownLeft', 'CornerDownRight', 'CornerLeftDown', 'CornerLeftUp',
            'CornerRightDown', 'CornerRightUp', 'CornerUpLeft', 'CornerUpRight', 'Milestone', 'Signpost', 'SignpostBig',
            'Home', 'House', 'HousePlus', 'Building', 'Building2', 'Hotel', 'School', 'School2', 'Church', 'Castle', 'Tent', 'TentTree',
        ],
    },
    weather: {
        label: '天气',
        icons: [
            'Sun', 'SunDim', 'SunMedium', 'SunMoon', 'Sunrise', 'Sunset', 'Moon', 'MoonStar',
            'Cloud', 'CloudCog', 'CloudDrizzle', 'CloudFog', 'CloudHail', 'CloudLightning', 'CloudMoon', 'CloudMoonRain',
            'CloudOff', 'CloudRain', 'CloudRainWind', 'CloudSnow', 'CloudSun', 'CloudSunRain', 'Cloudy',
            'Wind', 'Tornado', 'Rainbow', 'Umbrella', 'UmbrellaOff', 'Waves', 'Droplet', 'Droplets',
            'Snowflake', 'Thermometer', 'ThermometerSnowflake', 'ThermometerSun', 'Flame', 'FlameKindling',
            'Haze', 'Eclipse', 'Stars', 'Sparkles', 'Sparkle', 'CloudyNight',
        ],
    },
    nature: {
        label: '自然',
        icons: [
            'Leaf', 'TreeDeciduous', 'TreePine', 'Trees', 'Flower', 'Flower2', 'Clover', 'Sprout',
            'Apple', 'Banana', 'Cherry', 'Citrus', 'Grape', 'Nut', 'Salad', 'Carrot', 'Bean', 'Wheat', 'Hop',
            'Bird', 'Bug', 'Fish', 'Cat', 'Dog', 'Rabbit', 'Squirrel', 'Rat', 'Turtle', 'Snail', 'Shell',
            'Egg', 'EggFried', 'Beef', 'Bone', 'Drumstick', 'Ham', 'Milk', 'IceCream', 'IceCreamCone',
            'Mountain', 'MountainSnow', 'Palmtree', 'Sunrise', 'Sunset', 'Waves', 'Anchor', 'Sailboat',
            'Gem', 'Crown', 'Diamond', 'Feather', 'Footprints', 'Paw', 'PawPrint',
        ],
    },
    security: {
        label: '安全',
        icons: [
            'Lock', 'LockKeyhole', 'LockKeyholeOpen', 'LockOpen', 'Unlock', 'UnlockKeyhole',
            'Key', 'KeyRound', 'KeySquare', 'Fingerprint', 'ScanFace', 'ScanEye',
            'Shield', 'ShieldAlert', 'ShieldBan', 'ShieldCheck', 'ShieldEllipsis', 'ShieldHalf', 'ShieldMinus', 'ShieldOff', 'ShieldPlus', 'ShieldQuestion', 'ShieldX',
            'Eye', 'EyeOff', 'Glasses', 'View', 'EyeClosed',
            'AlertCircle', 'AlertOctagon', 'AlertTriangle', 'Ban', 'CircleSlash', 'OctagonAlert', 'OctagonX', 'TriangleAlert',
            'Bug', 'BugOff', 'BugPlay', 'Skull', 'SkullCrossed', 'Biohazard', 'Radiation',
            'Siren', 'Alarm', 'AlarmClock', 'AlarmClockCheck', 'AlarmClockMinus', 'AlarmClockOff', 'AlarmClockPlus',
        ],
    },
    edit: {
        label: '编辑',
        icons: [
            'Edit', 'Edit2', 'Edit3', 'Pencil', 'PencilLine', 'PencilRuler', 'Pen', 'PenLine', 'PenTool',
            'Copy', 'CopyCheck', 'CopyMinus', 'CopyPlus', 'CopySlash', 'CopyX', 'Clipboard', 'ClipboardCopy', 'ClipboardPaste',
            'Cut', 'Scissors', 'ScissorsLineDashed', 'ScissorsSquare', 'ScissorsSquareDashedBottom',
            'Trash', 'Trash2', 'Eraser', 'Delete', 'CircleX', 'XCircle', 'XSquare',
            'Save', 'SaveAll', 'Download', 'Upload', 'Import', 'FileDown', 'FileUp',
            'Undo', 'Undo2', 'Redo', 'Redo2', 'History', 'RotateCcw', 'RotateCw',
            'Type', 'Bold', 'Italic', 'Underline', 'Strikethrough', 'Subscript', 'Superscript',
            'AlignLeft', 'AlignCenter', 'AlignRight', 'AlignJustify', 'Indent', 'IndentDecrease', 'IndentIncrease',
            'List', 'ListChecks', 'ListEnd', 'ListFilter', 'ListMinus', 'ListMusic', 'ListOrdered', 'ListPlus', 'ListRestart', 'ListStart', 'ListTodo', 'ListTree', 'ListVideo', 'ListX',
            'Quote', 'Heading', 'Heading1', 'Heading2', 'Heading3', 'Heading4', 'Heading5', 'Heading6',
            'Table', 'Table2', 'TableProperties', 'Columns2', 'Columns3', 'Columns4', 'Rows2', 'Rows3', 'Rows4',
        ],
    },
    development: {
        label: '开发',
        icons: [
            'Code', 'Code2', 'CodeXml', 'Braces', 'Brackets', 'Terminal', 'TerminalSquare',
            'Bug', 'BugOff', 'BugPlay', 'TestTube', 'TestTube2', 'TestTubes', 'FlaskConical', 'FlaskConicalOff', 'FlaskRound',
            'GitBranch', 'GitBranchPlus', 'GitCommitHorizontal', 'GitCommitVertical', 'GitCompare', 'GitCompareArrows',
            'GitFork', 'GitGraph', 'GitMerge', 'GitPullRequest', 'GitPullRequestArrow', 'GitPullRequestClosed', 'GitPullRequestCreate', 'GitPullRequestDraft',
            'Github', 'Gitlab', 'Chrome', 'Codepen', 'Codesandbox', 'Figma', 'Framer',
            'Database', 'DatabaseBackup', 'DatabaseZap', 'Server', 'ServerCog', 'ServerCrash', 'ServerOff',
            'Container', 'Dock', 'Binary', 'Regex', 'Variable', 'Sigma', 'Pi', 'Infinity', 'Hash',
            'Webhook', 'WebhookOff', 'Api', 'Rss', 'Puzzle', 'Route', 'Workflow',
            'Network', 'Globe', 'Globe2', 'Earth', 'Languages', 'Binary', 'Blocks', 'Component',
        ],
    },
    time: {
        label: '时间',
        icons: [
            'Clock', 'Clock1', 'Clock2', 'Clock3', 'Clock4', 'Clock5', 'Clock6', 'Clock7', 'Clock8', 'Clock9', 'Clock10', 'Clock11', 'Clock12',
            'Timer', 'TimerOff', 'TimerReset', 'Hourglass', 'Stopwatch', 'Watch',
            'Calendar', 'CalendarCheck', 'CalendarCheck2', 'CalendarClock', 'CalendarDays', 'CalendarFold', 'CalendarHeart', 'CalendarMinus', 'CalendarOff', 'CalendarPlus', 'CalendarRange', 'CalendarSearch', 'CalendarX', 'CalendarX2',
            'History', 'Undo', 'Redo', 'RefreshCw', 'RefreshCcw', 'RotateCcw', 'RotateCw',
            'Play', 'Pause', 'FastForward', 'Rewind', 'SkipForward', 'SkipBack',
            'Sunrise', 'Sunset', 'Moon', 'Sun',
        ],
    },
    transport: {
        label: '交通',
        icons: [
            'Car', 'CarFront', 'CarTaxiFront', 'Bus', 'BusFront', 'Truck', 'TruckBack', 'Ambulance',
            'Bike', 'Bicycle', 'Cableway', 'Cable', 'CableCar', 'Tractor', 'Forklift',
            'Train', 'TrainFront', 'TrainFrontTunnel', 'TrainTrack', 'TramFront', 'Subway',
            'Plane', 'PlaneLanding', 'PlaneTakeoff', 'Helicopter', 'Rocket',
            'Ship', 'Sailboat', 'ShipWheel', 'Anchor', 'Waves', 'LifeBuoy', 'Compass',
            'MapPin', 'MapPinned', 'MapPinOff', 'Map', 'Navigation', 'Navigation2', 'NavigationOff',
            'Route', 'Milestone', 'Signpost', 'SignpostBig', 'Traffic', 'TrafficCone', 'Construction',
            'Fuel', 'ParkingCircle', 'ParkingCircleOff', 'ParkingMeter', 'ParkingSquare', 'ParkingSquareOff',
        ],
    },
    health: {
        label: '健康',
        icons: [
            'Heart', 'HeartCrack', 'HeartHandshake', 'HeartOff', 'HeartPulse', 'Activity', 'ActivitySquare',
            'Stethoscope', 'Thermometer', 'ThermometerSnowflake', 'ThermometerSun', 'Syringe', 'Pill', 'PillBottle',
            'BriefcaseMedical', 'Hospital', 'HospitalSquare', 'AmbulanceCharge', 'CrossCircle', 'CrossSquare',
            'Accessibility', 'Wheelchair', 'Crutch', 'EarOff', 'Ear', 'Eye', 'EyeOff',
            'Brain', 'BrainCircuit', 'BrainCog', 'Bone', 'Dna', 'DnaOff', 'Microscope',
            'Apple', 'Salad', 'Carrot', 'Milk', 'Beef', 'Cookie', 'Candy', 'CandyCane', 'CandyOff',
            'Dumbbell', 'Footprints', 'PersonStanding', 'Stretch', 'Moon', 'Sun', 'Bed', 'BedDouble', 'BedSingle',
        ],
    },
    other: {
        label: '其他',
        icons: [], // 将在运行时填充未分类的图标
    },
}

// 使用 lucide-react 的 icons 对象获取所有图标
const ALL_ICONS = icons as unknown as Record<string, LucideIconComponent>
const ICON_NAMES = Object.keys(ALL_ICONS)

// 获取所有已分类的图标名
const CATEGORIZED_ICONS = new Set(
    Object.values(ICON_CATEGORIES)
        .flatMap(cat => cat.icons)
)

// 填充"其他"分类
ICON_CATEGORIES.other.icons = ICON_NAMES.filter(name => !CATEGORIZED_ICONS.has(name))

export interface IconPickerProps {
    /** 当前选中的图标（kebab-case 格式，如 'pen-tool'） */
    value?: string
    /** 选择图标时的回调 */
    onChange: (iconKey: string) => void
    /** 是否禁用 */
    disabled?: boolean
    /** 触发器的占位文本 */
    placeholder?: string
}

export function IconPicker({
    value,
    onChange,
    disabled = false,
    placeholder = '选择图标',
}: IconPickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    // 默认只展开"常用"分类
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['common']))
    const triggerRef = useRef<HTMLButtonElement>(null)
    const [position, setPosition] = useState({ top: 0, left: 0 })

    // 计算弹出面板位置
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            const panelWidth = 480
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

    // 获取当前选中的图标组件
    const selectedIconName = value ? toPascalCase(value) : null
    const SelectedIcon = selectedIconName ? ALL_ICONS[selectedIconName] : null

    // 切换分类展开/折叠
    const toggleCategory = useCallback((categoryKey: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            if (next.has(categoryKey)) {
                next.delete(categoryKey)
            } else {
                next.add(categoryKey)
            }
            return next
        })
    }, [])

    // 过滤图标
    const filteredCategories = useMemo(() => {
        const searchLower = search.toLowerCase()

        if (!search) {
            // 无搜索时，按分类显示（过滤掉实际不存在的图标）
            return Object.entries(ICON_CATEGORIES).map(([key, cat]) => ({
                key,
                label: cat.label,
                icons: cat.icons.filter(name => ALL_ICONS[name]),
            })).filter(cat => cat.icons.length > 0)
        }

        // 搜索时，返回匹配的图标（扁平化）
        const matchedIcons = ICON_NAMES.filter(name =>
            name.toLowerCase().includes(searchLower) ||
            toKebabCase(name).includes(searchLower)
        )

        return [{
            key: 'search',
            label: `搜索结果 (${matchedIcons.length})`,
            icons: matchedIcons,
        }]
    }, [search])

    const handleSelect = useCallback((iconName: string) => {
        onChange(toKebabCase(iconName))
        setIsOpen(false)
        setSearch('')
    }, [onChange])

    const totalIcons = ICON_NAMES.length

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
                {SelectedIcon ? (
                    <>
                        <SelectedIcon className="h-4 w-4" />
                        <span className="text-sm">{value}</span>
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
                        onClick={() => {
                            setIsOpen(false)
                            setSearch('')
                        }}
                    />

                    {/* 图标选择面板 */}
                    <div
                        className="fixed z-[101] w-[480px] rounded-2xl border bg-popover shadow-lg"
                        style={{ top: position.top, left: position.left }}
                    >
                        {/* 搜索框 */}
                        <div className="p-3 border-b">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={`在 ${totalIcons} 个图标中搜索...`}
                                    className="pl-8 pr-8"
                                    autoFocus
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 图标内容区 */}
                        <ScrollArea className="h-80">
                            <div className="p-2 space-y-1">
                                {filteredCategories.map(({ key, label, icons: categoryIcons }) => {
                                    // 搜索结果始终展开
                                    const isExpanded = key === 'search' || expandedCategories.has(key)

                                    return (
                                        <div key={key} className="border rounded-2xl overflow-hidden">
                                            {/* 分类标题 - 可点击 */}
                                            <button
                                                type="button"
                                                onClick={() => key !== 'search' && toggleCategory(key)}
                                                className={`
                                                    w-full flex items-center justify-between px-3 py-2
                                                    hover:bg-accent/50 transition-colors
                                                    ${key === 'search' ? 'cursor-default' : 'cursor-pointer'}
                                                `}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {key !== 'search' && (
                                                        <ChevronRight
                                                            className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                        />
                                                    )}
                                                    <span className="text-sm font-medium">
                                                        {label}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                    {categoryIcons.length}
                                                </span>
                                            </button>

                                            {/* 图标网格 - 可折叠 */}
                                            {isExpanded && (
                                                <div className="p-2 pt-0 border-t bg-muted/30">
                                                    <div className="grid grid-cols-10 gap-1 pt-2">
                                                        {categoryIcons.map((iconName) => {
                                                            const IconComponent = ALL_ICONS[iconName]
                                                            if (!IconComponent) return null

                                                            const iconKey = toKebabCase(iconName)
                                                            const isSelected = value === iconKey

                                                            return (
                                                                <button
                                                                    key={iconName}
                                                                    type="button"
                                                                    onClick={() => handleSelect(iconName)}
                                                                    className={`
                                                                        relative flex h-9 w-9 items-center justify-center rounded-xl
                                                                        transition-colors hover:bg-accent bg-background
                                                                        ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                                                                    `}
                                                                    title={iconName}
                                                                >
                                                                    <IconComponent className="h-4 w-4" />
                                                                    {isSelected && (
                                                                        <Check className="absolute -right-0.5 -top-0.5 h-3 w-3 text-primary" />
                                                                    )}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </>,
                document.body
            )}
        </>
    )
}

// ============================================================
// 导出工具函数（供其他组件使用）
// ============================================================

/**
 * 根据 kebab-case 图标键获取图标组件
 */
export function getIconByKey(iconKey: string): LucideIconComponent | null {
    const pascalName = toPascalCase(iconKey)
    return ALL_ICONS[pascalName] || null
}

/**
 * 动态图标组件
 */
export function DynamicIcon({
    iconKey,
    className,
    fallback = 'Folder'
}: {
    iconKey: string
    className?: string
    fallback?: string
}) {
    const Icon = getIconByKey(iconKey) || getIconByKey(fallback)
    if (!Icon) return null
    return <Icon className={className} />
}
