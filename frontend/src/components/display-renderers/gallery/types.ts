import type { AtlasDataBlock, DataItem, SelectOption } from '../list/types';

export interface GalleryItem extends DataItem {
    title?: string;
    cover?: string;
    category?: string;
    categoryOption?: SelectOption;
    author?: string;
    date?: string;
    tags?: string[];
    likes?: number;
    description?: string;
}

export interface GalleryRendererProps {
    bodyContent: string;
    frontmatter: Record<string, unknown>;
    documentPath: string;
    readonly?: boolean;
}

// 解析画廊数据
export function parseGalleryData(dataBlock: AtlasDataBlock): GalleryItem[] {
    const { data, schema } = dataBlock;
    const categorySchema = schema.find(s => s.key === 'category');
    const categoryOptions = categorySchema?.options || [];

    return data.map(item => ({
        ...item,
        categoryOption: categoryOptions.find(opt => opt.value === item.category),
    })) as GalleryItem[];
}

// 获取分类颜色
export function getCategoryColor(color?: string): { bg: string; text: string; border: string } {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
        green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
        red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
        gray: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
    };
    return colors[color || 'gray'] || colors.gray;
}

// 按分类分组
export function groupByCategory(items: GalleryItem[]): Map<string, GalleryItem[]> {
    const grouped = new Map<string, GalleryItem[]>();
    
    items.forEach(item => {
        const category = item.categoryOption?.label || item.category || '未分类';
        if (!grouped.has(category)) {
            grouped.set(category, []);
        }
        grouped.get(category)!.push(item);
    });
    
    return grouped;
}

// 格式化日期
export function formatDate(date?: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

// 格式化数字
export function formatNumber(num?: number): string {
    if (num === undefined) return '0';
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

