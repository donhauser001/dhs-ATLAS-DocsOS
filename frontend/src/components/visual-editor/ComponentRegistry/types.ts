/**
 * ComponentRegistry - 类型定义
 * 
 * 定义组件注册系统的所有类型
 */

import { ReactNode } from 'react';

// ============================================================
// 基础类型
// ============================================================

/** 组件选项 */
export interface ComponentOption {
    value: string;
}

/** 组件类型 */
export type ComponentType =
    | 'select'
    | 'multi-select'
    | 'radio'
    | 'checkbox'
    | 'rating'
    | 'number'
    | 'date'
    | 'text'
    | 'textarea'
    | 'file'
    | 'files'
    | 'image'
    | 'images'
    | 'phone'
    | 'email'
    | 'id-card'
    | 'toggle'
    | 'folder-picker'
    | 'avatar'
    | 'file-list'
    | 'tags'
    | 'id-generator'
    // Phase 4.3 新增组件
    | 'password'
    | 'timestamp'
    | 'url'
    | 'color'
    | 'icon-picker'
    | 'progress'
    | 'qrcode'
    | 'barcode'
    | 'document-link'
    | 'relation-picker'
    | 'user-picker'
    | 'computed'
    | 'formula'
    | 'signature'
    | 'rich-text'
    | 'json'
    | 'login-stats'
    | 'audit-log'
    // Phase 4.2: 用户认证组件
    | 'user-auth';

// ============================================================
// 组件定义类型
// ============================================================

/** 基础组件定义 */
export interface BaseComponentDefinition {
    type: ComponentType;
    id: string;
    label: string;
    description?: string;
}

/** 选择类组件定义 */
export interface SelectComponentDefinition extends BaseComponentDefinition {
    type: 'select' | 'multi-select' | 'radio' | 'checkbox';
    options: ComponentOption[];
    maxSelect?: number;
}

/** 评分组件定义 */
export interface RatingComponentDefinition extends BaseComponentDefinition {
    type: 'rating';
    max?: number;
    allowHalf?: boolean;
}

/** 数字组件定义 */
export interface NumberComponentDefinition extends BaseComponentDefinition {
    type: 'number';
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
}

/** 日期组件定义 */
export interface DateComponentDefinition extends BaseComponentDefinition {
    type: 'date';
    format?: string;
    includeTime?: boolean;
}

/** 文本组件定义 */
export interface TextComponentDefinition extends BaseComponentDefinition {
    type: 'text';
    placeholder?: string;
    maxLength?: number;
}

/** 多行文本组件定义 */
export interface TextareaComponentDefinition extends BaseComponentDefinition {
    type: 'textarea';
    placeholder?: string;
    rows?: number;
    maxLength?: number;
}

/** 文件组件定义 */
export interface FileComponentDefinition extends BaseComponentDefinition {
    type: 'file';
    accept?: string[];
    maxSize?: number;
    /** 上传目录 */
    directory?: string;
}

/** 多文件组件定义 */
export interface FilesComponentDefinition extends BaseComponentDefinition {
    type: 'files';
    accept?: string[];
    maxCount?: number;
    maxSize?: number;
    /** 上传目录 */
    directory?: string;
}

/** 图片组件定义 */
export interface ImageComponentDefinition extends BaseComponentDefinition {
    type: 'image';
    accept?: string[];
    maxSize?: number;
    /** 上传目录 */
    directory?: string;
}

/** 多图片组件定义 */
export interface ImagesComponentDefinition extends BaseComponentDefinition {
    type: 'images';
    accept?: string[];
    maxCount?: number;
    maxSize?: number;
    /** 上传目录 */
    directory?: string;
}

/** 手机号组件定义 */
export interface PhoneComponentDefinition extends BaseComponentDefinition {
    type: 'phone';
    placeholder?: string;
    /** 国家代码 */
    countryCode?: string;
}

/** 邮箱组件定义 */
export interface EmailComponentDefinition extends BaseComponentDefinition {
    type: 'email';
    placeholder?: string;
}

/** 身份证号组件定义 */
export interface IdCardComponentDefinition extends BaseComponentDefinition {
    type: 'id-card';
    placeholder?: string;
    /** 是否显示遮罩（保护隐私） */
    masked?: boolean;
}

/** 开关组件定义 */
export interface ToggleComponentDefinition extends BaseComponentDefinition {
    type: 'toggle';
    /** 开启时的文案 */
    onLabel?: string;
    /** 关闭时的文案 */
    offLabel?: string;
}

/** 目录选择器组件定义 */
export interface FolderPickerComponentDefinition extends BaseComponentDefinition {
    type: 'folder-picker';
    /** 是否支持多选 */
    multiple?: boolean;
    /** 根目录（限制选择范围） */
    rootPath?: string;
    placeholder?: string;
}

/** 头像组件定义 */
export interface AvatarComponentDefinition extends BaseComponentDefinition {
    type: 'avatar';
    /** 裁切比例 (1:1 为默认) */
    aspectRatio?: number;
    /** 最大尺寸 (KB) */
    maxSize?: number;
    /** 上传目录 */
    directory?: string;
}

/** 文件列表组件定义 */
export interface FileListComponentDefinition extends BaseComponentDefinition {
    type: 'file-list';
    /** 是否允许下载 */
    allowDownload?: boolean;
    /** 是否允许删除 */
    allowDelete?: boolean;
    /** 显示模式: list | grid */
    displayMode?: 'list' | 'grid';
}

/** 标签组件定义 */
export interface TagsComponentDefinition extends BaseComponentDefinition {
    type: 'tags';
    /** 预设标签选项 */
    suggestions?: string[];
    /** 最大标签数量 */
    maxTags?: number;
    /** 是否允许创建新标签 */
    allowCreate?: boolean;
    /** 标签颜色 */
    color?: string;
    placeholder?: string;
}

/** ID生成器组件定义 */
export interface IdGeneratorComponentDefinition extends BaseComponentDefinition {
    type: 'id-generator';
    /** 前缀 */
    prefix?: string;
    /** 后缀 */
    suffix?: string;
    /** ID 长度（不含前缀后缀） */
    length?: number;
    /** 格式: numeric=纯数字, alpha=纯字母, alphanumeric=字母数字混合, uuid=UUID */
    format?: 'numeric' | 'alpha' | 'alphanumeric' | 'uuid' | 'timestamp';
    /** 是否自动生成（创建时自动填充） */
    autoGenerate?: boolean;
    /** 是否允许手动编辑 */
    editable?: boolean;
    /** 是否大写 */
    uppercase?: boolean;
}

// ============================================================
// Phase 4.3 新增组件定义
// ============================================================

/** 安全密码组件定义 */
export interface PasswordComponentDefinition extends BaseComponentDefinition {
    type: 'password';
    /** 最小长度 */
    minLength?: number;
    /** 要求大写字母 */
    requireUppercase?: boolean;
    /** 要求小写字母 */
    requireLowercase?: boolean;
    /** 要求数字 */
    requireNumber?: boolean;
    /** 要求特殊字符 */
    requireSpecial?: boolean;
    /** 显示强度指示器 */
    showStrengthMeter?: boolean;
    /** 允许自动生成 */
    allowGenerate?: boolean;
    /** 生成密码长度 */
    generatedLength?: number;
}

/** 时间戳组件定义 */
export interface TimestampComponentDefinition extends BaseComponentDefinition {
    type: 'timestamp';
    /** 类型: created=创建时间, updated=更新时间, custom=自定义 */
    timestampType?: 'created' | 'updated' | 'custom';
    /** 显示格式 */
    format?: string;
    /** 显示相对时间 */
    showRelative?: boolean;
    /** 自动更新（仅 updated 类型） */
    autoUpdate?: boolean;
}

/** URL链接组件定义 */
export interface UrlComponentDefinition extends BaseComponentDefinition {
    type: 'url';
    placeholder?: string;
    /** 显示预览 */
    showPreview?: boolean;
    /** 新标签页打开 */
    openInNewTab?: boolean;
    /** 允许的协议 */
    allowedProtocols?: string[];
}

/** 颜色选择组件定义 */
export interface ColorComponentDefinition extends BaseComponentDefinition {
    type: 'color';
    /** 输出格式 */
    format?: 'hex' | 'rgb' | 'hsl';
    /** 预设颜色 */
    presets?: string[];
    /** 允许透明度 */
    allowAlpha?: boolean;
    /** 显示输入框 */
    showInput?: boolean;
}

/** 图标选择组件定义 */
export interface IconPickerComponentDefinition extends BaseComponentDefinition {
    type: 'icon-picker';
    /** 显示的图标分类 */
    categories?: string[];
    /** 启用搜索 */
    searchable?: boolean;
    /** 显示图标名称 */
    showLabel?: boolean;
}

/** 进度条组件定义 */
export interface ProgressComponentDefinition extends BaseComponentDefinition {
    type: 'progress';
    /** 是否可编辑 */
    editable?: boolean;
    /** 显示百分比 */
    showLabel?: boolean;
    /** 进度条颜色 */
    color?: string;
    /** 轨道颜色 */
    trackColor?: string;
    /** 高度 */
    height?: number;
}

/** 二维码组件定义 */
export interface QrcodeComponentDefinition extends BaseComponentDefinition {
    type: 'qrcode';
    /** 尺寸 */
    size?: number;
    /** 容错级别 */
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    /** 前景色 */
    fgColor?: string;
    /** 背景色 */
    bgColor?: string;
    /** 允许下载 */
    allowDownload?: boolean;
}

/** 条形码组件定义 */
export interface BarcodeComponentDefinition extends BaseComponentDefinition {
    type: 'barcode';
    /** 格式 */
    barcodeFormat?: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39' | 'ITF14' | 'MSI' | 'pharmacode';
    /** 线条宽度 */
    width?: number;
    /** 高度 */
    height?: number;
    /** 显示文字 */
    displayValue?: boolean;
    /** 允许下载 */
    allowDownload?: boolean;
}

/** 文档链接组件定义 */
export interface DocumentLinkComponentDefinition extends BaseComponentDefinition {
    type: 'document-link';
    placeholder?: string;
    /** 允许多选 */
    allowMultiple?: boolean;
    /** 文档类型过滤 */
    filter?: string;
    /** 显示文档路径 */
    showPath?: boolean;
}

/** 关联选择组件定义 */
export interface RelationPickerComponentDefinition extends BaseComponentDefinition {
    type: 'relation-picker';
    /** 关联索引 */
    index?: string;
    /** 显示字段 */
    displayField?: string;
    /** 搜索字段 */
    searchFields?: string[];
    /** 允许多选 */
    multiple?: boolean;
    /** 过滤条件 */
    filterCondition?: string;
    /** 显示详情 */
    showDetails?: boolean;
}

/** 用户选择组件定义 */
export interface UserPickerComponentDefinition extends BaseComponentDefinition {
    type: 'user-picker';
    /** 允许多选 */
    multiple?: boolean;
    /** 显示头像 */
    showAvatar?: boolean;
    /** 角色过滤 */
    roleFilter?: string;
    /** 状态过滤 */
    statusFilter?: string;
}

/** 计算字段组件定义 */
export interface ComputedComponentDefinition extends BaseComponentDefinition {
    type: 'computed';
    /** 计算表达式 */
    expression?: string;
    /** 依赖字段列表 */
    dependencies?: string[];
    /** 结果格式化 */
    resultFormat?: string;
    /** 小数位数 */
    decimals?: number;
}

/** 公式字段组件定义 */
export interface FormulaComponentDefinition extends BaseComponentDefinition {
    type: 'formula';
    /** 公式字符串 */
    formula?: string;
    /** 变量映射 */
    variables?: Record<string, string>;
    /** 结果格式 */
    resultFormat?: string;
    /** 错误时的默认值 */
    errorValue?: string | number;
}

/** 手写签名组件定义 */
export interface SignatureComponentDefinition extends BaseComponentDefinition {
    type: 'signature';
    /** 宽度 */
    canvasWidth?: number;
    /** 高度 */
    canvasHeight?: number;
    /** 笔触颜色 */
    strokeColor?: string;
    /** 笔触粗细 */
    strokeWidth?: number;
    /** 背景色 */
    backgroundColor?: string;
}

/** 富文本组件定义 */
export interface RichTextComponentDefinition extends BaseComponentDefinition {
    type: 'rich-text';
    /** 工具栏配置 */
    toolbar?: string[];
    placeholder?: string;
    /** 最小高度 */
    minHeight?: number;
    /** 最大高度 */
    maxHeight?: number;
}

/** JSON编辑组件定义 */
export interface JsonComponentDefinition extends BaseComponentDefinition {
    type: 'json';
    /** JSON Schema */
    schema?: object;
    /** 最小高度 */
    minHeight?: number;
    /** 最大高度 */
    maxHeight?: number;
    /** 只读模式 */
    readOnly?: boolean;
}

/** 登录统计组件定义 */
export interface LoginStatsComponentDefinition extends BaseComponentDefinition {
    type: 'login-stats';
    /** 关联用户ID字段 */
    userIdField?: string;
    /** 显示最后登录 */
    showLastLogin?: boolean;
    /** 显示登录次数 */
    showLoginCount?: boolean;
    /** 显示设备信息 */
    showDevice?: boolean;
    /** 显示IP地址 */
    showIp?: boolean;
    /** 显示历史记录 */
    showHistory?: boolean;
    /** 历史记录数量 */
    historyLimit?: number;
}

/** 审计日志组件定义 */
export interface AuditLogComponentDefinition extends BaseComponentDefinition {
    type: 'audit-log';
    /** 显示数量 */
    limit?: number;
    /** 显示操作用户 */
    showUser?: boolean;
    /** 显示差异 */
    showDiff?: boolean;
    /** 追踪字段列表 */
    trackFields?: string[];
    /** 排除字段列表 */
    excludeFields?: string[];
}

// ============================================================
// Phase 4.2: 用户认证组件定义
// ============================================================

/** 账户状态类型 */
export type UserAuthStatus = 'active' | 'pending' | 'disabled' | 'locked' | 'expired';

/** 用户认证数据值 */
export interface UserAuthValue {
    /** 用户唯一ID */
    user_id: string;
    /** 用户名（登录用） */
    username: string;
    /** 邮箱 */
    email?: string;
    /** 手机号 */
    phone?: string;
    /** 密码哈希值 */
    password_hash?: string;
    /** 角色 */
    role: string;
    /** 账户状态 */
    status: UserAuthStatus;
    /** 最后登录时间 */
    last_login?: string;
    /** 过期时间 */
    expired_at?: string;
}

/** 用户认证组件定义（字段组复合组件） */
export interface UserAuthComponentDefinition extends BaseComponentDefinition {
    type: 'user-auth';
    /** 是否字段组（固定为 true） */
    isFieldGroup: true;
    /** 数据块类型标识（固定） */
    dataBlockType: '__atlas_user_auth__';
    /** 用户名是否必填 */
    requireUsername?: boolean;
    /** 邮箱是否必填 */
    requireEmail?: boolean;
    /** 手机号是否必填 */
    requirePhone?: boolean;
    /** 是否启用账户过期 */
    enableExpiration?: boolean;
    /** 默认状态 */
    defaultStatus?: UserAuthStatus;
}

/** 文档组件定义联合类型 */
export type DocumentComponentDefinition =
    | SelectComponentDefinition
    | RatingComponentDefinition
    | NumberComponentDefinition
    | DateComponentDefinition
    | TextComponentDefinition
    | TextareaComponentDefinition
    | FileComponentDefinition
    | FilesComponentDefinition
    | ImageComponentDefinition
    | ImagesComponentDefinition
    | PhoneComponentDefinition
    | EmailComponentDefinition
    | IdCardComponentDefinition
    | ToggleComponentDefinition
    | FolderPickerComponentDefinition
    | AvatarComponentDefinition
    | FileListComponentDefinition
    | TagsComponentDefinition
    | IdGeneratorComponentDefinition
    // Phase 4.3 新增组件
    | PasswordComponentDefinition
    | TimestampComponentDefinition
    | UrlComponentDefinition
    | ColorComponentDefinition
    | IconPickerComponentDefinition
    | ProgressComponentDefinition
    | QrcodeComponentDefinition
    | BarcodeComponentDefinition
    | DocumentLinkComponentDefinition
    | RelationPickerComponentDefinition
    | UserPickerComponentDefinition
    | ComputedComponentDefinition
    | FormulaComponentDefinition
    | SignatureComponentDefinition
    | RichTextComponentDefinition
    | JsonComponentDefinition
    | LoginStatsComponentDefinition
    | AuditLogComponentDefinition
    // Phase 4.2: 用户认证组件
    | UserAuthComponentDefinition;

// ============================================================
// 组件控件 Props
// ============================================================

/** 控件基础 Props */
export interface ControlProps {
    /** 组件定义 */
    component: DocumentComponentDefinition;
    /** 当前值（支持对象类型，用于字段组组件） */
    value: string | string[] | number | object | null | undefined;
    /** 值变更回调（支持对象类型，用于字段组组件） */
    onChange: (value: string | string[] | number | object | null) => void;
    /** 是否禁用 */
    disabled?: boolean;
}

/** 配置器基础 Props */
export interface ConfiguratorProps {
    /** 组件定义 */
    formData: DocumentComponentDefinition;
    /** 错误信息 */
    errors: Record<string, string>;
    /** 更新表单数据 */
    onUpdateFormData: (updater: (prev: DocumentComponentDefinition) => DocumentComponentDefinition) => void;
}

// ============================================================
// 组件注册类型
// ============================================================

/** 组件分类 */
export type ComponentCategory = 'input' | 'smart' | 'display' | 'relation' | 'security';

/** 组件分类元数据 */
export interface CategoryMeta {
    id: ComponentCategory;
    name: string;
    description: string;
    icon: string;
}

/** 组件元数据配置 */
export interface ComponentMeta {
    /** 组件类型 */
    type: ComponentType;
    /** 显示名称 */
    name: string;
    /** 描述 */
    description: string;
    /** 图标名称 (Lucide icon) */
    icon: string;
    /** 是否有选项 */
    hasOptions: boolean;
    /** 组件分类 */
    category: ComponentCategory;
}

/** 组件注册定义 */
export interface RegisteredComponent {
    /** 组件元数据 */
    meta: ComponentMeta;
    /** 创建默认组件定义 */
    createDefault: (id: string) => DocumentComponentDefinition;
    /** 数据块中的控件组件 */
    Control: React.ComponentType<ControlProps>;
    /** 配置弹窗中的配置表单 */
    Configurator: React.ComponentType<ConfiguratorProps>;
}

/** 组件注册表类型 */
export type ComponentRegistry = Map<ComponentType, RegisteredComponent>;

// ============================================================
// 降级控件 Props
// ============================================================

/** 降级控件 Props */
export interface FallbackControlProps {
    componentId: string;
    value: string | string[] | number | null | undefined;
    onChange: (value: string | null) => void;
}

