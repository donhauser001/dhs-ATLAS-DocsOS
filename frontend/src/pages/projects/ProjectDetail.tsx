import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useProject, useProjectTasks } from '@/hooks/useQuery'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  ArrowLeft,
  Calendar,
  User,
  Users,
  DollarSign,
  ClipboardList,
  Plus,
  Loader,
  Circle,
  Play,
  Eye,
  CheckCircle,
} from 'lucide-react'

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: project, isLoading, error } = useProject(id!)
  const { data: tasksData } = useProjectTasks(id!)
  
  usePageTitle(project?.name || '项目详情', project?.client)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="py-12 text-center text-destructive">
        {error?.message || '项目不存在'}
      </div>
    )
  }

  const tasks = tasksData?.tasks || []
  const tasksByStatus = {
    pending: tasks.filter((t) => t.status === 'pending'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    review: tasks.filter((t) => t.status === 'review'),
    done: tasks.filter((t) => t.status === 'done'),
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(project.status)}>
            {getStatusLabel(project.status)}
          </Badge>
          <Button variant="outline">编辑项目</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">项目信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">客户</div>
                <div className="font-medium">{project.client}</div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">负责人</div>
                <div className="font-medium">{project.manager}</div>
              </div>
            </div>

            {project.team.length > 0 && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">团队成员</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.team.map((member) => (
                        <Badge key={member} variant="secondary">
                          {member}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {project.deadline && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">截止日期</div>
                    <div className="font-medium">{project.deadline}</div>
                  </div>
                </div>
              </>
            )}

            {project.budget && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">预算</div>
                    <div className="font-medium">
                      ¥{project.budget.toLocaleString()}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" />
              任务 ({tasksData?.total || 0})
            </CardTitle>
            <Button size="sm">
              <Plus className="mr-1 h-3.5 w-3.5" />
              新建任务
            </Button>
          </CardHeader>
          <CardContent>
            {/* Task Board */}
            <div className="grid grid-cols-4 gap-4">
              {/* Pending */}
              <TaskColumn
                title="待开始"
                icon={Circle}
                color="gray"
                tasks={tasksByStatus.pending}
              />
              {/* In Progress */}
              <TaskColumn
                title="进行中"
                icon={Play}
                color="blue"
                tasks={tasksByStatus.in_progress}
              />
              {/* Review */}
              <TaskColumn
                title="待审核"
                icon={Eye}
                color="orange"
                tasks={tasksByStatus.review}
              />
              {/* Done */}
              <TaskColumn
                title="已完成"
                icon={CheckCircle}
                color="green"
                tasks={tasksByStatus.done}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface TaskColumnProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  tasks: Array<{
    id: string
    title: string
    assignee: string
    priority: string
    deadline?: string
  }>
}

function TaskColumn({ title, icon: Icon, color, tasks }: TaskColumnProps) {
  const colorClasses: Record<string, string> = {
    gray: 'text-slate-500',
    blue: 'text-blue-500',
    orange: 'text-orange-500',
    green: 'text-green-500',
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
        <span>{title}</span>
        <span className="text-muted-foreground">({tasks.length})</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-2xl border bg-card p-3 text-sm shadow-sm"
          >
            <div className="font-medium line-clamp-2">{task.title}</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{task.assignee}</span>
              {task.deadline && (
                <>
                  <span>·</span>
                  <span>{task.deadline}</span>
                </>
              )}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="rounded-2xl border border-dashed p-3 text-center text-xs text-muted-foreground">
            暂无任务
          </div>
        )}
      </div>
    </div>
  )
}

function getStatusVariant(status: string) {
  const map: Record<string, 'gray' | 'blue' | 'green' | 'red'> = {
    pending: 'gray',
    in_progress: 'blue',
    completed: 'green',
    cancelled: 'red',
  }
  return map[status] || 'gray'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待启动',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

