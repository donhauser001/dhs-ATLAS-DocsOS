/**
 * ClientReadView - 客户阅读视图
 * 
 * 展示客户信息卡片和关联项目
 */

import { useMemo } from 'react';
import { 
  Building2, User, Mail, Phone, MapPin, Globe, 
  Calendar, Briefcase, FileText, ExternalLink
} from 'lucide-react';
import type { ViewProps } from '@/registry/types';
import { cn } from '@/lib/utils';

export function ClientReadView({ document, onViewModeChange }: ViewProps) {
  // 解析客户数据
  const clientData = useMemo(() => {
    const block = document.blocks[0];
    const machine = block?.machine || {};
    const frontmatter = document.frontmatter || {};

    return {
      // 基本信息
      id: machine.id as string || '',
      displayName: machine.display_name as string || machine.title as string || '',
      status: machine.status as string || 'active',
      type: machine.client_type as string || 'company',

      // 联系信息
      contact: {
        name: machine.contact?.name as string || '',
        email: machine.contact?.email as string || '',
        phone: machine.contact?.phone as string || '',
        position: machine.contact?.position as string || '',
      },

      // 公司信息
      company: {
        name: machine.company?.name as string || machine.display_name as string || '',
        address: machine.company?.address as string || '',
        website: machine.company?.website as string || '',
        industry: machine.company?.industry as string || '',
      },

      // 业务信息
      business: {
        source: machine.source as string || '',
        manager: machine.manager as string || '',
        projects: machine.projects as string[] || [],
        tags: machine.tags as string[] || [],
      },

      // 元数据
      created: frontmatter.created as string || '',
      updated: frontmatter.updated as string || '',
      author: frontmatter.author as string || '',

      // 备注
      notes: block?.body || '',
    };
  }, [document]);

  // 状态颜色
  const statusColor = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-700',
    potential: 'bg-blue-100 text-blue-700',
    lost: 'bg-red-100 text-red-700',
  }[clientData.status] || 'bg-gray-100 text-gray-700';

  const statusLabel = {
    active: '活跃',
    inactive: '休眠',
    potential: '潜在',
    lost: '流失',
  }[clientData.status] || clientData.status;

  return (
    <div className="client-read-view p-6">
      {/* 客户卡片 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{clientData.displayName}</h1>
                <p className="text-blue-100 mt-1">{clientData.company.industry || '未分类'}</p>
              </div>
            </div>
            <span className={cn('px-3 py-1 rounded-full text-sm font-medium', statusColor)}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 联系人信息 */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" />
              联系人
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {clientData.contact.name && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">姓名</div>
                    <div className="font-medium">{clientData.contact.name}</div>
                    {clientData.contact.position && (
                      <div className="text-xs text-slate-400">{clientData.contact.position}</div>
                    )}
                  </div>
                </div>
              )}
              {clientData.contact.email && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">邮箱</div>
                    <a href={`mailto:${clientData.contact.email}`} className="font-medium text-blue-600 hover:underline">
                      {clientData.contact.email}
                    </a>
                  </div>
                </div>
              )}
              {clientData.contact.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">电话</div>
                    <a href={`tel:${clientData.contact.phone}`} className="font-medium">
                      {clientData.contact.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 公司信息 */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-400" />
              公司信息
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {clientData.company.address && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">地址</div>
                    <div className="font-medium">{clientData.company.address}</div>
                  </div>
                </div>
              )}
              {clientData.company.website && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">网站</div>
                    <a 
                      href={clientData.company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {clientData.company.website}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 业务信息 */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-slate-400" />
              业务信息
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {clientData.business.source && (
                <div>
                  <div className="text-sm text-slate-500">客户来源</div>
                  <div className="font-medium">{clientData.business.source}</div>
                </div>
              )}
              {clientData.business.manager && (
                <div>
                  <div className="text-sm text-slate-500">客户经理</div>
                  <div className="font-medium">{clientData.business.manager}</div>
                </div>
              )}
            </div>

            {/* 标签 */}
            {clientData.business.tags.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-slate-500 mb-2">标签</div>
                <div className="flex flex-wrap gap-2">
                  {clientData.business.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 备注 */}
          {clientData.notes && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                备注
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                {clientData.notes}
              </div>
            </section>
          )}

          {/* 元数据 */}
          <section className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-6 text-sm text-slate-400">
              {clientData.created && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  创建于 {clientData.created}
                </span>
              )}
              {clientData.updated && (
                <span>更新于 {clientData.updated}</span>
              )}
              <span className="font-mono text-xs">{clientData.id}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ClientReadView;

