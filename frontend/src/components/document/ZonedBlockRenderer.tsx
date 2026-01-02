/**
 * ZonedBlockRenderer - 分区渲染器
 * 
 * Phase 3.5: 渲染分区系统
 * 
 * 将 Block 渲染为三个区域：
 * - Hero Zone: 标题、状态、核心身份
 * - Body Zone: 业务字段、Human Zone
 * - Footer Zone: 元数据（默认折叠）
 */

import { useMemo } from 'react';
import { useCategorizedFields, useZoneConfig } from '@/hooks/useDisplayConfig';
import { HeroZone } from './HeroZone';
import { BodyZone } from './BodyZone';
import { FooterZone } from './FooterZone';
import type { Block } from '@/api/adl';

interface ZonedBlockRendererProps {
  /** Block 数据 */
  block: Block;
  /** 文档 frontmatter */
  frontmatter?: Record<string, unknown>;
  /** 实体类型（用于获取特定配置） */
  entityType?: string;
}

export function ZonedBlockRenderer({
  block,
  frontmatter = {},
  entityType,
}: ZonedBlockRendererProps) {
  const { machine, body, anchor, heading } = block;
  
  // 确定实体类型
  const type = entityType || (machine?.type as string);
  
  // 获取分区配置
  const { zones, loading: configLoading } = useZoneConfig(type);
  
  // 分类字段
  const { categorized, loading: categorizeLoading } = useCategorizedFields(
    machine || {},
    frontmatter,
    type
  );
  
  // 提取标题
  const title = useMemo(() => {
    return (
      (machine?.title as string) ||
      (machine?.display_name as string) ||
      heading?.replace(/^#+\s*/, '').replace(/\s*\{#.*\}$/, '') ||
      'Untitled'
    );
  }, [machine, heading]);
  
  // 加载中状态
  if (configLoading || categorizeLoading || !categorized) {
    return (
      <article className="bg-white rounded-lg border border-slate-200 overflow-hidden animate-pulse">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded w-2/3" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
          </div>
        </div>
      </article>
    );
  }
  
  // 过滤 Hero 字段（排除已在 HeroZone 组件中直接使用的字段）
  const heroFieldsFiltered = categorized.heroFields.filter(
    f => !['title', 'display_name', 'status'].includes(f.key)
  );
  
  return (
    <article className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
      {/* Hero Zone */}
      <HeroZone
        title={title}
        status={machine?.status as string}
        type={type}
        fields={heroFieldsFiltered}
        showStatusBadge={zones?.hero.showStatusBadge ?? true}
        id={machine?.id as string}
        anchor={anchor}
      />
      
      {/* Body Zone */}
      <BodyZone
        fields={categorized.bodyFields}
        body={body}
      />
      
      {/* Footer Zone */}
      <FooterZone
        fields={categorized.footerFields}
        defaultCollapsed={zones?.footer.defaultCollapsed ?? true}
        showToggle={zones?.footer.showToggle ?? true}
      />
    </article>
  );
}

/**
 * 简化版本：用于快速渲染（不使用 API 获取配置）
 */
export function ZonedBlockRendererSimple({
  block,
  frontmatter = {},
}: {
  block: Block;
  frontmatter?: Record<string, unknown>;
}) {
  const { machine, body, anchor, heading } = block;
  
  // 简单分类
  const categorized = useMemo(() => {
    const heroKeys = ['title', 'display_name', 'status'];
    const footerKeys = ['created', 'updated', 'author', 'version', 'document_type'];
    const excludeKeys = ['type', 'id', '$display', ...heroKeys, ...footerKeys];
    
    const heroFields: Array<{ key: string; value: unknown }> = [];
    const bodyFields: Array<{ key: string; value: unknown }> = [];
    const footerFields: Array<{ key: string; value: unknown }> = [];
    
    // Hero 字段（从 machine）
    for (const key of heroKeys) {
      if (machine?.[key] !== undefined) {
        heroFields.push({ key, value: machine[key] });
      }
    }
    
    // Footer 字段（从 frontmatter）
    for (const key of footerKeys) {
      if (frontmatter[key] !== undefined) {
        footerFields.push({ key, value: frontmatter[key] });
      }
    }
    
    // Body 字段（排除 Hero、Footer 和系统字段）
    if (machine) {
      for (const [key, value] of Object.entries(machine)) {
        if (
          !excludeKeys.includes(key) &&
          !key.startsWith('_') &&
          !key.startsWith('$')
        ) {
          bodyFields.push({ key, value });
        }
      }
    }
    
    return { heroFields, bodyFields, footerFields };
  }, [machine, frontmatter]);
  
  const title =
    (machine?.title as string) ||
    (machine?.display_name as string) ||
    heading?.replace(/^#+\s*/, '').replace(/\s*\{#.*\}$/, '') ||
    'Untitled';
  
  return (
    <article className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
      <HeroZone
        title={title}
        status={machine?.status as string}
        type={machine?.type as string}
        fields={categorized.heroFields.filter(
          f => !['title', 'display_name', 'status'].includes(f.key)
        )}
        showStatusBadge={true}
        id={machine?.id as string}
        anchor={anchor}
      />
      
      <BodyZone
        fields={categorized.bodyFields}
        body={body}
      />
      
      <FooterZone
        fields={categorized.footerFields}
        defaultCollapsed={true}
        showToggle={true}
      />
    </article>
  );
}

export default ZonedBlockRenderer;

