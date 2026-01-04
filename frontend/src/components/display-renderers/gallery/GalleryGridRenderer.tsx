import React, { useMemo, useState } from 'react';
import { Grid3X3, Filter, SortAsc } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import { parseAtlasDataBlocks } from '../list/parseAtlasData';
import { GalleryItem, parseGalleryData, GalleryRendererProps } from './types';
import { GalleryCard } from './GalleryCard';

export const GalleryGridRenderer: React.FC<DisplayRendererProps> = ({
    bodyContent,
    frontmatter,
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'date' | 'likes' | 'title'>('date');
    
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
        
        // 过滤分类
        if (selectedCategory) {
            result = result.filter(item => item.categoryOption?.label === selectedCategory);
        }
        
        // 排序
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
        <div className="w-full px-8 py-6">
            {/* 工具栏 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Grid3X3 className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-semibold text-slate-800">网格画廊</h2>
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
            
            {/* 网格 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map(item => (
                    <GalleryCard
                        key={item.id}
                        item={item}
                        aspectRatio="square"
                        showInfo={true}
                        size="md"
                    />
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

