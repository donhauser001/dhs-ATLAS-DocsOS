/**
 * UserPicker 组件 - 数据块控件
 */

import { useState, useEffect, useCallback } from 'react';
import { User, Search, X, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, UserPickerComponentDefinition } from '../../types';

interface UserInfo {
    id: string;
    display_name: string;
    avatar?: string;
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const userDef = component as UserPickerComponentDefinition;
    const [showPicker, setShowPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [loading, setLoading] = useState(false);

    const stringValue = typeof value === 'string' ? value : '';
    const arrayValue = Array.isArray(value) ? value : stringValue ? [stringValue] : [];

    // 获取用户列表
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/principals');
            if (response.ok) {
                const data = await response.json();
                setUsers(data.principals || []);
            }
        } catch (error) {
            console.error('获取用户列表失败:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (showPicker) {
            fetchUsers();
        }
    }, [showPicker, fetchUsers]);

    // 过滤用户
    const filteredUsers = users.filter(user => {
        if (!searchQuery) return true;
        return user.display_name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleSelect = (user: UserInfo) => {
        if (userDef.multiple) {
            const newValue = arrayValue.includes(user.id)
                ? arrayValue.filter(id => id !== user.id)
                : [...arrayValue, user.id];
            onChange(newValue.length > 0 ? newValue : null);
        } else {
            onChange(user.id);
            setShowPicker(false);
        }
    };

    const handleRemove = (userId: string) => {
        if (userDef.multiple) {
            const newValue = arrayValue.filter(id => id !== userId);
            onChange(newValue.length > 0 ? newValue : null);
        } else {
            onChange(null);
        }
    };

    const getUserName = (userId: string): string => {
        const user = users.find(u => u.id === userId);
        return user?.display_name || userId;
    };

    return (
        <div className="space-y-2">
            {/* 已选用户 */}
            {arrayValue.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {arrayValue.map((userId) => (
                        <div
                            key={userId}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg"
                        >
                            {userDef.showAvatar !== false && (
                                <UserCircle className="h-4 w-4 text-green-500" />
                            )}
                            <span className="text-sm text-slate-700">
                                {getUserName(userId)}
                            </span>
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => handleRemove(userId)}
                                    className="p-0.5 text-slate-400 hover:text-red-500"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 选择按钮 */}
            {!disabled && (userDef.multiple || arrayValue.length === 0) && (
                <button
                    type="button"
                    onClick={() => setShowPicker(true)}
                    className={cn(
                        'flex items-center gap-2 px-3 py-2 text-sm',
                        'border border-dashed border-slate-300 rounded-lg',
                        'hover:border-green-300 hover:bg-green-50/50 transition-colors',
                        'text-slate-500'
                    )}
                >
                    <User className="h-4 w-4" />
                    选择用户...
                </button>
            )}

            {/* 用户选择面板 */}
            {showPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                    <div className="w-80 max-h-[80vh] bg-white rounded-lg shadow-xl border border-slate-200">
                        <div className="p-4 border-b border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-medium text-slate-800">选择用户</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowPicker(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="搜索用户..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg
                                        focus:outline-none focus:ring-2 focus:ring-green-400/50"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto">
                            {loading ? (
                                <p className="p-4 text-center text-sm text-slate-400">加载中...</p>
                            ) : filteredUsers.length === 0 ? (
                                <p className="p-4 text-center text-sm text-slate-400">未找到用户</p>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {filteredUsers.map((user) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => handleSelect(user)}
                                            className={cn(
                                                'w-full p-3 text-left hover:bg-slate-50 transition-colors',
                                                'flex items-center gap-3',
                                                arrayValue.includes(user.id) && 'bg-green-50'
                                            )}
                                        >
                                            <UserCircle className="h-8 w-8 text-slate-300" />
                                            <span className="text-sm font-medium text-slate-700">
                                                {user.display_name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Control;


