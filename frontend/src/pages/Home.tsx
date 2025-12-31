import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useProjects, useUsers } from '@/hooks/useQuery'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  ClipboardList,
  FolderKanban,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'

export function Home() {
  usePageTitle('工作台')
  
  const { data: projectsData, isLoading: projectsLoading } = useProjects()
  const { data: users } = useUsers()

  const stats = projectsData?.projects
    ? {
        total: projectsData.total,
        inProgress: projectsData.projects.filter(p => p.status === 'in_progress').length,
        pending: projectsData.projects.filter(p => p.status === 'pending').length,
        completed: projectsData.projects.filter(p => p.status === 'completed').length,
      }
    : { total: 0, inProgress: 0, pending: 0, completed: 0 }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">项目总数</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projectsLoading ? '-' : stats.total}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进行中</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {projectsLoading ? '-' : stats.inProgress}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待启动</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {projectsLoading ? '-' : stats.pending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {projectsLoading ? '-' : stats.completed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-4 w-4" />
              最近项目
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="text-sm text-muted-foreground">加载中...</div>
            ) : !projectsData?.projects?.length ? (
              <div className="text-sm text-muted-foreground">暂无项目</div>
            ) : (
              <div className="space-y-3">
                {projectsData.projects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-2xl border p-3"
                  >
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {project.client}
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(project.status)}>
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" />
              团队成员
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users?.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无成员</div>
            ) : (
              <div className="space-y-3">
                {users?.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-2xl border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                        {user.name[0]}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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

function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    admin: '管理员',
    member: '成员',
  }
  return map[role] || role
}

