import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useProjects } from '@/hooks/useQuery'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  Plus,
  Search,
  Calendar,
  User,
  FolderKanban,
  Loader,
} from 'lucide-react'

export function ProjectList() {
  const { data, isLoading, error } = useProjects()
  const [search, setSearch] = useState('')

  usePageTitle('项目管理', `共 ${data?.total || 0} 个项目`)

  const projects = data?.projects || []
  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索项目..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            新建项目
          </Link>
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">加载失败</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">暂无项目</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium line-clamp-1">
                        {project.name}
                      </h3>
                      <Badge variant={getStatusVariant(project.status)}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {project.client}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {project.deadline}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
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
