/**
 * IconComponents - 图标组件映射
 * 
 * 提供详情视图中常用的图标组件映射
 */

import * as LucideIcons from 'lucide-react';

// 动态获取 Lucide 图标组件
export function getLucideIcon(name: string | undefined): React.ComponentType<{ className?: string; size?: number }> | null {
    if (!name) return null;
    const pascalCase = name
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
    return (LucideIcons as Record<string, unknown>)[pascalCase] as React.ComponentType<{ className?: string; size?: number }> | null;
}

// 图标组件映射
export const IconComponents: Record<string, React.ElementType> = {
    building: LucideIcons.Building2,
    phone: LucideIcons.Phone,
    briefcase: LucideIcons.Briefcase,
    'clipboard-list': LucideIcons.ClipboardList,
    'file-text': LucideIcons.FileText,
    user: LucideIcons.User,
    calendar: LucideIcons.Calendar,
    mail: LucideIcons.Mail,
    globe: LucideIcons.Globe,
    dollar: LucideIcons.DollarSign,
    'shield-check': LucideIcons.ShieldCheck,
    file: LucideIcons.FileText,
    image: LucideIcons.Image,
    tag: LucideIcons.Tag,
    tags: LucideIcons.Tags,
    key: LucideIcons.Key,
    lock: LucideIcons.Lock,
};

// 导出常用图标
export {
    LucideIcons,
};
