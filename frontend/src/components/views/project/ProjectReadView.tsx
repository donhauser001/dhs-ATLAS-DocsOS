/**
 * ProjectReadView - 项目阅读视图
 * 
 * 展示项目看板和时间线
 */

import { useMemo } from 'react';
import { 
  FolderKanban, Calendar, Clock, User, Users, 
  CheckCircle2, Circle, AlertCircle, Target, 
  ChevronRight, Link2
} from 'lucide-react';
import type { ViewProps } from '@/registry/types';
import { cn } from '@/lib/utils';

export function ProjectReadView({ document, onViewModeChange }: ViewProps) {
  // 解析项目数据
  const projectData = useMemo(() => {
    const block = document.blocks[0];
    const machine = block?.machine || {};
    const frontmatter = document.frontmatter || {};

    return {
      // 基本信息
      id: machine.id as string || '',
      displayName: machine.display_name as string || machine.title as string || '',
      status: machine.status as string || 'planning',
      priority: machine.priority as string || 'medium',

      // 时间信息
      startDate: machine.start_date as string || '',
      endDate: machine.end_date as string || '',
      deadline: machine.deadline as string || '',

      // 关联信息
      client: machine.client as string || '',
      manager: machine.manager as string || '',
      team: machine.team as string[] || [],

      // 进度
      progress: machine.progress as number || 0,
      milestones: machine.milestones as Array<{
        name: string;
        date: string;
        status: string;
      }> || [],
      tasks: machine.tasks as Array<{
        name: string;
        status: string;
        assignee?: string;
      }> || [],

      // 标签
      tags: machine.tags as string[] || [],

      // 元数据
      created: frontmatter.created as string || '',
      updated: frontmatter.updated as string || '',

      // 描述
      description: block?.body || '',
    };
  }, [document]);

  // 状态配置
  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    planning: { label: '规划中', color: 'bg-slate-100 text-slate-700', icon: <Circle className="w-4 h-4" /> },
    active: { label: '进行中', color: 'bg-blue-100 text-blue-700', icon: <Clock className="w-4 h-4" /> },
    paused: { label: '已暂停', color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle className="w-4 h-4" /> },
    completed: { label: '已完成', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-4 h-4" /> },
    cancelled: { label: '已取消', color: 'bg-red-100 text-red-700', icon: <AlertCircle className="w-4 h-4" /> },
  };

  const priorityConfig: Record<string, { label: string; color: string }> = {
    low: { label: '低', color: 'text-slate-500' },
    medium: { label: '中', color: 'text-blue-500' },
    high: { label: '高', color: 'text-orange-500' },
    urgent: { label: '紧急', color: 'text-red-500' },
  };

  const status = statusConfig[projectData.status] || statusConfig.planning;
  const priority = priorityConfig[projectData.priority] || priorityConfig.medium;

  // 计算进度
  const progressPercent = projectData.progress;

  return (
    <div className="project-read-view p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 项目头部 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{projectData.displayName}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className={cn('px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5', status.color)}>
                    {status.icon}
                    {status.label}
                  </span>
                  <span className={cn('text-sm font-medium', priority.color)}>
                    优先级: {priority.label}
                  </span>
                </div>
              </div>
            </div>

            {/* 进度环 */}
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="#e2e8f0"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="#6366f1"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - progressPercent / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-slate-900">{progressPercent}%</span>
              </div>
            </div>
          </div>

          {/* 项目信息 */}
          <div className="grid md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            {projectData.client && (
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">客户</div>
                  <div className="font-medium text-sm">{projectData.client}</div>
                </div>
              </div>
            )}
            {projectData.manager && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">负责人</div>
                  <div className="font-medium text-sm">{projectData.manager}</div>
                </div>
              </div>
            )}
            {projectData.startDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">开始日期</div>
                  <div className="font-medium text-sm">{projectData.startDate}</div>
                </div>
              </div>
            )}
            {projectData.deadline && (
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">截止日期</div>
                  <div className="font-medium text-sm">{projectData.deadline}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 里程碑 */}
        {projectData.milestones.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-slate-400" />
              里程碑
            </h2>
            <div className="space-y-3">
              {projectData.milestones.map((milestone, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
                >
                  {milestone.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{milestone.name}</div>
                  </div>
                  <div className="text-sm text-slate-500">{milestone.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 任务列表 */}
        {projectData.tasks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-slate-400" />
              任务
            </h2>
            <div className="space-y-2">
              {projectData.tasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {task.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : task.status === 'in_progress' ? (
                    <Clock className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                  <span className={cn('flex-1', task.status === 'done' && 'text-slate-400 line-through')}>
                    {task.name}
                  </span>
                  {task.assignee && (
                    <span className="text-sm text-slate-500">{task.assignee}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 团队成员 */}
        {projectData.team.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              团队成员
            </h2>
            <div className="flex flex-wrap gap-3">
              {projectData.team.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg"
                >
                  <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="font-medium text-sm">{member}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 项目描述 */}
        {projectData.description && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">项目描述</h2>
            <div className="prose prose-slate max-w-none">
              {projectData.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectReadView;

