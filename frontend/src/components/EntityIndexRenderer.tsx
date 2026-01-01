/**
 * EntityIndexRenderer - 实体索引渲染器
 * 
 * Phase 3.2: 关系型文档
 * 
 * 渲染 entity_index 类型的 Block，自动解析引用并显示实体列表
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resolveRefs, type ResolvedEntity } from '@/api/adl';
import { User, Mail, Phone, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

interface EntityIndexRendererProps {
  entries: Array<{ ref: string }>;
  entityType: string;
  title?: string;
}

export function EntityIndexRenderer({ entries, entityType, title }: EntityIndexRendererProps) {
  const [entities, setEntities] = useState<ResolvedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEntities() {
      if (!entries || entries.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await resolveRefs(entries);
        setEntities(result.entities);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadEntities();
  }, [entries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-500">加载实体列表...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-lg">
        <AlertCircle className="w-5 h-5" />
        <span>加载失败: {error}</span>
      </div>
    );
  }

  if (entities.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>暂无{entityType === 'principal' ? '用户' : '实体'}数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title && (
        <div className="text-sm text-slate-500 mb-4">
          共 {entities.filter(e => e.resolved).length} 个{entityType === 'principal' ? '用户' : '实体'}
        </div>
      )}
      
      {entities.map((entity, index) => (
        <EntityCard key={entity.ref || index} entity={entity} entityType={entityType} />
      ))}
    </div>
  );
}

interface EntityCardProps {
  entity: ResolvedEntity;
  entityType: string;
}

function EntityCard({ entity }: EntityCardProps) {
  if (!entity.resolved || !entity.data) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">无法解析: {entity.ref}</span>
        </div>
        {entity.error && (
          <p className="text-xs text-red-500 mt-1">{entity.error}</p>
        )}
      </div>
    );
  }

  const { data } = entity;
  const displayName = data.display_name || data.title || data.id;
  const emails = data.identity?.emails || [];
  const phones = data.identity?.phones || [];

  // 构建文档链接
  const documentLink = `/workspace/${data.documentPath}`;

  return (
    <Link 
      to={documentLink}
      className="block p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all bg-white group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-indigo-600" />
          </div>
          
          {/* Info */}
          <div>
            <div className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
              {displayName}
            </div>
            
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
              {emails.length > 0 && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{emails[0]}</span>
                </div>
              )}
              
              {phones.length > 0 && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{phones[0]}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Status badge */}
          <span className={`
            px-2 py-0.5 text-xs font-medium rounded
            ${data.status === 'active' 
              ? 'bg-green-100 text-green-700' 
              : data.status === 'draft' 
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-slate-100 text-slate-600'
            }
          `}>
            {data.status === 'active' ? '活跃' : data.status === 'draft' ? '草稿' : data.status}
          </span>
          
          {/* Link indicator */}
          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        </div>
      </div>
    </Link>
  );
}

export default EntityIndexRenderer;

