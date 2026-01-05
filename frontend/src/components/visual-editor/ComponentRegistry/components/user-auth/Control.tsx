/**
 * User Auth 组件 - 数据块控件
 * 
 * Phase 4.2: 用户认证字段组复合组件
 * 
 * 包含子字段：
 * - user_id: 用户唯一ID（后端预生成）
 * - username: 用户名
 * - email: 邮箱
 * - phone: 手机号
 * - password: 密码（存储哈希值）
 * - role: 角色
 * - status: 账户状态
 * - expired_at: 过期时间
 */

import { useState, useEffect, useCallback } from 'react';
import {
    UserCheck, User, Mail, Phone, Lock, Shield,
    Calendar, RefreshCw, Check, X, Eye, EyeOff, AlertCircle, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    ControlProps,
    UserAuthComponentDefinition,
    UserAuthValue,
    UserAuthStatus
} from '../../types';
import { getRoles, type Role } from '@/api/user-settings';

/** 账户状态配置 */
const STATUS_CONFIG: Record<UserAuthStatus, { label: string; color: string; bgColor: string }> = {
    active: { label: '正常', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
    pending: { label: '待激活', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' },
    disabled: { label: '已禁用', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
    locked: { label: '已锁定', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
    expired: { label: '已过期', color: 'text-slate-600', bgColor: 'bg-slate-50 border-slate-200' },
};

/** 生成默认的空值 */
function createEmptyValue(): UserAuthValue {
    return {
        user_id: '',
        username: '',
        email: '',
        phone: '',
        password_hash: '',
        role: '',
        status: 'pending',
    };
}

/** 密码强度计算 */
function calculatePasswordStrength(password: string): { level: 'weak' | 'fair' | 'good' | 'strong'; score: number } {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 20;
    if (/\d/.test(password)) score += 20;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

    let level: 'weak' | 'fair' | 'good' | 'strong';
    if (score < 40) level = 'weak';
    else if (score < 60) level = 'fair';
    else if (score < 80) level = 'good';
    else level = 'strong';

    return { level, score: Math.min(100, score) };
}

/** 生成随机密码 */
function generatePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = lowercase + uppercase + numbers + special;

    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const authDef = component as UserAuthComponentDefinition;
    const currentValue = (typeof value === 'object' && value !== null ? value : createEmptyValue()) as UserAuthValue;

    // 角色列表
    const [roles, setRoles] = useState<Role[]>([]);
    const [defaultRole, setDefaultRole] = useState<string>('guest');
    const [loadingRoles, setLoadingRoles] = useState(true);

    // 密码编辑状态
    const [showPasswordEdit, setShowPasswordEdit] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    // 加载用户ID
    const [generatingId, setGeneratingId] = useState(false);

    // 加载角色列表
    useEffect(() => {
        async function loadRoles() {
            try {
                const response = await getRoles();
                setRoles(response.roles);
                setDefaultRole(response.default_role);

                // 如果当前没有角色，设置为默认角色
                if (!currentValue.role) {
                    handleFieldChange('role', response.default_role);
                }
            } catch (error) {
                console.error('Failed to load roles:', error);
            } finally {
                setLoadingRoles(false);
            }
        }
        loadRoles();
    }, []);

    // 字段变更处理
    const handleFieldChange = useCallback((field: keyof UserAuthValue, fieldValue: string) => {
        const newValue: UserAuthValue = {
            ...currentValue,
            [field]: fieldValue,
        };
        onChange(newValue);
    }, [currentValue, onChange]);

    // 生成用户ID
    const handleGenerateId = useCallback(async () => {
        setGeneratingId(true);
        try {
            const response = await fetch('/api/auth/generate-user-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                const { user_id } = await response.json();
                handleFieldChange('user_id', user_id);
            } else {
                // Fallback: 本地生成
                const timestamp = Date.now().toString(36).toUpperCase();
                const random = Math.random().toString(36).substring(2, 8).toUpperCase();
                handleFieldChange('user_id', `U${timestamp}${random}`);
            }
        } catch (error) {
            // Fallback: 本地生成
            const timestamp = Date.now().toString(36).toUpperCase();
            const random = Math.random().toString(36).substring(2, 8).toUpperCase();
            handleFieldChange('user_id', `U${timestamp}${random}`);
        } finally {
            setGeneratingId(false);
        }
    }, [handleFieldChange]);

    // 保存密码
    const handleSavePassword = useCallback(async () => {
        if (passwordInput !== confirmPassword || passwordInput.length < 8) return;

        setSavingPassword(true);
        try {
            const response = await fetch('/api/password/hash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: passwordInput }),
            });

            if (response.ok) {
                const { hash } = await response.json();
                handleFieldChange('password_hash', hash);
            } else {
                // Fallback: 标记为待哈希
                handleFieldChange('password_hash', `[PENDING_HASH:${passwordInput.length}]`);
            }

            setShowPasswordEdit(false);
            setPasswordInput('');
            setConfirmPassword('');
        } catch (error) {
            // Fallback
            handleFieldChange('password_hash', `[PENDING_HASH:${passwordInput.length}]`);
            setShowPasswordEdit(false);
            setPasswordInput('');
            setConfirmPassword('');
        } finally {
            setSavingPassword(false);
        }
    }, [passwordInput, confirmPassword, handleFieldChange]);

    // 自动生成密码
    const handleGeneratePassword = useCallback(() => {
        const newPwd = generatePassword(16);
        setPasswordInput(newPwd);
        setConfirmPassword(newPwd);
    }, []);

    const passwordStrength = passwordInput ? calculatePasswordStrength(passwordInput) : null;
    const passwordsMatch = passwordInput === confirmPassword && passwordInput.length > 0;
    const isPasswordValid = passwordStrength && passwordStrength.score >= 60 && passwordsMatch;
    const isPasswordSet = Boolean(currentValue.password_hash);

    return (
        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            {/* 标题栏 */}
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <UserCheck className="h-5 w-5 text-purple-500" />
                <span className="font-medium text-slate-700">用户认证信息</span>
                <span className="ml-auto text-xs text-slate-400">__atlas_user_auth__</span>
            </div>

            {/* 用户ID */}
            <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                <label className="text-sm text-slate-600 flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    用户ID
                    <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={currentValue.user_id || ''}
                        onChange={(e) => handleFieldChange('user_id', e.target.value)}
                        disabled={disabled}
                        placeholder="U20260106001"
                        className={cn(
                            'flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg',
                            'focus:outline-none focus:ring-2 focus:ring-purple-400/50',
                            disabled && 'bg-slate-100 cursor-not-allowed'
                        )}
                    />
                    <button
                        type="button"
                        onClick={handleGenerateId}
                        disabled={disabled || generatingId}
                        className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                        {generatingId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        生成
                    </button>
                </div>
            </div>

            {/* 用户名 */}
            <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                <label className="text-sm text-slate-600 flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    用户名
                    {authDef.requireUsername && <span className="text-red-500">*</span>}
                </label>
                <input
                    type="text"
                    value={currentValue.username || ''}
                    onChange={(e) => handleFieldChange('username', e.target.value)}
                    disabled={disabled}
                    placeholder="登录用户名"
                    className={cn(
                        'px-3 py-1.5 text-sm border border-slate-200 rounded-lg',
                        'focus:outline-none focus:ring-2 focus:ring-purple-400/50',
                        disabled && 'bg-slate-100 cursor-not-allowed'
                    )}
                />
            </div>

            {/* 邮箱 */}
            <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                <label className="text-sm text-slate-600 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    邮箱
                    {authDef.requireEmail && <span className="text-red-500">*</span>}
                </label>
                <input
                    type="email"
                    value={currentValue.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    disabled={disabled}
                    placeholder="user@example.com"
                    className={cn(
                        'px-3 py-1.5 text-sm border border-slate-200 rounded-lg',
                        'focus:outline-none focus:ring-2 focus:ring-purple-400/50',
                        disabled && 'bg-slate-100 cursor-not-allowed'
                    )}
                />
            </div>

            {/* 手机号 */}
            <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                <label className="text-sm text-slate-600 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    手机号
                    {authDef.requirePhone && <span className="text-red-500">*</span>}
                </label>
                <input
                    type="tel"
                    value={currentValue.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    disabled={disabled}
                    placeholder="13800138000"
                    className={cn(
                        'px-3 py-1.5 text-sm border border-slate-200 rounded-lg',
                        'focus:outline-none focus:ring-2 focus:ring-purple-400/50',
                        disabled && 'bg-slate-100 cursor-not-allowed'
                    )}
                />
            </div>

            {/* 密码 */}
            <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
                <label className="text-sm text-slate-600 flex items-center gap-1 pt-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    密码
                    <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                    {!showPasswordEdit ? (
                        <div className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg border',
                            isPasswordSet
                                ? 'bg-green-50 border-green-200'
                                : 'bg-yellow-50 border-yellow-200'
                        )}>
                            {isPasswordSet ? (
                                <>
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span className="text-sm text-green-700">密码已设置</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                    <span className="text-sm text-yellow-700">未设置密码</span>
                                </>
                            )}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordEdit(true)}
                                    className="ml-auto text-sm text-purple-600 hover:text-purple-700"
                                >
                                    {isPasswordSet ? '重置' : '设置'}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2 p-3 bg-white rounded-lg border border-slate-200">
                            {/* 密码输入 */}
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="输入新密码..."
                                    className="w-full px-3 py-1.5 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>

                            {/* 密码强度 */}
                            {passwordStrength && (
                                <div className="space-y-1">
                                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                'h-full transition-all duration-300',
                                                passwordStrength.level === 'weak' && 'bg-red-500',
                                                passwordStrength.level === 'fair' && 'bg-orange-500',
                                                passwordStrength.level === 'good' && 'bg-blue-500',
                                                passwordStrength.level === 'strong' && 'bg-green-500',
                                            )}
                                            style={{ width: `${passwordStrength.score}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* 确认密码 */}
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="确认密码..."
                                    className={cn(
                                        'w-full px-3 py-1.5 pr-10 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400/50',
                                        confirmPassword && (passwordsMatch ? 'border-green-300' : 'border-red-300'),
                                        !confirmPassword && 'border-slate-200'
                                    )}
                                />
                                {confirmPassword && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        {passwordsMatch ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <X className="h-4 w-4 text-red-500" />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={handleGeneratePassword}
                                    className="text-xs text-purple-600 hover:text-purple-700"
                                >
                                    生成强密码
                                </button>
                                <div className="flex-1" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordEdit(false);
                                        setPasswordInput('');
                                        setConfirmPassword('');
                                    }}
                                    className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                                >
                                    取消
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSavePassword}
                                    disabled={!isPasswordValid || savingPassword}
                                    className={cn(
                                        'px-3 py-1 text-xs rounded transition-colors',
                                        isPasswordValid
                                            ? 'bg-purple-500 text-white hover:bg-purple-600'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    )}
                                >
                                    {savingPassword ? '保存中...' : '保存密码'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 角色 */}
            <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                <label className="text-sm text-slate-600 flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    角色
                    <span className="text-red-500">*</span>
                </label>
                {loadingRoles ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        加载角色...
                    </div>
                ) : (
                    <select
                        value={currentValue.role || defaultRole}
                        onChange={(e) => handleFieldChange('role', e.target.value)}
                        disabled={disabled}
                        className={cn(
                            'px-3 py-1.5 text-sm border border-slate-200 rounded-lg',
                            'focus:outline-none focus:ring-2 focus:ring-purple-400/50',
                            disabled && 'bg-slate-100 cursor-not-allowed'
                        )}
                    >
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.name}
                                {role.id === defaultRole && ' (默认)'}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* 状态 */}
            <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                <label className="text-sm text-slate-600 flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    状态
                </label>
                <div className="flex items-center gap-2">
                    <select
                        value={currentValue.status || authDef.defaultStatus || 'pending'}
                        onChange={(e) => handleFieldChange('status', e.target.value)}
                        disabled={disabled}
                        className={cn(
                            'px-3 py-1.5 text-sm border border-slate-200 rounded-lg',
                            'focus:outline-none focus:ring-2 focus:ring-purple-400/50',
                            disabled && 'bg-slate-100 cursor-not-allowed'
                        )}
                    >
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>
                                {config.label}
                            </option>
                        ))}
                    </select>
                    <span className={cn(
                        'px-2 py-0.5 text-xs rounded-full border',
                        STATUS_CONFIG[currentValue.status || 'pending'].bgColor,
                        STATUS_CONFIG[currentValue.status || 'pending'].color
                    )}>
                        {STATUS_CONFIG[currentValue.status || 'pending'].label}
                    </span>
                </div>
            </div>

            {/* 过期时间（可选） */}
            {authDef.enableExpiration && (
                <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                    <label className="text-sm text-slate-600 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        过期时间
                    </label>
                    <input
                        type="datetime-local"
                        value={currentValue.expired_at?.slice(0, 16) || ''}
                        onChange={(e) => handleFieldChange('expired_at', e.target.value ? new Date(e.target.value).toISOString() : '')}
                        disabled={disabled}
                        className={cn(
                            'px-3 py-1.5 text-sm border border-slate-200 rounded-lg',
                            'focus:outline-none focus:ring-2 focus:ring-purple-400/50',
                            disabled && 'bg-slate-100 cursor-not-allowed'
                        )}
                    />
                </div>
            )}
        </div>
    );
}

export default Control;

