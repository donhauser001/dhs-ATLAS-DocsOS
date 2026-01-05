/**
 * RoleManagementSettings - 角色管理设置页面
 * 
 * Phase 4.2: 动态角色管理
 * - 查看角色列表
 * - 添加/编辑/删除角色
 * - 设置默认角色
 * - 配置角色权限
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Plus,
    Edit2,
    Trash2,
    Shield,
    Star,
    AlertCircle,
    LucideIcon,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { IconPicker } from '@/components/ui/icon-picker';
import {
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    setDefaultRole,
    type Role,
    type RolePermissions,
} from '@/api/user-settings';

// ============================================================
// 角色卡片组件
// ============================================================

interface RoleCardProps {
    role: Role;
    isDefault: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onSetDefault: () => void;
}

function RoleCard({ role, isDefault, onEdit, onDelete, onSetDefault }: RoleCardProps) {
    const iconName = role.icon ? role.icon.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') : '';
    const Icon: LucideIcon = iconName && (LucideIcons as unknown as Record<string, LucideIcon>)[iconName]
        ? (LucideIcons as unknown as Record<string, LucideIcon>)[iconName]
        : Shield;

    return (
        <div
            className="relative p-4 border rounded-xl hover:shadow-md transition-shadow bg-white group"
            style={{ borderLeftColor: role.color, borderLeftWidth: 4 }}
        >
            {/* 默认标识 */}
            {isDefault && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-0.5 text-[10px] font-medium rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    默认
                </div>
            )}

            {/* 头部 */}
            <div className="flex items-start gap-3 mb-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${role.color}20` }}
                >
                    {Icon && <Icon className="h-5 w-5" style={{ color: role.color }} />}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{role.name}</h3>
                    <code className="text-[10px] text-slate-400">{role.id}</code>
                </div>
            </div>

            {/* 描述 */}
            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{role.description}</p>

            {/* 权限概览 */}
            <div className="flex flex-wrap gap-1 mb-3">
                {role.permissions.can_create_proposal && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-600 rounded">创建提案</span>
                )}
                {role.permissions.can_execute_proposal && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-green-50 text-green-600 rounded">执行提案</span>
                )}
                {role.permissions.can_manage_users && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-purple-50 text-purple-600 rounded">管理用户</span>
                )}
                {role.permissions.can_manage_roles && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-orange-50 text-orange-600 rounded">管理角色</span>
                )}
            </div>

            {/* 级别 */}
            <div className="text-xs text-slate-400 mb-3">
                权限级别: <span className="font-medium text-slate-600">{role.level}</span>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onEdit}>
                    <Edit2 className="h-3 w-3 mr-1" />
                    编辑
                </Button>
                {!isDefault && (
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onSetDefault}>
                        <Star className="h-3 w-3 mr-1" />
                        设为默认
                    </Button>
                )}
                {role.id !== 'admin' && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:border-red-200"
                        onClick={onDelete}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                )}
            </div>
        </div>
    );
}

// ============================================================
// 角色编辑弹窗
// ============================================================

interface RoleEditorProps {
    open: boolean;
    role: Role | null;
    onClose: () => void;
    onSave: (role: Role) => Promise<void>;
}

function RoleEditor({ open, role, onClose, onSave }: RoleEditorProps) {
    const isNew = !role;
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // 表单状态
    const [formData, setFormData] = useState<Role>({
        id: '',
        name: '',
        description: '',
        level: 10,
        color: '#6366F1',
        icon: 'user',
        permissions: {
            paths: ['**'],
            can_create_proposal: false,
            can_execute_proposal: false,
            can_manage_users: false,
            can_manage_roles: false,
            can_view_audit_logs: false,
        },
    });

    // 重置表单
    useEffect(() => {
        if (role) {
            setFormData(role);
        } else {
            setFormData({
                id: '',
                name: '',
                description: '',
                level: 10,
                color: '#6366F1',
                icon: 'user',
                permissions: {
                    paths: ['**'],
                    can_create_proposal: false,
                    can_execute_proposal: false,
                    can_manage_users: false,
                    can_manage_roles: false,
                    can_view_audit_logs: false,
                },
            });
        }
        setErrors({});
    }, [role, open]);

    // 更新字段
    const updateField = <K extends keyof Role>(field: K, value: Role[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: '' }));
    };

    // 更新权限
    const updatePermission = <K extends keyof RolePermissions>(field: K, value: RolePermissions[K]) => {
        setFormData(prev => ({
            ...prev,
            permissions: { ...prev.permissions, [field]: value },
        }));
    };

    // 验证
    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.id.trim()) {
            newErrors.id = '角色 ID 不能为空';
        } else if (!/^[a-z][a-z0-9_]*$/.test(formData.id)) {
            newErrors.id = '角色 ID 只能包含小写字母、数字和下划线，且以字母开头';
        }

        if (!formData.name.trim()) {
            newErrors.name = '角色名称不能为空';
        }

        if (formData.level < 1 || formData.level > 100) {
            newErrors.level = '权限级别必须在 1-100 之间';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 保存
    const handleSave = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            setErrors({ submit: error instanceof Error ? error.message : '保存失败' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isNew ? '添加角色' : '编辑角色'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {errors.submit && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            {errors.submit}
                        </div>
                    )}

                    {/* 角色 ID */}
                    <div>
                        <label className="text-sm font-medium">
                            角色 ID <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.id}
                            onChange={(e) => updateField('id', e.target.value.toLowerCase())}
                            placeholder="如 editor、viewer"
                            className="mt-1"
                            disabled={!isNew}
                        />
                        {errors.id && <p className="text-xs text-red-500 mt-1">{errors.id}</p>}
                        {!isNew && <p className="text-xs text-slate-500 mt-1">角色 ID 不可修改</p>}
                    </div>

                    {/* 角色名称 */}
                    <div>
                        <label className="text-sm font-medium">
                            角色名称 <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            placeholder="如 编辑员、查看者"
                            className="mt-1"
                        />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    {/* 描述 */}
                    <div>
                        <label className="text-sm font-medium">描述</label>
                        <Input
                            value={formData.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="角色的职能描述"
                            className="mt-1"
                        />
                    </div>

                    {/* 颜色和图标 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">颜色</label>
                            <div className="mt-1 flex items-center gap-2">
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => updateField('color', e.target.value)}
                                    className="w-10 h-10 rounded border cursor-pointer"
                                />
                                <Input
                                    value={formData.color}
                                    onChange={(e) => updateField('color', e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">图标</label>
                            <div className="mt-1 flex items-center gap-2">
                                <IconPicker value={formData.icon} onChange={(v) => updateField('icon', v)} />
                                <span className="text-sm text-slate-500">{formData.icon || '未设置'}</span>
                            </div>
                        </div>
                    </div>

                    {/* 权限级别 */}
                    <div>
                        <label className="text-sm font-medium">
                            权限级别 <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="number"
                            min={1}
                            max={100}
                            value={formData.level}
                            onChange={(e) => updateField('level', parseInt(e.target.value) || 1)}
                            className="mt-1"
                        />
                        {errors.level && <p className="text-xs text-red-500 mt-1">{errors.level}</p>}
                        <p className="text-xs text-slate-500 mt-1">1-100，数字越大权限越高</p>
                    </div>

                    {/* 权限配置 */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">权限配置</label>
                        <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.permissions.can_create_proposal}
                                    onChange={(e) => updatePermission('can_create_proposal', e.target.checked)}
                                    className="w-4 h-4 text-purple-500 rounded border-slate-300"
                                />
                                <span className="text-sm">可创建提案</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.permissions.can_execute_proposal}
                                    onChange={(e) => updatePermission('can_execute_proposal', e.target.checked)}
                                    className="w-4 h-4 text-purple-500 rounded border-slate-300"
                                />
                                <span className="text-sm">可执行提案</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.permissions.can_manage_users}
                                    onChange={(e) => updatePermission('can_manage_users', e.target.checked)}
                                    className="w-4 h-4 text-purple-500 rounded border-slate-300"
                                />
                                <span className="text-sm">可管理用户</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.permissions.can_manage_roles}
                                    onChange={(e) => updatePermission('can_manage_roles', e.target.checked)}
                                    className="w-4 h-4 text-purple-500 rounded border-slate-300"
                                />
                                <span className="text-sm">可管理角色</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.permissions.can_view_audit_logs}
                                    onChange={(e) => updatePermission('can_view_audit_logs', e.target.checked)}
                                    className="w-4 h-4 text-purple-500 rounded border-slate-300"
                                />
                                <span className="text-sm">可查看审计日志</span>
                            </label>
                        </div>
                    </div>

                    {/* 路径权限 */}
                    <div>
                        <label className="text-sm font-medium">可访问路径</label>
                        <Input
                            value={formData.permissions.paths.join(', ')}
                            onChange={(e) => updatePermission('paths', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            placeholder="**, @self, @related, @public"
                            className="mt-1"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            多个路径用逗号分隔。** 表示全部，@self 表示自己，@related 表示关联，@public 表示公开
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        取消
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? '保存中...' : '保存'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================
// 主组件
// ============================================================

export function RoleManagementSettings() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [defaultRoleId, setDefaultRoleId] = useState<string>('guest');
    const [loading, setLoading] = useState(true);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [showEditor, setShowEditor] = useState(false);

    // 加载角色列表
    async function loadRoles() {
        try {
            setLoading(true);
            const response = await getRoles();
            setRoles(response.roles);
            setDefaultRoleId(response.default_role);
        } catch (error) {
            console.error('Failed to load roles:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadRoles();
    }, []);

    // 保存角色
    async function handleSaveRole(role: Role) {
        const existing = roles.find(r => r.id === role.id);
        if (existing) {
            await updateRole(role.id, role);
        } else {
            await createRole(role);
        }
        await loadRoles();
    }

    // 删除角色
    async function handleDeleteRole(roleId: string) {
        if (!confirm(`确定删除角色 "${roleId}"？此操作不可恢复。`)) return;
        try {
            await deleteRole(roleId);
            await loadRoles();
        } catch (error) {
            alert(error instanceof Error ? error.message : '删除失败');
        }
    }

    // 设置默认角色
    async function handleSetDefault(roleId: string) {
        try {
            await setDefaultRole(roleId);
            setDefaultRoleId(roleId);
        } catch (error) {
            alert(error instanceof Error ? error.message : '设置失败');
        }
    }

    // 打开编辑弹窗
    function openEditor(role: Role | null) {
        setEditingRole(role);
        setShowEditor(true);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold">角色管理</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        配置系统角色和权限。角色决定用户可以执行的操作。
                    </p>
                </div>
                <Button onClick={() => openEditor(null)}>
                    <Plus className="h-4 w-4 mr-1" />
                    添加角色
                </Button>
            </div>

            {/* 提示信息 */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                        <p className="text-sm text-blue-700 font-medium">关于角色权限</p>
                        <p className="text-xs text-blue-600 mt-1">
                            角色按权限级别从高到低排序。级别越高，权限越大。<br />
                            带 <Star className="inline h-3 w-3 text-yellow-500" /> 标识的是默认角色，新注册用户将自动分配此角色。
                        </p>
                    </div>
                </div>
            </div>

            {/* 角色列表 */}
            <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles
                        .sort((a, b) => b.level - a.level)
                        .map((role) => (
                            <RoleCard
                                key={role.id}
                                role={role}
                                isDefault={role.id === defaultRoleId}
                                onEdit={() => openEditor(role)}
                                onDelete={() => handleDeleteRole(role.id)}
                                onSetDefault={() => handleSetDefault(role.id)}
                            />
                        ))}
                </div>
            </ScrollArea>

            {/* 编辑弹窗 */}
            <RoleEditor
                open={showEditor}
                role={editingRole}
                onClose={() => {
                    setShowEditor(false);
                    setEditingRole(null);
                }}
                onSave={handleSaveRole}
            />
        </div>
    );
}

export default RoleManagementSettings;

