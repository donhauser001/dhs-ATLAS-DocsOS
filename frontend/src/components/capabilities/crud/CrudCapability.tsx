/**
 * CRUD 能力组件
 * 
 * 提供增删改查操作按钮
 */

import { Database } from 'lucide-react';
import { registerCapability } from '../registry';
import type { CapabilityComponentProps } from '../types';

/**
 * CRUD 按钮组件
 */
export function CrudButton({ documentPath, capabilityId }: CapabilityComponentProps) {
    const handleClick = () => {
        // TODO: 实现 CRUD 功能
        console.log(`[${capabilityId}] 打开数据管理面板`, documentPath);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 
                     bg-white border border-slate-200 rounded-lg
                     hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700
                     transition-all duration-150"
        >
            <Database size={14} className="text-slate-500" />
            增删改查
        </button>
    );
}

// 注册能力
registerCapability({
    id: 'crud',
    label: '增删改查',
    icon: 'database',
    description: '提供数据的创建、读取、更新、删除操作',
    renderMode: 'button',
    ButtonComponent: CrudButton,
    order: 10,
});

