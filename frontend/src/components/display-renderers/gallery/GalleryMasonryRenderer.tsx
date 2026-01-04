import React, { useMemo, useState, useEffect, useRef } from 'react';
import { LayoutGrid, Filter, SortAsc } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import { parseAtlasDataBlocks } from '../list/parseAtlasData';
import { GalleryItem, parseGalleryData } from './types';
import { GalleryCard } from './GalleryCard';

// 简单的瀑布流布局计算
function calculateMasonryLayout(items: GalleryItem[], columns: number): GalleryItem[][] {
    const result: GalleryItem[][] = Array.from({ length: columns }, () => []);
    const heights: number[] = Array(columns).fill(0);
    
    items.forEach(item => {
        // 找到最短的列
        const minHeight = Math.min(...heights);
        const columnIndex = heights.indexOf(minHeight);
        
        // 添加到最短列
        result[columnIndex].push(item);
        
        // 模拟高度（根据 id 生成随机高度）
        const randomHeight = 200 + (item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 150);
        heights[columnIndex] += randomHeight;
    });
    
    return result;
}

export const GalleryMasonryRenderer: React.FC<DisplayRendererProps> = ({
    bodyContent,
    frontmatter,
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'date' | 'likes' | 'title'>('date');
    const [columns, setColumns] = useState(4);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // 响应式列数
    useEffect(() => {
        const updateColumns = () => {
            const width = containerRef.current?.offsetWidth || window.innerWidth;
            if (width < 640) setColumns(2);
            else if (width < 1024) setColumns(3);
            else setColumns(4);
        };
        
        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);
    
    // 解析数据
    const dataBlocks = useMemo(() => parseAtlasDataBlocks(bodyContent || ''), [bodyContent]);
    const galleryDataBlock = dataBlocks.find(block => block.type === 'gallery');
    
    const items = useMemo(() => {
        if (!galleryDataBlock) return [];
        return parseGalleryData(galleryDataBlock);
    }, [galleryDataBlock]);
    
    // 获取所有分类
    const categories = useMemo(() => {
        const cats = new Set<string>();
        items.forEach(item => {
            if (item.categoryOption?.label) {
                cats.add(item.categoryOption.label);
            }
        });
        return Array.from(cats);
    }, [items]);
    
    // 过滤和排序
    const filteredItems = useMemo(() => {
        let result = [...items];
        
        if (selectedCategory) {
            result = result.filter(item => item.categoryOption?.label === selectedCategory);
        }
        
        result.sort((a, b) => {
            switch (sortBy) {
                case 'likes':
                    return (b.likes || 0) - (a.likes || 0);
                case 'title':
                    return (a.title || '').localeCompare(b.title || '');
                case 'date':
                default:
                    return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
            }
        });
        
        return result;
    }, [items, selectedCategory, sortBy]);
    
    // 瀑布流布局
    const masonryColumns = useMemo(() => {
        return calculateMasonryLayout(filteredItems, columns);
    }, [filteredItems, columns]);
    
    if (!galleryDataBlock) {
        return (
            <div className="max-w-[1200px] mx-auto px-8 py-6">
                <div className="text-center text-slate-500 py-12">
                    没有找到画廊数据
                </div>
            </div>
        );
    }
    
    return (
        <div className="w-full px-8 py-6" ref={containerRef}>
            {/* 工具栏 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-semibold text-slate-800">瀑布流</h2>
                    <span className="text-sm text-slate-500">({filteredItems.length} 项)</span>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* 分类筛选 */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            value={selectedCategory || ''}
                            onChange={e => setSelectedCategory(e.target.value || null)}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">全部分类</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* 排序 */}
                    <div className="flex items-center gap-2">
                        <SortAsc className="w-4 h-4 text-slate-400" />
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="date">按日期</option>
                            <option value="likes">按热度</option>
                            <option value="title">按名称</option>
                        </select>
                    </div>
                </div>
            </div>
            
            {/* 瀑布流布局 */}
            <div className="flex gap-4">
                {masonryColumns.map((column, colIndex) => (
                    <div key={colIndex} className="flex-1 flex flex-col gap-4">
                        {column.map(item => (
                            <GalleryCard
                                key={item.id}
                                item={item}
                                aspectRatio="auto"
                                showInfo={true}
                                size="md"
                            />
                        ))}
                    </div>
                ))}
            </div>
            
            {filteredItems.length === 0 && (
                <div className="text-center text-slate-500 py-12">
                    没有符合条件的作品
                </div>
            )}
        </div>
    );
};

