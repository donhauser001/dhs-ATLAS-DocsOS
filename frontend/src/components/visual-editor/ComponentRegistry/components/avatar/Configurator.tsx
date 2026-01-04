/**
 * Avatar 组件 - 配置表单
 */

import { ConfiguratorProps, AvatarComponentDefinition } from '../../types';
import { FolderPicker } from '../../shared/FolderPicker';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const avatarData = formData as AvatarComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    存储目录
                </label>
                <FolderPicker
                    value={avatarData.directory || '/avatars'}
                    onChange={(path) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            directory: path || '/avatars',
                        }))
                    }
                    placeholder="选择头像存储目录"
                />
                <p className="mt-1 text-xs text-slate-500">
                    头像将保存到此目录
                </p>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    最大文件大小 (KB)
                </label>
                <input
                    type="number"
                    value={avatarData.maxSize || 2048}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            maxSize: parseInt(e.target.value) || 2048,
                        }))
                    }
                    min={100}
                    max={10240}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                />
                <p className="mt-1 text-xs text-slate-500">建议不超过 2MB (2048KB)</p>
            </div>
        </div>
    );
}

export default Configurator;

