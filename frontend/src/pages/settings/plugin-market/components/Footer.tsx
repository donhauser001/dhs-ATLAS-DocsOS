/**
 * Footer - 页脚组件
 */

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PluginType } from '../types';

interface FooterProps {
    activePluginType: PluginType;
}

export function Footer({ activePluginType }: FooterProps) {
    return (
        <div className="p-3 border-t bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
            <span>
                {activePluginType === 'type-package' && '类型包安装后，可在新建文档时选择对应类型'}
                {activePluginType === 'theme-package' && '主题包安装后，可在设置中切换界面主题'}
                {activePluginType === 'other' && '插件安装后，相关功能将自动启用'}
            </span>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                了解如何创建插件
            </Button>
        </div>
    );
}

export default Footer;

