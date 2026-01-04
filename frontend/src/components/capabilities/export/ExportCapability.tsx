/**
 * 导出能力组件
 * 
 * 提供文档导出功能
 */

import { Download } from 'lucide-react';
import { registerCapability } from '../registry';
import type { CapabilityComponentProps } from '../types';

/**
 * 导出按钮组件
 */
export function ExportButton({ documentPath, capabilityId }: CapabilityComponentProps) {
    const handleClick = () => {
        // TODO: 实现导出功能
        console.log(`[${capabilityId}] 导出文档`, documentPath);
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
            <Download size={14} className="text-slate-500" />
            导出
        </button>
    );
}

// 注册能力
registerCapability({
    id: 'export',
    label: '导出',
    icon: 'download',
    description: '将文档导出为其他格式',
    renderMode: 'button',
    ButtonComponent: ExportButton,
    order: 20,
});

